const ISSUED_STATUSES = ['Active', 'Active - Under Warning', 'Suspended', 'Revoked', 'Expired'];
const OPERATING_STATUSES = ['Active', 'Active - Under Warning'];
const CURRENT_TERM_STATUSES = [...OPERATING_STATUSES, 'Suspended'];

function hasIssuedPermitSnapshot(franchise) {
    return (franchise.applicationType === 'Renewal' || franchise.isRenewalPending === true) &&
        ISSUED_STATUSES.includes(franchise.previousStatus);
}

function getIssuedPermit(franchise) {
    return hasIssuedPermitSnapshot(franchise)
        ? { status: franchise.previousStatus, expiryDate: franchise.previousExpiryDate }
        : { status: franchise.status, expiryDate: franchise.expiryDate };
}

function issuedPermitSnapshotQuery(statuses = ISSUED_STATUSES) {
    return {
        $or: [{ applicationType: 'Renewal' }, { isRenewalPending: true }],
        previousStatus: { $in: statuses }
    };
}

function currentIssuedSnapshotQuery(now = new Date()) {
    return {
        ...issuedPermitSnapshotQuery(CURRENT_TERM_STATUSES),
        previousExpiryDate: { $gte: now }
    };
}

module.exports = { ISSUED_STATUSES, OPERATING_STATUSES, CURRENT_TERM_STATUSES, hasIssuedPermitSnapshot, getIssuedPermit, issuedPermitSnapshotQuery, currentIssuedSnapshotQuery };
