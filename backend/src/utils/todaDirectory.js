/**
 * G-TRAMS TODA Directory & Municipal Jurisdiction Authority (Backend)
 * Synchronized with municipal zoning and Gasan Tricycle Franchising Ordinance.
 */

const TODA_DIRECTORY = [
    {
        id: 'BATODA',
        name: 'BATODA (Bachao TODA)',
        zone: 'South',
        barangays: ['Bachao Ibaba', 'Bachao Ilaya', 'Antipolo', 'Barangay I (Poblacion)']
    },
    {
        id: 'POB TODA',
        name: 'POB TODA (Poblacion Central)',
        zone: 'Central',
        barangays: ['Barangay I (Poblacion)', 'Barangay II (Poblacion)', 'Barangay III (Poblacion)']
    },
    {
        id: 'GT TODA',
        name: 'GT TODA (Gasan-Tapuyan)',
        zone: 'North',
        barangays: ['Tapuyan', 'Dili', 'Libtangin', 'Barangay II (Poblacion)']
    },
    {
        id: 'LUG TODA',
        name: 'LUG TODA (Libtangin Transport)',
        zone: 'South',
        barangays: ['Libtangin', 'Dili']
    },
    {
        id: 'NBI TODA',
        name: 'NBI TODA (North Bay Interstate)',
        zone: 'South',
        barangays: ['Bognuyan', 'Cabugao', 'Dawis', 'Mangiliol']
    },
    {
        id: 'BANGBANG IPIL TODA',
        name: 'BANGBANG IPIL TODA',
        zone: 'North',
        barangays: ['Bangbang', 'Banot', 'Banuyo', 'Pangi']
    },
    {
        id: 'TAB TODA',
        name: 'TAB TODA (Tabionan Transport)',
        zone: 'South',
        barangays: ['Tabionan', 'Tiguion', 'Masiga', 'Matandang Gasan']
    },
    {
        id: 'TIGUION TODA',
        name: 'TIGUION TODA',
        zone: 'North',
        barangays: ['Tiguion']
    },
    {
        id: 'MASIGA TODA',
        name: 'MASIGA TODA',
        zone: 'North',
        barangays: ['Masiga']
    },
    {
        id: 'MAT TODA',
        name: 'MAT TODA (Matandang Gasan)',
        zone: 'South',
        barangays: ['Matandang Gasan']
    },
    {
        id: 'PG TODA',
        name: 'PG TODA (Pinggan)',
        zone: 'South',
        barangays: ['Pinggan']
    },
    {
        id: '4B TODA',
        name: '4B TODA',
        zone: 'North',
        barangays: ['Bahi', 'Bangbang', 'Banot', 'Banuyo']
    },
    {
        id: 'DPAB TODA',
        name: 'DPAB TODA',
        zone: 'South',
        barangays: ['Dawis', 'Pangi', 'Antipolo', 'Bognuyan']
    },
    {
        id: 'ILAYA TODA',
        name: 'ILAYA TODA',
        zone: 'South',
        barangays: ['Bachao Ilaya']
    },
    {
        id: 'GASAN CENTRAL TODA',
        name: 'GASAN CENTRAL TODA',
        zone: 'Central',
        barangays: ['Barangay I (Poblacion)', 'Barangay II (Poblacion)', 'Barangay III (Poblacion)', 'Mahunig']
    },
    {
        id: 'BAHI TODA',
        name: 'BAHI TODA',
        zone: 'North',
        barangays: ['Bahi', 'Pinggan', 'Bacong-Bacong']
    },
    {
        id: 'NON-TODA',
        name: 'NON-TODA (Independent Franchise)',
        zone: 'All Authorized Municipal Routes',
        barangays: ['All Gasan Barangays']
    }
];

/**
 * Finds all TODAs whose official routes service the given barangay.
 * @param {string} barangayName 
 * @returns {string[]} array of TODA ids
 */
function getTodasForBarangay(barangayName) {
    if (!barangayName || typeof barangayName !== 'string') return [];
    const clean = barangayName.trim().toLowerCase();

    const matches = TODA_DIRECTORY.filter(t => 
        t.id !== 'NON-TODA' && 
        Array.isArray(t.barangays) && 
        t.barangays.some(b => clean.includes(b.toLowerCase()) || b.toLowerCase().includes(clean))
    ).map(t => t.id);

    return matches;
}

/**
 * Validates whether a TODA is authorized to operate in the given applicant's barangay/address.
 * @param {string} todaName 
 * @param {string} barangayOrAddress 
 * @returns {{ isMatch: boolean, authorizedBarangays: string[], todaInfo: object|null, warning: string|null }}
 */
function validateTodaJurisdiction(todaName, barangayOrAddress) {
    if (!todaName || todaName === 'NON-TODA') {
        return { isMatch: true, authorizedBarangays: ['All Gasan Barangays'], todaInfo: null, warning: null };
    }

    const cleanToda = String(todaName).trim().toUpperCase();
    const entry = TODA_DIRECTORY.find(t => 
        t.id.toUpperCase() === cleanToda || 
        t.name.toUpperCase().includes(cleanToda) || 
        cleanToda.includes(t.id.toUpperCase())
    );

    if (!entry) {
        // Unknown or custom TODA
        return { isMatch: true, authorizedBarangays: [], todaInfo: null, warning: null };
    }

    if (!barangayOrAddress) {
        return { isMatch: true, authorizedBarangays: entry.barangays, todaInfo: entry, warning: null };
    }

    const cleanAddr = String(barangayOrAddress).trim().toLowerCase();
    const isDirectMatch = entry.barangays.some(b => 
        cleanAddr.includes(b.toLowerCase()) || b.toLowerCase().includes(cleanAddr)
    );

    if (isDirectMatch) {
        return {
            isMatch: true,
            authorizedBarangays: entry.barangays,
            todaInfo: entry,
            warning: null
        };
    }

    return {
        isMatch: false,
        authorizedBarangays: entry.barangays,
        todaInfo: entry,
        warning: `Barangay "${barangayOrAddress}" is outside the official operational routes of ${entry.id}. Authorized barangays: ${entry.barangays.join(', ')}.`
    };
}

module.exports = {
    TODA_DIRECTORY,
    getTodasForBarangay,
    validateTodaJurisdiction
};
