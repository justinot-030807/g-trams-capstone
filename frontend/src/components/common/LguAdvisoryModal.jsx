import React from 'react';
import { ShieldAlert, AlertTriangle, Building2, User, Hash, CheckCircle, ArrowRight, X, PhoneCall } from 'lucide-react';

const LguAdvisoryModal = ({ isOpen, onClose, advisory, message, applicantData }) => {
  if (!isOpen) return null;

  const title = advisory?.title || 'OPISYAL NA ADVISORY NG PAMAHALAANG BAYAN NG GASAN';
  const department = advisory?.department || 'Business Permits and Licensing Office (BPLO) / Tanggapan ng Sangguniang Bayan';
  const ordinance = advisory?.ordinance || 'Municipal Ordinance No. 2020-04 (Tricycle Franchising & Regulatory Code)';
  const reason = advisory?.reason || message || 'Hindi nakatala sa opisyal na masterlist ng napiling TODA ang inyong pangalan at Body Number.';
  const action = advisory?.action || 'Makipag-ugnayan sa inyong TODA President upang maisama ang inyong pangalan at Body Number sa certified masterlist.';
  const details = advisory?.details || applicantData || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-[#F6F5F3] dark:bg-[#1C1917] rounded-xl border-2 border-[#9E2A2B] dark:border-[#D4AF37] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lgu-advisory-title"
      >
        {/* Top Municipal Color Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-[#9E2A2B] via-[#D4AF37] to-[#9E2A2B]" />

        {/* Header with Municipal Branding */}
        <div className="p-4 sm:p-5 bg-white dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] flex items-start gap-3.5">
          <img 
            src="/gasan-logo.png" 
            alt="Munisipyo ng Gasan" 
            className="w-12 h-12 object-contain shrink-0 mt-0.5 filter drop-shadow-xs" 
          />
          <div className="flex-1 min-w-0">
            <span className="inline-block text-[10px] font-black tracking-widest text-[#9E2A2B] dark:text-[#D4AF37] uppercase">
              Pamahalaang Bayan ng Gasan • Marinduque
            </span>
            <h2 id="lgu-advisory-title" className="text-base sm:text-lg font-black text-[#1F1D1B] dark:text-[#F6F5F3] leading-snug tracking-tight">
              {title}
            </h2>
            <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-semibold mt-0.5">
              {department}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#6B6761] hover:text-[#9E2A2B] dark:hover:text-[#D4AF37] hover:bg-slate-100 dark:hover:bg-[#2E2A27] transition-colors cursor-pointer"
            aria-label="Isara ang advisory"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs sm:text-sm">
          {/* Legal Bar */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200">
            <ShieldAlert size={18} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="font-bold text-xs leading-tight">
              BATAYAN: {ordinance}
            </span>
          </div>

          {/* Block Reason Explanation */}
          <div className="p-3.5 rounded-lg bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60">
            <h3 className="text-xs font-black uppercase tracking-wider text-red-700 dark:text-red-400 mb-1 flex items-center gap-1.5">
              <AlertTriangle size={15} /> Dahilan ng Registration Harang
            </h3>
            <p className="text-xs sm:text-[13px] text-red-900 dark:text-red-200 leading-relaxed font-medium">
              {reason}
            </p>
          </div>

          {/* Applicant & Target Info Card */}
          <div className="bg-white dark:bg-[#14110F] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] p-3 space-y-2">
            <div className="text-[11px] font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider border-b border-[#E4E1DC] dark:border-[#2E2A27] pb-1">
              Impormasyon ng Aplikasyon
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <User size={14} className="text-[#6B6761] dark:text-[#A8A29E] shrink-0" />
                <div>
                  <span className="text-[#6B6761] dark:text-[#A8A29E] text-[11px] block">Pangalan:</span>
                  <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{details.fullName || details.name || 'N/A'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-[#6B6761] dark:text-[#A8A29E] shrink-0" />
                <div>
                  <span className="text-[#6B6761] dark:text-[#A8A29E] text-[11px] block">TODA Asosasyon:</span>
                  <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{details.todaAssociation || details.toda || 'N/A'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Hash size={14} className="text-[#6B6761] dark:text-[#A8A29E] shrink-0" />
                <div>
                  <span className="text-[#6B6761] dark:text-[#A8A29E] text-[11px] block">Assigned Body Number:</span>
                  <span className="font-bold text-[#9E2A2B] dark:text-[#D4AF37]">{details.bodyNumber || details.enteredBodyNumber || 'N/A'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ShieldAlert size={14} className="text-[#6B6761] dark:text-[#A8A29E] shrink-0" />
                <div>
                  <span className="text-[#6B6761] dark:text-[#A8A29E] text-[11px] block">Katayuan:</span>
                  <span className="font-bold text-red-600 dark:text-red-400">HINDI APRUBADO SA ROSTER</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Steps */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 p-3 space-y-1.5">
            <h4 className="text-xs font-bold text-[#1F1D1B] dark:text-[#F6F5F3] flex items-center gap-1.5">
              <PhoneCall size={14} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
              Mga Hakbang Upang Maaprubahan:
            </h4>
            <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] leading-relaxed">
              {action}
            </p>
            <ul className="text-xs text-[#6B6761] dark:text-[#A8A29E] space-y-1 pl-4 list-disc mt-1">
              <li>Tiyaking tama ang baybay ng inyong legal na pangalan at nakatalagang Body Number.</li>
              <li>Makipag-ugnayan sa inyong TODA President upang maisumite ang certification sa BPLO.</li>
              <li>Para sa tulong, magtungo sa BPLO Office, 2nd Floor, Gasan Municipal Hall.</li>
            </ul>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-[#14110F] border-t border-[#E4E1DC] dark:border-[#2E2A27] flex flex-col sm:flex-row items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#1C1917] text-xs sm:text-sm font-bold text-[#1F1D1B] dark:text-[#F6F5F3] hover:bg-slate-100 dark:hover:bg-[#252220] transition-colors cursor-pointer"
          >
            I-edit ang Impormasyon
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#9E2A2B] hover:bg-[#7A1B22] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Naiintindihan Ko <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LguAdvisoryModal;
