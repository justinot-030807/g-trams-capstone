const mongoose = require('mongoose');
const Franchise = require('../models/franchiseModel');
const { currentIssuedSnapshotQuery } = require('../utils/issuedPermit');
const {
    acquireOperatorCapacityLock,
    countOperatorOccupiedSlots,
    findUnsettledViolationsForUnit
} = require('../utils/disciplineHelper');
const { 
    getManilaNow, 
    getManilaStartOfDay, 
    computeManilaExpiryDate, 
    calculateDaysRemaining, 
    isExpired 
} = require('../utils/phTime');

const DOCUMENT_URL_FIELDS = [
    'orCrUrl',
    'crUrl',
    'orUrl',
    'licenseUrl',
    'licenseBackUrl',
    'todaEndorsementUrl',
    'brgyClearanceUrl',
    'cedulaUrl',
    'unitPhotoUrl'
];

/**
 * M6: Validate document URLs to reject arbitrary external http(s) URLs and unsafe schemes.
 * Allows:
 *  (a) fresh files uploaded via req.files (bypassed via uploadedFields)
 *  (b) existing URLs already persisted on the operator's own franchise record
 *  (c) local /uploads/... or Cloudinary (https://res.cloudinary.com/...) server-issued URLs
 */
function isTrustedDocumentUrl(rawUrl, existingAllowedUrls = new Set()) {
    if (rawUrl === undefined || rawUrl === null) return true;
    const val = String(rawUrl).trim();
    if (!val) return true;

    if (existingAllowedUrls && existingAllowedUrls.has(val)) {
        return true;
    }

    if (val.startsWith('/uploads/') && !val.includes('..') && !val.startsWith('//')) {
        return true;
    }

    try {
        const parsed = new URL(val);
        if (parsed.protocol === 'https:' && parsed.hostname.toLowerCase() === 'res.cloudinary.com') {
            return true;
        }
        return false;
    } catch {
        // Not an absolute URL with a scheme
    }

    // Explicitly block protocol-relative and dangerous pseudo-schemes
    if (/^(javascript|data|vbscript|file):/i.test(val) || val.startsWith('//') || val.includes('..')) {
        return false;
    }

    // In test mode, allow local mock/diskStorage paths (e.g., os.tmpdir() paths from multer test storage)
    if (process.env.NODE_ENV === 'test' && !/^https?:\/\//i.test(val)) {
        return true;
    }

    return false;
}

function validateDocumentUrls(payload = {}, existingAllowedUrls = new Set(), uploadedFields = new Set()) {
    for (const field of DOCUMENT_URL_FIELDS) {
        if (uploadedFields && uploadedFields.has(field)) continue;
        if (payload[field] !== undefined && !isTrustedDocumentUrl(payload[field], existingAllowedUrls)) {
            const err = new Error(`Invalid document URL for "${field}". Only uploaded files or server-issued asset URLs are allowed.`);
            err.statusCode = 400;
            throw err;
        }
    }
}

const ALLOWED_DL_CODES = new Set(['A, A1', 'A1', 'A']);

const CREATE_STRING_LIMITS = [
    ['fullName', 120, 'Operator full name'],
    ['address', 200, 'Barangay address'],
    ['plateNo', 30, 'Plate number'],
    ['motorNo', 40, 'Motor number'],
    ['chassisNo', 40, 'Chassis number'],
    ['orCrNo', 40, 'OR/CR number'],
    ['crNo', 40, 'CR number'],
    ['orNo', 40, 'OR number'],
    ['fileNo', 40, 'MV file number'],
    ['series', 60, 'Vehicle series'],
    ['grossWeight', 20, 'Gross weight'],
    ['registeredOwner', 100, 'Registered owner'],
    ['driverName', 100, 'Driver name'],
    ['driverContact', 20, 'Driver contact number'],
    ['driverLicenseNo', 30, "Driver's license number"],
    ['driverLicenseSerialNo', 30, 'License back serial number'],
    ['cedulaSerialNo', 30, 'Cedula serial number'],
    ['cedulaAddress', 150, 'Cedula address'],
    ['cedulaFullName', 100, 'Cedula full name'],
    ['cedulaTin', 30, 'Cedula TIN'],
    ['brgyClearanceNo', 40, 'Barangay clearance number'],
    ['brgyIssuer', 100, 'Barangay issuer']
];

