const mongoose = require('mongoose');

/**
 * TODA Roster Model
 * Represents certified members and assigned body numbers under accredited TODA associations.
 * Governed by Gasan Municipal Franchising Ordinance No. 2020-04.
 */
const todaRosterSchema = new mongoose.Schema({
    todaAssociation: {
        type: String,
        required: true,
        trim: true
    },
    operatorName: {
        type: String,
        required: true,
        trim: true
    },
    bodyNumber: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    plateNo: {
        type: String,
        default: '',
        trim: true
    },
    contact: {
        type: String,
        default: '',
        trim: true
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Suspended', 'Revoked'],
        default: 'Active'
    },
    registeredUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    submissionRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'todaSubmission',
        default: null
    },
    remarks: {
        type: String,
        default: ''
    }
}, { timestamps: true });

// Compound indexes for fast lookup and integrity
todaRosterSchema.index({ todaAssociation: 1, bodyNumber: 1 });
todaRosterSchema.index({ todaAssociation: 1, operatorName: 1 });
todaRosterSchema.index({ bodyNumber: 1 });

module.exports = mongoose.model('TodaRoster', todaRosterSchema);
