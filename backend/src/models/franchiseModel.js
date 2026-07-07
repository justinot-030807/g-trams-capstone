const mongoose = require('mongoose');

const franchiseSchema = new mongoose.Schema({
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true }, 
    address: { type: String, required: true },
    zone: { type: String, required: true },
    made: { type: String, required: true },
    make: { type: String, required: true },
    motorNo: { type: String, required: true, unique: true },
    chassisNo: { type: String, required: true, unique: true },
    plateNo: { type: String, required: true, unique: true },
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
    cedulaDate: { type: Date, required: true },
    cedulaAddress: { type: String, required: true },
    cedulaSerialNo: { type: String, required: true },
    
    // BINAGO: Idinagdag ang 'Revoked'
    status: { type: String, enum: ['Pending', 'Active', 'Expired', 'Cancelled', 'Revoked'], default: 'Pending' },
    applicationType: { type: String, default: 'New' },
    
    // Dito mase-save ang violation/rason at ang ebidensya
    cancelReason: { type: String, default: '' },
    evidenceUrl: { type: String, default: '' }, 
    
    eSigned: { type: Boolean, default: false },
    releaseDate: { type: String, default: '' },
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date }

}, { timestamps: true });

module.exports = mongoose.model('Franchise', franchiseSchema);