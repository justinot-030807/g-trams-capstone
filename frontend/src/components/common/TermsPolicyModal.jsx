import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  X, 
  Globe, 
  CheckCircle2, 
  Scale, 
  Building2, 
  Phone, 
  Mail, 
  Lock,
  ExternalLink
} from 'lucide-react';

const TermsPolicyModal = ({
  isOpen,
  onClose,
  onAccept,
  defaultLang = 'tl',
  showAcceptButton = false
}) => {
  const [lang, setLang] = useState(defaultLang === 'fil' || defaultLang === 'tl' ? 'tl' : 'en');

  if (!isOpen) return null;

  const content = {
    tl: {
      title: "MGA TUNTUNIN AT PROTEKSYON NG DATOS",
      subtitle: "Bayan ng Gasan, Marinduque • BPLO & MTFRB Portal",
      tag: "Pinasimpleng Gabay para sa mga Tricycle Operators",
      closeBtn: "Isara",
      acceptBtn: "Naintindihan at Tinatanggap Ko",
      points: [
        {
          icon: ShieldCheck,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10",
          title: "1. Paggamit ng Opisyal na Sistema",
          desc: "Ang G-TRAMS ay nakalaan lamang para sa mga lehitimong tricycle operators, tsuper, at kasapi ng rehistradong TODA sa bayan ng Gasan. Bawal ipagamit, ipahiram, o ibenta ang inyong login credentials."
        },
        {
          icon: Lock,
          color: "text-blue-500",
          bg: "bg-blue-500/10",
          title: "2. Proteksyon ng Inyong Impormasyon (RA 10173)",
          desc: "Ligtas at protektado ang inyong personal na impormasyon (Pangalan, Contact, OR/CR, at ID). Gagamitin lamang ito ng Munisipyo ng Gasan para sa pag-isyu at pag-renew ng inyong prangkisa. Hindi ito kailanman ibebenta o ipamamahagi sa mga pribadong kumpanya."
        },
        {
          icon: FileText,
          color: "text-amber-500",
          bg: "bg-amber-500/10",
          title: "3. Katapatan sa mga Dokumento",
          desc: "Tungkulin ng bawat operator na tiyaking totoo, malinaw, at hindi peke ang mga dokumentong ia-upload. Ang pagsumite ng pekeng OR/CR o pekeng lisensya ay may karampatang pagkansela ng prangkisa at aksyong legal ayon sa Municipal Ordinance."
        },
        {
          icon: Building2,
          color: "text-rose-500",
          bg: "bg-rose-500/10",
          title: "4. Opisyal na Suporta at Tulong",
          desc: "Para sa anumang katanungan o gabay sa aplikasyon, bukas ang BPLO Office sa Gasan Municipal Hall tuwing Lunes hanggang Biyernes, 8:00 AM – 5:00 PM, o mag-email sa bplo@gasan.gov.ph."
        }
      ]
    },
    en: {
      title: "TERMS OF USE & PRIVACY POLICY",
      subtitle: "Municipality of Gasan, Marinduque • BPLO & MTFRB Portal",
      tag: "Simplified Guidelines for Tricycle Operators",
      closeBtn: "Close",
      acceptBtn: "I Understand & Accept",
      points: [
        {
          icon: ShieldCheck,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10",
          title: "1. Authorized System Use",
          desc: "G-TRAMS is exclusively intended for legitimate motorized tricycle operators, drivers, and registered TODA members within the Municipality of Gasan. Sharing or transferring account credentials is strictly prohibited."
        },
        {
          icon: Lock,
          color: "text-blue-500",
          bg: "bg-blue-500/10",
          title: "2. Data Privacy & Confidentiality (RA 10173)",
          desc: "Your personal information (Name, Contact, OR/CR, and IDs) is encrypted and securely stored. Data is processed solely for official franchise regulatory and licensing purposes and will never be sold or shared for commercial use."
        },
        {
          icon: FileText,
          color: "text-amber-500",
          bg: "bg-amber-500/10",
          title: "3. Accuracy of Submitted Documents",
          desc: "Applicants are strictly responsible for submitting valid, authentic, and clear copies of vehicle and licensing documents. Submission of fraudulent records is subject to immediate franchise revocation and legal sanctions."
        },
        {
          icon: Building2,
          color: "text-rose-500",
          bg: "bg-rose-500/10",
          title: "4. Official Support & Helpdesk",
          desc: "For assistance or questions regarding your franchise application, visit the BPLO at Gasan Municipal Hall, Monday to Friday from 8:00 AM to 5:00 PM, or email bplo@gasan.gov.ph."
        }
      ]
    }
  };

  const current = content[lang] || content.tl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#7A1B22] to-[#5A1419] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 p-1 flex items-center justify-center border border-white/20 shrink-0">
              <img src="/gasan-logo.png" alt="Gasan Seal" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-wide uppercase">{current.title}</h2>
              <p className="text-[#D4AF37] text-[10px] sm:text-[11px] font-medium">{current.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <button
              type="button"
              onClick={() => setLang(lang === 'tl' ? 'en' : 'tl')}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold tracking-wider uppercase border border-white/20 transition-all flex items-center gap-1 cursor-pointer"
              title="Palitan ang Wika / Switch Language"
            >
              <Globe size={12} />
              <span>{lang === 'tl' ? 'English' : 'Tagalog'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* NOTICE PILL */}
        <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500" />
            {current.tag}
          </span>
          <span className="text-[10px] font-mono">DPA RA 10173 • RA 7160</span>
        </div>

        {/* MODAL BODY (4 Clean Cards) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {current.points.map((point, idx) => {
            const IconComponent = point.icon;
            return (
              <div 
                key={idx} 
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3 hover:border-[#D4AF37]/50 transition-colors"
              >
                <div className={`p-2 rounded-xl ${point.bg} ${point.color} shrink-0 mt-0.5`}>
                  <IconComponent size={18} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {point.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                    {point.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 transition-colors cursor-pointer"
          >
            {current.closeBtn}
          </button>
          {showAcceptButton && (
            <button
              type="button"
              onClick={() => {
                if (onAccept) onAccept();
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7A1B22] to-[#5A1419] hover:brightness-110 shadow-md transition-all cursor-pointer"
            >
              {current.acceptBtn}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default TermsPolicyModal;
