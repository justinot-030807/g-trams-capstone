const TodaRoster = require('../models/todaModel');
const { TODA_DIRECTORY } = require('./todaDirectory');

const normalizeLabel = (value) => String(value || '').trim().replace(/\s+/g, ' ').toUpperCase();
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function rosterAssociation(value) {
    const label = normalizeLabel(value);
    const official = TODA_DIRECTORY.find(({ id, name }) => id === label || normalizeLabel(name) === label);
    const names = official ? [official.id, official.name] : [label];
    const alternatives = names.map(name => name.split(' ').map(escapeRegex).join('\\s+'));
    return { id: official?.id || label, pattern: new RegExp(`^\\s*(?:${alternatives.join('|')})\\s*$`, 'i'), official: Boolean(official) };
}

function rosterBodyKey(value) {
    const compact = normalizeLabel(value).replace(/[^A-Z0-9]/g, '');
    // A TODA's sequential number is the slot. Legacy rows can omit its prefix or zero padding.
    const digits = compact.replace(/\D/g, '');
    return digits ? digits.replace(/^0+(?=\d)/, '') : compact;
}

const rosterClaimKey = (association, bodyNumber) => `${rosterAssociation(association).id}:${rosterBodyKey(bodyNumber)}`;
const sameRosterName = (left, right) => Boolean(normalizeLabel(left)) && normalizeLabel(left) === normalizeLabel(right);
const rosterOwners = (row) => [...new Set([row.registeredUser, row.claimedBy].filter(Boolean).map(String))];
const rosterConflict = (message) => Object.assign(new Error(message), { statusCode: 409 });

async function findRosterSlot(association, bodyNumber, session) {
    const key = rosterBodyKey(bodyNumber);
    if (!key) return null;
    const rows = await TodaRoster.find({ todaAssociation: rosterAssociation(association).pattern }).session(session ?? null);
    const matches = rows.filter(row => rosterBodyKey(row.bodyNumber) === key);
    if (matches.length > 1) throw rosterConflict('Multiple roster entries use this Body Number. Ask BPLO to reconcile the roster.');
    return matches[0] || null;
}

async function claimRosterRow(row, userId, writes) {
    const filter = {
        _id: row._id,
        todaAssociation: row.todaAssociation,
        bodyNumber: row.bodyNumber,
        operatorName: row.operatorName,
        status: 'Active',
        registeredUser: { $in: [null, userId] },
        claimedBy: { $in: [null, userId] }
    };
    const update = { $set: { registeredUser: userId, claimedBy: userId, claimKey: rosterClaimKey(row.todaAssociation, row.bodyNumber) } };
    const claimed = await writes.update(TodaRoster, filter, update);
    if (!claimed) throw rosterConflict('This TODA roster slot is no longer available.');
    return claimed;
}

async function releaseRosterClaims(userId, { criteria = {}, writes }) {
    // Legacy rows may have two different owners. Clear only fields held by this account.
    for (const field of ['registeredUser', 'claimedBy']) {
        const filter = { ...criteria, [field]: userId };
        const update = { $set: { [field]: null } };
        await writes.updateMany(TodaRoster, filter, update);
    }
}

module.exports = {
    rosterAssociation, rosterBodyKey, rosterClaimKey, sameRosterName, rosterOwners, rosterConflict,
    findRosterSlot, claimRosterRow, releaseRosterClaims
};
