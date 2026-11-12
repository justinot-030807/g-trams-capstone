import React, { useState, useMemo } from 'react';
import { 
  Award, FileText, CheckCircle2, AlertCircle, Search, Filter, 
  Calendar, ShieldCheck, Printer, Check, X, ExternalLink, RefreshCw,
  Building2, UserCheck, Layers, ChevronRight
} from 'lucide-react';
import OfficialMayorPermitCardModal from '../common/OfficialMayorPermitCardModal';
import OfficialBploPermitFormModal from '../common/OfficialBploPermitFormModal';
import MtopCertificateModal from './MtopCertificateModal';

/**
 * BploMayorPermitManager
 * Executive Permitting Division Component for BPLO (Edgar R. Selda / Mayor James Marty L. Lim).
 *
 * Implements the exact workflow requested during the LGU User Acceptance Test:
 * 1. Filter / Search by Fiscal Year & Surname/Plate (replacing manual Excel lookup).
 * 2. 4-Clearance Status Tracker: PNP, RHU Health, MPDO Roadworthiness, and OVM Franchise (3-year).
 * 3. 1-Click Launchers for:
 *    - 2027 Red & White Tricycle Permit Card (2027.psd template)
 *    - Official BPLO Application for Tricycle Permit Form (with Treasury Assessment)
 *    - Sangguniang Bayan 3-Year MTOP Franchise Certificate
 */
