const { randomUUID } = require('node:crypto');
const Violation = require('../models/violationModel');
const Franchise = require('../models/franchiseModel');
const SystemSettings = require('../models/systemSettingsModel');
const Notification = require('../models/notificationModel');
const { emitToUser } = require('../config/socket');
const { logAudit } = require('../utils/auditLogger');
const { getIssuedPermit, hasIssuedPermitSnapshot, issuedPermitSnapshotQuery } = require('../utils/issuedPermit');
const {
    buildUnitViolationOr,
    findUnsettledViolationsForUnit,
    findCumulativeValidViolationsForUnit
} = require('../utils/disciplineHelper');
const { isTrustedDocumentUrl } = require('../services/franchiseService');
const { isExpired, getManilaNow, getManilaEndOfDay } = require('../utils/phTime');

const SANCTIONABLE_FRANCHISE_STATUSES = ['Active', 'Active - Under Warning', 'Suspended'];
const CITATION_REVOCATION_LABEL = /^Revocation \((?:\d+(?:st|nd|rd|th) Offense|Grave Violation|Active)\)$/;
const DISCIPLINE_LEASE_MS = 10 * 60 * 1000;

const DEFAULT_VIOLATION_POLICY = {
    policyVersion: 1,
    policyUpdatedAt: null,
    types: [
        { code: 'OVERCHARGING', name: 'Overcharging of fare', severity: 'Medium', isGrave: false, defaultFine: 500, suspensionDays: 15, isActive: true },
        { code: 'REFUSAL_CONVEY', name: 'Refusal to convey passengers', severity: 'Medium', isGrave: false, defaultFine: 500, suspensionDays: 15, isActive: true },
        { code: 'DISCOURTEOUS', name: 'Arrogant/Discourteous behavior', severity: 'Low', isGrave: false, defaultFine: 300, suspensionDays: 7, isActive: true },
        { code: 'NO_FRANCHISE', name: 'Operating without valid franchise / Colorum', severity: 'Grave', isGrave: true, defaultFine: 2000, suspensionDays: 30, isActive: true },
        { code: 'OUT_OF_LINE', name: 'Out of line operation', severity: 'Medium', isGrave: false, defaultFine: 500, suspensionDays: 15, isActive: true },
        { code: 'RECKLESS_DRIVING', name: 'Reckless or dangerous driving', severity: 'High', isGrave: false, defaultFine: 1000, suspensionDays: 30, isActive: true },
        { code: 'OTHER', name: 'Other municipal ordinance violation', severity: 'Low', isGrave: false, defaultFine: 300, suspensionDays: 7, isActive: true }
    ],
    tiers: {
        firstOffense: {
            sanction: 'Warning',
            resultingStatus: 'Active - Under Warning',
            description: 'Official Warning recorded in municipal database; franchise remains operational.'
        },
        secondOffense: {
            sanction: 'Suspension',
            resultingStatus: 'Suspended',
            defaultFine: 500,
            defaultSuspensionDays: 15,
            description: 'Temporary suspension of franchise operations and imposition of administrative fine.'
        },
        thirdOffense: {
            sanction: 'Revocation',
            resultingStatus: 'Revoked',
            description: 'Immediate and permanent revocation of MTOP franchise and permit.'
        },
        graveViolation: {
            sanction: 'Revocation',
            resultingStatus: 'Revoked',
            description: 'Direct revocation regardless of prior offense count due to critical offense severity.'
        }
    }
};

function resolveLiveViolationPolicy(settingsDoc) {
    const rawPolicy = settingsDoc?.violationPolicy;
    const rawTypes = Array.isArray(rawPolicy?.types) && rawPolicy.types.length > 0
        ? rawPolicy.types
        : DEFAULT_VIOLATION_POLICY.types;

    const activeTypes = rawTypes
        .filter((t) => t && t.isActive !== false)
        .map((t) => (typeof t.toObject === 'function' ? t.toObject() : { ...t }));

    const rawTiers = rawPolicy?.tiers || {};
    const tiers = {
        firstOffense: { ...DEFAULT_VIOLATION_POLICY.tiers.firstOffense, ...(rawTiers.firstOffense || {}) },
        secondOffense: { ...DEFAULT_VIOLATION_POLICY.tiers.secondOffense, ...(rawTiers.secondOffense || {}) },
        thirdOffense: { ...DEFAULT_VIOLATION_POLICY.tiers.thirdOffense, ...(rawTiers.thirdOffense || {}) },
        graveViolation: { ...DEFAULT_VIOLATION_POLICY.tiers.graveViolation, ...(rawTiers.graveViolation || {}) }
    };

    const parsedVersion = Number(rawPolicy?.policyVersion);
    const policyVersion = Number.isFinite(parsedVersion) && parsedVersion >= 1 ? parsedVersion : 1;
    const policyUpdatedAt = rawPolicy?.policyUpdatedAt || settingsDoc?.updatedAt || settingsDoc?.createdAt || null;

    return {
        policyVersion,
        policyUpdatedAt,
        types: activeTypes,
        tiers
    };
}

