const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const normalizeRole = (r) => String(r || '').toLowerCase().trim().replace(/_/g, ' ');

// ROLE-BASED ACCESS CONTROL (Case-Insensitive & Underscore-Insensitive Check)
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'ACCESS DENIED: No role found on user.' });
        }

        const userRole = normalizeRole(req.user.role);
        const allowedRoles = roles.map(normalizeRole);

        const isOperatorAllowed = allowedRoles.includes('operator') || allowedRoles.includes('toda president');
        const isUserOperatorOrToda = userRole === 'operator' || userRole === 'toda president';

        const isAuthorized = allowedRoles.includes(userRole) || (isOperatorAllowed && isUserOperatorOrToda);

        if (!isAuthorized) {
            return res.status(403).json({
                message: `ACCESS DENIED: Role '${req.user.role}' is not authorized to execute this API.`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };