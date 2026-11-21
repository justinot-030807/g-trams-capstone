const mongoose = require('mongoose');
const Franchise = require('../models/franchiseModel');
const User = require('../models/userModel');
const TodaSubmission = require('../models/todaSubmission');
const Violation = require('../models/violationModel');
const PaymentLedger = require('../models/paymentLedgerModel');
const { computeManilaExpiryDate, getManilaNow, getManilaDateString, isExpired } = require('../utils/phTime');
const { logAudit } = require('../utils/auditLogger');
const Notification = require('../models/notificationModel');
const { emitToUser } = require('../config/socket');
const { sendPushToUser } = require('../services/pushService');
const FranchiseService = require('../services/franchiseService');
const { isNameMatch } = require('../utils/nameMatcher');
const { validateTodaJurisdiction, TODA_DIRECTORY } = require('../utils/todaDirectory');

const escapeRegex = (s) => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function collectExistingDocumentUrls(franchise) {
    const allowed = new Set();
    if (!franchise) return allowed;
    for (const field of FranchiseService.DOCUMENT_URL_FIELDS) {
        const val = franchise[field];
        if (val && typeof val === 'string' && val.trim()) {
            allowed.add(val.trim());
        }
    }
    if (franchise.evidenceUrl && typeof franchise.evidenceUrl === 'string' && franchise.evidenceUrl.trim()) {
        allowed.add(franchise.evidenceUrl.trim());
    }
    if (franchise.cancellationDetails?.letterUrl && typeof franchise.cancellationDetails.letterUrl === 'string' && franchise.cancellationDetails.letterUrl.trim()) {
        allowed.add(franchise.cancellationDetails.letterUrl.trim());
    }
    return allowed;
}

function validateDocumentExpiryDate(rawVal, now = getManilaNow()) {
    const str = String(rawVal || '').trim();
    const parsed = new Date(str);
    if (Number.isNaN(parsed.getTime())) {
        return { invalid: true, expired: false, date: null };
    }
    // For date-only YYYY-MM-DD strings, treat validity through 23:59:59.999 Asia/Manila
    const effectiveDate = /^\d{4}-\d{2}-\d{2}$/.test(str)
        ? new Date(`${str}T23:59:59.999+08:00`)
        : parsed;
    return { invalid: false, expired: isExpired(effectiveDate, now), date: parsed };
}

/**
 * M10: Canonical sequential MTOP number generator with atomic conditional update & duplicate retry.
 * Only retries on mtopNo unique index collisions (never masks officialReceiptNo duplicates).
 */
async function executeAtomicUpdateWithMtop(filter, baseSetFields, { populateOperator = 'name address contact', maxRetries = 50 } = {}) {
    const manilaDateStr = getManilaDateString(getManilaNow());
    const currentYear = manilaDateStr ? manilaDateStr.slice(0, 4) : String(new Date().getFullYear());
    const yearPrefix = `${currentYear}-`;
    let lastErr = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const existingMtops = await Franchise.find({ mtopNo: { $regex: `^${yearPrefix}\\d+$` } })
                .select('mtopNo')
                .lean();
            const seqNumbers = (Array.isArray(existingMtops) ? existingMtops : [])
                .map(doc => parseInt(String(doc.mtopNo || '').replace(yearPrefix, ''), 10))
                .filter(num => Number.isFinite(num) && num > 0);
            const maxSeq = seqNumbers.length > 0 ? Math.max(...seqNumbers) : 0;
            const nextSeq = maxSeq + 1;
            const candidateMtopNo = `${yearPrefix}${String(nextSeq).padStart(3, '0')}`;

            const query = Franchise.findOneAndUpdate(
                filter,
                { $set: { ...baseSetFields, mtopNo: candidateMtopNo } },
                { returnDocument: 'after' }
            );
            return populateOperator ? await query.populate('operator', populateOperator) : await query;
        } catch (err) {
            lastErr = err;
            const isMtopDuplicate = err && err.code === 11000 && (
                (err.keyPattern && err.keyPattern.mtopNo) ||
                String(err.message || '').includes('mtopNo')
            );
            if (isMtopDuplicate && attempt < maxRetries - 1) {
                continue;
            }
            throw err;
        }
    }

    throw lastErr;
}

const CASHIER_FRANCHISE_FIELDS = [
    '_id', 'fullName', 'plateNo', 'motorNo', 'chassisNo', 'todaName', 'applicationType', 'mtopNo',
    'status', 'paymentStatus', 'officialReceiptNo', 'payerName', 'amountPaid', 'paymentMethod',
    'paymentDate', 'paymentRemarks', 'cashierName', 'operator', 'createdAt', 'updatedAt'
];
const CASHIER_FRANCHISE_PROJECTION = CASHIER_FRANCHISE_FIELDS.join(' ');

const PAYABLE_PREDICATE = {
    status: 'For Payment',
    paymentStatus: { $ne: 'Paid' },
    isArchived: { $ne: true }
};

const OPERATOR_EDITABLE_FIELDS = new Set([
    'fullName', 'address', 'zone', 'made', 'make', 'motorNo', 'chassisNo', 'plateNo',
    'todaName', 'bodyNumber', 'numberOfUnits',
    'orCrUrl', 'crUrl', 'orUrl', 'licenseUrl', 'licenseBackUrl',
    'todaEndorsementUrl', 'brgyClearanceUrl', 'cedulaUrl',
    'orCrNo', 'orNo', 'orCrExpiryDate', 'crNo', 'orDate', 'crDate',
    'color', 'series', 'yearModel', 'fileNo', 'vehicleType', 'vehicleCategory',
    'classification', 'bodyType', 'displacement', 'grossWeight', 'fuelType',
    'passengerCapacity', 'registeredOwner', 'ownerAddress',
    'isOperatorDriver', 'driverName', 'driverContact', 'driverLicenseNo',
    'driverLicenseSerialNo', 'driverLicenseExpiryDate', 'driverDob',
    'driverDlCodes', 'driverConditions', 'driverAddress', 'driverNationality', 'driverSex',
    'todaCertNo', 'todaCertDate', 'todaSignatory',
    'brgyClearanceNo', 'brgyClearanceDate', 'brgyIssuer',
    'cedulaDate', 'cedulaAddress', 'cedulaSerialNo', 'cedulaAmount', 'cedulaYear',
    'cedulaPlaceIssued', 'cedulaFullName', 'cedulaCitizenship', 'cedulaCivilStatus',
    'cedulaProfession', 'cedulaDob', 'cedulaPlaceOfBirth', 'cedulaSex',
    'cedulaHeight', 'cedulaWeight', 'cedulaTin', 'cedulaDetails',
    'aiScannedData', 'aiDiscrepancies'
]);

const BPLO_EDITABLE_FIELDS = new Set([
    ...OPERATOR_EDITABLE_FIELDS,
    'aiVerification'
]);

const ALLOWED_STATUS_TRANSITIONS = {
    'Pending': ['For Payment', 'For Signing', 'Cancelled'],
    'Pending for Approval': ['Pending', 'For Payment', 'For Signing', 'Cancelled'],
    'For Payment': ['Pending', 'For Signing', 'Cancelled'],
    'For Signing': ['For Payment', 'Ready for Pickup', 'Active', 'Cancelled'],
    'Ready for Pickup': ['For Signing', 'Active'],
    'Active': ['Ready for Pickup', 'Active - Under Warning', 'Suspended', 'Expired', 'Revoked'],
    'Active - Under Warning': ['Active', 'Suspended', 'Expired', 'Revoked'],
    'Suspended': ['Active - Under Warning', 'Active', 'Expired', 'Revoked'],
    'Cancellation Requested': ['Cancelled', 'Active', 'Active - Under Warning'],
    'Cancelled': ['Pending', 'Pending for Approval', 'For Payment'],
    'Expired': [],
    'Revoked': []
};

const blockDuringMaintenance = async (req, res, next) => {
    try {
        const SystemSettings = require('../models/systemSettingsModel');
        const sysSettings = await SystemSettings.findOne().sort({ updatedAt: -1, createdAt: -1 }).lean();
        if (sysSettings?.maintenanceMode === true) {
            return res.status(503).json({
                message: sysSettings.maintenanceMessage || 'System is currently undergoing maintenance. New franchise applications and renewals are temporarily suspended.'
            });
        }
        return next();
    } catch (err) {
        console.error('[Maintenance Check] Failed to read SystemSettings:', err);
        if (process.env.NODE_ENV === 'test') {
            return next();
        }
        return res.status(503).json({
            message: 'Service temporarily unavailable while verifying maintenance status. Please try again shortly.'
        });
    }
};

function resolveTodaAssociation(value) {
    if (typeof value !== 'string') return null;
    const name = value.trim().replace(/\s+/g, ' ').toUpperCase();
    return TODA_DIRECTORY.find(entry => entry.id === name || entry.name.toUpperCase() === name) || null;
}

function todaAssociationPattern(entry) {
    const labels = [entry.id, entry.name].map(label => label.split(' ').map(escapeRegex).join('\\s+'));
    return new RegExp(`^\\s*(?:${labels.join('|')})\\s*$`, 'i');
}

const createFranchise = async (req, res) => {
    try {
        const SystemSettings = require('../models/systemSettingsModel');
        const sysSettings = await SystemSettings.findOne().sort({ updatedAt: -1, createdAt: -1 }).lean().catch(() => null);
        if (sysSettings?.maintenanceMode === true) {
            return res.status(503).json({
                message: sysSettings.maintenanceMessage || 'System is currently undergoing maintenance. New franchise applications are temporarily suspended.'
            });
        }

        const files = req.files || {};
        const findFilePath = (keys) => {
            if (Array.isArray(files)) {
                const found = files.find(f => keys.some(k => f.fieldname.toLowerCase() === k.toLowerCase() || f.fieldname.toLowerCase().includes(k.toLowerCase())));
                return found ? (found.path || found.secure_url || found.url || '') : '';
            }
            for (const k of keys) {
                if (files[k] && files[k][0]) return files[k][0].path || files[k][0].secure_url || files[k][0].url || '';
            }
            return '';
        };

        const uploadedFields = new Set();
        const resolveDocUrl = (fieldName, fileKeys) => {
            const uploadedPath = findFilePath(fileKeys);
            if (uploadedPath) {
                uploadedFields.add(fieldName);
                return uploadedPath;
            }
            return req.body[fieldName] || '';
        };

        const data = {
            ...req.body,
            orCrUrl: resolveDocUrl('orCrUrl', ['orCrDocument', 'orCrUrl', 'orcr', 'doc_0']),
            crUrl: resolveDocUrl('crUrl', ['crDocument', 'crFile', 'crUrl']),
            orUrl: resolveDocUrl('orUrl', ['orDocument', 'orFile', 'orUrl']),
            licenseUrl: resolveDocUrl('licenseUrl', ['license', 'licenseUrl', 'doc_1']),
            licenseBackUrl: resolveDocUrl('licenseBackUrl', ['licenseBack', 'licenseBackUrl', 'doc_license_back']),
            todaEndorsementUrl: resolveDocUrl('todaEndorsementUrl', ['todaEndorsement', 'todaEndorsementUrl', 'toda', 'doc_2']),
            brgyClearanceUrl: resolveDocUrl('brgyClearanceUrl', ['brgyClearance', 'brgyClearanceUrl', 'brgy', 'doc_3']),
            cedulaUrl: resolveDocUrl('cedulaUrl', ['cedulaDoc', 'cedulaUrl', 'cedula', 'doc_cedula', 'ctc']),
            unitPhotoUrl: resolveDocUrl('unitPhotoUrl', ['unitPhoto', 'unitPhotoUrl'])
        };
        if (!data.orCrUrl) {
            if (data.crUrl) {
                data.orCrUrl = data.crUrl;
                if (uploadedFields.has('crUrl')) uploadedFields.add('orCrUrl');
            } else if (data.orUrl) {
                data.orCrUrl = data.orUrl;
                if (uploadedFields.has('orUrl')) uploadedFields.add('orCrUrl');
            }
        }

        // M6: Reject arbitrary external URLs passed in req.body for document fields
        FranchiseService.validateDocumentUrls(data, new Set(), uploadedFields);
        
        if (typeof data.aiScannedData === 'string') {
            try { data.aiScannedData = JSON.parse(data.aiScannedData); } catch {}
        }
        if (typeof data.aiDiscrepancies === 'string') {
            try { data.aiDiscrepancies = JSON.parse(data.aiDiscrepancies); } catch {}
        }
        if (typeof data.cedulaDetails === 'string') {
            try { data.cedulaDetails = JSON.parse(data.cedulaDetails); } catch {}
        }

        const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'administrator');
        const franchiseOwner = (isAdmin && req.body.operator) ? req.body.operator : req.user._id;
        data.status = 'Pending';
        delete data.approvalDate;
        delete data.expiryDate;

        const franchise = await FranchiseService.createFranchise(data, franchiseOwner, { uploadedFields });

        // Notify admins of new franchise submission
        if (!isAdmin) {
            try {
                const User = require('../models/userModel');
                const staffAndAdmins = await User.find({ role: { $in: ['admin', 'administrator', 'Administrator', 'system_admin', 'bplo_staff'] } });
                for (const adm of staffAndAdmins) {
                    const notif = await Notification.create({
                        recipient: adm._id,
                        type: 'info',
                        title: 'New Franchise Application',
                        message: `Operator ${franchise.fullName || req.user.name} submitted a new application for unit ${franchise.plateNo} (${franchise.todaName || 'TODA'}).`,
                        relatedFranchise: franchise._id
                    });
                    emitToUser(adm._id.toString(), 'notification', notif);
                }
            } catch (notifErr) {
                console.error('Error notifying admins of new franchise:', notifErr);
            }
        }
        
        res.status(201).json(franchise);
    } catch (error) {
        console.error('Error creating franchise:', error);
        if (error.code === 11000) {
            return res.status(409).json({ 
                message: 'Tricycle (Plate/Motor/Chassis) is already registered.' 
            });
        }
        if (error.name === 'ValidationError') {
            const missingFields = Object.keys(error.errors || {}).join(', ');
            return res.status(400).json({
                message: `Kulang ang impormasyon ng aplikasyon (${missingFields || error.message}). Mangyaring i-type nang manual ang mga kulang na detalye sa Hakbang 2 bago mag-submit.`
            });
        }
        if (error.statusCode === 503) {
            return res.status(503).json({
                message: error.message || 'System is currently undergoing maintenance.'
            });
        }
        const isClientError = error.name === 'ValidationError' || 
                              error.name === 'CastError' || 
                              error.statusCode === 400 || 
                              error?.message?.includes('registered') || 
                              error?.message?.includes('required') || 
                              error?.message?.includes('blocked') ||
                              error?.message?.includes('exceeded') ||
                              error?.message?.includes('invalid');
        return res.status(isClientError ? 400 : 500).json({ 
            message: error.message || 'Server error creating franchise application.' 
        });
    }
};

