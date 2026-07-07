const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Pinalitan natin ng Capital 'T' para mag-match sa ginamit natin sa ibaba
const TodaSubmission = require('../models/todaSubmission'); 
const { protect, authorize } = require('../middleware/authMiddleware');

// Setup ng Multer (Saan ise-save ang files)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Mapupunta sa 'backend/uploads' folder
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 1. POST: Pag-upload ng TODA President
router.post('/upload', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const newSubmission = await TodaSubmission.create({
            submittedBy: req.user._id,
            presidentName: req.user.name,
            fileName: req.file.originalname,
            filePath: req.file.path
        });

        res.status(201).json({ message: 'List submitted successfully', submission: newSubmission });
    } catch (error) {
        console.error(error); // Para makita natin sa terminal kung may mag-error
        res.status(500).json({ message: 'Error uploading file' });
    }
});

// 2. GET: Pag-fetch ng Admin ng lahat ng submissions
router.get('/submissions', protect, authorize('admin'), async (req, res) => {
    try {
        const submissions = await TodaSubmission.find().sort({ createdAt: -1 });
        res.status(200).json(submissions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching submissions' });
    }
});

// 3. PUT: I-approve ng Admin ang submission
router.put('/approve/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const updatedSubmission = await TodaSubmission.findByIdAndUpdate(
            req.params.id,
            { status: 'Approved' },
            { new: true } // Ibabalik niya yung updated na data
        );

        if (!updatedSubmission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        res.status(200).json({ message: 'Approved successfully', submission: updatedSubmission });
    } catch (error) {
        res.status(500).json({ message: 'Error updating submission status' });
    }
});

// 4. GET: Pag-fetch ng TODA President ng SARILI niyang submissions
router.get('/my-submissions', protect, async (req, res) => {
    try {
        // Hahanapin lang sa database yung mga submission na match sa ID ng nag-login
        const mySubmissions = await TodaSubmission.find({ submittedBy: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(mySubmissions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching your submissions' });
    }
});

module.exports = router;