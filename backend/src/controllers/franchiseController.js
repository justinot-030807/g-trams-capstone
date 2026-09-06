const Franchise = require('../models/franchiseModel');
const cron = require('node-cron');
const { logAudit } = require('../utils/auditLogger');

// Auto-archive expired franchises daily at midnight
cron.schedule('0 0 * * *', async () => {
    try {
        console.log('Running Auto-Archive Engine...');
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const result = await Franchise.updateMany(
            { 
                status: 'Expired', 
                dateApplied: { $lt: oneYearAgo }, 
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
        const { 
            operator, fullName, address, zone, made, make, motorNo, chassisNo, plateNo, todaName, 
            cedulaDate, cedulaAddress, cedulaSerialNo, applicationType, status, dateApplied 
        } = req.body;
        
        const existingTricycle = await Franchise.findOne({ 
            $or: [{ motorNo }, { chassisNo }, { plateNo }] 
        });
                
        if (existingTricycle) {
            return res.status(400).json({ message: 'Tricycle (Plate/Motor/Chassis) is already registered.' });
        }
        
        const files = req.files || {};
        const orCrUrl = files.orCrDocument ? files.orCrDocument[0].path : '';
        const licenseUrl = files.license ? files.license[0].path : '';
        const todaEndorsementUrl = files.todaEndorsement ? files.todaEndorsement[0].path : '';
        const brgyClearanceUrl = files.brgyClearance ? files.brgyClearance[0].path : '';
        
        const franchiseOwner = operator || req.user._id;
        
        let franchise = await Franchise.create({
            operator: franchiseOwner,
            fullName, address, zone, made, make, motorNo, chassisNo, plateNo, todaName,
            cedulaDate, cedulaAddress, cedulaSerialNo,
            applicationType: applicationType || 'New',
            status: status || 'Pending',
            dateApplied: dateApplied || Date.now(),
            orCrUrl, licenseUrl, todaEndorsementUrl, brgyClearanceUrl,
            deficiencies: {
                hasOrcr: !!orCrUrl,
                hasLicense: !!licenseUrl,
                hasTodaEndorsement: !!todaEndorsementUrl,
                hasBrgyClearance: !!brgyClearanceUrl
            }
        });
        
        franchise = await franchise.populate('operator', 'name address contact');
        res.status(201).json(franchise);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const searchHistoricalFranchise = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ message: 'Search query is required' });
        
        const record = await Franchise.findOne({
            $or: [
                { fullName: { $regex: query, $options: 'i' } },
                { plateNo: { $regex: query, $options: 'i' } }
            ]
        }).sort({ createdAt: -1 }).populate('operator', 'name address contact');
        
        if (!record) return res.status(404).json({ message: 'No historical application record found.' });
        res.status(200).json(record);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get franchises with pagination, filter, and search
const getAllFranchises = async (req, res) => {
    try {
        const { archived, page = 1, limit = 10, search = '', status = 'All' } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.max(1, parseInt(limit, 10) || 10);
        const skip = (pageNum - 1) * limitNum;

        // Archive filter
        let queryCondition = archived === 'true' ? { isArchived: true } : { isArchived: { $ne: true } };

        // Multi-status filter
        if (status && status !== 'All') {
            const statusList = status.split(',').filter(s => s && s.trim() !== 'All');
            if (statusList.length === 1) {
                queryCondition.status = statusList[0];
            } else if (statusList.length > 1) {
                queryCondition.status = { $in: statusList };
            }
        }

        // Search query filter
        if (search && search.trim() !== '') {
            const searchRegex = { $regex: search.trim(), $options: 'i' };
            queryCondition.$or = [
                { fullName: searchRegex },
                { plateNo: searchRegex },
                { motorNo: searchRegex },
                { chassisNo: searchRegex },
                { todaName: searchRegex },
                { address: searchRegex }
            ];
        }

        const totalRecords = await Franchise.countDocuments(queryCondition);

        const franchises = await Franchise.find(queryCondition)
            .populate('operator', 'name address contact')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const totalPages = Math.ceil(totalRecords / limitNum) || 1;

        res.status(200).json({
            data: franchises,
            pagination: {
                totalRecords,
                totalPages,
                currentPage: pageNum,
                limit: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getMyFranchises = async (req, res) => {
    try {
        const franchises = await Franchise.find({ operator: req.user._id, isArchived: { $ne: true } }).populate('operator', 'name address contact');
        res.status(200).json(franchises);
    } catch (error) {
        res.status(500).json({ error: error.message });
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
        const files = req.files || {};
        if (files.orCrDocument) updateData.orCrUrl = files.orCrDocument[0].path;
        if (files.license) updateData.licenseUrl = files.license[0].path;
        if (files.todaEndorsement) updateData.todaEndorsementUrl = files.todaEndorsement[0].path;
        if (files.brgyClearance) updateData.brgyClearanceUrl = files.brgyClearance[0].path;
        
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
    }
};

const updateFranchiseStatus = async (req, res) => {
    try {
        const { status, cancelReason, eSigned, releaseDate } = req.body;
        const existingFranchise = await Franchise.findById(req.params.id);
        if (!existingFranchise) return res.status(404).json({ message: 'Franchise not found' });
        
        const previousStatus = existingFranchise.status;

        const updatedFranchise = await Franchise.findByIdAndUpdate(
            req.params.id,
            { status: status, cancelReason: cancelReason || '', eSigned: eSigned || false, releaseDate: releaseDate || '' },
            { returnDocument: 'after' }
        ).populate('operator', 'name address contact');

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
        res.status(500).json({ error: error.message });
    }
};

const cancelMyFranchise = async (req, res) => {
    try {
        const franchise = await Franchise.findById(req.params.id);
        if (!franchise) return res.status(404).json({ message: 'not found' });
        if (franchise.operator.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'not authorized' });
        
        franchise.status = 'Cancelled';
        franchise.cancelReason = req.body.cancelReason || 'Cancelled by operator';
        await franchise.save();
        res.status(200).json(franchise);
    } catch (error) {
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
    }
};

const getFranchiseReports = async (req, res) => {
    try {
        const { startDate, endDate, status, todaName, barangay } = req.query;
        let query = {}; 

        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            query.dateApplied = { $gte: start, $lte: end };
        }

        if (status) query.status = status;
        if (todaName) query.todaName = todaName;
        if (barangay) query.address = { $regex: barangay, $options: 'i' };

        const reports = await Franchise.find(query)
            .populate('operator', 'name contact')
            .sort({ dateApplied: -1 });

        const summary = {
            total: reports.length,
            active: reports.filter(r => r.status === 'Active').length,
            pending: reports.filter(r => r.status === 'Pending').length,
            revoked: reports.filter(r => r.status === 'Revoked').length,
            cancelled: reports.filter(r => r.status === 'Cancelled').length,
            expired: reports.filter(r => r.status === 'Expired').length,
        };

        res.status(200).json({ summary, data: reports });
    } catch (error) {
        console.error("Report Generation Error:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { 
    createFranchise, 
    searchHistoricalFranchise,
    getAllFranchises, 
    getMyFranchises, 
    updateFranchise, 
    deleteFranchise,
    renewFranchise,
    updateFranchiseStatus,
    cancelMyFranchise,
    toggleArchiveFranchise,
    revokeFranchise,
    getFranchiseReports
};