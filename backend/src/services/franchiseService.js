const Franchise = require('../models/franchiseModel');

class FranchiseService {
    /**
     * Generate franchise statistics and analytics
     */
    static async generateReports(queryParams) {
        const { startDate, endDate, status, todaName, barangay } = queryParams;
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
        if (barangay) {
            const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.address = { $regex: escapeRegex(barangay), $options: 'i' };
        }

        const reports = await Franchise.find(query)
            .populate('operator', 'name contact')
            .sort({ dateApplied: -1 });

        const summary = {
            total: reports.length,
            active: reports.filter(r => r.status === 'Active').length,
            pending: reports.filter(r => r.status === 'Pending').length,
            forSigning: reports.filter(r => r.status === 'For Signing').length,
            readyForPickup: reports.filter(r => r.status === 'Ready for Pickup').length,
            revoked: reports.filter(r => r.status === 'Revoked').length,
            cancelled: reports.filter(r => r.status === 'Cancelled').length,
            expired: reports.filter(r => r.status === 'Expired').length,
        };

        return { summary, data: reports };
    }

    /**
     * Create a new franchise application
     */
    static async createFranchise(data, operatorId) {
        const { motorNo, chassisNo, plateNo } = data;
        
        const existingTricycle = await Franchise.findOne({ 
            $or: [{ motorNo }, { chassisNo }, { plateNo }],
            isArchived: { $ne: true }
        });
                
        if (existingTricycle) {
            throw new Error('Tricycle (Plate/Motor/Chassis) is already registered.');
        }

        // Safe date parsing
        const parsedCedulaDate = data.cedulaDate && !isNaN(new Date(data.cedulaDate).getTime()) ? new Date(data.cedulaDate) : new Date();
        const parsedDateApplied = data.dateApplied && !isNaN(new Date(data.dateApplied).getTime()) ? new Date(data.dateApplied) : new Date();

        const franchise = await Franchise.create({
            operator: operatorId,
            fullName: data.fullName, 
            address: data.address, 
            zone: data.zone, 
            made: data.made, 
            make: data.make, 
            motorNo, 
            chassisNo, 
            plateNo, 
            todaName: data.todaName,
            cedulaDate: parsedCedulaDate,
            cedulaAddress: data.cedulaAddress || 'Gasan, Marinduque',
            cedulaSerialNo: data.cedulaSerialNo || '000000',
            applicationType: data.applicationType || 'New',
            status: data.status || 'Pending',
            dateApplied: parsedDateApplied,
            orCrUrl: data.orCrUrl, 
            licenseUrl: data.licenseUrl, 
            todaEndorsementUrl: data.todaEndorsementUrl, 
            brgyClearanceUrl: data.brgyClearanceUrl,
            deficiencies: {
                hasOrcr: !!data.orCrUrl,
                hasLicense: !!data.licenseUrl,
                hasTodaEndorsement: !!data.todaEndorsementUrl,
                hasBrgyClearance: !!data.brgyClearanceUrl
            }
        });

        return await franchise.populate('operator', 'name address contact');
    }

    /**
     * Search historical franchises using text index
     */
    static async searchHistorical(query) {
        if (!query) throw new Error('Search query is required');
        
        return await Franchise.findOne({
            $text: { $search: query.trim() }
        }).sort({ createdAt: -1 }).populate('operator', 'name address contact');
    }

    /**
     * Get paginated franchises
     */
    static async getPaginatedFranchises(params) {
        const { archived, page = 1, limit = 10, search = '', status = 'All' } = params;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.max(1, parseInt(limit, 10) || 10);
        const skip = (pageNum - 1) * limitNum;

        let queryCondition = archived === 'true' ? { isArchived: true } : { isArchived: { $ne: true } };

        if (status && status !== 'All') {
            const statusList = status.split(',').filter(s => s && s.trim() !== 'All');
            if (statusList.length === 1) {
                queryCondition.status = statusList[0];
            } else if (statusList.length > 1) {
                queryCondition.status = { $in: statusList };
            }
        }

        if (search && search.trim() !== '') {
            queryCondition.$text = { $search: search.trim() };
        }

        const totalRecords = await Franchise.countDocuments(queryCondition);
        const franchises = await Franchise.find(queryCondition)
            .populate('operator', 'name address contact')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const totalPages = Math.ceil(totalRecords / limitNum) || 1;

        return {
            data: franchises,
            pagination: {
                totalRecords,
                totalPages,
                currentPage: pageNum,
                limit: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        };
    }
}

module.exports = FranchiseService;
