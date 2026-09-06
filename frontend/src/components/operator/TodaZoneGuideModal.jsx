import React, { useState } from 'react';
import { MapPin, Search, X, Compass, CheckCircle2, Shield, Info, Navigation, Users } from 'lucide-react';

const TODA_DIRECTORY = [
  {
    id: 'BATODA',
    name: 'BATODA (Bachao TODA)',
    zone: 'Zone 2 - Coastal Route',
    color: 'bg-blue-500',
    terminal: 'Bachao Ibaba Junction / Poblacion Market',
    barangays: ['Bachao Ibaba', 'Bachao Ilaya', 'Antipolo', 'Barangay I (Poblacion)'],
    description: 'Servicing Bachao coastal and interior routes heading to Gasan Public Market.'
  },
  {
    id: 'POB TODA',
    name: 'POB TODA (Poblacion Central)',
    zone: 'Zone 1 - Town Proper Loop',
    color: 'bg-emerald-500',
    terminal: 'Gasan Municipal Plaza / Town Terminal',
    barangays: ['Barangay I (Poblacion)', 'Barangay II (Poblacion)', 'Barangay III (Poblacion)'],
    description: 'Town center internal loop connecting banks, municipal hall, churches, and central schools.'
  },
  {
    id: 'GT TODA',
    name: 'GT TODA (Gasan-Tapuyan)',
    zone: 'Zone 2 - Highway Route',
    color: 'bg-amber-500',
    terminal: 'Tapuyan Crossing / Highway Outpost',
    barangays: ['Tapuyan', 'Dili', 'Libtangin', 'Barangay II (Poblacion)'],
    description: 'Main highway arterial route connecting northern coastal barangays to downtown Gasan.'
  },
  {
    id: 'NBI TODA',
    name: 'NBI TODA (North Bay Interstate)',
    zone: 'Zone 2 - North Coastal',
    color: 'bg-purple-500',
    terminal: 'Bognuyan Port Terminal',
    barangays: ['Bognuyan', 'Cabugao', 'Dawis', 'Mangiliol'],
    description: 'Port and northern coastal connectivity covering fishing and agricultural communities.'
  },
  {
    id: 'BANGBANG IPIL TODA',
    name: 'BANGBANG IPIL TODA',
    zone: 'Zone 3 - Interior & Upland',
    color: 'bg-rose-500',
    terminal: 'Bangbang Barangay Hall Outpost',
    barangays: ['Bangbang', 'Banot', 'Banuyo', 'Pangi'],
    description: 'Vital farm-to-market interior feeder route across scenic upland barangays.'
  },
  {
    id: 'TAB TODA',
    name: 'TAB TODA (Tabionan Transport)',
    zone: 'Zone 3 - Upland South',
    color: 'bg-teal-500',
    terminal: 'Tabionan Junction Terminal',
    barangays: ['Tabionan', 'Tiguion', 'Masiga', 'Matandang Gasan'],
    description: 'Southern mountain perimeter connection transporting local farmers and residents.'
  },
  {
    id: 'GASAN CENTRAL TODA',
    name: 'GASAN CENTRAL TODA',
    zone: 'Zone 1 - Central Interchange',
    color: 'bg-indigo-500',
    terminal: 'Gasan Central Integrated Terminal',
    barangays: ['Barangay I (Poblacion)', 'Barangay II (Poblacion)', 'Barangay III (Poblacion)', 'Mahunig'],
    description: 'Inter-barangay shuttle terminal servicing general public passenger transit.'
  },
  {
    id: 'BAHI TODA',
    name: 'BAHI TODA',
    zone: 'Zone 2 - Coastal South',
    color: 'bg-cyan-500',
    terminal: 'Bahi Seashore Terminal',
    barangays: ['Bahi', 'Pinggan', 'Bacong-Bacong'],
    description: 'Coastal shoreline route linking southern coastal barangays to downtown markets.'
  },
  {
    id: 'NON-TODA',
    name: 'NON-TODA (Independent / Free Franchise)',
    zone: 'All Approved Municipal Zones',
    color: 'bg-slate-500',
    terminal: 'Non-Exclusive / Operator Residence',
    barangays: ['All Gasan Barangays'],
    description: 'Operators operating independently within permitted municipal municipal boundaries.'
  }
];

const QUICK_BARANGAYS = [
  "All", "Poblacion", "Bachao", "Bognuyan", "Bangbang", "Tapuyan", "Bahi", "Pinggan", "Tabionan", "Dawis"
];

const TodaZoneGuideModal = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrgyTag, setSelectedBrgyTag] = useState('All');

  if (!isOpen) return null;

  const filteredList = TODA_DIRECTORY.filter(toda => {
    const matchesSearch = 
      toda.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      toda.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      toda.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      toda.terminal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      toda.barangays.some(b => b.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = 
      selectedBrgyTag === 'All' ||
      toda.barangays.some(b => b.toLowerCase().includes(selectedBrgyTag.toLowerCase()));

    return matchesSearch && matchesTag;
  });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7A1B22] via-[#8C2028] to-[#5A1419] p-5 sm:p-6 text-white relative shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-[#D4AF37]">
                <Compass size={22} />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg tracking-wide uppercase">
                  TODA Routes &amp; Zone Guide
                </h3>
                <p className="text-xs text-white/80 font-medium">
                  Municipality of Gasan Transport Network &amp; Coverage
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Live Search Bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" size={16} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Barangay, TODA name, terminal, or zone..."
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-white/50 outline-none focus:bg-white/20 focus:border-[#D4AF37] transition-all font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Barangay Tags */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-2 pr-1 shrink-0">
            Quick Filter:
          </span>
          {QUICK_BARANGAYS.map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBrgyTag(b)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 transition-all ${
                selectedBrgyTag === b
                  ? 'bg-[#7A1B22] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600'
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        {/* TODA Directory Cards List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1">
          {filteredList.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Info size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No matching TODA or route found</p>
              <p className="text-xs text-slate-400 mt-0.5">Try searching with a different barangay name or clearing filters.</p>
            </div>
          ) : (
            filteredList.map((toda) => (
              <div 
                key={toda.id}
                className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 hover:shadow-md transition-all relative overflow-hidden"
              >
                <div className={`absolute top-0 left-0 w-1.5 h-full ${toda.color}`} />

                <div className="pl-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-900 dark:text-white tracking-wide">
                        {toda.name}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {toda.id}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold text-[#7A1B22] dark:text-[#D4AF37] uppercase tracking-wider flex items-center gap-1">
                      <Navigation size={11} /> {toda.zone}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 font-medium">
                    {toda.description}
                  </p>

                  <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50 space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-[#7A1B22] dark:text-[#D4AF37] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Terminal Base</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{toda.terminal}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Covered Barangays &amp; Route Stops:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {toda.barangays.map((brgy) => (
                          <span 
                            key={brgy}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md text-[10px] font-semibold"
                          >
                            {brgy}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs shrink-0">
          <p className="text-[11px] text-slate-500 font-medium">
            Official Gasan TODA Route Network
          </p>
          <button
            onClick={onClose}
            className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 px-4 py-1.5 rounded-xl font-bold text-xs transition-colors"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};

export default TodaZoneGuideModal;
