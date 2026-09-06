const AuditLog = require('../models/auditLogModel');

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

        await AuditLog.create({
            action,
            actorId: actor._id || null,
            actorName: actor.name || 'System Administrator',
            actorRole: actor.role || 'admin',
            targetType,
            targetId: String(targetId || ''),
            details,
            ipAddress: normalizedIp
        });
    } catch (err) {
        console.error('[AUDIT LOG ERROR]: Failed to persist audit entry:', err.message);
    }
};

module.exports = { logAudit };