function resolveActiveViolationType(livePolicy, violationCode, violationType) {
    const cleanCode = String(violationCode || '').trim().toUpperCase();
    const cleanName = String(violationType || '').trim().toLowerCase();
    const cleanNameUpper = String(violationType || '').trim().toUpperCase();
    const activeTypes = livePolicy.types || [];

    if (cleanCode) {
        return activeTypes.find((t) => String(t?.code || '').trim().toUpperCase() === cleanCode) || null;
    }

    if (cleanName) {
        return activeTypes.find((t) => (
            String(t?.name || '').trim().toLowerCase() === cleanName ||
            String(t?.code || '').trim().toUpperCase() === cleanNameUpper
        )) || null;
    }

    return null;
}

function computeFineSummary(violations = []) {
    let totalUnpaidFines = 0;
    let totalSettledFines = 0;

    for (const v of violations) {
        const amt = Number(v?.sanction?.fineAmount ?? 0);
        if (!Number.isFinite(amt) || amt <= 0) continue;
        if (v.status === 'Active') {
            totalUnpaidFines += amt;
        } else if (v.status === 'Settled') {
            totalSettledFines += amt;
        }
    }

    return {
        totalUnpaidFines,
        totalSettledFines,
        totalFinesAssessed: totalUnpaidFines + totalSettledFines
    };
}

function sortRemainingViolations(violations = []) {
    return [...violations].sort((a, b) => {
        const aTime = a?.sanction?.suspensionEndDate ? new Date(a.sanction.suspensionEndDate).getTime() : 0;
        const bTime = b?.sanction?.suspensionEndDate ? new Date(b.sanction.suspensionEndDate).getTime() : 0;
        if (bTime !== aTime) return bTime - aTime;
        return String(a?._id || '').localeCompare(String(b?._id || ''));
    });
}

// A citation and its franchise are separate documents, even on standalone MongoDB.
async function acquireDisciplineWrite(franchiseId) {
    const locks = Franchise.db.collection('system_locks');
    const _id = `franchise_discipline:${Franchise.schema.path('_id').cast(franchiseId)}`;
    const ownerId = randomUUID();
    const now = new Date();
    await locks.deleteOne({ _id, expiresAt: { $lte: now } });
    try {
        await locks.insertOne({ _id, ownerId, acquiredAt: now, expiresAt: new Date(now.getTime() + DISCIPLINE_LEASE_MS) });
    } catch (error) {
        if (error.code === 11000) return null;
        throw error;
    }

    return async () => {
        await locks.deleteOne({ _id, ownerId }).catch((error) => {
            console.error('Failed to release franchise discipline lease:', error);
        });
    };
}

function disciplineTarget(franchise) {
    const permit = getIssuedPermit(franchise);
    const hasSnapshot = hasIssuedPermitSnapshot(franchise);
    const statusField = hasSnapshot ? 'previousStatus' : 'status';
    const expiryField = hasSnapshot ? 'previousExpiryDate' : 'expiryDate';
    const renewalSnapshot = issuedPermitSnapshotQuery();
    const filter = {
        [statusField]: hasSnapshot ? permit.status : franchise.get('status', null, { getters: false }),
        [expiryField]: permit.expiryDate ?? null,
        ...(hasSnapshot ? { $and: [renewalSnapshot] } : { $nor: [renewalSnapshot] })
    };
    return { permit, hasSnapshot, statusField, filter };
}

function offenseLabel(offenseNumber) {
    const suffix = offenseNumber === 1 ? 'st' : offenseNumber === 2 ? 'nd' : offenseNumber === 3 ? 'rd' : 'th';
    return `${offenseNumber}${suffix} Offense`;
}

