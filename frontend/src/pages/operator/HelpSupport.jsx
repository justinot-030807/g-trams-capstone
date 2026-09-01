import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout';
import { 
  HelpCircle, Phone, Mail, Building, ChevronDown, 
  Search, Flame, Info, ShieldCheck, MapPin 
} from 'lucide-react';

const INITIAL_FAQS = [
  {
    id: 1,
    question: "Ano ang mga kailangang requirements para sa New Franchise Application?",
    answer: "Kailangan ng malinaw na kopya o litrato ng: 1. OR/CR ng Motor, 2. Valid Driver's License, 3. TODA Endorsement Certificate, at 4. Barangay Clearance.",
    tags: ["requirements", "apply", "bago", "dokumento"],
    views: 24
  },
  {
    id: 2,
    question: "Kailan ang regular schedule ng Franchise Renewal?",
    answer: "Taon-taon tuwing buwan ng Enero ginagawa ang regular renewal. Maaari kayong mag-apply online 30 days bago mag-expire ang inyong prangkisa.",
    tags: ["renewal", "deadline", "expire", "petsa"],
    views: 19
  },
  {
    id: 3,
    question: "Paano i-download o i-print ang aking Motorized Tricycle Operator's Permit?",
    answer: "Pumunta sa Dashboard, hanapin ang iyong Active unit card, at i-click ang 'Print' button upang lumabas ang opisyal na printable permit.",
    tags: ["print", "permit", "download", "mtop"],
    views: 15
  },
  {
    id: 4,
    question: "Bakit na-cancel o rejected ang aking franchise application?",
    answer: "Maaaring malabo ang naipasa mong dokumento o may hindi tugmang impormasyon sa BPLO remarks. Tingnan ang pulang rejection note sa dashboard para sa detalye.",
    tags: ["reject", "cancel", "mali", "aberya"],
    views: 11
  },
  {
    id: 5,
    question: "Ilang tricycle unit ang pwedeng i-rehistro ng isang operator?",
    answer: "Alinsunod sa Municipal Ordinance ng Gasan, hanggang 2 units lamang ang maximum capacity na maaaring hawakan ng bawat rehistradong operator.",
    tags: ["capacity", "limit", "units", "dami"],
    views: 8
  }
];

const HelpSupport = () => {
  const [faqs, setFaqs] = useState(() => {
    const saved = localStorage.getItem('gtrams_faqs_analytics');
    return saved ? JSON.parse(saved) : INITIAL_FAQS;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    localStorage.setItem('gtrams_faqs_analytics', JSON.stringify(faqs));
  }, [faqs]);

  const handleFaqClick = (id) => {
    if (expandedFaq === id) {
      setExpandedFaq(null);
    } else {
      setExpandedFaq(id);
      setFaqs(prevFaqs => 
        prevFaqs.map(f => f.id === id ? { ...f, views: f.views + 1 } : f)
      );
    }
  };

  // Relevance + Frequency Scoring Algorithm
  const filteredAndSortedFaqs = [...faqs]
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
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#7A1B22] to-[#9B2A33] rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-white/10 px-3 py-1 rounded-full border border-white/10">
              Helpdesk & Support
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-2 mb-1">
              Help Center & About Us
            </h1>
            <p className="text-white/80 text-sm font-medium">
              Alamin ang impormasyon ukol sa sistema, gabay sa paggamit, at mga opisyal na contact details ng munisipyo.
            </p>
          </div>
        </div>

        {/* About & Contact Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* About Us Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-[#7A1B22]/10 text-[#7A1B22] rounded-2xl">
                  <Info size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">About G-TRAMS Portal</h2>
                  <p className="text-xs text-slate-500 font-medium">Official Tricycle Records & Application System</p>
                </div>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Ang <strong>G-TRAMS</strong> (Gasan Tricycle Records and Application Management System) ay ang opisyal na digital platform ng Lokal na Pamahalaan ng Gasan. Binuo ito upang gawing digital, mabilis, at transparent ang pagpaparehistro, pag-renew, at pag-monitor ng prangkisa ng tricycle para sa bawat operator at TODA.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                <Building size={16} className="text-[#7A1B22]" />
                <span>Sangguniang Bayan Office / BPLO</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                <MapPin size={16} className="text-[#7A1B22]" />
                <span>Municipal Hall, Gasan, Marinduque</span>
              </div>
            </div>
          </div>

          {/* Admin Contact Info Card */}
          <div className="bg-gradient-to-br from-[#7A1B22] to-[#4D1115] text-white rounded-3xl p-6 md:p-8 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={20} className="text-[#D4AF37]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">Admin Helpdesk</span>
              </div>
              <h2 className="text-xl font-black mb-2 tracking-tight">May katanungan?</h2>
              <p className="text-white/80 text-xs leading-relaxed mb-6">
                Maaaring makipag-ugnayan sa mga kawani ng munisipyo sa mga sumusunod na linya:
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <a href="tel:09123456789" className="flex items-center gap-3 bg-white/10 hover:bg-white/20 p-3 rounded-2xl border border-white/10 transition-colors">
                <Phone size={16} className="text-[#D4AF37]" />
                <div>
                  <p className="text-[10px] text-white/60 uppercase font-bold">Hotline (Office Hours)</p>
                  <p className="font-bold tracking-wide">+63 (042) 342-1234 / 0912 345 6789</p>
                </div>
              </a>
              <a href="mailto:support@gtrams-gasan.gov.ph" className="flex items-center gap-3 bg-white/10 hover:bg-white/20 p-3 rounded-2xl border border-white/10 transition-colors">
                <Mail size={16} className="text-[#D4AF37]" />
                <div>
                  <p className="text-[10px] text-white/60 uppercase font-bold">Email Support</p>
                  <p className="font-bold tracking-wide">bplo@gasan.gov.ph</p>
                </div>
              </a>
            </div>
          </div>

        </div>

        {/* Dynamic FAQ Module */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <HelpCircle className="text-[#7A1B22]" size={24} /> Frequently Asked Questions (FAQ)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Naka-sort ayon sa trending at pinakamadalas buksang paksa</p>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search help topics (e.g. renewal, permit)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-2 focus:ring-[#7A1B22]/10 transition-all"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredAndSortedFaqs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Walang nahanap na tugmang tanong. Subukan ang ibang keyword.
              </div>
            ) : (
              filteredAndSortedFaqs.map((faq, idx) => (
                <div 
                  key={faq.id}
                  className="border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-300"
                >
                  <button
                    onClick={() => handleFaqClick(faq.id)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 pr-4">
                      {idx === 0 && !searchQuery && (
                        <span className="flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                          <Flame size={12} className="text-amber-600" /> Top FAQ
                        </span>
                      )}
                      <span className="font-bold text-sm text-slate-800">{faq.question}</span>
                    </div>
                    <ChevronDown 
                      size={18} 
                      className={`text-slate-400 transition-transform duration-200 shrink-0 ${expandedFaq === faq.id ? 'rotate-180 text-[#7A1B22]' : ''}`} 
                    />
                  </button>

                  {expandedFaq === faq.id && (
                    <div className="p-5 bg-white border-t border-slate-100 text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3">
                      <p>{faq.answer}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                        <div className="flex gap-1.5 flex-wrap">
                          {faq.tags.map(t => (
                            <span key={t} className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded">
                              #{t}
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Viewed {faq.views} times
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