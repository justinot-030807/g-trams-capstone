const mongoose = require('mongoose');
const SystemSettings = require('../models/systemSettingsModel');
const User = require('../models/userModel');
const Franchise = require('../models/franchiseModel');
const AuditLog = require('../models/auditLogModel');
const Ticket = require('../models/ticketModel');
const { logAudit } = require('../utils/auditLogger');
const { getManilaDateString } = require('../utils/phTime');

const MIN_FISCAL_YEAR = 2020;
const MAX_FISCAL_YEAR = 2100;
const STRICT_FISCAL_YEAR_RE = /^\d{4}$/;
const FISCAL_YEAR_ERROR_MSG = 'Fiscal year must be a single 4-digit year (e.g., 2026).';
const DEFAULT_MAINTENANCE_MESSAGE = 'G-TRAMS portal is currently undergoing scheduled system maintenance. Please check back later.';
const ALLOWED_SEVERITIES = ['Low', 'Medium', 'High', 'Grave'];

const getCurrentManilaYear = () => {
  const manilaDate = getManilaDateString();
  return manilaDate ? manilaDate.slice(0, 4) : new Date().getFullYear().toString();
};

const isStrictFiscalYear = (val) => {
  if (typeof val !== 'string' && typeof val !== 'number') return false;
  const trimmed = String(val).trim();
  if (!STRICT_FISCAL_YEAR_RE.test(trimmed)) return false;
  const yearNum = Number(trimmed);
  return yearNum >= MIN_FISCAL_YEAR && yearNum <= MAX_FISCAL_YEAR;
};

const normalizeLegacyFiscalYear = (val) => {
  if (val !== undefined && val !== null) {
    const trimmed = String(val).trim();
    const match = trimmed.match(/^(\d{4})/);
    if (match) {
      const yearNum = Number(match[1]);
      if (yearNum >= MIN_FISCAL_YEAR && yearNum <= MAX_FISCAL_YEAR) {
        return match[1];
      }
    }
  }
  return getCurrentManilaYear();
};

const parseStrictNumber = (raw, { label, min = 0, max = Infinity, integer = false }) => {
  if (raw === null || raw === '' || (typeof raw === 'string' && raw.trim() === '') || typeof raw === 'boolean' || typeof raw === 'object') {
    return { error: `${label} must be a valid number.` };
  }
  const num = Number(raw);
  if (!Number.isFinite(num)) {
    return { error: `${label} must be a valid number.` };
  }
  if (integer && !Number.isInteger(num)) {
    return { error: `${label} must be a whole number.` };
  }
  if (num < min) {
    return { error: min > 0 ? `${label} must be greater than 0 (minimum ${min}).` : `${label} cannot be negative.` };
  }
  if (num > max) {
    return { error: `${label} cannot exceed ${max}.` };
  }
  return { value: num };
};

// Get server-authoritative time in Asia/Manila (UTC+8)
const getServerTime = (req, res) => {
  res.status(200).json({
    success: true,
    serverTime: new Date().toISOString(),
    timeZone: 'Asia/Manila',
    timestamp: Date.now()
  });
};

