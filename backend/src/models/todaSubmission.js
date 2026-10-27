const mongoose = require('mongoose');

const todaSubmissionSchema = new mongoose.Schema({
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    presidentName: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    todaAssociation: {
        type: String,
        default: ''
    },
    extractedCount: {
        type: Number,
        default: 0
    },
    extractedMembers: [{
        name: { type: String, trim: true },
        operatorName: { type: String, trim: true, default: '' },
        bodyNumber: { type: String, trim: true, default: '' },
        unitNo: { type: String, default: '' },
        plateNo: { type: String, default: '' },
        confidence: { type: Number, default: 0.95 }
    }],
    ocrNotes: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('todaSubmission', todaSubmissionSchema);