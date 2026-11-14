const AuditLog = require('../models/auditLogModel');
const { formatActorRoleLabel, buildHumanSummary } = require('../utils/auditLogger');

// Get paginated audit logs (Admin only)
exports.getAuditLogs = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
        const skip = (page - 1) * limit;

        const filter = {};

        if (req.query.action && req.query.action !== 'All') {
            filter.action = req.query.action.toUpperCase();
        }

        if (req.query.targetType && req.query.targetType !== 'All') {
            filter.targetType = req.query.targetType;
        }

        if (typeof req.query.search === 'string' && req.query.search.trim() !== '') {
            const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const searchRegex = new RegExp(escapeRegex(req.query.search.trim()), 'i');
            filter.$or = [
                { actorName: searchRegex },
                { actorRole: searchRegex },
                { action: searchRegex },
                { targetId: searchRegex },
                { ipAddress: searchRegex },
                { 'details.summary': searchRegex },
                { 'details.operatorName': searchRegex },
                { 'details.fullName': searchRegex },
                { 'details.plateNo': searchRegex },
                { 'details.mtopNo': searchRegex },
                { 'details.todaName': searchRegex },
                { 'details.officialReceiptNo': searchRegex },
                { 'details.note': searchRegex },
                { 'details.reason': searchRegex }
            ];
        }

        let totalRecords = await AuditLog.countDocuments(filter);

        // If audit ledger is completely empty in non-test environments, record initial baseline entry
        if (totalRecords === 0 && Object.keys(filter).length === 0 && process.env.NODE_ENV !== 'test') {
            await AuditLog.create({
                action: 'SYSTEM_AUDIT_LEDGER_INITIALIZED',
                actorName: req.user?.name || 'System Administrator',
                actorRole: req.user?.role || 'system_admin',
                targetType: 'General',
                details: {
                    actorRoleLabel: formatActorRoleLabel(req.user?.role || 'system_admin'),
                    summary: 'Immutable security and administrative audit ledger initialized and active.',
                    note: 'Immutable security and administrative audit ledger active.'
                },
                ipAddress: req.ip || '127.0.0.1'
            }).catch(() => {});
            totalRecords = await AuditLog.countDocuments(filter);
        }

        const rawLogs = await AuditLog.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const logs = rawLogs.map((log) => {
            const actorName = log.actorName === 'BPLO Licensing Officer'
                ? 'LLSA I — Local Legislative Staff Assistant I (Madhelyn Pastoral)'
                : (log.actorName || 'System Administrator');
            const details = (log.details && typeof log.details === 'object') ? { ...log.details } : {};
            if (!details.actorRoleLabel) {
                details.actorRoleLabel = formatActorRoleLabel(log.actorRole);
            }
            if (!details.summary) {
                details.summary = buildHumanSummary(log.action, log.targetType, details);
            }
            return {
                ...log,
                actorName,
                actorRoleLabel: details.actorRoleLabel,
                details
            };
        });

        const totalPages = Math.ceil(totalRecords / limit) || 1;

        res.status(200).json({
            data: logs,
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
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ message: 'Failed to retrieve audit logs' });
    }
};
