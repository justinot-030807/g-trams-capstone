import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Sparkles, Check, ChevronDown } from 'lucide-react';
import { GASAN_BARANGAYS } from '../../utils/constants';

// Built-in core Philippine locations (instant zero-latency fallback + Marinduque priority)
const MARINDUQUE_LOCATIONS = [
  ...GASAN_BARANGAYS.map((b) => `Brgy. ${b}, Gasan, Marinduque`),
  ...GASAN_BARANGAYS.map((b) => `${b}, Gasan, Marinduque`),
  'Gasan, Marinduque',
  'Boac, Marinduque',
  'Buenavista, Marinduque',
  'Mogpog, Marinduque',
  'Santa Cruz, Marinduque',
  'Torrijos, Marinduque',
  'Cawit, Boac, Marinduque',
  'Santol, Boac, Marinduque',
  'Murallon, Boac, Marinduque',
  'Isok I, Boac, Marinduque',
  'Isok II, Boac, Marinduque',
  'Mercado, Boac, Marinduque',
  'Balanacan, Mogpog, Marinduque',
  'Gitnang Bayan, Mogpog, Marinduque',
  'Bagong Silang, Santa Cruz, Marinduque',
  'Buyabod, Santa Cruz, Marinduque',
  'Malbog, Buenavista, Marinduque',
  'Yook, Buenavista, Marinduque',
  'Poblacion, Torrijos, Marinduque'
];

const NATIONWIDE_CORE_LOCATIONS = [
  // NCR (Metro Manila)
  'City of Manila, Metro Manila',
  'Quezon City, Metro Manila',
  'Makati City, Metro Manila',
  'Taguig City, Metro Manila',
  'Pasig City, Metro Manila',
  'Mandaluyong City, Metro Manila',
  'Pasay City, Metro Manila',
  'Parañaque City, Metro Manila',
  'Las Piñas City, Metro Manila',
  'Muntinlupa City, Metro Manila',
  'Caloocan City, Metro Manila',
  'Marikina City, Metro Manila',
  'Valenzuela City, Metro Manila',
  'Malabon City, Metro Manila',
  'Navotas City, Metro Manila',
  'San Juan City, Metro Manila',
  'Pateros, Metro Manila',
  // MIMAROPA (Region IV-B)
  'Calapan City, Oriental Mindoro',
  'Puerto Galera, Oriental Mindoro',
  'Pinamalayan, Oriental Mindoro',
  'Roxas, Oriental Mindoro',
  'Mamburao, Occidental Mindoro',
  'San Jose, Occidental Mindoro',
  'Sablayan, Occidental Mindoro',
  'Odiongan, Romblon',
  'Romblon, Romblon',
  'Puerto Princesa City, Palawan',
  'El Nido, Palawan',
  'Coron, Palawan',
  // CALABARZON (Region IV-A)
  'Lucena City, Quezon',
  'Tayabas City, Quezon',
  'Sariaya, Quezon',
  'Candelaria, Quezon',
  'Gumaca, Quezon',
  'Calamba City, Laguna',
  'Santa Rosa City, Laguna',
  'Biñan City, Laguna',
  'San Pedro City, Laguna',
  'San Pablo City, Laguna',
  'Los Baños, Laguna',
  'Santa Cruz, Laguna',
  'Batangas City, Batangas',
  'Lipa City, Batangas',
  'Tanauan City, Batangas',
  'Nasugbu, Batangas',
  'Bacoor City, Cavite',
  'Imus City, Cavite',
  'Dasmariñas City, Cavite',
  'General Trias City, Cavite',
  'Tagaytay City, Cavite',
  'Trece Martires City, Cavite',
  'Antipolo City, Rizal',
  'Cainta, Rizal',
  'Taytay, Rizal',
  'Binangonan, Rizal',
  // Luzon Major Cities & Provinces
  'Baguio City, Benguet',
  'Dagupan City, Pangasinan',
  'San Fernando City, La Union',
  'Laoag City, Ilocos Norte',
  'Vigan City, Ilocos Sur',
  'Tuguegarao City, Cagayan',
  'Santiago City, Isabela',
  'Cauayan City, Isabela',
  'Angeles City, Pampanga',
  'San Fernando City, Pampanga',
  'Mabalacat City, Pampanga',
  'Malolos City, Bulacan',
  'Meycauayan City, Bulacan',
  'San Jose del Monte City, Bulacan',
  'Cabanatuan City, Nueva Ecija',
  'Tarlac City, Tarlac',
  'Olongapo City, Zambales',
  'Balanga City, Bataan',
  'Legazpi City, Albay',
  'Naga City, Camarines Sur',
  'Sorsogon City, Sorsogon',
  'Daet, Camarines Norte',
  // Visayas & Mindanao Major Cities
  'Cebu City, Cebu',
  'Mandaue City, Cebu',
  'Lapu-Lapu City, Cebu',
  'Iloilo City, Iloilo',
  'Bacolod City, Negros Occidental',
  'Dumaguete City, Negros Oriental',
  'Tagbilaran City, Bohol',
  'Tacloban City, Leyte',
  'Ormoc City, Leyte',
  'Roxas City, Capiz',
  'Kalibo, Aklan',
  'Catbalogan City, Samar',
  'Davao City, Davao del Sur',
  'Tagum City, Davao del Norte',
  'Cagayan de Oro City, Misamis Oriental',
  'Iligan City, Lanao del Norte',
  'Zamboanga City, Zamboanga del Sur',
  'General Santos City, South Cotabato',
  'Koronadal City, South Cotabato',
  'Butuan City, Agusan del Norte',
  'Surigao City, Surigao del Norte',
  'Cotabato City, Maguindanao del Norte'
];

