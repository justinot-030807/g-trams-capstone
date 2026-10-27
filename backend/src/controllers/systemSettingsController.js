const mongoose = require('mongoose');
const SystemSettings = require('../models/systemSettingsModel');
const User = require('../models/userModel');
const Franchise = require('../models/franchiseModel');
const AuditLog = require('../models/auditLogModel');
const Ticket = require('../models/ticketModel');

// Get server-authoritative time in Asia/Manila (UTC+8)
const getServerTime = (req, res) => {
  res.status(200).json({
    success: true,
    serverTime: new Date().toISOString(),
    timeZone: 'Asia/Manila',
    timestamp: Date.now()
  });
};

// Get system settings
const getSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne().sort({ updatedAt: -1, createdAt: -1 });

    if (!settings) {
      settings = await SystemSettings.create({
        validityNew: 3,
        validityRenew: 1,
        expiryWarningDays: 30,
        fiscalYear: new Date().getFullYear().toString(),
        franchiseFee: 500,
        penaltyRate: 50,
        baseFare: 15,
        farePerKm: 2.5,
        maxUnitsPerOperator: 2,
        requiredDocs: ['OR / CR ng Motor', "Driver's License", 'TODA Endorsement', 'Barangay Clearance'],
        maintenanceMode: false,
        maintenanceMessage: 'G-TRAMS portal is currently undergoing scheduled system maintenance. Please check back later.'
      });
    }

    if (settings && (settings.maxUnitsPerOperator === undefined || settings.maxUnitsPerOperator === null)) {
      settings.maxUnitsPerOperator = 2;
    }

    if (!settings.announcements || !Array.isArray(settings.announcements) || settings.announcements.length === 0) {
      settings.announcements = [
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
      ];
      await settings.save();
    }

    if (!settings.violationPolicy || !Array.isArray(settings.violationPolicy.types) || settings.violationPolicy.types.length === 0) {
      settings.violationPolicy = {
        types: [
          { code: 'OVERCHARGING', name: 'Overcharging of fare', severity: 'Medium', isGrave: false, defaultFine: 500, suspensionDays: 15, isActive: true },
          { code: 'REFUSAL_CONVEY', name: 'Refusal to convey passengers', severity: 'Medium', isGrave: false, defaultFine: 500, suspensionDays: 15, isActive: true },
          { code: 'DISCOURTEOUS', name: 'Arrogant/Discourteous behavior', severity: 'Low', isGrave: false, defaultFine: 300, suspensionDays: 7, isActive: true },
          { code: 'NO_FRANCHISE', name: 'Operating without valid franchise / Colorum', severity: 'Grave', isGrave: true, defaultFine: 2000, suspensionDays: 30, isActive: true },
          { code: 'OUT_OF_LINE', name: 'Out of line operation', severity: 'Medium', isGrave: false, defaultFine: 500, suspensionDays: 15, isActive: true },
          { code: 'RECKLESS_DRIVING', name: 'Reckless or dangerous driving', severity: 'High', isGrave: false, defaultFine: 1000, suspensionDays: 30, isActive: true },
          { code: 'OTHER', name: 'Other municipal ordinance violation', severity: 'Low', isGrave: false, defaultFine: 300, suspensionDays: 7, isActive: true }
        ],
        tiers: {
          firstOffense: { sanction: 'Warning', resultingStatus: 'Active - Under Warning', description: 'Official Warning recorded in municipal database; franchise remains operational.' },
          secondOffense: { sanction: 'Suspension', resultingStatus: 'Suspended', defaultFine: 500, defaultSuspensionDays: 15, description: 'Temporary suspension of franchise operations and imposition of administrative fine.' },
          thirdOffense: { sanction: 'Revocation', resultingStatus: 'Revoked', description: 'Immediate and permanent revocation of MTOP franchise and permit.' },
          graveViolation: { sanction: 'Revocation', resultingStatus: 'Revoked', description: 'Direct revocation regardless of prior offense count due to critical offense severity.' }
        }
      };
      await settings.save();
    }

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving system settings' });
  }
};

