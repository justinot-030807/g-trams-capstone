import React, { useState } from 'react';
import { 
  MapPin, Search, X, Compass, CheckCircle2, Shield, Info, 
  Navigation, Users, Layers, ExternalLink 
} from 'lucide-react';
import { GASAN_ZONES, GASAN_BARANGAYS, TODA_DIRECTORY } from '../../utils/constants';

export { GASAN_ZONES, TODA_DIRECTORY };

const TodaZoneGuideModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('zones'); // 'zones' | 'toda'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('All');

  if (!isOpen) return null;

  const filteredZones = GASAN_ZONES.filter(z => {
    if (selectedZoneFilter !== 'All' && z.id !== selectedZoneFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      z.name.toLowerCase().includes(q) ||
      z.description.toLowerCase().includes(q) ||
      z.coverage.toLowerCase().includes(q) ||
      z.barangays.some(b => b.toLowerCase().includes(q))
    );
  });

  const filteredToda = TODA_DIRECTORY.filter(toda => {
    if (selectedZoneFilter !== 'All') {
      if (!toda.zone.toLowerCase().includes(selectedZoneFilter.toLowerCase())) return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      toda.name.toLowerCase().includes(q) ||
      toda.id.toLowerCase().includes(q) ||
      toda.zone.toLowerCase().includes(q) ||
      toda.terminal.toLowerCase().includes(q) ||
      toda.barangays.some(b => b.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white dark:bg-[#1C1917] w-full max-w-3xl rounded-lg shadow-xl border border-[#E4E1DC] dark:border-[#2E2A27] overflow-hidden z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#9E2A2B] p-5 sm:p-6 text-white relative shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-[#D4AF37]">
                <Compass size={22} />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg tracking-wide uppercase">
                  Municipal Routes &amp; Zone Guide
                </h3>
                <p className="text-xs text-white/80 font-normal">
                  Official Zoning Policy &bull; Bayan ng Gasan
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" size={16} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Barangay name, zone, or TODA..."
              className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-white/50 outline-none focus:bg-white/20 focus:border-[#D4AF37] transition-all font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-xs font-bold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher & Zone Filter Bar */}
        <div className="p-3 bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('zones')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'zones'
                  ? 'bg-[#9E2A2B] text-white shadow-xs'
                  : 'bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#EAE7E1]'
              }`}
            >
              <Layers size={13} />
              <span>Municipal Zones (3)</span>
            </button>

            <button
              onClick={() => setActiveTab('toda')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'toda'
                  ? 'bg-[#9E2A2B] text-white shadow-xs'
                  : 'bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#EAE7E1]'
              }`}
            >
              <Users size={13} />
              <span>TODA Directory</span>
            </button>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-auto">
            {['All', 'Central', 'North', 'South'].map((z) => (
              <button
                key={z}
                onClick={() => setSelectedZoneFilter(z)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                  selectedZoneFilter === z
                    ? 'bg-[#1F1D1B] text-white dark:bg-[#EAE7E1] dark:text-[#14110F]'
                    : 'text-[#6B6761] dark:text-[#A8A29E] hover:bg-[#EAE7E1] dark:hover:bg-[#252220]'
                }`}
              >
                {z}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'zones' ? (
            /* OFFICIAL MUNICIPAL ZONES VIEW */
            filteredZones.length === 0 ? (
              <div className="text-center py-12 text-[#6B6761] dark:text-[#A8A29E]">
                <Info size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">No matching zone found</p>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5">Try searching for a different barangay name.</p>
              </div>
            ) : (
              filteredZones.map((zone) => (
                <div 
                  key={zone.id}
                  className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-4 sm:p-5 hover:border-[#9E2A2B]/40 dark:hover:border-[#D4AF37]/40 transition-colors relative overflow-hidden"
                >
                  {/* Left Accent Strip */}
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${
                    zone.id === 'Central' ? 'bg-[#9E2A2B]' : zone.id === 'North' ? 'bg-amber-500' : 'bg-blue-600'
                  }`} />

                  <div className="pl-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-[#1F1D1B] dark:text-[#F6F5F3] tracking-wide">
                          {zone.name}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F6F5F3] dark:bg-[#14110F] text-[#9E2A2B] dark:text-[#D4AF37] border border-[#E4E1DC] dark:border-[#2E2A27]">
                          {zone.barangays.length} Barangays
                        </span>
                      </div>

                      <span className="text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E]">
                        {zone.description}
                      </span>
                    </div>

                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mb-3 leading-relaxed">
                      <strong>Coverage:</strong> {zone.coverage}
                    </p>

                    <div className="bg-[#F6F5F3] dark:bg-[#14110F] rounded-lg p-3 border border-[#E4E1DC] dark:border-[#2E2A27] space-y-2 text-xs">
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-[#9E2A2B] dark:text-[#D4AF37] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider block">Terminal Outposts</span>
                          <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{zone.terminal}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider block mb-1.5">
                          Assigned Barangays (Residency Base):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {zone.barangays.map((b) => (
                            <span 
                              key={b}
                              className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] px-2.5 py-0.5 rounded-md text-xs font-medium"
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            /* TODA ASSOCIATIONS VIEW */
            filteredToda.length === 0 ? (
              <div className="text-center py-12 text-[#6B6761] dark:text-[#A8A29E]">
                <Info size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">No matching TODA found</p>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5">Try searching with a different keyword.</p>
              </div>
            ) : (
              filteredToda.map((toda) => (
                <div 
                  key={toda.id}
                  className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-4 sm:p-5 hover:border-[#9E2A2B]/40 dark:hover:border-[#D4AF37]/40 transition-colors relative overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${toda.color}`} />

                  <div className="pl-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1F1D1B] dark:text-[#F6F5F3] tracking-wide">
                          {toda.name}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] border border-[#E4E1DC] dark:border-[#2E2A27]">
                          {toda.id}
                        </span>
                      </div>

                      <span className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] uppercase tracking-wider flex items-center gap-1">
                        <Navigation size={11} /> {toda.zone}
                      </span>
                    </div>

                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mb-3 font-normal leading-relaxed">
                      {toda.description}
                    </p>

                    <div className="bg-[#F6F5F3] dark:bg-[#14110F] rounded-lg p-3 border border-[#E4E1DC] dark:border-[#2E2A27] space-y-2 text-xs">
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-[#9E2A2B] dark:text-[#D4AF37] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider block">Terminal Base</span>
                          <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{toda.terminal}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider block mb-1">
                          Covered Barangays &amp; Route Stops:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {toda.barangays.map((brgy) => (
                            <span 
                              key={brgy}
                              className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] px-2 py-0.5 rounded-md text-xs font-medium"
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
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#F6F5F3] dark:bg-[#14110F] border-t border-[#E4E1DC] dark:border-[#2E2A27] flex justify-between items-center text-xs shrink-0">
          <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-medium">
            Municipal Franchising Policy: Zoning is primarily based on Operator Barangay residency.
          </p>
          <button
            onClick={onClose}
            className="bg-white dark:bg-[#1C1917] hover:bg-[#EAE7E1] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] border border-[#E4E1DC] dark:border-[#2E2A27] px-4 py-2 min-h-[44px] rounded-lg font-bold text-xs transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};

export default TodaZoneGuideModal;
