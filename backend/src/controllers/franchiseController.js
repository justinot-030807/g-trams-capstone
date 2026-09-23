const Franchise = require('../models/franchiseModel');
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
            orCrUrl: findFilePath(['orCrDocument', 'orCrUrl', 'orcr', 'doc_0']),
            licenseUrl: findFilePath(['license', 'licenseUrl', 'doc_1']),
            todaEndorsementUrl: findFilePath(['todaEndorsement', 'todaEndorsementUrl', 'toda', 'doc_2']),
            brgyClearanceUrl: findFilePath(['brgyClearance', 'brgyClearanceUrl', 'brgy', 'doc_3'])
        };
        
        const franchiseOwner = req.body.operator || req.user._id;
        const franchise = await FranchiseService.createFranchise(data, franchiseOwner);
        
        res.status(201).json(franchise);
    } catch (error) {
        console.error('Error creating franchise:', error);
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
        if (!isAdmin) {
            delete updateData.status;
            delete updateData.operator;
            delete updateData.isArchived;
            delete updateData.eSigned;
            delete updateData.releaseDate;
            delete updateData.deficiencies;
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
        const lic = findFilePath(['license', 'licenseUrl', 'doc_1']);
        const toda = findFilePath(['todaEndorsement', 'todaEndorsementUrl', 'toda', 'doc_2']);
        const brgy = findFilePath(['brgyClearance', 'brgyClearanceUrl', 'brgy', 'doc_3']);

        if (orCr) updateData.orCrUrl = orCr;
        if (lic) updateData.licenseUrl = lic;
        if (toda) updateData.todaEndorsementUrl = toda;
        if (brgy) updateData.brgyClearanceUrl = brgy;
        
        const updatedFranchise = await Franchise.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' }).populate('operator', 'name address contact');
        
        if (isAdmin) {
            logAudit(req, {
                action: 'FRANCHISE_UPDATED',
                targetType: 'Franchise',
                targetId: req.params.id,
                details: { plateNo: updatedFranchise.plateNo, updatedFields: Object.keys(updateData) }
            });
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

        const { dateApplied, cedulaDate, cedulaAddress, cedulaSerialNo, ctcNo, dateIssued, placeIssued } = req.body;
        const updateData = {
            dateApplied: dateApplied || new Date().toISOString(),
            cedulaDate: cedulaDate || dateIssued || existingFranchise.cedulaDate,
            cedulaAddress: cedulaAddress || placeIssued || existingFranchise.cedulaAddress || 'Gasan, Marinduque',
            cedulaSerialNo: cedulaSerialNo || ctcNo || existingFranchise.cedulaSerialNo,
            status: 'Pending',
            applicationType: 'Renewal'
        };

        if (req.files && req.files['orcrFile'] && req.files['orcrFile'][0]) {
            updateData.orCrUrl = req.files['orcrFile'][0].path;
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
        const { status, cancelReason, eSigned, releaseDate } = req.body;
        const existingFranchise = await Franchise.findById(req.params.id);
        if (!existingFranchise) return res.status(404).json({ message: 'Franchise not found' });
        
        const previousStatus = existingFranchise.status;

        const updateData = { 
            status: status, 
            cancelReason: cancelReason || '', 
            eSigned: eSigned || false, 
            releaseDate: releaseDate || '' 
        };

        if (['For Signing', 'Ready for Pickup', 'Active'].includes(status) && !existingFranchise.approvalDate) {
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

            if (status === 'For Signing') {
                notifTitle = 'Franchise Approved - For Signing';
                notifMessage = `Your franchise application for ${updatedFranchise.plateNo} has passed technical verification and is now routed for municipal official signatures.`;
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
        const { field, value, currentFranchiseId } = req.query;
        const allowedFields = ['plateNo', 'motorNo', 'chassisNo'];
        if (!field || !allowedFields.includes(field)) {
            return res.status(400).json({ message: 'Invalid field specified for uniqueness check.' });
        }
        if (!value || !value.trim()) {
            return res.status(200).json({ isUnique: true, exists: false, field, value: '' });
        }

        const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const query = {
            [field]: { $regex: new RegExp('^' + escapeRegex(value.trim()) + '$', 'i') },
            isArchived: { $ne: true },
            status: { $nin: ['Cancelled'] }
        };

        if (currentFranchiseId) {
            query._id = { $ne: currentFranchiseId };
        }

        const existing = await Franchise.findOne(query).select('plateNo status');
        res.status(200).json({
            isUnique: !existing,
            exists: !!existing,
            field,
            value: value.trim(),
            existingStatus: existing ? existing.status : null
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
        res.status(200).json(franchise);
    } catch (error) {
        res.status(500).json({ error: 'An internal server error occurred' });
    }
};

module.exports = { 
    createFranchise, 
    searchHistoricalFranchise,
    getAllFranchises, 
    getMyFranchises, 
    getFranchiseById,
    updateFranchise, 
    deleteFranchise,
    renewFranchise,
    updateFranchiseStatus,
    cancelMyFranchise,
    toggleArchiveFranchise,
    revokeFranchise,
    getFranchiseReports,
    checkUniqueFranchiseField
};
