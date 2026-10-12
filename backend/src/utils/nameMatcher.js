/**
 * Intelligent Name Matching Utility for G-TRAMS
 * Handles Filipino naming conventions (Inverted Lastname, Firstname vs Firstname Lastname),
 * middle initials, compound surnames (e.g., Dela Cruz, San Juan), and prevents false substring collisions.
 */

const SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'v']);
const TITLES = new Set(['mr', 'ms', 'mrs', 'dr', 'atty', 'engr']);

/**
 * Extracts normalized tokens from a person's full name.
 * @param {string} rawName 
 * @returns {string[]} array of clean tokens
 */
function extractNameTokens(rawName) {
    if (!rawName || typeof rawName !== 'string') return [];

    // Normalize 'Ma.' / 'Ma ' abbreviation common in the Philippines
    let normalized = rawName
        .toLowerCase()
        .replace(/\bma\.\s*/g, 'maria ')
        .replace(/\bma\s+/g, 'maria ')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const words = normalized.split(' ').filter(Boolean);
    const tokens = [];

    for (const w of words) {
        if (TITLES.has(w)) continue;
        // Keep suffixes for context if needed, but treat them separately
        if (SUFFIXES.has(w)) continue;
        // Skip single-letter initials (middle initials like 'A', 'B')
        if (w.length <= 1) continue;
        tokens.push(w);
    }

    return tokens;
}

/**
 * Compares two names and returns true if they represent the same person.
 * @param {string} nameA 
 * @param {string} nameB 
 * @param {number} threshold Default 0.6 (60% token overlap)
 * @returns {boolean}
 */
function isNameMatch(nameA, nameB, threshold = 0.6) {
    if (!nameA || !nameB) return false;

    const strA = String(nameA).trim().toLowerCase();
    const strB = String(nameB).trim().toLowerCase();

    // Direct match (ignoring extra spaces and punctuation)
    if (strA === strB) return true;

    const tokensA = extractNameTokens(nameA);
    const tokensB = extractNameTokens(nameB);

    if (tokensA.length === 0 || tokensB.length === 0) {
        // Fallback for single-character or ultra-short names
        const cleanA = strA.replace(/[^a-z]/g, '');
        const cleanB = strB.replace(/[^a-z]/g, '');
        return cleanA.length >= 3 && cleanB.length >= 3 && cleanA === cleanB;
    }

    // Single token on both sides
    if (tokensA.length === 1 && tokensB.length === 1) {
        return tokensA[0] === tokensB[0];
    }

    // Count matching tokens
    const setB = new Set(tokensB);
    const setA = new Set(tokensA);

    let commonCount = 0;
    for (const t of setA) {
        if (setB.has(t)) {
            commonCount++;
        }
    }

    // If both share at least 2 significant tokens (e.g., Given Name + Surname):
    if (commonCount >= 2) {
        return true;
    }

    // Jaccard similarity
    const unionSize = new Set([...tokensA, ...tokensB]).size;
    const similarity = unionSize > 0 ? commonCount / unionSize : 0;

    // Coverage of the shorter name
    const minLen = Math.min(tokensA.length, tokensB.length);
    const coverage = minLen > 0 ? commonCount / minLen : 0;

    return similarity >= threshold || (coverage >= 0.8 && commonCount >= 1 && minLen <= 2);
}

module.exports = {
    extractNameTokens,
    isNameMatch
};
