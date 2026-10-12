const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const TodaSubmission = require('../models/todaSubmission'); 
const TodaRemovalRequest = require('../models/todaRemovalRequest');
const User = require('../models/userModel');
const Franchise = require('../models/franchiseModel');
const { protect, authorize } = require('../middleware/authMiddleware');
const { extractTodaRosterFromDocument } = require('../services/documentVerificationService');
const { isNameMatch } = require('../utils/nameMatcher');

const upload = require('../config/cloudinary');

const memoryUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 }
});

// Real-time AI OCR scanning for roster documents (zero Cloudinary delay, memory buffer)
router.post('/scan-roster', protect, authorize('admin', 'toda president', 'toda_president'), memoryUpload.single('file'), async (req, res) => {
    try {
        let input = null;

        if (req.file && req.file.buffer) {
            let mType = req.file.mimetype || 'image/jpeg';
            if (req.file.originalname && req.file.originalname.toLowerCase().endsWith('.pdf')) {
                mType = 'application/pdf';
            }
            input = {
                base64Data: req.file.buffer.toString('base64'),
                mimeType: mType
            };
        } else if (req.body.base64) {
            let base64Data = req.body.base64;
            let mType = req.body.mimeType || 'image/jpeg';
            if (base64Data.includes(',')) {
                const parts = base64Data.split(',');
                const match = parts[0].match(/:(.*?);/);
                if (match) mType = match[1];
                base64Data = parts[1];
            }
            input = { base64Data, mimeType: mType };
        } else if (req.body.fileUrl) {
            input = req.body.fileUrl;
        }

        if (!input) {
            return res.status(400).json({ success: false, message: 'No file received for document scanning.' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(200).json({
                success: false,
                noKey: true,
                message: 'Notice: GEMINI_API_KEY is not configured on the server. AI roster digitization is disabled.',
                extractedMembers: [],
                extractedCount: 0
            });
        }

        const ocr = await extractTodaRosterFromDocument(input);
        if (!ocr || !Array.isArray(ocr.members) || ocr.members.length === 0) {
            return res.status(200).json({
                success: false,
                message: 'No member records detected in document. Please verify the document format or image clarity.',
                extractedMembers: [],
                extractedCount: 0,
                ocrNotes: ocr?.notes || 'No members identified'
            });
        }

        const members = ocr.members.map(m => ({
            name: (m.name || (typeof m === 'string' ? m : '')).trim(),
            confidence: 0.95
        })).filter(m => Boolean(m.name));

        return res.status(200).json({
            success: true,
            extractedMembers: members,
            extractedCount: members.length,
            todaAssociation: ocr.todaAssociation || req.user.todaAssociation || '',
            documentTitle: ocr.documentTitle || '',
            ocrNotes: ocr.notes || ''
        });
    } catch (err) {
        console.error('Error in /scan-roster:', err);
        res.status(500).json({ success: false, message: 'Server error while scanning roster document.' });
    }
});

// Upload member list (TODA President) with AI OCR Roster Parsing
router.post('/upload', protect, authorize('admin', 'toda president', 'toda_president'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        let extractedMembers = [];
        let extractedCount = 0;
        let ocrNotes = '';
        let todaAssociation = req.user.todaAssociation || '';

        // If client already pre-scanned and confirmed members:
        if (req.body.extractedMembers) {
            try {
                const parsed = typeof req.body.extractedMembers === 'string' 
                    ? JSON.parse(req.body.extractedMembers) 
                    : req.body.extractedMembers;
                if (Array.isArray(parsed) && parsed.length > 0) {
                    extractedMembers = parsed.map(m => ({
                        name: (m.name || (typeof m === 'string' ? m : '')).trim(),
                        confidence: m.confidence || 0.95
                    })).filter(m => Boolean(m.name));
                    extractedCount = extractedMembers.length;
                    ocrNotes = req.body.ocrNotes || 'Pre-scanned & verified by TODA President';
                }
            } catch (pErr) {
                console.warn('[TodaRoster] Error parsing client extractedMembers:', pErr.message);
            }
        }

        // Fallback: If not provided by client, run OCR extraction directly on file path
        if (extractedMembers.length === 0) {
            try {
                const ocr = await extractTodaRosterFromDocument(req.file.path);
                if (ocr && Array.isArray(ocr.members)) {
                    extractedMembers = ocr.members.map(m => ({
                        name: (m.name || '').trim(),
                        unitNo: (m.unitNo || '').trim(),
                        plateNo: (m.plateNo || '').trim(),
                        confidence: 0.95
                    })).filter(m => Boolean(m.name));
                    extractedCount = extractedMembers.length;
                    ocrNotes = ocr.notes || '';
                    if (ocr.todaAssociation && (!todaAssociation || todaAssociation === 'NON-TODA')) {
                        todaAssociation = ocr.todaAssociation;
                    }
                }
            } catch (ocrErr) {
                console.warn('[TodaRoster] OCR extraction failed non-critically:', ocrErr.message);
            }
        }

        const newSubmission = await TodaSubmission.create({
            submittedBy: req.user._id,
            presidentName: req.user.name,
            todaAssociation,
            fileName: req.file.originalname,
            filePath: req.file.path, // Cloudinary URL
            extractedMembers,
            extractedCount,
            ocrNotes
        });

        res.status(201).json({ 
            message: extractedCount > 0 
                ? `Roster submitted successfully! AI OCR extracted ${extractedCount} members.`
                : 'List submitted successfully.', 
            submission: newSubmission 
        });
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

// Re-scan an existing submission with AI OCR (Admin only)
router.put('/submissions/:id/rescan', protect, authorize('admin'), async (req, res) => {
    try {
        const submission = await TodaSubmission.findById(req.params.id);
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found.' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(400).json({ message: 'GEMINI_API_KEY is not configured on server.' });
        }

        const ocr = await extractTodaRosterFromDocument(submission.filePath);
        if (!ocr || !Array.isArray(ocr.members) || ocr.members.length === 0) {
            return res.status(200).json({
                success: false,
                message: 'Re-scan completed, but no member records could be detected in the document file.',
                submission
            });
        }

        const extractedMembers = ocr.members.map(m => ({
            name: (m.name || (typeof m === 'string' ? m : '')).trim(),
            confidence: 0.95
        })).filter(m => Boolean(m.name));

        submission.extractedMembers = extractedMembers;
        submission.extractedCount = extractedMembers.length;
        if (ocr.notes) submission.ocrNotes = ocr.notes;
        if (ocr.todaAssociation && (!submission.todaAssociation || submission.todaAssociation === 'NON-TODA')) {
            submission.todaAssociation = ocr.todaAssociation;
        }

        await submission.save();

        res.status(200).json({
            success: true,
            message: `Successfully re-scanned! ${extractedMembers.length} members extracted.`,
            submission
        });
    } catch (err) {
        console.error('Error re-scanning submission:', err);
        res.status(500).json({ message: 'Server error while re-scanning submission.' });
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

// Submit member removal / kick request (TODA President)
router.post('/removal-requests', protect, authorize('admin', 'toda president', 'toda_president'), async (req, res) => {
    try {
        const { memberId, reason, details } = req.body;
        if (!memberId || !reason || !details) {
            return res.status(400).json({ message: 'Member ID, reason, and detailed explanation are required.' });
        }

        const member = await User.findById(memberId);
        if (!member) {
            return res.status(404).json({ message: 'Operator member not found.' });
        }

        // Determine president's TODA
        const presidentToda = (req.user.todaAssociation || '').trim();
        if (!presidentToda || presidentToda === 'NON-TODA') {
            return res.status(400).json({ message: 'You must have a registered TODA Association to submit removal requests.' });
        }

        // Verify member is in that TODA
        if ((member.todaAssociation || '').trim().toUpperCase() !== presidentToda.toUpperCase()) {
            return res.status(400).json({ message: `Operator is not currently affiliated with ${presidentToda}.` });
        }

        const removalReq = await TodaRemovalRequest.create({
            todaName: presidentToda,
            president: req.user._id,
            presidentName: req.user.name,
            member: member._id,
            memberName: member.name,
            memberContact: member.contact || '',
            memberAddress: member.address || '',
            reason,
            details: details.trim(),
            status: 'Pending'
        });

        res.status(201).json({ message: 'Removal request filed successfully and routed to Admin for approval.', request: removalReq });
    } catch (error) {
        console.error('Error filing removal request:', error);
        res.status(500).json({ message: 'Failed to file removal request.' });
    }
});

// Get removal requests (Admin sees all; Toda President sees for their TODA)
router.get('/removal-requests', protect, authorize('admin', 'toda president', 'toda_president'), async (req, res) => {
    try {
        const userRole = String(req.user?.role || '').toLowerCase().trim().replace(/_/g, ' ');
        const isAdmin = userRole === 'admin' || userRole === 'administrator';

        let query = {};
        if (!isAdmin) {
            const presidentToda = (req.user.todaAssociation || '').trim();
            query.todaName = new RegExp(`^${presidentToda}$`, 'i');
        }

        const requests = await TodaRemovalRequest.find(query)
            .populate('member', 'name contact address role')
            .populate('president', 'name email')
            .populate('reviewedBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json(requests);
    } catch (error) {
        console.error('Error fetching removal requests:', error);
        res.status(500).json({ message: 'Failed to fetch removal requests.' });
    }
});

// Approve removal request (Admin only)
router.put('/removal-requests/:id/approve', protect, authorize('admin'), async (req, res) => {
    try {
        const { adminRemarks = '' } = req.body;
        const request = await TodaRemovalRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Removal request not found.' });
        if (request.status !== 'Pending') {
            return res.status(400).json({ message: `Request has already been ${request.status.toLowerCase()}.` });
        }

        request.status = 'Approved';
        request.adminRemarks = adminRemarks.trim();
        request.reviewedBy = req.user._id;
        request.reviewedAt = new Date();
        await request.save();

        // Disaffiliate member: reset todaAssociation to 'NON-TODA'
        await User.findByIdAndUpdate(request.member, { todaAssociation: 'NON-TODA' });

        // Update active franchises under this operator
        await Franchise.updateMany(
            { operator: request.member, todaName: new RegExp(`^${request.todaName}$`, 'i') },
            { $set: { todaName: 'NON-TODA' } }
        );

        res.status(200).json({ message: `Member ${request.memberName} officially disaffiliated from ${request.todaName}.`, request });
    } catch (error) {
        console.error('Error approving removal request:', error);
        res.status(500).json({ message: 'Failed to approve removal request.' });
    }
});

// Reject removal request (Admin only)
router.put('/removal-requests/:id/reject', protect, authorize('admin'), async (req, res) => {
    try {
        const { adminRemarks = '' } = req.body;
        const request = await TodaRemovalRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Removal request not found.' });
        if (request.status !== 'Pending') {
            return res.status(400).json({ message: `Request has already been ${request.status.toLowerCase()}.` });
        }

        request.status = 'Rejected';
        request.adminRemarks = adminRemarks.trim() || 'Request disapproved by municipal administrator.';
        request.reviewedBy = req.user._id;
        request.reviewedAt = new Date();
        await request.save();

        res.status(200).json({ message: 'Removal request has been rejected.', request });
    } catch (error) {
        console.error('Error rejecting removal request:', error);
        res.status(500).json({ message: 'Failed to reject removal request.' });
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
        const userRole = String(req.user?.role || '').toLowerCase().trim().replace(/_/g, ' ');
        const isAdmin = userRole === 'admin' || userRole === 'administrator';

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
        } else if (!isAdmin) {
            // Non-admin users are restricted to viewing only their own assigned TODA association
            const userToda = (req.user.todaAssociation || '').trim();
            if (userToda.toUpperCase() !== todaName.toUpperCase()) {
                return res.status(403).json({ message: 'ACCESS DENIED: You can only view members of your own TODA association.' });
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

        // 3. Fetch approved TODA Submissions to include endorsed masterlist members
        const approvedSubmissions = await TodaSubmission.find({
            status: 'Approved',
            $or: [{ todaAssociation: todaRegex }, { fileName: todaRegex }]
        }).sort({ createdAt: -1 });

        const latestApprovedSub = approvedSubmissions[0] || null;
        const endorsedRoster = latestApprovedSub?.extractedMembers || [];

        // Cross-match approved masterlist roster members
        for (const rm of endorsedRoster) {
            const rmName = (rm.name || '').trim();
            if (!rmName) continue;

            const existing = Array.from(membersMap.values()).find(m => isNameMatch(m.name, rmName));
            if (!existing) {
                const tempId = `roster-${rm._id || Math.random().toString(36).slice(2, 9)}`;
                membersMap.set(tempId, {
                    _id: tempId,
                    name: rmName,
                    contact: 'N/A',
                    address: 'Endorsed Masterlist Record',
                    email: '',
                    profilePic: '',
                    role: 'operator',
                    isPresident: false,
                    isCurrentUser: false,
                    isRosterEndorsed: true,
                    registeredInApp: false,
                    lastActive: null,
                    createdAt: latestApprovedSub.createdAt,
                    units: []
                });
            } else {
                existing.isRosterEndorsed = true;
                existing.registeredInApp = true;
            }
        }

        const membersList = Array.from(membersMap.values());

        // Sort: President first, then registered members, then by name
        membersList.sort((a, b) => {
            if (a.isPresident && !b.isPresident) return -1;
            if (!a.isPresident && b.isPresident) return 1;
            const regA = a.registeredInApp !== false ? 1 : 0;
            const regB = b.registeredInApp !== false ? 1 : 0;
            if (regA !== regB) return regB - regA;
            return (a.name || '').localeCompare(b.name || '');
        });

        // Compute statistics
        let totalUnits = 0;
        let activeUnits = 0;
        let pendingUnits = 0;
        let expiredUnits = 0;

        membersList.forEach(m => {
            (m.units || []).forEach(u => {
                totalUnits++;
                if (u.status === 'Active') activeUnits++;
                else if (u.status === 'Pending' || u.status === 'For Signing' || u.status === 'Ready for Pickup') pendingUnits++;
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
                expiredUnits,
                certifiedRosterCount: endorsedRoster.length
            },
            members: membersList,
            latestSubmission: latestApprovedSub
        });
    } catch (error) {
        console.error('Error fetching TODA members:', error);
        res.status(500).json({ message: 'Error fetching TODA member directory' });
    }
});

module.exports = router;