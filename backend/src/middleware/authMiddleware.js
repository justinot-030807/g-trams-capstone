const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Block deactivated accounts
            if (req.user.isActive === false) {
                return res.status(403).json({ 
                    message: 'Your account has been deactivated.', 
                    accountDeactivated: true,
                    reason: req.user.deactivationReason || 'Account suspended by administrator.',
                    appealStatus: req.user.appealStatus || 'none'
                });
            }

            // Update lastActive timestamp (throttled to once per 15s to optimize DB load)
            const now = Date.now();
            if (!req.user.lastActive || (now - new Date(req.user.lastActive).getTime() > 15000)) {
                await User.findByIdAndUpdate(req.user._id, { lastActive: new Date() }).catch(() => {});
                req.user.lastActive = new Date();
            }

            return next();
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const normalizeRole = (r) => String(r || '').toLowerCase().trim().replace(/[\s-]+/g, '_');

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'ACCESS DENIED: No role found on user.' });
        }

        const userRole = normalizeRole(req.user.role);
        const allowedRoles = roles.map(normalizeRole);

        // 1. Direct role match
        let isAuthorized = allowedRoles.includes(userRole);

        // 2. System Admin alias matching: system_admin, admin, administrator
        const isUserSysAdmin = userRole === 'system_admin' || userRole === 'admin' || userRole === 'administrator';
        const isSysAdminAllowed = allowedRoles.some(r => r === 'system_admin' || r === 'admin' || r === 'administrator');
        if (isUserSysAdmin && isSysAdminAllowed) {
            isAuthorized = true;
        }

        // 3. Operator & TODA President alias matching for general operator access
        const isUserOpOrToda = userRole === 'operator' || userRole === 'toda_president';
        const isOpAllowed = allowedRoles.includes('operator');
        if (isUserOpOrToda && isOpAllowed) {
            isAuthorized = true;
        }

        // Strict Separation Guard: System Admin CANNOT perform BPLO Staff franchise operations
        if (allowedRoles.includes('bplo_staff') && isUserSysAdmin && !allowedRoles.includes('system_admin')) {
            return res.status(403).json({
                message: 'ACCESS DENIED: System Admin is restricted to IT maintenance and cannot review or approve franchises.'
            });
        }

        // Strict Cashier Guard: Only Cashier can execute Cashier operations
        if (allowedRoles.includes('cashier') && userRole !== 'cashier') {
            return res.status(403).json({
                message: 'ACCESS DENIED: Official receipt and payment logging is restricted to Municipal Cashier.'
            });
        }

        if (!isAuthorized) {
            return res.status(403).json({
                message: `ACCESS DENIED: Role '${req.user.role}' is not authorized to execute this API.`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };