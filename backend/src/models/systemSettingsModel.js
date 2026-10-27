const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  validityNew: { type: Number, default: 3 },
  validityRenew: { type: Number, default: 1 },
  expiryWarningDays: { type: Number, default: 30 },
  fiscalYear: { type: String, default: () => new Date().getFullYear().toString() },
  franchiseFee: { type: Number, default: 500 },
  penaltyRate: { type: Number, default: 50 },
  baseFare: { type: Number, default: 15 },
  farePerKm: { type: Number, default: 2.5 },
  maxUnitsPerOperator: { type: Number, default: 2 },
  requiredDocs: { 
    type: [String], 
    default: ['OR / CR ng Motor', "Driver's License", 'TODA Endorsement', 'Barangay Clearance'] 
  },
  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: 'G-TRAMS portal is currently undergoing scheduled system maintenance. Please check back later.' },
  announcements: {
    type: [{
      title: { type: String, required: true },
      desc: { type: String, required: true },
      type: { type: String, enum: ['alert', 'info', 'event'], default: 'info' },
      date: { type: String, default: 'General Advisory' },
      isActive: { type: Boolean, default: true }
    }],
    default: [
      {
        title: 'Franchise Renewal Schedule',
        desc: 'All registered tricycle operators must complete annual MTOP renewal before designated deadline to maintain active status.',
        type: 'alert',
        date: 'Annual Cycle',
        isActive: true
      },
      {
        title: 'Digital MTOP & QR Verification',
        desc: 'Approved operators can now view and download their digitally signed MTOP certificates with verifiable QR codes directly from their dashboard.',
        type: 'info',
        date: 'Portal Update',
        isActive: true
      },
      {
        title: 'Online Application Support',
        desc: 'Municipal Tricycle Franchising staff are available to assist operators with online registration, document scanning, and route zoning inquiries.',
        type: 'event',
        date: 'Advisory',
        isActive: true
      }
    ]
  },
  violationPolicy: {
    types: {
      type: [{
        code: { type: String, required: true },
        name: { type: String, required: true },
        severity: { type: String, enum: ['Low', 'Medium', 'High', 'Grave'], default: 'Medium' },
        isGrave: { type: Boolean, default: false },
        defaultFine: { type: Number, default: 500 },
        suspensionDays: { type: Number, default: 15 },
        isActive: { type: Boolean, default: true }
      }],
      default: [
        { code: 'OVERCHARGING', name: 'Overcharging of fare', severity: 'Medium', isGrave: false, defaultFine: 500, suspensionDays: 15, isActive: true },
        { code: 'REFUSAL_CONVEY', name: 'Refusal to convey passengers', severity: 'Medium', isGrave: false, defaultFine: 500, suspensionDays: 15, isActive: true },
        { code: 'DISCOURTEOUS', name: 'Arrogant/Discourteous behavior', severity: 'Low', isGrave: false, defaultFine: 300, suspensionDays: 7, isActive: true },
        { code: 'NO_FRANCHISE', name: 'Operating without valid franchise / Colorum', severity: 'Grave', isGrave: true, defaultFine: 2000, suspensionDays: 30, isActive: true },
        { code: 'OUT_OF_LINE', name: 'Out of line operation', severity: 'Medium', isGrave: false, defaultFine: 500, suspensionDays: 15, isActive: true },
        { code: 'RECKLESS_DRIVING', name: 'Reckless or dangerous driving', severity: 'High', isGrave: false, defaultFine: 1000, suspensionDays: 30, isActive: true },
        { code: 'OTHER', name: 'Other municipal ordinance violation', severity: 'Low', isGrave: false, defaultFine: 300, suspensionDays: 7, isActive: true }
      ]
    },
    tiers: {
      firstOffense: {
        sanction: { type: String, default: 'Warning' },
        resultingStatus: { type: String, default: 'Active - Under Warning' },
        description: { type: String, default: 'Official Warning recorded in municipal database; franchise remains operational.' }
      },
      secondOffense: {
        sanction: { type: String, default: 'Suspension' },
        resultingStatus: { type: String, default: 'Suspended' },
        defaultFine: { type: Number, default: 500 },
        defaultSuspensionDays: { type: Number, default: 15 },
        description: { type: String, default: 'Temporary suspension of franchise operations and imposition of administrative fine.' }
      },
      thirdOffense: {
        sanction: { type: String, default: 'Revocation' },
        resultingStatus: { type: String, default: 'Revoked' },
        description: { type: String, default: 'Immediate and permanent revocation of MTOP franchise and permit.' }
      },
      graveViolation: {
        sanction: { type: String, default: 'Revocation' },
        resultingStatus: { type: String, default: 'Revoked' },
        description: { type: String, default: 'Direct revocation regardless of prior offense count due to critical offense severity.' }
      }
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
