const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const TodaSubmission = require('../models/todaSubmission'); 
const { protect, authorize } = require('../middleware/authMiddleware');

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Upload member list (TODA President)
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
        console.error(error);
        res.status(500).json({ message: 'Error uploading file' });
    }
});

// Get all submissions (Admin only)
router.get('/submissions', protect, authorize('admin'), async (req, res) => {
    try {
        const submissions = await TodaSubmission.find().sort({ createdAt: -1 });
        res.status(200).json(submissions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching submissions' });
    }
});

// Approve submission (Admin only)
router.put('/approve/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const updatedSubmission = await TodaSubmission.findByIdAndUpdate(
            req.params.id,
            { status: 'Approved' },
            { new: true }
        );

        if (!updatedSubmission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        res.status(200).json({ message: 'Approved successfully', submission: updatedSubmission });
    } catch (error) {
        res.status(500).json({ message: 'Error updating submission status' });
    }
});

// Get user submissions
router.get('/my-submissions', protect, async (req, res) => {
    try {
        const mySubmissions = await TodaSubmission.find({ submittedBy: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(mySubmissions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching your submissions' });
    }
});

module.exports = router;