function settlementStanding(remaining, expiryDate, now, { isLift = false } = {}) {
    const revocation = remaining.find(({ sanction }) => sanction?.type === 'Revocation');
    if (revocation) {
        const label = revocation.isGrave
            ? 'Grave Violation'
            : (revocation.offenseNumber ? offenseLabel(revocation.offenseNumber) : 'Active');
        return { status: 'Revoked', currentSanction: `Revocation (${label})`, revocation };
    }

    const suspension = remaining.find(({ sanction }) => sanction?.type === 'Suspension' && (
        !sanction.suspensionEndDate ||
        new Date(sanction.suspensionEndDate) > now ||
        Number(sanction.fineAmount || 0) > 0
    ));
    if (suspension) {
        const offense = offenseLabel(suspension.offenseNumber);
        return {
            status: 'Suspended',
            currentSanction: `Suspension (${offense})`,
            suspensionEndDate: suspension.sanction.suspensionEndDate ?? null,
            suspensionReason: `${suspension.violationType} (${offense})`
        };
    }

    if (isExpired(expiryDate, now)) {
        return { status: 'Expired', currentSanction: '' };
    }
    return remaining.length
        ? { status: 'Active - Under Warning', currentSanction: 'Warning (Active)' }
        : {
            status: 'Active',
            currentSanction: isLift ? 'Good Standing (Citation Lifted)' : 'Good Standing (Violations Settled)'
        };
}

function citationRevocationReason({ isGrave, violationType, offenseNumber }) {
    if (isGrave) {
        return `Revoked due to Grave Violation: ${violationType}`;
    }
    const label = offenseNumber && offenseNumber >= 3 ? offenseLabel(offenseNumber) : '3rd Offense';
    return `Revoked due to ${label} Violation: ${violationType}`;
}

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
            .populate('franchise', 'fullName plateNo todaName status make motorNo currentSanction')
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
 * Uses the exact same unit-lineage cumulative and unsettled queries as recordViolation.
 */
const getOperatorViolationHistory = async (req, res) => {
    try {
        const { franchiseId } = req.params;
        const franchise = await Franchise.findById(franchiseId).populate('operator', 'name email contact');
        if (!franchise) {
            return res.status(404).json({ success: false, message: 'Franchise not found.' });
        }

        const callerRole = String(req.user?.role || '').toLowerCase().trim().replace(/_/g, ' ');
        if (
            (callerRole === 'operator' || callerRole === 'toda president') &&
            String(franchise.operator?._id || franchise.operator) !== String(req.user._id)
        ) {
            return res.status(403).json({
                success: false,
                message: 'ACCESS DENIED: You can only view violation history for your own franchise.'
            });
        }

        const unitScope = {
            plateNo: franchise.plateNo,
            motorNo: franchise.motorNo,
            chassisNo: franchise.chassisNo,
            operatorId: franchise.operator?._id || franchise.operator,
            franchiseId: franchise._id
        };

        const [unitViolationOr, cumulativeUnitViolations, unsettledUnitViolations, settingsDoc] = await Promise.all([
            buildUnitViolationOr(unitScope),
            findCumulativeValidViolationsForUnit(unitScope),
            findUnsettledViolationsForUnit(unitScope),
            SystemSettings.findOne().sort({ updatedAt: -1, createdAt: -1 }).lean()
        ]);

        const history = unitViolationOr.length > 0
            ? await Violation.find({ $or: unitViolationOr })
                .populate('recordedBy', 'name role')
                .populate('franchise', 'fullName plateNo status')
                .sort({ createdAt: -1 })
            : [];

        const livePolicy = resolveLiveViolationPolicy(settingsDoc);
        const currentTrackedCount = Number(franchise.activeViolationCount || 0);
        const activeViolationCount = unsettledUnitViolations.length;
        const cumulativeOffenseCount = Math.max(cumulativeUnitViolations.length, currentTrackedCount);
        const totalViolationsCount = history.length;
        const fineSummary = computeFineSummary(history);

        const nextOffenseNumber = cumulativeOffenseCount + 1;
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
                status: getIssuedPermit(franchise).status,
                driverName: franchise.driverName,
                currentSanction: franchise.currentSanction,
                suspensionEndDate: franchise.suspensionEndDate,
                activeViolationCount
            },
            cumulativeOffenseCount,
            activeViolationCount,
            activeViolationsCount: activeViolationCount,
            totalViolationsCount,
            nextOffenseNumber,
            expectedSanction,
            expectedStatus,
            fineSummary,
            history,
            policy: livePolicy
        });
    } catch (error) {
        console.error('Error fetching violation history:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve operator violation history.' });
    }
};

