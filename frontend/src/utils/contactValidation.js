/**
 * Shared contact input sanitization & Philippine mobile validation helpers.
 * - Dedicated mobile fields: digits-only, strictly capped at 11 digits (09XXXXXXXXX).
 * - Dual Email-or-Mobile fields: caps numeric-only entries cleanly at 11 digits
 *   while allowing email addresses up to 60 characters.
 */

export const sanitizeMobileInput = (value) =>
  String(value ?? '').replace(/\D/g, '').slice(0, 11);

export const normalizePhMobile = (value) => {
  const clean = String(value ?? '').trim().replace(/[\s\-()]/g, '');
  if (/^\+639\d{9}$/.test(clean)) return '0' + clean.slice(3);
  if (/^639\d{9}$/.test(clean)) return '0' + clean.slice(2);
  return clean.replace(/\D/g, '').slice(0, 11);
};

export const sanitizeDualContactInput = (value, maxEmailLength = 60) => {
  const raw = String(value ?? '');
  if (!raw) return '';

  // If the user enters '@' or any ASCII letter, treat as an email address
  if (/[a-zA-Z@]/.test(raw)) {
    return raw.slice(0, maxEmailLength);
  }

  // Handle incremental '+63' entry and normalize '+639...' to 11-digit '09...'
  const compact = raw.replace(/[\s\-()]/g, '');
  if (/^\+6?3?$/.test(compact)) {
    return compact;
  }
  if (/^\+63/.test(compact)) {
    const digits = compact.slice(3).replace(/\D/g, '');
    return ('0' + digits).slice(0, 11);
  }

  // Purely numeric or phone-formatted entry: cap cleanly at 11 digits
  if (/^[\d\s\-()+]+$/.test(raw)) {
    return raw.replace(/\D/g, '').slice(0, 11);
  }

  return raw.slice(0, maxEmailLength);
};

export const isValidPhMobile = (value) =>
  /^09\d{9}$/.test(String(value ?? '').trim());
