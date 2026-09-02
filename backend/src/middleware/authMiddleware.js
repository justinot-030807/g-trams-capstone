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

// ROLE-BASED ACCESS CONTROL (Case-Insensitive Check)
const authorize = (...roles) => {
    return (req, res, next) => {
        const userRole = req.user.role.toLowerCase().trim();
        const allowedRoles = roles.map(r => r.toLowerCase().trim());

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                message: `ACCESS DENIED: Role '${req.user.role}' is not authorized to execute this API.`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };