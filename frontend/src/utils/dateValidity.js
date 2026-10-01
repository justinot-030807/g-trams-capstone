/**
 * Asia/Manila Timezone-grounded Document Validity Engine
 * Used for Franchises, OR/CR, Driver's License, Cedula, etc.
 */

export const getManilaCurrentDate = () => {
  // Compute Manila date (UTC+8) accurately
  const now = new Date();
  const manilaString = now.toLocaleString("en-US", { timeZone: "Asia/Manila" });
  const manilaDate = new Date(manilaString);
  manilaDate.setHours(0, 0, 0, 0);
  return manilaDate;
};

export const evaluateDocumentValidity = (dateInput) => {
  if (!dateInput) {
    return {
      status: 'missing',
      label: 'No Expiry Set',
      daysLeft: null,
      isExpired: false,
      isExpiringSoon: false,
      badgeColor: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
    };
  }

  const expiryDate = new Date(dateInput);
  if (isNaN(expiryDate.getTime())) {
    return {
      status: 'invalid',
      label: 'Invalid Date',
      daysLeft: null,
      isExpired: false,
      isExpiringSoon: false,
      badgeColor: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
    };
  }

  expiryDate.setHours(0, 0, 0, 0);
  const todayManila = getManilaCurrentDate();

  const diffMs = expiryDate.getTime() - todayManila.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const expiredAgo = Math.abs(diffDays);
    return {
      status: 'expired',
      label: expiredAgo === 0 ? 'Expired Today' : `Expired (${expiredAgo}d ago)`,
      shortLabel: 'Expired',
      daysLeft: diffDays,
      isExpired: true,
      isExpiringSoon: false,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900/60'
    };
  }

  if (diffDays <= 30) {
    return {
      status: 'expiring_soon',
      label: diffDays === 0 ? 'Expires Today' : `Expires in ${diffDays}d`,
      shortLabel: 'Expiring Soon',
      daysLeft: diffDays,
      isExpired: false,
      isExpiringSoon: true,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900/60'
    };
  }

  return {
    status: 'valid',
    label: 'Valid',
    shortLabel: 'Valid',
    daysLeft: diffDays,
    isExpired: false,
    isExpiringSoon: false,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900/60'
  };
};

/**
 * Evaluates whether an application is "Clean" vs "Flagged"
 * Criteria for Clean:
 * 1. All required documents uploaded
 * 2. OR/CR not expired
 * 3. Driver's License not expired
 * 4. OCR verification has no mismatches or wrong document types
 */
export const triageApplication = (app) => {
  const flags = [];
  const isRenewal = app.applicationType === 'Renewal';

  // 1. Check required documents
  const docs = [
    { name: 'OR/CR', url: app.orCrUrl, required: true },
    { name: "License", url: app.licenseUrl, required: true },
    { name: 'Cedula', url: app.cedulaUrl, required: true },
    { name: 'TODA', url: app.todaEndorsementUrl, required: !isRenewal },
    { name: 'Barangay', url: app.brgyClearanceUrl, required: !isRenewal }
  ];

  const totalRequired = docs.filter(d => d.required).length;
  const uploadedRequired = docs.filter(d => d.required && d.url).length;
  const allUploaded = docs.filter(d => d.url).length;
  const isDocsComplete = uploadedRequired === totalRequired;

  if (!isDocsComplete) {
    const missingNames = docs.filter(d => d.required && !d.url).map(d => d.name);
    flags.push({
      type: 'missing_docs',
      label: `Missing: ${missingNames.join(', ')}`,
      severity: 'error'
    });
  }

  // 2. OR/CR Expiry
  if (app.orCrExpiryDate) {
    const orCrVal = evaluateDocumentValidity(app.orCrExpiryDate);
    if (orCrVal.isExpired) {
      flags.push({ type: 'expired_orcr', label: 'OR/CR Expired', severity: 'error' });
    } else if (orCrVal.isExpiringSoon) {
      flags.push({ type: 'expiring_orcr', label: `OR/CR ${orCrVal.label}`, severity: 'warning' });
    }
  }

  // 3. Driver License Expiry
  if (app.driverLicenseExpiryDate) {
    const licVal = evaluateDocumentValidity(app.driverLicenseExpiryDate);
    if (licVal.isExpired) {
      flags.push({ type: 'expired_license', label: 'License Expired', severity: 'error' });
    } else if (licVal.isExpiringSoon) {
      flags.push({ type: 'expiring_license', label: `License ${licVal.label}`, severity: 'warning' });
    }
  }

  // 4. OCR Verification Flag
  if (app.aiVerification) {
    if (app.aiVerification.status === 'flagged' || (app.aiVerification.summary?.mismatchedFields || 0) > 0) {
      flags.push({
        type: 'ocr_discrepancy',
        label: `OCR Discrepancy (${app.aiVerification.summary?.mismatchedFields || 1})`,
        severity: 'error'
      });
    }
  }

  // 5. Re-submitted / Corrected Flag
  if (app.isResubmitted) {
    flags.push({
      type: 'resubmitted',
      label: 'Corrected & Re-submitted',
      severity: 'info'
    });
  }

  const isClean = isDocsComplete && !flags.some(f => f.severity === 'error');

  return {
    isClean,
    flags,
    docsSummary: `${allUploaded}/${docs.length}`,
    isDocsComplete
  };
};

/**
 * Calculates human waiting time (e.g., "2h", "1d", "5d", "3w")
 */
export const getTimeWaiting = (dateStr) => {
  if (!dateStr) return '—';
  const applied = new Date(dateStr);
  if (isNaN(applied.getTime())) return '—';
  const now = new Date();
  const diffMs = now.getTime() - applied.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return '<1h';
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}w`;
};
