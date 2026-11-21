const { randomUUID } = require('node:crypto');
const Violation = require('../models/violationModel');
const Franchise = require('../models/franchiseModel');
const SystemSettings = require('../models/systemSettingsModel');
const Notification = require('../models/notificationModel');
const { emitToUser } = require('../config/socket');
const { logAudit } = require('../utils/auditLogger');
const { getIssuedPermit, hasIssuedPermitSnapshot, issuedPermitSnapshotQuery } = require('../utils/issuedPermit');
const { isExpired } = require('../utils/phTime');

const SANCTIONABLE_FRANCHISE_STATUSES = ['Active', 'Active - Under Warning', 'Suspended'];
const CITATION_REVOCATION_LABEL = /^Revocation \((?:\d+(?:st|nd|rd|th) Offense|Active)\)$/;
const DISCIPLINE_LEASE_MS = 10 * 60 * 1000;

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

function settlementStanding(remaining, expiryDate, now) {
    const revocation = remaining.find(({ sanction }) => sanction?.type === 'Revocation');
    if (revocation) {
        const offense = revocation.offenseNumber ? offenseLabel(revocation.offenseNumber) : 'Active';
        return { status: 'Revoked', currentSanction: `Revocation (${offense})`, revocation };
    }

    const suspension = remaining.find(({ sanction }) => sanction?.type === 'Suspension' &&
        (!sanction.suspensionEndDate || sanction.suspensionEndDate > now));
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
        : { status: 'Active', currentSanction: 'Good Standing (Violations Settled)' };
}

function citationRevocationReason({ isGrave, violationType }) {
    return isGrave
        ? `Revoked due to Grave Violation: ${violationType}`
        : `Revoked due to 3rd Offense Violation: ${violationType}`;
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
            return res.status(404).json({ success: false, message: 'Franchise not found.' }); } const callerRole = String(req.user?.role || '').toLowerCase().trim().replace(/_/g, ' '); if ((callerRole === 'operator' || callerRole === 'toda president') && String(franchise.operator?._id || franchise.operator) !== String(req.user._id)) { return res.status(403).json({ success: false, message: 'ACCESS DENIED: You can only view violation history for your own franchise.' });
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
 * - 3rd Offense: Revocation (Revoked)
 * - Grave Offense: Direct Revocation (Revoked)
 */
const recordViolation = async (req, res) => {
    let releaseDisciplineWrite;
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
        if (!SANCTIONABLE_FRANCHISE_STATUSES.includes(target.permit.status) ||
            isExpired(target.permit.expiryDate) || franchise.isArchived === true) {
            return res.status(400).json({
                success: false,
                message: 'Sanctions can only be recorded against active or currently suspended permits.'
            });
        }

        // Fetch authoritative system policy
        let settings = await SystemSettings.findOne().sort({ updatedAt: -1, createdAt: -1 });
        const policyTiers = settings?.violationPolicy?.tiers || {};
        const policyTypes = settings?.violationPolicy?.types || [];

        // Check if the violation type itself is configured as Grave in settings
        const matchedTypeConfig = policyTypes.find(t => 
            (violationCode && t.code === violationCode) || 
            (t?.name || '').toLowerCase() === String(violationType || '').toLowerCase()
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

        const currentTrackedCount = Number(franchise.activeViolationCount || 0);
        const baseCount = Math.max(priorActiveCount, currentTrackedCount);
        const offenseNumber = baseCount + 1;

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
            fineAmount = (customFine !== undefined && customFine !== null && !isNaN(Number(customFine))) 
                ? Number(customFine) 
                : (matchedTypeConfig?.defaultFine || policyTiers.secondOffense?.defaultFine || 500);
            suspensionDays = (customSuspensionDays !== undefined && customSuspensionDays !== null && !isNaN(Number(customSuspensionDays))) 
                ? Number(customSuspensionDays) 
                : (matchedTypeConfig?.suspensionDays || policyTiers.secondOffense?.defaultSuspensionDays || 15);
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

        const operatorRef = franchise.operator?._id || franchise.operator || null;
        const sanctionLabel = `${sanctionType} (${offenseLabel(offenseNumber)})`;

        // Save new violation record cleanly, then atomically update the franchise with rollback on conflict/failure
        const violation = await Violation.create({
            operator: operatorRef,
            franchise: franchise._id,
            plateNo: franchise.plateNo,
            bodyNumber: franchise.bodyNumber || req.body.bodyNumber || '',
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
            recordedBy: req.user?._id,
            recordedByName: req.user?.name || 'BPLO Staff',
            status: 'Active'
        });

        const franchiseSetFields = {
            [target.statusField]: resultingStatus,
            currentSanction: sanctionLabel
        };
        if (resultingStatus === 'Suspended') {
            franchiseSetFields.suspensionEndDate = suspensionEndDate;
            franchiseSetFields.suspensionReason = `${violationType} (2nd Offense)`;
        } else if (resultingStatus === 'Revoked' && !target.hasSnapshot) {
            franchiseSetFields.cancelReason = citationRevocationReason(violation);
            if (evidenceUrl) franchiseSetFields.evidenceUrl = evidenceUrl;
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
                    $inc: { activeViolationCount: 1 },
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
 * Settle violation fine or lift suspension (BPLO Staff / Admin)
 */
const settleOrLiftViolation = async (req, res) => {
    let releaseDisciplineWrite;
    try {
        const { id } = req.params;
        const { settledNotes = '' } = req.body;

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

        const settledAt = new Date();
        const violation = await Violation.findOneAndUpdate(
            { _id: id, status: 'Active' },
            {
                $set: {
                    status: 'Settled',
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
                { _id: violation._id, status: 'Settled', settledAt, settledBy: req.user._id },
                { $set: priorViolationState }
            );
            if (result.matchedCount !== 1) {
                throw new Error(`Violation ${violation._id} changed after settlement.`);
            }
        };

        let updatedFranchise = null;
        try {
            if (franchise) {
                const remaining = await Violation.find({ franchise: violation.franchise, status: 'Active' })
                    .select('sanction offenseNumber violationType isGrave evidenceUrl')
                    .sort({ 'sanction.suspensionEndDate': -1, _id: 1 })
                    .lean();
                const target = disciplineTarget(franchise);
                const { status, expiryDate } = target.permit;
                const franchiseSetFields = {
                    activeViolationCount: remaining.length
                };

                const citationRevoked = status === 'Revoked' && CITATION_REVOCATION_LABEL.test(franchise.currentSanction);
                if ((citationRevoked || SANCTIONABLE_FRANCHISE_STATUSES.includes(status)) && franchise.isArchived !== true) {
                    const { status: standing, revocation, ...sanctionFields } = settlementStanding(remaining, expiryDate, settledAt);
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
                message: 'Concurrent franchise standing change detected while settling violation. Please refresh and try again.'
            });
        }

        await releaseDisciplineWrite();
        releaseDisciplineWrite = null;

        const resultingFranchiseStatus = updatedFranchise ? getIssuedPermit(updatedFranchise).status : undefined;
        logAudit(req, {
            action: 'VIOLATION_SETTLED',
            targetType: 'Violation',
            targetId: violation._id.toString(),
            details: {
                franchiseId: String(violation.franchise),
                plateNo: violation.plateNo,
                settledNotes,
                resultingFranchiseStatus
            }
        });

        res.status(200).json({
            success: true,
            message: 'Violation successfully settled. Franchise standing updated.',
            violation,
            franchiseStatus: resultingFranchiseStatus
        });
    } catch (error) {
        console.error('Error settling violation:', error);
        res.status(500).json({ success: false, message: 'Failed to settle violation.' });
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
