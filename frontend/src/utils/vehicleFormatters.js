/**
 * Shared sanitizers and formatters for vehicle fields and LGU roles.
 * Prevents literal "undefined", "null", or "NaN" strings from ever rendering in the UI or printable templates.
 */

export function cleanText(val, fallback = '') {
  if (val === null || val === undefined) return fallback;
  const cleaned = String(val)
    .replace(/\bundefined\b/gi, '')
    .replace(/\bnull\b/gi, '')
    .replace(/\bNaN\b/g, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return cleaned || fallback;
}

export function formatVehicleMake(unit, fallback = 'Tricycle') {
  if (!unit) return fallback;
  const rawMake = cleanText(
    unit.make || unit.vehicleMake || unit.aiScannedData?.orCr?.make,
    ''
  );
  const rawSeries = cleanText(
    unit.series || unit.aiScannedData?.orCr?.series,
    ''
  );
  if (rawMake && rawSeries && !rawMake.toUpperCase().includes(rawSeries.toUpperCase())) {
    return `${rawMake} ${rawSeries}`.trim();
  }
  return rawMake || rawSeries || fallback;
}

export function formatVehicleModelYear(unit, fallback = '—') {
  if (!unit) return fallback;
  const rawYear = cleanText(
    unit.made || unit.yearModel || unit.model || unit.aiScannedData?.orCr?.yearModel || unit.aiScannedData?.orCr?.year,
    ''
  );
  return rawYear || fallback;
}

export function formatVehicleMakeAndModel(unit, fallback = 'Tricycle Unit') {
  if (!unit) return fallback;
  const make = formatVehicleMake(unit, '');
  const year = formatVehicleModelYear(unit, '');
  if (make && year && year !== '—' && year !== 'N/A') {
    if (make.includes(year)) return make;
    return `${make} (${year})`;
  }
  if (make) return make;
  if (year && year !== '—' && year !== 'N/A') return `Model ${year}`;
  return fallback;
}

export function formatRoleDisplayName(role) {
  const normalized = String(role || '')
    .toLowerCase()
    .trim()
    .replace(/_/g, ' ');
  if (normalized === 'bplo staff' || normalized === 'llsa i' || normalized === 'llsa 1') {
    return 'LLSA I (Local Legislative Staff Assistant I)';
  }
  if (normalized === 'system admin' || normalized === 'admin' || normalized === 'administrator') {
    return 'System Administrator';
  }
  if (normalized === 'toda president') {
    return 'TODA President';
  }
  if (normalized === 'cashier' || normalized === 'municipal cashier') {
    return 'Municipal Cashier';
  }
  if (normalized === 'operator' || normalized === 'tricycle operator') {
    return 'Tricycle Operator';
  }
  return cleanText(role, 'System User');
}
