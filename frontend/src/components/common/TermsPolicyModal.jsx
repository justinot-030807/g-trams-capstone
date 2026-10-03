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
import { 
  HELP_DESK_EMAIL, 
  MUNICIPAL_WEBSITE, 
  MUNICIPAL_OFFICE_NAME, 
  MUNICIPAL_OFFICE_SHORT,
  OFFICE_LOCATION
} from '../../utils/contactConfig';

/**
 * G-TRAMS Terms of Service and Data Privacy Policy Modal
 * Municipality of Gasan, Marinduque
 * 
 * TODO Items for Municipal Office / Legal Confirmation:
 * 1. Data Retention Period: Confirm official retention duration for tricycle franchise records, OR/CR, and Driver's License scans (e.g. 5 years per COA/LGU guidelines).
 * 2. Data Subject Rights: Confirm LGU procedure for operator data deletion/rectification requests under RA 10173.
 * 3. Data Protection Officer (DPO): Confirm the designated municipal DPO email address and official contact number.
 * 4. Cloud Storage Encryption: Verify cloud encryption standards (AES-256 at rest, TLS 1.3 in transit) with LGU IT administrators.
 */

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
      headerSubtitle: `Bayan ng Gasan • ${MUNICIPAL_OFFICE_SHORT} Registry`,
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
              desc: `Gagamitin ang inyong mga dokumento para lamang sa pagsusuri ng ${MUNICIPAL_OFFICE_NAME}, pagtatala sa opisyal na TODA Masterlist, paglikha ng MTOP Certificate, at beripikasyon ng roadworthiness ng inyong sasakyan alinsunod sa Municipal Ordinances.`
            },
            {
              // TODO: Verify cloud encryption standards (e.g. AES-256 at rest, TLS 1.3 in transit) and specify precise cloud retention duration with LGU IT administrators.
              title: "Seguridad at Pagtatago ng Impormasyon",
              desc: "Lahat ng personal na tala at mga larawan ng dokumento ay ligtas na naka-encrypt sa cloud database ng Munisipyo. Ang mga rekord ay itinatago ayon sa panuntunan ng National Archives of the Philippines at LGU record retention schedules. Hindi kailanman ibebenta o ipamamahagi ang inyong datos sa mga pribadong ahensya."
            },
            {
              // TODO: Confirm formal LGU procedure for data subject rights (access, correction, deletion) under RA 10173.
              title: "Karapatan ng Operator bilang Data Subject",
              desc: `May karapatan kayong humiling ng pagwawasto sa inyong maling impormasyon, magbago ng inyong contact number sa Settings, o humingi ng opisyal na kopya ng inyong talaan sa pamamagitan ng direktang pagdulog sa ${MUNICIPAL_OFFICE_NAME}.`
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
              desc: `Alinsunod sa RA 11032 (Ease of Doing Business), ang bagong aplikasyon o renewal ng prangkisa na kumpleto ang dokumento ay pinoproseso ng ${MUNICIPAL_OFFICE_SHORT} sa loob ng tatlo (3) hanggang limang (5) araw ng trabaho.`
            },
            {
              // TODO: Confirm the designated municipal DPO email address and official contact number.
              title: "Data Protection Officer (DPO) ng Munisipyo",
              desc: `Maaaring makipag-ugnayan sa itinalagang Data Protection Officer ng Munisipyo ng Gasan para sa anumang katanungan ukol sa privacy at seguridad ng inyong datos sa dpo@gasan.ph o sa ${HELP_DESK_EMAIL}.`
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
      headerSubtitle: `Municipality of Gasan • ${MUNICIPAL_OFFICE_SHORT} Registry`,
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
              desc: "G-TRAMS collects strictly necessary operator data including full legal name, contact telephone, residence (Barangay), TODA affiliation, Driver's License copy, vehicle LTO OR/CR, and Barangay Clearance for legitimate municipal franchise processing."
            },
            {
              title: "Purpose of Data Processing",
              desc: `Your records and uploaded documents are utilized solely for ${MUNICIPAL_OFFICE_NAME} review, entry into the official TODA Masterlist, MTOP Certificate generation, and roadworthiness verification pursuant to Gasan Municipal Ordinances.`
            },
            {
              // TODO: Verify cloud encryption standards (AES-256 at rest, TLS 1.3 in transit) and specify precise cloud retention duration with LGU IT administrators.
              title: "Security and Cloud Storage",
              desc: "All personal information and document scans are encrypted and safely stored in the municipality's secure cloud database. Records are retained in accordance with National Archives and LGU retention schedules. Data is never sold, shared, or released to private marketing companies or third-party advertisers."
            },
            {
              // TODO: Confirm formal LGU procedure for data subject rights (access, correction, deletion) under RA 10173.
              title: "Operator Rights as Data Subject",
              desc: `You retain full rights under Philippine Law to inspect your registered details, request corrections to erroneous data, update your mobile phone number in Settings, or obtain official copies directly at the ${MUNICIPAL_OFFICE_NAME}.`
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
              desc: "Each registered G-TRAMS account is personal to the designated franchise owner or driver. Transferring, sharing credentials, or assuming false identities is strictly prohibited and subject to immediate account revocation."
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
              // TODO: Confirm the designated municipal DPO email address and official contact number.
              title: "Municipal Data Protection Officer",
              desc: `For inquiries or formal requests regarding your data privacy, contact the Gasan LGU Data Protection Officer at dpo@gasan.ph or the Helpdesk at ${HELP_DESK_EMAIL}.`
            },
            {
              title: "Zero-Tolerance Anti-Graft Provision",
              desc: "G-TRAMS strictly enforces anti-corruption policies. No facilitation fees or unauthorized charges are allowed. All payments must be made exclusively through official treasury counters with valid Official Receipts (OR)."
            }
          ]
        }
      ]
    }
  };

  const current = content[lang];
  const shouldShowAccept = showAcceptButton || Boolean(onAccept);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 select-none animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1C1917] rounded-lg shadow-xl border border-[#E4E1DC] dark:border-[#2E2A27] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="relative bg-[#9E2A2B] p-4 sm:p-6 text-white shrink-0 border-b-2 border-[#D4AF37]">
          <div className="flex items-center justify-between gap-2.5 sm:gap-4">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 p-1.5 flex items-center justify-center shrink-0">
                <img src="/gasan-logo.png" alt="Gasan Seal" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-xs sm:text-sm md:text-base tracking-wide uppercase leading-tight break-words">
                  {current.headerTitle}
                </h3>
                <p className="text-[10px] sm:text-xs text-[#D4AF37] font-semibold mt-0.5 leading-snug break-words">
                  {current.headerSubtitle}
                </p>
              </div>
            </div>

            {/* Language Toggle & Close Button */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setLang(l => l === 'en' ? 'tl' : 'en')}
                className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors cursor-pointer min-h-[36px]"
                title="Switch Language"
              >
                {lang === 'en' ? 'Tagalog' : 'English'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Single Continuous Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-7 text-[#1F1D1B] dark:text-[#EAE7E1] text-xs sm:text-sm leading-relaxed divide-y divide-[#E4E1DC] dark:divide-[#2E2A27]">
          {current.sections.map((section, sIdx) => {
            const SectionIcon = section.icon;
            return (
              <div key={section.id} className={sIdx > 0 ? "pt-6 space-y-4" : "space-y-4"}>
                {/* Section Header */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center shrink-0 mt-0.5">
                    <SectionIcon size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-[#1F1D1B] dark:text-[#F6F5F3]">
                      {section.title}
                    </h4>
                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-medium">
                      {section.subtitle}
                    </p>
                  </div>
                </div>

                {/* Section Points */}
                <div className="space-y-3 pl-0 sm:pl-3">
                  {section.points.map((pt, pIdx) => (
                    <div 
                      key={pIdx} 
                      className="p-3.5 sm:p-4 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] space-y-1 hover:border-[#D4AF37] transition-colors"
                    >
                      <h5 className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3] text-xs sm:text-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#9E2A2B] dark:bg-[#D4AF37] shrink-0" />
                        {pt.title}
                      </h5>
                      <p className="text-[#6B6761] dark:text-[#A8A29E] text-xs leading-relaxed font-normal pl-3.5">
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
            <div className="p-4 rounded-lg bg-[#9E2A2B]/5 dark:bg-[#9E2A2B]/15 border border-[#9E2A2B]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{MUNICIPAL_OFFICE_NAME} &amp; MTFRB</p>
                <p className="text-[#6B6761] dark:text-[#A8A29E] mt-0.5">{OFFICE_LOCATION} • {HELP_DESK_EMAIL}</p>
              </div>
              <a 
                href={MUNICIPAL_WEBSITE} 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#9E2A2B] hover:bg-[#7A1B22] text-white font-bold transition-colors shrink-0 min-h-[40px]"
              >
                <span>Visit gasan.ph</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] font-bold text-xs uppercase tracking-wider hover:bg-[#F6F5F3] dark:hover:bg-[#14110F] transition-colors cursor-pointer min-h-[44px]"
          >
            {current.closeBtn}
          </button>
          {shouldShowAccept && (
            <button
              type="button"
              onClick={() => {
                if (onAccept) onAccept();
                onClose();
              }}
              className="px-6 py-2.5 rounded-lg bg-[#9E2A2B] hover:bg-[#7A1B22] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-colors cursor-pointer min-h-[44px]"
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
