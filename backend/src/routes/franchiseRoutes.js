const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../config/cloudinary');
const { authorize } = require('../middleware/authMiddleware'); 

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

router.get('/search', protect, searchHistoricalFranchise);

router.route('/')
    .post(
        protect, 
        upload.fields([
            { name: 'orCrDocument', maxCount: 1 },
            { name: 'license', maxCount: 1 },
            { name: 'todaEndorsement', maxCount: 1 },
            { name: 'brgyClearance', maxCount: 1 }
        ]), 
        createFranchise
    )
    .get(protect, getAllFranchises);

router.get('/reports', protect, authorize('admin'), getFranchiseReports);
router.get('/my-franchises', protect, getMyFranchises);
router.put('/:id/archive', protect, toggleArchiveFranchise);

// MODULE 8: ROUTE PARA SA REVOCATION MAY KASAMANG FILE UPLOAD
router.put('/:id/revoke', protect, upload.fields([{ name: 'evidence', maxCount: 1 }]), revokeFranchise);

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
    .delete(protect, deleteFranchise);

router.put('/:id/renew', protect, renewFranchise);
router.put('/:id/status', protect, updateFranchiseStatus);
router.put('/:id/cancel', protect, cancelMyFranchise);



module.exports = router;