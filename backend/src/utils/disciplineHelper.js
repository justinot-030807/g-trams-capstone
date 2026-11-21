const { randomUUID } = require('node:crypto');
const Franchise = require('../models/franchiseModel');
const Violation = require('../models/violationModel');
const {
    currentIssuedSnapshotQuery,
    getIssuedPermit,
    hasIssuedPermitSnapshot,
    CURRENT_TERM_STATUSES
} = require('./issuedPermit');
const { isExpired } = require('./phTime');

const OPERATOR_LOCK_LEASE_MS = 15000;
const PLACEHOLDER_IDS = new Set(['PENDING', 'N/A', 'NA', 'NONE', '-']);

function escapeRegex(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function exactInsensitive(value) {
    return { $regex: new RegExp(`^${escapeRegex(String(value).trim())}$`, 'i') };
}

function isMeaningfulIdentifier(value) {
    const clean = String(value || '').trim().toUpperCase();
    return Boolean(clean && !PLACEHOLDER_IDS.has(clean));
}

/**
 * Serialize fleet-capacity-sensitive mutations for a given operator across
 * standalone MongoDB and replica-set deployments.
 */
async function acquireOperatorCapacityLock(operatorId, { maxRetries = 40, retryDelayMs = 40 } = {}) {
    if (!operatorId) return async () => {};
    const locks = Franchise.db.collection('system_locks');
    const castId = Franchise.schema.path('operator').cast(operatorId);
    const _id = `operator_fleet_cap:${castId}`;
    const ownerId = randomUUID();

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const now = new Date();
        await locks.deleteOne({ _id, expiresAt: { $lte: now } }).catch(() => {});
        try {
            await locks.insertOne({
                _id,
                ownerId,
                acquiredAt: now,
                expiresAt: new Date(now.getTime() + OPERATOR_LOCK_LEASE_MS)
            });
            return async () => {
                await locks.deleteOne({ _id, ownerId }).catch((err) => {
                    console.error('Failed to release operator capacity lock:', err);
                });
            };
        } catch (err) {
            if (err?.code !== 11000) throw err;
            if (attempt < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
            }
        }
    }
    return null;
}

/**
 * Authoritative MongoDB query count of active/in-progress fleet slots held by an operator.
 */
async function countOperatorOccupiedSlots(operatorId, { excludeFranchiseId = null, now = new Date() } = {}) {
    if (!operatorId) return 0;
    const query = {
        operator: operatorId,
        isArchived: { $ne: true },
        $or: [
            { status: { $nin: ['Cancelled', 'Rejected', 'Revoked', 'Expired'] } },
            currentIssuedSnapshotQuery(now)
        ]
    };
    if (excludeFranchiseId) {
        query._id = { $ne: excludeFranchiseId };
    }
    return Franchise.countDocuments(query);
}

/**
 * Pure mirror of countOperatorOccupiedSlots for serialized dashboard responses.
 */
function isFranchiseOccupyingSlot(franchise, now = new Date()) {
    if (!franchise || franchise.isArchived) return false;
    if (!['Cancelled', 'Rejected', 'Revoked', 'Expired'].includes(franchise.status)) {
        return true;
    }
    if (hasIssuedPermitSnapshot(franchise)) {
        const permit = getIssuedPermit(franchise);
        return (
            CURRENT_TERM_STATUSES.includes(permit.status) &&
            Boolean(permit.expiryDate) &&
            !isExpired(permit.expiryDate, now)
        );
    }
    return false;
}

/**
 * Check whether a Cancelled record is an irreversibly finalized voluntary surrender.
 */
function isFinalizedVoluntaryCancellation(franchise) {
    if (!franchise || franchise.status !== 'Cancelled') return false;
    if (franchise.cancellationOutcome === 'voluntary_surrender') return true;
    const details = franchise.cancellationDetails || {};
    return Boolean(
        details.reason &&
        !details.rejectionReason &&
        details.decision !== 'rejected'
    );
}

/**
 * Resolve all Active (unsettled) violations tied to the unit identifiers or franchise chain
 * so progressive discipline cannot be reset by surrendering and re-applying for the same tricycle.
 */
async function findUnsettledViolationsForUnit({ plateNo, motorNo, chassisNo, operatorId, franchiseId } = {}) {
    const franchiseIds = new Set();
    if (franchiseId) franchiseIds.add(String(franchiseId));

    const idMatchers = [];
    if (isMeaningfulIdentifier(plateNo)) idMatchers.push({ plateNo: exactInsensitive(plateNo) });
    if (isMeaningfulIdentifier(motorNo)) idMatchers.push({ motorNo: exactInsensitive(motorNo) });
    if (isMeaningfulIdentifier(chassisNo)) idMatchers.push({ chassisNo: exactInsensitive(chassisNo) });

    if (idMatchers.length > 0) {
        const matchedFranchises = await Franchise.find({ $or: idMatchers }).select('_id').lean();
        for (const f of matchedFranchises) {
            franchiseIds.add(String(f._id));
        }
    }

    const violationOr = [];
    if (franchiseIds.size > 0) {
        violationOr.push({ franchise: { $in: [...franchiseIds] } });
    }
    if (operatorId && isMeaningfulIdentifier(plateNo)) {
        violationOr.push({ operator: operatorId, plateNo: exactInsensitive(plateNo) });
    }
    if (violationOr.length === 0) return [];

    return Violation.find({ status: 'Active', $or: violationOr }).lean();
}

module.exports = {
    acquireOperatorCapacityLock,
    countOperatorOccupiedSlots,
    isFranchiseOccupyingSlot,
    isFinalizedVoluntaryCancellation,
    findUnsettledViolationsForUnit
};
