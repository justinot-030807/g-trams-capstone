const mongoose = require('mongoose');

const franchiseSchema = new mongoose.Schema({
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true }, 
    address: { type: String, required: true },
    zone: { type: String, required: true },
    made: { type: String, required: true },
    make: { type: String, required: true },
    motorNo: { type: String, required: true },
    chassisNo: { type: String, required: true },
    plateNo: { type: String, required: true },
    todaName: { type: String, required: true },
    
    orCrUrl: { type: String },
    licenseUrl: { type: String },
    todaEndorsementUrl: { type: String },
    brgyClearanceUrl: { type: String },
    
    deficiencies: {
        hasOrcr: { type: Boolean, default: false },
        hasLicense: { type: Boolean, default: false },
        hasTodaEndorsement: { type: Boolean, default: false },
        hasBrgyClearance: { type: Boolean, default: false }
    },
    
    dateApplied: { type: Date, default: Date.now },
    approvalDate: { type: Date },
    cedulaDate: { type: Date, required: true },
    cedulaAddress: { type: String, required: true },
    cedulaSerialNo: { type: String, required: true },
    
    status: { type: String, enum: ['Pending', 'For Signing', 'Ready for Pickup', 'Active', 'Expired', 'Cancelled', 'Revoked'], default: 'Pending' },
    applicationType: { type: String, default: 'New' },
    
    // Cancellation or revocation reason and evidence
    cancelReason: { type: String, default: '' },
    evidenceUrl: { type: String, default: '' }, 
    
    eSigned: { type: Boolean, default: false },
    releaseDate: { type: String, default: '' },
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date }

}, { timestamps: true });

// Unique indexes to prevent duplicates (Race condition fix)
franchiseSchema.index(
    { plateNo: 1 }, 
    { unique: true, partialFilterExpression: { 
        isArchived: { $ne: true }, 
        status: { $nin: ['Cancelled'] } 
    }}
);
franchiseSchema.index(
    { motorNo: 1 }, 
    { unique: true, partialFilterExpression: { 
        isArchived: { $ne: true }, 
        status: { $nin: ['Cancelled'] } 
    }}
);
franchiseSchema.index(
    { chassisNo: 1 }, 
    { unique: true, partialFilterExpression: { 
        isArchived: { $ne: true }, 
        status: { $nin: ['Cancelled'] } 
    }}
);

// Create text index for search optimization
franchiseSchema.index({ 
    fullName: 'text', 
    plateNo: 'text', 
    motorNo: 'text', 
    chassisNo: 'text',
    todaName: 'text'
});

// Index for operator to speed up population and queries
franchiseSchema.index({ operator: 1 });

module.exports = mongoose.model('Franchise', franchiseSchema);