/**
 * Record a new violation with Server-Authoritative 3-Tier Progressive Discipline Engine
 * and Immutable Policy Snapshotting:
 * - 1st Offense: Official Warning + Configured Fine (Active - Under Warning)
 * - 2nd Offense: Suspension + Configured Fine (Suspended)
 * - 3rd+ Offense: Permanent Revocation + Configured Fine (Revoked)
 * - Grave Offense: Direct Permanent Revocation + Configured Fine (Revoked)
 */
const recordViolation = async (req, res) => {
    let releaseDisciplineWrite;
    try {
        // Strictly ignore client-supplied price/severity/grave/suspension overrides.
        const {
            franchiseId,
            violationType,
            violationCode,
            driverName = '',
            remarks = ''
        } = req.body || {};

        if (!franchiseId || (!String(violationCode || '').trim() && !String(violationType || '').trim())) {
            return res.status(400).json({
                success: false,
                message: 'Franchise ID and violation type are strictly required.'
            });
        }

        // Handle uploaded documentary evidence or validate trusted evidenceUrl
        let evidenceUrl = '';
        if (req.file) {
            evidenceUrl = req.file.path || req.file.secure_url || '';
        } else if (req.files) {
            const f = Array.isArray(req.files) ? req.files[0] : (req.files.evidence ? req.files.evidence[0] : null);
            if (f) evidenceUrl = f.path || f.secure_url || '';
        }
        if (!evidenceUrl && req.body?.evidenceUrl) {
            const candidateUrl = String(req.body.evidenceUrl).trim();
            if (!isTrustedDocumentUrl(candidateUrl)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid documentary evidence URL. Only uploaded files or trusted server-issued asset URLs are allowed.'
                });
            }
            evidenceUrl = candidateUrl;
        }

        releaseDisciplineWrite = await acquireDisciplineWrite(franchiseId);
        if (!releaseDisciplineWrite) {
            return res.status(409).json({ success: false, message: 'A discipline update is already in progress. Please try again.' });
        }

        const franchise = await Franchise.findById(franchiseId).populate('operator');
        if (!franchise) {
            return res.status(404).json({ success: false, message: 'Target franchise not found.' });
        }

        // H5: Restrict standing-changing sanctions strictly to operational/issued permits
        const target = disciplineTarget(franchise);
        if (
            !SANCTIONABLE_FRANCHISE_STATUSES.includes(target.permit.status) ||
            isExpired(target.permit.expiryDate) ||
            franchise.isArchived === true
        ) {
            return res.status(400).json({
                success: false,
                message: 'Sanctions can only be recorded against active or currently suspended permits.'
            });
        }

        // Resolve authoritative policy & active violation type 100% server-side
        const settingsDoc = await SystemSettings.findOne().sort({ updatedAt: -1, createdAt: -1 }).lean();
        const livePolicy = resolveLiveViolationPolicy(settingsDoc);
        const policyTiers = livePolicy.tiers || {};
        const matchedTypeConfig = resolveActiveViolationType(livePolicy, violationCode, violationType);

        if (!matchedTypeConfig) {
            return res.status(400).json({
                success: false,
                message: 'Selected violation type is invalid or inactive in System Settings.'
            });
        }

        const resolvedViolationCode = String(matchedTypeConfig.code || 'OTHER').trim();
        const resolvedViolationType = String(matchedTypeConfig.name || violationType).trim();
        const isGrave = Boolean(matchedTypeConfig.isGrave || matchedTypeConfig.severity === 'Grave');
        const resolvedSeverity = isGrave ? 'Grave' : (matchedTypeConfig.severity || 'Medium');

        // Count cumulative valid strikes (Active + Settled) and unsettled (Active) violations across unit lineage
        const unitScope = {
            plateNo: franchise.plateNo,
            motorNo: franchise.motorNo,
            chassisNo: franchise.chassisNo,
            operatorId: franchise.operator?._id || franchise.operator,
            franchiseId: franchise._id
        };
        const [cumulativeUnitViolations, unsettledUnitViolations] = await Promise.all([
            findCumulativeValidViolationsForUnit(unitScope),
            findUnsettledViolationsForUnit(unitScope)
        ]);

        const currentTrackedCount = Number(franchise.activeViolationCount || 0);
        const priorActiveCount = unsettledUnitViolations.length;
        const nextActiveViolationCount = Math.max(priorActiveCount, currentTrackedCount) + 1;
        const offenseNumber = Math.max(cumulativeUnitViolations.length, currentTrackedCount) + 1;

        // Authoritative fine calculation (respecting 0 via nullish coalescing) applied on ALL tiers
        const rawFine = matchedTypeConfig.defaultFine ?? policyTiers.secondOffense?.defaultFine ?? 500;
        const fineAmount = Number.isFinite(Number(rawFine)) ? Math.max(0, Number(rawFine)) : 0;

        // Server-authoritative Asia/Manila timestamp
        const now = getManilaNow();

        // Progressive Discipline Engine Decision
        let sanctionType = 'Warning';
        let resultingStatus = 'Active - Under Warning';
        let suspensionDays = 0;
        let suspensionStartDate = null;
        let suspensionEndDate = null;
        let appliedTier = 'firstOffense';

        if (isGrave) {
            sanctionType = 'Revocation';
            resultingStatus = 'Revoked';
            suspensionDays = 0;
            appliedTier = 'graveViolation';
        } else if (offenseNumber === 1) {
            sanctionType = 'Warning';
            resultingStatus = 'Active - Under Warning';
            suspensionDays = 0;
            appliedTier = 'firstOffense';
        } else if (offenseNumber === 2) {
            sanctionType = 'Suspension';
            resultingStatus = 'Suspended';
            const rawSuspDays = matchedTypeConfig.suspensionDays ?? policyTiers.secondOffense?.defaultSuspensionDays ?? 15;
            suspensionDays = Number.isFinite(Number(rawSuspDays)) ? Math.max(0, Number(rawSuspDays)) : 15;
            suspensionStartDate = now;
            const targetEnd = new Date(now.getTime() + suspensionDays * 24 * 60 * 60 * 1000);
            suspensionEndDate = getManilaEndOfDay(targetEnd) || targetEnd;
            appliedTier = 'secondOffense';
        } else {
            sanctionType = 'Revocation';
            resultingStatus = 'Revoked';
            suspensionDays = 0;
            appliedTier = 'thirdOffense';
        }

        const operatorRef = franchise.operator?._id || franchise.operator || null;
        const sanctionLabel = isGrave
            ? 'Revocation (Grave Violation)'
            : `${sanctionType} (${offenseLabel(offenseNumber)})`;

        const policySnapshot = {
            policyVersion: livePolicy.policyVersion,
            policyUpdatedAt: livePolicy.policyUpdatedAt || now,
            violationCode: resolvedViolationCode,
            violationName: resolvedViolationType,
            severity: resolvedSeverity,
            isGrave,
            fineAtCitation: fineAmount,
            suspensionDaysAtCitation: suspensionDays,
            appliedTier,
            lockedAt: now
        };

        // Save immutable violation citation record, then atomically update franchise with rollback on conflict/failure
        const violation = await Violation.create({
            operator: operatorRef,
            franchise: franchise._id,
            plateNo: franchise.plateNo,
            bodyNumber: franchise.bodyNumber || req.body?.bodyNumber || '',
            driverName: driverName || franchise.driverName || franchise.fullName,
            violationType: resolvedViolationType,
            violationCode: resolvedViolationCode,
            severity: resolvedSeverity,
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
            policySnapshot,
            remarks: remarks || '',
            evidenceUrl,
            recordedBy: req.user?._id,
            recordedByName: req.user?.name || 'OVM Franchising Staff (LLSA I)',
            status: 'Active'
        });

        const franchiseSetFields = {
            [target.statusField]: resultingStatus,
            currentSanction: sanctionLabel,
            activeViolationCount: nextActiveViolationCount
        };
        if (resultingStatus === 'Suspended') {
            franchiseSetFields.suspensionEndDate = suspensionEndDate;
            franchiseSetFields.suspensionReason = `${resolvedViolationType} (${offenseLabel(offenseNumber)})`;
        } else if (resultingStatus === 'Revoked') {
            if (target.hasSnapshot) {
                franchiseSetFields.suspensionReason = citationRevocationReason(violation);
            } else {
                franchiseSetFields.cancelReason = citationRevocationReason(violation);
                if (evidenceUrl) franchiseSetFields.evidenceUrl = evidenceUrl;
            }
        }

        let updatedFranchise;
        const activeCountFilter = currentTrackedCount === 0
            ? { $or: [{ activeViolationCount: 0 }, { activeViolationCount: null }, { activeViolationCount: { $exists: false } }] }
            : { activeViolationCount: currentTrackedCount };

        try {
            updatedFranchise = await Franchise.findOneAndUpdate(
                {
                    _id: franchise._id,
                    ...target.filter,
                    isArchived: { $ne: true },
                    ...activeCountFilter
                },
                {
                    $set: franchiseSetFields
                },
                { returnDocument: 'after' }
            );
        } catch (updateErr) {
            try {
                await Violation.findByIdAndDelete(violation._id);
            } catch (cleanupErr) {
                console.error(`[ViolationController] CRITICAL: Failed to delete Violation ${violation._id} after Franchise update error:`, cleanupErr);
                throw cleanupErr;
            }
            throw updateErr;
        }

        if (!updatedFranchise) {
            try {
                await Violation.findByIdAndDelete(violation._id);
            } catch (cleanupErr) {
                console.error(`[ViolationController] CRITICAL: Failed to delete Violation ${violation._id} after 409 conflict:`, cleanupErr);
                throw cleanupErr;
            }
            return res.status(409).json({
                success: false,
                message: 'Concurrent violation update or ineligible franchise status detected. Please refresh and try again.'
            });
        }

        await releaseDisciplineWrite();
        releaseDisciplineWrite = null;

        // Notify Operator in real-time
        try {
            const operatorId = operatorRef ? operatorRef.toString() : null;
            if (operatorId) {
                const fineText = fineAmount > 0 ? ` with an administrative fine of ₱${fineAmount.toLocaleString()}` : '';
                const notifTitle = isGrave
                    ? 'URGENT: Franchise Revoked (Grave Violation)'
                    : offenseNumber === 1
                        ? 'Official Warning Issued (1st Offense)'
                        : offenseNumber === 2
                            ? `Franchise Suspended (${suspensionDays} Days) - 2nd Offense`
                            : `Franchise Revoked (${offenseLabel(offenseNumber)})`;

                const notifMessage = isGrave
                    ? `Your franchise for unit ${franchise.plateNo} has been permanently revoked due to a grave municipal violation (${resolvedViolationType})${fineText}.`
                    : offenseNumber === 1
                        ? `An official warning has been recorded against unit ${franchise.plateNo} for ${resolvedViolationType}${fineText}. Please adhere strictly to transport regulations.`
                        : offenseNumber === 2
                            ? `Unit ${franchise.plateNo} is suspended for ${suspensionDays} days${fineText} due to ${resolvedViolationType}.`
                            : `Your franchise for unit ${franchise.plateNo} has been permanently revoked following a ${offenseLabel(offenseNumber)} violation (${resolvedViolationType})${fineText}.`;

                const opNotif = await Notification.create({
                    recipient: operatorId,
                    type: 'status_change',
                    title: notifTitle,
                    message: notifMessage,
                    relatedFranchise: franchise._id
                });
                emitToUser(operatorId, 'notification', opNotif);
            }
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
                violationCode: resolvedViolationCode,
                violationType: resolvedViolationType,
                offenseNumber,
                appliedTier,
                policyVersion: livePolicy.policyVersion,
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
            message: isGrave
                ? `Grave violation recorded. Sanction applied: ${sanctionType} (${resultingStatus}).`
                : `Violation recorded as ${offenseLabel(offenseNumber)}. Sanction applied: ${sanctionType} (${resultingStatus}).`,
            violation,
            franchise: {
                _id: updatedFranchise._id,
                status: getIssuedPermit(updatedFranchise).status,
                currentSanction: updatedFranchise.currentSanction,
                suspensionEndDate: updatedFranchise.suspensionEndDate
            }
        });
    } catch (error) {
        console.error('Error recording violation:', error);
        res.status(500).json({ success: false, message: 'Server error while processing violation.' });
    } finally {
        await releaseDisciplineWrite?.();
    }
};

