const AuditLog = require('../models/auditLogModel');

function formatActorRoleLabel(role) {
    const r = String(role || '').toLowerCase().trim().replace(/_/g, ' ');
    if (r === 'bplo staff' || r === 'llsa i' || r === 'llsa 1') {
        return 'LLSA I (Local Legislative Staff Assistant I)';
    }
    if (r === 'system admin' || r === 'admin' || r === 'administrator') {
        return 'System Administrator';
    }
    if (r === 'cashier' || r === 'municipal cashier') {
        return 'Municipal Cashier';
    }
    if (r === 'toda president') {
        return 'TODA President';
    }
    if (r === 'operator' || r === 'tricycle operator') {
        return 'Tricycle Operator';
    }
    return role || 'System User';
}

function buildHumanSummary(action, targetType, details = {}) {
    if (details.summary) return details.summary;
    const act = String(action || '').toUpperCase();
    const op = details.operatorName || details.fullName || details.name || details.targetUserName || '';
    const plate = details.plateNo || details.plateNumber || '';
    const mtop = details.mtopNo || details.mtopNumber || '';
    const toda = details.todaName || details.todaAssociation || '';
    const prev = details.previousStatus || details.oldStatus || '';
    const next = details.newStatus || details.status || '';
    const orNo = details.officialReceiptNo || details.orNo || '';
    const amt = details.amountPaid || details.amount || '';
    const reason = details.reason || details.cancelReason || details.remarks || details.note || '';

    const parts = [];
    if (op) parts.push(`Operator/Target: ${op}`);
    if (plate) parts.push(`Plate: ${plate}`);
    if (mtop) parts.push(`MTOP: ${mtop}`);
    if (toda) parts.push(`TODA: ${toda}`);
    if (prev && next) {
        parts.push(`Status: ${prev} → ${next}`);
    } else if (next) {
        parts.push(`Status: ${next}`);
    }
    if (orNo) parts.push(`O.R. No.: ${orNo}`);
    if (amt !== '' && amt !== undefined) parts.push(`Amount: ₱${Number(amt).toLocaleString()}`);
    if (details.violationType) parts.push(`Violation: ${details.violationType}`);
    if (details.sanctionType) parts.push(`Sanction: ${details.sanctionType}`);
    if (reason) parts.push(`Remarks: ${reason}`);

    if (parts.length > 0) {
        return parts.join(' • ');
    }
    return `${act.replace(/_/g, ' ')} on ${targetType || 'System'}`;
}

/**
 * Asynchronously records an administrative or security event in the audit trail.
 * Does not throw errors to avoid disrupting primary operations.
 */
const logAudit = async (req, { action, targetType = 'General', targetId = '', details = {} }) => {
    try {
        const actor = req?.user || {};
        const rawIp = req?.headers?.['x-forwarded-for']?.split(',')[0].trim() || 
                      req?.socket?.remoteAddress || 
                      req?.ip || 
                      '127.0.0.1';
        const normalizedIp = rawIp.replace(/^::ffff:/, '');
        const rawActorName = actor.name || 'System Administrator';
        const normalizedActorName = rawActorName === 'BPLO Licensing Officer'
            ? 'LLSA I — Local Legislative Staff Assistant I (Madhelyn Pastoral)'
            : rawActorName;
        const actorRole = actor.role || 'admin';
        const actorRoleLabel = formatActorRoleLabel(actorRole);

        const enrichedDetails = {
            ...details,
            actorRoleLabel,
            actorEmail: actor.email || undefined,
            actorContact: actor.contact || undefined,
            httpMethod: req?.method || undefined,
            endpoint: req?.originalUrl || req?.url || undefined,
            userAgent: req?.headers?.['user-agent'] || undefined,
        };
        enrichedDetails.summary = buildHumanSummary(action, targetType, enrichedDetails);

        await AuditLog.create({
            action,
            actorId: actor._id || null,
            actorName: normalizedActorName,
            actorRole,
            targetType,
            targetId: String(targetId || ''),
            details: enrichedDetails,
            ipAddress: normalizedIp
        });
    } catch (err) {
        console.error('[AUDIT LOG ERROR]: Failed to persist audit entry:', err.message);
    }
};

module.exports = { logAudit, formatActorRoleLabel, buildHumanSummary };
