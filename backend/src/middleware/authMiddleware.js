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
            return next();
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const normalizeRole = (r) => String(r || '').toLowerCase().trim().replace(/_/g, ' ');

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'ACCESS DENIED: No role found on user.' });
        }

        const userRole = normalizeRole(req.user.role);
        const allowedRoles = roles.map(normalizeRole);

        // Admin and administrator are treated interchangeably
        const isAdminAllowed = allowedRoles.includes('admin') || allowedRoles.includes('administrator');
        const isUserAdmin = userRole === 'admin' || userRole === 'administrator';

        // Operator and toda president are treated interchangeably for operator routes
        const isOperatorAllowed = allowedRoles.includes('operator') || allowedRoles.includes('toda president') || allowedRoles.includes('toda_president');
        const isUserOperatorOrToda = userRole === 'operator' || userRole === 'toda president' || userRole === 'toda_president';

        const isAuthorized = allowedRoles.includes(userRole) || 
                             (isAdminAllowed && isUserAdmin) || 
                             (isOperatorAllowed && isUserOperatorOrToda);

        if (!isAuthorized) {
            return res.status(403).json({
                message: `ACCESS DENIED: Role '${req.user.role}' is not authorized to execute this API.`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };