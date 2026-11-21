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
router.get('/', protect, authorize('bplo_staff'), getViolations);
router.get('/history/:franchiseId', protect, authorize('bplo_staff', 'operator', 'toda_president'), getOperatorViolationHistory);
router.post('/', protect, authorize('bplo_staff'), upload.fields([{ name: 'evidence', maxCount: 1 }]), recordViolation);
router.put('/:id/settle', protect, authorize('bplo_staff'), settleOrLiftViolation);
router.put('/:id/resolve', protect, authorize('bplo_staff'), settleOrLiftViolation);

module.exports = router;
