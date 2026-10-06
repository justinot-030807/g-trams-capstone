const Franchise = require('../models/franchiseModel');
const User = require('../models/userModel');
const cron = require('node-cron');
const { logAudit } = require('../utils/auditLogger');
const Notification = require('../models/notificationModel');
const { emitToUser } = require('../config/socket');
const { sendPushToUser } = require('../services/pushService');
const FranchiseService = require('../services/franchiseService');

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
        const franchise = await FranchiseService.createFranchise(data, franchiseOwner);
        
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
        const franchises = await Franchise.find({ operator: req.user._id, isArchived: { $ne: true } }).populate('operator', 'name address contact');
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
            delete updateData.eSigned;
            delete updateData.releaseDate;
            delete updateData.deficiencies;

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
        if (updateData.isOperatorDriver !== undefined) {
            updateData.isOperatorDriver = updateData.isOperatorDriver === true || updateData.isOperatorDriver === 'true';
        }

        if (typeof updateData.aiScannedData === 'string') {
            try { updateData.aiScannedData = JSON.parse(updateData.aiScannedData); } catch {}
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
        if (cr) updateData.crUrl = cr;
        if (or) updateData.orUrl = or;
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
                const admins = await User.find({ role: { $in: ['admin', 'Administrator'] } });
                for (const adm of admins) {
                    await Notification.create({
                        recipient: adm._id,
                        type: 'INFO',
                        title: 'Franchise Application Re-submitted',
                        message: `Operator ${updatedFranchise.fullName || 'User'} has updated and re-submitted their franchise application for ${updatedFranchise.plateNo}.`,
                        relatedFranchise: updatedFranchise._id
                    });
                    emitToUser(adm._id.toString(), 'new_notification', {
                        title: 'Franchise Application Re-submitted',
                        message: `Operator ${updatedFranchise.fullName || 'User'} has updated and re-submitted their franchise application for ${updatedFranchise.plateNo}.`
                    });
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

        const { dateApplied, cedulaDate, cedulaAddress, cedulaSerialNo, ctcNo, dateIssued, placeIssued, orCrNo, orCrExpiryDate, driverLicenseNo, driverLicenseExpiryDate } = req.body;
        const updateData = {
            dateApplied: dateApplied || new Date().toISOString(),
            cedulaDate: cedulaDate || dateIssued || existingFranchise.cedulaDate,
            cedulaAddress: cedulaAddress || placeIssued || existingFranchise.cedulaAddress || 'Gasan, Marinduque',
            cedulaSerialNo: cedulaSerialNo || ctcNo || existingFranchise.cedulaSerialNo,
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
            paymentRemarks: '',
            eSigned: false,
            releaseDate: ''
        };

        if (orCrNo) updateData.orCrNo = orCrNo;
        if (orCrExpiryDate && !isNaN(new Date(orCrExpiryDate).getTime())) updateData.orCrExpiryDate = new Date(orCrExpiryDate);
        if (driverLicenseNo) updateData.driverLicenseNo = driverLicenseNo;
        if (driverLicenseExpiryDate && !isNaN(new Date(driverLicenseExpiryDate).getTime())) updateData.driverLicenseExpiryDate = new Date(driverLicenseExpiryDate);

        if (req.files && req.files['orcrFile'] && req.files['orcrFile'][0]) {
            updateData.orCrUrl = req.files['orcrFile'][0].path;
        }
        if (req.files && req.files['cedulaDoc'] && req.files['cedulaDoc'][0]) {
            updateData.cedulaUrl = req.files['cedulaDoc'][0].path;
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
        const { status, cancelReason, rejectedField, eSigned, releaseDate } = req.body;
        const existingFranchise = await Franchise.findById(req.params.id);
        if (!existingFranchise) return res.status(404).json({ message: 'Franchise not found' });
        
        const previousStatus = existingFranchise.status;

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
            rejectedField: targetField,
            eSigned: eSigned || false, 
            releaseDate: releaseDate || '' 
        };

        if (status === 'Cancelled') {
            updateData.isArchived = true;
            updateData.archivedAt = new Date();
        } else if (existingFranchise.status === 'Cancelled' && status !== 'Cancelled') {
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
                notifMessage = `Your official MTOP Certificate for ${updatedFranchise.plateNo} has been signed! Please present your Claim Stub to the Municipal Cashier to pay and claim.`;
            } else if (status === 'Active') {
                notifTitle = 'Franchise Activated!';
                notifMessage = `Your franchise permit for ${updatedFranchise.plateNo} is now officially active and released.`;
            }

            const notification = await Notification.create({
                recipient: updatedFranchise.operator._id,
                type: 'status_change',
                title: notifTitle,
                message: notifMessage,
                relatedFranchise: updatedFranchise._id
            });
            emitToUser(String(updatedFranchise.operator._id), 'notification', notification);
            
            // Send background push notification to operator's mobile device
            sendPushToUser(updatedFranchise.operator._id, {
                title: notifTitle,
                message: notifMessage,
                url: '/operator-dashboard',
                type: String(status).toLowerCase().includes('approv') || status === 'For Signing' ? 'approval' : 'status_change'
            }).catch(err => console.error('Push alert delivery failed:', err.message));
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
        franchise.isArchived = true;
        franchise.archivedAt = new Date();
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

        const matchers = [];
        if (franchise.operator) matchers.push({ operator: franchise.operator });
        if (franchise.fullName) matchers.push({ fullName: exact(franchise.fullName) });
        if (franchise.plateNo) matchers.push({ plateNo: exact(franchise.plateNo) });
        if (franchise.chassisNo) matchers.push({ chassisNo: exact(franchise.chassisNo) });
        if (franchise.motorNo) matchers.push({ motorNo: exact(franchise.motorNo) });

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

        // Verify applicant against TODA association roster
        let todaStatus = 'non_toda';
        if (franchise.todaName && franchise.todaName !== 'NON-TODA') {
            const todaRegex = new RegExp(`^${escapeRegex(franchise.todaName)}$`, 'i');
            const userOrCriteria = [];
            if (franchise.operator) userOrCriteria.push({ _id: franchise.operator });
            if (franchise.fullName) userOrCriteria.push({ name: exact(franchise.fullName) });

            const userMatch = userOrCriteria.length > 0
                ? await User.findOne({ todaAssociation: todaRegex, $or: userOrCriteria }).select('name todaAssociation')
                : null;

            todaStatus = userMatch ? 'verified_member' : 'not_in_roster';
        }

        res.status(200).json({
            applicationType: isRenewal ? 'Renewal' : 'New',
            hasViolations: violations.length > 0,
            violations,
            rejected,
            pastFranchises,
            activeUnitsCount: activeUnits.length,
            todaStatus,
            todaName: franchise.todaName || 'NON-TODA'
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

        const franchise = await Franchise.findById(req.params.id).populate('operator', 'name contact');
        if (!franchise) {
            return res.status(404).json({ message: 'Franchise record not found.' });
        }

        if (franchise.paymentStatus === 'Paid') {
            return res.status(400).json({ message: 'Franchise payment has already been recorded and processed.' });
        }

        const validAmount = amountPaid !== undefined ? Number(amountPaid) : 500;
        if (isNaN(validAmount) || validAmount <= 0) {
            return res.status(400).json({ message: 'Valid payment amount is required.' });
        }

        const now = new Date();
        franchise.paymentStatus = 'Paid';
        franchise.officialReceiptNo = officialReceiptNo.trim().toUpperCase();
        franchise.payerName = (payerName && payerName.trim()) ? payerName.trim().toUpperCase() : franchise.fullName;
        franchise.amountPaid = validAmount;
        franchise.paymentMethod = paymentMethod || 'Cash';
        franchise.paymentDate = now;
        franchise.paidByCashier = req.user._id;
        franchise.cashierName = req.user.name || 'Municipal Cashier';
        franchise.paymentRemarks = paymentRemarks || '';

        // Status advances to 'For Signing' so Municipal Admin and Mayor can sign the official permit
        franchise.status = 'For Signing';

        await franchise.save();

        // Notify operator of official receipt
        if (franchise.operator) {
            const notifTitle = 'Payment Confirmed by Municipal Cashier!';
            const notifMessage = `Your payment of ₱${franchise.amountPaid} has been confirmed under Official Receipt No. ${franchise.officialReceiptNo} (Payer: ${franchise.payerName}). Your application is now marked as Paid and queued For Signing by Municipal Officials.`;

            const notification = await Notification.create({
                recipient: franchise.operator._id,
                type: 'status_change',
                title: notifTitle,
                message: notifMessage,
                relatedFranchise: franchise._id
            });
            emitToUser(String(franchise.operator._id), 'notification', notification);

            sendPushToUser(franchise.operator._id, {
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
    scanDocument
};

