import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout';
import { 
  UploadCloud, FileText, CheckCircle2, Clock3, ArrowLeft, X, Loader2, 
  FileSpreadsheet, Users, ShieldCheck, Phone, MapPin, Hash, Search, 
  Filter, Printer, Sparkles, RefreshCw, AlertCircle, Check, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SubmissionCardsSkeleton } from '../../components/skeleton';
import { useLanguage } from '../../context/LanguageContext';
import FeedbackModal from '../../components/common/FeedbackModal';
import TricycleIcon from '../../components/common/TricycleIcon';
import StatusBadge from '../../components/common/StatusBadge';

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

  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
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
    const slowNetTimer = setTimeout(() => {
      showToast("Network seems slow. Please wait while processing the masterlist...", "warning");
    }, 7000);

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
          message: 'Your official TODA member roster document has been successfully submitted to the LGU Office of the Vice Mayor Extension office for review.'
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
      clearTimeout(slowNetTimer);
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
      return member.units.some(u => u.status === 'Pending' || u.status === 'For Signing' || u.status === 'Ready for Pickup');
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
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] shadow-lg rounded-lg px-4 py-3 flex items-center gap-3 max-w-sm">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
              toast.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400'
                : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400'
            }`}>
              {toast.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] leading-snug">
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}

      <div id="print-roster-area" className="pb-28 sm:pb-24 animate-in fade-in duration-300">
        {/* Top Header Card */}
        <header className="mb-6 bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] border-l-4 border-l-[#9E2A2B] rounded-lg p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/operator-dashboard')}
              className="print:hidden w-9 h-9 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-center text-[#1F1D1B] dark:text-[#EAE7E1] hover:bg-[#E4E1DC] dark:hover:bg-[#252220] shadow-xs active:scale-95 cursor-pointer shrink-0 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#9E2A2B] dark:text-[#D4AF37] bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 px-2.5 py-0.5 rounded-md border border-[#9E2A2B]/20 dark:border-[#D4AF37]/30">
                  {todaData.todaName || 'TODA Association'}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-[#1F1D1B] dark:text-[#EAE7E1] tracking-tight">
                TODA Association &amp; Member Roster
              </h1>
              <p className="print:hidden text-xs sm:text-sm text-[#6B6761] dark:text-[#A8A29E] mt-0.5 font-medium">
                View all association members, registered units, or submit official rosters to the LGU.
              </p>
            </div>
          </div>

          {/* Refresh & Print buttons */}
          <div className="print:hidden flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => { fetchMyMembers(); fetchMySubmissions(); }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] hover:bg-[#E4E1DC] dark:hover:bg-[#252220] shadow-xs active:scale-95 cursor-pointer min-h-[40px] transition-colors"
              title="Refresh Data"
            >
              <RefreshCw size={14} className={isLoadingMembers ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] hover:bg-[#E4E1DC] dark:hover:bg-[#252220] shadow-xs active:scale-95 cursor-pointer min-h-[40px] transition-colors"
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
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[44px] active:scale-95 ${
              activeTab === 'roster'
                ? 'bg-[#9E2A2B] text-white shadow-xs'
                : 'bg-white dark:bg-[#1C1917] text-[#1F1D1B] dark:text-[#EAE7E1] hover:bg-[#F6F5F3] dark:hover:bg-[#252220] border border-[#E4E1DC] dark:border-[#2E2A27]'
            }`}
          >
            <Users size={16} />
            <span>Member Roster &amp; Units</span>
            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
              activeTab === 'roster'
                ? 'bg-white/20 text-white'
                : 'bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#EAE7E1]'
            }`}>
              {todaData.stats?.totalMembers || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[44px] active:scale-95 ${
              activeTab === 'upload'
                ? 'bg-[#9E2A2B] text-white shadow-xs'
                : 'bg-white dark:bg-[#1C1917] text-[#1F1D1B] dark:text-[#EAE7E1] hover:bg-[#F6F5F3] dark:hover:bg-[#252220] border border-[#E4E1DC] dark:border-[#2E2A27]'
            }`}
          >
            <UploadCloud size={16} />
            <span>Submit Document Roster</span>
            {submissions.length > 0 && (
              <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                activeTab === 'upload'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#EAE7E1]'
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
              <div className="p-3.5 sm:p-4 rounded-lg bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 flex items-center justify-center text-[#9E2A2B] dark:text-[#D4AF37] shrink-0">
                  <Users size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider truncate">
                    Total Members
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-[#1F1D1B] dark:text-[#EAE7E1] mt-0.5">
                    {todaData.stats?.totalMembers || 0}
                  </p>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-lg bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider truncate">
                    Active Units
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {todaData.stats?.activeUnits || 0}
                  </p>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-lg bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <Clock3 size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider truncate">
                    Pending
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    {todaData.stats?.pendingUnits || 0}
                  </p>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-lg bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider truncate">
                    Total Fleet
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-[#1F1D1B] dark:text-[#EAE7E1] mt-0.5">
                    {todaData.stats?.totalUnits || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Search & Filter Controls */}
            <div className="print:hidden bg-white dark:bg-[#1C1917] rounded-lg p-3.5 sm:p-4 border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6761] dark:text-[#A8A29E]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by member name, plate #, contact..."
                  className="w-full pl-9 pr-9 py-2.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-xs sm:text-sm font-medium text-[#1F1D1B] dark:text-[#EAE7E1] placeholder:text-[#6B6761] dark:placeholder:text-[#A8A29E] focus:outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] shadow-xs min-h-[44px]"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] p-1 cursor-pointer"
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
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[38px] flex items-center justify-center active:scale-95 ${
                    statusFilter === 'all'
                      ? 'bg-[#1C1917] text-white dark:bg-[#EAE7E1] dark:text-[#14110F] shadow-xs'
                      : 'bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#EAE7E1] border border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-neutral-100'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('active')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[38px] flex items-center justify-center active:scale-95 ${
                    statusFilter === 'active'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#EAE7E1] border border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-neutral-100'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[38px] flex items-center justify-center active:scale-95 ${
                    statusFilter === 'pending'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#EAE7E1] border border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-neutral-100'
                  }`}
                >
                  Pending
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('expired')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[38px] flex items-center justify-center active:scale-95 ${
                    statusFilter === 'expired'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#EAE7E1] border border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-neutral-100'
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
              <div className="bg-white dark:bg-[#1C1917] rounded-lg p-10 text-center border border-dashed border-[#E4E1DC] dark:border-[#2E2A27]">
                <div className="w-12 h-12 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-center mx-auto mb-3 text-[#6B6761] dark:text-[#A8A29E]">
                  <Users size={24} />
                </div>
                <h3 className="text-base font-bold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1">
                  {searchTerm ? 'No matching members found' : 'No registered members found'}
                </h3>
                <p className="text-xs sm:text-sm text-[#6B6761] dark:text-[#A8A29E] max-w-sm mx-auto mb-4">
                  {searchTerm
                    ? 'Try changing your search keywords or filter pills.'
                    : 'When operators register under your TODA, they will automatically appear here.'}
                </p>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                    className="px-4 py-2 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] hover:bg-neutral-200 cursor-pointer"
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
                    className="bg-white dark:bg-[#1C1917] rounded-lg p-4 sm:p-5 border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs hover:border-[#9E2A2B]/40 transition-all flex flex-col justify-between relative overflow-hidden"
                  >
                    {/* Top Subtle Gold/Maroon Highlight for President */}
                    {member.isPresident && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-[#D4AF37]" />
                    )}

                    <div>
                      {/* Member Header: Photo/Avatar, Name, Role Tag */}
                      <div className="flex items-start justify-between gap-3 mb-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          {member.profilePic ? (
                            <img
                              src={member.profilePic}
                              alt={member.name}
                              className="w-10 h-10 rounded-lg object-cover border border-[#E4E1DC] dark:border-[#2E2A27] shrink-0 shadow-xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#9E2A2B]/10 border border-[#9E2A2B]/20 flex items-center justify-center text-[#9E2A2B] dark:text-[#D4AF37] font-bold text-xs shrink-0 shadow-xs">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold text-[#1F1D1B] dark:text-[#EAE7E1] truncate">
                                {member.name}
                              </h3>
                              {member.isCurrentUser && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#F6F5F3] dark:bg-[#14110F] text-[#6B6761] dark:text-[#A8A29E] border border-[#E4E1DC] dark:border-[#2E2A27]">
                                  You
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-0.5">
                              {member.isPresident ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#D4AF37]/15 text-amber-800 dark:text-[#D4AF37] border border-[#D4AF37]/30">
                                  <Sparkles size={10} />
                                  TODA President
                                </span>
                              ) : (
                                <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F6F5F3] dark:bg-[#14110F] text-[#6B6761] dark:text-[#A8A29E] border border-[#E4E1DC] dark:border-[#2E2A27]">
                                  Operator / Member
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Units count pill */}
                        <span className="px-2.5 py-1 rounded-md bg-[#F6F5F3] dark:bg-[#14110F] text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] border border-[#E4E1DC] dark:border-[#2E2A27] shrink-0">
                          {member.units.length} {member.units.length === 1 ? 'Unit' : 'Units'}
                        </span>
                      </div>

                      {/* Contact & Address Bar */}
                      <div className="p-2.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] space-y-1 mb-3 text-xs">
                        <div className="flex items-center gap-2 text-[#1F1D1B] dark:text-[#EAE7E1]">
                          <Phone size={13} className="text-[#9E2A2B] dark:text-[#D4AF37] shrink-0" />
                          {member.contact && member.contact !== 'N/A' ? (
                            <a 
                              href={`tel:${member.contact}`} 
                              className="inline-flex items-center gap-1.5 font-semibold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline text-xs"
                              title="Call member"
                            >
                              <span>{member.contact}</span>
                              <span className="text-xs uppercase font-bold bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 px-1.5 py-0.5 rounded">Call</span>
                            </a>
                          ) : (
                            <span className="text-[#6B6761] dark:text-[#A8A29E] italic text-xs">No contact number listed</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[#1F1D1B] dark:text-[#EAE7E1]">
                          <MapPin size={13} className="text-[#9E2A2B] dark:text-[#D4AF37] shrink-0" />
                          <span className="truncate text-xs font-normal text-[#6B6761] dark:text-[#A8A29E]">
                            {member.address || 'Address not listed'}
                          </span>
                        </div>
                      </div>

                      {/* Member's Registered Units Roster */}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E] mb-1.5 flex items-center gap-1.5">
                          <TricycleIcon size={14} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                          <span>Registered Tricycle Units</span>
                        </p>

                        {(!member.units || member.units.length === 0) ? (
                          <div className="flex flex-col items-center justify-center p-6 border border-dashed border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg bg-[#F6F5F3] dark:bg-[#14110F]">
                            <AlertCircle className="w-6 h-6 text-[#6B6761] dark:text-[#A8A29E] mb-2" />
                            <p className="text-sm font-medium text-[#1F1D1B] dark:text-[#EAE7E1]">No active tricycle units</p>
                            <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-1">This member needs an approved franchise</p>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {(member.units || []).map((unit, uIdx) => (
                              <div
                                key={unit._id || uIdx}
                                className="p-2.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-between gap-2 shadow-xs"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                    <span className="font-mono text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] bg-white dark:bg-[#1C1917] px-2 py-0.5 rounded-md border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs">
                                      {unit.plateNo || 'NO PLATE'}
                                    </span>
                                    <span className="text-xs font-medium text-[#1F1D1B] dark:text-[#EAE7E1] truncate">
                                      {unit.make || 'Tricycle'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-normal truncate">
                                    Zone {unit.zone || 'N/A'} {unit.motorNo ? `• Motor: ${unit.motorNo}` : ''}
                                  </p>
                                </div>

                                <StatusBadge status={unit.status} />
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
              <div className="bg-white dark:bg-[#1C1917] rounded-lg shadow-xs border border-[#E4E1DC] dark:border-[#2E2A27] p-5 sm:p-6 transition-colors">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                    Upload Member Roster Document
                  </h2>
                  <span className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] uppercase tracking-wider bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 px-2.5 py-0.5 rounded-md border border-[#9E2A2B]/20">
                    PDF • Excel • CSV
                  </span>
                </div>
                
                <form onSubmit={handleUpload}>
                  <div 
                    className={`border-2 border-dashed rounded-lg p-5 sm:p-8 text-center transition-colors relative group ${
                      isDragging 
                        ? 'border-[#9E2A2B] bg-[#9E2A2B]/5' 
                        : 'border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-[#F6F5F3] dark:hover:bg-[#14110F]'
                    }`}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="w-12 h-12 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 flex items-center justify-center mx-auto mb-2.5 text-[#9E2A2B] dark:text-[#D4AF37] shadow-xs">
                      <UploadCloud size={24} />
                    </div>
                    <p className="text-sm font-bold text-[#1F1D1B] dark:text-[#EAE7E1] mb-0.5">
                      Select a file from your device
                    </p>
                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mb-4 font-normal">
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
                      className="inline-flex items-center justify-center bg-[#1C1917] hover:bg-[#2E2A27] dark:bg-[#F6F5F3] dark:text-[#14110F] text-white px-5 py-2.5 rounded-lg font-bold text-xs sm:text-sm cursor-pointer transition-colors shadow-xs active:scale-95 min-h-[42px]"
                    >
                      Browse Files on Device
                    </label>

                    {file && (
                      <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 py-2 px-3 rounded-lg inline-flex border border-[#9E2A2B]/20 dark:border-[#D4AF37]/20">
                        <FileSpreadsheet size={16} />
                        <span className="truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
                        <button 
                          type="button" 
                          onClick={() => setFile(null)} 
                          className="text-[#6B6761] dark:text-[#A8A29E] hover:text-red-500 ml-1 p-0.5 cursor-pointer rounded"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    disabled={!file || isUploading}
                    className={`w-full mt-4 py-2.5 rounded-lg font-bold text-xs sm:text-sm text-white transition-all shadow-xs flex items-center justify-center gap-1.5 min-h-[44px] active:scale-95 ${
                      !file || isUploading 
                      ? 'bg-[#6B7280] cursor-not-allowed' 
                      : 'bg-[#9E2A2B] hover:bg-[#7A1B22] cursor-pointer'
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
              <div className="bg-white dark:bg-[#1C1917] rounded-lg shadow-xs border border-[#E4E1DC] dark:border-[#2E2A27] p-4 sm:p-5 transition-colors">
                <h2 className="text-xs sm:text-sm font-bold text-[#1F1D1B] dark:text-[#EAE7E1] mb-3">
                  Recent Submissions
                </h2>
                
                <div className="space-y-2.5">
                  {isLoadingHistory ? (
                    <SubmissionCardsSkeleton count={3} baseDelay={30} stepDelay={45} />
                  ) : submissions.length === 0 ? (
                    <div className="text-center py-6 text-[#6B6761] dark:text-[#A8A29E] text-xs font-medium bg-[#F6F5F3] dark:bg-[#14110F] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                      No submissions yet.
                    </div>
                  ) : (
                    submissions.map((sub, sIdx) => (
                      <div 
                        key={sub._id || sIdx} 
                        className="p-3 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] flex flex-col gap-1 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] min-w-0">
                            <FileText size={15} className="text-[#9E2A2B] dark:text-[#D4AF37] shrink-0" />
                            <span className="truncate">{sub.fileName}</span>
                          </div>
                          
                          <StatusBadge status={sub.status} />
                        </div>
                        <p className="text-xs font-normal text-[#6B6761] dark:text-[#A8A29E] pl-5">
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