const BploMayorPermitManager = ({ franchises = [], onRefresh = null }) => {
  const [selectedYear, setSelectedYear] = useState('2027');
  const [searchQuery, setSearchQuery] = useState('');
  const [clearanceFilter, setClearanceFilter] = useState('all'); // all, complete, incomplete

  // Local clearance override state (stored in localStorage so BPLO staff can toggle clearances per operator)
  const [clearancesState, setClearancesState] = useState(() => {
    try {
      const cached = localStorage.getItem('gtrams_bplo_clearances');
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  // Modal states
  const [cardModal, setCardModal] = useState({ isOpen: false, unit: null });
  const [bploFormModal, setBploFormModal] = useState({ isOpen: false, unit: null });
  const [mtopModal, setMtopModal] = useState({ isOpen: false, unit: null });

  // Save clearance toggles
  const handleToggleClearance = (unitId, clearanceKey) => {
    setClearancesState(prev => {
      const unitClearances = prev[unitId] || { pnp: true, rhu: true, mpdo: true };
      const updated = {
        ...prev,
        [unitId]: {
          ...unitClearances,
          [clearanceKey]: !unitClearances[clearanceKey]
        }
      };
      try {
        localStorage.setItem('gtrams_bplo_clearances', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  // Filtered and processed list
  const filteredList = useMemo(() => {
    return franchises.filter(f => {
      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        String(f.fullName || f.name || '').toLowerCase().includes(q) ||
        String(f.plateNo || '').toLowerCase().includes(q) ||
        String(f.motorNo || '').toLowerCase().includes(q) ||
        String(f.chassisNo || '').toLowerCase().includes(q) ||
        String(f.address || '').toLowerCase().includes(q);

      if (!matchQuery) return false;

      // Year filter (based on permitYear or approvalDate)
      const fYear = f.approvalDate ? new Date(f.approvalDate).getFullYear().toString() : '2027';
      if (selectedYear !== 'all' && fYear !== selectedYear) return false;

      // Clearance filter
      const unitCl = clearancesState[f._id] || { pnp: true, rhu: true, mpdo: true };
      const isOvmValid = f.status === 'Active';
      const isAllCleared = unitCl.pnp && unitCl.rhu && unitCl.mpdo && isOvmValid;

      if (clearanceFilter === 'complete' && !isAllCleared) return false;
      if (clearanceFilter === 'incomplete' && isAllCleared) return false;

      return true;
    });
  }, [franchises, searchQuery, selectedYear, clearanceFilter, clearancesState]);

  return (
    <div className="w-full space-y-4">
      {/* Top Banner & Context Note */}
      <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center shrink-0 border border-[#9E2A2B]/20">
              <Building2 size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#1F1D1B] dark:text-[#EAE7E1] flex items-center gap-2">
                BPLO Mayor's Tricycle Permitting Division
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                  Annual Executive License
                </span>
              </h2>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
                Clearance tracking &bull; 2027 Mayor's Permit Card issuance &bull; Treasury Window 3 assessment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="p-2 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-slate-100 dark:hover:bg-[#252220] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                title="Refresh Records"
              >
                <RefreshCw size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="pt-3.5 grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by operator surname, plate, or motor/chassis..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20"
            />
          </div>

          {/* Year Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20 cursor-pointer font-bold"
            >
              <option value="2027">Permit Year: 2027 (Active Card)</option>
              <option value="2026">Permit Year: 2026</option>
              <option value="2025">Permit Year: 2025</option>
              <option value="2024">Permit Year: 2024</option>
              <option value="all">All Permit Years</option>
            </select>
          </div>

          {/* Clearance Filter */}
          <div className="sm:col-span-3">
            <select
              value={clearanceFilter}
              onChange={(e) => setClearanceFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20 cursor-pointer"
            >
              <option value="all">All Clearance States</option>
              <option value="complete">All 4 Clearances Complete</option>
              <option value="incomplete">Pending Clearances</option>
            </select>
          </div>
        </div>
      </div>

      {/* Operator List & Clearance Table */}
      <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-xl overflow-hidden shadow-xs">
        <div className="p-3.5 bg-slate-50 dark:bg-[#171412] border-b border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>Registered Tricycle Units ({filteredList.length})</span>
          <span className="text-[11px] text-slate-500">Click clearance badges to toggle verification</span>
        </div>

        {filteredList.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs sm:text-sm">
            <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">No tricycle records found</p>
            <p>Try adjusting your search query or selected permit year.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27] overflow-x-auto">
            {filteredList.map((unit) => {
              const cl = clearancesState[unit._id] || { pnp: true, rhu: true, mpdo: true };
              const isOvmValid = unit.status === 'Active';
              const isAllCleared = cl.pnp && cl.rhu && cl.mpdo && isOvmValid;

              return (
                <div key={unit._id} className="p-4 hover:bg-slate-50/60 dark:hover:bg-[#201C19]/50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Operator Identity & Vehicle Meta */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-sm sm:text-base text-[#1F1D1B] dark:text-[#EAE7E1] uppercase">
                          {unit.fullName || unit.name || 'Operator Name'}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#9E2A2B]/10 text-[#9E2A2B] dark:text-[#D4AF37] border border-[#9E2A2B]/20">
                          PLATE: {unit.plateNo || 'PENDING'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          FRANCHISE: {unit.franchiseNo || String(unit._id).slice(-6).toUpperCase()}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-3 flex-wrap">
                        <span>{unit.address || 'Gasan, Marinduque'}</span>
                        <span>&bull;</span>
                        <span>{unit.make || 'KAWASAKI'} ({unit.made || '2026'})</span>
                        <span>&bull;</span>
                        <span className="font-mono text-[11px]">Motor: {unit.motorNo || '—'}</span>
                        <span>&bull;</span>
                        <span className="font-mono text-[11px]">Chassis: {unit.chassisNo || '—'}</span>
                      </div>
                    </div>

                    {/* 4 Clearances Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* 1. PNP Online Clearance */}
                      <button
                        type="button"
                        onClick={() => handleToggleClearance(unit._id, 'pnp')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                          cl.pnp 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' 
                            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800'
                        }`}
                        title="Click to toggle PNP Online Police Clearance"
                      >
                        {cl.pnp ? <Check size={12} /> : <X size={12} />}
                        <span>PNP</span>
                      </button>

                      {/* 2. RHU Health Card */}
                      <button
                        type="button"
                        onClick={() => handleToggleClearance(unit._id, 'rhu')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                          cl.rhu 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' 
                            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800'
                        }`}
                        title="Click to toggle RHU Health Card / Clearance"
                      >
                        {cl.rhu ? <Check size={12} /> : <X size={12} />}
                        <span>RHU</span>
                      </button>

                      {/* 3. MPDO Roadworthiness */}
                      <button
                        type="button"
                        onClick={() => handleToggleClearance(unit._id, 'mpdo')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                          cl.mpdo 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' 
                            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800'
                        }`}
                        title="Click to toggle MPDO Roadworthiness Certification"
                      >
                        {cl.mpdo ? <Check size={12} /> : <X size={12} />}
                        <span>MPDO</span>
                      </button>

                      {/* 4. OVM SB 3-Year Franchise */}
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 ${
                          isOvmValid
                            ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                        }`}
                        title={isOvmValid ? 'Active 3-Year Sangguniang Bayan Franchise' : 'OVM Franchise grant pending or expired'}
                      >
                        {isOvmValid ? <ShieldCheck size={12} /> : <AlertCircle size={12} />}
                        <span>OVM Franchise</span>
                      </span>
                    </div>

                    {/* Action Launchers */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* 2027 Mayor's Permit Card Button */}
                      <button
                        type="button"
                        onClick={() => setCardModal({ isOpen: true, unit })}
                        className="flex items-center gap-1.5 bg-[#9E2A2B] hover:bg-[#851e20] active:scale-95 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                        title="View or Print 2027 Red Card"
                      >
                        <Award size={14} />
                        <span>Mayor's Permit Card</span>
                      </button>

                      {/* BPLO Application Form Button */}
                      <button
                        type="button"
                        onClick={() => setBploFormModal({ isOpen: true, unit })}
                        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#252220] dark:hover:bg-[#2F2B28] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                        title="View Official BPLO Form & Treasury Assessment"
                      >
                        <FileText size={14} />
                        <span className="hidden sm:inline">BPLO Form</span>
                      </button>

                      {/* OVM Franchise Certificate Button */}
                      <button
                        type="button"
                        onClick={() => setMtopModal({ isOpen: true, unit })}
                        className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg transition-colors cursor-pointer"
                        title="View Sangguniang Bayan 3-Year Franchise Certificate"
                      >
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Render Modals */}
      {cardModal.isOpen && (
        <OfficialMayorPermitCardModal
          isOpen={cardModal.isOpen}
          onClose={() => setCardModal({ isOpen: false, unit: null })}
          unit={cardModal.unit}
          permitYear={parseInt(selectedYear, 10) || 2027}
        />
      )}

      {bploFormModal.isOpen && (
        <OfficialBploPermitFormModal
          isOpen={bploFormModal.isOpen}
          onClose={() => setBploFormModal({ isOpen: false, unit: null })}
          formData={bploFormModal.unit}
          isRenewal={bploFormModal.unit?.applicationType === 'Renewal'}
        />
      )}

      {mtopModal.isOpen && (
        <MtopCertificateModal
          isOpen={mtopModal.isOpen}
          onClose={() => setMtopModal({ isOpen: false, unit: null })}
          unit={mtopModal.unit}
        />
      )}
    </div>
  );
};

export default BploMayorPermitManager;
