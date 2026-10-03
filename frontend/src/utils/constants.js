// Official 25 Barangays of the Municipality of Gasan, Marinduque
export const GASAN_BARANGAYS = [
  "Antipolo",
  "Bachao Ibaba",
  "Bachao Ilaya",
  "Bacong-Bacong",
  "Bahi",
  "Bangbang",
  "Banot",
  "Banuyo",
  "Barangay I (Poblacion)",
  "Barangay II (Poblacion)",
  "Barangay III (Poblacion)",
  "Bognuyan",
  "Cabugao",
  "Dawis",
  "Dili",
  "Libtangin",
  "Mahunig",
  "Mangiliol",
  "Masiga",
  "Matandang Gasan",
  "Pangi",
  "Pinggan",
  "Tabionan",
  "Tapuyan",
  "Tiguion"
];

// Official Barangay to Municipal Zone Mapping
export const BARANGAY_TO_ZONE = {
  // CENTRAL ZONE (Poblacion)
  "Barangay I (Poblacion)": "Central",
  "Barangay II (Poblacion)": "Central",
  "Barangay III (Poblacion)": "Central",

  // NORTH ZONE
  "Bahi": "North",
  "Bangbang": "North",
  "Cabugao": "North",
  "Mangiliol": "North",
  "Masiga": "North",
  "Tapuyan": "North",
  "Tiguion": "North",

  // SOUTH ZONE
  "Antipolo": "South",
  "Bachao Ibaba": "South",
  "Bachao Ilaya": "South",
  "Bacong-Bacong": "South",
  "Banot": "South",
  "Banuyo": "South",
  "Bognuyan": "South",
  "Dawis": "South",
  "Dili": "South",
  "Libtangin": "South",
  "Mahunig": "South",
  "Matandang Gasan": "South",
  "Pangi": "South",
  "Pinggan": "South",
  "Tabionan": "South"
};

// Official 3 Municipal Zones of Gasan
export const GASAN_ZONES = [
  {
    id: "Central",
    name: "Central Zone (Poblacion)",
    label: "Central Zone",
    description: "Poblacion Town Proper Loop",
    terminal: "Gasan Municipal Plaza & Central Market Terminal",
    coverage: "Poblacion town center, municipal hall, public market, schools, and banks loop",
    barangays: [
      "Barangay I (Poblacion)",
      "Barangay II (Poblacion)",
      "Barangay III (Poblacion)"
    ]
  },
  {
    id: "North",
    name: "North Zone",
    label: "North Zone",
    description: "Northern Coastal & Upland Route",
    terminal: "Bangbang Outpost & Northern Crossing Outposts",
    coverage: "Northern highway, agricultural communities, and coastal routes",
    barangays: [
      "Bahi",
      "Bangbang",
      "Cabugao",
      "Mangiliol",
      "Masiga",
      "Tapuyan",
      "Tiguion"
    ]
  },
  {
    id: "South",
    name: "South Zone",
    label: "South Zone",
    description: "Southern Coastal & Interior Route",
    terminal: "Tabionan Junction & Bachao Crossing Terminals",
    coverage: "Southern coastal shoreline, port terminals, and upland farm-to-market roads",
    barangays: [
      "Antipolo",
      "Bachao Ibaba",
      "Bachao Ilaya",
      "Bacong-Bacong",
      "Banot",
      "Banuyo",
      "Bognuyan",
      "Dawis",
      "Dili",
      "Libtangin",
      "Mahunig",
      "Matandang Gasan",
      "Pangi",
      "Pinggan",
      "Tabionan"
    ]
  }
];

// Helper to resolve Zone from Barangay name (handles exact match, case-insensitivity, and aliases)
export const getZoneForBarangay = (barangayName) => {
  if (!barangayName || typeof barangayName !== 'string') return '';
  const clean = barangayName.trim();
  if (BARANGAY_TO_ZONE[clean]) return BARANGAY_TO_ZONE[clean];

  const lower = clean.toLowerCase();
  for (const [b, z] of Object.entries(BARANGAY_TO_ZONE)) {
    if (b.toLowerCase() === lower) return z;
  }

  // Alias checks (from PDF and document OCR research)
  if (lower.includes('uno') || lower === 'brgy. i' || lower === 'brgy i' || lower === 'poblacion') return 'Central';
  if (lower.includes('dos') || lower === 'brgy. ii' || lower === 'brgy ii') return 'Central';
  if (lower.includes('tres') || lower === 'brgy. iii' || lower === 'brgy iii') return 'Central';
  if (lower.includes('bacong')) return 'South';
  if (lower.includes('mat') && lower.includes('gasan')) return 'South';
  if (lower.includes('ping')) return 'South';
  if (lower.includes('bahi')) return 'North';
  if (lower.includes('bangbang')) return 'North';
  if (lower.includes('tabionan')) return 'South';

  return '';
};

