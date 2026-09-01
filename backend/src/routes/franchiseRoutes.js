const express = require('express');
const router = express.Router();
const upload = require('../config/cloudinary');
const { protect, authorize } = require('../middleware/authMiddleware'); 

const { 
    createFranchise, 
    getAllFranchises, 
    getMyFranchises, 
    updateFranchise, 
    deleteFranchise, 
    renewFranchise,
    updateFranchiseStatus,
    cancelMyFranchise,
    searchHistoricalFranchise,
    toggleArchiveFranchise,
    revokeFranchise,
    getFranchiseReports 
} = require('../controllers/franchiseController');

// Lahat makakagamit nito
router.get('/search', protect, searchHistoricalFranchise);

// API ROUTES:
router.route('/')
    // OPERATOR AT TODA LANG ANG PWEDENG MAGPASA (Bawal Admin)
    .post(
        protect, 
        authorize('operator', 'toda president'),
        upload.fields([
            { name: 'orCrDocument', maxCount: 1 },
            { name: 'license', maxCount: 1 },
            { name: 'todaEndorsement', maxCount: 1 },
            { name: 'brgyClearance', maxCount: 1 }
        ]), 
        createFranchise
    )
    // ADMIN LANG ANG PWEDENG KUMUHA NG MASTERLIST (Bawal Operator)
    .get(protect, authorize('admin'), getAllFranchises);

// ADMIN ONLY ROUTES
router.get('/reports', protect, authorize('admin'), getFranchiseReports);
router.put('/:id/archive', protect, authorize('admin'), toggleArchiveFranchise);
router.put('/:id/revoke', protect, authorize('admin'), upload.fields([{ name: 'evidence', maxCount: 1 }]), revokeFranchise);
router.put('/:id/status', protect, authorize('admin'), updateFranchiseStatus);

// OPERATOR ONLY ROUTES
router.get('/my-franchises', protect, authorize('operator', 'toda president'), getMyFranchises);
router.put('/:id/renew', protect, authorize('operator', 'toda president'), renewFranchise);
router.put('/:id/cancel', protect, authorize('operator', 'toda president'), cancelMyFranchise);

// SHARED ROUTES (Basta sariling data / update lang)
router.route('/:id')
    .put(
        protect, 
        upload.fields([
            { name: 'orCrDocument', maxCount: 1 },
            { name: 'license', maxCount: 1 },
            { name: 'todaEndorsement', maxCount: 1 },
            { name: 'brgyClearance', maxCount: 1 }
        ]), 
        updateFranchise
    )
    .delete(protect, authorize('admin'), deleteFranchise);

module.exports = router;