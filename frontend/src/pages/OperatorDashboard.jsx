import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { 
  RefreshCw, AlertCircle, CheckCircle, Clock, Loader2, CalendarDays, 
  PlusCircle, Activity, MapPin, Hash, Printer, X, ShieldCheck, 
  HelpCircle, Phone, Mail, Building, ChevronDown, Search, Flame, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// DEFAULT FREQUENTLY ASKED QUESTIONS DATA
const INITIAL_FAQS = [
  {
    id: 1,
    question: "Ano ang mga kailangang requirements para sa New Franchise Application?",
    answer: "Kailangan ng malinaw na kopya o picture ng: 1. OR/CR ng Motor, 2. Valid Driver's License, 3. TODA Endorsement Certificate, at 4. Barangay Clearance.",
    tags: ["requirements", "apply", "bago", "dokumento"],
    views: 18
  },
  {
    id: 2,
    question: "Kailan ang regular schedule ng Franchise Renewal?",
    answer: "Taon-taon tuwing buwan ng Enero ginagawa ang regular renewal. Maaari kayong mag-apply online 30 days bago mag-expire ang inyong prangkisa.",
    tags: ["renewal", "deadline", "expire", "petsa"],
    views: 12
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
    views: 8
  },
  {
    id: 5,
    question: "Ilang tricycle unit ang pwedeng i-rehistro ng isang operator?",
    answer: "Alinsunod sa Municipal Ordinance ng Gasan, hanggang 2 units lamang ang maximum capacity na maaaring hawakan ng bawat rehistradong operator.",
    tags: ["capacity", "limit", "units", "dami"],
    views: 6
  }
];

const OperatorDashboard = () => {
  const [franchises, setFranchises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  const loggedInUserName = localStorage.getItem('name') || 'Operator';

  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // HELPDESK & FAQ STATES
  const [faqs, setFaqs] = useState(() => {
    const saved = localStorage.getItem('gtrams_faqs_analytics');
    return saved ? JSON.parse(saved) : INITIAL_FAQS;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    fetchMyFranchises();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // I-save ang dynamic view frequency tuwing may nagbabago
  useEffect(() => {
    localStorage.setItem('gtrams_faqs_analytics', JSON.stringify(faqs));
  }, [faqs]);

  const fetchMyFranchises = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/franchises/my-franchises', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFranchises(data);
      }
    } catch (error) {
      console.error('Error loading dashboard units:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getExpirationDate = (dateApplied) => {
    if (!dateApplied) return 'N/A';
    const date = new Date(dateApplied);
    date.setFullYear(date.getFullYear() + 1); 
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const openDetails = (unit) => {
    setSelectedUnit(unit);
    setIsDetailsOpen(true);
  };

  const openPrintPermit = (unit) => {
    setSelectedUnit(unit);
    setIsPrintOpen(true);
  };

  // HELPDESK ALGORITHM: FREQUENCY + RELEVANCE MATCHING
  const handleFaqClick = (id) => {
    if (expandedFaq === id) {
      setExpandedFaq(null);
    } else {
      setExpandedFaq(id);
      // Increment view frequency count for intelligent ranking
      setFaqs(prevFaqs => 
        prevFaqs.map(f => f.id === id ? { ...f, views: f.views + 1 } : f)
      );
    }
  };

  const filteredAndSortedFaqs = [...faqs]
    .map(faq => {
      if (!searchQuery.trim()) {
        return { ...faq, score: faq.views }; // Default sort by popularity
      }
      
      const query = searchQuery.toLowerCase();
      let score = 0;
      
      // Relevance Scoring Engine
      if (faq.question.toLowerCase().includes(query)) score += 30;
      if (faq.tags.some(t => t.toLowerCase().includes(query))) score += 20;
      if (faq.answer.toLowerCase().includes(query)) score += 10;
      
      return { ...faq, score: score + faq.views };
    })
    .filter(faq => !searchQuery.trim() || faq.score >= 10)
    .sort((a, b) => b.score - a.score);

  return (
    <MainLayout>
      <style>{`
        @keyframes slideFadeUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-fade-up {
          opacity: 0;
          animation: slideFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* 1. PROFESSIONAL WELCOME BANNER */}
      <div 
        className="animate-slide-fade-up bg-gradient-to-r from-[#7A1B22] to-[#9B2A33] rounded-3xl p-6 md:p-8 mb-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6"
        style={{ animationDelay: '0.1s' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="relative z-10 text-center md:text-left w-full md:w-auto">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1">
            Welcome, {loggedInUserName}!
          </h1>
          <p className="text-white/80 font-medium text-sm">Manage your active and pending franchises securely.</p>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-4 rounded-2xl w-full md:w-auto text-center md:text-right shadow-sm">
          <p className="font-bold text-lg tracking-wide text-white">
            {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <p className="text-sm font-medium text-white/80 flex items-center justify-center md:justify-end gap-1.5 mt-1">
            <Clock size={16} />
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* 2. FLEET OVERVIEW HEADER */}
      <header 
        className="animate-slide-fade-up mb-6 flex flex-col sm:flex-row justify-between sm:items-end gap-4"
        style={{ animationDelay: '0.2s' }}
      >
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Activity className="text-[#7A1B22]" size={22} /> My Units
        </h2>
        
        <div className="flex items-center gap-4 bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Capacity</span>
          <div className="flex gap-1.5">
            <div className={`w-8 h-2.5 rounded-full transition-all ${franchises.length >= 1 ? 'bg-[#7A1B22]' : 'bg-slate-200'}`}></div>
            <div className={`w-8 h-2.5 rounded-full transition-all ${franchises.length >= 2 ? 'bg-[#7A1B22]' : 'bg-slate-200'}`}></div>
          </div>
          <span className="text-sm font-extrabold text-[#7A1B22]">{franchises.length}/2</span>
        </div>
      </header>

      {/* 3. MAIN CONTENT AREA */}
      {isLoading ? (
        <div className="flex justify-center items-center h-48 animate-pulse">
          <Loader2 className="animate-spin text-[#7A1B22]" size={36} />
        </div>
      ) : franchises.length === 0 ? (
        <div 
          className="animate-slide-fade-up bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 flex flex-col items-center justify-center min-h-[300px]"
          style={{ animationDelay: '0.3s' }}
        >
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <PlusCircle className="text-slate-300" size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-1">No Franchise Units Found</h3>
          <p className="text-sm mb-6 max-w-sm">Your garage is currently empty. Start by registering your first tricycle unit for a franchise.</p>
          <button onClick={() => navigate('/apply-franchise')} className="bg-[#7A1B22] hover:bg-[#5A1419] text-white px-8 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm">
            Apply New Franchise
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
          {franchises.map((unit, index) => (
            <div 
              key={unit._id} 
              className="animate-slide-fade-up bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden hover:border-slate-300 transition-all"
              style={{ animationDelay: `${0.3 + (index * 0.15)}s` }}
            >
              <div className={`absolute top-0 left-0 w-full h-1.5 ${
                unit.status === 'Active' ? 'bg-emerald-500' :
                unit.status === 'Expired' ? 'bg-orange-500' :
                unit.status === 'Cancelled' ? 'bg-red-500' : 'bg-amber-400'
              }`} />

              <div>
                <div className="flex justify-between items-start mb-6 mt-1">
                  <div>
                    <h3 className="font-black text-2xl text-slate-900 tracking-wider mb-1">
                      {unit.plateNo || 'NO PLATE'}
                    </h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{unit.todaName} &bull; {unit.make} {unit.made}</p>
                  </div>
                  
                  <span className={`px-3 py-1.5 text-[11px] font-bold rounded-md uppercase tracking-wider flex items-center gap-1.5 border shadow-sm ${
                    unit.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    unit.status === 'Expired' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    unit.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {unit.status === 'Active' && <CheckCircle size={14}/>}
                    {unit.status === 'Pending' && <Clock size={14} className="animate-pulse"/>}
                    {(unit.status === 'Cancelled' || unit.status === 'Expired') && <AlertCircle size={14}/>}
                    {unit.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <MapPin className="text-slate-400 shrink-0" size={16} />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Route Zone</p>
                      <p className="text-sm font-bold text-slate-800">{unit.zone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <Hash className="text-slate-400 shrink-0" size={16} />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Motor Number</p>
                      <p className="text-sm font-bold text-slate-800">{unit.motorNo}</p>
                    </div>
                  </div>
                </div>

                {unit.status === 'Active' && (
                  <div className="mb-6 bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl">
                    <div className="grid grid-cols-2 gap-4 mb-3 pb-3 border-b border-emerald-100">
                      <div>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Approved On</p>
                        <p className="text-xs font-bold text-emerald-900">{new Date(unit.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Validity (MTOP)</p>
                        <p className="text-xs font-bold text-emerald-900">1 Year</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-emerald-600" />
                        <span className="text-[11px] font-bold text-emerald-700 uppercase">Expires On</span>
                      </div>
                      <p className="text-sm font-extrabold text-emerald-900">{getExpirationDate(unit.dateApplied)}</p>
                    </div>
                  </div>
                )}

                {unit.status === 'Cancelled' && (
                  <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-red-800 font-bold text-xs uppercase mb-1">Reason for Rejection</h4>
                      <p className="text-sm font-medium text-red-600 leading-tight">{unit.cancelReason || 'LGU did not provide a specific reason.'}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-auto pt-5 border-t border-slate-100">
                {unit.status === 'Expired' ? (
                  <button onClick={() => navigate('/apply-franchise')} className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                    <RefreshCw size={16} /> Renew Franchise
                  </button>
                ) : unit.status === 'Active' ? (
                  <>
                    <button onClick={() => openDetails(unit)} className="flex-1 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors">View Details</button>
                    <button onClick={() => openPrintPermit(unit)} className="flex-1 bg-slate-900 text-white hover:bg-slate-800 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm">
                      <Printer size={16} /> Print
                    </button>
                  </>
                ) : unit.status === 'Cancelled' ? (
                  <button 
                    onClick={() => {
                      localStorage.setItem('reapply_target', JSON.stringify(unit));
                      navigate('/apply-franchise');
                    }} 
                    className="w-full bg-slate-900 text-white hover:bg-slate-800 px-4 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <RefreshCw size={16} /> Fix Issue
                  </button>
                ) : (
                   <>
                     <button onClick={() => openDetails(unit)} className="flex-1 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors">View Details</button>
                     <button disabled className="flex-1 bg-slate-50 text-slate-400 border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-sm cursor-not-allowed">Pending</button>
                   </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. ABOUT US & ADMIN CONTACT SUPPORT SECTION */}
      <section className="animate-slide-fade-up grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8" style={{ animationDelay: '0.45s' }}>
        
        {/* About G-TRAMS Info */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-[#7A1B22]/10 text-[#7A1B22] rounded-2xl">
                <Info size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">About G-TRAMS Portal</h3>
                <p className="text-xs text-slate-500 font-medium">Official Tricycle Records & Application System</p>
              </div>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Ang <strong>G-TRAMS</strong> ay ang opisyal na digital platform ng Lokal na Pamahalaan ng Gasan para sa mabilis, maayos, at transparent na pagproseso ng prangkisa ng tricycle. Layunin nitong pabilisin ang aplikasyon at alisin ang mahabang pila tuwing renewal season.
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

        {/* Administrator Contact Info */}
        <div className="bg-gradient-to-br from-[#7A1B22] to-[#4D1115] text-white rounded-3xl p-6 md:p-8 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={20} className="text-[#D4AF37]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">Admin Helpdesk</span>
            </div>
            <h3 className="text-xl font-black mb-2 tracking-tight">May katanungan?</h3>
            <p className="text-white/80 text-xs leading-relaxed mb-6">
              Maaaring makipag-ugnayan sa mga opisyal na kawani ng munisipyo sa mga sumusunod na linya:
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

      </section>

      {/* 5. DYNAMIC HELPDESK & FAQ MODULE (WITH INTELLIGENT SEARCH & FREQUENCY ALGORITHM) */}
      <section className="animate-slide-fade-up bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm mb-12" style={{ animationDelay: '0.6s' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <HelpCircle className="text-[#7A1B22]" size={24} /> Frequently Asked Questions (FAQ)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Naka-ayos ayon sa pinakamadalas itanong ng mga operators</p>
          </div>

          {/* Realtime Search Algorithm Input */}
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
              Walang nahanap na tugmang tanong sa iyong hinahanap. Subukan ang ibang keyword.
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
                  <div className="p-5 bg-white border-t border-slate-100 text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3 animate-[slideFadeUp_0.2s_ease-out_forwards]">
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
      </section>

      {/* MODAL: VIEW DETAILS */}
      {isDetailsOpen && selectedUnit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDetailsOpen(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative z-10 animate-[slideFadeUp_0.3s_ease-out_forwards]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Franchise Details</h2>
              <button onClick={() => setIsDetailsOpen(false)} className="text-slate-400 hover:text-red-500"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div className="col-span-2">
                  <p className="text-slate-500 text-xs font-bold uppercase mb-1">Operator Name</p>
                  <p className="font-bold text-slate-900">{selectedUnit.fullName}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500 text-xs font-bold uppercase mb-1">Address</p>
                  <p className="font-medium text-slate-800">{selectedUnit.address}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase mb-1">TODA</p>
                  <p className="font-bold text-slate-900">{selectedUnit.todaName}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase mb-1">Route / Zone</p>
                  <p className="font-bold text-slate-900">{selectedUnit.zone}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase mb-1">Plate Number</p>
                  <p className="font-bold text-slate-900">{selectedUnit.plateNo}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase mb-1">Vehicle Make</p>
                  <p className="font-bold text-slate-900">{selectedUnit.make} ({selectedUnit.made})</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase mb-1">Motor No.</p>
                  <p className="font-bold text-slate-900">{selectedUnit.motorNo}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase mb-1">Chassis No.</p>
                  <p className="font-bold text-slate-900">{selectedUnit.chassisNo}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase mb-1">Date Applied</p>
                  <p className="font-bold text-slate-900">{new Date(selectedUnit.dateApplied).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase mb-1">Status</p>
                  <p className="font-bold text-slate-900">{selectedUnit.status}</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button onClick={() => setIsDetailsOpen(false)} className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-sm transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRINT DOCUMENT */}
      {isPrintOpen && selectedUnit && (
        <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col animate-[slideFadeUp_0.3s_ease-out_forwards]">
          <div className="bg-slate-900 p-4 flex justify-between items-center text-white print:hidden">
            <h2 className="font-bold">Print Preview</h2>
            <div className="flex gap-3">
              <button onClick={() => setIsPrintOpen(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-bold flex items-center gap-2">
                <X size={16} /> Cancel
              </button>
              <button onClick={() => window.print()} className="px-5 py-2 bg-[#7A1B22] hover:bg-[#5A1419] text-white rounded-lg text-sm font-bold flex items-center gap-2">
                <Printer size={16} /> Print Document
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 print:p-0 print:bg-white flex justify-center">
            <div className="bg-white w-full max-w-[800px] border border-slate-200 shadow-xl p-12 print:border-none print:shadow-none relative">
              
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <ShieldCheck size={400} />
              </div>

              <div className="text-center mb-8 border-b-2 border-black pb-6">
                <p className="text-sm font-bold uppercase">Republic of the Philippines</p>
                <p className="text-sm font-bold uppercase">Province of Marinduque</p>
                <p className="text-lg font-black uppercase mt-1">Municipality of Gasan</p>
                <div className="mt-6 inline-block bg-black text-white px-8 py-2 border-4 border-black">
                  <h1 className="text-2xl font-black uppercase tracking-widest">Motorized Tricycle Operator's Permit</h1>
                </div>
                <p className="text-xs font-bold tracking-widest mt-2">(OFFICIAL COPY)</p>
              </div>

              <div className="space-y-6 relative z-10">
                <p className="text-justify text-sm leading-relaxed">
                  This certifies that the person named below has been granted the franchise to operate a Motorized Tricycle-For-Hire within the authorized zones of the Municipality of Gasan, subject to existing local ordinances and national laws.
                </p>

                <div className="border border-black p-6 bg-slate-50/50 print:bg-white">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr><td className="py-2 font-bold w-1/3">Operator Name:</td><td className="py-2 border-b border-black/20">{selectedUnit.fullName}</td></tr>
                      <tr><td className="py-2 font-bold">Address:</td><td className="py-2 border-b border-black/20">{selectedUnit.address}</td></tr>
                      <tr><td className="py-2 font-bold">TODA Association:</td><td className="py-2 border-b border-black/20">{selectedUnit.todaName}</td></tr>
                      <tr><td className="py-2 font-bold">Route / Zone:</td><td className="py-2 border-b border-black/20">{selectedUnit.zone}</td></tr>
                    </tbody>
                  </table>
                </div>

                <div className="border border-black p-6 bg-slate-50/50 print:bg-white mt-4">
                  <h3 className="font-bold text-sm uppercase mb-3 border-b border-black pb-1">Vehicle Specifications</h3>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div><span className="font-bold">Make/Brand:</span> {selectedUnit.make}</div>
                    <div><span className="font-bold">Year Model:</span> {selectedUnit.made}</div>
                    <div><span className="font-bold">Motor Number:</span> {selectedUnit.motorNo}</div>
                    <div><span className="font-bold">Chassis Number:</span> {selectedUnit.chassisNo}</div>
                    <div className="col-span-2 mt-2">
                      <span className="font-bold mr-2">Assigned Plate Number:</span>
                      <span className="font-black border-2 border-black px-3 py-1 bg-slate-100 print:bg-white tracking-widest">{selectedUnit.plateNo || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-between items-end text-sm">
                  <div>
                    <p className="font-bold">Approved On:</p>
                    <p>{new Date(selectedUnit.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-black">Valid Until:</p>
                    <p className="font-black underline decoration-2">{getExpirationDate(selectedUnit.dateApplied)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-16 pt-8 border-t-2 border-black text-center">
                <p className="text-xs italic text-slate-500 print:text-black">This Document is system generated and serves as a proof of franchise registration via the G-TRAMS Portal.</p>
                <p className="text-xs font-bold mt-1">System ID: {selectedUnit._id}</p>
              </div>

            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default OperatorDashboard;