const searchHistoricalFranchise = async (req, res) => {
    try {
        const record = await FranchiseService.searchHistorical(req.query.query);
        if (!record) return res.status(404).json({ message: 'No historical application record found.' });
        res.status(200).json(record);
    } catch (error) {
        res.status(error?.message?.includes('required') ? 400 : 500).json({ error: 'An internal server error occurred' });
    }
};

const getAllFranchises = async (req, res) => {
    try {
        const result = await FranchiseService.getPaginatedFranchises(req.query);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: 'An internal server error occurred' });
    }
};

const getMyFranchises = async (req, res) => {
    try {
        const franchises = await Franchise.find({ 
            operator: req.user._id, 
            $or: [
                { isArchived: { $ne: true } },
                { status: 'Cancelled' }
            ]
        }).populate('operator', 'name address contact');
        res.status(200).json(franchises);
    } catch (error) {
        res.status(500).json({ error: 'An internal server error occurred' });
    }
};

const authorizeFranchiseEdit = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid franchise ID format.' });
        }
        const existingFranchise = await Franchise.findById(req.params.id);
        if (!existingFranchise) {
            return res.status(404).json({ message: 'Franchise not found' });
        }

        const role = String(req.user?.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
        const isBploStaff = role === 'bplo_staff';
        const isOwner = existingFranchise.operator && existingFranchise.operator.toString() === req.user._id.toString();

        if (!isBploStaff && !isOwner) {
            return res.status(403).json({ message: 'ACCESS DENIED: You are not authorized to update this franchise record.' });
        }

        if (!isBploStaff && !['Pending', 'Pending for Approval', 'Rejected', 'Cancelled'].includes(existingFranchise.status)) {
            return res.status(400).json({
                message: `Cannot modify franchise details while application status is '${existingFranchise.status}'. Only Pending, Rejected, or Cancelled applications can be edited.`
            });
        }

        if (!isBploStaff && (existingFranchise.status === 'Cancelled' || existingFranchise.status === 'Rejected') && existingFranchise.paymentStatus === 'Paid') {
            return res.status(400).json({
                message: 'Cannot resubmit a voluntarily cancelled franchise. Please submit a new application or contact BPLO Staff.'
            });
        }

        req.existingFranchise = existingFranchise;
        return next();
    } catch (error) {
        return res.status(500).json({ error: 'An internal server error occurred' });
    }
};

const updateFranchise = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid franchise ID format.' });
        }
        const existingFranchise = await Franchise.findById(req.params.id);
        if (!existingFranchise) return res.status(404).json({ message: 'Franchise not found' });

        // IDOR & Role Separation Protection: only allow owner or bplo_staff
        const role = String(req.user?.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
        const isBploStaff = role === 'bplo_staff';
        const isOwner = existingFranchise.operator && existingFranchise.operator.toString() === req.user._id.toString();

        if (!isBploStaff && !isOwner) {
            return res.status(403).json({ message: 'ACCESS DENIED: You are not authorized to update this franchise record.' });
        }

        // Prevent operators from overwriting vehicle/permit fields on an already Active, For Payment, For Signing, or Ready for Pickup franchise
        if (!isBploStaff && !['Pending', 'Pending for Approval', 'Rejected', 'Cancelled'].includes(existingFranchise.status)) {
            return res.status(400).json({
                message: `Cannot modify franchise details while application status is '${existingFranchise.status}'. Only Pending, Rejected, or Cancelled applications can be edited.`
            });
        }

        const allowlist = isBploStaff ? BPLO_EDITABLE_FIELDS : OPERATOR_EDITABLE_FIELDS;
        const updateData = {};
        for (const key of Object.keys(req.body || {})) {
            if (allowlist.has(key) && req.body[key] !== undefined) {
                updateData[key] = req.body[key];
            }
        }

        const wasCancelled = existingFranchise.status === 'Cancelled' || existingFranchise.status === 'Rejected';

        if (!isBploStaff && wasCancelled) {
            if (existingFranchise.paymentStatus === 'Paid') {
                return res.status(400).json({
                    message: 'Cannot resubmit a voluntarily cancelled franchise. Please submit a new application or contact BPLO Staff.'
                });
            }
            // When an operator re-submits a cancelled/rejected application to fix issues,
            // transition it back to Pending and clear previous rejection remarks.
            updateData.status = 'Pending';
            updateData.isResubmitted = true;
            updateData.resubmittedAt = new Date();
            updateData.cancelReason = '';
            updateData.rejectedField = '';
            updateData.isArchived = false;
            updateData.archivedAt = null;
        }

        if (updateData.plateNo !== undefined) {
            updateData.plateNo = String(updateData.plateNo || '').trim().toUpperCase();
        }
        if (updateData.motorNo !== undefined) {
            updateData.motorNo = String(updateData.motorNo || '').trim().toUpperCase();
        }
        if (updateData.chassisNo !== undefined) {
            updateData.chassisNo = String(updateData.chassisNo || '').trim().toUpperCase();
        }

        // Parse structured metadata date fields if provided
        const DATE_FIELDS = [
            'orCrExpiryDate', 'orDate', 'crDate', 'driverLicenseExpiryDate',
            'driverDob', 'todaCertDate', 'brgyClearanceDate', 'cedulaDate', 'cedulaDob'
        ];
        for (const df of DATE_FIELDS) {
            if (updateData[df] !== undefined && updateData[df] !== '') {
                updateData[df] = !isNaN(new Date(updateData[df]).getTime()) ? new Date(updateData[df]) : null;
            }
        }
        if (updateData.isOperatorDriver !== undefined) {
            updateData.isOperatorDriver = updateData.isOperatorDriver === true || updateData.isOperatorDriver === 'true';
        }

        if (typeof updateData.aiScannedData === 'string') {
            try { updateData.aiScannedData = JSON.parse(updateData.aiScannedData); } catch {}
        }
        if (typeof updateData.cedulaDetails === 'string') {
            try { updateData.cedulaDetails = JSON.parse(updateData.cedulaDetails); } catch {}
        }
        if (typeof updateData.aiDiscrepancies === 'string') {
            try { updateData.aiDiscrepancies = JSON.parse(updateData.aiDiscrepancies); } catch {}
        }

        const files = req.files || {};
        const findFilePath = (keys) => {
            if (Array.isArray(files)) {
                const found = files.find(f => keys.some(k => f.fieldname.toLowerCase() === k.toLowerCase() || f.fieldname.toLowerCase().includes(k.toLowerCase())));
                return found ? (found.path || found.secure_url || found.url || '') : '';
            }
            for (const k of keys) {
                if (files[k] && files[k][0]) return files[k][0].path || files[k][0].secure_url || files[k][0].url || '';
            }
            return '';
        };

        const orCr = findFilePath(['orCrDocument', 'orCrUrl', 'orcr', 'doc_0']);
        const cr = findFilePath(['crDocument', 'crFile', 'crUrl']);
        const or = findFilePath(['orDocument', 'orFile', 'orUrl']);
        const lic = findFilePath(['license', 'licenseUrl', 'doc_1']);
        const licBack = findFilePath(['licenseBack', 'licenseBackUrl', 'doc_license_back']);
        const toda = findFilePath(['todaEndorsement', 'todaEndorsementUrl', 'toda', 'doc_2']);
        const brgy = findFilePath(['brgyClearance', 'brgyClearanceUrl', 'brgy', 'doc_3']);
        const cedula = findFilePath(['cedulaDoc', 'cedulaUrl', 'cedula', 'doc_cedula', 'ctc']);
        const unitPhoto = findFilePath(['unitPhoto', 'unitPhotoUrl']);

        const uploadedFields = new Set();
        if (orCr) { updateData.orCrUrl = orCr; uploadedFields.add('orCrUrl'); }
        if (cr) { updateData.crUrl = cr; uploadedFields.add('crUrl'); if (!orCr) { updateData.orCrUrl = cr; uploadedFields.add('orCrUrl'); } }
        if (or) { updateData.orUrl = or; uploadedFields.add('orUrl'); if (!orCr && !cr) { updateData.orCrUrl = or; uploadedFields.add('orCrUrl'); } }
        if (lic) { updateData.licenseUrl = lic; uploadedFields.add('licenseUrl'); }
        if (licBack) { updateData.licenseBackUrl = licBack; uploadedFields.add('licenseBackUrl'); }
        if (toda) { updateData.todaEndorsementUrl = toda; uploadedFields.add('todaEndorsementUrl'); }
        if (brgy) { updateData.brgyClearanceUrl = brgy; uploadedFields.add('brgyClearanceUrl'); }
        if (cedula) { updateData.cedulaUrl = cedula; uploadedFields.add('cedulaUrl'); }
        if (unitPhoto) { updateData.unitPhotoUrl = unitPhoto; uploadedFields.add('unitPhotoUrl'); }

        // M6: Reject arbitrary external URLs passed in req.body (only fresh uploads, existing franchise URLs, or server-issued assets allowed)
        const existingAllowedUrls = collectExistingDocumentUrls(existingFranchise);
        try {
            FranchiseService.validateDocumentUrls(updateData, existingAllowedUrls, uploadedFields);
            if (req.body && req.body.unitPhotoUrl !== undefined && !uploadedFields.has('unitPhotoUrl')) {
                FranchiseService.validateDocumentUrls({ unitPhotoUrl: req.body.unitPhotoUrl }, existingAllowedUrls, uploadedFields);
            }
        } catch (urlErr) {
            return res.status(400).json({ message: urlErr.message });
        }

        const updatedFranchise = await Franchise.findOneAndUpdate(
            { _id: req.params.id, status: existingFranchise.status },
            { $set: updateData },
            { returnDocument: 'after' }
        ).populate('operator', 'name address contact');

        if (!updatedFranchise) {
            return res.status(409).json({
                message: 'Conflict: Franchise status changed concurrently during update. Please refresh and try again.'
            });
        }
        
        if (isBploStaff) {
            await logAudit(req, {
                action: 'FRANCHISE_UPDATED',
                targetType: 'Franchise',
                targetId: req.params.id,
                details: { plateNo: updatedFranchise.plateNo, updatedFields: Object.keys(updateData) }
            });
        } else if (wasCancelled && updatedFranchise.status === 'Pending') {
            // Notify admins and BPLO staff of re-submitted corrected application
            try {
                const User = require('../models/userModel');
                const admins = await User.find({ role: { $in: ['bplo_staff', 'admin', 'administrator', 'Administrator'] } });
                for (const adm of admins) {
                    const notif = await Notification.create({
                        recipient: adm._id,
                        type: 'info',
                        title: 'Franchise Application Re-submitted',
                        message: `Operator ${updatedFranchise.fullName || 'User'} has updated and re-submitted their franchise application for ${updatedFranchise.plateNo}.`,
                        relatedFranchise: updatedFranchise._id
                    });
                    emitToUser(adm._id.toString(), 'notification', notif);
                }
            } catch (notifyErr) {
                console.error('Error notifying admins on re-submission:', notifyErr);
            }
        }

        res.status(200).json(updatedFranchise);
    } catch (error) {
        if (error && error.code === 11000) {
            return res.status(409).json({ message: 'Plate/Motor/Chassis number is already registered to another unit.' });
        }
        res.status(500).json({ error: 'An internal server error occurred' });
    }
};

