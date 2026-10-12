const Franchise = require('../models/franchiseModel');
const User = require('../models/userModel');
const TodaSubmission = require('../models/todaSubmission');
const cron = require('node-cron');
const { logAudit } = require('../utils/auditLogger');
const Notification = require('../models/notificationModel');
const { emitToUser } = require('../config/socket');
const { sendPushToUser } = require('../services/pushService');
const FranchiseService = require('../services/franchiseService');
const { isNameMatch } = require('../utils/nameMatcher');
const { validateTodaJurisdiction, TODA_DIRECTORY } = require('../utils/todaDirectory');

const escapeRegex = (s) => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function buildTodaSearchConditions(todaName) {
    if (!todaName || todaName === 'NON-TODA') return [];
    const clean = String(todaName).trim();
    const todaRegex = new RegExp(escapeRegex(clean), 'i');
    const conditions = [
        { todaAssociation: todaRegex },
        { fileName: todaRegex }
    ];

    if (Array.isArray(TODA_DIRECTORY)) {
        const entry = TODA_DIRECTORY.find(t => 
            t.id.toUpperCase() === clean.toUpperCase() || 
            t.name.toUpperCase().includes(clean.toUpperCase()) || 
            clean.toUpperCase().includes(t.id.toUpperCase())
        );
        if (entry) {
            conditions.push({ todaAssociation: new RegExp(escapeRegex(entry.id), 'i') });
            conditions.push({ todaAssociation: new RegExp(escapeRegex(entry.name), 'i') });
            conditions.push({ fileName: new RegExp(escapeRegex(entry.id), 'i') });
        }
    }
    return conditions;
}

// Auto-archive expired franchises daily at midnight
cron.schedule('0 0 * * *', async () => {
    try {
        console.log('Running Auto-Archive Engine...');
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const result = await Franchise.updateMany(
            { 
                status: 'Expired', 
                updatedAt: { $lt: oneYearAgo }, 
                isArchived: { $ne: true } 
            },
            { 
                $set: { isArchived: true, archivedAt: Date.now() } 
            }
        );

        if (result.modifiedCount > 0) {
            console.log(`Auto-Archived ${result.modifiedCount} expired franchises.`);
        }
    } catch (error) {
        console.error('Error in Auto-Archive Engine:', error);
    }
});

