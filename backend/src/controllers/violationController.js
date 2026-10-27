const Violation = require('../models/violationModel');
const Franchise = require('../models/franchiseModel');
const SystemSettings = require('../models/systemSettingsModel');
const Notification = require('../models/notificationModel');
const { emitToUser } = require('../config/socket');
const { logAudit } = require('../utils/auditLogger');

/**
 * Get paginated violations list with filtering
 */
const getViolations = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
        const skip = (page - 1) * limit;

        const filter = {};

        if (req.query.status && req.query.status !== 'All') {
            filter.status = req.query.status;
        }

        if (req.query.severity && req.query.severity !== 'All') {
            filter.severity = req.query.severity;
        }

        if (req.query.franchiseId) {
            filter.franchise = req.query.franchiseId;
        }

        if (req.query.operatorId) {
            filter.operator = req.query.operatorId;
        }

        if (typeof req.query.search === 'string' && req.query.search.trim() !== '') {
            const escapeRegex = (s) => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const searchRegex = new RegExp(escapeRegex(req.query.search.trim()), 'i');
            filter.$or = [
                { plateNo: searchRegex },
                { driverName: searchRegex },
                { violationType: searchRegex },
                { recordedByName: searchRegex }
            ];
        }

        const totalRecords = await Violation.countDocuments(filter);
        const violations = await Violation.find(filter)
            .populate('operator', 'name email contact')
            .populate('franchise', 'fullName plateNo todaName status make motorNo')
            .populate('recordedBy', 'name role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalRecords / limit) || 1;

        res.status(200).json({
            success: true,
            data: violations,
            pagination: {
                totalRecords,
                totalPages,
                currentPage: page,
                limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching violations:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve violation records.' });
    }
};

/**
 * Get violation history and offense calculation for a specific franchise
 */
const getOperatorViolationHistory = async (req, res) => {
    try {
        const { franchiseId } = req.params;
        const franchise = await Franchise.findById(franchiseId).populate('operator', 'name email contact');
        if (!franchise) {
            return res.status(404).json({ success: false, message: 'Franchise not found.' });
        }

        // Active violations count determines the progressive discipline tier
        const activeViolationsCount = await Violation.countDocuments({
            franchise: franchise._id,
            status: 'Active'
        });

        const totalViolationsCount = await Violation.countDocuments({
            franchise: franchise._id
        });

        const history = await Violation.find({ franchise: franchise._id })
            .populate('recordedBy', 'name role')
            .sort({ createdAt: -1 });

        // Retrieve system settings for violation policy
        let settings = await SystemSettings.findOne().sort({ updatedAt: -1, createdAt: -1 });
        if (!settings || !settings.violationPolicy) {
            settings = {
                violationPolicy: {
                    tiers: {
                        firstOffense: { sanction: 'Warning', resultingStatus: 'Active - Under Warning' },
                        secondOffense: { sanction: 'Suspension', resultingStatus: 'Suspended', defaultFine: 500, defaultSuspensionDays: 15 },
                        thirdOffense: { sanction: 'Revocation', resultingStatus: 'Revoked' },
                        graveViolation: { sanction: 'Revocation', resultingStatus: 'Revoked' }
                    }
                }
            };
        }

        const nextOffenseNumber = activeViolationsCount + 1;
        let expectedSanction = 'Warning';
        let expectedStatus = 'Active - Under Warning';

        if (nextOffenseNumber === 2) {
            expectedSanction = 'Suspension';
            expectedStatus = 'Suspended';
        } else if (nextOffenseNumber >= 3) {
            expectedSanction = 'Revocation';
            expectedStatus = 'Revoked';
        }

        res.status(200).json({
            success: true,
            franchise: {
                _id: franchise._id,
                fullName: franchise.fullName,
                plateNo: franchise.plateNo,
                todaName: franchise.todaName,
                status: franchise.status,
                driverName: franchise.driverName,
                currentSanction: franchise.currentSanction,
                suspensionEndDate: franchise.suspensionEndDate
            },
            activeViolationsCount,
            totalViolationsCount,
            nextOffenseNumber,
            expectedSanction,
            expectedStatus,
            history,
            policy: settings.violationPolicy
        });
    } catch (error) {
        console.error('Error fetching violation history:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve operator violation history.' });
    }
};

/**
 * Record a new violation with 3-Tier Progressive Discipline Engine:
 * - 1st Offense: Official Warning (Active - Under Warning)
 * - 2nd Offense: Fine & Suspension (Suspended)
 * - 3rd Offense: Permanent Revocation (Revoked)
 * - Grave Offense: Direct Revocation (Revoked)
 */
const recordViolation = async (req, res) => {
    try {
        const {
            franchiseId,
            violationType,
            violationCode,
            severity = 'Medium',
            isGrave: isGraveInput = false,
            driverName = '',
            remarks = '',
            customFine,
            customSuspensionDays
        } = req.body;

        if (!franchiseId || !violationType) {
            return res.status(400).json({ 
                success: false, 
                message: 'Franchise ID and violation type are strictly required.' 
            });
        }

        const franchise = await Franchise.findById(franchiseId).populate('operator');
        if (!franchise) {
            return res.status(404).json({ success: false, message: 'Target franchise not found.' });
        }

        // Fetch authoritative system policy
        let settings = await SystemSettings.findOne().sort({ updatedAt: -1, createdAt: -1 });
        const policyTiers = settings?.violationPolicy?.tiers || {};
        const policyTypes = settings?.violationPolicy?.types || [];

        // Check if the violation type itself is configured as Grave in settings
        const matchedTypeConfig = policyTypes.find(t => 
            (violationCode && t.code === violationCode) || 
            t.name.toLowerCase() === violationType.toLowerCase()
        );

        const isGrave = Boolean(
            isGraveInput === true || 
            isGraveInput === 'true' || 
            severity === 'Grave' || 
            (matchedTypeConfig && matchedTypeConfig.isGrave)
        );

        // Count previous active violations for this franchise
        const priorActiveCount = await Violation.countDocuments({
            franchise: franchise._id,
            status: 'Active'
        });

        const offenseNumber = priorActiveCount + 1;

        // Progressive Discipline Engine Decision
        let sanctionType = 'Warning';
        let resultingStatus = 'Active - Under Warning';
        let fineAmount = 0;
        let suspensionDays = 0;
        let suspensionStartDate = null;
        let suspensionEndDate = null;

        if (isGrave) {
            // Grave violation immediately escalates to Revocation
            sanctionType = 'Revocation';
            resultingStatus = 'Revoked';
        } else if (offenseNumber === 1) {
            // 1st Offense: Official Warning
            sanctionType = 'Warning';
            resultingStatus = 'Active - Under Warning';
            fineAmount = 0;
            suspensionDays = 0;
        } else if (offenseNumber === 2) {
            // 2nd Offense: Fine + Temporary Suspension
            sanctionType = 'Suspension';
            resultingStatus = 'Suspended';
            fineAmount = Number(customFine) || matchedTypeConfig?.defaultFine || policyTiers.secondOffense?.defaultFine || 500;
            suspensionDays = Number(customSuspensionDays) || matchedTypeConfig?.suspensionDays || policyTiers.secondOffense?.defaultSuspensionDays || 15;
            suspensionStartDate = new Date();
            suspensionEndDate = new Date(Date.now() + suspensionDays * 24 * 60 * 60 * 1000);
        } else {
            // 3rd Offense or higher: Permanent Revocation
            sanctionType = 'Revocation';
            resultingStatus = 'Revoked';
        }

        // Handle uploaded evidence
        let evidenceUrl = '';
        if (req.file) {
            evidenceUrl = req.file.path || req.file.secure_url || '';
        } else if (req.files) {
            const f = Array.isArray(req.files) ? req.files[0] : (req.files.evidence ? req.files.evidence[0] : null);
            if (f) evidenceUrl = f.path || f.secure_url || '';
        }
        if (!evidenceUrl && req.body.evidenceUrl) {
            evidenceUrl = req.body.evidenceUrl;
        }

        // Update target franchise status and suspension fields
        franchise.status = resultingStatus;
        franchise.currentSanction = `${sanctionType} (${offenseNumber}${offenseNumber === 1 ? 'st' : offenseNumber === 2 ? 'nd' : offenseNumber === 3 ? 'rd' : 'th'} Offense)`;
        franchise.activeViolationCount = priorActiveCount + 1;

        if (resultingStatus === 'Suspended') {
            franchise.suspensionEndDate = suspensionEndDate;
            franchise.suspensionReason = `${violationType} (2nd Offense)`;
        } else if (resultingStatus === 'Revoked') {
            franchise.cancelReason = isGrave 
                ? `Revoked due to Grave Violation: ${violationType}`
                : `Revoked due to 3rd Offense Violation: ${violationType}`;
            if (evidenceUrl) franchise.evidenceUrl = evidenceUrl;
        }

        await franchise.save();

        // Save new violation record
        const violation = await Violation.create({
            operator: franchise.operator._id || franchise.operator,
            franchise: franchise._id,
            plateNo: franchise.plateNo,
            bodyNumber: franchise.bodyType || req.body.bodyNumber || '',
            driverName: driverName || franchise.driverName || franchise.fullName,
            violationType,
            violationCode: violationCode || matchedTypeConfig?.code || 'OTHER',
            severity: isGrave ? 'Grave' : (severity || matchedTypeConfig?.severity || 'Medium'),
            isGrave,
            offenseNumber,
            sanction: {
                type: sanctionType,
                resultingStatus,
                fineAmount,
                suspensionDays,
                suspensionStartDate,
                suspensionEndDate
            },
            remarks: remarks || '',
            evidenceUrl,
            recordedBy: req.user._id,
            recordedByName: req.user.name || 'BPLO Staff',
            status: 'Active'
        });

        // Notify Operator in real-time
        try {
            const operatorId = (franchise.operator._id || franchise.operator).toString();
            const notifTitle = isGrave 
                ? 'URGENT: Franchise Revoked (Grave Violation)'
                : offenseNumber === 1
                    ? 'Official Warning Issued (1st Offense)'
                    : offenseNumber === 2
                        ? `Franchise Suspended (${suspensionDays} Days) - 2nd Offense`
                        : 'Franchise Revoked (3rd Offense)';
            
            const notifMessage = isGrave
                ? `Your franchise for unit ${franchise.plateNo} has been revoked due to a grave municipal violation: ${violationType}.`
                : offenseNumber === 1
                    ? `An official warning has been recorded against unit ${franchise.plateNo} for: ${violationType}. Please adhere strictly to transport regulations.`
                    : offenseNumber === 2
                        ? `Unit ${franchise.plateNo} is suspended for ${suspensionDays} days with an administrative fine of ₱${fineAmount} due to: ${violationType}.`
                        : `Your franchise for unit ${franchise.plateNo} has been revoked following a 3rd offense violation (${violationType}).`;

            const opNotif = await Notification.create({
                recipient: operatorId,
                type: 'status_change',
                title: notifTitle,
                message: notifMessage,
                relatedFranchise: franchise._id
            });
            emitToUser(operatorId, 'notification', opNotif);
        } catch (notifErr) {
            console.error('Error emitting operator notification:', notifErr);
        }

        // Audit Log
        logAudit(req, {
            action: 'VIOLATION_RECORDED',
            targetType: 'Violation',
            targetId: violation._id.toString(),
            details: {
                franchiseId: franchise._id.toString(),
                plateNo: franchise.plateNo,
                operatorName: franchise.fullName,
                violationType,
                offenseNumber,
                sanction: sanctionType,
                resultingStatus,
                isGrave,
                fineAmount,
                suspensionDays,
                evidenceUrl
            }
        });

        res.status(201).json({
            success: true,
            message: `Violation recorded as ${offenseNumber}${offenseNumber === 1 ? 'st' : offenseNumber === 2 ? 'nd' : offenseNumber === 3 ? 'rd' : 'th'} Offense. Sanction applied: ${sanctionType} (${resultingStatus}).`,
            violation,
            franchise: {
                _id: franchise._id,
                status: franchise.status,
                currentSanction: franchise.currentSanction,
                suspensionEndDate: franchise.suspensionEndDate
            }
        });
    } catch (error) {
        console.error('Error recording violation:', error);
        res.status(500).json({ success: false, message: 'Server error while processing violation.' });
    }
};

/**
 * Settle violation fine or lift suspension (BPLO Staff / Admin)
 */
const settleOrLiftViolation = async (req, res) => {
    try {
        const { id } = req.params;
        const { settledNotes = '' } = req.body;

        const violation = await Violation.findById(id);
        if (!violation) {
            return res.status(404).json({ success: false, message: 'Violation record not found.' });
        }

        violation.status = 'Settled';
        violation.settledAt = new Date();
        violation.settledNotes = settledNotes;
        violation.settledBy = req.user._id;
        await violation.save();

        // Check if there are other remaining active violations on this franchise
        const remainingActiveCount = await Violation.countDocuments({
            franchise: violation.franchise,
            status: 'Active'
        });

        const franchise = await Franchise.findById(violation.franchise);
        if (franchise) {
            franchise.activeViolationCount = remainingActiveCount;
            if (remainingActiveCount === 0 && (franchise.status === 'Suspended' || franchise.status === 'Active - Under Warning')) {
                // Restore franchise to fully Active status
                franchise.status = 'Active';
                franchise.currentSanction = 'Good Standing (Violations Settled)';
                franchise.suspensionEndDate = null;
                franchise.suspensionReason = '';
            } else if (remainingActiveCount === 1 && franchise.status === 'Suspended') {
                // If 2nd offense settled but 1st offense still logged as warning
                franchise.status = 'Active - Under Warning';
                franchise.currentSanction = 'Warning (Active)';
                franchise.suspensionEndDate = null;
                franchise.suspensionReason = '';
            }
            await franchise.save();
        }

        logAudit(req, {
            action: 'VIOLATION_SETTLED',
            targetType: 'Violation',
            targetId: violation._id.toString(),
            details: {
                franchiseId: String(violation.franchise),
                plateNo: violation.plateNo,
                settledNotes,
                resultingFranchiseStatus: franchise?.status
            }
        });

        res.status(200).json({
            success: true,
            message: 'Violation successfully settled. Franchise standing updated.',
            violation,
            franchiseStatus: franchise?.status
        });
    } catch (error) {
        console.error('Error settling violation:', error);
        res.status(500).json({ success: false, message: 'Failed to settle violation.' });
    }
};

module.exports = {
    getViolations,
    getOperatorViolationHistory,
    recordViolation,
    settleOrLiftViolation
};
