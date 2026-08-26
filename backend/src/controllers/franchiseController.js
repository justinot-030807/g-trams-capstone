const Franchise = require('../models/franchiseModel');
const cron = require('node-cron');

// Auto-Archive Engine
cron.schedule('0 0 * * *', async () => {
    try {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        await Franchise.updateMany(
            { 
                status: 'Expired', 
                dateApplied: { $lt: oneYearAgo }, 
                isArchived: { $ne: true } 
            },
            { 
                $set: { isArchived: true, archivedAt: Date.now() } 
            }
        );
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

const getAllFranchises = async (req, res) => {
    try {
        const { archived } = req.query;
        const queryCondition = archived === 'true' ? { isArchived: true } : { isArchived: { $ne: true } };
        const franchises = await Franchise.find(queryCondition).populate('operator', 'name address contact').sort({ createdAt: -1 });
        res.status(200).json(franchises);
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

const updateFranchiseStatus = async (req, res) => {
    try {
        const { status, cancelReason, eSigned, releaseDate } = req.body;
        const updatedFranchise = await Franchise.findByIdAndUpdate(
            req.params.id,
            { status: status, cancelReason: cancelReason || '', eSigned: eSigned || false, releaseDate: releaseDate || '' },
            { returnDocument: 'after' }
        ).populate('operator', 'name address contact');
        
        if (!updatedFranchise) return res.status(404).json({ message: 'Franchise not found' });
        res.status(200).json(updatedFranchise);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const toggleArchiveFranchise = async (req, res) => {
    try {
        const franchise = await Franchise.findById(req.params.id);
        if (!franchise) return res.status(404).json({ message: 'Franchise not found' });

        const newArchiveStatus = !franchise.isArchived;
        const newArchiveDate = newArchiveStatus ? Date.now() : null;
        
        const updatedFranchise = await Franchise.findByIdAndUpdate(
            req.params.id,
            { isArchived: newArchiveStatus, archivedAt: newArchiveDate },
            { returnDocument: 'after' }
        );

        res.status(200).json({ message: 'Archived status updated', franchise: updatedFranchise });
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

        if (status && status !== 'All') query.status = status;
        if (todaName && todaName !== 'ALL TODA') query.todaName = todaName;
        if (barangay && barangay !== 'ALL BARANGAYS') query.address = { $regex: barangay, $options: 'i' };

        const reports = await Franchise.find(query).populate('operator', 'name contact').sort({ dateApplied: -1 });

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
        res.status(500).json({ error: error.message });
    }
};

module.exports = { 
    createFranchise, 
    getAllFranchises, 
    getMyFranchises, 
    updateFranchiseStatus,
    toggleArchiveFranchise,
    getFranchiseReports
};