// Common typo / shorthand auto-correct dictionary
const TYPO_REPLACEMENTS = [
  [/\bpingan\b/gi, 'Pinggan'],
  [/\bbacong\s*bacong\b/gi, 'Bacong-Bacong'],
  [/\bbachao\s*ibaba\b/gi, 'Bachao Ibaba'],
  [/\bbachao\s*ilaya\b/gi, 'Bachao Ilaya'],
  [/\btabyonan\b/gi, 'Tabionan'],
  [/\btigyon\b/gi, 'Tiguion'],
  [/\bbognoyan\b/gi, 'Bognuyan'],
  [/\blibtangen\b/gi, 'Libtangin'],
  [/\bmangilyol\b/gi, 'Mangiliol'],
  [/\bmarinduke\b/gi, 'Marinduque'],
  [/\bmarinduqe\b/gi, 'Marinduque'],
  [/\bgazan\b/gi, 'Gasan'],
  [/\bquezn\b/gi, 'Quezon'],
  [/\bparanaque\b/gi, 'Parañaque'],
  [/\blas\s*pinas\b/gi, 'Las Piñas'],
  [/\bdasmarinas\b/gi, 'Dasmariñas'],
  [/\bbinan\b/gi, 'Biñan'],
  [/\blos\s*banos\b/gi, 'Los Baños'],
  [/\bsta\.?\s*cruz\b/gi, 'Santa Cruz'],
  [/\bsta\.?\s*rosa\b/gi, 'Santa Rosa'],
  [/\bbrgy\.?(?=\s+[A-Za-z])/gi, 'Brgy.']
];

