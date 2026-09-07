import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, AlertTriangle, ShieldCheck, Info, Compass, Layers, 
  Navigation, CheckCircle2, ChevronRight, Eye, RefreshCw 
} from 'lucide-react';

// Gasan Coordinates & Route Definitions
const GASAN_CENTER = [13.3197, 121.8497];

const TRP_DATA = {
  terminals: [
    {
      id: 'pob',
      name: 'Gasan Municipal Plaza / Central Terminal',
      toda: 'POB TODA & GASAN CENTRAL',
      zone: 'Zone 1 (Poblacion Central Loop)',
      coords: [13.3197, 121.8497],
      color: '#059669', // Emerald
      barangays: 'Barangay I, II, III (Poblacion)',
      details: 'Town center internal loop connecting market, schools, banks, municipal hall, and churches.'
    },
    {
      id: 'bachao',
      name: 'Bachao Ibaba Junction Terminal',
      toda: 'BATODA',
      zone: 'Zone 2 (North Coastal)',
      coords: [13.3360, 121.8505],
      color: '#2563EB', // Blue
      barangays: 'Bachao Ibaba, Bachao Ilaya, Antipolo',
      details: 'Coastal feeder terminal serving northern fishing and residential communities.'
    },
    {
      id: 'bognuyan',
      name: 'Bognuyan Port Terminal',
      toda: 'NBI TODA (North Bay)',
      zone: 'Zone 2 (North Coastal)',
      coords: [13.3680, 121.8600],
      color: '#7C3AED', // Purple
      barangays: 'Bognuyan, Cabugao, Dawis, Mangiliol',
      details: 'Port terminal route connecting port passengers to commercial hubs.'
    },
    {
      id: 'tapuyan',
      name: 'Tapuyan Crossing Outpost',
      toda: 'GT TODA',
      zone: 'Zone 2 (Highway Arterial Access)',
      coords: [13.3450, 121.8530],
      color: '#D97706', // Amber
      barangays: 'Tapuyan, Dili, Libtangin',
      details: 'Access terminal connecting inner residential zones to local arterial roads.'
    },
    {
      id: 'bahi',
      name: 'Bahi Seashore Terminal',
      toda: 'BAHI TODA',
      zone: 'Zone 3 (South Coastal)',
      coords: [13.2950, 121.8420],
      color: '#0284C7', // Sky Blue
      barangays: 'Bahi, Pinggan, Bacong-Bacong',
      details: 'Southern coastal shoreline transit route to downtown commercial centers.'
    },
    {
      id: 'tabionan',
      name: 'Tabionan Junction Terminal',
      toda: 'TAB TODA',
      zone: 'Zone 3 (Upland South)',
      coords: [13.2980, 121.8550],
      color: '#0D9488', // Teal
      barangays: 'Tabionan, Tiguion, Masiga, Matandang Gasan',
      details: 'Agricultural interior perimeter route transporting upland farmers and residents.'
    },
    {
      id: 'bangbang',
      name: 'Bangbang Barangay Hall Outpost',
      toda: 'BANGBANG IPIL TODA',
      zone: 'Zone 3 (Interior Upland)',
      coords: [13.3090, 121.8620],
      color: '#E11D48', // Rose
      barangays: 'Bangbang, Banot, Banuyo, Pangi',
      details: 'Vital farm-to-market interior feeder route across upland barangays.'
    }
  ],

  crossingPoints: [
    {
      name: 'Poblacion - Dili Crossing',
      coords: [13.3250, 121.8485],
      note: 'Authorized perpendicular highway crossing only. Strictly NO traversing along highway.'
    },
    {
      name: 'Bachao Ibaba Crossing',
      coords: [13.3350, 121.8500],
      note: 'Authorized signalized intersection for tricycles crossing east-west.'
    },
    {
      name: 'Bahi South Crossing',
      coords: [13.2980, 121.8425],
      note: 'Crossing point connecting interior farm road to barangay proper.'
    }
  ],

  routes: [
    {
      id: 'zone1',
      name: 'Zone 1: Poblacion Central Loop',
      color: '#059669',
      weight: 5,
      coords: [
        [13.3225, 121.8480],
        [13.3210, 121.8525],
        [13.3180, 121.8515],
        [13.3175, 121.8475],
        [13.3200, 121.8465],
        [13.3225, 121.8480]
      ]
    },
    {
      id: 'zone2',
      name: 'Zone 2: North Coastal Route',
      color: '#2563EB',
      weight: 4,
      coords: [
        [13.3225, 121.8480],
        [13.3280, 121.8490],
        [13.3360, 121.8505],
        [13.3450, 121.8530],
        [13.3550, 121.8560],
        [13.3680, 121.8600]
      ]
    },
    {
      id: 'zone3',
      name: 'Zone 3: South & Upland Route',
      color: '#0D9488',
      weight: 4,
      coords: [
        [13.3175, 121.8475],
        [13.3120, 121.8460],
        [13.3030, 121.8440],
        [13.2950, 121.8420],
        [13.2870, 121.8410],
        [13.2980, 121.8550],
        [13.3090, 121.8620],
        [13.3180, 121.8515]
      ]
    },
    {
      id: 'highway',
      name: 'National Highway (Circumferential Road - Prohibited)',
      color: '#DC2626',
      weight: 5,
      dashArray: '8, 8',
      coords: [
        [13.3720, 121.8620],
        [13.3550, 121.8560],
        [13.3450, 121.8530],
        [13.3350, 121.8500],
        [13.3250, 121.8485],
        [13.3150, 121.8465],
        [13.3000, 121.8430],
        [13.2850, 121.8400]
      ]
    }
  ]
};

