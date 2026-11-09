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
  const onboardingToken = (rawObj && rawObj.onboardingToken) || (p && p.onboardingToken) || '';

  return { 
    email, 
    name, 
    picture, 
    googleId, 
    credential: credential || undefined, 
    idToken: credential || undefined, 
    accessToken: accessToken || undefined,
    onboardingToken: onboardingToken || undefined
  };
};

export const DEFAULT_GOOGLE_CLIENT_ID = '371606618285-og7vq7cn9gb0kpacq171fhf1jclvlhgq.apps.googleusercontent.com';

let preferredApiOrigin = null;

export const getCandidateBaseUrls = () => {
  const primary = String(import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
  const isLocal = primary.includes('localhost') || primary.includes('127.0.0.1');
  if (isLocal) {
    return [primary];
  }
  const candidates = [
    preferredApiOrigin,
    primary,
    'https://g-trams-web2.onrender.com',
    'https://gtrams-backend.justinelachica114.workers.dev'
  ].filter(Boolean);
  return [...new Set(candidates)];
};

/**
 * Resilient fetch wrapper that handles Render cold-start hibernation (429 text/plain),
 * shared proxy 429 rate-limits on workers.dev, and gateway cold-start (502/503/504).
 */
export const resilientApiFetch = async (path, options = {}, maxAttempts = 3) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrls = getCandidateBaseUrls();
  let lastError = null;
  let lastResponse = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const baseUrl = baseUrls[attempt % baseUrls.length];
    const url = `${baseUrl}${cleanPath}`;
    try {
      const res = await fetch(url, options);
      lastResponse = res;

      const isRateLimited429 = res.status === 429;
      const isBadGateway = res.status === 502 || res.status === 503 || res.status === 504;

      if ((isRateLimited429 || isBadGateway) && attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 600 * (attempt + 1)));
        continue;
      }

      if (res.ok && !baseUrl.includes('localhost')) {
        preferredApiOrigin = baseUrl;
      }

      return res;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 700 * (attempt + 1)));
      }
    }
  }

  if (lastResponse) return lastResponse;
  throw lastError || new Error('Unable to connect to the server.');
};

/**
 * Installs a global window.fetch interceptor so any direct fetch(`${VITE_API_URL}/api/v1/...`)
 * automatically falls back from workers.dev to g-trams-web2.onrender.com on HTTP 429 / 502 / 503 / 504 or network failure.
 */
export const installGlobalApiFetchInterceptor = () => {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function' || window.__gtramsFetchInstalled) {
    return;
  }
  window.__gtramsFetchInstalled = true;
  const nativeFetch = window.fetch.bind(window);

  const PROD_ORIGINS = [
    'https://gtrams-backend.justinelachica114.workers.dev',
    'https://g-trams-web2.onrender.com'
  ];

  window.fetch = async (input, init) => {
    const rawUrl = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');
    const matchedOrigin = PROD_ORIGINS.find(origin => rawUrl.startsWith(origin));

    if (!matchedOrigin || typeof input !== 'string') {
      return nativeFetch(input, init);
    }

    const pathAndQuery = rawUrl.slice(matchedOrigin.length);
    const firstOrigin = preferredApiOrigin && PROD_ORIGINS.includes(preferredApiOrigin)
      ? preferredApiOrigin
      : matchedOrigin;
    const fallbackOrigin = PROD_ORIGINS.find(o => o !== firstOrigin) || firstOrigin;

    try {
      const res = await nativeFetch(`${firstOrigin}${pathAndQuery}`, init);
      if ((res.status === 429 || res.status === 502 || res.status === 503 || res.status === 504) && fallbackOrigin !== firstOrigin) {
        const retryRes = await nativeFetch(`${fallbackOrigin}${pathAndQuery}`, init);
        if (retryRes.ok || retryRes.status !== 429) {
          preferredApiOrigin = fallbackOrigin;
          return retryRes;
        }
      }
      return res;
    } catch (err) {
      if (fallbackOrigin !== firstOrigin) {
        const retryRes = await nativeFetch(`${fallbackOrigin}${pathAndQuery}`, init);
        preferredApiOrigin = fallbackOrigin;
        return retryRes;
      }
      throw err;
    }
  };
};

export const isValidContact = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^(09|\+639|639)\d{9}$/;
  return emailRegex.test(trimmed) || phoneRegex.test(trimmed.replace(/[\s\-()]/g, ''));
};