const deleteFranchise = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid franchise ID format.' });
        }
        const franchise = await Franchise.findByIdAndDelete(req.params.id);
        if (!franchise) return res.status(404).json({ message: 'Franchise not found' });

        await logAudit(req, {
            action: 'FRANCHISE_DELETED',
            targetType: 'Franchise',
            targetId: req.params.id,
            details: { plateNo: franchise.plateNo, fullName: franchise.fullName }
        });

        res.status(200).json({ message: 'Franchise deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'An internal server error occurred' });
    }
};

const renewFranchise = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid franchise ID format.' });
        }
        const SystemSettings = require('../models/systemSettingsModel');
        const sysSettings = await SystemSettings.findOne().sort({ updatedAt: -1, createdAt: -1 }).lean().catch(() => null);
        if (sysSettings?.maintenanceMode === true) {
            return res.status(503).json({
                message: sysSettings.maintenanceMessage || 'System is currently undergoing maintenance. Franchise renewals are temporarily suspended.'
            });
        }

        const existingFranchise = await Franchise.findById(req.params.id);
        if (!existingFranchise) return res.status(404).json({ message: 'Franchise not found' });

        // IDOR Protection: verify user is owner or bplo_staff
        const role = String(req.user?.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
        const isAdmin = role === 'bplo_staff';
        const isOwner = existingFranchise.operator && existingFranchise.operator.toString() === req.user._id.toString();

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: 'ACCESS DENIED: You are not authorized to renew this franchise record.' });
        }

        const RENEWABLE_STATUSES = ['Active', 'Active - Under Warning', 'Expired', 'Cancelled'];
        if (!RENEWABLE_STATUSES.includes(existingFranchise.status) || (existingFranchise.status === 'Cancelled' && existingFranchise.paymentStatus === 'Paid')) {
            return res.status(400).json({
                message: `Cannot renew a franchise while its status is '${existingFranchise.status}'. Only Active, Active - Under Warning, or Expired franchises are eligible for renewal.`
            });
        }

        if (existingFranchise.isArchived && existingFranchise.status !== 'Cancelled') {
            return res.status(400).json({
                message: 'Cannot renew an archived franchise record. Please contact BPLO Staff to restore the record first.'
            });
        }

        const { 
            cedulaDate, cedulaAddress, cedulaSerialNo, cedulaAmount, ctcNo, 
            dateIssued, placeIssued, orCrNo, orCrExpiryDate, orCrExpiry, crNo, orNo,
            driverLicenseNo, driverLicenseSerialNo, driverLicenseExpiryDate, licenseExpiry,
            brgyClearanceNo, brgyClearanceDate, brgyIssuer
        } = req.body;

        const now = getManilaNow();

        // M7: Reject invalid or already-expired document expiry dates (in Asia/Manila time)
        const rawOrCrExpiry = orCrExpiryDate !== undefined ? orCrExpiryDate : orCrExpiry;
        let parsedOrCrExpiry = null;
        if (rawOrCrExpiry !== undefined && rawOrCrExpiry !== null && String(rawOrCrExpiry).trim() !== '') {
            const check = validateDocumentExpiryDate(rawOrCrExpiry, now);
            if (check.invalid) {
                return res.status(400).json({ message: 'Invalid OR/CR expiry date format.' });
            }
            if (check.expired) {
                return res.status(400).json({ message: 'OR/CR document expiry date is already expired. Please submit a valid, unexpired OR/CR.' });
            }
            parsedOrCrExpiry = check.date;
        }

        const rawLicenseExpiry = driverLicenseExpiryDate !== undefined ? driverLicenseExpiryDate : licenseExpiry;
        let parsedLicenseExpiry = null;
        if (rawLicenseExpiry !== undefined && rawLicenseExpiry !== null && String(rawLicenseExpiry).trim() !== '') {
            const check = validateDocumentExpiryDate(rawLicenseExpiry, now);
            if (check.invalid) {
                return res.status(400).json({ message: "Invalid driver's license expiry date format." });
            }
            if (check.expired) {
                return res.status(400).json({ message: "Driver's license expiry date is already expired. Please submit a valid, unexpired license." });
            }
            parsedLicenseExpiry = check.date;
        }

        // M6: Validate uploaded files & reject arbitrary external document URLs in req.body
        const uploadedFields = new Set();
        const uploadedDocUpdates = {};
        if (req.files) {
            if (req.files['orcrFile'] && req.files['orcrFile'][0]) { uploadedDocUpdates.orCrUrl = req.files['orcrFile'][0].path; uploadedFields.add('orCrUrl'); }
            if (req.files['orCrDocument'] && req.files['orCrDocument'][0]) { uploadedDocUpdates.orCrUrl = req.files['orCrDocument'][0].path; uploadedFields.add('orCrUrl'); }
            if (req.files['crDocument'] && req.files['crDocument'][0]) { uploadedDocUpdates.crUrl = req.files['crDocument'][0].path; uploadedFields.add('crUrl'); }
            if (req.files['orDocument'] && req.files['orDocument'][0]) { uploadedDocUpdates.orUrl = req.files['orDocument'][0].path; uploadedFields.add('orUrl'); }
            if (req.files['cedulaDoc'] && req.files['cedulaDoc'][0]) { uploadedDocUpdates.cedulaUrl = req.files['cedulaDoc'][0].path; uploadedFields.add('cedulaUrl'); }
            if (req.files['cedula'] && req.files['cedula'][0]) { uploadedDocUpdates.cedulaUrl = req.files['cedula'][0].path; uploadedFields.add('cedulaUrl'); }
            if (req.files['license'] && req.files['license'][0]) { uploadedDocUpdates.licenseUrl = req.files['license'][0].path; uploadedFields.add('licenseUrl'); }
            if (req.files['licenseBack'] && req.files['licenseBack'][0]) { uploadedDocUpdates.licenseBackUrl = req.files['licenseBack'][0].path; uploadedFields.add('licenseBackUrl'); }
            if (req.files['brgyClearance'] && req.files['brgyClearance'][0]) { uploadedDocUpdates.brgyClearanceUrl = req.files['brgyClearance'][0].path; uploadedFields.add('brgyClearanceUrl'); }
        }
        const existingAllowedUrls = collectExistingDocumentUrls(existingFranchise);
        try {
            FranchiseService.validateDocumentUrls(req.body || {}, existingAllowedUrls, uploadedFields);
        } catch (urlErr) {
            return res.status(400).json({ message: urlErr.message });
        }

        // M7: Preserve live permit validity metadata & unexpired expiryDate during early renewal
        const isUnexpiredLivePermit =
            ['Active', 'Active - Under Warning'].includes(existingFranchise.status) &&
            Boolean(existingFranchise.expiryDate) &&
            !isExpired(existingFranchise.expiryDate, now);

        const setFields = {
            dateApplied: new Date(),
            cedulaDate: cedulaDate || dateIssued || existingFranchise.cedulaDate,
            cedulaAddress: cedulaAddress || placeIssued || existingFranchise.cedulaAddress || '',
            cedulaSerialNo: cedulaSerialNo || ctcNo || existingFranchise.cedulaSerialNo,
            cedulaAmount: cedulaAmount !== undefined ? Number(cedulaAmount) : (existingFranchise.cedulaAmount || 0),
            status: 'Pending',
            previousStatus: existingFranchise.status,
            previousExpiryDate: existingFranchise.expiryDate || null,
            isRenewalPending: true,
            approvalDate: null,
            expiryDate: isUnexpiredLivePermit ? existingFranchise.expiryDate : null,
            cancelReason: '',
            rejectedField: '',
            isArchived: false,
            archivedAt: null,
            applicationType: 'Renewal',
            paymentStatus: 'Unpaid',
            officialReceiptNo: '',
            paymentMethod: '',
            payerName: '',
            amountPaid: 0,
            paymentDate: null,
            paidByCashier: null,
            cashierName: '',
            paymentRemarks: '',
            ...uploadedDocUpdates
        };

        if (orCrNo) setFields.orCrNo = orCrNo;
        if (crNo) setFields.crNo = crNo;
        if (orNo) setFields.orNo = orNo;
        if (parsedOrCrExpiry) setFields.orCrExpiryDate = parsedOrCrExpiry;
        if (driverLicenseNo) setFields.driverLicenseNo = driverLicenseNo;
        if (driverLicenseSerialNo) setFields.driverLicenseSerialNo = driverLicenseSerialNo;
        if (parsedLicenseExpiry) setFields.driverLicenseExpiryDate = parsedLicenseExpiry;
        if (brgyClearanceNo) setFields.brgyClearanceNo = brgyClearanceNo;
        if (brgyClearanceDate && !isNaN(new Date(brgyClearanceDate).getTime())) setFields.brgyClearanceDate = new Date(brgyClearanceDate);
        if (brgyIssuer) setFields.brgyIssuer = brgyIssuer;

        const updateOps = { $set: setFields };
        if (existingFranchise.paymentStatus === 'Paid' || existingFranchise.officialReceiptNo) {
            updateOps.$push = {
                paymentHistory: {
                    officialReceiptNo: existingFranchise.officialReceiptNo || '',
                    amountPaid: existingFranchise.amountPaid || 0,
                    paymentDate: existingFranchise.paymentDate || null,
                    payerName: existingFranchise.payerName || '',
                    paymentMethod: existingFranchise.paymentMethod || '',
                    paidByCashier: existingFranchise.paidByCashier || null,
                    cashierName: existingFranchise.cashierName || '',
                    paymentRemarks: existingFranchise.paymentRemarks || '',
                    approvalDate: existingFranchise.approvalDate || null,
                    expiryDate: existingFranchise.expiryDate || null,
                    mtopNo: existingFranchise.mtopNo || '',
                    archivedAt: new Date()
                }
            };
        }

        // Handle dynamically-expired Active/Under-Warning records in raw MongoDB filter
        const atomicFilter = {
            _id: req.params.id,
            status: existingFranchise.status === 'Expired'
                ? { $in: ['Expired', 'Active', 'Active - Under Warning'] }
                : existingFranchise.status,
            paymentStatus: existingFranchise.paymentStatus,
            ...(existingFranchise.status === 'Cancelled' ? {} : { isArchived: { $ne: true } })
        };

        const updatedFranchise = await Franchise.findOneAndUpdate(
            atomicFilter,
            updateOps,
            { returnDocument: 'after' }
        ).populate('operator', 'name address contact');

        if (!updatedFranchise) {
            return res.status(409).json({
                message: 'Conflict: Franchise was already renewed or modified concurrently. Please refresh and try again.'
            });
        }

        await logAudit(req, {
            action: 'FRANCHISE_RENEWAL_SUBMITTED',
            targetType: 'Franchise',
            targetId: req.params.id,
            details: {
                plateNo: updatedFranchise.plateNo,
                fullName: updatedFranchise.fullName,
                applicationType: 'Renewal'
            }
        });

        try {
            const staffRecipients = await User.find({ role: { $in: ['bplo_staff', 'admin', 'administrator', 'Administrator'] } });
            for (const staff of staffRecipients) {
                const notif = await Notification.create({
                    recipient: staff._id,
                    type: 'info',
                    title: 'Franchise Renewal Application Submitted',
                    message: `Operator ${updatedFranchise.fullName || req.user?.name || 'User'} submitted a renewal application for unit ${updatedFranchise.plateNo} (${updatedFranchise.todaName || 'TODA'}).`,
                    relatedFranchise: updatedFranchise._id
                });
                emitToUser(staff._id.toString(), 'notification', notif);
            }
        } catch (notifyErr) {
            console.error('Error notifying BPLO staff on franchise renewal:', notifyErr);
        }

        res.status(200).json(updatedFranchise);
    } catch (error) {
        res.status(500).json({ error: 'An internal server error occurred' });
    }
};

