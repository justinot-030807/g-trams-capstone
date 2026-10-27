const mongoose = require('mongoose');

const smsLogSchema = new mongoose.Schema({
    recipientPhone: {
        type: String,
        required: true,
        trim: true
    },
    recipientName: {
        type: String,
        required: true,
        trim: true
    },
    plateNo: {
        type: String,
        default: 'N/A',
        trim: true
    },
    bodyNumber: {
        type: String,
        default: '',
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['30_DAY_EXPIRATION_ALERT', 'EXPIRATION_NOTICE', 'STATUS_CHANGE', 'TEST_DISPATCH', 'GENERAL'],
        default: '30_DAY_EXPIRATION_ALERT'
    },
    status: {
        type: String,
        enum: ['SIMULATED', 'DELIVERED', 'FAILED'],
        default: 'SIMULATED'
    },
    daysRemaining: {
        type: Number,
        default: 30
    },
    franchiseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Franchise'
    },
    operatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dispatchedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for real-time querying & sorting
smsLogSchema.index({ dispatchedAt: -1 });
smsLogSchema.index({ recipientPhone: 1 });
smsLogSchema.index({ type: 1 });

module.exports = mongoose.model('SmsLog', smsLogSchema);