/**
 * Settle violation fine (action: 'settle') or dismiss citation in error (action: 'lift')
 * OVM / LLSA I Staff only.
 */
const settleOrLiftViolation = async (req, res) => {
    let releaseDisciplineWrite;
    try {
        const { id } = req.params;
        const { settledNotes = '' } = req.body || {};
        const rawAction = String(req.body?.action || 'settle').trim().toLowerCase();

        if (!['settle', 'lift', 'dismiss'].includes(rawAction)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid resolution action. Use "settle" to record fine payment or "lift" to dismiss a citation in error.'
            });
        }

        const isLift = rawAction === 'lift' || rawAction === 'dismiss';
        const nextViolationStatus = isLift ? 'Lifted' : 'Settled';

        const existingViolation = await Violation.findById(id);
        if (!existingViolation) {
            return res.status(404).json({ success: false, message: 'Violation record not found.' });
        }

        if (existingViolation.status !== 'Active') {
            return res.status(409).json({
                success: false,
                message: 'Violation has already been settled or lifted.'
            });
        }

        releaseDisciplineWrite = await acquireDisciplineWrite(existingViolation.franchise);
        if (!releaseDisciplineWrite) {
            return res.status(409).json({ success: false, message: 'A discipline update is already in progress. Please try again.' });
        }

        const franchise = await Franchise.findById(existingViolation.franchise);
        const priorViolationState = {
            status: existingViolation.status,
            settledAt: existingViolation.settledAt || null,
            settledNotes: existingViolation.settledNotes || '',
            settledBy: existingViolation.settledBy || null
        };

        const settledAt = getManilaNow();
        const violation = await Violation.findOneAndUpdate(
            { _id: id, status: 'Active' },
            {
                $set: {
                    status: nextViolationStatus,
                    settledAt,
                    settledNotes,
                    settledBy: req.user._id
                }
            },
            { returnDocument: 'after' }
        );

        if (!violation) {
            return res.status(409).json({
                success: false,
                message: 'Violation was already settled or modified concurrently.'
            });
        }

        const rollbackViolation = async () => {
            const result = await Violation.updateOne(
                { _id: violation._id, status: nextViolationStatus, settledAt, settledBy: req.user._id },
                { $set: priorViolationState }
            );
            if (result.matchedCount !== 1) {
                throw new Error(`Violation ${violation._id} changed after resolution.`);
            }
        };

        let updatedFranchise = null;
        try {
            if (franchise) {
                const remainingRaw = await findUnsettledViolationsForUnit({
                    plateNo: franchise.plateNo,
                    motorNo: franchise.motorNo,
                    chassisNo: franchise.chassisNo,
                    operatorId: franchise.operator?._id || franchise.operator,
                    franchiseId: franchise._id
                });
                const remaining = sortRemainingViolations(remainingRaw);

                const target = disciplineTarget(franchise);
                const { status, expiryDate } = target.permit;
                const franchiseSetFields = {
                    activeViolationCount: remaining.length
                };

                const citationRevoked = status === 'Revoked' && CITATION_REVOCATION_LABEL.test(franchise.currentSanction);
                const canUpdateStanding = isLift
                    ? (citationRevoked || SANCTIONABLE_FRANCHISE_STATUSES.includes(status))
                    : SANCTIONABLE_FRANCHISE_STATUSES.includes(status);

                if (canUpdateStanding && franchise.isArchived !== true) {
                    const { status: standing, revocation, ...sanctionFields } = settlementStanding(
                        remaining,
                        expiryDate,
                        settledAt,
                        { isLift }
                    );
                    Object.assign(franchiseSetFields, {
                        [target.statusField]: standing,
                        suspensionEndDate: null,
                        suspensionReason: '',
                        ...sanctionFields
                    });
                    if (!target.hasSnapshot && (citationRevoked || revocation)) {
                        franchiseSetFields.cancelReason = revocation ? citationRevocationReason(revocation) : '';
                        if (revocation?.evidenceUrl) {
                            franchiseSetFields.evidenceUrl = revocation.evidenceUrl;
                        } else if (violation.sanction?.type === 'Revocation' && franchise.evidenceUrl === violation.evidenceUrl) {
                            franchiseSetFields.evidenceUrl = '';
                        }
                    }
                }

                updatedFranchise = await Franchise.findOneAndUpdate(
                    {
                        _id: franchise._id,
                        ...target.filter,
                        updatedAt: franchise.updatedAt ?? null
                    },
                    { $set: franchiseSetFields },
                    { returnDocument: 'after' }
                );
            }
        } catch (franchiseErr) {
            try {
                await rollbackViolation();
            } catch (cleanupErr) {
                console.error(`[ViolationController] CRITICAL: Failed to roll back Violation ${violation._id} after franchise standing update failure:`, cleanupErr);
                throw cleanupErr;
            }
            throw franchiseErr;
        }

        if (franchise && !updatedFranchise) {
            await rollbackViolation();
            return res.status(409).json({
                success: false,
                message: 'Concurrent franchise standing change detected while resolving violation. Please refresh and try again.'
            });
        }

        // If the violation belonged to an archived/surrendered franchise, also recalculate standing
        // on any non-archived active replacement franchise for the same physical unit (H3).
        if (franchise && (franchise.isArchived === true || franchise.status === 'Cancelled')) {
            const esc = (s) => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const idFilters = [];
            if (franchise.plateNo) idFilters.push({ plateNo: { $regex: new RegExp(`^${esc(franchise.plateNo.trim())}$`, 'i') } });
            if (franchise.motorNo) idFilters.push({ motorNo: { $regex: new RegExp(`^${esc(franchise.motorNo.trim())}$`, 'i') } });
            if (franchise.chassisNo) idFilters.push({ chassisNo: { $regex: new RegExp(`^${esc(franchise.chassisNo.trim())}$`, 'i') } });

            if (idFilters.length > 0) {
                const replacement = await Franchise.findOne({
                    _id: { $ne: franchise._id },
                    isArchived: { $ne: true },
                    status: { $nin: ['Cancelled', 'Rejected', 'Revoked'] },
                    $or: idFilters
                });
                if (replacement) {
                    const remainingOnUnit = sortRemainingViolations(await findUnsettledViolationsForUnit({
                        plateNo: replacement.plateNo,
                        motorNo: replacement.motorNo,
                        chassisNo: replacement.chassisNo,
                        operatorId: replacement.operator?._id || replacement.operator,
                        franchiseId: replacement._id
                    }));
                    const replTarget = disciplineTarget(replacement);
                    const replSet = { activeViolationCount: remainingOnUnit.length };
                    const replStatus = replTarget.permit.status;
                    if (SANCTIONABLE_FRANCHISE_STATUSES.includes(replStatus)) {
                        const { status: standing, ...sanctionFields } = settlementStanding(
                            remainingOnUnit,
                            replTarget.permit.expiryDate,
                            settledAt,
                            { isLift }
                        );
                        Object.assign(replSet, {
                            [replTarget.statusField]: standing,
                            suspensionEndDate: null,
                            suspensionReason: '',
                            ...sanctionFields
                        });
                    }
                    await Franchise.updateOne({ _id: replacement._id }, { $set: replSet }).catch((e) => {
                        console.warn('Replacement franchise standing sync failed after settlement:', e.message);
                    });
                }
            }
        }

        await releaseDisciplineWrite();
        releaseDisciplineWrite = null;

        const resultingFranchiseStatus = updatedFranchise ? getIssuedPermit(updatedFranchise).status : undefined;

        // Notify Operator in real-time on settlement or dismissal
        try {
            const operatorRef = violation.operator || franchise?.operator?._id || franchise?.operator || null;
            const operatorId = operatorRef ? operatorRef.toString() : null;
            if (operatorId) {
                const fineAmt = Number(violation.sanction?.fineAmount || 0);
                const notifTitle = isLift
                    ? 'Violation Citation Dismissed / Lifted'
                    : 'Violation Fine Settled';
                const notifMessage = isLift
                    ? `Citation for unit ${violation.plateNo} (${violation.violationType}) has been dismissed/lifted by OVM Franchising Staff.${resultingFranchiseStatus ? ` Current permit standing: ${resultingFranchiseStatus}.` : ''}`
                    : `Your violation citation for unit ${violation.plateNo} (${violation.violationType}${fineAmt > 0 ? `, Fine: ₱${fineAmt.toLocaleString()}` : ''}) has been marked as settled.${resultingFranchiseStatus ? ` Current permit standing: ${resultingFranchiseStatus}.` : ''}`;

                const opNotif = await Notification.create({
                    recipient: operatorId,
                    type: 'status_change',
                    title: notifTitle,
                    message: notifMessage,
                    relatedFranchise: violation.franchise
                });
                emitToUser(operatorId, 'notification', opNotif);
            }
        } catch (notifErr) {
            console.error('Error emitting operator settlement notification:', notifErr);
        }

        logAudit(req, {
            action: isLift ? 'VIOLATION_LIFTED' : 'VIOLATION_SETTLED',
            targetType: 'Violation',
            targetId: violation._id.toString(),
            details: {
                franchiseId: String(violation.franchise),
                plateNo: violation.plateNo,
                resolutionAction: isLift ? 'lift' : 'settle',
                settledNotes,
                resultingFranchiseStatus
            }
        });

        res.status(200).json({
            success: true,
            message: isLift
                ? 'Violation citation dismissed in error and removed from strike history. Franchise standing updated.'
                : resultingFranchiseStatus === 'Revoked'
                    ? 'Violation fine marked as settled. Franchise remains permanently Revoked.'
                    : 'Violation successfully settled. Franchise standing updated.',
            action: isLift ? 'lift' : 'settle',
            violation,
            franchiseStatus: resultingFranchiseStatus
        });
    } catch (error) {
        console.error('Error settling violation:', error);
        res.status(500).json({ success: false, message: 'Failed to resolve violation.' });
    } finally {
        await releaseDisciplineWrite?.();
    }
};

module.exports = {
    getViolations,
    getOperatorViolationHistory,
    recordViolation,
    settleOrLiftViolation
};