const createFranchise = async (req, res) => {
    try {
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

        const data = {
            ...req.body,
            orCrUrl: findFilePath(['orCrDocument', 'orCrUrl', 'orcr', 'doc_0']) || req.body.orCrUrl || '',
            crUrl: findFilePath(['crDocument', 'crFile', 'crUrl']) || req.body.crUrl || '',
            orUrl: findFilePath(['orDocument', 'orFile', 'orUrl']) || req.body.orUrl || '',
            licenseUrl: findFilePath(['license', 'licenseUrl', 'doc_1']) || req.body.licenseUrl || '',
            licenseBackUrl: findFilePath(['licenseBack', 'licenseBackUrl', 'doc_license_back']) || req.body.licenseBackUrl || '',
            todaEndorsementUrl: findFilePath(['todaEndorsement', 'todaEndorsementUrl', 'toda', 'doc_2']) || req.body.todaEndorsementUrl || '',
            brgyClearanceUrl: findFilePath(['brgyClearance', 'brgyClearanceUrl', 'brgy', 'doc_3']) || req.body.brgyClearanceUrl || '',
            cedulaUrl: findFilePath(['cedulaDoc', 'cedulaUrl', 'cedula', 'doc_cedula', 'ctc']) || req.body.cedulaUrl || ''
        };
        data.orCrUrl = data.orCrUrl || data.crUrl || data.orUrl || '';
        
        if (typeof data.aiScannedData === 'string') {
            try { data.aiScannedData = JSON.parse(data.aiScannedData); } catch {}
        }
        if (typeof data.aiDiscrepancies === 'string') {
            try { data.aiDiscrepancies = JSON.parse(data.aiDiscrepancies); } catch {}
        }

        const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'administrator');
        const franchiseOwner = (isAdmin && req.body.operator) ? req.body.operator : req.user._id;
        if (!isAdmin || !data.status) {
            data.status = 'Pending';
        }

        // Strict TODA Gatekeeping: If applicant is not in official approved roster, TODA Certificate is strictly required
        if (!isAdmin && data.todaName && data.todaName !== 'NON-TODA') {
            const applicantName = (data.fullName || (req.user && req.user.name) || '').trim();
            const todaSearch = buildTodaSearchConditions(todaName);

            const approvedRosters = await TodaSubmission.find({
                status: 'Approved',
                $or: todaSearch
            }).select('extractedMembers todaAssociation fileName').lean();

            let isMemberInRoster = false;
            for (const r of approvedRosters) {
                if (Array.isArray(r.extractedMembers)) {
                    const found = r.extractedMembers.some(m => isNameMatch(applicantName, m?.name));
                    if (found) {
                        isMemberInRoster = true;
                        break;
                    }
                }
            }

            // If not found in approved roster and no TODA certificate was uploaded
            const hasTodaCert = Boolean(data.todaEndorsementUrl);
            if (!isMemberInRoster && !hasTodaCert) {
                return res.status(400).json({
                    message: `Application blocked: Operator "${applicantName}" is not listed in the official approved roster for ${todaName}, and no TODA Endorsement Certificate was provided. Please upload an official TODA Certificate signed by your TODA President.`
                });
            }
        }

        const franchise = await FranchiseService.createFranchise(data, franchiseOwner);

        // Notify admins of new franchise submission
        if (!isAdmin) {
            try {
                const User = require('../models/userModel');
                const admins = await User.find({ role: { $in: ['admin', 'administrator', 'Administrator'] } });
                for (const adm of admins) {
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
        res.status(error?.message?.includes('registered') ? 400 : 500).json({ 
            message: error?.message?.includes('registered') ? error.message : 'Server error creating franchise application.' 
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

const updateFranchise = async (req, res) => {
    try {
        const existingFranchise = await Franchise.findById(req.params.id);
        if (!existingFranchise) return res.status(404).json({ message: 'Franchise not found' });

        // IDOR Protection: verify user is owner or admin
        const role = String(req.user?.role || '').toLowerCase().trim().replace(/_/g, ' ');
        const isAdmin = role === 'admin' || role === 'administrator';
        const isOwner = existingFranchise.operator && existingFranchise.operator.toString() === req.user._id.toString();

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: 'ACCESS DENIED: You are not authorized to update this franchise record.' });
        }

        let updateData = { ...req.body };
        const wasCancelled = existingFranchise.status === 'Cancelled';

        if (!isAdmin) {
            delete updateData.operator;
            delete updateData.isArchived;

            // When an operator re-submits a cancelled/rejected application to fix issues,
            // transition it back to Pending (Pending for Approval) and clear previous rejection remarks.
            if (wasCancelled) {
                updateData.status = 'Pending';
                updateData.isResubmitted = true;
                updateData.resubmittedAt = new Date();
                updateData.cancelReason = '';
                updateData.rejectedField = '';
                updateData.isArchived = false;
            } else {
                delete updateData.status;
            }
        }

        if (updateData.status === 'Pending for Approval') {
            updateData.status = 'Pending';
        }

        // Parse structured metadata date fields if provided
        if (updateData.orCrExpiryDate) {
            updateData.orCrExpiryDate = !isNaN(new Date(updateData.orCrExpiryDate).getTime()) ? new Date(updateData.orCrExpiryDate) : null;
        }
        if (updateData.driverLicenseExpiryDate) {
            updateData.driverLicenseExpiryDate = !isNaN(new Date(updateData.driverLicenseExpiryDate).getTime()) ? new Date(updateData.driverLicenseExpiryDate) : null;
        }
        if (updateData.todaCertDate) {
            updateData.todaCertDate = !isNaN(new Date(updateData.todaCertDate).getTime()) ? new Date(updateData.todaCertDate) : null;
        }
        if (updateData.brgyClearanceDate) {
            updateData.brgyClearanceDate = !isNaN(new Date(updateData.brgyClearanceDate).getTime()) ? new Date(updateData.brgyClearanceDate) : null;
        }
        if (updateData.cedulaDob) {
            updateData.cedulaDob = !isNaN(new Date(updateData.cedulaDob).getTime()) ? new Date(updateData.cedulaDob) : null;
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

        if (orCr) updateData.orCrUrl = orCr;
        if (cr) { updateData.crUrl = cr; if (!updateData.orCrUrl) updateData.orCrUrl = cr; }
        if (or) { updateData.orUrl = or; if (!updateData.orCrUrl && !updateData.crUrl) updateData.orCrUrl = or; }
        if (lic) updateData.licenseUrl = lic;
        if (licBack) updateData.licenseBackUrl = licBack;
        if (toda) updateData.todaEndorsementUrl = toda;
        if (brgy) updateData.brgyClearanceUrl = brgy;
        if (cedula) updateData.cedulaUrl = cedula;
        
        const updatedFranchise = await Franchise.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' }).populate('operator', 'name address contact');
        
        if (isAdmin) {
            logAudit(req, {
                action: 'FRANCHISE_UPDATED',
                targetType: 'Franchise',
                targetId: req.params.id,
                details: { plateNo: updatedFranchise.plateNo, updatedFields: Object.keys(updateData) }
            });
        } else if (wasCancelled && updatedFranchise.status === 'Pending') {
            // Notify admins of re-submitted corrected application
            try {
                const User = require('../models/userModel');
                const admins = await User.find({ role: { $in: ['admin', 'administrator', 'Administrator'] } });
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
        res.status(500).json({ error: 'An internal server error occurred' });
    }
};

const deleteFranchise = async (req, res) => {
    try {
        const franchise = await Franchise.findByIdAndDelete(req.params.id);
        if (!franchise) return res.status(404).json({ message: 'Franchise not found' });

        logAudit(req, {
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
        const existingFranchise = await Franchise.findById(req.params.id);
        if (!existingFranchise) return res.status(404).json({ message: 'Franchise not found' });

        // IDOR Protection: verify user is owner or admin
        const role = String(req.user?.role || '').toLowerCase().trim().replace(/_/g, ' ');
        const isAdmin = role === 'admin' || role === 'administrator';
        const isOwner = existingFranchise.operator && existingFranchise.operator.toString() === req.user._id.toString();

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: 'ACCESS DENIED: You are not authorized to renew this franchise record.' });
        }

        const { 
            dateApplied, cedulaDate, cedulaAddress, cedulaSerialNo, cedulaAmount, ctcNo, 
            dateIssued, placeIssued, orCrNo, orCrExpiryDate, crNo, orNo,
            driverLicenseNo, driverLicenseSerialNo, driverLicenseExpiryDate,
            brgyClearanceNo, brgyClearanceDate, brgyIssuer
        } = req.body;

        const updateData = {
            dateApplied: dateApplied || new Date().toISOString(),
            cedulaDate: cedulaDate || dateIssued || existingFranchise.cedulaDate,
            cedulaAddress: cedulaAddress || placeIssued || existingFranchise.cedulaAddress || '',
            cedulaSerialNo: cedulaSerialNo || ctcNo || existingFranchise.cedulaSerialNo,
            cedulaAmount: cedulaAmount !== undefined ? Number(cedulaAmount) : (existingFranchise.cedulaAmount || 0),
            status: 'Pending',
            cancelReason: '',
            rejectedField: '',
            isArchived: false,
            applicationType: 'Renewal',
            paymentStatus: 'Unpaid',
            officialReceiptNo: '',
            paymentDate: null,
            paidByCashier: null,
            cashierName: '',
            paymentRemarks: ''
        };

        if (orCrNo) updateData.orCrNo = orCrNo;
        if (crNo) updateData.crNo = crNo;
        if (orNo) updateData.orNo = orNo;
        if (orCrExpiryDate && !isNaN(new Date(orCrExpiryDate).getTime())) updateData.orCrExpiryDate = new Date(orCrExpiryDate);
        if (driverLicenseNo) updateData.driverLicenseNo = driverLicenseNo;
        if (driverLicenseSerialNo) updateData.driverLicenseSerialNo = driverLicenseSerialNo;
        if (driverLicenseExpiryDate && !isNaN(new Date(driverLicenseExpiryDate).getTime())) updateData.driverLicenseExpiryDate = new Date(driverLicenseExpiryDate);
        if (brgyClearanceNo) updateData.brgyClearanceNo = brgyClearanceNo;
        if (brgyClearanceDate && !isNaN(new Date(brgyClearanceDate).getTime())) updateData.brgyClearanceDate = new Date(brgyClearanceDate);
        if (brgyIssuer) updateData.brgyIssuer = brgyIssuer;

        if (req.files) {
            if (req.files['orcrFile'] && req.files['orcrFile'][0]) updateData.orCrUrl = req.files['orcrFile'][0].path;
            if (req.files['orCrDocument'] && req.files['orCrDocument'][0]) updateData.orCrUrl = req.files['orCrDocument'][0].path;
            if (req.files['crDocument'] && req.files['crDocument'][0]) updateData.crUrl = req.files['crDocument'][0].path;
            if (req.files['orDocument'] && req.files['orDocument'][0]) updateData.orUrl = req.files['orDocument'][0].path;
            if (req.files['cedulaDoc'] && req.files['cedulaDoc'][0]) updateData.cedulaUrl = req.files['cedulaDoc'][0].path;
            if (req.files['license'] && req.files['license'][0]) updateData.licenseUrl = req.files['license'][0].path;
            if (req.files['licenseBack'] && req.files['licenseBack'][0]) updateData.licenseBackUrl = req.files['licenseBack'][0].path;
            if (req.files['brgyClearance'] && req.files['brgyClearance'][0]) updateData.brgyClearanceUrl = req.files['brgyClearance'][0].path;
        }

        const updatedFranchise = await Franchise.findByIdAndUpdate(
            req.params.id,
            updateData,
            { returnDocument: 'after' }
        ).populate('operator', 'name address contact');

        res.status(200).json(updatedFranchise);
    } catch (error) {
        res.status(500).json({ error: 'An internal server error occurred' });
    }
};

const updateFranchiseStatus = async (req, res) => {
    try {
        const { status, cancelReason, rejectedField } = req.body;
        const existingFranchise = await Franchise.findById(req.params.id);
        if (!existingFranchise) return res.status(404).json({ message: 'Franchise not found' });
        
        const previousStatus = existingFranchise.status;

        // Paid franchises cannot be rejected or cancelled
        if (status === 'Cancelled' && existingFranchise.paymentStatus === 'Paid') {
            return res.status(400).json({ message: 'Cannot reject or cancel an application that has already been paid.' });
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

        const updatedFranchise = await Franchise.findByIdAndUpdate(
            req.params.id,
            updateData,
            { returnDocument: 'after' }
        ).populate('operator', 'name address contact');

        if (updatedFranchise.operator) {
            let notifTitle = `Franchise ${status}`;
            let notifMessage = `Your franchise application for ${updatedFranchise.plateNo} has been updated to: ${status}`;

            if (status === 'For Payment') {
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

        logAudit(req, {
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
        const franchise = await Franchise.findById(req.params.id);
        if (!franchise) return res.status(404).json({ message: 'Franchise not found' });
        if (!franchise.operator || franchise.operator.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized to cancel this application' });
        
        if (!['Pending', 'For Signing', 'Ready for Pickup'].includes(franchise.status)) {
            return res.status(400).json({ message: 'Only pending or unreleased applications can be cancelled.' });
        }

        const reason = (req.body.cancelReason || 'Cancelled by operator').trim();
        franchise.status = 'Cancelled';
        franchise.cancelReason = reason;
        await franchise.save();

        logAudit(req, {
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

// Toggle franchise archive status
const toggleArchiveFranchise = async (req, res) => {
    try {
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

        logAudit(req, {
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

        logAudit(req, {
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
        const franchise = await Franchise.findById(req.params.id).populate('operator', 'name address contact');
        if (!franchise) return res.status(404).json({ message: 'Franchise not found' });

        // IDOR Protection: verify user is owner, admin, or cashier
        const role = String(req.user?.role || '').toLowerCase().trim().replace(/_/g, ' ');
        const isAdmin = role === 'admin' || role === 'administrator';
        const isCashier = role === 'cashier';
        const isOwner = franchise.operator && (
            (franchise.operator._id && franchise.operator._id.toString() === req.user._id.toString()) ||
            franchise.operator.toString() === req.user._id.toString()
        );

        if (!isAdmin && !isCashier && !isOwner) {
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
        const franchise = await Franchise.findById(req.params.id)
            .select('operator fullName plateNo chassisNo motorNo applicationType todaName');
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

        const related = matchers.length
            ? await Franchise.find({ _id: { $ne: franchise._id }, $or: matchers })
                .select('fullName plateNo mtopNo status cancelReason applicationType dateApplied approvalDate updatedAt evidenceUrl')
                .sort({ updatedAt: -1 })
                .limit(50)
                .lean()
            : [];

        const violations = related.filter(f => f.status === 'Revoked');
        const rejected = related.filter(f => f.status === 'Cancelled');
        const pastFranchises = related.filter(f => ['Active', 'Expired', 'Revoked'].includes(f.status));
        const activeUnits = related.filter(f => f.status === 'Active');

        const appType = String(franchise.applicationType || 'New');
        const isRenewal = /renew/i.test(appType) || pastFranchises.length > 0;

        // 1. Verify applicant against official TODA association roster (ONLY approved TodaSubmission masterlists)
        let todaStatus = 'non_toda';
        let todaRosterMessage = '';
        let todaMatchedMember = null;
        let todaApprovedCount = 0;

        if (franchise.todaName && franchise.todaName !== 'NON-TODA') {
            const todaSearch = buildTodaSearchConditions(franchise.todaName);
            
            // Query only Approved masterlists for this TODA
            const approvedRosters = await TodaSubmission.find({
                status: 'Approved',
                $or: todaSearch
            }).select('extractedMembers todaAssociation fileName createdAt');

            todaApprovedCount = approvedRosters.length;

            if (approvedRosters.length === 0) {
                // No approved roster has been uploaded by the TODA President yet
                todaStatus = 'no_roster_on_file';
                todaRosterMessage = `No approved roster on file for ${franchise.todaName}. (Awaiting President masterlist submission)`;
            } else {
                const applicantName = (franchise.fullName || '').trim();
                let docMatch = false;

                if (applicantName) {
                    for (const r of approvedRosters) {
                        if (Array.isArray(r.extractedMembers)) {
                            const found = r.extractedMembers.find(m => isNameMatch(applicantName, m?.name));
                            if (found) {
                                docMatch = true;
                                todaMatchedMember = found.name;
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
                    todaRosterMessage = `Not found in official ${franchise.todaName} roster (${approvedRosters.length} masterlist file/s on record)`;
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
            hasViolations: violations.length > 0,
            violations,
            rejected,
            pastFranchises,
            activeUnitsCount: activeUnits.length,
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
        const query = { isArchived: false };

        if (status) {
            query.status = status;
        } else {
            query.status = { $in: ['For Payment', 'Ready for Pickup', 'Active'] };
        }

        let franchises = await Franchise.find(query)
            .populate('operator', 'name contact address')
            .sort({ updatedAt: -1 });

        if (q && q.trim()) {
            const search = q.trim().toLowerCase();
            franchises = franchises.filter(f => 
                (f.plateNo && f.plateNo.toLowerCase().includes(search)) ||
                (f.fullName && f.fullName.toLowerCase().includes(search)) ||
                (f.payerName && f.payerName.toLowerCase().includes(search)) ||
                (f.chassisNo && f.chassisNo.toLowerCase().includes(search)) ||
                (f.motorNo && f.motorNo.toLowerCase().includes(search)) ||
                (f.officialReceiptNo && f.officialReceiptNo.toLowerCase().includes(search)) ||
                (f._id.toString().includes(search))
            );
        }

        const pendingQueue = franchises.filter(f => f.paymentStatus !== 'Paid' && (f.status === 'For Payment' || f.status === 'Ready for Pickup'));
        const recentlyPaid = franchises.filter(f => f.paymentStatus === 'Paid');

        res.status(200).json({
            pendingQueue,
            recentlyPaid,
            all: franchises
        });
    } catch (error) {
        console.error('Error fetching cashier queue:', error);
        res.status(500).json({ message: 'Failed to fetch cashier queue' });
    }
};

const processCashierPayment = async (req, res) => {
    try {
        const { officialReceiptNo, payerName, amountPaid, paymentMethod, paymentRemarks } = req.body;
        if (!officialReceiptNo || !officialReceiptNo.trim()) {
            return res.status(400).json({ message: 'Official Receipt (OR) Number is required.' });
        }

        const existing = await Franchise.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: 'Franchise record not found.' });
        }

        if (existing.paymentStatus === 'Paid') {
            return res.status(409).json({ message: 'Franchise payment has already been recorded and processed.' });
        }

        const validAmount = amountPaid !== undefined ? Number(amountPaid) : 500;
        if (isNaN(validAmount) || validAmount <= 0) {
            return res.status(400).json({ message: 'Valid payment amount is required.' });
        }

        const now = new Date();
        const resolvedPayerName = (payerName && payerName.trim()) ? payerName.trim().toUpperCase() : existing.fullName;

        // Atomic update guard against concurrent double-processing
        const franchise = await Franchise.findOneAndUpdate(
            { _id: req.params.id, paymentStatus: { $ne: 'Paid' } },
            {
                $set: {
                    paymentStatus: 'Paid',
                    officialReceiptNo: officialReceiptNo.trim().toUpperCase(),
                    payerName: resolvedPayerName,
                    amountPaid: validAmount,
                    paymentMethod: paymentMethod || 'Cash',
                    paymentDate: now,
                    paidByCashier: req.user._id,
                    cashierName: req.user.name || 'Municipal Cashier',
                    paymentRemarks: paymentRemarks || '',
                    status: 'For Signing'
                }
            },
            { returnDocument: 'after' }
        ).populate('operator', 'name contact');

        if (!franchise) {
            return res.status(409).json({ message: 'Franchise payment has already been recorded and processed.' });
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

        logAudit(req, {
            action: 'CASHIER_PAYMENT_PROCESSED',
            targetType: 'Franchise',
            targetId: franchise._id,
            details: {
                plateNo: franchise.plateNo,
                officialReceiptNo: franchise.officialReceiptNo,
                amountPaid: franchise.amountPaid,
                cashier: req.user.name
            }
        });

        res.status(200).json({
            message: 'Payment recorded successfully under Official Receipt No. ' + franchise.officialReceiptNo,
            franchise
        });
    } catch (error) {
        console.error('Error processing cashier payment:', error);
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

        if (!process.env.GEMINI_API_KEY) {
            console.warn('[scanDocument] GEMINI_API_KEY is not defined in environment variables.');
            return res.status(200).json({
                success: false,
                noKey: true,
                fileUrl,
                message: 'Document attached! (Notice: GEMINI_API_KEY must be configured in environment variables for AI auto-fill to activate.)'
            });
        }

        const { extractWithGemini } = require('../services/documentVerificationService');
        const extracted = await extractWithGemini(base64Data, mimeType, docType);
        console.log(`[scanDocument] Extraction result for ${docType}:`, extracted);

        if (!extracted) {
            return res.status(200).json({
                success: false,
                fileUrl,
                message: 'Could not extract information from document. You may enter the details manually.'
            });
        }

        return res.status(200).json({
            success: true,
            fileUrl,
            docType,
            data: extracted
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
        const todaName = (req.query.todaName || req.query.toda || '').trim();
        const applicantName = (req.query.name || req.query.fullName || '').trim();
        const barangay = (req.query.barangay || req.query.address || '').trim();

        if (!todaName || todaName === 'NON-TODA') {
            return res.json({
                todaStatus: 'non_toda',
                isVerified: false,
                todaName: todaName || 'NON-TODA',
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

        const todaSearch = buildTodaSearchConditions(todaName);

        const approvedRosters = await TodaSubmission.find({
            status: 'Approved',
            $or: todaSearch
        }).select('extractedMembers todaAssociation fileName createdAt').lean();

        if (approvedRosters.length === 0) {
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

        if (!applicantName) {
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

        for (const r of approvedRosters) {
            if (Array.isArray(r.extractedMembers)) {
                const found = r.extractedMembers.find(m => isNameMatch(applicantName, m?.name));
                if (found) {
                    docMatch = true;
                    matchedMember = found.name;
                    break;
                }
            }
        }

        if (docMatch) {
            return res.json({
                todaStatus: 'verified_member',
                isVerified: true,
                todaName,
                matchedMember,
                jurisdictionStatus,
                jurisdictionWarning,
                authorizedTodas: jurisdictionCheck.authorizedTodas || [],
                message: `Verified in official ${todaName} roster (Matched: ${matchedMember}).`
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
    checkTodaMemberStatus
};

