const AuditLog = require('../models/auditLogModel');

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

        if (req.query.search && req.query.search.trim() !== '') {
            const searchRegex = new RegExp(req.query.search.trim(), 'i');
            filter.$or = [
                { actorName: searchRegex },
                { action: searchRegex },
                { targetId: searchRegex }
            ];
        }

        const totalRecords = await AuditLog.countDocuments(filter);
        const logs = await AuditLog.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

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
