/**
 * Utility functions for Google Authentication and Contact Validation
 */

export const decodeJwtPayload = (token) => {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const getStringProp = (obj, prop) => {
  if (!obj || typeof obj !== 'object') return '';
  const val = obj[prop];
  return typeof val === 'string' ? val : '';
};

export const unwrapGoogleProfile = (raw) => {
  if (!raw) return null;

  const rawObj = (raw && typeof raw === 'object') ? raw : null;

  let jwtData = null;
  if (typeof raw === 'string' && raw.includes('.')) {
    jwtData = decodeJwtPayload(raw);
  } else if (rawObj) {
    const credCandidate = rawObj.credential || rawObj.idToken || (typeof rawObj.token === 'string' && rawObj.token.includes('.') ? rawObj.token : null);
    if (typeof credCandidate === 'string') {
      jwtData = decodeJwtPayload(credCandidate);
    }
  }

  const p = rawObj ? (
    (typeof rawObj.googleProfile === 'object' && rawObj.googleProfile) ||
    (typeof rawObj.profile === 'object' && rawObj.profile) ||
    (typeof rawObj.user === 'object' && rawObj.user) ||
    (typeof rawObj.data?.googleProfile === 'object' && rawObj.data.googleProfile) ||
    (typeof rawObj.data === 'object' && rawObj.data) ||
    rawObj
  ) : null;

  if (!jwtData && p && typeof p === 'object') {
    const nestedCred = p.credential || p.idToken || (typeof p.token === 'string' && p.token.includes('.') ? p.token : null);
    if (typeof nestedCred === 'string') {
      jwtData = decodeJwtPayload(nestedCred);
    }
  }

  const email = (
    getStringProp(p, 'email') ||
    getStringProp(p, 'mail') ||
    getStringProp(p, 'emailAddress') ||
    getStringProp(p, 'userEmail') ||
    getStringProp(rawObj, 'email') ||
    getStringProp(jwtData, 'email') ||
    getStringProp(jwtData, 'mail') ||
    getStringProp(jwtData, 'upn') ||
    getStringProp(jwtData, 'preferred_username')
  ).trim().toLowerCase();

  const name = (
    getStringProp(p, 'name') ||
    getStringProp(p, 'fullName') ||
    getStringProp(rawObj, 'name') ||
    getStringProp(rawObj, 'fullName') ||
    getStringProp(jwtData, 'name') ||
    (jwtData && getStringProp(jwtData, 'given_name') ? `${jwtData.given_name} ${getStringProp(jwtData, 'family_name')}`.trim() : '')
  ).trim();

  const picture = (
    getStringProp(p, 'picture') ||
    getStringProp(p, 'photo') ||
    getStringProp(p, 'avatar') ||
    getStringProp(rawObj, 'picture') ||
    getStringProp(jwtData, 'picture')
  ).trim();

  const googleId = (
    getStringProp(p, 'googleId') ||
    getStringProp(p, 'sub') ||
    getStringProp(p, 'id') ||
    getStringProp(rawObj, 'googleId') ||
    getStringProp(jwtData, 'sub') ||
    getStringProp(jwtData, 'id')
  ).trim();

  const credential = (rawObj && (rawObj.credential || rawObj.idToken)) || (typeof raw === 'string' && raw.includes('.') ? raw : '') || (p && (p.credential || p.idToken)) || '';
  const accessToken = (rawObj && (rawObj.accessToken || rawObj.access_token)) || (p && (p.accessToken || p.access_token)) || '';

  return { 
    email, 
    name, 
    picture, 
    googleId, 
    credential: credential || undefined, 
    idToken: credential || undefined, 
    accessToken: accessToken || undefined 
  };
};

export const isValidContact = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^(09|\+639|639)\d{9}$/;
  return emailRegex.test(trimmed) || phoneRegex.test(trimmed.replace(/[\s\-()]/g, ''));
};
