const mongoose = require('mongoose');

const todaRemovalRequestSchema = new mongoose.Schema({
    todaName: {
        type: String,
        required: true,
        trim: true
    },
    president: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    presidentName: {
        type: String,
        required: true
    },
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    memberName: {
        type: String,
        required: true
    },
    memberContact: {
        type: String,
        default: ''
    },
    memberAddress: {
        type: String,
        default: ''
    },
    reason: {
        type: String,
        required: true,
        enum: [
            'No longer operating / Inactive',
            'Transferred to another TODA or municipality',
            'Violation of TODA Bylaws / Disciplinary action',
            'Unauthorized / Unendorsed membership claim',
            'Failure to attend meetings / Settle association dues',
            'Other (Specified in details)'
        ]
    },
    details: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    adminRemarks: {
        type: String,
        default: ''
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('TodaRemovalRequest', todaRemovalRequestSchema);