const updateFranchiseStatus = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid franchise ID format.' });
        }
        const { status, cancelReason, rejectedField, expectedStatus, expectedUpdatedAt } = req.body;
        if (status === 'Cancellation Requested') {
            return res.status(400).json({
                message: 'Cannot set status to \'Cancellation Requested\' via this endpoint. Voluntary cancellation must be requested by the operator.'
            });
        }

        const existingFranchise = await Franchise.findById(req.params.id);
        if (!existingFranchise) return res.status(404).json({ message: 'Franchise not found' });
        
        const previousStatus = existingFranchise.status;

        if (expectedStatus !== undefined && expectedStatus !== null && expectedStatus !== '') {
            if (previousStatus !== expectedStatus) {
                return res.status(409).json({
                    message: `Conflict: Franchise status has already changed from '${expectedStatus}' to '${previousStatus}'. Please refresh and try again.`
                });
            }
        }

        let expectedUpdatedAtDate = null;
        if (expectedUpdatedAt !== undefined && expectedUpdatedAt !== null && expectedUpdatedAt !== '') {
            expectedUpdatedAtDate = new Date(expectedUpdatedAt);
            if (Number.isNaN(expectedUpdatedAtDate.getTime())) {
                return res.status(400).json({ message: 'Invalid expectedUpdatedAt timestamp.' });
            }
            const actualUpdatedAt = existingFranchise.updatedAt ? new Date(existingFranchise.updatedAt) : null;
            if (!actualUpdatedAt || actualUpdatedAt.getTime() !== expectedUpdatedAtDate.getTime()) {
                return res.status(409).json({
                    message: 'Conflict: Franchise record has been modified since it was opened. Please refresh and try again.'
                });
            }
        }

        const allowedTargets = ALLOWED_STATUS_TRANSITIONS[previousStatus] || [];
        if (!status || !allowedTargets.includes(status)) {
            return res.status(400).json({
                message: `Invalid status transition from '${previousStatus}' to '${status}'.`
            });
        }

        // Do not reopen a paid voluntarily-cancelled franchise via status endpoint
        if (previousStatus === 'Cancelled' && existingFranchise.paymentStatus === 'Paid') {
            return res.status(400).json({
                message: 'Cannot transition a paid cancelled franchise back into the active review pipeline.'
            });
        }

        // Paid pending applications cannot be rejected during the approval pipeline,
        // but voluntary cancellation of an active franchise (from Cancellation Requested) is permitted.
        if (status === 'Cancelled' && existingFranchise.paymentStatus === 'Paid' && previousStatus !== 'Cancellation Requested') {
            return res.status(400).json({ message: 'Cannot reject or cancel an application that has already been paid.' });
        }

        // Strict Pipeline Rule: Cannot advance to For Signing, Ready for Pickup, or Active without Cashier payment
        if (['For Signing', 'Ready for Pickup', 'Active'].includes(status) && existingFranchise.paymentStatus !== 'Paid') {
            return res.status(400).json({ 
                message: `Cannot advance status to '${status}': Official Treasury payment has not been recorded by Cashier.` 
            });
        }

        let targetField = rejectedField || '';
        if (!targetField && cancelReason) {
            const lowerReason = cancelReason.toLowerCase();
            if (lowerReason.includes('chassis')) targetField = 'chassisNo';
            else if (lowerReason.includes('motor') || lowerReason.includes('engine')) targetField = 'motorNo';
            else if (lowerReason.includes('plate')) targetField = 'plateNo';
            else if (lowerReason.includes('license')) targetField = 'license';
            else if (lowerReason.includes('cedula') || lowerReason.includes('ctc')) targetField = 'cedulaSerialNo';
            else if (lowerReason.includes('or/cr') || lowerReason.includes('orcr') || lowerReason.includes('cr')) targetField = 'orCrDocument';
            else if (lowerReason.includes('toda')) targetField = 'todaEndorsement';
            else if (lowerReason.includes('barangay') || lowerReason.includes('clearance')) targetField = 'brgyClearance';
            else if (lowerReason.includes('year') || lowerReason.includes('made')) targetField = 'made';
            else if (lowerReason.includes('make') || lowerReason.includes('brand')) targetField = 'make';
            else if (lowerReason.includes('zone') || lowerReason.includes('route')) targetField = 'zone';
        }

        const updateData = { 
            status: status, 
            cancelReason: cancelReason || '', 
            rejectedField: targetField
        };

        if (existingFranchise.status === 'Cancellation Requested' && status === 'Cancelled') {
            updateData['cancellationDetails.reviewedBy'] = req.user._id;
            updateData['cancellationDetails.reviewedAt'] = new Date();
            if (req.body.staffNotes) {
                updateData['cancellationDetails.staffNotes'] = req.body.staffNotes;
            }
        }

        // NOTE: Do NOT auto-archive cancelled/rejected applications!
        // The operator must see rejection remarks to fix and resubmit their application,
        // and admin must see them in the Rejected queue. Only explicit archiving moves them.
        if (existingFranchise.status === 'Cancelled' && status !== 'Cancelled') {
            updateData.isArchived = false;
            updateData.archivedAt = null;
        }

        if (['For Payment', 'For Signing', 'Ready for Pickup', 'Active'].includes(status) && !existingFranchise.approvalDate) {
            updateData.approvalDate = new Date();
        }

        if (status === 'Active') {
            const SystemSettings = require('../models/systemSettingsModel');
            const sysSettings = await SystemSettings.findOne().sort({ updatedAt: -1, createdAt: -1 }).lean().catch(() => null);
            const validityYears = existingFranchise.applicationType === 'Renewal'
                ? (sysSettings?.validityRenew || 1)
                : (sysSettings?.validityNew || 3);
            if (existingFranchise.isRenewalPending) {
                updateData.approvalDate = new Date();
            }
            const baseApproval = updateData.approvalDate || existingFranchise.approvalDate || new Date();
            updateData.expiryDate = computeManilaExpiryDate(baseApproval, validityYears);
            updateData.isRenewalPending = false;
            updateData.previousStatus = '';
            updateData.previousExpiryDate = null;
        }

        const needsMtop = ['For Signing', 'Ready for Pickup', 'Active'].includes(status) && !existingFranchise.mtopNo;
        const atomicStatusFilter = {
            _id: req.params.id,
            status: previousStatus,
            ...(expectedUpdatedAtDate ? { updatedAt: existingFranchise.updatedAt } : {})
        };
        let updatedFranchise = null;

        if (needsMtop) {
            updatedFranchise = await executeAtomicUpdateWithMtop(
                atomicStatusFilter,
                updateData,
                { populateOperator: 'name address contact' }
            );
        } else {
            updatedFranchise = await Franchise.findOneAndUpdate(
                atomicStatusFilter,
                { $set: updateData },
                { returnDocument: 'after' }
            ).populate('operator', 'name address contact');
        }

        if (!updatedFranchise) {
            return res.status(409).json({
                message: `Conflict: Franchise status was modified concurrently from '${previousStatus}'. Please refresh and try again.`
            });
        }

        if (updatedFranchise.operator) {
            let notifTitle = `Franchise ${status}`;
            let notifMessage = `Your franchise application for ${updatedFranchise.plateNo} has been updated to: ${status}`;

            if (status === 'Cancellation Requested') {
                notifTitle = 'Franchise Cancellation Requested';
                notifMessage = `Your voluntary cancellation request for franchise ${updatedFranchise.plateNo} has been submitted to BPLO.`;
            } else if (status === 'Cancelled' && previousStatus === 'Cancellation Requested') {
                notifTitle = 'Franchise Formally Cancelled';
                notifMessage = `Your voluntary cancellation request for franchise ${updatedFranchise.plateNo} has been approved and finalized by BPLO. The franchise is now cancelled.`;
            } else if (status === 'For Payment') {
                notifTitle = 'Requirements Approved - For Payment';
                notifMessage = `Your franchise application for ${updatedFranchise.plateNo} has passed technical review! Please proceed to the Municipal Treasury / Cashier to settle your fee.`;
            } else if (status === 'For Signing') {
                notifTitle = 'Payment Confirmed - For Official Signing';
                notifMessage = `Your payment for ${updatedFranchise.plateNo} has been recorded. Your application is now queued for municipal executive signatures.`;
            } else if (status === 'Ready for Pickup') {
                notifTitle = 'Franchise Signed - Ready for Pickup!';
                notifMessage = `Your official MTOP Certificate for ${updatedFranchise.plateNo} has been signed! Please claim your official MTOP Certificate and franchise sticker at the BPLO / Licensing Office.`;
            } else if (status === 'Active') {
                notifTitle = 'Franchise Activated!';
                notifMessage = `Your franchise permit for ${updatedFranchise.plateNo} is now officially active and released.`;
            }

            const operatorId = updatedFranchise.operator?._id || updatedFranchise.operator;
            if (operatorId) {
                const notification = await Notification.create({
                    recipient: operatorId,
                    type: 'status_change',
                    title: notifTitle,
                    message: notifMessage,
                    relatedFranchise: updatedFranchise._id
                });
                emitToUser(String(operatorId), 'notification', notification);
                
                // Send background push notification to operator's mobile device
                sendPushToUser(operatorId, {
                    title: notifTitle,
                    message: notifMessage,
                    url: '/operator-dashboard',
                    type: String(status).toLowerCase().includes('approv') || status === 'For Signing' ? 'approval' : 'status_change'
                }).catch(err => console.error('Push alert delivery failed:', err.message));
            }
        }

        await logAudit(req, {
            action: 'FRANCHISE_STATUS_UPDATE',
            targetType: 'Franchise',
            targetId: req.params.id,
            details: {
                plateNo: updatedFranchise.plateNo,
                fullName: updatedFranchise.fullName,
                previousStatus,
                newStatus: status,
                reason: cancelReason || ''
            }
        });

        res.status(200).json(updatedFranchise);
    } catch (error) {
        res.status(500).json({ error: 'An internal server error occurred' });
    }
};

const cancelMyFranchise = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid franchise ID format.' });
        }
        const franchise = await Franchise.findById(req.params.id);
        if (!franchise) return res.status(404).json({ message: 'Franchise not found' });
        if (!franchise.operator || franchise.operator.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized to cancel this application' });
        
        if (!['Pending', 'For Payment', 'For Signing', 'Ready for Pickup'].includes(franchise.status)) {
            return res.status(400).json({ message: 'Only pending or unreleased applications can be cancelled.' });
        }

        const reason = (req.body.cancelReason || 'Cancelled by operator').trim();
        franchise.status = 'Cancelled';
        franchise.cancelReason = reason;
        franchise.isArchived = true;
        await franchise.save();

        await logAudit(req, {
            action: 'FRANCHISE_CANCELLED_BY_OPERATOR',
            targetType: 'Franchise',
            targetId: req.params.id,
            details: {
                plateNo: franchise.plateNo || 'Pending',
                fullName: franchise.fullName,
                cancelReason: reason
            }
        });

        res.status(200).json(franchise);
    } catch (error) {
        res.status(500).json({ error: 'An internal server error occurred' });
    }
};

/**
 * Request Voluntary Franchise Cancellation (Operator Side)
 * Status transition: Active -> Cancellation Requested
 */
const requestFranchiseCancellation = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid franchise ID format.' });
        }
        const franchise = await Franchise.findById(req.params.id);
        if (!franchise) return res.status(404).json({ message: 'Franchise not found' });

        // Authorization check: User must be the operator
        if (!franchise.operator || franchise.operator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not authorized to request cancellation for this franchise.' });
        }

        // Only Active franchises can undergo voluntary cancellation
        if (!['Active', 'Active - Under Warning'].includes(franchise.status)) {
            return res.status(400).json({ 
                message: `Cannot request voluntary cancellation: Current status is '${franchise.status}'. Only Active franchises can be voluntarily cancelled.` 
            });
        }

        const { reason, customReason, remarks } = req.body;
        if (!reason || !reason.trim()) {
            return res.status(400).json({ message: 'A valid reason for cancellation is required.' });
        }

        const files = req.files || {};
        let letterUrl = '';
        if (files.cancellationLetter && files.cancellationLetter[0]) {
            letterUrl = files.cancellationLetter[0].path || files.cancellationLetter[0].secure_url || '';
        } else if (files.letter && files.letter[0]) {
            letterUrl = files.letter[0].path || files.letter[0].secure_url || '';
        } else if (req.body.letterUrl) {
            const existingAllowedUrls = collectExistingDocumentUrls(franchise);
            if (!FranchiseService.isTrustedDocumentUrl(req.body.letterUrl, existingAllowedUrls)) {
                return res.status(400).json({ message: 'Invalid cancellation letter URL. Only uploaded files or trusted server asset URLs are allowed.' });
            }
            letterUrl = req.body.letterUrl;
        }

        if (!letterUrl) {
            return res.status(400).json({ message: 'A signed formal cancellation letter or handwritten letter image is required.' });
        }

        const effectiveReason = reason === 'Other' && customReason ? customReason.trim() : reason.trim();
        const fullReason = remarks && remarks.trim() ? `${effectiveReason} - ${remarks.trim()}` : effectiveReason;

        franchise.status = 'Cancellation Requested';
        franchise.cancelReason = fullReason;
        franchise.evidenceUrl = letterUrl;
        franchise.cancellationDetails = {
            reason: reason.trim(),
            customReason: (customReason || '').trim(),
            remarks: (remarks || '').trim(),
            letterUrl: letterUrl,
            requestedAt: new Date(),
            reviewedBy: null,
            reviewedAt: null,
            staffNotes: '',
            rejectionReason: ''
        };

        await franchise.save();

        // Notify BPLO staff members
        try {
            const staffUsers = await User.find({ role: { $in: ['bplo_staff', 'admin', 'administrator'] } });
            for (const staff of staffUsers) {
                const notif = await Notification.create({
                    recipient: staff._id,
                    type: 'status_change',
                    title: 'Voluntary Cancellation Requested',
                    message: `Operator ${franchise.fullName} submitted a voluntary cancellation request for franchise ${franchise.plateNo} (${effectiveReason}).`,
                    relatedFranchise: franchise._id
                });
                emitToUser(staff._id.toString(), 'notification', notif);
            }
        } catch (notifErr) {
            console.error('Error notifying staff of cancellation request:', notifErr);
        }

        // Notify operator of receipt
        try {
            const opNotif = await Notification.create({
                recipient: req.user._id,
                type: 'status_change',
                title: 'Cancellation Request Submitted',
                message: `Your voluntary cancellation request for ${franchise.plateNo} has been received by BPLO. Awaiting staff review.`,
                relatedFranchise: franchise._id
            });
            emitToUser(req.user._id.toString(), 'notification', opNotif);
        } catch (opNotifErr) {
            console.error('Error sending confirmation to operator:', opNotifErr);
        }

        await logAudit(req, {
            action: 'FRANCHISE_CANCELLATION_REQUESTED',
            targetType: 'Franchise',
            targetId: req.params.id,
            details: {
                plateNo: franchise.plateNo,
                fullName: franchise.fullName,
                reason: effectiveReason,
                remarks: remarks || '',
                letterUrl
            }
        });

        res.status(200).json({
            message: 'Voluntary cancellation request submitted successfully. It is now queued for BPLO Staff review.',
            franchise
        });
    } catch (error) {
        console.error('Error requesting franchise cancellation:', error);
        res.status(500).json({ message: 'An internal server error occurred while submitting cancellation request.' });
    }
};

