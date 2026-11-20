const mongoose = require('mongoose');

/**
 * Durable Payment Ledger Model
 * Permanently records every official treasury payment collected by Municipal Cashiers.
 * Entries are never overwritten or deleted when franchises renew, expire, or get archived.
 */
const paymentLedgerSchema = new mongoose.Schema({
    franchiseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Franchise',
        required: true,
        index: true
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true
    },
    applicantName: {
        type: String,
        required: true,
        trim: true
    },
    payerName: {
        type: String,
        default: '',
        trim: true
    },
    plateNo: {
        type: String,
        default: '',
        trim: true,
        index: true
    },
    mtopNo: {
        type: String,
        default: '',
        trim: true,
        index: true
    },
    todaAssociation: {
        type: String,
        default: '',
        trim: true
    },
    applicationType: {
        type: String,
        default: 'New',
        trim: true
    },
    officialReceiptNo: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        unique: true,
        index: true
    },
    amountPaid: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'GCash', 'Landbank', ''],
        default: 'Cash'
    },
    paymentDate: {
        type: Date,
        required: true,
        default: Date.now,
        index: true
    },
    paymentRemarks: {
        type: String,
        default: ''
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    processedByName: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

paymentLedgerSchema.index({ paymentDate: -1, createdAt: -1 });

module.exports = mongoose.models.PaymentLedger || mongoose.model('PaymentLedger', paymentLedgerSchema);