// Helper to normalize OCR / user alias input to official Gasan Barangay name
export const normalizeBarangayName = (input) => {
  if (!input || typeof input !== 'string') return '';
  const str = input.trim();
  const lower = str.toLowerCase();

  if (lower.includes('uno') || lower === 'brgy. i' || lower === 'brgy i' || lower === 'barangay i' || lower === 'poblacion') {
    return 'Barangay I (Poblacion)';
  }
  if (lower.includes('dos') || lower === 'brgy. ii' || lower === 'brgy ii' || lower === 'barangay ii') {
    return 'Barangay II (Poblacion)';
  }
  if (lower.includes('tres') || lower === 'brgy. iii' || lower === 'brgy iii' || lower === 'barangay iii') {
    return 'Barangay III (Poblacion)';
  }
  if (lower.includes('bacong')) {
    return 'Bacong-Bacong';
  }
  if (lower.includes('mat') && lower.includes('gasan')) {
    return 'Matandang Gasan';
  }
  if (lower.includes('ping')) {
    return 'Pinggan';
  }
  if (lower.includes('magiliol')) {
    return 'Mangiliol';
  }
  if (lower.includes('bahi')) {
    return 'Bahi';
  }

  const match = GASAN_BARANGAYS.find(b => b.toLowerCase() === lower);
  return match || str;
};

// Helper to normalize legacy or varied zone values (e.g. '1', 'Zone 1') to official zone key
export const normalizeZone = (zone) => {
  if (!zone) return '';
  const z = String(zone).trim().toLowerCase();
  if (z === '1' || z === 'zone 1' || z === 'central' || z === 'central zone' || z.includes('poblacion')) return 'Central';
  if (z === '2' || z === 'zone 2' || z === 'north' || z === 'north zone') return 'North';
  if (z === '3' || z === 'zone 3' || z === 'south' || z === 'south zone') return 'South';
  return String(zone).trim();
};

// Formats zone into official display label (e.g. 'Central Zone (Poblacion)', 'North Zone', 'South Zone')
export const formatZoneLabel = (zone) => {
  if (!zone) return 'N/A';
  const str = String(zone).trim();
  if (!str) return 'N/A';
  const normalized = normalizeZone(str);
  if (normalized === 'Central') return 'Central Zone (Poblacion)';
  if (normalized === 'North') return 'North Zone';
  if (normalized === 'South') return 'South Zone';
  if (str.toLowerCase().includes('zone')) return str;
  if (/^\d+$/.test(str)) return `Zone ${str}`;
  return `${str} Zone`;
};

export const TODA_LIST = [
  "BATODA", "POB TODA", "NBI TODA", "GT TODA", "TIGUION TODA", 
  "BANGBANG IPIL TODA", "TAB TODA", "LUG TODA", "MASIGA TODA", "4B TODA", 
  "CT TODA", "TG TODA", "GC TODA", "MA TODA", "PG TODA", "MAT TODA", 
  "DPAB TODA", "MGN TODA", "GSTODA", "GS TODA", "TTODA", "TC TODA", 
  "NORTH TODA", "GASAN CENTRAL TODA", "BAHI TODA", "ILAYA TODA", "GTF TODA", 
  "NON-TODA"
];

export const CANCEL_REASONS = [
  "Need to correct vehicle or tricycle details",
  "Incomplete requirements / Postponing application",
  "Personal reasons / Attending to other matters",
  "Duplicate or accidental submission",
  "Other reason (Please specify below)"
];

export const VIOLATIONS_LIST = [
  "Overcharging of fare",
  "Refusal to convey passengers",
  "Arrogant/Discourteous behavior",
  "Driving without franchise",
  "Out of line operation",
  "Reckless driving",
  "Other violation"
];

export const MUNICIPAL_SIGNATORY = 'HON. LIDANY A. LAO-BALDO';