/**
 * Review and Process Voluntary Franchise Cancellation (BPLO Staff Side)
 * Status: Cancellation Requested -> Cancelled (Finalize) OR Active (Reject)
 * CRITICAL: Directly finalizes cancellation without routing to Cashier payment!
 */
const processFranchiseCancellation = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid franchise ID format.' });
        }
        const { action, staffNotes, rejectionReason } = req.body;
        const franchise = await Franchise.findById(req.params.id).populate('operator', 'name contact');
        if (!franchise) return res.status(404).json({ message: 'Franchise not found' });

        if (franchise.status !== 'Cancellation Requested') {
            return res.status(400).json({ 
                message: `Invalid action: Current status is '${franchise.status}'. Only franchises with 'Cancellation Requested' can be processed.` 
            });
        }

        if (action === 'finalize' || action === 'approve') {
            // Finalize cancellation without cashier payment routing
            franchise.status = 'Cancelled';
            const reasonDesc = franchise.cancellationDetails?.reason || franchise.cancelReason || 'Voluntary Surrender';
            franchise.cancelReason = franchise.cancelReason || `Voluntary Cancellation: ${reasonDesc}`;
            franchise.cancellationDetails = franchise.cancellationDetails || {};
            franchise.cancellationDetails.reviewedBy = req.user?._id;
            franchise.cancellationDetails.reviewedAt = new Date();
            franchise.cancellationDetails.staffNotes = (staffNotes || '').trim();
            franchise.isArchived = false;

            await franchise.save();

            // Notify operator
            if (franchise.operator) {
                const opId = franchise.operator._id || franchise.operator;
                const notif = await Notification.create({
                    recipient: opId,
                    type: 'status_change',
                    title: 'Franchise Cancelled',
                    message: `Your voluntary franchise cancellation request for ${franchise.plateNo} has been finalized by BPLO Staff. Your franchise is now officially cancelled.`,
                    relatedFranchise: franchise._id
                });
                emitToUser(String(opId), 'notification', notif);
                sendPushToUser(opId, {
                    title: 'Franchise Cancelled',
                    message: `Your voluntary cancellation for ${franchise.plateNo} has been finalized.`,
                    url: '/operator-dashboard',
                    type: 'status_change'
                }).catch(() => {});
            }

            await logAudit(req, {
                action: 'FRANCHISE_VOLUNTARILY_CANCELLED_BY_STAFF',
                targetType: 'Franchise',
                targetId: req.params.id,
                details: {
                    plateNo: franchise.plateNo,
                    fullName: franchise.fullName,
                    reason: franchise.cancelReason,
                    staffNotes: staffNotes || ''
                }
            });

            return res.status(200).json({
                message: 'Franchise cancellation successfully finalized.',
                franchise
            });
        } else if (action === 'reject') {
            if (!rejectionReason || !rejectionReason.trim()) {
                return res.status(400).json({ message: 'A rejection reason is required to reject a cancellation request.' });
            }

            // Restore franchise to Active
            franchise.status = 'Active';
            franchise.cancellationDetails = franchise.cancellationDetails || {};
            franchise.cancellationDetails.reviewedBy = req.user?._id;
            franchise.cancellationDetails.reviewedAt = new Date();
            franchise.cancellationDetails.rejectionReason = rejectionReason.trim();
            franchise.cancellationDetails.staffNotes = (staffNotes || '').trim();

            await franchise.save();

            // Notify operator
            if (franchise.operator) {
                const opId = franchise.operator._id || franchise.operator;
                const notif = await Notification.create({
                    recipient: opId,
                    type: 'status_change',
                    title: 'Cancellation Request Rejected',
                    message: `Your cancellation request for ${franchise.plateNo} was rejected by BPLO: "${rejectionReason.trim()}". Your franchise remains Active.`,
                    relatedFranchise: franchise._id
                });
                emitToUser(String(opId), 'notification', notif);
                sendPushToUser(opId, {
                    title: 'Cancellation Request Rejected',
                    message: `Your cancellation request for ${franchise.plateNo} was rejected. Franchise remains Active.`,
                    url: '/operator-dashboard',
                    type: 'status_change'
                }).catch(() => {});
            }

            await logAudit(req, {
                action: 'FRANCHISE_CANCELLATION_REJECTED_BY_STAFF',
                targetType: 'Franchise',
                targetId: req.params.id,
                details: {
                    plateNo: franchise.plateNo,
                    fullName: franchise.fullName,
                    rejectionReason: rejectionReason.trim(),
                    staffNotes: staffNotes || ''
                }
            });

            return res.status(200).json({
                message: 'Cancellation request rejected. Franchise restored to Active.',
                franchise
            });
        } else {
            return res.status(400).json({ message: "Invalid action. Must be 'finalize' or 'reject'." });
        }
    } catch (error) {
        console.error('Error processing franchise cancellation:', error);
        res.status(500).json({ message: 'An internal server error occurred while processing cancellation.' });
    }
};

// Toggle franchise archive status
const toggleArchiveFranchise = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid franchise ID format.' });
        }
        const franchise = await Franchise.findById(req.params.id);
        if (!franchise) return res.status(404).json({ message: 'Franchise not found' });

        const targetState = req.body.isArchived !== undefined ? req.body.isArchived : !franchise.isArchived;
        const newArchiveDate = targetState ? Date.now() : null;
        
        const updatedFranchise = await Franchise.findByIdAndUpdate(
            req.params.id,
            {
                isArchived: targetState,
                archivedAt: newArchiveDate
            },
            { new: true, runValidators: false } 
        );

        await logAudit(req, {
            action: updatedFranchise.isArchived ? 'FRANCHISE_ARCHIVED' : 'FRANCHISE_RESTORED',
            targetType: 'Franchise',
            targetId: req.params.id,
            details: {
                plateNo: updatedFranchise.plateNo,
                fullName: updatedFranchise.fullName
            }
        });

        res.status(200).json({ 
            message: `Franchise successfully ${updatedFranchise.isArchived ? 'archived' : 'restored'}.`, 
            franchise: updatedFranchise 
        });
    } catch (error) {
        res.status(500).json({ error: 'An internal server error occurred' });
    }
};

const revokeFranchise = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid franchise ID format.' });
        }
        const { cancelReason } = req.body;
        const franchise = await Franchise.findById(req.params.id);
        if (!franchise) return res.status(404).json({ message: 'Franchise not found' });

        franchise.status = 'Revoked';
        franchise.cancelReason = cancelReason || 'Revoked by Admin due to violation';

        const files = req.files || {};
        if (files.evidence && files.evidence[0]) {
            franchise.evidenceUrl = files.evidence[0].path;
        }

        await franchise.save();

        await logAudit(req, {
            action: 'FRANCHISE_REVOKED',
            targetType: 'Franchise',
            targetId: req.params.id,
            details: {
                plateNo: franchise.plateNo,
                fullName: franchise.fullName,
                reason: franchise.cancelReason,
                evidenceUrl: franchise.evidenceUrl || ''
            }
        });

        res.status(200).json({
            message: 'Franchise successfully revoked.',
            franchise
        });
    } catch (error) {
        res.status(500).json({ error: 'An internal server error occurred' });
    }
};

const getFranchiseReports = async (req, res) => {
    try {
        const { summary, data } = await FranchiseService.generateReports(req.query);
        res.status(200).json({ summary, data });
    } catch (error) {
        console.error("Report Generation Error:", error);
        res.status(500).json({ error: 'An internal server error occurred' });
    }
};

const checkUniqueFranchiseField = async (req, res) => {
    try {
        const { field, value, currentFranchiseId, excludeId } = req.query;
        const allowedFields = ['plateNo', 'motorNo', 'chassisNo'];
        if (!field || !allowedFields.includes(field)) {
            return res.status(400).json({ message: 'Invalid field specified for uniqueness check.' });
        }
        if (!value || !value.trim()) {
            return res.status(200).json({ isUnique: true, unique: true, exists: false, field, value: '' });
        }

        const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const query = {
            [field]: { $regex: new RegExp('^' + escapeRegex(value.trim()) + '$', 'i') },
            isArchived: { $ne: true },
            status: { $nin: ['Cancelled'] }
        };

        const targetExclude = currentFranchiseId || excludeId;
        if (targetExclude) {
            query._id = { $ne: targetExclude };
        }

        const existing = await Franchise.findOne(query).select('plateNo motorNo chassisNo status');
        res.status(200).json({
            isUnique: !existing,
            unique: !existing,
            exists: !!existing,
            field,
            value: value.trim(),
            existingStatus: existing ? existing.status : null,
            message: existing ? `This ${field === 'plateNo' ? 'Plate Number' : field === 'motorNo' ? 'Motor Number' : 'Chassis Number'} is already registered to another unit.` : 'Available'
        });
    } catch (error) {
        console.error('Error checking unique franchise field:', error);
        res.status(500).json({ message: 'Server error checking field uniqueness.' });
    }
};

const getFranchiseById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid franchise ID format.' });
        }
        const role = String(req.user?.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
        if (role === 'cashier') {
            const paymentRecord = await Franchise.findOne({
                _id: req.params.id,
                $or: [PAYABLE_PREDICATE, { paymentStatus: 'Paid' }, { 'paymentHistory.0': { $exists: true } }]
            }).select(CASHIER_FRANCHISE_PROJECTION).populate('operator', 'name').lean();
            if (!paymentRecord) return res.status(404).json({ message: 'Payment record not found.' });
            return res.json(paymentRecord);
        }

        const franchise = await Franchise.findById(req.params.id).populate('operator', 'name address contact');
        if (!franchise) return res.status(404).json({ message: 'Franchise not found' });

        // IDOR Protection: verify that the requester owns the record or is BPLO staff
        const isBploStaff = role === 'bplo_staff';
        const isOwner = franchise.operator && (
            (franchise.operator._id && franchise.operator._id.toString() === req.user._id.toString()) ||
            franchise.operator.toString() === req.user._id.toString()
        );

        if (!isBploStaff && !isOwner) {
            return res.status(403).json({ message: 'ACCESS DENIED: You are not authorized to view this franchise record.' });
        }

        res.status(200).json(franchise);
    } catch (error) {
        res.status(500).json({ error: 'An internal server error occurred' });
    }
};

/**
 * Pre-payment record check: violations (revocations), prior franchises and
 * rejected applications tied to the same operator account, name, or unit.
 * Shown to the admin before the application is sent to the cashier.
 */