function applyTypoAutoCorrect(rawText) {
  if (!rawText) return '';
  let result = String(rawText);
  for (const [pattern, replacement] of TYPO_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// Compute simple dice-coefficient / token similarity for fuzzy matching
function normalizeForSearch(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getBigrams(str) {
  const s = normalizeForSearch(str);
  const bigrams = new Set();
  for (let i = 0; i < s.length - 1; i += 1) {
    bigrams.add(s.slice(i, i + 2));
  }
  return bigrams;
}

function diceSimilarity(a, b) {
  const bgA = getBigrams(a);
  const bgB = getBigrams(b);
  if (bgA.size === 0 || bgB.size === 0) return 0;
  let intersection = 0;
  bgA.forEach((gram) => {
    if (bgB.has(gram)) intersection += 1;
  });
  return (2 * intersection) / (bgA.size + bgB.size);
}

// Shared nationwide PSGC cache across all instances (free public PSGC API, no API key required)
let psgcLocationsCache = null;
let psgcLoadingPromise = null;

async function loadNationwidePsgcLocations() {
  if (psgcLocationsCache) return psgcLocationsCache;
  if (psgcLoadingPromise) return psgcLoadingPromise;

  psgcLoadingPromise = (async () => {
    try {
      const [provincesRes, citiesRes] = await Promise.all([
        fetch('https://psgc.gitlab.io/api/provinces.json'),
        fetch('https://psgc.gitlab.io/api/cities-municipalities.json')
      ]);

      if (!provincesRes.ok || !citiesRes.ok) {
        psgcLocationsCache = [];
        return psgcLocationsCache;
      }

      const [provinces, cities] = await Promise.all([
        provincesRes.json(),
        citiesRes.json()
      ]);

      const provMap = {};
      if (Array.isArray(provinces)) {
        provinces.forEach((p) => {
          if (p?.code && p?.name) provMap[p.code] = p.name;
        });
      }

      const formatted = [];
      if (Array.isArray(cities)) {
        cities.forEach((c) => {
          if (!c?.name) return;
          const cleanCity = c.name.replace(/^City of\s+/i, '').trim();
          const cityLabel = /^City of/i.test(c.name) ? `${cleanCity} City` : c.name;
          const provName = c.provinceCode && provMap[c.provinceCode] ? provMap[c.provinceCode] : 'Metro Manila';
          formatted.push(`${cityLabel}, ${provName}`);
        });
      }

      psgcLocationsCache = formatted;
      return psgcLocationsCache;
    } catch (_) {
      psgcLocationsCache = [];
      return psgcLocationsCache;
    }
  })();

  return psgcLoadingPromise;
}

const PhilippineAddressAutocomplete = ({
  value = '',
  onChange,
  placeholder = 'e.g., Brgy. Pinggan, Gasan, Marinduque or any PH address',
  className = '',
  disabled = false,
  id,
  name,
  prioritizeGasan = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [psgcList, setPsgcList] = useState(() => psgcLocationsCache || []);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const ensurePsgcLoaded = () => {
    if (!psgcLocationsCache) {
      loadNationwidePsgcLocations().then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setPsgcList(list);
        }
      });
    }
  };

  const allPlaces = useMemo(() => {
    const base = [...MARINDUQUE_LOCATIONS, ...NATIONWIDE_CORE_LOCATIONS, ...psgcList];
    return Array.from(new Set(base));
  }, [psgcList]);

  // Extract optional street/purok/house prefix if the user typed a comma (e.g., "Purok 3, Pingan")
  const { prefixPart, lookupQuery, autoCorrectedValue } = useMemo(() => {
    const raw = String(value || '');
    const corrected = applyTypoAutoCorrect(raw);
    const trimmed = corrected.trim();

    // Check if user typed "Purok 2, ..." or "123 Rizal St., ..."
    const firstCommaIdx = trimmed.indexOf(',');
    if (firstCommaIdx > 0) {
      const firstSegment = trimmed.slice(0, firstCommaIdx).trim();
      const restSegment = trimmed.slice(firstCommaIdx + 1).trim();
      const looksLikeStreetOrPurok = /^(purok|sitio|blk|block|lot|phase|zone|unit|#|\d+)/i.test(firstSegment);
      if (looksLikeStreetOrPurok && restSegment.length > 0) {
        return {
          prefixPart: firstSegment,
          lookupQuery: restSegment,
          autoCorrectedValue: corrected !== raw ? corrected : null
        };
      }
    }

    return {
      prefixPart: '',
      lookupQuery: trimmed,
      autoCorrectedValue: corrected !== raw ? corrected : null
    };
  }, [value]);

  const suggestions = useMemo(() => {
    const qNorm = normalizeForSearch(lookupQuery);
    if (!qNorm) {
      // Default top suggestions when empty/focused
      return (prioritizeGasan ? MARINDUQUE_LOCATIONS.slice(0, 12) : NATIONWIDE_CORE_LOCATIONS.slice(0, 12)).map((loc) => ({
        label: prefixPart ? `${prefixPart}, ${loc}` : loc,
        isGasan: loc.includes('Gasan, Marinduque'),
        isAutoCorrect: false
      }));
    }

    const scored = [];
    for (let i = 0; i < allPlaces.length; i += 1) {
      const place = allPlaces[i];
      const pNorm = normalizeForSearch(place);
      const fullCandidate = prefixPart ? `${prefixPart}, ${place}` : place;

      if (normalizeForSearch(fullCandidate) === normalizeForSearch(value)) {
        continue; // Already exact match
      }

      let score = 0;
      if (pNorm.startsWith(qNorm)) {
        score = 100;
      } else if (pNorm.includes(qNorm)) {
        score = 82;
      } else {
        const qTokens = qNorm.split(' ').filter(Boolean);
        const tokenHits = qTokens.filter((t) => pNorm.includes(t)).length;
        if (tokenHits > 0) {
          score = 55 + (tokenHits / qTokens.length) * 25;
        } else if (qNorm.length >= 3) {
          // Check fuzzy similarity against individual place words
          const placeWords = pNorm.split(' ');
          let bestWordSim = diceSimilarity(qNorm, pNorm);
          for (const pw of placeWords) {
            const sim = diceSimilarity(qNorm, pw);
            if (sim > bestWordSim) bestWordSim = sim;
          }
          if (bestWordSim >= 0.52) {
            score = Math.round(bestWordSim * 75);
          }
        }
      }

      if (score > 0) {
        if (prioritizeGasan && place.includes('Gasan, Marinduque')) score += 12;
        else if (place.includes('Marinduque')) score += 6;

        scored.push({
          label: fullCandidate,
          score,
          isGasan: place.includes('Gasan, Marinduque'),
          isAutoCorrect: score < 80
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    // Deduplicate labels
    const unique = [];
    const seen = new Set();
    for (const item of scored) {
      if (!seen.has(item.label)) {
        seen.add(item.label);
        unique.push(item);
      }
      if (unique.length >= 8) break;
    }

    return unique;
  }, [allPlaces, lookupQuery, prefixPart, prioritizeGasan, value]);

  const handleSelect = (selectedAddress) => {
    if (onChange) {
      onChange(selectedAddress);
    }
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const rawVal = e.target.value;
    // Automatically fix obvious spelling mistakes when user types a space or comma
    if (rawVal.endsWith(' ') || rawVal.endsWith(',')) {
      const corrected = applyTypoAutoCorrect(rawVal);
      onChange(corrected);
    } else {
      onChange(rawVal);
    }
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && isOpen && suggestions[highlightedIndex]) {
      e.preventDefault();
      handleSelect(suggestions[highlightedIndex].label);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleBlur = () => {
    // Apply lightweight spelling auto-correct on blur (e.g., "Pingan, Gasan" -> "Pinggan, Gasan")
    if (value && autoCorrectedValue && autoCorrectedValue !== value) {
      onChange(autoCorrectedValue);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          id={id}
          name={name}
          type="text"
          value={value || ''}
          disabled={disabled}
          onFocus={() => {
            ensurePsgcLoaded();
            setIsOpen(true);
          }}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          autoComplete="off"
          className={`${className} pr-8`}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => {
            ensurePsgcLoaded();
            setIsOpen((prev) => !prev);
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6761] dark:text-[#A8A29E] hover:text-[#9E2A2B] dark:hover:text-[#D4AF37] transition-colors cursor-pointer"
          title="Show Philippine address suggestions"
        >
          <ChevronDown size={14} className={`transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Instant Auto-Correct Hint Pill when a spelling correction or completion is available */}
      {!isOpen && value && suggestions.length > 0 && suggestions[0].isAutoCorrect && (
        <button
          type="button"
          onClick={() => handleSelect(suggestions[0].label)}
          className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
        >
          <Sparkles size={11} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
          <span>Did you mean: <strong className="underline">{suggestions[0].label}</strong>?</span>
        </button>
      )}

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && !disabled && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-[120] bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          <div className="px-3 py-1.5 bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E] flex items-center gap-1">
              <MapPin size={11} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
              <span>Philippine Address Auto-Suggest &amp; Auto-Correct</span>
            </span>
            <span className="text-[10px] font-mono text-[#6B6761] dark:text-[#A8A29E]">
              ↑↓ / Enter
            </span>
          </div>

          <div className="divide-y divide-[#E4E1DC]/60 dark:divide-[#2E2A27]/60">
            {suggestions.map((item, idx) => {
              const isHighlighted = idx === highlightedIndex;
              return (
                <button
                  key={item.label}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent input blur before click registers
                    handleSelect(item.label);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    isHighlighted
                      ? 'bg-[#9E2A2B]/10 dark:bg-[#9E2A2B]/25 text-[#1F1D1B] dark:text-[#F6F5F3]'
                      : 'bg-white dark:bg-[#1C1917] text-[#1F1D1B] dark:text-[#EAE7E1] hover:bg-[#F6F5F3] dark:hover:bg-[#14110F]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin
                      size={13}
                      className={item.isGasan ? 'text-[#9E2A2B] dark:text-[#D4AF37] shrink-0' : 'text-[#6B6761] dark:text-[#A8A29E] shrink-0'}
                    />
                    <span className="font-medium truncate">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.isAutoCorrect && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        Auto-Correct
                      </span>
                    )}
                    {item.isGasan && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 text-[#9E2A2B] dark:text-[#D4AF37]">
                        Gasan LGU
                      </span>
                    )}
                    {isHighlighted && <Check size={12} className="text-[#9E2A2B] dark:text-[#D4AF37]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhilippineAddressAutocomplete;
