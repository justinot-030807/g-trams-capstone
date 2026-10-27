const { validateOperatorAgainstRoster } = require('../utils/rosterValidator');
const TodaSubmission = require('../models/todaSubmission');
const TodaRoster = require('../models/todaModel');

/**
 * Controller for pre-registration TODA roster verification.
 * Enforces strict pre-registration validation against official TODA masterlist records.
 * Route: POST /api/v1/auth/verify-roster
 */
exports.verifyTodaRoster = async (req, res) => {
    try {
        const { fullName, name, todaAssociation, bodyNumber } = req.body;
        const applicantName = fullName || name;

        if (!applicantName || !todaAssociation || !bodyNumber) {
            return res.status(400).json({
                success: false,
                verified: false,
                message: 'Full Name, TODA Association, at Assigned Body Number ay kailangang punan.'
            });
        }

        const report = await validateOperatorAgainstRoster({
            fullName: applicantName,
            todaAssociation,
            bodyNumber
        });

        if (report.isValid) {
            return res.status(200).json({
                success: true,
                verified: true,
                status: report.status,
                matchedMember: report.matchedMember,
                matchedBodyNumber: report.matchedBodyNumber,
                plateNo: report.plateNo,
                message: report.message
            });
        } else {
            return res.status(403).json({
                success: false,
                verified: false,
                status: report.status,
                message: report.message,
                advisory: report.advisory
            });
        }
    } catch (error) {
        console.error('Error in verifyTodaRoster:', error);
        return res.status(500).json({
            success: false,
            verified: false,
            message: 'Server error while verifying TODA roster.'
        });
    }
};

/**
 * Syncs extracted members from an approved submission into the TodaRoster collection
 */
exports.syncApprovedRoster = async (submissionId) => {
    try {
        const submission = await TodaSubmission.findById(submissionId);
        if (!submission || submission.status !== 'Approved') return;

        const todaAssociation = (submission.todaAssociation || '').trim();
        if (!todaAssociation || !Array.isArray(submission.extractedMembers)) return;

        for (const m of submission.extractedMembers) {
            const operatorName = (m.operatorName || m.name || '').trim();
            const bodyNumber = (m.bodyNumber || m.unitNo || '').trim().toUpperCase();

            if (operatorName && bodyNumber) {
                await TodaRoster.findOneAndUpdate(
                    { todaAssociation, bodyNumber },
                    {
                        todaAssociation,
                        operatorName,
                        bodyNumber,
                        plateNo: m.plateNo || '',
                        status: 'Active',
                        submissionRef: submission._id
                    },
                    { upsert: true, new: true }
                );
            }
        }
    } catch (err) {
        console.error('Error syncing approved roster:', err);
    }
};