const getFranchiseRecordCheck = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid franchise ID format.' });
        }
        const franchise = await Franchise.findById(req.params.id)
            .select('operator fullName plateNo chassisNo motorNo mtopNo status cancelReason updatedAt applicationType todaName barangay address registeredOwner isOperatorDriver driverName cedulaFullName aiScannedData aiVerification');
        if (!franchise) return res.status(404).json({ message: 'Franchise not found' });

        const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const exact = (v) => ({ $regex: new RegExp('^' + escapeRegex(String(v).trim()) + '$', 'i') });

        // Filter out generic placeholder values to prevent cross-applicant collisions
        const PLACEHOLDER_STRINGS = new Set(['N/A', 'NONE', 'PENDING', 'FOR REGISTRATION', 'TEMPORARY', '0', '0000', '—', '-', 'NO RECORD', 'UNREGISTERED', 'NULL', 'UNDEFINED']);
        const isValidIdentifier = (v) => {
            if (!v || typeof v !== 'string') return false;
            const clean = v.trim().toUpperCase();
            return clean.length >= 3 && !PLACEHOLDER_STRINGS.has(clean);
        };

        const matchers = [];
        if (franchise.operator) matchers.push({ operator: franchise.operator });
        if (isValidIdentifier(franchise.fullName)) matchers.push({ fullName: exact(franchise.fullName) });
        if (isValidIdentifier(franchise.plateNo)) matchers.push({ plateNo: exact(franchise.plateNo) });
        if (isValidIdentifier(franchise.chassisNo)) matchers.push({ chassisNo: exact(franchise.chassisNo) });
        if (isValidIdentifier(franchise.motorNo)) matchers.push({ motorNo: exact(franchise.motorNo) });

        // M8: Remove arbitrary 50-record cap so no prior violations or franchises are silently missed
        const related = matchers.length
            ? await Franchise.find({ _id: { $ne: franchise._id }, $or: matchers })
                .select('operator fullName plateNo chassisNo motorNo mtopNo status cancelReason applicationType dateApplied approvalDate updatedAt evidenceUrl')
                .sort({ updatedAt: -1 })
                .lean()
            : [];

        const normId = (v) => String(v || '').trim().toUpperCase();
        const isOwnerMatched = (f) => Boolean(
            franchise.operator && f.operator && String(f.operator) === String(franchise.operator)
        );
        const isUnitMatched = (f) => Boolean(
            (isValidIdentifier(franchise.plateNo) && normId(f.plateNo) === normId(franchise.plateNo)) ||
            (isValidIdentifier(franchise.chassisNo) && normId(f.chassisNo) === normId(franchise.chassisNo)) ||
            (isValidIdentifier(franchise.motorNo) && normId(f.motorNo) === normId(franchise.motorNo))
        );

        const verifiedRelated = related.filter(f => isOwnerMatched(f) || isUnitMatched(f));
        const nameOnlyRelated = related.filter(f => !isOwnerMatched(f) && !isUnitMatched(f));

        // M8: Query actual Violation collection directly (matching operator, franchiseId, or plateNo) without a 50-record cap
        const allVerifiedFranchiseIds = [franchise._id, ...verifiedRelated.map(f => f._id)];
        const violationMatchers = [
            { franchise: { $in: allVerifiedFranchiseIds } }
        ];
        if (franchise.operator) {
            violationMatchers.push({ operator: franchise.operator });
        }
        if (isValidIdentifier(franchise.plateNo)) {
            violationMatchers.push({ plateNo: exact(franchise.plateNo) });
        }

        const violationDocs = await Violation.find({ $or: violationMatchers })
            .sort({ createdAt: -1 })
            .lean();

        const normalizedViolationRecords = violationDocs.map((v) => ({
            _id: v._id,
            franchise: v.franchise,
            operator: v.operator,
            plateNo: v.plateNo,
            bodyNumber: v.bodyNumber || '',
            driverName: v.driverName || '',
            violationType: v.violationType,
            violationCode: v.violationCode || 'OTHER',
            severity: v.severity || 'Medium',
            isGrave: Boolean(v.isGrave),
            offenseNumber: v.offenseNumber || 1,
            sanction: v.sanction || null,
            status: v.status || 'Active',
            remarks: v.remarks || '',
            evidenceUrl: v.evidenceUrl || '',
            recordedByName: v.recordedByName || 'BPLO Staff',
            settledAt: v.settledAt || null,
            settledNotes: v.settledNotes || '',
            createdAt: v.createdAt,
            updatedAt: v.updatedAt || v.createdAt,
            source: 'violation',
            // Backward-compatible display text for legacy UI components
            cancelReason: v.remarks
                ? `${v.violationType}: ${v.remarks}`
                : `${v.violationType}${v.sanction?.type ? ` (${v.sanction.type})` : ''}`
        }));

        const allVerifiedFranchisesForStanding = [
            ...verifiedRelated,
            ...(['Revoked', 'Suspended', 'Active - Under Warning'].includes(franchise.status) ? [franchise] : [])
        ];

        const revokedFranchises = allVerifiedFranchisesForStanding.filter(f => f.status === 'Revoked');
        const suspendedFranchises = allVerifiedFranchisesForStanding.filter(f => f.status === 'Suspended');
        const warningFranchises = allVerifiedFranchisesForStanding.filter(f => f.status === 'Active - Under Warning');

        const violationRevocationFranchiseIds = new Set(
            violationDocs
                .filter(v => v.sanction?.resultingStatus === 'Revoked' || v.sanction?.type === 'Revocation')
                .map(v => String(v.franchise))
        );
        const violationSuspensionFranchiseIds = new Set(
            violationDocs
                .filter(v => v.sanction?.resultingStatus === 'Suspended' || v.sanction?.type === 'Suspension')
                .map(v => String(v.franchise))
        );
        const violationWarningFranchiseIds = new Set(
            violationDocs
                .filter(v => v.sanction?.resultingStatus === 'Active - Under Warning' || v.sanction?.type === 'Warning')
                .map(v => String(v.franchise))
        );

        const legacyRevokedFranchises = revokedFranchises
            .filter(f => !violationRevocationFranchiseIds.has(String(f._id)))
            .map(f => ({ ...f, source: 'franchise_revocation' }));
        const legacySuspendedFranchises = suspendedFranchises.filter(
            f => !violationSuspensionFranchiseIds.has(String(f._id))
        );
        const legacyWarningFranchises = warningFranchises.filter(
            f => !violationWarningFranchiseIds.has(String(f._id))
        );

        const violations = [...normalizedViolationRecords, ...legacyRevokedFranchises];
        const totalViolations = violations.length;
        const unsettledViolations = violationDocs.filter(v => v.status === 'Active').length;
        const revokedCount = violationDocs.filter(
            v => v.sanction?.resultingStatus === 'Revoked' || v.sanction?.type === 'Revocation'
        ).length + legacyRevokedFranchises.length;
        const suspendedCount = violationDocs.filter(
            v => v.sanction?.resultingStatus === 'Suspended' || v.sanction?.type === 'Suspension'
        ).length + legacySuspendedFranchises.length;
        const warningCount = violationDocs.filter(
            v => v.sanction?.resultingStatus === 'Active - Under Warning' || v.sanction?.type === 'Warning'
        ).length + legacyWarningFranchises.length;

        const nameMatchWarnings = nameOnlyRelated.filter(f => ['Revoked', 'Suspended', 'Active - Under Warning'].includes(f.status));
        const rejected = verifiedRelated.filter(f => f.status === 'Cancelled');
        const pastFranchises = verifiedRelated.filter(f => ['Active', 'Active - Under Warning', 'Suspended', 'Expired', 'Revoked'].includes(f.status));
        const activeUnits = verifiedRelated.filter(f => ['Active', 'Active - Under Warning'].includes(f.status));

        const appType = String(franchise.applicationType || 'New');
        const isRenewal = /renew/i.test(appType) || pastFranchises.length > 0;

        // 1. Verify applicant against official TODA association roster (Approved TodaSubmission masterlists AND TodaRoster)
        let todaStatus = 'non_toda';
        let todaRosterMessage = '';
        let todaMatchedMember = null;
        let todaApprovedCount = 0;
        let inRoster = false;

        const todaEntry = resolveTodaAssociation(franchise.todaName);
        if (franchise.todaName && todaEntry?.id !== 'NON-TODA') {
            const TodaRoster = require('../models/todaModel');
            const todaRegex = todaEntry ? todaAssociationPattern(todaEntry) : null;
            
            // Query Approved masterlists and active TodaRoster records for this TODA
            const [approvedRosters, directRosterEntries] = todaRegex ? await Promise.all([
                TodaSubmission.find({
                    status: { $in: ['Approved', 'Verified', 'Active'] },
                    todaAssociation: todaRegex
                }).select('extractedMembers todaAssociation fileName createdAt'),
                TodaRoster.find({
                    todaAssociation: todaRegex,
                    status: { $ne: 'Inactive' }
                }).lean().catch(() => [])
            ]) : [[], []];

            todaApprovedCount = approvedRosters.length + (directRosterEntries.length > 0 ? 1 : 0);

            if (approvedRosters.length === 0 && directRosterEntries.length === 0) {
                // No approved roster has been uploaded by the TODA President yet
                todaStatus = 'no_roster_on_file';
                todaRosterMessage = `No approved roster on file for ${franchise.todaName}. (Awaiting President masterlist submission)`;
            } else {
                const applicantName = (franchise.fullName || '').trim();
                const applicantPlate = (franchise.plateNo || '').trim().toUpperCase();
                let docMatch = false;

                if (directRosterEntries.length > 0) {
                    const foundDirect = directRosterEntries.find(r =>
                        (applicantName && isNameMatch(applicantName, r.operatorName)) ||
                        (applicantPlate && r.plateNo && r.plateNo.trim().toUpperCase() === applicantPlate)
                    );
                    if (foundDirect) {
                        docMatch = true;
                        inRoster = true;
                        todaMatchedMember = foundDirect.operatorName;
                    }
                }

                if (!docMatch && applicantName) {
                    for (const r of approvedRosters) {
                        if (Array.isArray(r.extractedMembers)) {
                            const found = r.extractedMembers.find(m => isNameMatch(applicantName, m?.name || m?.operatorName));
                            if (found) {
                                docMatch = true;
                                inRoster = true;
                                todaMatchedMember = found.name || found.operatorName;
                                break;
                            }
                        }
                    }
                }

                if (docMatch) {
                    todaStatus = 'verified_member';
                    todaRosterMessage = `Verified in official ${franchise.todaName} roster (Matched: ${todaMatchedMember})`;
                } else {
                    todaStatus = 'not_in_roster';
                    todaRosterMessage = `Not found in official ${franchise.todaName} roster (${todaApprovedCount} masterlist record/s on file)`;
                }
            }
        }

        // 2. Validate TODA Jurisdiction against Applicant Barangay / Address
        const applicantBarangay = franchise.barangay || franchise.address || '';
        const jurisdictionCheck = validateTodaJurisdiction(franchise.todaName, applicantBarangay);
        const jurisdictionStatus = (!franchise.todaName || franchise.todaName === 'NON-TODA')
            ? 'non_toda'
            : (jurisdictionCheck.isMatch ? 'match' : 'mismatch');

        // 3. Document Name Cross-Match Analysis
        const applicantClean = (franchise.fullName || '').trim();
        const crOwner = (franchise.registeredOwner || '').trim();
        const isCrOwnerMatch = crOwner ? isNameMatch(applicantClean, crOwner) : true;

        const expectedDriverName = (franchise.isOperatorDriver ? applicantClean : (franchise.driverName || '')).trim();
        const driverLicenseScannedName = franchise.aiScannedData?.license?.driverName || franchise.aiVerification?.documents?.license?.extracted?.driverName || '';
        const isDriverLicenseMatch = driverLicenseScannedName ? isNameMatch(expectedDriverName, driverLicenseScannedName) : true;

        const cedulaTaxpayer = franchise.cedulaFullName || franchise.aiScannedData?.cedula?.fullName || '';
        const isCedulaMatch = cedulaTaxpayer ? isNameMatch(applicantClean, cedulaTaxpayer) : true;

        const nameCrossMatch = {
            applicantName: applicantClean,
            crOwner: crOwner || null,
            isCrOwnerMatch,
            expectedDriverName,
            driverLicenseScannedName: driverLicenseScannedName || null,
            isDriverLicenseMatch,
            cedulaTaxpayer: cedulaTaxpayer || null,
            isCedulaMatch
        };

        res.status(200).json({
            applicationType: isRenewal ? 'Renewal' : 'New',
            violationCount: totalViolations,
            totalViolations,
            unsettledViolations,
            revokedCount,
            suspendedCount,
            warningCount,
            hasViolations: totalViolations > 0 || revokedCount > 0 || suspendedCount > 0 || warningCount > 0,
            violations,
            nameMatchWarnings,
            rejected,
            pastFranchises,
            activeUnitsCount: activeUnits.length,
            inRoster,
            todaStatus,
            todaName: franchise.todaName || 'NON-TODA',
            todaRosterMessage,
            todaMatchedMember,
            todaApprovedCount,
            jurisdictionStatus,
            authorizedBarangays: jurisdictionCheck.authorizedBarangays || [],
            jurisdictionWarning: jurisdictionCheck.warning,
            nameCrossMatch
        });
    } catch (error) {
        console.error('Record check error:', error);
        res.status(500).json({ error: 'An internal server error occurred' });
    }
};

