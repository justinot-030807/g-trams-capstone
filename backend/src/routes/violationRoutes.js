const express = require('express');
const router = express.Router();
const upload = require('../config/cloudinary');
const { protect, authorize } = require('../middleware/authMiddleware');
const { 
    getViolations, 
    getOperatorViolationHistory, 
    recordViolation, 
    settleOrLiftViolation 
} = require('../controllers/violationController');

// All violation management endpoints are role-protected
router.get('/', protect, authorize('bplo_staff', 'system_admin', 'admin'), getViolations);
router.get('/history/:franchiseId', protect, authorize('bplo_staff', 'system_admin', 'admin', 'operator', 'toda president'), getOperatorViolationHistory);
router.post('/', protect, authorize('bplo_staff', 'system_admin', 'admin'), upload.fields([{ name: 'evidence', maxCount: 1 }]), recordViolation);
router.put('/:id/settle', protect, authorize('bplo_staff', 'system_admin', 'admin'), settleOrLiftViolation);

module.exports = router;
