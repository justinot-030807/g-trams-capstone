import React, { useState } from 'react';
import { 
  BookOpen, X, ChevronRight, FileCheck, RefreshCw, 
  ShieldCheck, HelpCircle, CheckCircle2, Clock, Sparkles,
  ExternalLink, FileText, ArrowRight
} from 'lucide-react';

const OperatorGuideModal = ({ isOpen, onClose, defaultTab = 'apply' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [expandedFaq, setExpandedFaq] = useState(null);

  if (!isOpen) return null;

  const faqs = [
    {
      q: "Gaano katagal bago maaprubahan ang prangkisa?",
      a: "Alinsunod sa Citizen's Charter ng Bayan ng Gasan at RA 11032 (ARTA), ang aplikasyon na kumpleto ang dokumento ay pinoproseso sa loob ng tatlo (3) hanggang limang (5) araw ng trabaho matapos ang beripikasyon ng inyong TODA."
    },
    {
      q: "Ano ang kailangan kapag magre-renew ng prangkisa?",
      a: "Kailangan lamang ng pinakabagong Community Tax Certificate (Cedula) para sa kasalukuyang taon at ang pinakahuling resibo ng rehistro ng motorsiklo (LTO OR/CR)."
    },
    {
      q: "Ano ang Claim Stub Voucher at saan ito gagamitin?",
      a: "Ang Claim Stub Voucher ay opisyal na katibayan na naaprubahan na ang inyong aplikasyon o renewal. Ipakita ito kasama ang fee breakdown sa Municipal Treasury para sa bayarin at pagkuha ng opisyal na sticker at MTOP certificate."
    },
    {
      q: "Ilang tricycle ang pinapayagang maiparehistro ng isang operator?",
      a: "Ayon sa umiiral na Municipal Ordinance ng Gasan, hanggang dalawang (2) unit ng tricycle lamang ang maaaring iparehistro bawat lehitimong operator."
    }
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 animate-in fade-in duration-200 select-none">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div className="relative z-10 w-full sm:max-w-2xl bg-white dark:bg-[#1C1917] rounded-t-lg sm:rounded-lg shadow-xl border-t sm:border border-[#E4E1DC] dark:border-[#2E2A27] overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-in slide-in-from-bottom duration-250">
        
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1 bg-[#E4E1DC] dark:bg-[#2E2A27] rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="relative bg-[#9E2A2B] border-b border-[#7A1B22] p-4 sm:p-5 text-white shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-[#D4AF37] font-bold shrink-0">
                <BookOpen size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base tracking-wide uppercase truncate">
                  Gabay sa Operator &amp; Portal FAQs
                </h3>
                <p className="text-xs text-[#D4AF37] font-medium mt-0.5 truncate">
                  Gasan Tricycle Regulatory &amp; Automated Management System
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Close guide"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Filter Navigation Chips */}
          <div className="flex items-center gap-1.5 mt-3.5 p-1 bg-black/25 rounded-lg border border-white/10 text-xs font-bold overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('apply')}
              className={`flex-1 min-w-[110px] py-2 px-3 rounded-md transition-all text-center cursor-pointer min-h-[44px] flex items-center justify-center ${
                activeTab === 'apply' 
                  ? 'bg-white text-[#9E2A2B] font-bold shadow-xs' 
                  : 'text-white/75 hover:text-white'
              }`}
            >
              Bagong Prangkisa
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('renew')}
              className={`flex-1 min-w-[100px] py-2 px-3 rounded-md transition-all text-center cursor-pointer min-h-[44px] flex items-center justify-center ${
                activeTab === 'renew' 
                  ? 'bg-white text-[#9E2A2B] font-bold shadow-xs' 
                  : 'text-white/75 hover:text-white'
              }`}
            >
              Renewal Guide
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('status')}
              className={`flex-1 min-w-[110px] py-2 px-3 rounded-md transition-all text-center cursor-pointer min-h-[44px] flex items-center justify-center ${
                activeTab === 'status' 
                  ? 'bg-white text-[#9E2A2B] font-bold shadow-xs' 
                  : 'text-white/75 hover:text-white'
              }`}
            >
              Status Tracker
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('faqs')}
              className={`flex-1 min-w-[80px] py-2 px-3 rounded-md transition-all text-center cursor-pointer min-h-[44px] flex items-center justify-center ${
                activeTab === 'faqs' 
                  ? 'bg-white text-[#9E2A2B] font-bold shadow-xs' 
                  : 'text-white/75 hover:text-white'
              }`}
            >
              Mga Tanong (FAQs)
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 divide-y divide-[#E4E1DC] dark:divide-[#2E2A27]">
          
          {/* TAB 1: APPLY NEW FRANCHISE */}
          {activeTab === 'apply' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-amber-500/10 border border-amber-600/30 rounded-lg p-3.5 flex items-center gap-3">
                <Sparkles size={18} className="text-[#9E2A2B] dark:text-[#D4AF37] shrink-0" />
                <p className="text-xs text-[#1F1D1B] dark:text-[#EAE7E1] font-medium">
                  3 simpleng hakbang lamang para makapag-apply ng bagong prangkisa online.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#9E2A2B] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    1
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-[#1F1D1B] dark:text-white">
                      Ilagay ang Impormasyon ng Tricycle
                    </h4>
                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] leading-relaxed font-normal">
                      Piliin ang Make/Brand (hal. Honda TMX 125), ilagay ang Motor Number, Chassis Number, Plate Number, at ang inyong Cedula Serial Number.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#9E2A2B] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    2
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-[#1F1D1B] dark:text-white">
                      I-scan o I-upload ang 4 na Dokumento
                    </h4>
                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] leading-relaxed font-normal">
                      Gamitin ang built-in camera scanner upang picturan ang: LTO OR/CR, Driver's License, TODA Endorsement, at Barangay Clearance. Pwede rin mag-upload ng JPG, PNG, WebP o PDF.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#9E2A2B] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    3
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-[#1F1D1B] dark:text-white">
                      Beripikasyon at Pagsusuri
                    </h4>
                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] leading-relaxed font-normal">
                      Awtomatikong magpapadala ng abiso sa TODA President para sa beripikasyon, bago aprubahan ng Office of the Vice Mayor Extension desk. Masusubaybayan ito sa inyong Dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RENEWAL GUIDE */}
          {activeTab === 'renew' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-emerald-500/10 border border-emerald-600/30 rounded-lg p-3.5 flex items-center gap-3">
                <RefreshCw size={18} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
                <p className="text-xs text-[#1F1D1B] dark:text-[#EAE7E1] font-medium">
                  Libre ang online renewal submission. Hindi kailangan pumila para sa paunang pagsusuri.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#9E2A2B] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    1
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-[#1F1D1B] dark:text-white">
                      Pindutin ang "Renew Franchise" sa Unit Card
                    </h4>
                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] leading-relaxed font-normal">
                      Makikita ang button na ito sa iyong My Franchise Garage kapag papalapit na ang takdang petsa ng renewal ng iyong prangkisa.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#9E2A2B] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    2
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-[#1F1D1B] dark:text-white">
                      Isumite ang Bagong Cedula at Pinakabagong OR/CR
                    </h4>
                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] leading-relaxed font-normal">
                      I-type ang 8–10 digit serial number ng Cedula para sa kasalukuyang taon at mag-attach ng malinaw na litrato ng LTO registration.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#9E2A2B] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    3
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-[#1F1D1B] dark:text-white">
                      Kumuha ng Claim Stub Voucher
                    </h4>
                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] leading-relaxed font-normal">
                      Kapag naaprubahan na ng tanggapan, i-download o i-print ang Claim Stub at dalhin sa Ingat-Yaman para sa bayarin at opisyal na sticker.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STATUS TRACKER */}
          {activeTab === 'status' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-medium">
                Ito ang 5 yugto ng prangkisa sa bawat tricycle sa iyong garahe:
              </p>

              <div className="space-y-2.5">
                <div className="p-3 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-[#E4E1DC] text-[#1F1D1B] dark:bg-[#2E2A27] dark:text-[#EAE7E1] flex items-center justify-center text-xs font-bold shrink-0">1</span>
                  <div>
                    <h5 className="text-xs font-bold text-[#1F1D1B] dark:text-white">Submitted (Naipasa)</h5>
                    <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">Natanggap na ng system ang inyong form at mga kalakip na dokumento.</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                  <div>
                    <h5 className="text-xs font-bold text-[#1F1D1B] dark:text-white">Review (Sinusuri)</h5>
                    <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">Sinusuri ng TODA President at Office of the Vice Mayor Extension ang inyong roadworthiness at mga papel.</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-[#9E2A2B]/10 text-[#9E2A2B] dark:bg-[#D4AF37]/15 dark:text-[#D4AF37] flex items-center justify-center text-xs font-bold shrink-0">3</span>
                  <div>
                    <h5 className="text-xs font-bold text-[#1F1D1B] dark:text-white">Sign (Para sa Pirma)</h5>
                    <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">Nasa opisina na ng Punong Bayan / Bise Alkalde para sa e-signature ng MTOP.</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-bold shrink-0">4</span>
                  <div>
                    <h5 className="text-xs font-bold text-[#1F1D1B] dark:text-white">Pay (Para sa Pagbabayad)</h5>
                    <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">Maaari nang i-download ang inyong Claim Stub para sa bayaran sa Municipal Treasury.</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-600/30 flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0">5</span>
                  <div>
                    <h5 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Active (Aprubado at Aktibo)</h5>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300">Kumpleto na ang prangkisa, may opisyal na MTOP certificate at legal na makakapasada.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FAQS */}
          {activeTab === 'faqs' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {faqs.map((faq, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div 
                    key={idx}
                    className="rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] overflow-hidden bg-[#F6F5F3] dark:bg-[#14110F]"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isOpen ? null : idx)}
                      className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left gap-3 cursor-pointer min-h-[44px]"
                    >
                      <span className="text-xs sm:text-sm font-bold text-[#1F1D1B] dark:text-white">
                        {faq.q}
                      </span>
                      <ChevronRight 
                        size={16} 
                        className={`text-[#6B6761] dark:text-[#A8A29E] transition-transform shrink-0 ${isOpen ? 'rotate-90' : ''}`} 
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-2 text-xs text-[#6B6761] dark:text-[#A8A29E] leading-relaxed border-t border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] font-normal">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] font-medium hidden sm:inline">
            Office of the Vice Mayor Extension • Gasan Municipal Hall
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#9E2A2B] hover:bg-[#7A1B22] text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer min-h-[44px] flex items-center justify-center shadow-xs"
          >
            Naintindihan Ko (Got It)
          </button>
        </div>

      </div>
    </div>
  );
};

export default OperatorGuideModal;
