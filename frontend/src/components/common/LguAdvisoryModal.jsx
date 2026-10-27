import React from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Building2, 
  User, 
  Hash, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  PhoneCall,
  FileCheck2
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const LguAdvisoryModal = ({ isOpen, onClose, advisory, message, applicantData }) => {
  const { language } = useLanguage() || { language: 'en' };
  const isTagalog = language === 'fil' || language === 'tl';

  if (!isOpen) return null;

  const defaultTitle = isTagalog 
    ? 'Opisyal na Advisory ng Pamahalaang Bayan ng Gasan'
    : 'Official Municipal Advisory';

  const defaultDepartment = isTagalog
    ? 'Business Permits and Licensing Office (BPLO) • Tanggapan ng Sangguniang Bayan'
    : 'Business Permits and Licensing Office (BPLO) • Sangguniang Bayan';

  const defaultOrdinance = isTagalog
    ? 'Municipal Ordinance No. 2020-04 (Mandatory Roster Endorsement)'
    : 'Municipal Ordinance No. 2020-04 (Mandatory TODA Roster Endorsement)';

  const defaultReason = isTagalog
    ? 'Walang natagpuang aprubadong rekord sa opisyal na masterlist ng napiling TODA para sa inyong pangalan at Body Number.'
    : 'No active or verified record was found in the official TODA Masterlist for the specified applicant name and Body Number.';

  const defaultAction = isTagalog
    ? 'Makipag-ugnayan sa inyong TODA President upang maisama ang inyong pangalan at Body Number sa sertipikadong masterlist ng BPLO.'
    : 'Please coordinate with your TODA President to confirm your unit is listed on the certified roster submitted to BPLO.';

  const title = advisory?.title || defaultTitle;
  const department = advisory?.department || defaultDepartment;
  const ordinance = advisory?.ordinance || defaultOrdinance;
  const reason = advisory?.reason || message || defaultReason;
  const action = advisory?.action || defaultAction;
  const details = advisory?.details || applicantData || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-[#1C1917] rounded-2xl border border-[#E4E1DC] dark:border-[#2E2A27] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lgu-advisory-title"
      >
        {/* Subtle Brand Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#9E2A2B] via-[#D4AF37] to-[#9E2A2B]" />

        {/* Header with Official Municipal Branding */}
        <div className="p-4 sm:p-5 border-b border-[#E4E1DC] dark:border-[#2E2A27] flex items-start gap-3.5 bg-[#FAF9F7] dark:bg-[#14110F]">
          <div className="w-11 h-11 rounded-xl bg-white dark:bg-[#1C1917] p-1 border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs shrink-0 flex items-center justify-center">
            <img 
              src="/gasan-logo.png" 
              alt="Seal of Gasan" 
              className="w-full h-full object-contain" 
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold tracking-widest text-[#9E2A2B] dark:text-[#D4AF37] uppercase block">
              {isTagalog ? 'Pamahalaang Bayan ng Gasan • Marinduque' : 'Municipality of Gasan • Province of Marinduque'}
            </span>
            <h2 id="lgu-advisory-title" className="text-base sm:text-lg font-bold text-[#1F1D1B] dark:text-[#F6F5F3] leading-snug">
              {title}
            </h2>
            <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
              {department}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6B6761] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] hover:bg-[#EAE7E1] dark:hover:bg-[#2E2A27] transition-colors cursor-pointer shrink-0"
            aria-label="Close advisory"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          
          {/* Legal Reference Tag */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 text-amber-900 dark:text-amber-200">
            <ShieldAlert size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs font-semibold leading-tight">
              {isTagalog ? 'BATAYAN:' : 'LEGAL BASIS:'} {ordinance}
            </span>
          </div>

          {/* Reason Notice Box */}
          <div className="p-3.5 rounded-xl bg-[#FEF2F2] dark:bg-red-950/20 border border-red-200 dark:border-red-900/50">
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-1">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{isTagalog ? 'Dahilan ng Harang sa Rehistrasyon' : 'Registration Roster Requirement'}</span>
            </div>
            <p className="text-xs text-red-950 dark:text-red-200 leading-relaxed font-medium mt-1">
              {reason}
            </p>
          </div>

          {/* Structured Applicant Snapshot */}
          <div className="bg-[#FAF9F7] dark:bg-[#14110F] rounded-xl border border-[#E4E1DC] dark:border-[#2E2A27] p-3.5 space-y-2.5">
            <div className="text-[11px] font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider pb-1.5 border-b border-[#E4E1DC]/80 dark:border-[#2E2A27]/80">
              {isTagalog ? 'Impormasyon ng Aplikasyon' : 'Application Details'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2">
                <User size={14} className="text-[#6B6761] dark:text-[#A8A29E] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] block">
                    {isTagalog ? 'Pangalan:' : 'Applicant Name:'}
                  </span>
                  <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                    {details.fullName || details.name || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Building2 size={14} className="text-[#6B6761] dark:text-[#A8A29E] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] block">
                    {isTagalog ? 'TODA Asosasyon:' : 'TODA Association:'}
                  </span>
                  <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                    {details.todaAssociation || details.toda || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Hash size={14} className="text-[#6B6761] dark:text-[#A8A29E] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] block">
                    {isTagalog ? 'Assigned Body Number:' : 'Assigned Body Number:'}
                  </span>
                  <span className="font-mono font-bold text-[#9E2A2B] dark:text-[#D4AF37]">
                    {details.bodyNumber || details.enteredBodyNumber || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <FileCheck2 size={14} className="text-[#6B6761] dark:text-[#A8A29E] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] block">
                    {isTagalog ? 'Katayuan sa Roster:' : 'Roster Verification:'}
                  </span>
                  <span className="inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
                    {isTagalog ? 'Hindi Nakatala' : 'Unverified / Not in Masterlist'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Next Steps */}
          <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-2">
            <h4 className="text-xs font-bold text-[#1F1D1B] dark:text-[#F6F5F3] flex items-center gap-1.5">
              <PhoneCall size={14} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
              <span>{isTagalog ? 'Mga Hakbang Upang Maaprubahan:' : 'Next Steps to Complete Accreditation:'}</span>
            </h4>
            <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] leading-relaxed">
              {action}
            </p>
            <ul className="text-xs text-[#6B6761] dark:text-[#A8A29E] space-y-1.5 pl-4 list-disc">
              <li>
                {isTagalog 
                  ? 'Tiyaking tama ang baybay ng inyong opisyal na pangalan at nakatalagang Body Number.'
                  : 'Verify that the spelling of your full legal name and assigned Body Number exactly match your TODA record.'}
              </li>
              <li>
                {isTagalog 
                  ? 'Makipag-ugnayan sa inyong TODA President upang maisumite ang certification sa BPLO.'
                  : 'Coordinate with your TODA President to submit certified membership documentation to the BPLO.'}
              </li>
              <li>
                {isTagalog
                  ? 'Para sa karagdagang tulong, magtungo sa BPLO Licensing Office, 2nd Floor, Gasan Municipal Hall.'
                  : 'For in-person assistance, visit the BPLO Licensing Office, 2nd Floor, Gasan Municipal Hall.'}
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-[#FAF9F7] dark:bg-[#14110F] border-t border-[#E4E1DC] dark:border-[#2E2A27] flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] transition-colors cursor-pointer"
          >
            {isTagalog ? 'I-edit ang Impormasyon' : 'Review Information'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-lg bg-[#9E2A2B] hover:bg-[#7A1B22] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            <span>{isTagalog ? 'Naiintindihan Ko' : 'Acknowledge Notice'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LguAdvisoryModal;
