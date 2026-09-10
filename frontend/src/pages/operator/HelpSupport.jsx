import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout';
import { 
  HelpCircle, Phone, Mail, Building, ChevronDown, 
  Search, Flame, Info, ShieldCheck, MapPin 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const FAQS_DATA = {
  en: [
    {
      id: 1,
      question: "What are the required documents for a New Franchise Application?",
      answer: "You must submit clear scanned copies or photos of: 1. Motor OR / CR (Official Receipt and Certificate of Registration), 2. Valid Driver's License, 3. TODA Endorsement Certificate, and 4. Barangay Clearance.",
      tags: ["requirements", "apply", "new", "documents", "or/cr", "license"],
      defaultViews: 24
    },
    {
      id: 2,
      question: "When is the regular schedule for Franchise Renewal?",
      answer: "Regular annual franchise renewal is conducted every January. You may submit your online renewal application starting 30 days before your franchise permit expires.",
      tags: ["renewal", "deadline", "expire", "schedule", "january"],
      defaultViews: 19
    },
    {
      id: 3,
      question: "How do I download or print my Motorized Tricycle Operator's Permit / Claim Stub?",
      answer: "Navigate to your Operator Dashboard, locate your Approved or Active tricycle unit card, and click the 'Print' or 'View Stub' button to open and save your official printable document.",
      tags: ["print", "permit", "download", "mtop", "claim stub"],
      defaultViews: 15
    },
    {
      id: 4,
      question: "Why was my franchise application returned or cancelled?",
      answer: "Applications may be returned due to blurry or incomplete uploaded documents, or mismatched motor and chassis numbers noted by BPLO evaluators. Please review the remarks on your dashboard for specific correction instructions.",
      tags: ["reject", "cancel", "revision", "remarks", "bplo"],
      defaultViews: 11
    },
    {
      id: 5,
      question: "How many tricycle units can an individual operator register?",
      answer: "In accordance with the Municipal Ordinance of Gasan, each registered operator is allowed a maximum of 2 units (or as configured by Municipal Administration).",
      tags: ["capacity", "limit", "units", "ordinance", "max"],
      defaultViews: 8
    }
  ],
  fil: [
    {
      id: 1,
      question: "Ano ang mga kailangang requirements para sa New Franchise Application?",
      answer: "Kailangan ng malinaw na kopya o litrato ng: 1. OR/CR ng Motor (Official Receipt / Certificate of Registration), 2. Valid Driver's License, 3. TODA Endorsement Certificate, at 4. Barangay Clearance.",
      tags: ["requirements", "apply", "bago", "dokumento", "or/cr", "lisensya"],
      defaultViews: 24
    },
    {
      id: 2,
      question: "Kailan ang regular schedule ng Franchise Renewal?",
      answer: "Taon-taon tuwing buwan ng Enero ginagawa ang regular renewal. Maaari kayong mag-apply online 30 days bago mag-expire ang inyong prangkisa.",
      tags: ["renewal", "deadline", "expire", "petsa", "enero"],
      defaultViews: 19
    },
    {
      id: 3,
      question: "Paano i-download o i-print ang aking Permit o Claim Stub?",
      answer: "Pumunta sa Dashboard, hanapin ang iyong Active o Aprubadong unit card, at i-click ang 'Print' o 'View Stub' button upang lumabas ang opisyal na printable permit.",
      tags: ["print", "permit", "download", "mtop", "claim stub"],
      defaultViews: 15
    },
    {
      id: 4,
      question: "Bakit na-cancel o ibinalik ang aking franchise application?",
      answer: "Maaaring malabo ang naipasa mong dokumento o may hindi tugmang impormasyon sa motor at chassis ayon sa BPLO remarks. Tingnan ang rejection/revision note sa dashboard para sa detalye.",
      tags: ["reject", "cancel", "mali", "aberya", "bplo"],
      defaultViews: 11
    },
    {
      id: 5,
      question: "Ilang tricycle unit ang pwedeng i-rehistro ng isang operator?",
      answer: "Alinsunod sa Municipal Ordinance ng Gasan, hanggang 2 units lamang ang karaniwang limitasyon na maaaring hawakan ng bawat rehistradong operator.",
      tags: ["capacity", "limit", "units", "dami", "ordinansa"],
      defaultViews: 8
    }
  ]
};

const HelpSupport = () => {
  const { language, t } = useLanguage();
  const currentLang = language === 'fil' || language === 'tl' || language === 'tagalog' ? 'fil' : 'en';

  const [viewCounts, setViewCounts] = useState(() => {
    try {
      const saved = localStorage.getItem('gtrams_faqs_analytics');
      return saved ? JSON.parse(saved) : { 1: 24, 2: 19, 3: 15, 4: 11, 5: 8 };
    } catch {
      return { 1: 24, 2: 19, 3: 15, 4: 11, 5: 8 };
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    localStorage.setItem('gtrams_faqs_analytics', JSON.stringify(viewCounts));
  }, [viewCounts]);

  const handleFaqClick = (id) => {
    if (expandedFaq === id) {
      setExpandedFaq(null);
    } else {
      setExpandedFaq(id);
      setViewCounts(prev => ({
        ...prev,
        [id]: (prev[id] || 0) + 1
      }));
    }
  };

  const currentFaqList = (FAQS_DATA[currentLang] || FAQS_DATA.en).map(faq => ({
    ...faq,
    views: viewCounts[faq.id] ?? faq.defaultViews
  }));

  // Relevance + Frequency Scoring Algorithm
  const filteredAndSortedFaqs = currentFaqList
    .map(faq => {
      if (!searchQuery.trim()) {
        return { ...faq, score: faq.views };
      }
      
      const query = searchQuery.toLowerCase();
      let score = 0;
      if (faq.question.toLowerCase().includes(query)) score += 30;
      if (faq.tags.some(t => t.toLowerCase().includes(query))) score += 20;
      if (faq.answer.toLowerCase().includes(query)) score += 10;
      
      return { ...faq, score: score + faq.views };
    })
    .filter(faq => !searchQuery.trim() || faq.score >= 10)
    .sort((a, b) => b.score - a.score);

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-28 sm:pb-24">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-[#7A1B22] to-[#9B2A33] dark:from-[#0d121f] dark:via-[#1e0e15] dark:to-[#0a0d16] border border-transparent dark:border-[#D4AF37]/30 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-[#D4AF37]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="relative z-10">
            <span className="text-xs font-black uppercase tracking-widest text-slate-950 bg-[#D4AF37] px-3.5 py-1 rounded-lg">
              {t('help.badge', 'Helpdesk & Support')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-3 mb-1.5">
              {t('help.title', 'Help Center & About Us')}
            </h1>
            <p className="text-white/90 dark:text-slate-300 text-xs sm:text-sm font-medium max-w-2xl leading-relaxed">
              {t('help.subtitle', 'Mga gabay sa paggamit, madalas itanong (FAQ), at opisyal na kontak ng Munisipyo.')}
            </p>
          </div>
        </div>

        {/* About & Contact Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* About Us Card */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
            <div>
              <div className="flex items-center gap-3.5 mb-4">
                <div className="p-3 bg-[#7A1B22]/10 dark:bg-[#7A1B22]/20 text-[#7A1B22] dark:text-[#D4AF37] rounded-2xl shrink-0">
                  <Info size={28} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {t('help.aboutTitle', 'Tungkol sa G-TRAMS Portal')}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#7A1B22] dark:text-[#D4AF37] font-black">
                    {t('help.aboutSub', 'Web-Based Tricycle Franchise Management System &bull; Gasan, Marinduque')}
                  </p>
                </div>
              </div>
              <p className="text-slate-700 dark:text-slate-200 text-sm sm:text-base leading-relaxed mb-6 font-medium">
                {currentLang === 'fil' ? (
                  <>
                    Ang <strong>G-TRAMS</strong> (Gasan Tricycle Records and Application Management System) ay isang opisyal na <strong>Tricycle Franchise Management System para sa Bayan ng Gasan, Marinduque</strong>. Binuo ito upang maging madali, mabilis, at maginhawa para sa mga drayber at operator na mag-apply ng bagong prangkisa, mag-renew taon-taon, at maiwasan ang mahabang pila sa Munisipyo.
                  </>
                ) : (
                  <>
                    <strong>G-TRAMS</strong> (Gasan Tricycle Records and Application Management System) is a <strong>Web-Based Tricycle Franchise Management System for the Municipality of Gasan, Marinduque</strong>. It was developed to make tricycle franchise registrations, renewals, record verification, and fleet monitoring digital, fast, and transparent for every operator and TODA association.
                  </>
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-5 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                <Building size={20} className="text-[#7A1B22] dark:text-[#D4AF37] shrink-0" />
                <span>{t('help.deptBplo', 'Sangguniang Bayan Office / BPLO')}</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                <MapPin size={20} className="text-[#7A1B22] dark:text-[#D4AF37] shrink-0" />
                <span>{t('help.location', 'Municipal Hall, Gasan, Marinduque')}</span>
              </div>
            </div>
          </div>

          {/* Admin Contact Info Card */}
          <div className="bg-gradient-to-br from-[#7A1B22] to-[#4D1115] dark:from-[#1b0d11] dark:to-[#0d121f] border border-transparent dark:border-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={22} className="text-[#D4AF37]" />
                <span className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">
                  {t('help.adminBadge', 'Tulong ng Munisipyo')}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black mb-2 tracking-tight">
                {currentLang === 'fil' ? 'May mga Katanungan o Aberya?' : t('help.haveQuestions', 'Have questions or concerns?')}
              </h2>
              <p className="text-white/90 text-xs sm:text-sm leading-relaxed mb-6 font-medium">
                {currentLang === 'fil' 
                  ? 'Maaaring tawagan agad ang BPLO staff o mag-email sa mga sumusunod na opisyal na linya:' 
                  : t('help.contactDesc', 'You may reach out to municipal officers and BPLO staff through the following official channels:')}
              </p>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <a 
                href="tel:09123456789" 
                className="flex items-center gap-3.5 bg-white/15 hover:bg-white/25 active:scale-95 p-4 rounded-2xl border border-white/20 transition-all min-h-[56px] shadow-sm cursor-pointer"
                title="Pindutin para tawagan ang BPLO"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-[#D4AF37] shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-[11px] text-[#D4AF37] uppercase font-black tracking-wider">
                    {currentLang === 'fil' ? 'Tawagan ang Hotline (Pindutin)' : t('help.hotline', 'Hotline (Office Hours)')}
                  </p>
                  <p className="font-black text-sm tracking-wide mt-0.5">+63 (042) 342-1234 / 0912 345 6789</p>
                </div>
              </a>

              <a 
                href="mailto:bplo@gasan.gov.ph" 
                className="flex items-center gap-3.5 bg-white/15 hover:bg-white/25 active:scale-95 p-4 rounded-2xl border border-white/20 transition-all min-h-[56px] shadow-sm cursor-pointer"
                title="Pindutin para mag-email"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-[#D4AF37] shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-[11px] text-[#D4AF37] uppercase font-black tracking-wider">
                    {currentLang === 'fil' ? 'Opisyal na Email' : t('help.emailSupport', 'Email Support')}
                  </p>
                  <p className="font-black text-sm tracking-wide mt-0.5">bplo@gasan.gov.ph</p>
                </div>
              </a>
            </div>
          </div>

        </div>

        {/* Dynamic FAQ Module */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                <HelpCircle className="text-[#7A1B22] dark:text-[#D4AF37]" size={28} /> 
                <span>{currentLang === 'fil' ? 'Madalas Itanong (Mga Sagot sa FAQ)' : t('help.faqTitle', 'Frequently Asked Questions (FAQ)')}</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {currentLang === 'fil' ? 'Pindutin ang alinmang katanungan upang mabasa ang paliwanag.' : t('help.faqSubtitle', 'Ranked by trending and frequently accessed topics')}
              </p>
            </div>

            <div className="relative w-full md:w-88">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={currentLang === 'fil' ? 'Maghanap (Hal. renewal, permit, requirements)...' : t('help.searchPlaceholder', 'Search help topics (e.g. renewal, permit, requirements)...')}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-base font-bold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#7A1B22] dark:focus:border-[#D4AF37] focus:ring-4 focus:ring-[#7A1B22]/15 transition-all shadow-2xs placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="space-y-3.5">
            {filteredAndSortedFaqs.length === 0 ? (
              <div className="p-10 text-center text-slate-500 dark:text-slate-400 text-sm font-bold bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                {currentLang === 'fil' ? 'Walang nahanap na tugmang katanungan. Subukang baguhin ang salita.' : t('help.noResults', 'No matching questions found. Try different search keywords.')}
              </div>
            ) : (
              filteredAndSortedFaqs.map((faq, idx) => (
                <div 
                  key={faq.id}
                  className="border-2 border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                >
                  <button
                    onClick={() => handleFaqClick(faq.id)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[56px]"
                  >
                    <div className="flex items-center gap-3 pr-4 flex-wrap sm:flex-nowrap">
                      {idx === 0 && !searchQuery && (
                        <span className="flex items-center gap-1 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shrink-0 border border-amber-300 dark:border-amber-800/80">
                          <Flame size={14} className="text-amber-600 dark:text-amber-400" /> 
                          <span>{currentLang === 'fil' ? 'Pangunahin' : t('help.topFaq', 'Top FAQ')}</span>
                        </span>
                      )}
                      <span className="font-black text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-snug">
                        {faq.question}
                      </span>
                    </div>
                    <ChevronDown 
                      size={22} 
                      className={`text-slate-500 transition-transform duration-200 shrink-0 ${expandedFaq === faq.id ? 'rotate-180 text-[#7A1B22] dark:text-[#D4AF37]' : ''}`} 
                    />
                  </button>

                  {expandedFaq === faq.id && (
                    <div className="p-5 sm:p-6 bg-white dark:bg-slate-900/90 border-t border-slate-200/70 dark:border-slate-800 text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed space-y-4">
                      <p className="font-medium">{faq.answer}</p>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                        <div className="flex gap-2 flex-wrap">
                          {faq.tags.map(tag => (
                            <span key={tag} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-2.5 py-1 rounded-lg">
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">
                          {faq.views} {t('help.views', 'views')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </MainLayout>
  );
};

export default HelpSupport;