const TrpInteractiveMap = ({ height = '520px', className = '' }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({});
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'zone1', 'zone2', 'zone3', 'highway'
  const [selectedTerminal, setSelectedTerminal] = useState(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initialize Leaflet Map
    const map = L.map(mapContainerRef.current, {
      center: GASAN_CENTER,
      zoom: 13,
      zoomControl: true,
      attributionControl: true
    });

    // Add Free OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &bull; G-TRAMS TRP'
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layersRef.current.group = layerGroup;
    mapInstanceRef.current = map;

    renderMapLayers(map, layerGroup, 'all');

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update layers when active filter changes
  useEffect(() => {
    if (mapInstanceRef.current && layersRef.current.group) {
      renderMapLayers(mapInstanceRef.current, layersRef.current.group, activeFilter);
    }
  }, [activeFilter]);

  const renderMapLayers = (map, group, filter) => {
    group.clearLayers();

    // 1. Draw Routes / Polylines
    TRP_DATA.routes.forEach(route => {
      if (filter !== 'all') {
        if (filter === 'zone1' && route.id !== 'zone1') return;
        if (filter === 'zone2' && route.id !== 'zone2') return;
        if (filter === 'zone3' && route.id !== 'zone3') return;
        if (filter === 'highway' && route.id !== 'highway') return;
      }

      const polyline = L.polyline(route.coords, {
        color: route.color,
        weight: route.weight,
        opacity: 0.85,
        dashArray: route.dashArray || null
      }).addTo(group);

      polyline.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
          <strong style="color: ${route.color}; font-size: 13px;">${route.name}</strong>
          <p style="margin: 4px 0 0; color: #475569;">
            ${route.id === 'highway' 
              ? '⚠️ <strong>DOTr Prohibition:</strong> Tricycles are NOT permitted to ply along the national highway. Crossing at approved intersections only.' 
              : 'Authorized municipal tricycle route corridor for registered TODA units.'}
          </p>
        </div>
      `);
    });

    // 2. Draw Terminals with Custom HTML DivIcon
    TRP_DATA.terminals.forEach(term => {
      if (filter !== 'all') {
        if (filter === 'zone1' && !term.zone.includes('Zone 1')) return;
        if (filter === 'zone2' && !term.zone.includes('Zone 2')) return;
        if (filter === 'zone3' && !term.zone.includes('Zone 3')) return;
        if (filter === 'highway') return;
      }

      const customIcon = L.divIcon({
        className: 'custom-trp-marker',
        html: `
          <div style="
            background: ${term.color}; 
            color: white; 
            width: 28px; 
            height: 28px; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            border: 2px solid white;
            font-weight: 900;
            font-size: 11px;
            cursor: pointer;
          ">
            📍
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14]
      });

      const marker = L.marker(term.coords, { icon: customIcon }).addTo(group);
      
      marker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 200px; padding: 4px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${term.color};"></span>
            <strong style="color: #0f172a; font-size: 13px;">${term.toda}</strong>
          </div>
          <p style="margin: 0 0 4px; font-weight: bold; font-size: 11px; color: #334155;">${term.name}</p>
          <div style="background: #f1f5f9; padding: 6px; border-radius: 8px; font-size: 10px; color: #475569;">
            <p style="margin: 0 0 2px;"><strong>Zone:</strong> ${term.zone}</p>
            <p style="margin: 0 0 2px;"><strong>Barangays:</strong> ${term.barangays}</p>
            <p style="margin: 0; color: #0284c7;">${term.details}</p>
          </div>
        </div>
      `);

      marker.on('click', () => setSelectedTerminal(term));
    });

    // 3. Draw Authorized Crossing Points
    if (filter === 'all' || filter === 'highway') {
      TRP_DATA.crossingPoints.forEach(cp => {
        const crossingIcon = L.divIcon({
          className: 'custom-crossing-marker',
          html: `
            <div style="
              background: #059669; 
              color: white; 
              width: 22px; 
              height: 22px; 
              border-radius: 6px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              border: 2px solid white;
              font-size: 11px;
            ">
              ✓
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        const crossingMarker = L.marker(cp.coords, { icon: crossingIcon }).addTo(group);
        crossingMarker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 11px; padding: 4px;">
            <strong style="color: #059669;">Authorized Crossing Point</strong>
            <p style="margin: 4px 0 2px; font-weight: bold; color: #0f172a;">${cp.name}</p>
            <p style="margin: 0; color: #475569; font-size: 10px;">${cp.note}</p>
          </div>
        `);
      });
    }
  };

  const resetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(GASAN_CENTER, 13);
      setSelectedTerminal(null);
    }
  };

  const focusTerminal = (term) => {
    setSelectedTerminal(term);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(term.coords, 15, { animate: true });
    }
  };

  return (
    <div className={`flex flex-col rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm ${className}`}>
      
      {/* MAP HEADER / FILTER TOOLBAR */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#7A1B22]/10 dark:bg-[#7A1B22]/30 text-[#7A1B22] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
            <Compass size={22} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              Interactive Tricycle Route Plan (TRP) Map
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                OpenStreetMap Free
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Municipality of Gasan, Marinduque &bull; Route corridors, authorized zones &amp; terminal outposts
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'all', label: 'All Routes', color: 'hover:bg-slate-200' },
            { id: 'zone1', label: 'Zone 1 (Poblacion)', color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200' },
            { id: 'zone2', label: 'Zone 2 (North)', color: 'text-blue-700 bg-blue-50 dark:bg-blue-950/50 border-blue-200' },
            { id: 'zone3', label: 'Zone 3 (South)', color: 'text-teal-700 bg-teal-50 dark:bg-teal-950/50 border-teal-200' },
            { id: 'highway', label: '⚠️ National Highway', color: 'text-red-700 bg-red-50 dark:bg-red-950/50 border-red-200' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-2xs active:scale-95 ${
                activeFilter === tab.id
                  ? 'bg-[#7A1B22] text-white border-[#7A1B22] shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={resetView}
            title="Reset Map Center"
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* NATIONAL HIGHWAY PROHIBITION ALERT BANNER */}
      <div className="px-4 py-2.5 bg-red-50/90 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900/60 flex items-start sm:items-center gap-2.5 text-red-900 dark:text-red-200 text-xs">
        <AlertTriangle size={16} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5 sm:mt-0" />
        <div className="flex-1 leading-snug">
          <span className="font-black uppercase text-[10px] tracking-wider text-red-700 dark:text-red-300 mr-1.5">
            DOTr-DILG JMC 2020-036 Rule:
          </span>
          <span className="font-medium text-[11px] sm:text-xs">
            Bawal ang tricycle sa kahabaan ng Marinduque Circumferential National Highway (Red Dashed Line). 
            Pinapayagan lamang tumawid sa mga aprubadong <strong>Designated Crossing Points (✓)</strong>.
          </span>
        </div>
      </div>

      {/* MAP CONTAINER & SIDE DRAWER */}
      <div className="relative w-full" style={{ height }}>
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Selected Terminal Floating Card */}
        {selectedTerminal && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm z-[500] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span 
                  className="w-3 h-3 rounded-full shrink-0 shadow-xs" 
                  style={{ backgroundColor: selectedTerminal.color }} 
                />
                <h4 className="font-black text-xs text-slate-900 dark:text-white">
                  {selectedTerminal.toda}
                </h4>
              </div>
              <button 
                onClick={() => setSelectedTerminal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              {selectedTerminal.name}
            </p>
            <div className="space-y-1 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <p><strong className="text-slate-700 dark:text-slate-300">Zone:</strong> {selectedTerminal.zone}</p>
              <p><strong className="text-slate-700 dark:text-slate-300">Barangays:</strong> {selectedTerminal.barangays}</p>
              <p className="text-slate-600 dark:text-slate-300 pt-0.5 font-medium">{selectedTerminal.details}</p>
            </div>
          </div>
        )}
      </div>

      {/* QUICK TERMINAL DIRECTORY BADGES */}
      <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
          Quick Jump:
        </span>
        {TRP_DATA.terminals.map(term => (
          <button
            key={term.id}
            onClick={() => focusTerminal(term)}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#7A1B22] dark:hover:border-[#D4AF37] text-slate-700 dark:text-slate-300 text-[11px] font-bold transition-all shadow-2xs active:scale-95"
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: term.color }} />
            <span>{term.toda.split(' ')[0]}</span>
          </button>
        ))}
      </div>

    </div>
  );
};

export default TrpInteractiveMap;
