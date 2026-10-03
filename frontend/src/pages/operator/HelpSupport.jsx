import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout';
import { 
  HelpCircle, Phone, Mail, Building, ChevronDown, 
  Search, Flame, Info, ShieldCheck, MapPin, FileText, Clock,
  Users, GraduationCap, Code, Server, Heart, Send, MessageSquare
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import TermsPolicyModal from '../../components/common/TermsPolicyModal';
import { HELP_DESK_EMAIL, HOTLINE_DISPLAY, HOTLINE_NUMBER, MUNICIPAL_OFFICE_NAME } from '../../utils/contactConfig';

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
      answer: "Applications may be returned due to blurry or incomplete uploaded documents, or mismatched motor and chassis numbers noted by Office of the Vice Mayor Extension evaluators. Please review the remarks on your dashboard for specific correction instructions.",
      tags: ["reject", "cancel", "revision", "remarks", "Office of the Vice Mayor Extension"],
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
      answer: "Maaaring malabo ang naipasa mong dokumento o may hindi tugmang impormasyon sa motor at chassis ayon sa Office of the Vice Mayor Extension remarks. Tingnan ang rejection/revision note sa dashboard para sa detalye.",
      tags: ["reject", "cancel", "mali", "aberya", "Office of the Vice Mayor Extension"],
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
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Ticket Form State
  const [ticketData, setTicketData] = useState({
    subject: 'Franchise Application Issue',
    contactNumber: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(ticketData)
      });
      const data = await res.json();
      if (res.ok) {
        alert(currentLang === 'fil' ? 'Naisumite na ang iyong ticket! Maghihintay ng sagot ang admin.' : 'Ticket submitted successfully! Please wait for an admin response.');
        setTicketData({ subject: 'Franchise Application Issue', contactNumber: '', message: '' });
      } else {
        alert(data.message || 'Error submitting ticket');
      }
    } catch (err) {
      alert('Network error. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div className="w-full space-y-8 pb-28 sm:pb-24">
        {/* Header Ribbon */}
        <div className="bg-[#9E2A2B] rounded-lg p-5 sm:p-6 text-white shadow-xs border-l-4 border-l-[#D4AF37] relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#14110F] bg-[#D4AF37] px-2.5 py-0.5 rounded">
              Helpdesk &amp; Support
            </span>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight mt-2 mb-1">
              Help Center &amp; Information
            </h1>
            <p className="text-white/90 text-xs sm:text-sm font-medium max-w-2xl leading-relaxed">
              Usage guides, frequently asked questions, and official contact channels for the Municipality of Gasan.
            </p>
          </div>
          <img
            src="/gasan-logo.png"
            alt=""
            aria-hidden="true"
            className="absolute -right-6 -bottom-6 w-36 h-36 opacity-10 pointer-events-none select-none object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>

        {/* About & Contact Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* About Us Card */}
          <div className="lg:col-span-2 bg-white dark:bg-[#1C1917] rounded-lg p-5 sm:p-6 border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs flex flex-col justify-between transition-colors">
            <div>
              <div className="flex items-center gap-3 mb-3.5">
                <div className="p-2.5 bg-[#9E2A2B]/10 dark:bg-[#9E2A2B]/20 text-[#9E2A2B] dark:text-[#D4AF37] rounded-lg shrink-0">
                  <Info size={22} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[#1F1D1B] dark:text-[#F6F5F3] tracking-tight">
                    About the G-TRAMS Portal
                  </h2>
                  <p className="text-xs text-[#9E2A2B] dark:text-[#D4AF37] font-semibold">
                    Web-Based Tricycle Franchise Management System • Gasan, Marinduque
                  </p>
                </div>
              </div>
              <p className="text-[#1F1D1B] dark:text-[#F6F5F3] text-xs sm:text-sm leading-relaxed mb-5 font-normal">
                <strong>G-TRAMS</strong> (Gasan Tricycle Records and Application Management System) is an official digital platform developed for the <strong>Municipality of Gasan, Marinduque</strong>. It streamlines tricycle franchise applications, annual renewals, document verification, and association management into a fast, transparent, and user-friendly experience.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                <Building size={16} className="text-[#9E2A2B] dark:text-[#D4AF37] shrink-0" />
                <span>{MUNICIPAL_OFFICE_NAME}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                <MapPin size={16} className="text-[#9E2A2B] dark:text-[#D4AF37] shrink-0" />
                <span>Municipal Hall, Gasan, Marinduque</span>
              </div>
            </div>
          </div>

          {/* Admin Contact Info Card */}
          <div className="bg-[#1C1917] dark:bg-[#14110F] border border-[#2E2A27] text-white rounded-lg p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <ShieldCheck size={18} className="text-[#D4AF37]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                  Municipal Support
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold mb-1 tracking-tight">
                Have Questions or Concerns?
              </h2>
              <p className="text-white/80 text-xs leading-relaxed mb-4 font-normal">
                You may reach out to municipal officers and administrative staff through the following official channels:
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <a 
                href={`tel:${HOTLINE_NUMBER}`} 
                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 active:scale-95 p-3 rounded-lg border border-white/10 transition-all shadow-xs cursor-pointer min-h-[46px]"
                title="Call Municipal Hotline"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                  <Phone size={15} />
                </div>
                <div>
                  <p className="text-xs text-[#D4AF37] uppercase font-bold tracking-wider">
                    Hotline (Office Hours)
                  </p>
                  <p className="font-bold text-xs tracking-wide">{HOTLINE_DISPLAY}</p>
                </div>
              </a>

              <a 
                href={`mailto:${HELP_DESK_EMAIL}`} 
                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 active:scale-95 p-3 rounded-lg border border-white/10 transition-all shadow-xs cursor-pointer min-h-[46px]"
                title="Send Email to Municipal Helpdesk"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                  <Mail size={15} />
                </div>
                <div>
                  <p className="text-xs text-[#D4AF37] uppercase font-bold tracking-wider">
                    Official Email
                  </p>
                  <p className="font-bold text-xs tracking-wide">{HELP_DESK_EMAIL}</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Municipal Office Hours & Fee Schedule */}
        <div className="bg-white dark:bg-[#1C1917] rounded-lg p-5 sm:p-7 border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs mb-8">
          <div className="flex items-center gap-2 mb-5">
            <Building size={24} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
            <h2 className="text-lg font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">Office Hours &amp; Fees</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-4 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
              <h3 className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3] mb-3 text-sm flex items-center gap-2">
                <Clock size={16} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                Operating Hours
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-[#1F1D1B] dark:text-[#F6F5F3]">
                <li className="flex justify-between border-b border-[#E4E1DC] dark:border-[#2E2A27] pb-2">
                  <span className="font-semibold">Monday - Friday</span>
                  <span>8:00 AM - 5:00 PM</span>
                </li>
                <li className="flex justify-between border-b border-[#E4E1DC] dark:border-[#2E2A27] pb-2 pt-1">
                  <span className="font-semibold">Saturday - Sunday</span>
                  <span className="text-[#6B6761] dark:text-[#A8A29E]">Closed</span>
                </li>
                <li className="flex justify-between pt-1">
                  <span className="font-semibold">Holidays</span>
                  <span className="text-[#6B6761] dark:text-[#A8A29E]">Closed</span>
                </li>
              </ul>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-3 font-medium italic">
                * Processing of new franchises and renewals are only done during office hours.
              </p>
            </div>

            <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-4 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
              <h3 className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3] mb-3 text-sm flex items-center gap-2">
                <FileText size={16} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                Standard Fees
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-[#1F1D1B] dark:text-[#F6F5F3]">
                <li className="flex justify-between border-b border-[#E4E1DC] dark:border-[#2E2A27] pb-2">
                  <span className="font-semibold">Annual Franchise Fee</span>
                  <span>₱500.00</span>
                </li>
                <li className="flex justify-between border-b border-[#E4E1DC] dark:border-[#2E2A27] pb-2 pt-1">
                  <span className="font-semibold">New Application Fee</span>
                  <span>₱500.00</span>
                </li>
                <li className="flex justify-between pt-1">
                  <span className="font-semibold">Late Penalty (per month)</span>
                  <span className="text-[#B91C1C] font-bold">₱50.00</span>
                </li>
              </ul>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-3 font-medium italic">
                * All payments must be made directly to the Municipal Cashier. Do not pay online.
              </p>
            </div>
          </div>
        </div>

        {/* Legal & Privacy Policy Banner */}
        <div className="bg-[#1C1917] dark:bg-[#14110F] rounded-lg p-5 sm:p-6 text-white mb-8 border border-[#2E2A27] border-l-4 border-l-[#9E2A2B] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-[#D4AF37] shrink-0 mx-auto sm:mx-0 shadow-inner">
              <ShieldCheck size={26} />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="bg-[#D4AF37] text-[#14110F] text-[9px] font-black px-2 py-0.5 rounded tracking-widest uppercase">
                  LEGAL &amp; PRIVACY
                </span>
                <span className="text-xs text-[#EAE7E1] font-medium">
                  RA 10173 • RA 7160 • Art. 172 RPC
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold uppercase tracking-wide mt-1">
                {currentLang === 'fil' ? 'Mga Tuntunin sa Paggamit at Patakaran sa Privacy' : 'Terms of Use & Municipal Privacy Policy'}
              </h3>
              <p className="text-xs text-[#A8A29E] font-medium mt-0.5">
                {currentLang === 'fil'
                  ? 'Basahin ang opisyal na alituntunin sa prangkisa, taripa, 20% discount, at proteksyon sa datos.'
                  : 'Review complete municipal guidelines on MTOP franchising, fare discounts, road safety, and data rights.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowTermsModal(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#D4AF37] hover:bg-[#c29e2f] active:scale-[0.98] text-[#14110F] text-xs font-bold rounded-lg shadow-xs uppercase tracking-wider transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
          >
            <FileText size={15} />
            <span>{currentLang === 'fil' ? 'BUKSAN ANG PATAKARAN' : 'VIEW FULL POLICY'}</span>
          </button>
        </div>

        {/* Dynamic FAQ Module */}
        <div className="bg-white dark:bg-[#1C1917] rounded-lg p-5 sm:p-7 border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-5 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#1F1D1B] dark:text-[#F6F5F3] tracking-tight flex items-center gap-2">
                <HelpCircle className="text-[#9E2A2B] dark:text-[#D4AF37]" size={20} /> 
                <span>Frequently Asked Questions (FAQ)</span>
              </h2>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5 font-medium">
                Ranked by trending and frequently accessed topics
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6761] dark:text-[#A8A29E]" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search help topics (e.g. renewal, permit)..."
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg text-xs sm:text-sm font-medium text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] transition-colors shadow-2xs placeholder:text-[#6B6761] dark:placeholder:text-[#A8A29E] min-h-[44px]"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredAndSortedFaqs.length === 0 ? (
              <div className="p-8 text-center text-[#6B6761] dark:text-[#A8A29E] text-xs font-medium bg-[#F6F5F3] dark:bg-[#14110F] rounded-lg border border-dashed border-[#E4E1DC] dark:border-[#2E2A27]">
                No matching questions found. Try different search keywords.
              </div>
            ) : (
              filteredAndSortedFaqs.map((faq, idx) => (
                <div 
                  key={faq.id}
                  className="border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg overflow-hidden transition-colors hover:border-[#9E2A2B]/40 shadow-2xs"
                >
                  <button
                    onClick={() => handleFaqClick(faq.id)}
                    className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left bg-[#F6F5F3]/70 dark:bg-[#14110F]/50 hover:bg-[#F6F5F3] dark:hover:bg-[#14110F] transition-colors cursor-pointer min-h-[48px]"
                  >
                    <div className="flex items-center gap-2.5 pr-3 flex-wrap sm:flex-nowrap">
                      {idx === 0 && !searchQuery && (
                        <span className="flex items-center gap-1 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 border border-amber-300 dark:border-amber-800/80">
                          <Flame size={12} className="text-amber-600 dark:text-amber-400" /> 
                          <span>Top FAQ</span>
                        </span>
                      )}
                      <span className="font-bold text-xs sm:text-sm text-[#1F1D1B] dark:text-[#F6F5F3] leading-snug">
                        {faq.question}
                      </span>
                    </div>
                    <ChevronDown 
                      size={18} 
                      className={`text-[#6B6761] dark:text-[#A8A29E] transition-transform duration-200 shrink-0 ${expandedFaq === faq.id ? 'rotate-180 text-[#9E2A2B] dark:text-[#D4AF37]' : ''}`} 
                    />
                  </button>

                  {expandedFaq === faq.id && (
                    <div className="p-4 sm:p-5 bg-white dark:bg-[#1C1917] border-t border-[#E4E1DC] dark:border-[#2E2A27] text-xs sm:text-sm text-[#1F1D1B] dark:text-[#F6F5F3] leading-relaxed space-y-3">
                      <p className="font-normal">{faq.answer}</p>
                      <div className="flex items-center justify-between pt-2.5 border-t border-[#E4E1DC] dark:border-[#2E2A27] flex-wrap gap-2">
                        <div className="flex gap-1.5 flex-wrap">
                          {faq.tags.map(tag => (
                            <span key={tag} className="text-xs bg-[#F6F5F3] dark:bg-[#14110F] text-[#6B6761] dark:text-[#A8A29E] font-semibold px-2 py-0.5 rounded border border-[#E4E1DC] dark:border-[#2E2A27]">
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-medium">
                          {faq.views} views
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Support Ticket Submission Form */}
        <div className="bg-white dark:bg-[#1C1917] rounded-lg p-5 sm:p-7 border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs transition-colors">
          <div className="mb-6 pb-4 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
            <h2 className="text-base sm:text-lg font-bold text-[#1F1D1B] dark:text-[#F6F5F3] tracking-tight flex items-center gap-2">
              <Mail className="text-[#9E2A2B] dark:text-[#D4AF37]" size={20} /> 
              <span>Submit a Support Ticket</span>
            </h2>
            <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-1 font-medium">
              Need further assistance? Send us a message and we'll get back to you during office hours.
            </p>
          </div>
          
          <div className="bg-[#F6F5F3] dark:bg-[#14110F] rounded-lg p-6 sm:p-8 border border-[#E4E1DC] dark:border-[#2E2A27]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-[#9E2A2B]/10 dark:bg-[#9E2A2B]/20 rounded-lg text-[#9E2A2B] dark:text-[#D4AF37]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">
                {currentLang === 'fil' ? 'Mag-sumite ng Ticket' : 'Submit a Ticket'}
              </h3>
            </div>

            <form className="space-y-4" onSubmit={handleTicketSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F1D1B] dark:text-[#F6F5F3] mb-1">
                    {currentLang === 'fil' ? 'Paksa' : 'Subject'}
                  </label>
                  <select 
                    className="w-full bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-4 py-2.5 text-xs sm:text-sm font-medium text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] min-h-[44px]"
                    value={ticketData.subject}
                    onChange={(e) => setTicketData({...ticketData, subject: e.target.value})}
                    required
                  >
                    <option>{currentLang === 'fil' ? 'Isyu sa Franchise Application' : 'Franchise Application Issue'}</option>
                    <option>{currentLang === 'fil' ? 'Account Access' : 'Account Access'}</option>
                    <option>{currentLang === 'fil' ? 'Tanong sa Payment/Claim Stub' : 'Payment/Claim Stub Inquiry'}</option>
                    <option>{currentLang === 'fil' ? 'Iba pa' : 'Other'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1F1D1B] dark:text-[#F6F5F3] mb-1">
                    {currentLang === 'fil' ? 'Numero sa Telepono' : 'Contact Number'}
                  </label>
                  <input 
                    type="text" 
                    placeholder="09123456789" 
                    className="w-full bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-4 py-2.5 text-xs sm:text-sm font-medium text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] min-h-[44px]" 
                    value={ticketData.contactNumber}
                    onChange={(e) => setTicketData({...ticketData, contactNumber: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1F1D1B] dark:text-[#F6F5F3] mb-1">
                  {currentLang === 'fil' ? 'Mensahe' : 'Message'}
                </label>
                <textarea 
                  rows="4" 
                  placeholder={currentLang === 'fil' ? 'Ilarawan ang iyong isyu...' : 'Describe your issue in detail...'} 
                  className="w-full bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-4 py-2.5 text-xs sm:text-sm font-medium text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] resize-none"
                  value={ticketData.message}
                  onChange={(e) => setTicketData({...ticketData, message: e.target.value})}
                  required
                ></textarea>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#9E2A2B] hover:bg-[#7A1B22] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] text-white dark:text-[#14110F] text-xs font-bold rounded-lg shadow-xs transition-colors active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? (currentLang === 'fil' ? 'Sinasubmit...' : 'Submitting...') : (currentLang === 'fil' ? 'Ipadala ang Ticket' : 'Send Ticket')}</span>
              </button>
            </form>
          </div>
        </div>

        {/* System Developers Section */}
        <div className="bg-white dark:bg-[#1C1917] rounded-lg p-5 sm:p-7 border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs transition-colors">
          <div className="mb-6 pb-4 border-b border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#1F1D1B] dark:text-[#F6F5F3] tracking-tight flex items-center gap-2">
                <Users className="text-[#9E2A2B] dark:text-[#D4AF37]" size={20} /> 
                <span>About the Development Team</span>
              </h2>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-1 font-medium">
                G-TRAMS is a Capstone Project developed by students from <strong className="text-[#1F1D1B] dark:text-[#F6F5F3]">Marinduque State University (MarSU)</strong>.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-[#9E2A2B] dark:text-[#D4AF37] border border-red-200 dark:border-red-900/60 text-xs font-bold uppercase tracking-wider">
              <GraduationCap size={14} /> MarSU Capstone
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[
              { name: "John Doe", role: "Project Manager / Lead Dev", icon: <Users size={18} className="text-[#9E2A2B] dark:text-[#D4AF37]" /> },
              { name: "Jane Smith", role: "Frontend Developer", icon: <Code size={18} className="text-[#9E2A2B] dark:text-[#D4AF37]" /> },
              { name: "Juan Dela Cruz", role: "Backend / Database", icon: <Server size={18} className="text-[#9E2A2B] dark:text-[#D4AF37]" /> },
              { name: "Maria Clara", role: "UI/UX Designer", icon: <Heart size={18} className="text-[#9E2A2B] dark:text-[#D4AF37]" /> },
              { name: "Pedro Penduko", role: "QA / Compliance Specialist", icon: <ShieldCheck size={18} className="text-[#9E2A2B] dark:text-[#D4AF37]" /> },
            ].map((dev, idx) => (
              <div key={idx} className="p-3.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-center gap-3 hover:border-[#9E2A2B]/40 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#1C1917] shadow-xs flex items-center justify-center shrink-0 border border-[#E4E1DC] dark:border-[#2E2A27]">
                  {dev.icon}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-[#1F1D1B] dark:text-[#F6F5F3] truncate">{dev.name}</h4>
                  <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-medium truncate">{dev.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <TermsPolicyModal 
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        defaultLang={currentLang === 'fil' ? 'tl' : 'en'}
        showAcceptButton={false}
      />
    </MainLayout>
  );
};

export default HelpSupport;

