const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const TodaSubmission = require('../models/todaSubmission'); 
const User = require('../models/userModel');
const Franchise = require('../models/franchiseModel');
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
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.pdf' || ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and image files are allowed'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Upload member list (TODA President)
router.post('/upload', protect, authorize('admin', 'toda president', 'toda_president'), upload.single('file'), async (req, res) => {
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

// Get all members, operators, and registered tricycle units under the TODA Association (for TODA Presidents / Admin)
router.get('/my-members', protect, async (req, res) => {
    try {
        // Determine the target TODA association
        let todaName = (req.query.todaName || '').trim();
        
        if (!todaName) {
            if (req.user.todaAssociation && req.user.todaAssociation !== 'NON-TODA') {
                todaName = req.user.todaAssociation.trim();
            } else {
                // Check if user has an existing franchise that specifies a TODA
                const userFranchise = await Franchise.findOne({ 
                    operator: req.user._id, 
                    todaName: { $exists: true, $nin: ['', 'NON-TODA'] } 
                });
                if (userFranchise && userFranchise.todaName) {
                    todaName = userFranchise.todaName.trim();
                }
            }
        }

        if (!todaName || todaName.toUpperCase() === 'NON-TODA') {
            return res.status(200).json({
                todaName: req.user.todaAssociation || 'NON-TODA',
                stats: { totalMembers: 0, totalUnits: 0, activeUnits: 0, pendingUnits: 0, expiredUnits: 0 },
                members: []
            });
        }

        const escapedToda = todaName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const todaRegex = new RegExp(`^${escapedToda}$`, 'i');

        // 1. Fetch all franchises matching this TODA
        const franchises = await Franchise.find({ todaName: todaRegex })
            .populate('operator', 'name contact address email profilePic role todaAssociation lastActive createdAt')
            .sort({ createdAt: -1 });

        // 2. Fetch all users registered under this TODA
        const users = await User.find({ todaAssociation: todaRegex })
            .select('name contact address email profilePic role todaAssociation lastActive createdAt')
            .sort({ name: 1 });

        // 3. Aggregate into member profiles
        const membersMap = new Map();

        // Seed from User collection first
        for (const u of users) {
            const uId = String(u._id);
            const isPres = String(u.role).toLowerCase().includes('president') || 
                           (String(req.user._id) === uId && String(req.user.role).toLowerCase().includes('president'));
            membersMap.set(uId, {
                _id: u._id,
                name: u.name,
                contact: u.contact || 'N/A',
                address: u.address || 'N/A',
                email: u.email || '',
                profilePic: u.profilePic || '',
                role: u.role,
                isPresident: isPres,
                isCurrentUser: String(req.user._id) === uId,
                lastActive: u.lastActive,
                createdAt: u.createdAt,
                units: []
            });
        }

        // Add units from Franchise collection
        for (const f of franchises) {
            const opKey = f.operator && f.operator._id ? String(f.operator._id) : (f.fullName || String(f._id));
            let member = membersMap.get(opKey);

            if (!member) {
                if (f.operator && f.operator.name) {
                    const isPres = String(f.operator.role || '').toLowerCase().includes('president');
                    member = {
                        _id: f.operator._id,
                        name: f.operator.name,
                        contact: f.operator.contact || 'N/A',
                        address: f.operator.address || f.address || 'N/A',
                        email: f.operator.email || '',
                        profilePic: f.operator.profilePic || '',
                        role: f.operator.role || 'operator',
                        isPresident: isPres,
                        isCurrentUser: String(req.user._id) === String(f.operator._id),
                        lastActive: f.operator.lastActive,
                        createdAt: f.operator.createdAt || f.createdAt,
                        units: []
                    };
                } else {
                    member = {
                        _id: opKey,
                        name: f.fullName,
                        contact: 'N/A',
                        address: f.address || 'N/A',
                        email: '',
                        profilePic: '',
                        role: 'operator',
                        isPresident: false,
                        isCurrentUser: false,
                        lastActive: null,
                        createdAt: f.createdAt,
                        units: []
                    };
                }
                membersMap.set(opKey, member);
            }

            member.units.push({
                _id: f._id,
                plateNo: f.plateNo,
                make: f.make,
                made: f.made,
                motorNo: f.motorNo,
                chassisNo: f.chassisNo,
                zone: f.zone,
                status: f.status,
                dateApplied: f.dateApplied,
                createdAt: f.createdAt
            });
        }

        const membersList = Array.from(membersMap.values());

        // Sort: President first, then by name
        membersList.sort((a, b) => {
            if (a.isPresident && !b.isPresident) return -1;
            if (!a.isPresident && b.isPresident) return 1;
            return a.name.localeCompare(b.name);
        });

        // Compute statistics
        let totalUnits = 0;
        let activeUnits = 0;
        let pendingUnits = 0;
        let expiredUnits = 0;

        membersList.forEach(m => {
            m.units.forEach(u => {
                totalUnits++;
                if (u.status === 'Active') activeUnits++;
                else if (u.status === 'Pending' || u.status === 'Ready for Pickup') pendingUnits++;
                else if (u.status === 'Expired') expiredUnits++;
            });
        });

        res.status(200).json({
            todaName,
            stats: {
                totalMembers: membersList.length,
                totalUnits,
                activeUnits,
                pendingUnits,
                expiredUnits
            },
            members: membersList
        });
    } catch (error) {
        console.error('Error fetching TODA members:', error);
        res.status(500).json({ message: 'Error fetching TODA member directory' });
    }
});

module.exports = router;