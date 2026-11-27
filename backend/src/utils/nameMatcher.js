/**
 * Strict Philippine Name Matching Utility for G-TRAMS
 * Handles Filipino naming conventions (Inverted "SURNAME, GIVEN M." vs natural "Given M. Surname"),
 * diacritics (Peña == Pena), titles/suffixes (Jr., Sr., III), Ma. -> Maria,
 * compound PH surnames (Dela Cruz, De La Cruz, San Juan, Sta. Maria, etc.),
 * and optional omitted middle name/initial while strictly blocking missing surnames
 * and any misspelled or unmatched applicant tokens.
 */

const SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'v']);
const TITLES = new Set(['mr', 'ms', 'mrs', 'dr', 'atty', 'engr']);
const COMPOUND_PARTICLES = new Set([
    'de',
    'del',
    'dela',
    'delos',
    'delas',
    'san',
    'santa',
    'santo',
    'sto',
    'sta'
]);

function normalizeSegment(raw) {
    return String(raw || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\bma\.(?=\s|$)/g, 'maria ')
        .replace(/\bma(?=\s+[a-z])/g, 'maria')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\bde\s+la\b/g, 'dela')
        .replace(/\bde\s+los\b/g, 'delos')
        .replace(/\bde\s+las\b/g, 'delas')
        .replace(/\s+/g, ' ')
        .trim();
}

function segmentToFullTokens(raw) {
    const cleaned = normalizeSegment(raw);
    if (!cleaned) return [];

    const words = cleaned.split(' ').filter(Boolean);
    const tokens = [];

    for (const w of words) {
        if (TITLES.has(w)) continue;
        if (SUFFIXES.has(w)) continue;
        // Skip single-letter initials (middle initials like 'A', 'M')
        if (w.length <= 1) continue;
        tokens.push(w);
    }

    return tokens;
}

function segmentHasOnlySuffixes(raw) {
    const cleaned = normalizeSegment(raw);
    if (!cleaned) return true;
    const words = cleaned.split(' ').filter(Boolean);
    return words.length > 0 && words.every((w) => SUFFIXES.has(w));
}

/**
 * Extracts normalized non-initial full-word tokens from a person's full name.
 * @param {string} rawName
 * @returns {string[]} array of clean tokens
 */
function extractNameTokens(rawName) {
    if (!rawName || typeof rawName !== 'string') return [];
    return segmentToFullTokens(rawName);
}

/**
 * Parses a Philippine personal name into structured given/middle and surname tokens.
 * Supports comma-inverted ("DELA CRUZ, JUAN M.") and natural ("Juan M. Dela Cruz") formats.
 * @param {string} rawName
 * @returns {{ isInverted: boolean, givenTokens: string[], surnameTokens: string[], fullTokens: string[] }}
 */
function parsePhilippineName(rawName) {
    if (!rawName || typeof rawName !== 'string') {
        return { isInverted: false, givenTokens: [], surnameTokens: [], fullTokens: [] };
    }

    const commaParts = rawName.split(',').map((p) => p.trim()).filter(Boolean);
    const isCommaInverted =
        commaParts.length >= 2 &&
        !segmentHasOnlySuffixes(commaParts.slice(1).join(' '));

    if (isCommaInverted) {
        const surnameTokens = segmentToFullTokens(commaParts[0]);
        const givenTokens = segmentToFullTokens(commaParts.slice(1).join(' '));
        return {
            isInverted: true,
            givenTokens,
            surnameTokens,
            fullTokens: [...givenTokens, ...surnameTokens]
        };
    }

    const fullTokens = segmentToFullTokens(rawName);
    if (fullTokens.length < 2) {
        return {
            isInverted: false,
            givenTokens: fullTokens,
            surnameTokens: [],
            fullTokens
        };
    }

    // Absorb leading compound surname particles while keeping at least 1 given-name token
    let splitIdx = fullTokens.length - 1;
    while (splitIdx > 1 && COMPOUND_PARTICLES.has(fullTokens[splitIdx - 1])) {
        splitIdx -= 1;
    }

    const givenTokens = fullTokens.slice(0, splitIdx);
    const surnameTokens = fullTokens.slice(splitIdx);

    return {
        isInverted: false,
        givenTokens,
        surnameTokens,
        fullTokens
    };
}

function arraysEqual(arrA, arrB) {
    if (arrA.length !== arrB.length) return false;
    for (let i = 0; i < arrA.length; i++) {
        if (arrA[i] !== arrB[i]) return false;
    }
    return true;
}

function endsWithTokens(fullTokens, suffixTokens) {
    if (suffixTokens.length === 0 || fullTokens.length <= suffixTokens.length) return false;
    const offset = fullTokens.length - suffixTokens.length;
    for (let i = 0; i < suffixTokens.length; i++) {
        if (fullTokens[offset + i] !== suffixTokens[i]) return false;
    }
    return true;
}

function isOrderedSubsequence(needle, haystack) {
    if (needle.length === 0 || needle.length > haystack.length) return false;
    let hi = 0;
    for (let ni = 0; ni < needle.length; ni++) {
        while (hi < haystack.length && haystack[hi] !== needle[ni]) {
            hi++;
        }
        if (hi >= haystack.length) return false;
        hi++;
    }
    return true;
}

/**
 * Strictly compares an applicant/input name (nameA) against an official/roster name (nameB).
 * Requires >= 2 non-initial full words on both sides, exact first-name & full-surname match,
 * and 100% exact token match for all applicant non-initial tokens (zero typos allowed).
 * @param {string} nameA Applicant / input name
 * @param {string} nameB Official / roster name
 * @returns {boolean}
 */
function isNameMatch(nameA, nameB) {
    if (!nameA || !nameB) return false;

    const a = parsePhilippineName(String(nameA));
    const b = parsePhilippineName(String(nameB));

    if (a.fullTokens.length < 2 || b.fullTokens.length < 2) {
        return false;
    }

    let aGiven = a.givenTokens;
    let aSurname = a.surnameTokens;
    let bGiven = b.givenTokens;
    let bSurname = b.surnameTokens;

    // Align multi-word non-particle surnames when one side is comma-inverted
    if (b.isInverted && !a.isInverted && bSurname.length > 1 && endsWithTokens(a.fullTokens, bSurname)) {
        aSurname = bSurname;
        aGiven = a.fullTokens.slice(0, a.fullTokens.length - bSurname.length);
    } else if (a.isInverted && !b.isInverted && aSurname.length > 1 && endsWithTokens(b.fullTokens, aSurname)) {
        bSurname = aSurname;
        bGiven = b.fullTokens.slice(0, b.fullTokens.length - aSurname.length);
    }

    if (aGiven.length === 0 || bGiven.length === 0 || aSurname.length === 0 || bSurname.length === 0) {
        return false;
    }

    if (!arraysEqual(aSurname, bSurname)) {
        return false;
    }

    if (aGiven[0] !== bGiven[0]) {
        return false;
    }

    // 100% of applicant's non-initial given/middle tokens must exist in roster record in order
    return isOrderedSubsequence(aGiven, bGiven);
}

module.exports = {
    extractNameTokens,
    parsePhilippineName,
    isNameMatch
};
