import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  X, 
  CheckCircle2, 
  Scale, 
  Building2, 
  Phone, 
  Mail, 
  Lock,
  ExternalLink,
  BookOpen
} from 'lucide-react';

const TermsPolicyModal = ({
  isOpen,
  onClose,
  onAccept,
  initialTab = 'privacy',
  defaultLang = 'en',
  showAcceptButton = false
}) => {
  const [lang, setLang] = useState(defaultLang === 'fil' || defaultLang === 'tl' ? 'tl' : 'en');
  const [activeTab, setActiveTab] = useState(initialTab || 'privacy');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const content = {
    tl: {
      tabs: {
        privacy: "Patakaran sa Privacy",
        terms: "Mga Tuntunin sa Serbisyo",
        dpa: "Data Privacy & ARTA"
      },
      closeBtn: "Isara",
      acceptBtn: "Naintindihan at Tinatanggap Ko",
      sections: {
        privacy: {
          title: "PATAKARAN SA PRIVACY AT PROTEKSYON NG DATOS",
          subtitle: "Pagsunod sa Republic Act No. 10173 (Data Privacy Act of 2012)",
          points: [
            {
              title: "1. Anong Impormasyon ang Kinokolekta?",
              desc: "Kinokolekta lamang ng G-TRAMS ang mahahalagang datos tulad ng buong pangalan, contact number, tirahan (Barangay), TODA affiliation, kopya ng Driver's License, OR/CR ng motorsiklo, at Barangay Clearance para sa lehitimong pagproseso ng prangkisa."
            },
            {
              title: "2. Layunin ng Pagproseso ng Datos",
              desc: "Gagamitin ang inyong mga dokumento para lamang sa pagsusuri ng Office of the Vice Mayor Extension, pagtatala sa opisyal na TODA Masterlist, paglikha ng MTOP Certificate, at beripikasyon ng roadworthiness ng inyong sasakyan alinsunod sa Municipal Ordinances."
            },
            {
              title: "3. Seguridad at Pagtatago ng Impormasyon",
              desc: "Lahat ng personal na tala at mga larawan ng dokumento ay ligtas na naka-encrypt sa cloud database ng Munisipyo. Hindi kailanman ibebenta, ipamamahagi, o ipapagamit ang inyong mga datos sa mga pribadong ahensya o third-party advertisers."
            },
            {
              title: "4. Karapatan ng Operator bilang Data Subject",
              desc: "May karapatan kayong humiling ng pagwawasto sa inyong maling impormasyon, magbago ng inyong contact number sa Settings, o humingi ng opisyal na kopya ng inyong talaan sa pamamagitan ng direktang pagdulog sa Office of the Vice Mayor Extension Office."
            }
          ]
        },
        terms: {
          title: "MGA TUNTUNIN AT KONDISYON SA SERBISYO",
          subtitle: "Mga Panuntunan ng Bayan ng Gasan para sa Tricycle Franchise Operators",
          points: [
            {
              title: "1. Awtorisadong Paggamit ng Account",
              desc: "Ang bawat rehistradong account sa G-TRAMS ay personal sa may-ari ng prangkisa o tsuper. Mahigpit na ipinagbabawal ang pagpapahiram, pagbebenta, o paggamit ng ibang pagkakakilanlan upang makapasok sa sistema."
            },
            {
              title: "2. Katapatan at Katunayan ng mga Dokumento",
              desc: "Ang sinumang magsumite ng palsipikado o pekeng dokumento (pekeng OR/CR, pekeng lisensya) ay awtomatikong madidiskwalipika, kakanselahin ang prangkisa, at sasampahan ng kasong administratibo o kriminal sa ilalim ng batas."
            },
            {
              title: "3. Pagsunod sa Taripa at Ordinansa ng Bayan",
              desc: "Ang pagtanggap ng aprubadong MTOP ay may kaakibat na pananagutan na sundin ang opisyal na taripa ng pamasahe, magkabit ng wastong body number, at sumunod sa itinakdang rota ng kinabibilangang TODA."
            },
            {
              title: "4. Pag-renew at Pagbabayad sa Takdang Panahon",
              desc: "Ang prangkisa ay may bisa ng isang (1) taon mula sa petsa ng pag-apruba. Ang kabiguang magsumite ng renewal bago ang itinakdang deadline ay magpapataw ng kaukulang surcharges ayon sa Revenue Code ng Bayan ng Gasan."
            }
          ]
        },
        dpa: {
          title: "DATA PRIVACY ACT AT CITIZEN'S CHARTER",
          subtitle: "Pamantayan ng Anti-Red Tape Authority (ARTA) at LGU Transparency",
          points: [
            {
              title: "1. Pamantayan sa Oras ng Pagproseso (ARTA Compliance)",
              desc: "Alinsunod sa RA 11032 (Ease of Doing Business), ang bagong aplikasyon o renewal ng prangkisa na kumpleto ang dokumento ay pinoproseso ng Office of the Vice Mayor Extension sa loob ng tatlo (3) hanggang limang (5) araw ng trabaho."
            },
            {
              title: "2. Data Protection Officer (DPO) ng Munisipyo",
              desc: "Maaaring makipag-ugnayan sa itinalagang Data Protection Officer ng Munisipyo ng Gasan para sa anumang katanungan ukol sa privacy at seguridad ng inyong datos sa dpo@gasan.ph."
            },
            {
              title: "3. Pag-claim ng Opisyal na MTOP at Resibo",
              desc: "Matapos maaprubahan ang online claim stub, kailangang personal na magtungo sa Municipal Treasury upang bayaran ang official fees at tanggapin ang opisyal na Mayor's Permit at Franchise Plate Sticker."
            },
            {
              title: "4. Ulat at Reklamo ng mga Operator",
              desc: "Bukas ang Help & Support module sa inyong dashboard para magsumite ng opisyal na reklamo o ulat ukol sa serbisyo ng sistema, o tumawag sa Office of the Vice Mayor Extension Hotline (042) 342-1234."
            }
          ]
        }
      }
    },
    en: {
      tabs: {
        privacy: "Privacy Policy",
        terms: "Terms of Service",
        dpa: "Data Privacy & ARTA"
      },
      closeBtn: "Close",
      acceptBtn: "I Understand & Accept",
      sections: {
        privacy: {
          title: "PRIVACY POLICY & DATA PROTECTION",
          subtitle: "In Compliance with Republic Act No. 10173 (Data Privacy Act of 2012)",
          points: [
            {
              title: "1. Scope of Collected Information",
              desc: "G-TRAMS collects only required personal and vehicular records, including Full Name, Contact Number, Barangay of residence, TODA association, Driver's License scans, and Motorcycle OR/CR for the legitimate verification and issuance of municipal franchises."
            },
            {
              title: "2. Purpose of Data Processing",
              desc: "All submitted data and images are processed strictly for regulatory evaluation by the Office of the Vice Mayor Extension, inclusion in the municipal TODA registry, generation of official MTOP certificates, and route enforcement under Gasan Municipal Ordinances."
            },
            {
              title: "3. Data Storage & Security Standards",
              desc: "Personal records are encrypted and stored in secure municipal cloud databases. Information is never commercialized, leased, or shared with third-party advertising or non-governmental entities."
            },
            {
              title: "4. Rights of Operators as Data Subjects",
              desc: "Operators maintain the right to inspect their registered records, request correction of inaccurate vehicular details, or contact the Office of the Vice Mayor Extension directly for formal inquiries regarding their stored records."
            }
          ]
        },
        terms: {
          title: "TERMS AND CONDITIONS OF SERVICE",
          subtitle: "Official Regulatory Guidelines of the Municipality of Gasan for Tricycle Franchisees",
          points: [
            {
              title: "1. Authorized Individual Access",
              desc: "Each G-TRAMS account belongs strictly to the accredited franchisee or driver. Transferring, lending, or sharing portal credentials with unauthorized parties is strictly prohibited."
            },
            {
              title: "2. Authenticity of Uploaded Records",
              desc: "Operators bear legal responsibility for the validity of all uploaded documents. Forged OR/CR documents or fraudulent licenses result in automatic disqualification, franchise revocation, and criminal prosecution."
            },
            {
              title: "3. Fare Compliance and Zone Regulations",
              desc: "Possession of an approved MTOP requires strict adherence to official fare matrices, vehicle safety standards, displayed body numbers, and designated TODA operational boundaries."
            },
            {
              title: "4. Annual Renewal & Penalty Policy",
              desc: "Motorized tricycle franchises are valid for one (1) year starting from the exact date of approval. Applications must be renewed before expiration to avoid statutory late surcharges under the Gasan Municipal Revenue Code."
            }
          ]
        },
        dpa: {
          title: "DATA PRIVACY & ARTA CITIZEN'S CHARTER",
          subtitle: "Standards of Republic Act No. 11032 (Ease of Doing Business) & LGU Transparency",
          points: [
            {
              title: "1. Processing Lead Times (ARTA Standard)",
              desc: "Under ARTA guidelines, complete online applications and renewal requests are reviewed and acted upon by the Office of the Vice Mayor Extension within three (3) to five (5) working days from submission."
            },
            {
              title: "2. Designated Data Protection Officer",
              desc: "Inquiries regarding privacy compliance or information security may be addressed to the Gasan Municipal Data Protection Officer at dpo@gasan.ph."
            },
            {
              title: "3. Claim Stub & Physical Releasing",
              desc: "Following online approval and generation of the digital claim stub, operators must present the voucher at the Municipal Treasury for fee settlement and release of the physical MTOP permit."
            },
            {
              title: "4. Official Support & Redress Channel",
              desc: "Operators can submit inquiries or report discrepancies via the Help & Support page on their dashboard or by calling the Office of the Vice Mayor Extension direct desk at (042) 342-1234."
            }
          ]
        }
      }
    }
  };

  const currentContent = content[lang];
  const activeSection = currentContent.sections[activeTab] || currentContent.sections.privacy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-card-entrance">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#7A1B22] via-[#8E2028] to-[#5A1419] p-5 sm:p-6 text-white shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 p-2 flex items-center justify-center shrink-0">
                <img src="/gasan-logo.png" alt="Gasan Seal" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base tracking-wide uppercase">
                  {activeSection.title}
                </h3>
                <p className="text-xs text-[#D4AF37] font-semibold mt-0.5">
                  {activeSection.subtitle}
                </p>
              </div>
            </div>

            {/* Language Toggle & Close Button */}
            <div className="flex items-center gap-2">
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
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Interactive Document Tabs */}
          <div className="flex items-center gap-1.5 mt-5 p-1 bg-black/20 rounded-2xl border border-white/10 text-xs font-bold overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl transition-all text-center cursor-pointer ${
                activeTab === 'privacy' 
                  ? 'bg-white text-[#7A1B22] shadow-sm font-black' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {currentContent.tabs.privacy}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl transition-all text-center cursor-pointer ${
                activeTab === 'terms' 
                  ? 'bg-white text-[#7A1B22] shadow-sm font-black' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {currentContent.tabs.terms}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dpa')}
              className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl transition-all text-center cursor-pointer ${
                activeTab === 'dpa' 
                  ? 'bg-white text-[#7A1B22] shadow-sm font-black' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {currentContent.tabs.dpa}
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-slate-700 text-xs sm:text-sm leading-relaxed">
          {activeSection.points.map((point, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 hover:border-[#D4AF37]/40 transition-colors">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                {point.title}
              </h4>
              <p className="text-slate-600 text-xs leading-relaxed font-normal">
                {point.desc}
              </p>
            </div>
          ))}

          {/* Contact Support Banner */}
          <div className="mt-4 p-4 rounded-2xl bg-[#7A1B22]/5 border border-[#7A1B22]/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-slate-900">Office of the Vice Mayor Extension &amp; MTFRB Municipal Office</p>
              <p className="text-slate-500">Gasan Municipal Hall, Ground Floor • Office of the Vice Mayor Extension@gasan.ph</p>
            </div>
            <a 
              href="https://gasan.ph" 
              target="_blank" 
              rel="noreferrer" 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7A1B22] text-white font-bold hover:bg-[#5a1419] transition-colors"
            >
              <span>Visit gasan.ph</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {currentContent.closeBtn}
          </button>
          {showAcceptButton && onAccept && (
            <button
              type="button"
              onClick={() => {
                onAccept();
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7A1B22] to-[#5A1419] text-white font-bold text-xs uppercase tracking-wider hover:shadow-md transition-all cursor-pointer"
            >
              {currentContent.acceptBtn}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default TermsPolicyModal;

