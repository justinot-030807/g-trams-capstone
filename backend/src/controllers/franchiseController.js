const Franchise = require('../models/franchiseModel');
const cron = require('node-cron');

// AUTO-ARCHIVE ENGINE: Tumatakbo araw-araw tuwing hatinggabi (Midnight)
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

const updateFranchise = async (req, res) => {
    try {
        let updateData = { ...req.body };
        const files = req.files || {};
        if (files.orCrDocument) updateData.orCrUrl = files.orCrDocument[0].path;
        if (files.license) updateData.licenseUrl = files.license[0].path;
        if (files.todaEndorsement) updateData.todaEndorsementUrl = files.todaEndorsement[0].path;
        if (files.brgyClearance) updateData.brgyClearanceUrl = files.brgyClearance[0].path;
        
        const updatedFranchise = await Franchise.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' }).populate('operator', 'name address contact');
        if (!updatedFranchise) return res.status(404).json({ message: 'Franchise not found' });
        res.status(200).json(updatedFranchise);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteFranchise = async (req, res) => {
    try {
        const franchise = await Franchise.findByIdAndDelete(req.params.id);
        if (!franchise) return res.status(404).json({ message: 'Franchise not found' });
        res.status(200).json({ message: 'Franchise deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const renewFranchise = async (req, res) => {
    try {
        const { dateApplied, cedulaDate, cedulaAddress, cedulaSerialNo } = req.body;
        const updatedFranchise = await Franchise.findByIdAndUpdate(
            req.params.id,
            { dateApplied, cedulaDate, cedulaAddress, cedulaSerialNo, status: 'Pending', applicationType: 'Renewal' },
            { returnDocument: 'after' }
        ).populate('operator', 'name address contact');
        if (!updatedFranchise) return res.status(404).json({ message: 'Franchise not found' });
        res.status(200).json(updatedFranchise);
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

const cancelMyFranchise = async (req, res) => {
    try {
        const franchise = await Franchise.findById(req.params.id);
        if (!franchise) return res.status(404).json({ message: 'not found' });
        if (franchise.operator.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'not authorized' });
        
        franchise.status = 'Cancelled';
        franchise.cancelReason = req.body.cancelReason || 'kinansela ng operator';
        await franchise.save();
        res.status(200).json(franchise);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// MANUAL ARCHIVE LOGIC (Fix para sa mga lumang data)
const toggleArchiveFranchise = async (req, res) => {
    try {
        const franchise = await Franchise.findById(req.params.id);
        if (!franchise) return res.status(404).json({ message: 'Franchise not found' });

        const newArchiveStatus = !franchise.isArchived;
        const newArchiveDate = newArchiveStatus ? Date.now() : null;
        
        // Imbes na .save(), gagamit tayo ng findByIdAndUpdate. 
        // Bapa-bypass nito ang strict validation kaya ma-a-archive kahit pa yung mga lumang data na kulang ang details!
        const updatedFranchise = await Franchise.findByIdAndUpdate(
            req.params.id,
            {
                isArchived: newArchiveStatus,
                archivedAt: newArchiveDate
            },
            { returnDocument: 'after' }
        );

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

        // Kung may in-upload na ebidensya (PDF o Image)
        const files = req.files || {};
        if (files.evidence && files.evidence[0]) {
            franchise.evidenceUrl = files.evidence[0].path;
        }

        await franchise.save();

        res.status(200).json({
            message: 'Franchise successfully revoked.',
            franchise
        });
    } catch (error) {
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
    revokeFranchise
};