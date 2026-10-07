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
            pending: reports.filter(r => r.status === 'Pending' || r.status === 'Pending for Approval').length,
            forPayment: reports.filter(r => r.status === 'For Payment').length,
            forSigning: reports.filter(r => r.status === 'For Signing').length,
            readyForPickup: reports.filter(r => r.status === 'Ready for Pickup').length,
            revoked: reports.filter(r => r.status === 'Revoked').length,
            cancelled: reports.filter(r => r.status === 'Cancelled').length,
            expired: reports.filter(r => r.status === 'Expired').length,
            newApps: reports.filter(r => r.applicationType === 'New').length,
            newAppsThisYear: reports.filter(r => {
                if (r.applicationType !== 'New') return false;
                const d = new Date(r.dateApplied || r.createdAt || 0);
                return d.getFullYear() === new Date().getFullYear();
            }).length,
            
            // Peak readiness metrics for January renewal surge
            renewalsDue30: reports.filter(r => {
                if (r.status !== 'Active') return false;
                const base = r.approvalDate ? new Date(r.approvalDate) : (r.dateApplied ? new Date(r.dateApplied) : null);
                const exp = r.orCrExpiryDate ? new Date(r.orCrExpiryDate) : (base ? new Date(base.setFullYear(base.getFullYear() + 1)) : null);
                if (!exp || isNaN(exp.getTime())) return false;
                const diffDays = Math.ceil((exp - new Date()) / 86400000);
                return diffDays >= 0 && diffDays <= 30;
            }).length,

            renewalsDue60: reports.filter(r => {
                if (r.status !== 'Active') return false;
                const base = r.approvalDate ? new Date(r.approvalDate) : (r.dateApplied ? new Date(r.dateApplied) : null);
                const exp = r.orCrExpiryDate ? new Date(r.orCrExpiryDate) : (base ? new Date(base.setFullYear(base.getFullYear() + 1)) : null);
                if (!exp || isNaN(exp.getTime())) return false;
                const diffDays = Math.ceil((exp - new Date()) / 86400000);
                return diffDays >= 0 && diffDays <= 60;
            }).length,

            renewalsDue90: reports.filter(r => {
                if (r.status !== 'Active') return false;
                const base = r.approvalDate ? new Date(r.approvalDate) : (r.dateApplied ? new Date(r.dateApplied) : null);
                const exp = r.orCrExpiryDate ? new Date(r.orCrExpiryDate) : (base ? new Date(base.setFullYear(base.getFullYear() + 1)) : null);
                if (!exp || isNaN(exp.getTime())) return false;
                const diffDays = Math.ceil((exp - new Date()) / 86400000);
                return diffDays >= 0 && diffDays <= 90;
            }).length,

            receivedToday: (() => {
                const startOfToday = new Date();
                startOfToday.setHours(0, 0, 0, 0);
                return reports.filter(r => new Date(r.createdAt || r.dateApplied || 0) >= startOfToday).length;
            })(),

            processedToday: (() => {
                const startOfToday = new Date();
                startOfToday.setHours(0, 0, 0, 0);
                return reports.filter(r => 
                    new Date(r.updatedAt || 0) >= startOfToday && 
                    ['For Signing', 'Ready for Pickup', 'Active', 'Cancelled', 'Revoked'].includes(r.status)
                ).length;
            })(),

            oldestWaiting: (() => {
                const pendingList = reports
                    .filter(r => ['Pending', 'Pending for Approval'].includes(r.status))
                    .sort((a, b) => new Date(a.dateApplied || a.createdAt || 0) - new Date(b.dateApplied || b.createdAt || 0));
                if (pendingList.length === 0) return null;
                const oldest = pendingList[0];
                const appliedDate = new Date(oldest.dateApplied || oldest.createdAt || Date.now());
                const diffMs = Date.now() - appliedDate.getTime();
                const days = Math.floor(diffMs / 86400000);
                const hours = Math.floor((diffMs % 86400000) / 3600000);
                return {
                    _id: oldest._id,
                    fullName: oldest.fullName,
                    plateNo: oldest.plateNo,
                    todaName: oldest.todaName,
                    timeWaiting: days > 0 ? `${days}d ${hours}h` : `${hours}h`,
                    daysWaiting: days
                };
            })(),

            // Computations directly handled by the server to prevent OOM errors on frontend
            todaMap: reports.reduce((acc, curr) => {
                const name = curr.todaName ? curr.todaName.trim() : 'NON-TODA';
                acc[name || 'NON-TODA'] = (acc[name || 'NON-TODA'] || 0) + 1;
                return acc;
            }, {}),
            
            recentApps: reports
                .filter(r => ['Pending', 'Pending for Approval', 'For Payment', 'For Signing', 'Ready for Pickup'].includes(r.status))
                .slice(0, 5),
                
            historyLogs: [...reports]
                .sort((a, b) => new Date(b.updatedAt || b.dateApplied || 0) - new Date(a.updatedAt || a.dateApplied || 0))
                .slice(0, 6)
        };

        // We can safely return only summary and NOT the huge 'reports' data array to save bandwidth if data isn't needed.
        // But to not break compatibility with AdminReports.jsx, we return both.
        return { summary, data: reports };
    }

    /**
     * Create a new franchise application
     */
    static async createFranchise(data, operatorId) {
        const motorNo = (data.motorNo || '').trim();
        const chassisNo = (data.chassisNo || '').trim();
        const plateNo = (data.plateNo || '').trim().toUpperCase();
        
        const existingTricycle = await Franchise.findOne({ 
            $or: [{ motorNo }, { chassisNo }, { plateNo }],
            isArchived: { $ne: true },
            status: { $nin: ['Cancelled'] }
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
            cedulaAmount: Number(data.cedulaAmount) || 0,
            applicationType: data.applicationType || 'New',
            status: data.status || 'Pending',
            dateApplied: parsedDateApplied,
            orCrUrl: data.orCrUrl, 
            crUrl: data.crUrl || '',
            orUrl: data.orUrl || '',
            licenseUrl: data.licenseUrl, 
            licenseBackUrl: data.licenseBackUrl || '',
            todaEndorsementUrl: data.todaEndorsementUrl, 
            brgyClearanceUrl: data.brgyClearanceUrl,
            cedulaUrl: data.cedulaUrl || '',

            // Structured document metadata fields
            orCrNo: data.orCrNo || '',
            orCrExpiryDate: data.orCrExpiryDate && !isNaN(new Date(data.orCrExpiryDate).getTime()) ? new Date(data.orCrExpiryDate) : undefined,
            crNo: data.crNo || '',
            orDate: data.orDate && !isNaN(new Date(data.orDate).getTime()) ? new Date(data.orDate) : undefined,
            crDate: data.crDate && !isNaN(new Date(data.crDate).getTime()) ? new Date(data.crDate) : undefined,
            color: data.color || '',
            series: data.series || '',
            yearModel: data.yearModel || '',
            fileNo: data.fileNo || '',
            vehicleType: data.vehicleType || '',
            vehicleCategory: data.vehicleCategory || '',
            classification: data.classification || '',
            bodyType: data.bodyType || '',
            displacement: data.displacement || '',
            registeredOwner: data.registeredOwner || '',
            ownerAddress: data.ownerAddress || '',

            isOperatorDriver: data.isOperatorDriver !== undefined ? (data.isOperatorDriver === true || data.isOperatorDriver === 'true') : true,
            numberOfUnits: Math.min(2, Math.max(1, Number(data.numberOfUnits) || 1)),
            driverName: data.driverName || '',
            driverContact: data.driverContact || '',
            driverLicenseNo: data.driverLicenseNo || '',
            driverLicenseExpiryDate: data.driverLicenseExpiryDate && !isNaN(new Date(data.driverLicenseExpiryDate).getTime()) ? new Date(data.driverLicenseExpiryDate) : undefined,
            driverDob: data.driverDob && !isNaN(new Date(data.driverDob).getTime()) ? new Date(data.driverDob) : undefined,
            driverDlCodes: data.driverDlCodes || 'A, A1',
            driverConditions: data.driverConditions || 'None',
            driverAddress: data.driverAddress || '',
            driverNationality: data.driverNationality || 'Filipino',
            driverSex: data.driverSex || '',
            todaCertNo: data.todaCertNo || '',
            todaCertDate: data.todaCertDate && !isNaN(new Date(data.todaCertDate).getTime()) ? new Date(data.todaCertDate) : undefined,
            todaSignatory: data.todaSignatory || '',
            brgyClearanceNo: data.brgyClearanceNo || '',
            brgyClearanceDate: data.brgyClearanceDate && !isNaN(new Date(data.brgyClearanceDate).getTime()) ? new Date(data.brgyClearanceDate) : undefined,
            brgyIssuer: data.brgyIssuer || '',


            aiScannedData: data.aiScannedData || null,
            aiDiscrepancies: data.aiDiscrepancies || []
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
        const { 
            archived, 
            page = 1, 
            limit = 10, 
            search = '', 
            status = 'All', 
            applicationType, 
            todaName, 
            barangay, 
            startDate, 
            endDate, 
            sort = 'oldest' 
        } = params;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;

        let queryCondition = archived === 'true' ? { isArchived: true } : { isArchived: { $ne: true } };

        if (status && status !== 'All') {
            const rawList = status.split(',').map(s => s.trim()).filter(Boolean);
            const statusList = [];
            rawList.forEach(s => {
                statusList.push(s);
                if (s === 'Pending' && !statusList.includes('Pending for Approval')) {
                    statusList.push('Pending for Approval');
                }
            });

            if (statusList.length === 1) {
                queryCondition.status = statusList[0];
            } else if (statusList.length > 1) {
                queryCondition.status = { $in: statusList };
            }
        }

        if (applicationType && applicationType !== 'all') {
            queryCondition.applicationType = applicationType;
        }

        if (todaName && todaName !== 'all') {
            queryCondition.todaName = todaName;
        }

        if (barangay && barangay !== 'all') {
            const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            queryCondition.address = { $regex: escapeRegex(barangay), $options: 'i' };
        }

        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            queryCondition.dateApplied = { $gte: start, $lte: end };
        }

        if (search && search.trim() !== '') {
            queryCondition.$text = { $search: search.trim() };
        }

        // Default sort: oldest first (FIFO queue for peak processing)
        const sortOrder = sort === 'newest' 
            ? { dateApplied: -1, createdAt: -1 } 
            : { dateApplied: 1, createdAt: 1 };

        const totalRecords = await Franchise.countDocuments(queryCondition);
        const franchises = await Franchise.find(queryCondition)
            .populate('operator', 'name address contact')
            .sort(sortOrder)
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
