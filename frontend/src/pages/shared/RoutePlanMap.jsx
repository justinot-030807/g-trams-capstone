import React from 'react';
import MainLayout from '../../components/MainLayout';
import TrpInteractiveMap from '../../components/map/TrpInteractiveMap';
import { 
  MapPin, Navigation, ShieldCheck, AlertTriangle, Compass, 
  Car, FileText, CheckCircle2, ChevronRight, Info, ExternalLink 
} from 'lucide-react';

const TODA_GUIDELINES = [
  {
    zone: 'Zone 1 - Poblacion Central Loop',
    color: 'border-emerald-500 text-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/40',
    todas: ['POB TODA', 'GASAN CENTRAL TODA'],
    coverage: 'Barangay I, II, III (Poblacion), Public Market, Church, Schools, Municipal Hall',
    description: 'Internal urban loop for passengers moving between administrative, education, and market institutions.'
  },
  {
    zone: 'Zone 2 - North Coastal & Highway Feeder',
    color: 'border-blue-500 text-blue-700 bg-blue-50/60 dark:bg-blue-950/40',
    todas: ['BATODA', 'NBI TODA', 'GT TODA'],
    coverage: 'Bachao Ibaba, Bachao Ilaya, Antipolo, Bognuyan Port, Cabugao, Dawis, Tapuyan, Dili',
    description: 'Connects coastal fishing communities and northern passenger port to downtown Gasan.'
  },
  {
    zone: 'Zone 3 - South Coastal & Upland Interior',
    color: 'border-teal-500 text-teal-700 bg-teal-50/60 dark:bg-teal-950/40',
    todas: ['BAHI TODA', 'TAB TODA', 'BANGBANG IPIL TODA'],
    coverage: 'Bahi, Pinggan, Bacong-Bacong, Tabionan, Tiguion, Masiga, Matandang Gasan, Bangbang, Banot, Banuyo, Pangi',
    description: 'Transports upland farm produce, farmers, and southern shoreline residents to urban centers.'
  }
];

const RoutePlanMap = () => {
  return (
    <MainLayout>
      {/* PAGE HEADER */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-[#7A1B22] rounded-full" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Tricycle Route Plan (TRP) &amp; Zone Guide
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#7A1B22]/10 text-[#7A1B22] dark:text-[#D4AF37] border border-[#7A1B22]/20">
                LGU Gasan Official
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Interactive map of approved tricycle routes, TODA outposts, and DOTr national highway restrictions.
            </p>
          </div>
        </div>
      </header>

      {/* QUICK SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Zone 1 Fleet</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white">Poblacion Loop</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Town Market &bull; Admin Center</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Zone 2 Fleet</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white">North &amp; Coastal</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Bognuyan Port &bull; Bachao</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Zone 3 Fleet</span>
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white">South &amp; Upland</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Bahi Shore &bull; Tabionan</p>
        </div>

        <div className="p-4 rounded-2xl bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">DOTr Guideline</span>
            <AlertTriangle size={14} className="text-red-600 dark:text-red-400" />
          </div>
          <p className="text-lg font-black text-red-950 dark:text-red-200">Highway Banned</p>
          <p className="text-[10px] text-red-700 dark:text-red-400 mt-0.5">Crossing points only</p>
        </div>
      </div>

      {/* INTERACTIVE LEAFLET & OPENSTREETMAP CONTAINER */}
      <div className="mb-8">
        <TrpInteractiveMap height="560px" />
      </div>

      {/* DETAILED ZONE SPECIFICATIONS & DOTR COMPLIANCE CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {TODA_GUIDELINES.map((guide, idx) => (
          <div 
            key={idx} 
            className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className={`inline-block px-3 py-1 rounded-xl text-xs font-bold border mb-3 ${guide.color}`}>
                {guide.zone}
              </div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white mb-2">
                Authorized TODAs:
              </h3>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {guide.todas.map((toda, i) => (
                  <span key={i} className="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg">
                    {toda}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                <strong>Barangays Covered:</strong> {guide.coverage}
              </p>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 italic pt-3 border-t border-slate-100 dark:border-slate-800">
              {guide.description}
            </p>
          </div>
        ))}
      </div>

      {/* LEGAL FRAMEWORK & REFERENCE NOTICE */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
            <ShieldCheck size={16} /> Legal Basis &bull; DILG-DOTr Joint Memorandum Circular 2020-036
          </div>
          <h4 className="text-base font-black">
            National Standard for Tricycle Route Plans (TRP)
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            All motorized tricycle operations in the Municipality of Gasan are subject to periodic route rationalization. 
            For safety, tricycles are prohibited on national highways traversed by 4-wheel vehicles with speeds exceeding 40 kph. 
            Only designated intersection crossings are authorized.
          </p>
        </div>

        <div className="shrink-0 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center w-full md:w-auto">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prescribed Penalty</p>
          <p className="text-sm font-black text-amber-400 mt-0.5">Fine / Franchise Revocation</p>
          <p className="text-[9px] text-slate-400 mt-0.5">Municipal Traffic Code</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default RoutePlanMap;