const getCashierQueue = async (req, res) => {
    try {
        const { q, status } = req.query;
        const SystemSettings = require('../models/systemSettingsModel');
        const settings = await SystemSettings.findOne().sort({ updatedAt: -1, createdAt: -1 }).lean().catch(() => null);
        const franchiseFee = Number(settings?.franchiseFee) > 0 ? Number(settings.franchiseFee) : 500;

        // Cashier requests can narrow the queue without broadening payable eligibility.
        const pendingQueue = !status || status === PAYABLE_PREDICATE.status
            ? await Franchise.find(PAYABLE_PREDICATE)
                .select(CASHIER_FRANCHISE_PROJECTION)
                .populate('operator', 'name')
                .sort({ updatedAt: -1 })
                .lean()
            : [];

        // 2. Durable PaymentLedger (sorted newest first) + merge/dedupe legacy paid franchises & paymentHistory by officialReceiptNo (M11)
        const [ledgerDocs, legacyPaidFranchises] = await Promise.all([
            PaymentLedger.find().sort({ paymentDate: -1, createdAt: -1 }).lean(),
            Franchise.find({
                $or: [
                    { paymentStatus: 'Paid' },
                    { 'paymentHistory.0': { $exists: true } }
                ]
            })
                .populate('operator', 'name contact address')
                .lean()
        ]);

        const seenOrs = new Set();
        const mergedLedger = [];

        const normalizeLedgerItem = (raw) => {
            const collectorName = raw.processedByName || raw.cashierName || 'Municipal Cashier';
            const applicant = raw.applicantName || raw.fullName || '';
            const toda = raw.todaAssociation || raw.todaName || '';
            return {
                _id: raw._id,
                franchiseId: raw.franchiseId || raw._id,
                ownerId: raw.ownerId || null,
                applicantName: applicant,
                fullName: applicant,
                payerName: raw.payerName || applicant,
                plateNo: raw.plateNo || '',
                mtopNo: raw.mtopNo || '',
                todaAssociation: toda,
                todaName: toda,
                applicationType: raw.applicationType || 'New',
                officialReceiptNo: raw.officialReceiptNo || '',
                amountPaid: Number(raw.amountPaid) || 0,
                paymentMethod: raw.paymentMethod || 'Cash',
                paymentDate: raw.paymentDate || raw.createdAt || null,
                paymentRemarks: raw.paymentRemarks || '',
                processedBy: raw.processedBy || raw.paidByCashier || null,
                processedByName: collectorName,
                cashierName: collectorName,
                paymentStatus: 'Paid',
                status: raw.franchiseStatus || raw.status || 'For Signing',
                source: raw.source || 'ledger'
            };
        };

        for (const doc of ledgerDocs) {
            const orKey = String(doc.officialReceiptNo || '').trim().toUpperCase();
            if (orKey) seenOrs.add(orKey);
            mergedLedger.push(normalizeLedgerItem({ ...doc, source: 'ledger' }));
        }

        for (const f of legacyPaidFranchises) {
            if (f.paymentStatus === 'Paid') {
                const orKey = String(f.officialReceiptNo || '').trim().toUpperCase();
                const dedupeKey = orKey || `LEGACY_FRANCHISE_${f._id}`;
                if (!seenOrs.has(dedupeKey)) {
                    seenOrs.add(dedupeKey);
                    mergedLedger.push(normalizeLedgerItem({
                        _id: f._id,
                        franchiseId: f._id,
                        ownerId: f.operator?._id || f.operator || null,
                        applicantName: f.fullName || '',
                        payerName: f.payerName || f.fullName || '',
                        plateNo: f.plateNo || '',
                        mtopNo: f.mtopNo || '',
                        todaAssociation: f.todaName || '',
                        applicationType: f.applicationType || 'New',
                        officialReceiptNo: f.officialReceiptNo || '',
                        amountPaid: f.amountPaid || 0,
                        paymentMethod: f.paymentMethod || 'Cash',
                        paymentDate: f.paymentDate || f.updatedAt || f.createdAt || null,
                        paymentRemarks: f.paymentRemarks || '',
                        processedBy: f.paidByCashier || null,
                        processedByName: f.cashierName || 'Municipal Cashier',
                        franchiseStatus: f.status,
                        source: 'legacy_franchise'
                    }));
                }
            }

            if (Array.isArray(f.paymentHistory)) {
                for (let idx = 0; idx < f.paymentHistory.length; idx++) {
                    const hist = f.paymentHistory[idx];
                    if (!hist) continue;
                    const orKey = String(hist.officialReceiptNo || '').trim().toUpperCase();
                    if (!orKey || seenOrs.has(orKey)) continue;
                    seenOrs.add(orKey);
                    mergedLedger.push(normalizeLedgerItem({
                        _id: hist._id || `${f._id}_hist_${idx}`,
                        franchiseId: f._id,
                        ownerId: f.operator?._id || f.operator || null,
                        applicantName: f.fullName || '',
                        payerName: hist.payerName || f.fullName || '',
                        plateNo: f.plateNo || '',
                        mtopNo: hist.mtopNo || f.mtopNo || '',
                        todaAssociation: f.todaName || '',
                        applicationType: f.applicationType || 'Renewal',
                        officialReceiptNo: hist.officialReceiptNo || '',
                        amountPaid: hist.amountPaid || 0,
                        paymentMethod: hist.paymentMethod || 'Cash',
                        paymentDate: hist.paymentDate || hist.archivedAt || f.updatedAt || null,
                        paymentRemarks: hist.paymentRemarks || '',
                        processedBy: hist.paidByCashier || null,
                        processedByName: hist.cashierName || 'Municipal Cashier',
                        franchiseStatus: f.status,
                        source: 'legacy_history'
                    }));
                }
            }
        }

        mergedLedger.sort((a, b) => new Date(b.paymentDate || 0) - new Date(a.paymentDate || 0));

        let filteredPending = pendingQueue;
        let filteredLedger = mergedLedger;

        if (q && q.trim()) {
            const search = q.trim().toLowerCase();
            const matchesSearch = (item) => (
                (item.plateNo && item.plateNo.toLowerCase().includes(search)) ||
                (item.fullName && item.fullName.toLowerCase().includes(search)) ||
                (item.applicantName && item.applicantName.toLowerCase().includes(search)) ||
                (item.payerName && item.payerName.toLowerCase().includes(search)) ||
                (item.mtopNo && item.mtopNo.toLowerCase().includes(search)) ||
                (item.todaName && item.todaName.toLowerCase().includes(search)) ||
                (item.todaAssociation && item.todaAssociation.toLowerCase().includes(search)) ||
                (item.chassisNo && item.chassisNo.toLowerCase().includes(search)) ||
                (item.motorNo && item.motorNo.toLowerCase().includes(search)) ||
                (item.officialReceiptNo && item.officialReceiptNo.toLowerCase().includes(search)) ||
                (item.processedByName && item.processedByName.toLowerCase().includes(search)) ||
                (item._id && String(item._id).toLowerCase().includes(search))
            );
            filteredPending = pendingQueue.filter(matchesSearch);
            filteredLedger = mergedLedger.filter(matchesSearch);
        }

        res.status(200).json({
            pendingPayment: filteredPending,
            pendingQueue: filteredPending,
            recentlyPaid: filteredLedger,
            paymentLedger: filteredLedger,
            franchiseFee,
            all: [...filteredPending, ...filteredLedger]
        });
    } catch (error) {
        console.error('Error fetching cashier queue:', error);
        res.status(500).json({ message: 'Failed to fetch cashier queue' });
    }
};

const processCashierPayment = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid franchise ID format.' });
        }
        const { officialReceiptNo, payerName, amountPaid, paymentMethod, paymentRemarks } = req.body;
        if (!officialReceiptNo || !officialReceiptNo.trim()) {
            return res.status(400).json({ message: 'Official Receipt (OR) Number is required.' });
        }
        const cleanOrNo = officialReceiptNo.trim().toUpperCase();

        const existing = await Franchise.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: 'Franchise record not found.' });
        }

        if (existing.paymentStatus === 'Paid') {
            return res.status(409).json({ message: 'Franchise payment has already been recorded and processed.' });
        }

        if (existing.isArchived || existing.status !== 'For Payment') {
            return res.status(400).json({
                message: `Cannot process payment: Franchise application must be active and in 'For Payment' status (current status: '${existing.isArchived ? 'Archived' : existing.status}').`
            });
        }

        const [duplicateOr, duplicateLedgerOr] = await Promise.all([
            Franchise.findOne({
                $or: [
                    { _id: { $ne: req.params.id }, officialReceiptNo: cleanOrNo },
                    { 'paymentHistory.officialReceiptNo': cleanOrNo }
                ]
            }).select('_id').lean(),
            PaymentLedger.findOne({ officialReceiptNo: cleanOrNo }).select('_id').lean()
        ]);
        if (duplicateOr || duplicateLedgerOr) {
            return res.status(409).json({
                message: `Official Receipt Number '${cleanOrNo}' is already recorded on another franchise or historical payment.`
            });
        }

        const SystemSettings = require('../models/systemSettingsModel');
        const settings = await SystemSettings.findOne().sort({ updatedAt: -1, createdAt: -1 }).lean().catch(() => null);
        const expectedFee = Number(settings?.franchiseFee) > 0 ? Number(settings.franchiseFee) : 500;

        let validAmount = expectedFee;
        if (amountPaid !== undefined && amountPaid !== null && amountPaid !== '') {
            const submittedAmount = Number(amountPaid);
            if (!Number.isFinite(submittedAmount) || submittedAmount <= 0) {
                return res.status(400).json({ message: 'Valid payment amount is required.' });
            }
            if (submittedAmount !== expectedFee) {
                return res.status(400).json({
                    message: `Payment amount (₱${submittedAmount}) does not match the official municipal franchise fee (₱${expectedFee}).`
                });
            }
            validAmount = submittedAmount;
        }

        const resolvedMethod = paymentMethod ? String(paymentMethod).trim() : 'Cash';
        if (!['Cash', 'GCash', 'Landbank'].includes(resolvedMethod)) {
            return res.status(400).json({ message: 'Invalid payment method specified.' });
        }

        const now = new Date();
        const resolvedPayerName = (payerName && payerName.trim()) ? payerName.trim().toUpperCase() : existing.fullName;
        const cashierDisplayName = req.user.name || 'Municipal Cashier';

        const paymentSetFields = {
            paymentStatus: 'Paid',
            officialReceiptNo: cleanOrNo,
            payerName: resolvedPayerName,
            amountPaid: validAmount,
            paymentMethod: resolvedMethod,
            paymentDate: now,
            paidByCashier: req.user._id,
            cashierName: cashierDisplayName,
            paymentRemarks: paymentRemarks || '',
            status: 'For Signing'
        };

        // M10: Assign canonical mtopNo automatically when moving into For Signing if not yet assigned
        const priorMtopNo = existing.mtopNo || '';
        const needsCanonicalMtop = !priorMtopNo;
        let franchise = null;

        if (needsCanonicalMtop) {
            franchise = await executeAtomicUpdateWithMtop(
                { _id: req.params.id, ...PAYABLE_PREDICATE },
                paymentSetFields,
                { populateOperator: 'name contact' }
            );
        } else {
            franchise = await Franchise.findOneAndUpdate(
                { _id: req.params.id, ...PAYABLE_PREDICATE },
                { $set: paymentSetFields },
                { returnDocument: 'after' }
            ).populate('operator', 'name contact');
        }

        if (!franchise) {
            return res.status(409).json({ message: 'Franchise payment has already been recorded and processed.' });
        }

        // M11: Persist permanent PaymentLedger record alongside the atomic franchise payment update
        let ledgerEntry = null;
        try {
            ledgerEntry = await PaymentLedger.create({
                franchiseId: franchise._id,
                ownerId: franchise.operator?._id || franchise.operator || null,
                applicantName: franchise.fullName || '',
                payerName: franchise.payerName || resolvedPayerName,
                plateNo: franchise.plateNo || '',
                mtopNo: franchise.mtopNo || '',
                todaAssociation: franchise.todaName || '',
                applicationType: franchise.applicationType || 'New',
                officialReceiptNo: franchise.officialReceiptNo,
                amountPaid: franchise.amountPaid,
                paymentMethod: franchise.paymentMethod || resolvedMethod,
                paymentDate: franchise.paymentDate || now,
                paymentRemarks: franchise.paymentRemarks || '',
                processedBy: req.user._id,
                processedByName: cashierDisplayName
            });
        } catch (ledgerErr) {
            // Compensate franchise payment fields so Franchise and PaymentLedger never diverge
            await Franchise.findByIdAndUpdate(franchise._id, {
                $set: {
                    paymentStatus: 'Unpaid',
                    officialReceiptNo: '',
                    payerName: '',
                    amountPaid: 0,
                    paymentMethod: '',
                    paymentDate: null,
                    paidByCashier: null,
                    cashierName: '',
                    paymentRemarks: '',
                    status: 'For Payment',
                    ...(needsCanonicalMtop ? { mtopNo: priorMtopNo } : {})
                }
            }).catch((rbErr) => {
                console.error('[CashierPayment] CRITICAL: Rollback failed after PaymentLedger error:', rbErr.message);
            });
            throw ledgerErr;
        }

        // Notify operator of official receipt
        if (franchise.operator) {
            const operatorId = franchise.operator._id || franchise.operator;
            const notifTitle = 'Payment Confirmed by Municipal Cashier!';
            const notifMessage = `Your payment of ₱${franchise.amountPaid} has been confirmed under Official Receipt No. ${franchise.officialReceiptNo} (Payer: ${franchise.payerName}). Your application is now marked as Paid and queued For Signing by Municipal Officials.`;

            const notification = await Notification.create({
                recipient: operatorId,
                type: 'status_change',
                title: notifTitle,
                message: notifMessage,
                relatedFranchise: franchise._id
            });
            emitToUser(String(operatorId), 'notification', notification);

            sendPushToUser(operatorId, {
                title: notifTitle,
                message: notifMessage,
                url: '/operator-dashboard',
                type: 'approval'
            }).catch(err => console.error('Push delivery failed:', err.message));
        }

        await logAudit(req, {
            action: 'CASHIER_PAYMENT_PROCESSED',
            targetType: 'Franchise',
            targetId: franchise._id,
            details: {
                plateNo: franchise.plateNo,
                mtopNo: franchise.mtopNo,
                officialReceiptNo: franchise.officialReceiptNo,
                amountPaid: franchise.amountPaid,
                cashier: cashierDisplayName,
                ledgerId: ledgerEntry ? String(ledgerEntry._id) : ''
            }
        });

        res.status(200).json({
            message: 'Payment recorded successfully under Official Receipt No. ' + franchise.officialReceiptNo,
            franchise: Object.fromEntries(
                CASHIER_FRANCHISE_FIELDS.filter(field => field !== 'operator' && franchise[field] !== undefined)
                    .map(field => [field, franchise[field]])
            ),
            ledgerEntry
        });
    } catch (error) {
        console.error('Error processing cashier payment:', error);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Official Receipt Number is already recorded on another franchise.' });
        }
        res.status(500).json({ message: 'Failed to process cashier payment' });
    }
};

