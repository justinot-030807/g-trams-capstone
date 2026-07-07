const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

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

// PROFILE ROUTES
router.get('/profile', protect, getProfile); // <-- IBINALIK NATIN ANG RUTA PARA SA AUTOFILL
router.put('/profile', protect, upload.single('profilePic'), updateProfile);

// Authentication & Registration Routes
router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.get('/', protect, getUsers);

// Password Management Routes
router.post('/forgot-password', forgotPassword);
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