const mongoose = require('mongoose');

const policySnapshotSchema = new mongoose.Schema({
    policyVersion: {
        type: Number,
        immutable: true
    },
    policyUpdatedAt: {
        type: Date,
        immutable: true
    },
    violationCode: {
        type: String,
        immutable: true
    },
    violationName: {
        type: String,
        immutable: true
    },
    severity: {
        type: String,
        immutable: true
    },
    isGrave: {
        type: Boolean,
        immutable: true
    },
    fineAtCitation: {
        type: Number,
        immutable: true
    },
    suspensionDaysAtCitation: {
        type: Number,
        immutable: true
    },
    appliedTier: {
        type: String,
        immutable: true
    },
    lockedAt: {
        type: Date,
        default: Date.now,
        immutable: true
    }
}, { _id: false });

const violationSchema = new mongoose.Schema({
    operator: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: false, 
        default: null,
        index: true 
    },
    franchise: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Franchise', 
        required: true, 
        index: true 
    },
    plateNo: { 
        type: String, 
        required: true, 
        index: true 
    },
    bodyNumber: { 
        type: String, 
        default: '' 
    },
    driverName: { 
        type: String, 
        default: '' 
    },
    violationType: { 
        type: String, 
        required: true 
    },
    violationCode: { 
        type: String, 
        default: 'OTHER' 
    },
    severity: { 
        type: String, 
        enum: ['Low', 'Medium', 'High', 'Grave'], 
        default: 'Medium',
        immutable: true
    },
    isGrave: { 
        type: Boolean, 
        default: false,
        immutable: true
    },
    offenseNumber: { 
        type: Number, 
        required: true, 
        default: 1,
        immutable: true
    },
    sanction: {
        type: { 
            type: String, 
            enum: ['Warning', 'Suspension', 'Revocation'], 
            required: true,
            immutable: true
        },
        resultingStatus: { 
            type: String, 
            enum: ['Active - Under Warning', 'Suspended', 'Revoked'], 
            required: true,
            immutable: true
        },
        fineAmount: { 
            type: Number, 
            default: 0,
            immutable: true
        },
        suspensionDays: { 
            type: Number, 
            default: 0,
            immutable: true
        },
        suspensionStartDate: { 
            type: Date 
        },
        suspensionEndDate: { 
            type: Date 
        }
    },
    policySnapshot: {
        type: policySnapshotSchema,
        default: undefined,
        immutable: true
    },
    remarks: { 
        type: String, 
        default: '' 
    },
    evidenceUrl: { 
        type: String, 
        default: '' 
    },
    recordedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    recordedByName: { 
        type: String, 
        default: 'OVM Franchising Staff (LLSA I)'
    },
    status: { 
        type: String, 
        enum: ['Active', 'Settled', 'Lifted'], 
        default: 'Active',
        index: true 
    },
    settledAt: { 
        type: Date 
    },
    settledNotes: { 
        type: String, 
        default: '' 
    },
    settledBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }
}, { 
    timestamps: true 
});

violationSchema.index({ operator: 1, createdAt: -1 });
violationSchema.index({ franchise: 1, createdAt: -1 });

module.exports = mongoose.model('Violation', violationSchema);
