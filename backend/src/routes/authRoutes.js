const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const { authRateLimiter } = require('../middleware/rateLimiter');

const { 
    register, 
    verifyOTP, 
    login, 
    getUsers,
    forgotPassword,
    resetPassword,
    changePassword,
    verifyAdminPassword,
    updateUser,          
    deleteUser,
    updateProfile,
    toggleUserStatus,
    getProfile // <-- IBINALIK NATIN ITO
} = require('../controllers/authController');

// Rate limiters
const loginLimiter = authRateLimiter({ max: 5, windowMs: 15 * 60 * 1000, message: 'Too many login attempts. Please try again after 15 minutes.' });
const registerLimiter = authRateLimiter({ max: 10, windowMs: 15 * 60 * 1000, message: 'Too many registration attempts. Please try again after 15 minutes.' });
const forgotLimiter = authRateLimiter({ max: 5, windowMs: 15 * 60 * 1000, message: 'Too many password reset requests. Please try again after 15 minutes.' });

// PROFILE ROUTES
router.get('/profile', protect, getProfile);
router.put('/profile', protect, upload.single('profilePic'), updateProfile);

// Authentication & Registration Routes
router.post('/register', registerLimiter, register);
router.post('/verify-otp', registerLimiter, verifyOTP);
router.post('/login', loginLimiter, login);
router.get('/', protect, getUsers);

// Password Management Routes
router.post('/forgot-password', forgotLimiter, forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/change-password', protect, changePassword);

// Admin Routes
router.post('/verify-password', protect, authorize('admin'), verifyAdminPassword);

// Activate / Deactivate Account
router.put('/:id/toggle-status', protect, authorize('admin'), toggleUserStatus);

router.route('/:id')
    .put(protect, authorize('admin'), updateUser)
    .delete(protect, authorize('admin'), deleteUser);

module.exports = router;