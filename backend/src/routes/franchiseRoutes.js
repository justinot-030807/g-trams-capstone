const express = require('express');
const router = express.Router();
const upload = require('../config/cloudinary');
const { protect, authorize } = require('../middleware/authMiddleware'); 

const { 
    createFranchise, 
    getAllFranchises, 
    getMyFranchises, 
    getFranchiseById,
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
    scanDocument
} = require('../controllers/franchiseController');

// AI document scanning for operator form auto-fill
router.post('/scan-document', protect, upload.single('file'), scanDocument);

// Check unique plateNo / motorNo / chassisNo in real-time
router.get('/check-unique', protect, checkUniqueFranchiseField);

// Search historical franchise records
router.get('/search', protect, authorize('admin'), searchHistoricalFranchise);

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
    // Get franchise masterlist (Admin only)
    .get(protect, authorize('admin'), getAllFranchises);

// Admin routes
router.get('/reports', protect, authorize('admin'), getFranchiseReports);
router.put('/:id/archive', protect, authorize('admin'), toggleArchiveFranchise);
router.put('/:id/revoke', protect, authorize('admin'), upload.fields([{ name: 'evidence', maxCount: 1 }]), revokeFranchise);
router.put('/:id/status', protect, authorize('admin'), updateFranchiseStatus);

// Operator routes
router.get('/my-franchises', protect, authorize('operator', 'toda president'), getMyFranchises);
router.put('/:id/renew', protect, authorize('operator', 'toda president'), upload.fields([{ name: 'orcrFile', maxCount: 1 }, { name: 'cedulaDoc', maxCount: 1 }]), renewFranchise);
router.put('/:id/cancel', protect, authorize('operator', 'toda president'), cancelMyFranchise);

// Municipal Cashier & Treasury routes
router.get('/cashier-queue', protect, authorize('cashier', 'admin'), getCashierQueue);
router.post('/:id/pay', protect, authorize('cashier', 'admin'), processCashierPayment);

// Update and delete franchise
router.route('/:id')
    .get(protect, getFranchiseById)
    .put(
        protect, 
        upload.any(), 
        updateFranchise
    )
    .delete(protect, authorize('admin'), deleteFranchise);

module.exports = router;