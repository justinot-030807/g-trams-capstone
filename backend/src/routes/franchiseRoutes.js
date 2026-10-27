const express = require('express');
const router = express.Router();
const upload = require('../config/cloudinary');
const { protect, authorize } = require('../middleware/authMiddleware'); 

const { 
    createFranchise, 
    getAllFranchises, 
    getMyFranchises, 
    getFranchiseById,
    getFranchiseRecordCheck,
    updateFranchise, 
    deleteFranchise, 
    renewFranchise,
    updateFranchiseStatus,
    cancelMyFranchise,
    searchHistoricalFranchise,
    toggleArchiveFranchise,
    revokeFranchise,
    getFranchiseReports,
    checkUniqueFranchiseField,
    getCashierQueue,
    processCashierPayment,
    scanDocument,
    checkTodaMemberStatus,
    requestFranchiseCancellation,
    processFranchiseCancellation
} = require('../controllers/franchiseController');

const memoryUpload = require('multer')({
    storage: require('multer').memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 }
});

// Real-time check of TODA membership status and jurisdiction routing
router.get('/check-toda-member', checkTodaMemberStatus);

// AI document scanning for operator form auto-fill (instant memory buffer, zero Cloudinary latency)
router.post('/scan-document', protect, memoryUpload.single('file'), scanDocument);

// Check unique plateNo / motorNo / chassisNo in real-time
router.get('/check-unique', protect, checkUniqueFranchiseField);

// Search historical franchise records
router.get('/search', protect, authorize('bplo_staff'), searchHistoricalFranchise);

/**
 * @swagger
 * /franchises:
 *   get:
 *     summary: Retrieve paginated list of franchises
 *     tags: [Franchises]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Successful response
 *   post:
 *     summary: Create a new franchise application
 *     tags: [Franchises]
 *     responses:
 *       201:
 *         description: Franchise created successfully
 */
// Franchise application and masterlist
router.route('/')
    // Submit new franchise application (Operators and TODA Presidents)
    .post(
        protect, 
        authorize('operator', 'toda president'),
        upload.any(), 
        createFranchise
    )
    // Get franchise masterlist (BPLO Staff only)
    .get(protect, authorize('bplo_staff'), getAllFranchises);

// BPLO Staff routes (Franchise operations only)
router.get('/reports', protect, authorize('bplo_staff'), getFranchiseReports);
router.put('/:id/archive', protect, authorize('bplo_staff'), toggleArchiveFranchise);
router.put('/:id/revoke', protect, authorize('bplo_staff'), upload.fields([{ name: 'evidence', maxCount: 1 }]), revokeFranchise);
router.put('/:id/status', protect, authorize('bplo_staff'), updateFranchiseStatus);
router.put('/:id/process-cancellation', protect, authorize('bplo_staff'), processFranchiseCancellation);
router.get('/:id/record-check', protect, authorize('bplo_staff', 'cashier'), getFranchiseRecordCheck);

// Operator routes
router.get('/my-franchises', protect, authorize('operator', 'toda president'), getMyFranchises);
router.put('/:id/renew', protect, authorize('operator', 'toda president'), upload.fields([{ name: 'orcrFile', maxCount: 1 }, { name: 'cedulaDoc', maxCount: 1 }]), renewFranchise);
router.put('/:id/cancel', protect, authorize('operator', 'toda president'), cancelMyFranchise);
router.put('/:id/request-cancellation', protect, authorize('operator', 'toda president'), upload.fields([{ name: 'cancellationLetter', maxCount: 1 }, { name: 'letter', maxCount: 1 }]), requestFranchiseCancellation);

// Municipal Cashier & Treasury routes (Isolated strictly to Cashier)
router.get('/cashier-queue', protect, authorize('cashier'), getCashierQueue);
router.post('/:id/pay', protect, authorize('cashier'), processCashierPayment);

// Update and delete franchise
router.route('/:id')
    .get(protect, getFranchiseById)
    .put(
        protect, 
        upload.any(), 
        updateFranchise
    )
    .delete(protect, authorize('bplo_staff'), deleteFranchise);

module.exports = router;