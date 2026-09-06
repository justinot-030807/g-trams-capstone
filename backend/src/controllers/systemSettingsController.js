const SystemSettings = require('../models/systemSettingsModel');

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
        docChecklist: 'Barangay Clearance, Driver\'s License, OR/CR, TODA Endorsement',
        maintenanceMode: false,
        maintenanceMessage: 'G-TRAMS portal is currently undergoing scheduled system maintenance. Please check back later.'
      });
    }

    if (settings && (settings.maxUnitsPerOperator === undefined || settings.maxUnitsPerOperator === null)) {
      settings.maxUnitsPerOperator = 2;
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
      docChecklist,
      maintenanceMode,
      maintenanceMessage
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
    if (docChecklist !== undefined) settings.docChecklist = docChecklist;
    if (maintenanceMode !== undefined) settings.maintenanceMode = Boolean(maintenanceMode);
    if (maintenanceMessage !== undefined) settings.maintenanceMessage = maintenanceMessage;

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

module.exports = {
  getSettings,
  updateSettings
};