function validateFranchiseStringLimits(payload = {}, specs = CREATE_STRING_LIMITS) {
    for (const [key, maxLen, label] of specs) {
        const val = payload[key];
        if (val === undefined || val === null) continue;
        if (typeof val !== 'string') {
            const err = new Error(`${label} must be a valid text string.`);
            err.statusCode = 400;
            throw err;
        }
        if (val.trim().length > maxLen) {
            const err = new Error(`${label} must not exceed ${maxLen} characters.`);
            err.statusCode = 400;
            throw err;
        }
    }
}

function validateNormalizedDlCodes(rawValue) {
    if (rawValue === undefined || rawValue === null) return '';
    if (typeof rawValue !== 'string') {
        const err = new Error('Authorized DL codes must be a valid string.');
        err.statusCode = 400;
        throw err;
    }
    const clean = rawValue.trim().toUpperCase().replace(/\s*,\s*/g, ', ');
    if (clean && !ALLOWED_DL_CODES.has(clean)) {
        const err = new Error('Authorized DL codes must be A, A1, or A (Tricycle / Motorcycle).');
        err.statusCode = 400;
        throw err;
    }
    return clean;
}

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
            active: reports.filter(r => r.status === 'Active' || r.status === 'Active - Under Warning').length,
            underWarning: reports.filter(r => r.status === 'Active - Under Warning').length,
            suspended: reports.filter(r => r.status === 'Suspended').length,
            pending: reports.filter(r => r.status === 'Pending' || r.status === 'Pending for Approval').length,
            forPayment: reports.filter(r => r.status === 'For Payment').length,
            forSigning: reports.filter(r => r.status === 'For Signing').length,
            readyForPickup: reports.filter(r => r.status === 'Ready for Pickup').length,
            revoked: reports.filter(r => r.status === 'Revoked').length,
            cancelled: reports.filter(r => r.status === 'Cancelled').length,
            cancellationRequested: reports.filter(r => r.status === 'Cancellation Requested').length,
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
                const days = r.daysRemaining !== undefined && r.daysRemaining !== null 
                    ? r.daysRemaining 
                    : calculateDaysRemaining(r.expiryDate || (r.approvalDate ? computeManilaExpiryDate(r.approvalDate) : null));
                return days !== null && days >= 0 && days <= 30;
            }).length,

            renewalsDue60: reports.filter(r => {
                if (r.status !== 'Active') return false;
                const days = r.daysRemaining !== undefined && r.daysRemaining !== null 
                    ? r.daysRemaining 
                    : calculateDaysRemaining(r.expiryDate || (r.approvalDate ? computeManilaExpiryDate(r.approvalDate) : null));
                return days !== null && days >= 0 && days <= 60;
            }).length,

            renewalsDue90: reports.filter(r => {
                if (r.status !== 'Active') return false;
                const days = r.daysRemaining !== undefined && r.daysRemaining !== null 
                    ? r.daysRemaining 
                    : calculateDaysRemaining(r.expiryDate || (r.approvalDate ? computeManilaExpiryDate(r.approvalDate) : null));
                return days !== null && days >= 0 && days <= 90;
            }).length,

            receivedToday: (() => {
                const startOfToday = getManilaStartOfDay();
                return reports.filter(r => new Date(r.createdAt || r.dateApplied || 0) >= startOfToday).length;
            })(),

            processedToday: (() => {
                const startOfToday = getManilaStartOfDay();
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
    static async createFranchise(data, operatorId, { uploadedFields = new Set() } = {}) {
        // M6: Reject arbitrary external document URLs before creating any record
        validateDocumentUrls(data, new Set(), uploadedFields);
        // M7: Enforce server-side string types, length limits, and authorized DL categories
        validateFranchiseStringLimits(data, CREATE_STRING_LIMITS);
        const validatedDlCodes = validateNormalizedDlCodes(data.driverDlCodes);

        const motorNo = String(data.motorNo || '').trim().toUpperCase();
        const chassisNo = String(data.chassisNo || '').trim().toUpperCase();
        const plateNo = String(data.plateNo || '').trim().toUpperCase();

        const SystemSettings = require('../models/systemSettingsModel');
        const sysSettings = await SystemSettings.findOne().sort({ updatedAt: -1, createdAt: -1 }).lean().catch(() => null);
        if (sysSettings?.maintenanceMode === true) {
            const maintErr = new Error(sysSettings.maintenanceMessage || 'System is currently undergoing maintenance. New franchise applications are temporarily suspended.');
            maintErr.statusCode = 503;
            throw maintErr;
        }

        const maxUnits = Number(sysSettings?.maxUnitsPerOperator) || 2;
        const releaseCapLock = await acquireOperatorCapacityLock(operatorId);
        if (!releaseCapLock) {
            const lockErr = new Error('Another application for your account is currently being processed. Please try again shortly.');
            lockErr.statusCode = 409;
            throw lockErr;
        }

        let franchise;
        try {
            const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const identifierMatchers = [];
            if (motorNo) identifierMatchers.push({ motorNo: { $regex: new RegExp(`^${escapeRegex(motorNo)}$`, 'i') } });
            if (chassisNo) identifierMatchers.push({ chassisNo: { $regex: new RegExp(`^${escapeRegex(chassisNo)}$`, 'i') } });
            if (plateNo) identifierMatchers.push({ plateNo: { $regex: new RegExp(`^${escapeRegex(plateNo)}$`, 'i') } });

            if (identifierMatchers.length > 0) {
                const issuedSnapshot = currentIssuedSnapshotQuery();
                const existingTricycle = await Franchise.findOne({
                    $or: identifierMatchers,
                    isArchived: { $ne: true },
                    $and: [{ $or: [{ status: { $ne: 'Cancelled' } }, issuedSnapshot] }]
                });

                if (existingTricycle) {
                    const dupErr = new Error('Tricycle (Plate/Motor/Chassis) is already registered.');
                    dupErr.statusCode = 400;
                    throw dupErr;
                }
                await Franchise.updateMany(
                    { $or: identifierMatchers, $nor: [issuedSnapshot], status: 'Cancelled', isArchived: false },
                    { $set: { isArchived: true } }
                );
            }

            if (operatorId) {
                const currentActiveOrPending = await countOperatorOccupiedSlots(operatorId);
                if (currentActiveOrPending >= maxUnits) {
                    const capErr = new Error(`Maximum fleet limit reached (${maxUnits} units per operator).`);
                    capErr.statusCode = 400;
                    throw capErr;
                }
            }

            // H3: Check unsettled sanctions across the unit / operator chain before issuing a replacement record
            const unsettledViolations = await findUnsettledViolationsForUnit({
                plateNo,
                motorNo,
                chassisNo,
                operatorId
            });
            const blockingSanction = unsettledViolations.find(v =>
                ['Suspension', 'Revocation'].includes(v.sanction?.type)
            );
            if (blockingSanction) {
                const sanctionErr = new Error(
                    `Cannot register replacement franchise while an unsettled ${String(blockingSanction.sanction.type).toLowerCase()} exists for this tricycle unit.`
                );
                sanctionErr.statusCode = 400;
                throw sanctionErr;
            }

            // Safe date parsing (never synthesize fake cedula metadata when omitted)
            const parsedCedulaDate = data.cedulaDate && !isNaN(new Date(data.cedulaDate).getTime()) ? new Date(data.cedulaDate) : undefined;
            const parsedDateApplied = data.dateApplied && !isNaN(new Date(data.dateApplied).getTime()) ? new Date(data.dateApplied) : new Date();

            franchise = await Franchise.create({
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
                cedulaAddress: data.cedulaAddress ? String(data.cedulaAddress).trim() : undefined,
                cedulaSerialNo: data.cedulaSerialNo ? String(data.cedulaSerialNo).trim() : undefined,
                cedulaAmount: 0,
                cedulaYear: data.cedulaYear || '',
                cedulaPlaceIssued: data.cedulaPlaceIssued || data.cedulaAddress || '',
                cedulaFullName: data.cedulaFullName || '',
                cedulaCitizenship: data.cedulaCitizenship || '',
                cedulaCivilStatus: data.cedulaCivilStatus || '',
                cedulaProfession: data.cedulaProfession || '',
                cedulaDob: data.cedulaDob && !isNaN(new Date(data.cedulaDob).getTime()) ? new Date(data.cedulaDob) : undefined,
                cedulaPlaceOfBirth: data.cedulaPlaceOfBirth || '',
                cedulaSex: data.cedulaSex || '',
                cedulaHeight: '',
                cedulaWeight: '',
                cedulaTin: data.cedulaTin || '',
                cedulaDetails: data.cedulaDetails || (data.aiScannedData?.cedula || null),
                applicationType: data.applicationType || 'New',
                status: 'Pending',
                activeViolationCount: unsettledViolations.length,
                currentSanction: unsettledViolations.length > 0 ? 'Warning (Active)' : '',
                dateApplied: parsedDateApplied,
                approvalDate: undefined,
                expiryDate: undefined,
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
                orNo: data.orNo || '',
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
                grossWeight: data.grossWeight || '',
                fuelType: data.fuelType || '',
                passengerCapacity: data.passengerCapacity || '',
                registeredOwner: data.registeredOwner || '',
                ownerAddress: data.ownerAddress || '',

                isOperatorDriver: data.isOperatorDriver !== undefined ? (data.isOperatorDriver === true || data.isOperatorDriver === 'true') : true,
                numberOfUnits: Math.min(2, Math.max(1, Number(data.numberOfUnits) || 1)),
                driverName: data.driverName || '',
                driverContact: data.driverContact || '',
                driverLicenseNo: data.driverLicenseNo || '',
                driverLicenseSerialNo: data.driverLicenseSerialNo || '',
                driverLicenseExpiryDate: data.driverLicenseExpiryDate && !isNaN(new Date(data.driverLicenseExpiryDate).getTime()) ? new Date(data.driverLicenseExpiryDate) : undefined,
                driverDob: data.driverDob && !isNaN(new Date(data.driverDob).getTime()) ? new Date(data.driverDob) : undefined,
                driverDlCodes: validatedDlCodes,
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
        } finally {
            await releaseCapLock();
        }

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
        const limitNum = Math.min(2500, Math.max(1, parseInt(limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;

        let queryCondition = archived === 'true' 
            ? { isArchived: true } 
            : (status && (status === 'Cancelled' || status.includes('Cancelled')))
                ? {} 
                : { isArchived: { $ne: true } };

        if (status && status !== 'All') {
            const rawList = status.split(',').map(s => s.trim()).filter(Boolean);
            const statusList = [];
            rawList.forEach(s => {
                statusList.push(s);
                if (s === 'Pending' && !statusList.includes('Pending for Approval')) {
                    statusList.push('Pending for Approval');
                }
            });

            const now = getManilaNow();
            const oneYearAgo = new Date(now);
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            const hasActive = statusList.includes('Active');
            const hasExpired = statusList.includes('Expired');

            if (statusList.length === 1 && hasActive) {
                queryCondition.status = 'Active';
                queryCondition.$or = [
                    { expiryDate: { $gt: now } },
                    { expiryDate: null, approvalDate: { $gt: oneYearAgo } }
                ];
            } else if (statusList.length === 1 && hasExpired) {
                queryCondition.$or = [
                    { status: 'Expired' },
                    { 
                        status: 'Active', 
                        $or: [
                            { expiryDate: { $lte: now } },
                            { expiryDate: null, approvalDate: { $lte: oneYearAgo } }
                        ]
                    }
                ];
            } else if (statusList.length === 1) {
                queryCondition.status = statusList[0];
            } else if (statusList.length > 1) {
                if (hasActive && !hasExpired) {
                    queryCondition.status = { $in: statusList };
                    queryCondition.$and = queryCondition.$and || [];
                    queryCondition.$and.push({
                        $or: [
                            { status: { $ne: 'Active' } },
                            { expiryDate: { $gt: now } },
                            { expiryDate: null, approvalDate: { $gt: oneYearAgo } }
                        ]
                    });
                } else if (hasExpired && !hasActive) {
                    queryCondition.$or = [
                        { status: { $in: statusList } },
                        { 
                            status: 'Active', 
                            $or: [
                                { expiryDate: { $lte: now } },
                                { expiryDate: null, approvalDate: { $lte: oneYearAgo } }
                            ]
                        }
                    ];
                } else {
                    queryCondition.status = { $in: statusList };
                }
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
            const cleanSearch = search.trim();
            const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const safePattern = escapeRegex(cleanSearch);
            const partialRegex = { $regex: safePattern, $options: 'i' };
            const searchOr = [
                { fullName: partialRegex },
                { plateNo: partialRegex },
                { motorNo: partialRegex },
                { chassisNo: partialRegex },
                { mtopNo: partialRegex },
                { officialReceiptNo: partialRegex },
                { todaName: partialRegex },
                { bodyNumber: partialRegex }
            ];
            if (Array.isArray(queryCondition.$and)) {
                queryCondition.$and.push({ $or: searchOr });
            } else if (queryCondition.$or) {
                queryCondition.$and = [{ $or: queryCondition.$or }, { $or: searchOr }];
                delete queryCondition.$or;
            } else {
                queryCondition.$or = searchOr;
            }
        }

        // Default sort: oldest first (FIFO queue for peak processing)
        const sortOrder = sort === 'newest' 
            ? { dateApplied: -1, createdAt: -1 } 
            : { dateApplied: 1, createdAt: 1 };

        // When viewing Historical Archives, run bounded MongoDB aggregation + $unionWith
        // so synthetic paymentHistory term rows are projected narrowly and paginated in DB (M4).
        if (archived === 'true') {
            const sortDir = sort === 'newest' ? -1 : 1;
            const userCollectionName = mongoose.model('User').collection.name;
            const franchiseCollectionName = Franchise.collection.name;

            const termMatch = {};
            if (status && status !== 'All') {
                const rawList = status.split(',').map(s => s.trim()).filter(Boolean);
                const statusList = [];
                rawList.forEach(s => {
                    statusList.push(s);
                    if (s === 'Pending' && !statusList.includes('Pending for Approval')) {
                        statusList.push('Pending for Approval');
                    }
                });
                termMatch.status = statusList.length === 1 ? statusList[0] : { $in: statusList };
            }
            if (applicationType && applicationType !== 'all') {
                termMatch.applicationType = applicationType;
            }
            if (todaName && todaName !== 'all') {
                termMatch.todaName = todaName;
            }
            if (barangay && barangay !== 'all') {
                const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                termMatch.address = { $regex: escapeRegex(barangay), $options: 'i' };
            }
            if (startDate && endDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                termMatch.dateApplied = { $gte: start, $lte: end };
            }
            if (search && search.trim() !== '') {
                const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const partialRegex = { $regex: escapeRegex(search.trim()), $options: 'i' };
                termMatch.$or = [
                    { fullName: partialRegex },
                    { plateNo: partialRegex },
                    { motorNo: partialRegex },
                    { chassisNo: partialRegex },
                    { mtopNo: partialRegex },
                    { officialReceiptNo: partialRegex },
                    { todaName: partialRegex },
                    { bodyNumber: partialRegex }
                ];
            }

            const narrowBaseProjection = {
                operator: 1,
                fullName: 1,
                address: 1,
                zone: 1,
                todaName: 1,
                bodyNumber: 1,
                plateNo: 1,
                motorNo: 1,
                chassisNo: 1,
                make: 1,
                made: 1,
                yearModel: 1,
                color: 1,
                status: 1,
                applicationType: 1,
                mtopNo: 1,
                officialReceiptNo: 1,
                amountPaid: 1,
                paymentDate: 1,
                payerName: 1,
                paymentMethod: 1,
                paymentRemarks: 1,
                approvalDate: 1,
                expiryDate: 1,
                manualExpiredAt: 1,
                originalExpiryDate: 1,
                dateApplied: 1,
                createdAt: 1,
                updatedAt: 1,
                archivedAt: 1,
                isArchived: 1,
                cancelReason: 1,
                cancellationOutcome: 1,
                cancellationDetails: 1,
                orUrl: 1,
                crUrl: 1,
                orCrUrl: 1,
                licenseUrl: 1,
                licenseBackUrl: 1,
                brgyClearanceUrl: 1,
                cedulaUrl: 1,
                driverName: 1,
                driverLicenseNo: 1,
                paymentHistory: { $slice: [{ $ifNull: ['$paymentHistory', []] }, -10] },
                isHistoricalTerm: { $literal: false },
                sortDate: { $ifNull: ['$dateApplied', { $ifNull: ['$createdAt', new Date(0)] }] },
                sortCreated: { $ifNull: ['$createdAt', new Date(0)] },
                tieBreaker: { $toString: '$_id' }
            };

            const termPipeline = [
                { $match: { 'paymentHistory.0': { $exists: true } } },
                { $unwind: { path: '$paymentHistory', includeArrayIndex: 'termIndex' } },
                {
                    $project: {
                        _id: { $concat: [{ $toString: '$_id' }, '_term_', { $toString: '$termIndex' }] },
                        parentFranchiseId: { $toString: '$_id' },
                        isHistoricalTerm: { $literal: true },
                        isArchived: { $literal: true },
                        termIndex: '$termIndex',
                        operator: '$operator',
                        fullName: '$fullName',
                        bodyNumber: '$bodyNumber',
                        motorNo: '$motorNo',
                        chassisNo: '$chassisNo',
                        make: '$make',
                        made: '$made',
                        yearModel: '$yearModel',
                        color: '$color',
                        driverName: '$driverName',
                        driverLicenseNo: '$driverLicenseNo',
                        orUrl: '$orUrl',
                        crUrl: '$crUrl',
                        orCrUrl: '$orCrUrl',
                        licenseUrl: '$licenseUrl',
                        licenseBackUrl: '$licenseBackUrl',
                        brgyClearanceUrl: '$brgyClearanceUrl',
                        cedulaUrl: '$cedulaUrl',
                        todaName: {
                            $cond: [
                                { $gt: [{ $ifNull: ['$paymentHistory.todaName', ''] }, ''] },
                                '$paymentHistory.todaName',
                                '$todaName'
                            ]
                        },
                        address: {
                            $cond: [
                                { $gt: [{ $ifNull: ['$paymentHistory.address', ''] }, ''] },
                                '$paymentHistory.address',
                                '$address'
                            ]
                        },
                        zone: {
                            $cond: [
                                { $gt: [{ $ifNull: ['$paymentHistory.zone', ''] }, ''] },
                                '$paymentHistory.zone',
                                '$zone'
                            ]
                        },
                        plateNo: {
                            $cond: [
                                { $gt: [{ $ifNull: ['$paymentHistory.plateNo', ''] }, ''] },
                                '$paymentHistory.plateNo',
                                '$plateNo'
                            ]
                        },
                        status: {
                            $cond: [
                                { $gt: [{ $ifNull: ['$paymentHistory.previousStatus', ''] }, ''] },
                                '$paymentHistory.previousStatus',
                                'Expired'
                            ]
                        },
                        applicationType: {
                            $cond: [
                                { $gt: [{ $ifNull: ['$paymentHistory.applicationType', ''] }, ''] },
                                '$paymentHistory.applicationType',
                                { $cond: [{ $eq: ['$termIndex', 0] }, 'New', 'Renewal'] }
                            ]
                        },
                        mtopNo: {
                            $cond: [
                                { $gt: [{ $ifNull: ['$paymentHistory.mtopNo', ''] }, ''] },
                                '$paymentHistory.mtopNo',
                                '$mtopNo'
                            ]
                        },
                        officialReceiptNo: { $ifNull: ['$paymentHistory.officialReceiptNo', ''] },
                        amountPaid: { $ifNull: ['$paymentHistory.amountPaid', 0] },
                        paymentDate: '$paymentHistory.paymentDate',
                        payerName: { $ifNull: ['$paymentHistory.payerName', ''] },
                        paymentMethod: { $ifNull: ['$paymentHistory.paymentMethod', ''] },
                        paymentRemarks: { $ifNull: ['$paymentHistory.paymentRemarks', ''] },
                        approvalDate: '$paymentHistory.approvalDate',
                        expiryDate: '$paymentHistory.expiryDate',
                        dateApplied: {
                            $ifNull: [
                                '$paymentHistory.dateApplied',
                                {
                                    $ifNull: [
                                        '$paymentHistory.approvalDate',
                                        {
                                            $ifNull: [
                                                '$paymentHistory.paymentDate',
                                                { $ifNull: ['$paymentHistory.archivedAt', { $ifNull: ['$dateApplied', '$createdAt'] }] }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        createdAt: {
                            $ifNull: [
                                '$paymentHistory.archivedAt',
                                { $ifNull: ['$paymentHistory.approvalDate', '$createdAt'] }
                            ]
                        },
                        sortDate: {
                            $ifNull: [
                                '$paymentHistory.dateApplied',
                                {
                                    $ifNull: [
                                        '$paymentHistory.approvalDate',
                                        {
                                            $ifNull: [
                                                '$paymentHistory.paymentDate',
                                                { $ifNull: ['$paymentHistory.archivedAt', { $ifNull: ['$dateApplied', { $ifNull: ['$createdAt', new Date(0)] }] }] }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        sortCreated: {
                            $ifNull: [
                                '$paymentHistory.archivedAt',
                                { $ifNull: ['$paymentHistory.approvalDate', { $ifNull: ['$createdAt', new Date(0)] }] }
                            ]
                        },
                        tieBreaker: { $concat: [{ $toString: '$_id' }, '_term_', { $toString: '$termIndex' }] }
                    }
                }
            ];

            if (Object.keys(termMatch).length > 0) {
                termPipeline.push({ $match: termMatch });
            }

            const [aggResult] = await Franchise.aggregate([
                { $match: queryCondition },
                { $project: narrowBaseProjection },
                { $unionWith: { coll: franchiseCollectionName, pipeline: termPipeline } },
                { $sort: { sortDate: sortDir, sortCreated: sortDir, tieBreaker: 1 } },
                {
                    $facet: {
                        meta: [{ $count: 'total' }],
                        data: [
                            { $skip: skip },
                            { $limit: limitNum },
                            {
                                $lookup: {
                                    from: userCollectionName,
                                    localField: 'operator',
                                    foreignField: '_id',
                                    pipeline: [{ $project: { name: 1, address: 1, contact: 1 } }],
                                    as: '_opArr'
                                }
                            },
                            { $addFields: { operator: { $arrayElemAt: ['$_opArr', 0] } } },
                            { $project: { _opArr: 0, sortDate: 0, sortCreated: 0, tieBreaker: 0 } }
                        ]
                    }
                }
            ]);

            const totalRecords = aggResult?.meta?.[0]?.total || 0;
            const totalPages = Math.ceil(totalRecords / limitNum) || 1;

            return {
                data: aggResult?.data || [],
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

FranchiseService.DOCUMENT_URL_FIELDS = DOCUMENT_URL_FIELDS;
FranchiseService.isTrustedDocumentUrl = isTrustedDocumentUrl;
FranchiseService.validateDocumentUrls = validateDocumentUrls;
FranchiseService.validateFranchiseStringLimits = validateFranchiseStringLimits;
FranchiseService.validateNormalizedDlCodes = validateNormalizedDlCodes;

module.exports = FranchiseService;