const scanDocument = async (req, res) => {
    try {
        const { docType } = req.body;
        const file = req.file;

        if (!file && !req.body.fileUrl && !req.body.base64) {
            return res.status(400).json({ success: false, message: 'No file received for document scanning.' });
        }

        const fileUrl = file ? (file.path || file.secure_url || file.url) : req.body.fileUrl;
        let base64Data = null;
        let mimeType = (file && file.mimetype) || req.body.mimeType || 'image/jpeg';

        // Direct memory buffer from memoryUpload has highest fidelity
        if (file && file.buffer) {
            base64Data = file.buffer.toString('base64');
            mimeType = file.mimetype || 'image/jpeg';
        } else if (req.body.base64 && typeof req.body.base64 === 'string') {
            base64Data = req.body.base64;
            if (base64Data.includes(',')) {
                const parts = base64Data.split(',');
                const match = parts[0].match(/:(.*?);/);
                if (match) mimeType = match[1];
                base64Data = parts[1];
            }
        }

        if (!base64Data && fileUrl) {
            const { fetchImageAsBase64 } = require('../services/documentVerificationService');
            const fetched = await fetchImageAsBase64(fileUrl);
            if (fetched) {
                base64Data = fetched.base64Data;
                mimeType = fetched.mimeType;
            }
        }

        if (!base64Data) {
            console.warn('[scanDocument] No readable base64 data could be extracted for docType:', docType);
            return res.status(200).json({
                success: false,
                fileUrl,
                message: 'Document uploaded, but the image could not be processed.'
            });
        }

        console.log(`[scanDocument] Received scan request for "${docType}" (bytes: ${base64Data.length}, mime: ${mimeType})`);

        const { extractWithGemini } = require('../services/documentVerificationService');

        let extracted = null;
        if (process.env.GEMINI_API_KEY) {
            try {
                extracted = await extractWithGemini(base64Data, mimeType, docType);
            } catch (err) {
                console.warn('[scanDocument] Gemini extraction error:', err.message);
            }
        } else {
            console.warn('[scanDocument] GEMINI_API_KEY is not defined in environment variables. Running fallback OCR engine...');
            try {
                extracted = await extractWithGemini(base64Data, mimeType, docType);
            } catch (err) {
                console.warn('[scanDocument] Fallback OCR extraction error:', err.message);
            }
        }

        console.log(`[scanDocument] Extraction completed for ${docType} (valid: ${Boolean(extracted && extracted.isValidDocument !== false)})`);

        // If extraction returned valid extracted fields (and not explicitly marked as invalid)
        if (extracted && extracted.isValidDocument !== false && extracted.isExpectedDocumentType !== false) {
            return res.status(200).json({
                success: true,
                fileUrl,
                docType,
                data: extracted
            });
        }

        // Graceful non-blocking fallback: Document remains attached, operator enters details manually
        const manualNotice = (extracted && extracted.message)
            || 'Hindi awtomatikong na-scan ang dokumento. Kailangan mong i-manual o i-type ang mga detalye (Plate No, Engine No, Chassis No) sa mga kahon sa ibaba.';

        return res.status(200).json({
            success: false,
            fileUrl,
            docType,
            needsManual: true,
            message: manualNotice
        });
    } catch (error) {
        console.error('Error in scanDocument:', error);
        return res.status(200).json({
            success: false,
            message: 'AI document scanning service is temporarily unavailable. You can enter details manually.'
        });
    }
};

const checkTodaMemberStatus = async (req, res) => {
    try {
        const requestedToda = req.query.todaName || req.query.toda || '';
        const suppliedToda = typeof requestedToda === 'string' ? requestedToda.trim() : requestedToda;
        const todaEntry = resolveTodaAssociation(suppliedToda);
        if (suppliedToda && !todaEntry) {
            return res.status(400).json({ message: 'Select an official TODA association.' });
        }
        const todaName = todaEntry?.id || 'NON-TODA';
        const applicantName = (req.query.name || req.query.fullName || '').trim();
        const barangay = (req.query.barangay || req.query.address || '').trim();

        if (todaName === 'NON-TODA') {
            return res.json({
                todaStatus: 'non_toda',
                isVerified: false,
                todaName,
                jurisdictionStatus: 'non_toda',
                jurisdictionWarning: '',
                authorizedTodas: [],
                message: 'Non-TODA association selected.'
            });
        }

        // Validate jurisdiction against applicant barangay
        const jurisdictionCheck = validateTodaJurisdiction(todaName, barangay);
        const jurisdictionStatus = !barangay ? 'unspecified' : (jurisdictionCheck.isMatch ? 'match' : 'mismatch');
        const jurisdictionWarning = jurisdictionCheck.warning || '';

        const todaRegex = todaAssociationPattern(todaEntry);
        const plateNo = (req.query.plateNo || req.query.plateNumber || '').trim();

        const TodaRoster = require('../models/todaModel');
        const [approvedRosters, officialRosterDocs] = await Promise.all([
            TodaSubmission.find({
                status: { $in: ['Approved', 'Verified', 'Active'] },
                todaAssociation: todaRegex
            }).select('extractedMembers todaAssociation fileName createdAt').lean(),
            TodaRoster.find({
                todaAssociation: todaRegex,
                status: { $ne: 'Inactive' }
            }).select('operatorName bodyNumber plateNo todaAssociation status').lean().catch(() => [])
        ]);

        if (approvedRosters.length === 0 && (!officialRosterDocs || officialRosterDocs.length === 0)) {
            return res.json({
                todaStatus: 'no_roster_on_file',
                isVerified: false,
                todaName,
                jurisdictionStatus,
                jurisdictionWarning,
                authorizedTodas: jurisdictionCheck.authorizedTodas || [],
                message: `No approved roster on file for ${todaName}. (Awaiting President masterlist submission)`
            });
        }

        if (!applicantName && !plateNo) {
            return res.json({
                todaStatus: 'pending_name',
                isVerified: false,
                todaName,
                jurisdictionStatus,
                jurisdictionWarning,
                authorizedTodas: jurisdictionCheck.authorizedTodas || [],
                message: `Approved masterlist on file for ${todaName}. Enter full name to verify membership.`
            });
        }

        let docMatch = false;
        let matchedMember = null;
        let matchedPlateNo = '';
        let matchedBodyNumber = '';

        for (const r of (officialRosterDocs || [])) {
            if (r.operatorName) {
                const nameMatches = applicantName && isNameMatch(applicantName, r.operatorName);
                const plateMatches = plateNo && r.plateNo && r.plateNo.trim().toUpperCase() === plateNo.toUpperCase();
                if (nameMatches || plateMatches) {
                    docMatch = true;
                    matchedMember = r.operatorName;
                    matchedPlateNo = r.plateNo || '';
                    matchedBodyNumber = r.bodyNumber || '';
                    break;
                }
            } else if (Array.isArray(r.members)) {
                const found = r.members.find(m =>
                    (applicantName && isNameMatch(applicantName, m?.fullName || m?.name || m?.operatorName)) ||
                    (plateNo && (m?.plateNo || m?.plateNumber || '').trim().toUpperCase() === plateNo.toUpperCase())
                );
                if (found) {
                    docMatch = true;
                    matchedMember = found.fullName || found.name || found.operatorName;
                    matchedPlateNo = found.plateNumber || found.plateNo || '';
                    matchedBodyNumber = found.bodyNumber || '';
                    break;
                }
            }
        }

        if (!docMatch) {
            for (const r of approvedRosters) {
                if (Array.isArray(r.extractedMembers)) {
                    const found = r.extractedMembers.find(m =>
                        (applicantName && isNameMatch(applicantName, m?.name || m?.operatorName)) ||
                        (plateNo && (m?.plateNo || m?.plateNumber || '').trim().toUpperCase() === plateNo.toUpperCase())
                    );
                    if (found) {
                        docMatch = true;
                        matchedMember = found.name || found.operatorName;
                        matchedPlateNo = found.plateNo || found.plateNumber || '';
                        matchedBodyNumber = found.bodyNumber || found.unitNo || '';
                        break;
                    }
                }
            }
        }

        if (docMatch) {
            return res.json({
                todaStatus: 'verified_member',
                isVerified: true,
                todaName,
                jurisdictionStatus,
                jurisdictionWarning,
                authorizedTodas: jurisdictionCheck.authorizedTodas || [],
                message: `Verified in official ${todaName} roster.`
            });
        } else {
            return res.json({
                todaStatus: 'not_in_roster',
                isVerified: false,
                todaName,
                jurisdictionStatus,
                jurisdictionWarning,
                authorizedTodas: jurisdictionCheck.authorizedTodas || [],
                message: `Name not found in official ${todaName} roster (${approvedRosters.length} approved masterlist file/s on record).`
            });
        }
    } catch (error) {
        console.error('Error in checkTodaMemberStatus:', error);
        return res.status(500).json({ error: 'Server error checking TODA membership.' });
    }
};

module.exports = { 
    blockDuringMaintenance,
    authorizeFranchiseEdit,
    createFranchise, 
    searchHistoricalFranchise,
    getAllFranchises, 
    getMyFranchises, 
    getFranchiseById,
    getFranchiseRecordCheck,
    updateFranchise, 
    deleteFranchise,
    renewFranchise,
    updateFranchiseStatus,
    cancelMyFranchise,
    toggleArchiveFranchise,
    revokeFranchise,
    getFranchiseReports,
    checkUniqueFranchiseField,
    getCashierQueue,
    processCashierPayment,
    scanDocument,
    checkTodaMemberStatus,
    resolveTodaAssociation,
    todaAssociationPattern,
    requestFranchiseCancellation,
    processFranchiseCancellation,
    downloadOriginalTemplate: async (req, res) => {
        try {
            const {
                generateMtopFranchiseXlsx,
                generateMtopApplicationXlsx,
                generateCancellationDocx,
            } = require('../utils/officeTemplateGenerator');

            const { id } = req.params;
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: 'Invalid franchise ID format.' });
            }
            const type = String(req.query.type || 'mtop').toLowerCase();

            const franchise = await Franchise.findById(id).populate('operator', 'firstName middleName lastName name email barangay address contact contactNumber occupation');
            if (!franchise) {
                return res.status(404).json({ error: 'Franchise record not found.' });
            }

            const role = String(req.user?.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
            const isStaff = role === 'bplo_staff';
            const ownerObj = franchise.operator || franchise.operatorId;
            const ownerId = ownerObj?._id ? String(ownerObj._id) : String(ownerObj || '');
            if (!isStaff && ownerId !== String(req.user?._id || req.user?.id || '')) {
                return res.status(403).json({ error: 'Not authorized to download this franchise document.' });
            }

            const safePlate = String(franchise.plateNo || franchise.plateNumber || franchise.mtopNumber || 'GTRAMS').replace(/[^A-Za-z0-9_-]/g, '_');

            if (type === 'application') {
                const buf = generateMtopApplicationXlsx(franchise);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename="MTOP_APPLICATION_${safePlate}.xlsx"`);
                return res.send(buf);
            } else if (type === 'cancellation') {
                const buf = generateCancellationDocx(franchise);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                res.setHeader('Content-Disposition', `attachment; filename="CANCELLATION_OF_FRANCHISE_${safePlate}.docx"`);
                return res.send(buf);
            } else {
                const buf = generateMtopFranchiseXlsx(franchise);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename="MTOP_FRANCHISE_${safePlate}.xlsx"`);
                return res.send(buf);
            }
        } catch (error) {
            console.error('Error generating original Office template:', error);
            return res.status(500).json({ error: 'Failed to generate original LGU document file.' });
        }
    },
    downloadOriginalPreview: async (req, res) => {
        try {
            const {
                generateMtopFranchiseXlsx,
                generateMtopApplicationXlsx,
                generateCancellationDocx,
            } = require('../utils/officeTemplateGenerator');
            const type = String(req.query.type || req.body?.type || 'application').toLowerCase();
            const data = req.body || {};
            const safePlate = String(data.plateNumber || data.mtopNumber || 'DRAFT').replace(/[^A-Za-z0-9_-]/g, '_');
            if (type === 'mtop') {
                const buf = generateMtopFranchiseXlsx(data);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename="MTOP_FRANCHISE_${safePlate}.xlsx"`);
                return res.send(buf);
            } else if (type === 'cancellation') {
                const buf = generateCancellationDocx(data);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                res.setHeader('Content-Disposition', `attachment; filename="CANCELLATION_OF_FRANCHISE_${safePlate}.docx"`);
                return res.send(buf);
            } else {
                const buf = generateMtopApplicationXlsx(data);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename="MTOP_APPLICATION_${safePlate}.xlsx"`);
                return res.send(buf);
            }
        } catch (error) {
            console.error('Error generating preview Office template:', error);
            return res.status(500).json({ error: 'Failed to generate original LGU document file.' });
        }
    }
};

