import React, { useState } from 'react';
import { 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  Scale, 
  Building2, 
  ExternalLink,
  BookOpen
} from 'lucide-react';

const TermsPolicyModal = ({
  isOpen,
  onClose,
  onAccept,
  defaultLang = 'en',
  showAcceptButton = false
}) => {
  const [lang, setLang] = useState(defaultLang === 'fil' || defaultLang === 'tl' ? 'tl' : 'en');

  if (!isOpen) return null;

  const content = {
    tl: {
      headerTitle: "MGA TUNTUNIN SA SERBISYO AT PATAKARAN SA PRIVACY",
      headerSubtitle: "Bayan ng Gasan • Office of the Vice Mayor Extension Registry",
      closeBtn: "Isara",
      acceptBtn: "Naintindihan at Tinatanggap Ko",
      sections: [
        {
          id: 'privacy',
          title: "1. Patakaran sa Privacy at Proteksyon ng Datos",
          subtitle: "Pagsunod sa Republic Act No. 10173 (Data Privacy Act of 2012)",
          icon: ShieldCheck,
          points: [
            {
              title: "Anong Impormasyon ang Kinokolekta?",
              desc: "Kinokolekta lamang ng G-TRAMS ang mahahalagang datos tulad ng buong pangalan, contact number, tirahan (Barangay), TODA affiliation, kopya ng Driver's License, OR/CR ng motorsiklo, at Barangay Clearance para sa lehitimong pagproseso ng prangkisa."
            },
            {
              title: "Layunin ng Pagproseso ng Datos",
              desc: "Gagamitin ang inyong mga dokumento para lamang sa pagsusuri ng Office of the Vice Mayor Extension, pagtatala sa opisyal na TODA Masterlist, paglikha ng MTOP Certificate, at beripikasyon ng roadworthiness ng inyong sasakyan alinsunod sa Municipal Ordinances."
            },
            {
              title: "Seguridad at Pagtatago ng Impormasyon",
              desc: "Lahat ng personal na tala at mga larawan ng dokumento ay ligtas na naka-encrypt sa cloud database ng Munisipyo. Hindi kailanman ibebenta, ipamamahagi, o ipapagamit ang inyong mga datos sa mga pribadong ahensya o third-party advertisers."
            },
            {
              title: "Karapatan ng Operator bilang Data Subject",
              desc: "May karapatan kayong humiling ng pagwawasto sa inyong maling impormasyon, magbago ng inyong contact number sa Settings, o humingi ng opisyal na kopya ng inyong talaan sa pamamagitan ng direktang pagdulog sa Office of the Vice Mayor Extension Office."
            }
          ]
        },
        {
          id: 'terms',
          title: "2. Mga Tuntunin at Kondisyon sa Serbisyo",
          subtitle: "Mga Panuntunan ng Bayan ng Gasan para sa Tricycle Franchise Operators",
          icon: Scale,
          points: [
            {
              title: "Awtorisadong Paggamit ng Account",
              desc: "Ang bawat rehistradong account sa G-TRAMS ay personal sa may-ari ng prangkisa o tsuper. Mahigpit na ipinagbabawal ang pagpapahiram, pagbebenta, o paggamit ng ibang pagkakakilanlan upang makapasok sa sistema."
            },
            {
              title: "Katapatan at Katunayan ng mga Dokumento",
              desc: "Ang sinumang magsumite ng palsipikado o pekeng dokumento (pekeng OR/CR, pekeng lisensya) ay awtomatikong madidiskwalipika, kakanselahin ang prangkisa, at sasampahan ng kasong administratibo o kriminal sa ilalim ng batas."
            },
            {
              title: "Pagsunod sa Taripa at Ordinansa ng Bayan",
              desc: "Ang pagtanggap ng aprubadong MTOP ay may kaakibat na pananagutan na sundin ang opisyal na taripa ng pamasahe, magkabit ng wastong body number, at sumunod sa itinakdang rota ng kinabibilangang TODA."
            },
            {
              title: "Pag-renew at Pagbabayad sa Takdang Panahon",
              desc: "Ang prangkisa ay may bisa ng isang (1) taon mula sa petsa ng pag-apruba. Ang kabiguang magsumite ng renewal bago ang itinakdang deadline ay magpapataw ng kaukulang surcharges ayon sa Revenue Code ng Bayan ng Gasan."
            }
          ]
        },
        {
          id: 'dpa',
          title: "3. Citizen's Charter at Pamantayan ng ARTA",
          subtitle: "Pagsunod sa RA 11032 (Ease of Doing Business) at Pamamahala ng LGU",
          icon: Building2,
          points: [
            {
              title: "Pamantayan sa Oras ng Pagproseso (ARTA Compliance)",
              desc: "Alinsunod sa RA 11032 (Ease of Doing Business), ang bagong aplikasyon o renewal ng prangkisa na kumpleto ang dokumento ay pinoproseso ng Office of the Vice Mayor Extension sa loob ng tatlo (3) hanggang limang (5) araw ng trabaho."
            },
            {
              title: "Data Protection Officer (DPO) ng Munisipyo",
              desc: "Maaaring makipag-ugnayan sa itinalagang Data Protection Officer ng Munisipyo ng Gasan para sa anumang katanungan ukol sa privacy at seguridad ng inyong datos sa dpo@gasan.ph."
            },
            {
              title: "Aksyon Laban sa Pangingikil at Red Tape",
              desc: "Mahigpit na ipinagbabawal ang anumang uri ng suhol, pangingikil, o facilitation fees. Ang lahat ng opisyal na bayarin ay binabayaran lamang sa Municipal Treasury na may kaakibat na Official Receipt (OR)."
            }
          ]
        }
      ]
    },
    en: {
      headerTitle: "MUNICIPAL TERMS OF SERVICE & DATA PRIVACY POLICY",
      headerSubtitle: "Municipality of Gasan • Office of the Vice Mayor Extension Registry",
      closeBtn: "Close",
      acceptBtn: "I Understand & Accept",
      sections: [
        {
          id: 'privacy',
          title: "1. Data Privacy Policy & Protection",
          subtitle: "Compliance with Republic Act No. 10173 (Data Privacy Act of 2012)",
          icon: ShieldCheck,
          points: [
            {
              title: "What Information is Collected?",
              desc: "GTRAMS collects strictly necessary operator data including full legal name, contact telephone, residence (Barangay), TODA affiliation, Driver's License copy, vehicle LTO OR/CR, and Barangay Clearance for legitimate municipal franchise processing."
            },
            {
              title: "Purpose of Data Processing",
              desc: "Your records and uploaded documents are utilized solely for Office of the Vice Mayor Extension review, entry into the official TODA Masterlist, MTOP Certificate generation, and roadworthiness verification pursuant to Gasan Municipal Ordinances."
            },
            {
              title: "Security and Cloud Storage",
              desc: "All personal information and document scans are encrypted and safely stored in the municipality's secure cloud database. Data is never sold, shared, or released to private marketing companies or third-party advertisers."
            },
            {
              title: "Operator Rights as Data Subject",
              desc: "You retain full rights under Philippine Law to inspect your registered details, request corrections to erroneous data, update your mobile phone number in Settings, or obtain official copies directly at the Office of the Vice Mayor Extension Office."
            }
          ]
        },
        {
          id: 'terms',
          title: "2. Municipal Terms of Service",
          subtitle: "Gasan Municipal Transportation & Franchising Regulatory Board Guidelines",
          icon: Scale,
          points: [
            {
              title: "Authorized Account Usage",
              desc: "Each registered GTRAMS account is personal to the designated franchise owner or driver. Transferring, sharing credentials, or assuming false identities is strictly prohibited and subject to immediate account revocation."
            },
            {
              title: "Integrity of Submitted Documentation",
              desc: "Submitting counterfeit, altered, or fraudulent documents (such as fake OR/CR or licenses) will lead to immediate disqualification, franchise cancellation, and legal prosecution under the Revised Penal Code."
            },
            {
              title: "Fare Matrix & Municipal Ordinances",
              desc: "Possession of an active MTOP carries the binding obligation to honor the official municipal fare matrix, display body numbers legibly, and operate within the designated TODA route boundaries."
            },
            {
              title: "Timely Renewal and Regulatory Fees",
              desc: "Franchises remain valid for one (1) calendar year from the date of release. Failure to submit renewal applications prior to the annual deadline incurs surcharges mandated by the Gasan Municipal Revenue Code."
            }
          ]
        },
        {
          id: 'dpa',
          title: "3. Citizen's Charter & ARTA Standards",
          subtitle: "Anti-Red Tape Authority (RA 11032) & Municipal Service Guarantees",
          icon: Building2,
          points: [
            {
              title: "Guaranteed Turnaround Times",
              desc: "In accordance with RA 11032 (Ease of Doing Business and Efficient Government Service Delivery Act of 2018), franchise applications with complete requirements are processed within 3 to 5 business days."
            },
            {
              title: "Municipal Data Protection Officer",
              desc: "For inquiries or formal requests regarding your data privacy, contact the Gasan LGU Data Protection Officer at dpo@gasan.ph or visit the Municipal Legal Office."
            },
            {
              title: "Zero-Tolerance Anti-Graft Provision",
              desc: "GTRAMS strictly enforces anti-corruption policies. No facilitation fees or unauthorized charges are allowed. All payments must be made exclusively through official treasury counters with valid Official Receipts (OR)."
            }
          ]
        }
      ]
    }
  };

  const current = content[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-card-entrance">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#7A1B22] via-[#8E2028] to-[#5A1419] p-5 sm:p-6 text-white shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 p-1.5 flex items-center justify-center shrink-0">
                <img src="/gasan-logo.png" alt="Gasan Seal" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-sm sm:text-base tracking-wide uppercase truncate">
                  {current.headerTitle}
                </h3>
                <p className="text-xs text-[#D4AF37] font-semibold mt-0.5 truncate">
                  {current.headerSubtitle}
                </p>
              </div>
            </div>

            {/* Language Toggle & Close Button */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setLang(l => l === 'en' ? 'tl' : 'en')}
                className="px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors cursor-pointer"
                title="Switch Language"
              >
                {lang === 'en' ? 'Tagalog' : 'English'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Single Continuous Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-7 text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed divide-y divide-slate-100 dark:divide-slate-800">
          {current.sections.map((section, sIdx) => {
            const SectionIcon = section.icon;
            return (
              <div key={section.id} className={sIdx > 0 ? "pt-6 space-y-4" : "space-y-4"}>
                {/* Section Header */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#7A1B22]/10 dark:bg-[#D4AF37]/15 text-[#7A1B22] dark:text-[#D4AF37] flex items-center justify-center shrink-0 mt-0.5">
                    <SectionIcon size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      {section.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {section.subtitle}
                    </p>
                  </div>
                </div>

                {/* Section Points */}
                <div className="space-y-3 pl-0 sm:pl-3">
                  {section.points.map((pt, pIdx) => (
                    <div 
                      key={pIdx} 
                      className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1 hover:border-[#D4AF37]/50 transition-colors"
                    >
                      <h5 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#7A1B22] dark:bg-[#D4AF37] shrink-0" />
                        {pt.title}
                      </h5>
                      <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed font-normal pl-3.5">
                        {pt.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Municipal Helpdesk Banner */}
          <div className="pt-6">
            <div className="p-4 rounded-2xl bg-[#7A1B22]/5 dark:bg-[#7A1B22]/15 border border-[#7A1B22]/15 dark:border-[#7A1B22]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Office of the Vice Mayor Extension &amp; MTFRB Municipal Office</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Gasan Municipal Hall, Ground Floor • ovm-extension@gasan.ph</p>
              </div>
              <a 
                href="https://gasan.ph" 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7A1B22] hover:bg-[#5a1419] text-white font-bold transition-colors shrink-0"
              >
                <span>Visit gasan.ph</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer min-h-[44px]"
          >
            {current.closeBtn}
          </button>
          {showAcceptButton && onAccept && (
            <button
              type="button"
              onClick={() => {
                onAccept();
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7A1B22] to-[#5A1419] text-white font-bold text-xs uppercase tracking-wider hover:shadow-md transition-all cursor-pointer min-h-[44px]"
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