// Update system settings (Admin only)
const updateSettings = async (req, res) => {
  try {
    const {
      validityNew,
      validityRenew,
      expiryWarningDays,
      fiscalYear,
      franchiseFee,
      penaltyRate,
      baseFare,
      farePerKm,
      maxUnitsPerOperator,
      requiredDocs,
      maintenanceMode,
      maintenanceMessage,
      violationPolicy,
      announcements
    } = req.body;

    let settings = await SystemSettings.findOne().sort({ updatedAt: -1, createdAt: -1 });

    if (!settings) {
      settings = new SystemSettings();
    }

    if (validityNew !== undefined) settings.validityNew = validityNew;
    if (validityRenew !== undefined) settings.validityRenew = validityRenew;
    if (expiryWarningDays !== undefined) settings.expiryWarningDays = expiryWarningDays;
    if (fiscalYear !== undefined) settings.fiscalYear = fiscalYear;
    if (franchiseFee !== undefined) settings.franchiseFee = franchiseFee;
    if (penaltyRate !== undefined) settings.penaltyRate = penaltyRate;
    if (baseFare !== undefined) settings.baseFare = baseFare;
    if (farePerKm !== undefined) settings.farePerKm = farePerKm;
    if (maxUnitsPerOperator !== undefined) settings.maxUnitsPerOperator = Number(maxUnitsPerOperator);
    if (requiredDocs !== undefined && Array.isArray(requiredDocs)) settings.requiredDocs = requiredDocs;
    if (maintenanceMode !== undefined) settings.maintenanceMode = Boolean(maintenanceMode);
    if (maintenanceMessage !== undefined) settings.maintenanceMessage = maintenanceMessage;
    if (violationPolicy !== undefined && typeof violationPolicy === 'object') {
      settings.violationPolicy = violationPolicy;
    }
    if (announcements !== undefined && Array.isArray(announcements)) {
      settings.announcements = announcements;
    }

    await settings.save();

    // Remove any stale older duplicates so there is always a single authoritative record
    await SystemSettings.deleteMany({ _id: { $ne: settings._id } });

    res.status(200).json({
      success: true,
      message: 'System settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({ success: false, message: 'Server error updating system settings' });
  }
};

// Get system health & telemetry (System Admin IT maintenance only)
const getSystemHealth = async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    let dbPingMs = -1;

    if (isDbConnected) {
      const pingStart = Date.now();
      try {
        await mongoose.connection.db.admin().ping();
        dbPingMs = Date.now() - pingStart;
      } catch {
        dbPingMs = -1;
      }
    }

    const [userCount, franchiseCount, auditCount, ticketCount, users] = await Promise.all([
      User.countDocuments().catch(() => 0),
      Franchise.countDocuments().catch(() => 0),
      AuditLog.countDocuments().catch(() => 0),
      Ticket.countDocuments().catch(() => 0),
      User.find().select('role isActive isVerified').lean().catch(() => [])
    ]);

    // Role breakdown
    const roleBreakdown = {
      system_admin: 0,
      bplo_staff: 0,
      cashier: 0,
      toda_president: 0,
      operator: 0,
      driver: 0
    };

    let activeUsers = 0;
    let deactivatedUsers = 0;

    users.forEach(u => {
      const r = String(u.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
      if (r === 'system_admin' || r === 'admin' || r === 'administrator') roleBreakdown.system_admin++;
      else if (r === 'bplo_staff') roleBreakdown.bplo_staff++;
      else if (r === 'cashier') roleBreakdown.cashier++;
      else if (r === 'toda_president') roleBreakdown.toda_president++;
      else if (r === 'driver') roleBreakdown.driver++;
      else roleBreakdown.operator++;

      if (u.isActive === false) deactivatedUsers++;
      else activeUsers++;
    });

    const mem = process.memoryUsage();
    const settings = await SystemSettings.findOne().sort({ updatedAt: -1 }).lean().catch(() => null);

    res.status(200).json({
      success: true,
      data: {
        database: {
          status: isDbConnected ? 'Healthy' : 'Disconnected',
          connected: isDbConnected,
          pingMs: dbPingMs,
          host: mongoose.connection.host || 'MongoDB Atlas'
        },
        counts: {
          users: userCount,
          franchises: franchiseCount,
          auditLogs: auditCount,
          tickets: ticketCount
        },
        users: {
          total: userCount,
          active: activeUsers,
          deactivated: deactivatedUsers,
          roles: roleBreakdown
        },
        system: {
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          memoryMb: Math.round(mem.heapUsed / 1024 / 1024),
          maintenanceMode: Boolean(settings?.maintenanceMode),
          fiscalYear: settings?.fiscalYear || new Date().getFullYear().toString()
        }
      }
    });
  } catch (error) {
    console.error('Error in getSystemHealth:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving system diagnostics' });
  }
};

module.exports = {
  getServerTime,
  getSettings,
  updateSettings,
  getSystemHealth
};

