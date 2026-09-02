const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  validityNew: { type: Number, default: 3 },
  validityRenew: { type: Number, default: 1 },
  expiryWarningDays: { type: Number, default: 30 },
  fiscalYear: { type: String, default: () => new Date().getFullYear().toString() },
  franchiseFee: { type: Number, default: 500 },
  penaltyRate: { type: Number, default: 50 },
  baseFare: { type: Number, default: 15 },
  maxUnitsPerOperator: { type: Number, default: 2 },
  requiredDocs: { 
    type: [String], 
    default: ['OR / CR ng Motor', "Driver's License", 'TODA Endorsement', 'Barangay Clearance'] 
  },
  docChecklist: { type: String, default: 'Barangay Clearance, Driver\'s License, OR/CR, TODA Endorsement' },
  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: 'G-TRAMS portal is currently undergoing scheduled system maintenance. Please check back later.' }
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
