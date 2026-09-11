import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout';
import { 
  UploadCloud, FileText, CheckCircle2, Clock3, ArrowLeft, X, Loader2, 
  FileSpreadsheet, Users, ShieldCheck, Phone, MapPin, Hash, Search, 
  Filter, Printer, Sparkles, RefreshCw, AlertCircle, Check, ChevronRight,
  Car
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SubmissionCardsSkeleton } from '../../components/skeleton';
import { useLanguage } from '../../context/LanguageContext';
import FeedbackModal from '../../components/common/FeedbackModal';

const SubmitMembers = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Tab State: 'roster' (Member Group Directory) or 'upload' (Document Submission)
  const [activeTab, setActiveTab] = useState('roster');

  // Member Directory State
  const [todaData, setTodaData] = useState({
    todaName: '',
    stats: { totalMembers: 0, totalUnits: 0, activeUnits: 0, pendingUnits: 0, expiredUnits: 0 },
    members: []
  });
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'pending' | 'expired'

  // Document Upload State
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [submissions, setSubmissions] = useState([]); 
  const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    fetchMyMembers();
    fetchMySubmissions();
  }, []);

  const fetchMyMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/toda/my-members`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTodaData(data);
      }
    } catch (error) {
      console.error('Failed to fetch TODA members:', error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const fetchMySubmissions = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/toda/my-submissions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSubmissions(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/toda/upload`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSubmissions(prev => [data.submission, ...prev]);
        setFile(null);
        setFeedbackModal({
          isOpen: true,
          type: 'success',
          title: 'Roster Document Submitted',
          message: 'Your official TODA member roster document has been successfully submitted to the LGU BPLO office for review.'
        });
      } else {
        setFeedbackModal({
          isOpen: true,
          type: 'error',
          title: 'Upload Failed',
          message: data.message || 'Unable to upload the roster document. Please ensure the file format is valid.'
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your network connection and try again.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Filter members based on search and status
  const filteredMembers = (todaData.members || []).filter(member => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch = !q || 
      member.name.toLowerCase().includes(q) ||
      (member.contact && member.contact.toLowerCase().includes(q)) ||
      (member.address && member.address.toLowerCase().includes(q)) ||
      member.units.some(u => 
        (u.plateNo && u.plateNo.toLowerCase().includes(q)) ||
        (u.make && u.make.toLowerCase().includes(q)) ||
        (u.zone && u.zone.toLowerCase().includes(q))
      );

    if (!matchesSearch) return false;

    if (statusFilter === 'active') {
      return member.units.some(u => u.status === 'Active');
    }
    if (statusFilter === 'pending') {
      return member.units.some(u => u.status === 'Pending' || u.status === 'Ready for Pickup');
    }
    if (statusFilter === 'expired') {
      return member.units.some(u => u.status === 'Expired');
    }
    return true;
  });

  return (
    <MainLayout>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-roster-area, #print-roster-area * {
            visibility: visible;
          }
          #print-roster-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
      
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.6)] backdrop-blur-md rounded-2xl px-4 py-3 flex items-center gap-3 max-w-sm">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
              toast.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400'
                : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400'
            }`}>
              {toast.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}

      <div id="print-roster-area" className="pb-28 sm:pb-24 animate-in fade-in duration-300">
        {/* Top Header */}
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/operator-dashboard')}
              className="print:hidden w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white shadow-2xs active:scale-95 cursor-pointer shrink-0"
              title="Back to Dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A1B22] dark:text-[#D4AF37] bg-[#7A1B22]/10 dark:bg-[#D4AF37]/15 px-2.5 py-0.5 rounded-full border border-[#7A1B22]/15 dark:border-[#D4AF37]/25">
                  {todaData.todaName || 'TODA Association'}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                TODA Association &amp; Member Roster
              </h1>
              <p className="print:hidden text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                View all association members, registered units, or submit official rosters to the LGU.
              </p>
            </div>
          </div>

          {/* Refresh & Print buttons */}
          <div className="print:hidden flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => { fetchMyMembers(); fetchMySubmissions(); }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs active:scale-95 cursor-pointer min-h-[38px]"
              title="Refresh Data"
            >
              <RefreshCw size={14} className={isLoadingMembers ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs active:scale-95 cursor-pointer min-h-[38px]"
              title="Print Roster"
            >
              <Printer size={14} />
              <span>Print Roster</span>
            </button>
          </div>
        </header>

        {/* Modern Tabs Navigation Bar */}
        <div className="print:hidden grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[42px] active:scale-95 ${
              activeTab === 'roster'
                ? 'bg-[#7A1B22] text-white dark:bg-[#D4AF37] dark:text-slate-950 shadow-xs'
                : 'bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Users size={16} />
            <span>Member Roster &amp; Units</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'roster'
                ? 'bg-white/20 dark:bg-slate-950/20 text-white dark:text-slate-950'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {todaData.stats?.totalMembers || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[42px] active:scale-95 ${
              activeTab === 'upload'
                ? 'bg-[#7A1B22] text-white dark:bg-[#D4AF37] dark:text-slate-950 shadow-xs'
                : 'bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <UploadCloud size={16} />
            <span>Submit Document Roster</span>
            {submissions.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'upload'
                  ? 'bg-white/20 dark:bg-slate-950/20 text-white dark:text-slate-950'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {submissions.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: TODA MEMBER GROUP DIRECTORY */}
        {activeTab === 'roster' && (
          <div className="space-y-5">
            {/* Association Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#7A1B22]/10 dark:bg-[#D4AF37]/15 flex items-center justify-center text-[#7A1B22] dark:text-[#D4AF37] shrink-0">
                  <Users size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                    Total Members
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {todaData.stats?.totalMembers || 0}
                  </p>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                    Active Units
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {todaData.stats?.activeUnits || 0}
                  </p>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <Clock3 size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                    Pending
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    {todaData.stats?.pendingUnits || 0}
                  </p>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                    Total Fleet
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {todaData.stats?.totalUnits || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Search & Filter Controls */}
            <div className="print:hidden bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by member name, plate #, contact..."
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#7A1B22] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-[#7A1B22]/15 shadow-2xs min-h-[42px]"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 py-0.5">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] flex items-center justify-center active:scale-95 ${
                    statusFilter === 'all'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] flex items-center justify-center active:scale-95 ${
                    statusFilter === 'active'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] flex items-center justify-center active:scale-95 ${
                    statusFilter === 'pending'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Pending
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('expired')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] flex items-center justify-center active:scale-95 ${
                    statusFilter === 'expired'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Expired
                </button>
              </div>
            </div>

            {/* Member Roster List */}
            {isLoadingMembers ? (
              <div className="space-y-4">
                <SubmissionCardsSkeleton count={4} baseDelay={30} stepDelay={45} />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-dashed border-slate-300 dark:border-slate-700">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Users size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {searchTerm ? 'No matching members found' : 'No registered members found'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                  {searchTerm
                    ? 'Try changing your search keywords or filter pills.'
                    : 'When operators register under your TODA, they will automatically appear here.'}
                </p>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {filteredMembers.map((member, mIdx) => (
                  <div
                    key={member._id || mIdx}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
                  >
                    {/* Top Subtle Gold/Maroon Highlight for President */}
                    {member.isPresident && (
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7A1B22] via-[#D4AF37] to-[#7A1B22]" />
                    )}

                    <div>
                      {/* Member Header: Photo/Avatar, Name, Role Tag */}
                      <div className="flex items-start justify-between gap-3 mb-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          {member.profilePic ? (
                            <img
                              src={member.profilePic}
                              alt={member.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7A1B22]/15 to-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center text-[#7A1B22] dark:text-[#D4AF37] font-bold text-xs shrink-0 shadow-2xs">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {member.name}
                              </h3>
                              {member.isCurrentUser && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  You
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-0.5">
                              {member.isPresident ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-amber-900 dark:text-[#D4AF37] border border-[#D4AF37]/40">
                                  <Sparkles size={10} />
                                  TODA President
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  Operator / Member
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Units count pill */}
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shrink-0">
                          {member.units.length} {member.units.length === 1 ? 'Unit' : 'Units'}
                        </span>
                      </div>

                      {/* Contact & Address Bar */}
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1 mb-3 text-xs">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                          <Phone size={13} className="text-[#7A1B22] dark:text-[#D4AF37] shrink-0" />
                          {member.contact && member.contact !== 'N/A' ? (
                            <a 
                              href={`tel:${member.contact}`} 
                              className="inline-flex items-center gap-1.5 font-semibold text-[#7A1B22] dark:text-[#D4AF37] hover:underline text-xs"
                              title="Call member"
                            >
                              <span>{member.contact}</span>
                              <span className="text-[10px] uppercase font-bold bg-[#7A1B22]/10 dark:bg-[#D4AF37]/15 px-1.5 py-0.5 rounded">Call</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 italic text-xs">No contact number listed</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <MapPin size={13} className="text-[#7A1B22] dark:text-[#D4AF37] shrink-0" />
                          <span className="truncate text-xs font-normal text-slate-600 dark:text-slate-400">
                            {member.address || 'Address not listed'}
                          </span>
                        </div>
                      </div>

                      {/* Member's Registered Units Roster */}
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                          <Car size={13} className="text-[#7A1B22] dark:text-[#D4AF37]" />
                          <span>Registered Tricycle Units</span>
                        </p>

                        {member.units.length === 0 ? (
                          <div className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 font-medium">
                            No franchise applied yet
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {member.units.map((unit, uIdx) => (
                              <div
                                key={unit._id || uIdx}
                                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-2 shadow-2xs"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs">
                                      {unit.plateNo || 'NO PLATE'}
                                    </span>
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
                                      {unit.make || 'Tricycle'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate">
                                    Zone {unit.zone || 'N/A'} {unit.motorNo ? `• Motor: ${unit.motorNo}` : ''}
                                  </p>
                                </div>

                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg uppercase tracking-wider shrink-0 flex items-center gap-1 ${
                                  unit.status === 'Active'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                                    : unit.status === 'Ready for Pickup'
                                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60'
                                    : unit.status === 'Expired'
                                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60'
                                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    unit.status === 'Active' ? 'bg-emerald-500' : unit.status === 'Expired' ? 'bg-orange-500' : 'bg-amber-500'
                                  }`} />
                                  <span>{unit.status}</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DOCUMENT SUBMISSION & HISTORY */}
        {activeTab === 'upload' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Upload Card */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 transition-colors">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Upload Member Roster Document
                  </h2>
                  <span className="text-[11px] font-bold text-[#7A1B22] dark:text-[#D4AF37] uppercase tracking-wider bg-[#7A1B22]/10 dark:bg-[#D4AF37]/15 px-2.5 py-0.5 rounded-lg">
                    PDF • Excel • CSV
                  </span>
                </div>
                
                <form onSubmit={handleUpload}>
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 sm:p-8 text-center hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors relative group">
                    <div className="w-12 h-12 rounded-xl bg-[#7A1B22]/10 dark:bg-[#D4AF37]/15 flex items-center justify-center mx-auto mb-2.5 text-[#7A1B22] dark:text-[#D4AF37] shadow-2xs">
                      <UploadCloud size={24} />
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                      Select a file from your device
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-normal">
                      Supported formats: PDF, Excel (.xlsx, .csv)
                    </p>
                    
                    <input 
                      type="file" 
                      id="file-upload" 
                      className="hidden" 
                      accept=".pdf, .xlsx, .csv, .xls"
                      onChange={handleFileChange}
                    />
                    <label 
                      htmlFor="file-upload"
                      className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-colors shadow-xs active:scale-95 min-h-[42px]"
                    >
                      Browse Files on Device
                    </label>

                    {file && (
                      <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-[#7A1B22] dark:text-[#D4AF37] bg-[#7A1B22]/10 dark:bg-[#D4AF37]/15 py-2 px-3 rounded-xl inline-flex border border-[#7A1B22]/20 dark:border-[#D4AF37]/20">
                        <FileSpreadsheet size={16} />
                        <span className="truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
                        <button 
                          type="button" 
                          onClick={() => setFile(null)} 
                          className="text-slate-400 hover:text-red-500 ml-1 p-0.5 cursor-pointer rounded"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    disabled={!file || isUploading}
                    className={`w-full mt-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white transition-all shadow-xs flex items-center justify-center gap-1.5 min-h-[42px] active:scale-95 ${
                      !file || isUploading 
                      ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-600 cursor-not-allowed' 
                      : 'bg-[#7A1B22] hover:bg-[#5A1419] dark:bg-[#D4AF37] dark:text-slate-950 dark:hover:bg-[#c29e2f] cursor-pointer shadow-[#7A1B22]/20'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Uploading to Database...</span>
                      </>
                    ) : (
                      <span>Submit Member List</span>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* History Card */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 transition-colors">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-3">
                  Recent Submissions
                </h2>
                
                <div className="space-y-2.5">
                  {isLoadingHistory ? (
                    <SubmissionCardsSkeleton count={3} baseDelay={30} stepDelay={45} />
                  ) : submissions.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs font-medium bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                      No submissions yet.
                    </div>
                  ) : (
                    submissions.map((sub, sIdx) => (
                      <div 
                        key={sub._id || sIdx} 
                        className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-800/40 flex flex-col gap-1 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 min-w-0">
                            <FileText size={15} className="text-[#7A1B22] dark:text-[#D4AF37] shrink-0" />
                            <span className="truncate">{sub.fileName}</span>
                          </div>
                          
                          {/* Dynamic Badge Status */}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase flex items-center gap-1 shrink-0 ${
                            sub.status === 'Approved' 
                            ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60' 
                            : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60'
                          }`}>
                            {sub.status === 'Approved' ? <CheckCircle2 size={11} /> : <Clock3 size={11} />}
                            {sub.status}
                          </span>
                        </div>
                        <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 pl-5">
                          Submitted on {new Date(sub.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Centered Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
        type={feedbackModal.type}
        title={feedbackModal.title}
        message={feedbackModal.message}
      />
    </MainLayout>
  );
};

export default SubmitMembers;