const DEFAULT_ANNOUNCEMENTS = [
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

const DEFAULT_VIOLATION_POLICY = {
  policyVersion: 1,
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

const cloneDefaultTypes = () => DEFAULT_VIOLATION_POLICY.types.map((item) => ({ ...item }));

const mergeTiers = (baseTiers, incomingTiers = {}) => {
  const base = baseTiers || DEFAULT_VIOLATION_POLICY.tiers;
  const inc = (incomingTiers && typeof incomingTiers === 'object' && !Array.isArray(incomingTiers)) ? incomingTiers : {};
  const toPlain = (obj) => (obj && typeof obj.toObject === 'function' ? obj.toObject() : (obj || {}));

  const mergeOne = (tierKey) => {
    const def = DEFAULT_VIOLATION_POLICY.tiers[tierKey];
    const existing = toPlain(base[tierKey]);
    const patch = toPlain(inc[tierKey]);
    const merged = {
      sanction: typeof patch.sanction === 'string' && patch.sanction.trim()
        ? patch.sanction.trim()
        : (existing.sanction || def.sanction),
      resultingStatus: typeof patch.resultingStatus === 'string' && patch.resultingStatus.trim()
        ? patch.resultingStatus.trim()
        : (existing.resultingStatus || def.resultingStatus),
      description: typeof patch.description === 'string' && patch.description.trim()
        ? patch.description.trim()
        : (existing.description || def.description)
    };
    if (tierKey === 'secondOffense') {
      merged.defaultFine = patch.defaultFine !== undefined
        ? Number(patch.defaultFine)
        : (existing.defaultFine !== undefined ? Number(existing.defaultFine) : def.defaultFine);
      merged.defaultSuspensionDays = patch.defaultSuspensionDays !== undefined
        ? Number(patch.defaultSuspensionDays)
        : (existing.defaultSuspensionDays !== undefined ? Number(existing.defaultSuspensionDays) : def.defaultSuspensionDays);
    }
    return merged;
  };

  return {
    firstOffense: mergeOne('firstOffense'),
    secondOffense: mergeOne('secondOffense'),
    thirdOffense: mergeOne('thirdOffense'),
    graveViolation: mergeOne('graveViolation')
  };
};

const normalizeStoredTypeItem = (t) => {
  const plain = t && typeof t.toObject === 'function' ? t.toObject() : (t || {});
  const isGrave = Boolean(plain.isGrave || plain.severity === 'Grave');
  return {
    code: String(plain.code || '').trim().toUpperCase(),
    name: String(plain.name || '').trim(),
    severity: isGrave ? 'Grave' : (ALLOWED_SEVERITIES.includes(plain.severity) ? plain.severity : 'Medium'),
    isGrave,
    defaultFine: Number.isFinite(Number(plain.defaultFine)) ? Number(plain.defaultFine) : 0,
    suspensionDays: Number.isFinite(Number(plain.suspensionDays)) ? Number(plain.suspensionDays) : 0,
    isActive: plain.isActive !== false
  };
};

const normalizeViolationPolicyForRead = (rawPolicy, fallbackDate = null) => {
  const plain = rawPolicy && typeof rawPolicy.toObject === 'function' ? rawPolicy.toObject() : rawPolicy;
  const hasStoredTypes = Boolean(plain && Array.isArray(plain.types));
  const types = hasStoredTypes
    ? plain.types.map((item) => {
        const normalized = normalizeStoredTypeItem(item);
        return item && item._id ? { _id: item._id, ...normalized } : normalized;
      })
    : cloneDefaultTypes();
  const tiers = mergeTiers(DEFAULT_VIOLATION_POLICY.tiers, plain?.tiers);
  const rawVersion = Number(plain?.policyVersion);
  const policyVersion = Number.isFinite(rawVersion) && rawVersion >= 1 ? Math.floor(rawVersion) : 1;
  const policyUpdatedAt = plain?.policyUpdatedAt || fallbackDate || null;

  return {
    policyVersion,
    policyUpdatedAt,
    types,
    tiers
  };
};

const sanitizeIncomingViolationTypes = (rawTypes) => {
  if (!Array.isArray(rawTypes)) {
    return { error: 'Violation policy types must be an array.' };
  }

  const seenCodes = new Set();
  const seenNames = new Set();
  const sanitized = [];

  for (const [index, item] of rawTypes.entries()) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { error: `Violation type #${index + 1} must be an object.` };
    }

    const name = typeof item.name === 'string' ? item.name.trim() : '';
    if (!name) {
      return { error: `Violation type #${index + 1} requires a non-empty name.` };
    }

    const rawCode = typeof item.code === 'string' && item.code.trim()
      ? item.code.trim()
      : name;
    const code = rawCode
      .toUpperCase()
      .replace(/[^A-Z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40);

    if (!code) {
      return { error: `Violation type "${name}" requires a valid non-empty code.` };
    }

    if (seenCodes.has(code)) {
      return { error: `Duplicate violation code "${code}" is not allowed.` };
    }
    const nameKey = name.toLowerCase();
    if (seenNames.has(nameKey)) {
      return { error: `Duplicate violation name "${name}" is not allowed.` };
    }
    seenCodes.add(code);
    seenNames.add(nameKey);

    if (item.severity !== undefined && !ALLOWED_SEVERITIES.includes(item.severity)) {
      return { error: `Violation type "${name}" has an invalid severity "${item.severity}".` };
    }

    const isGrave = Boolean(item.isGrave || item.severity === 'Grave');
    const severity = isGrave ? 'Grave' : (item.severity || 'Medium');

    const fineCheck = item.defaultFine === undefined
      ? { value: 500 }
      : parseStrictNumber(item.defaultFine, { label: `Default fine for "${name}"`, min: 0, max: 1000000 });
    if (fineCheck.error) return { error: fineCheck.error };

    const suspCheck = item.suspensionDays === undefined
      ? { value: 15 }
      : parseStrictNumber(item.suspensionDays, { label: `Suspension days for "${name}"`, min: 0, max: 365, integer: true });
    if (suspCheck.error) return { error: suspCheck.error };

    const clean = {
      code,
      name,
      severity,
      isGrave,
      defaultFine: fineCheck.value,
      suspensionDays: suspCheck.value,
      isActive: item.isActive !== false
    };

    const rawId = typeof item._id === 'string' ? item._id.trim() : '';
    if (rawId && /^[a-f0-9]{24}$/i.test(rawId)) {
      clean._id = rawId;
    }

    sanitized.push(clean);
  }

  return { types: sanitized };
};

const validateIncomingTiers = (rawTiers) => {
  if (!rawTiers || typeof rawTiers !== 'object' || Array.isArray(rawTiers)) {
    return { error: 'Violation policy tiers must be an object.' };
  }
  const second = rawTiers.secondOffense;
  if (second !== undefined) {
    if (!second || typeof second !== 'object' || Array.isArray(second)) {
      return { error: 'Second offense tier configuration must be an object.' };
    }
    if (second.defaultFine !== undefined) {
      const fineCheck = parseStrictNumber(second.defaultFine, { label: '2nd offense default fine', min: 0, max: 1000000 });
      if (fineCheck.error) return { error: fineCheck.error };
    }
    if (second.defaultSuspensionDays !== undefined) {
      const daysCheck = parseStrictNumber(second.defaultSuspensionDays, { label: '2nd offense suspension days', min: 0, max: 365, integer: true });
      if (daysCheck.error) return { error: daysCheck.error };
    }
  }
  return { ok: true };
};

const computeViolationPolicyDiff = (prevTypes, nextTypes, prevTiers, nextTiers) => {
  const prevMap = new Map(prevTypes.map((t) => [t.code, normalizeStoredTypeItem(t)]));
  const nextMap = new Map(nextTypes.map((t) => [t.code, normalizeStoredTypeItem(t)]));

  const typeChanges = [];
  const summaryLines = [];

  for (const [code, next] of nextMap.entries()) {
    const prev = prevMap.get(code);
    if (!prev) {
      typeChanges.push({ change: 'added', code, name: next.name, after: next });
      summaryLines.push(`Added ${code} (${next.name}): ₱${next.defaultFine.toLocaleString()}, ${next.severity}, ${next.suspensionDays}d`);
      continue;
    }

    const fieldsChanged = [];
    const fieldDiffs = [];
    if (prev.name !== next.name) {
      fieldsChanged.push('name');
      fieldDiffs.push(`name "${prev.name}" → "${next.name}"`);
    }
    if (prev.defaultFine !== next.defaultFine) {
      fieldsChanged.push('defaultFine');
      fieldDiffs.push(`fine ₱${prev.defaultFine.toLocaleString()} → ₱${next.defaultFine.toLocaleString()}`);
    }
    if (prev.suspensionDays !== next.suspensionDays) {
      fieldsChanged.push('suspensionDays');
      fieldDiffs.push(`suspension ${prev.suspensionDays}d → ${next.suspensionDays}d`);
    }
    if (prev.severity !== next.severity) {
      fieldsChanged.push('severity');
      fieldDiffs.push(`severity ${prev.severity} → ${next.severity}`);
    }
    if (prev.isGrave !== next.isGrave) {
      fieldsChanged.push('isGrave');
      fieldDiffs.push(`grave ${prev.isGrave} → ${next.isGrave}`);
    }
    if (prev.isActive !== next.isActive) {
      fieldsChanged.push('isActive');
      fieldDiffs.push(`active ${prev.isActive} → ${next.isActive}`);
    }

    if (fieldsChanged.length > 0) {
      typeChanges.push({
        change: 'updated',
        code,
        name: next.name,
        fieldsChanged,
        before: prev,
        after: next
      });
      summaryLines.push(`${code}: ${fieldDiffs.join(', ')}`);
    }
  }

  for (const [code, prev] of prevMap.entries()) {
    if (!nextMap.has(code)) {
      typeChanges.push({ change: 'removed', code, name: prev.name, before: prev });
      summaryLines.push(`Removed ${code} (${prev.name})`);
    }
  }

  const tierChanges = [];
  for (const tierKey of ['firstOffense', 'secondOffense', 'thirdOffense', 'graveViolation']) {
    const prevTier = prevTiers[tierKey] || {};
    const nextTier = nextTiers[tierKey] || {};
    const changed = {};
    for (const field of Object.keys(nextTier)) {
      if (prevTier[field] !== nextTier[field]) {
        changed[field] = { before: prevTier[field], after: nextTier[field] };
      }
    }
    if (Object.keys(changed).length > 0) {
      tierChanges.push({ tier: tierKey, changes: changed });
      const parts = Object.entries(changed).map(([k, v]) => `${k} ${v.before} → ${v.after}`);
      summaryLines.push(`Tier ${tierKey}: ${parts.join(', ')}`);
    }
  }

  return {
    hasChanges: typeChanges.length > 0 || tierChanges.length > 0,
    typeChanges,
    tierChanges,
    summaryLines
  };
};

// Get system settings (read-only; never mutates existing database settings)
const getSettings = async (req, res) => {
  try {
    const existing = await SystemSettings.findOne().sort({ updatedAt: -1, createdAt: -1 }).lean();

    const settings = existing ? { ...existing } : {
      validityNew: 3,
      validityRenew: 1,
      expiryWarningDays: 30,
      fiscalYear: getCurrentManilaYear(),
      franchiseFee: 500,
      penaltyRate: 50,
      baseFare: 15,
      farePerKm: 2.5,
      maxUnitsPerOperator: 2,
      requiredDocs: ['OR / CR ng Motor', "Driver's License", 'TODA Endorsement', 'Barangay Clearance'],
      maintenanceMode: false,
      maintenanceMessage: DEFAULT_MAINTENANCE_MESSAGE,
      announcementsConfigured: false,
      announcements: DEFAULT_ANNOUNCEMENTS,
      violationPolicy: normalizeViolationPolicyForRead(null)
    };

    settings.fiscalYear = normalizeLegacyFiscalYear(settings.fiscalYear);

    if (settings.maxUnitsPerOperator === undefined || settings.maxUnitsPerOperator === null) {
      settings.maxUnitsPerOperator = 2;
    }

    if (!settings.maintenanceMessage) {
      settings.maintenanceMessage = DEFAULT_MAINTENANCE_MESSAGE;
    }

    settings.announcementsConfigured = Boolean(settings.announcementsConfigured);
    if (settings.announcementsConfigured) {
      settings.announcements = Array.isArray(settings.announcements) ? settings.announcements : [];
    } else if (!settings.announcements || !Array.isArray(settings.announcements)) {
      settings.announcements = DEFAULT_ANNOUNCEMENTS;
    }

    settings.violationPolicy = normalizeViolationPolicyForRead(
      existing ? existing.violationPolicy : null,
      existing?.updatedAt || existing?.createdAt || null
    );

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
    } = req.body || {};

    // 1. Strict fiscalYear validation when supplied
    let validatedFiscalYear;
    if (fiscalYear !== undefined) {
      if (typeof fiscalYear !== 'string' && typeof fiscalYear !== 'number') {
        return res.status(400).json({ success: false, message: FISCAL_YEAR_ERROR_MSG });
      }
      const trimmedFiscalYear = String(fiscalYear).trim();
      if (!isStrictFiscalYear(trimmedFiscalYear)) {
        return res.status(400).json({ success: false, message: FISCAL_YEAR_ERROR_MSG });
      }
      validatedFiscalYear = trimmedFiscalYear;
    }

    // 2. Strict numeric validation for all supplied numeric fields
    const numericValidations = [
      ['validityNew', validityNew, { label: 'New application validity', min: 1, max: 20, integer: true }],
      ['validityRenew', validityRenew, { label: 'Renewal validity', min: 1, max: 20, integer: true }],
      ['expiryWarningDays', expiryWarningDays, { label: 'Expiry warning days', min: 0, max: 365, integer: true }],
      ['franchiseFee', franchiseFee, { label: 'Franchise fee', min: 0, max: 1000000 }],
      ['penaltyRate', penaltyRate, { label: 'Late renewal penalty', min: 0, max: 1000000 }],
      ['baseFare', baseFare, { label: 'Base fare', min: 0, max: 10000 }],
      ['farePerKm', farePerKm, { label: 'Fare per km', min: 0, max: 10000 }],
      ['maxUnitsPerOperator', maxUnitsPerOperator, { label: 'Max units per operator', min: 1, max: 50, integer: true }]
    ];

    const parsedNumerics = {};
    for (const [key, rawValue, opts] of numericValidations) {
      if (rawValue !== undefined) {
        const result = parseStrictNumber(rawValue, opts);
        if (result.error) {
          return res.status(400).json({ success: false, message: result.error });
        }
        parsedNumerics[key] = result.value;
      }
    }

    // 3. Validate requiredDocs when supplied
    let sanitizedRequiredDocs;
    if (requiredDocs !== undefined) {
      if (!Array.isArray(requiredDocs)) {
        return res.status(400).json({ success: false, message: 'Required documents must be an array.' });
      }
      sanitizedRequiredDocs = [];
      const seenDocs = new Set();
      for (const [idx, docItem] of requiredDocs.entries()) {
        if (typeof docItem !== 'string' || !docItem.trim()) {
          return res.status(400).json({
            success: false,
            message: `Required document #${idx + 1} must be a non-empty string.`
          });
        }
        const trimmed = docItem.trim();
        const key = trimmed.toLowerCase();
        if (!seenDocs.has(key)) {
          seenDocs.add(key);
          sanitizedRequiredDocs.push(trimmed);
        }
      }
    }

    // 4. Validate maintenanceMessage when supplied
    let sanitizedMaintenanceMessage;
    if (maintenanceMessage !== undefined) {
      if (typeof maintenanceMessage !== 'string') {
        return res.status(400).json({ success: false, message: 'Maintenance message must be a text string.' });
      }
      sanitizedMaintenanceMessage = maintenanceMessage.trim() || DEFAULT_MAINTENANCE_MESSAGE;
    }

    // 5. Validate violationPolicy when supplied (partial merge of types & tiers independently)
    let incomingSanitizedTypes;
    let hasIncomingTiers = false;
    if (violationPolicy !== undefined) {
      if (!violationPolicy || typeof violationPolicy !== 'object' || Array.isArray(violationPolicy)) {
        return res.status(400).json({ success: false, message: 'Violation policy must be an object.' });
      }
      if (violationPolicy.types !== undefined) {
        const typeValidation = sanitizeIncomingViolationTypes(violationPolicy.types);
        if (typeValidation.error) {
          return res.status(400).json({ success: false, message: typeValidation.error });
        }
        incomingSanitizedTypes = typeValidation.types;
      }
      if (violationPolicy.tiers !== undefined) {
        const tierValidation = validateIncomingTiers(violationPolicy.tiers);
        if (tierValidation.error) {
          return res.status(400).json({ success: false, message: tierValidation.error });
        }
        hasIncomingTiers = true;
      }
    }

    // 6. Validate announcements when supplied
    const sanitizedAnnouncements = [];
    if (announcements !== undefined) {
      if (!Array.isArray(announcements)) {
        return res.status(400).json({ success: false, message: 'Announcements must be an array.' });
      }

      const announcementIds = new Set();
      for (const [index, item] of announcements.entries()) {
        if (!item || typeof item !== 'object' || Array.isArray(item) ||
            typeof item.title !== 'string' || !item.title.trim() ||
            typeof item.desc !== 'string' || !item.desc.trim()) {
          return res.status(400).json({
            success: false,
            message: `Announcement #${index + 1} requires both a title and description.`
          });
        }
        if ((item.type != null && !['alert', 'info', 'event'].includes(item.type)) ||
            (item.date != null && typeof item.date !== 'string') ||
            (item.isActive != null && typeof item.isActive !== 'boolean') ||
            (item._id != null && typeof item._id !== 'string')) {
          return res.status(400).json({ success: false, message: `Announcement #${index + 1} has invalid fields.` });
        }

        const clean = {
          title: item.title.trim(),
          desc: item.desc.trim(),
          type: item.type ?? 'info',
          date: item.date?.trim() || 'General Advisory',
          isActive: item.isActive !== false
        };
        // Draft identifiers are replaced by MongoDB-assigned subdocument IDs.
        const id = item._id?.trim().toLowerCase() || '';
        if (id) {
          if (announcementIds.has(id)) {
            return res.status(400).json({ success: false, message: `Announcement #${index + 1} repeats an announcement ID.` });
          }
          announcementIds.add(id);
          if (mongoose.isObjectIdOrHexString(id)) clean._id = id;
        }
        sanitizedAnnouncements.push(clean);
      }
    }

    let settings = await SystemSettings.findOne().sort({ updatedAt: -1, createdAt: -1 });
    const isNewDoc = !settings;

    if (!settings) {
      settings = new SystemSettings();
    }

    // Self-heal legacy invalid stored fiscalYear ONLY when fiscalYear was omitted in this partial PUT
    if (validatedFiscalYear !== undefined) {
      settings.fiscalYear = validatedFiscalYear;
    } else if (!isStrictFiscalYear(settings.fiscalYear)) {
      settings.fiscalYear = normalizeLegacyFiscalYear(settings.fiscalYear);
    }

    if (parsedNumerics.validityNew !== undefined) settings.validityNew = parsedNumerics.validityNew;
    if (parsedNumerics.validityRenew !== undefined) settings.validityRenew = parsedNumerics.validityRenew;
    if (parsedNumerics.expiryWarningDays !== undefined) settings.expiryWarningDays = parsedNumerics.expiryWarningDays;
    if (parsedNumerics.franchiseFee !== undefined) settings.franchiseFee = parsedNumerics.franchiseFee;
    if (parsedNumerics.penaltyRate !== undefined) settings.penaltyRate = parsedNumerics.penaltyRate;
    if (parsedNumerics.baseFare !== undefined) settings.baseFare = parsedNumerics.baseFare;
    if (parsedNumerics.farePerKm !== undefined) settings.farePerKm = parsedNumerics.farePerKm;
    if (parsedNumerics.maxUnitsPerOperator !== undefined) settings.maxUnitsPerOperator = parsedNumerics.maxUnitsPerOperator;
    if (sanitizedRequiredDocs !== undefined) settings.requiredDocs = sanitizedRequiredDocs;
    if (maintenanceMode !== undefined) settings.maintenanceMode = Boolean(maintenanceMode);
    if (sanitizedMaintenanceMessage !== undefined) settings.maintenanceMessage = sanitizedMaintenanceMessage;

    let policyAuditMetadata = null;
    if (violationPolicy !== undefined) {
      const currentPolicy = normalizeViolationPolicyForRead(
        isNewDoc ? null : settings.violationPolicy,
        settings.updatedAt || settings.createdAt || new Date()
      );
      const prevVersion = currentPolicy.policyVersion;
      const nextTypes = incomingSanitizedTypes !== undefined ? incomingSanitizedTypes : currentPolicy.types;
      const nextTiers = hasIncomingTiers
        ? mergeTiers(currentPolicy.tiers, violationPolicy.tiers)
        : currentPolicy.tiers;

      const diff = computeViolationPolicyDiff(currentPolicy.types, nextTypes, currentPolicy.tiers, nextTiers);
      const nextVersion = diff.hasChanges ? prevVersion + 1 : prevVersion;
      const nextUpdatedAt = diff.hasChanges
        ? new Date()
        : (currentPolicy.policyUpdatedAt || new Date());

      settings.violationPolicy = {
        policyVersion: nextVersion,
        policyUpdatedAt: nextUpdatedAt,
        types: nextTypes,
        tiers: nextTiers
      };
      settings.markModified('violationPolicy');

      if (diff.hasChanges) {
        policyAuditMetadata = {
          previousVersion: prevVersion,
          newVersion: nextVersion,
          policyUpdatedAt: nextUpdatedAt.toISOString(),
          typeChanges: diff.typeChanges,
          tierChanges: diff.tierChanges,
          summaryLines: diff.summaryLines
        };
      }
    }

    if (announcements !== undefined) {
      settings.announcements = sanitizedAnnouncements;
      settings.announcementsConfigured = true;
    }

    await settings.save();

    // Remove any stale older duplicates so there is always a single authoritative record
    await SystemSettings.deleteMany({ _id: { $ne: settings._id } });

    const auditDetails = {
      updatedFields: Object.keys(req.body || {}),
      maintenanceMode: settings.maintenanceMode,
      fiscalYear: settings.fiscalYear
    };
    if (policyAuditMetadata) {
      auditDetails.policyVersionBefore = policyAuditMetadata.previousVersion;
      auditDetails.policyVersionAfter = policyAuditMetadata.newVersion;
      auditDetails.violationPolicyDiff = policyAuditMetadata;
      auditDetails.metadata = { violationPolicyDiff: policyAuditMetadata };
      auditDetails.summary = `Violation Policy v${policyAuditMetadata.previousVersion} → v${policyAuditMetadata.newVersion}: ${policyAuditMetadata.summaryLines.join('; ')}`;
    }

    await logAudit(req, {
      action: 'SYSTEM_SETTINGS_UPDATED',
      targetType: 'SystemSettings',
      targetId: settings._id,
      details: auditDetails
    });

    res.status(200).json({
      success: true,
      message: 'System settings updated successfully',
      data: settings
    });
  } catch (error) {
    if (error?.name === 'ValidationError' || error?.name === 'CastError') {
      const firstError = error?.errors ? Object.values(error.errors)[0]?.message : error?.message;
      return res.status(400).json({
        success: false,
        message: firstError || 'Invalid system settings payload.'
      });
    }
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
          fiscalYear: normalizeLegacyFiscalYear(settings?.fiscalYear)
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
  getSystemHealth,
  DEFAULT_VIOLATION_POLICY,
  normalizeLegacyFiscalYear
};
