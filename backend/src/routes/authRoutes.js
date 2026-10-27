const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const { authRateLimiter } = require('../middleware/rateLimiter');

const { 
    register, 
    verifyTodaRoster,
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
    getProfile,
    googleAuth,
    heartbeat,
    submitAppeal,
    verifyOperator,
    getPublicStats
} = require('../controllers/authController');

// Rate limiters
const loginLimiter = authRateLimiter({ max: 5, windowMs: 15 * 60 * 1000, message: 'Too many login attempts. Please try again after 15 minutes.' });
const registerLimiter = authRateLimiter({ max: 10, windowMs: 15 * 60 * 1000, message: 'Too many registration attempts. Please try again after 15 minutes.' });
const forgotLimiter = authRateLimiter({ max: 5, windowMs: 15 * 60 * 1000, message: 'Too many password reset requests. Please try again after 15 minutes.' });
const resetLimiter = authRateLimiter({ max: 5, windowMs: 15 * 60 * 1000, message: 'Too many password reset attempts. Please try again after 15 minutes.' });

// Profile & Heartbeat routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, upload.single('profilePic'), updateProfile);
router.post('/heartbeat', protect, heartbeat);

// Import Validation Middleware
const validate = require('../middleware/validateMiddleware');
const { registerSchema, verifyRosterSchema, verifyOtpSchema, loginSchema, forgotPasswordSchema, googleAuthSchema } = require('../schemas/authSchema');

// Pre-registration TODA Roster Verification route
router.post('/verify-roster', registerLimiter, validate(verifyRosterSchema), verifyTodaRoster);

// Google OAuth route
router.post('/google', validate(googleAuthSchema), googleAuth);
router.get('/google-client-id', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
    res.status(200).json({ clientId });
});

// Auth and registration routes
router.post('/register', registerLimiter, validate(registerSchema), register);
router.post('/verify-otp', registerLimiter, validate(verifyOtpSchema), verifyOTP);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.get('/', protect, authorize('system_admin', 'admin'), getUsers);

// Password management routes
router.post('/forgot-password', forgotLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', resetLimiter, resetPassword);
router.put('/change-password', protect, changePassword);

// System Admin IT routes
router.post('/verify-password', protect, authorize('system_admin', 'admin'), verifyAdminPassword);

// Account status routes
router.put('/:id/toggle-status', protect, authorize('system_admin', 'admin'), toggleUserStatus);
router.post('/appeal', submitAppeal);

// Public routes
router.get('/verify/:id', verifyOperator);
router.get('/public-stats', getPublicStats);

router.route('/:id')
    .put(protect, authorize('system_admin', 'admin'), updateUser)
    .delete(protect, authorize('system_admin', 'admin'), deleteUser);

module.exports = router;