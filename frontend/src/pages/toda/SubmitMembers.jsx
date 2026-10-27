import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout';
import { 
  UploadCloud, FileText, CheckCircle2, Clock3, ArrowLeft, X, Loader2, 
  FileSpreadsheet, Users, ShieldCheck, Phone, MapPin, Hash, Search, 
  Filter, Printer, Sparkles, RefreshCw, AlertCircle, Check, ChevronRight,
  UserMinus, AlertTriangle, ShieldAlert, CheckCircle, ExternalLink, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SubmissionCardsSkeleton } from '../../components/skeleton';
import FeedbackModal from '../../components/common/FeedbackModal';
import TricycleIcon from '../../components/common/TricycleIcon';
import StatusBadge from '../../components/common/StatusBadge';
import { formatZoneLabel } from '../../utils/constants';

const REMOVAL_REASONS = [
  'No longer operating / Inactive',
  'Transferred to another TODA or municipality',
  'Violation of TODA Bylaws / Disciplinary action',
  'Unauthorized / Unendorsed membership claim',
  'Failure to attend meetings / Settle association dues',
  'Other (Specified in details)'
];

const SubmitMembers = () => {
  const navigate = useNavigate();

  // Tab State: 'roster' (Member Directory) | 'upload' (Document Submission) | 'removals' (Removal Tracker)
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

  // Document Upload & Realtime AI OCR State
  const [file, setFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [extractedRoster, setExtractedRoster] = useState([]);
  const [detectedToda, setDetectedToda] = useState('');
  const [ocrNotes, setOcrNotes] = useState('');
  const [scanWarning, setScanWarning] = useState('');
  const [newMemberInput, setNewMemberInput] = useState({ name: '', bodyNumber: '' });
  const [showAddMemberRow, setShowAddMemberRow] = useState(false);
  const [selectedHistoryOCR, setSelectedHistoryOCR] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [submissions, setSubmissions] = useState([]); 

  // Removal Requests State
  const [removalRequests, setRemovalRequests] = useState([]);
  const [isLoadingRemovals, setIsLoadingRemovals] = useState(false);
  const [kickModal, setKickModal] = useState({
    isOpen: false,
    member: null,
    reason: REMOVAL_REASONS[0],
    details: '',
    isSubmitting: false
  });

  const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

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

  const fetchRemovalRequests = async () => {
    setIsLoadingRemovals(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/toda/removal-requests`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const d = await res.json();
        setRemovalRequests(Array.isArray(d) ? d : []);
      }
    } catch (err) {
      console.error('Failed to fetch removal requests:', err);
    } finally {
      setIsLoadingRemovals(false);
    }
  };

  useEffect(() => {
    fetchMyMembers();
    fetchMySubmissions();
    fetchRemovalRequests();
  }, []);

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
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const triggerAiScan = async (selectedFile) => {
    setIsScanning(true);
    setScanWarning('');
    setExtractedRoster([]);
    setDetectedToda('');
    setOcrNotes('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/toda/scan-roster`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.extractedMembers) && data.extractedMembers.length > 0) {
        setExtractedRoster(data.extractedMembers);
        setDetectedToda(data.todaAssociation || '');
        setOcrNotes(data.ocrNotes || '');
        showToast(`✨ AI Scan: Digitized ${data.extractedMembers.length} members from ${selectedFile.name}!`, 'success');
      } else {
        const warnMsg = data.message || 'No member records detected from this document. You may still submit the physical file for manual verification.';
        setScanWarning(warnMsg);
        showToast(warnMsg, 'info');
      }
    } catch (err) {
      console.error('Scan error:', err);
      setScanWarning('Could not complete automatic AI scan. You can still submit the file for manual LGU review.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddExtractedMember = () => {
    if (!newMemberInput.name.trim()) {
      showToast('Please enter member full name.', 'error');
      return;
    }
    const cleanName = newMemberInput.name.trim();
    const cleanBodyNumber = (newMemberInput.bodyNumber || '').trim().toUpperCase();
    setExtractedRoster(prev => [
      ...prev,
      {
        name: cleanName,
        operatorName: cleanName,
        bodyNumber: cleanBodyNumber,
        unitNo: cleanBodyNumber,
        confidence: 1.0
      }
    ]);
    setNewMemberInput({ name: '', bodyNumber: '' });
    setShowAddMemberRow(false);
    showToast('Member added to roster list.', 'success');
  };

  const handleRemoveExtractedMember = (indexToRemove) => {
    setExtractedRoster(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const validateAndSetFile = (selectedFile) => {
    const validExtensions = ['pdf', 'xlsx', 'csv', 'xls', 'png', 'jpg', 'jpeg'];
    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    
    if (validExtensions.includes(fileExtension)) {
      setFile(selectedFile);
      triggerAiScan(selectedFile);
    } else {
      showToast('Please upload a valid document (PDF, Excel, CSV, or Image).', 'error');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (extractedRoster.length > 0) {
      formData.append('extractedMembers', JSON.stringify(extractedRoster));
      formData.append('extractedCount', extractedRoster.length);
      if (ocrNotes) formData.append('ocrNotes', ocrNotes);
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/toda/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setFile(null);
        setExtractedRoster([]);
        setDetectedToda('');
        setOcrNotes('');
        setScanWarning('');
        fetchMySubmissions();
        setFeedbackModal({
          isOpen: true,
          type: 'success',
          title: 'Official Masterlist Submitted',
          message: data.message || `Your official TODA masterlist has been successfully submitted to LGU Admin for review.`
        });
      } else {
        setFeedbackModal({
          isOpen: true,
          type: 'error',
          title: 'Upload Failed',
          message: data.message || 'Unable to upload the roster document.'
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your network connection.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenKickModal = (member) => {
    setKickModal({
      isOpen: true,
      member,
      reason: REMOVAL_REASONS[0],
      details: '',
      isSubmitting: false
    });
  };

  const handleSubmitKick = async (e) => {
    e.preventDefault();
    if (!kickModal.member || !kickModal.details.trim()) {
      showToast('Please provide a detailed explanation for this removal request.', 'error');
      return;
    }

    setKickModal(prev => ({ ...prev, isSubmitting: true }));
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/toda/removal-requests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          memberId: kickModal.member._id,
          reason: kickModal.reason,
          details: kickModal.details.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Removal request successfully submitted to LGU Admin for review.', 'success');
        setKickModal({
          isOpen: false,
          member: null,
          reason: REMOVAL_REASONS[0],
          details: '',
          isSubmitting: false
        });
        fetchRemovalRequests();
      } else {
        showToast(data.message || 'Failed to submit removal request.', 'error');
        setKickModal(prev => ({ ...prev, isSubmitting: false }));
      }
    } catch (err) {
      console.error('Error submitting kick request:', err);
      showToast('Server error while submitting removal request.', 'error');
      setKickModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // Filter members based on search and status
  const filteredMembers = (todaData.members || []).filter(member => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch = !q || 
      (member.name || '').toLowerCase().includes(q) ||
      (member.contact && member.contact.toLowerCase().includes(q)) ||
      (member.address && member.address.toLowerCase().includes(q)) ||
      (member.units || []).some(u => 
        (u.plateNo && u.plateNo.toLowerCase().includes(q)) ||
        (u.make && u.make.toLowerCase().includes(q)) ||
        (u.zone && u.zone.toLowerCase().includes(q))
      );

    if (!matchesSearch) return false;

    if (statusFilter === 'active') {
      return (member.units || []).some(u => u.status === 'Active');
    }
    if (statusFilter === 'pending') {
      return (member.units || []).some(u => u.status === 'Pending' || u.status === 'For Signing' || u.status === 'Ready for Pickup');
    }
    if (statusFilter === 'expired') {
      return (member.units || []).some(u => u.status === 'Expired');
    }
    return true;
  });

  const pendingRemovalCount = (Array.isArray(removalRequests) ? removalRequests : []).filter(r => r.status === 'Pending').length;

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
                Manage your official association members, review tricycle units, file disaffiliation requests, or submit signed masterlists.
              </p>
            </div>
          </div>

          {/* Refresh & Print buttons */}
          <div className="print:hidden flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => { fetchMyMembers(); fetchMySubmissions(); fetchRemovalRequests(); }}
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

        {/* Modern 3-Tab Navigation Bar */}
        <div className="print:hidden grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
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
            <span>Member Roster</span>
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
            <span>Upload Roster Document</span>
            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
              activeTab === 'upload'
                ? 'bg-white/20 text-white'
                : 'bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#EAE7E1]'
            }`}>
              {submissions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('removals')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[44px] active:scale-95 ${
              activeTab === 'removals'
                ? 'bg-[#9E2A2B] text-white shadow-xs'
                : 'bg-white dark:bg-[#1C1917] text-[#1F1D1B] dark:text-[#EAE7E1] hover:bg-[#F6F5F3] dark:hover:bg-[#252220] border border-[#E4E1DC] dark:border-[#2E2A27]'
            }`}
          >
            <UserMinus size={16} />
            <span>Removal Requests</span>
            {pendingRemovalCount > 0 ? (
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500 text-white">
                {pendingRemovalCount} Pending
              </span>
            ) : (
              <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                activeTab === 'removals'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#EAE7E1]'
              }`}>
                {removalRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: MEMBER DIRECTORY (HIGH-DENSITY ROW TABLE) */}
        {activeTab === 'roster' && (
          <div className="space-y-4">
            {/* KPI Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-3.5 sm:p-4 rounded-lg bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#9E2A2B]/10 flex items-center justify-center text-[#9E2A2B] dark:text-[#D4AF37] shrink-0">
                  <Users size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider truncate">
                    Members
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
                  <p className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
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
                  <p className="text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-400 mt-0.5">
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
                  placeholder="Search by member name, plate #, contact, or address..."
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
                  All ({todaData.members?.length || 0})
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

            {/* MEMBER ROSTER: HIGH-DENSITY ROW TABLE */}
            {isLoadingMembers ? (
              <div className="space-y-4">
                <SubmissionCardsSkeleton count={5} baseDelay={30} stepDelay={45} />
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
                    ? 'Try changing your search keywords or filter status pills.'
                    : 'When operators register under your TODA, they will automatically appear here in this official roster.'}
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
              <div className="bg-white dark:bg-[#1C1917] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[760px]">
                    <thead>
                      <tr className="bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] text-xs uppercase tracking-wider font-bold">
                        <th className="p-3.5 pl-4 sm:pl-5">Operator / Member</th>
                        <th className="p-3.5">Residence &amp; Contact</th>
                        <th className="p-3.5">Units &amp; Plate Numbers</th>
                        <th className="p-3.5 text-center">Units</th>
                        <th className="p-3.5 pr-4 sm:pr-5 text-right print:hidden">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27] text-xs">
                      {filteredMembers.map((member, mIdx) => (
                        <tr 
                          key={member._id || mIdx}
                          className="hover:bg-[#F6F5F3]/60 dark:hover:bg-[#14110F]/60 transition-colors"
                        >
                          {/* Member Identity */}
                          <td className="p-3.5 pl-4 sm:pl-5">
                            <div className="flex items-center gap-3">
                              {member.profilePic ? (
                                <img
                                  src={member.profilePic}
                                  alt={member.name}
                                  className="w-9 h-9 rounded-lg object-cover border border-[#E4E1DC] dark:border-[#2E2A27] shrink-0 shadow-xs"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-[#9E2A2B]/10 border border-[#9E2A2B]/20 flex items-center justify-center text-[#9E2A2B] dark:text-[#D4AF37] font-bold text-xs shrink-0 shadow-xs">
                                  {member.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="font-bold text-sm text-[#1F1D1B] dark:text-[#EAE7E1] truncate">
                                    {member.name}
                                  </p>
                                  {member.isCurrentUser && (
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#F6F5F3] dark:bg-[#14110F] text-[#6B6761] dark:text-[#A8A29E] border border-[#E4E1DC] dark:border-[#2E2A27]">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="mt-0.5">
                                  {member.isPresident ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#D4AF37]/15 text-amber-800 dark:text-[#D4AF37] border border-[#D4AF37]/30">
                                      <Sparkles size={9} />
                                      TODA President
                                    </span>
                                  ) : member.registeredInApp === false ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                      <FileText size={9} />
                                      Masterlist Member (Not in App)
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">
                                      Registered App Operator
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Residence & Contact */}
                          <td className="p-3.5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-[#1F1D1B] dark:text-[#EAE7E1]">
                                <MapPin size={12} className="text-[#9E2A2B] dark:text-[#D4AF37] shrink-0" />
                                <span className="font-medium text-xs truncate max-w-[180px]">
                                  {member.address || 'Address not listed'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[#6B6761] dark:text-[#A8A29E]">
                                <Phone size={12} className="text-[#9E2A2B] dark:text-[#D4AF37] shrink-0" />
                                {member.contact && member.contact !== 'N/A' ? (
                                  <a 
                                    href={`tel:${member.contact}`} 
                                    className="font-mono font-semibold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline"
                                  >
                                    {member.contact}
                                  </a>
                                ) : (
                                  <span className="italic text-[11px]">No contact</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Units & Plate Numbers */}
                          <td className="p-3.5">
                            {(!member.units || member.units.length === 0) ? (
                              <span className="text-xs text-[#6B6761] dark:text-[#A8A29E] italic">
                                No registered units
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {member.units.map((unit, uIdx) => (
                                  <div 
                                    key={unit._id || uIdx}
                                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-xs"
                                  >
                                    <span className="font-mono font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                                      {unit.plateNo || 'NO PLATE'}
                                    </span>
                                    <span className="text-[10px] text-[#6B6761] dark:text-[#A8A29E]">
                                      {unit.make || 'Unit'}
                                    </span>
                                    <StatusBadge status={unit.status} />
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* Total Units Count */}
                          <td className="p-3.5 text-center">
                            <span className="inline-block px-2.5 py-1 rounded-md bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] font-bold text-xs text-[#1F1D1B] dark:text-[#EAE7E1]">
                              {member.units?.length || 0}
                            </span>
                          </td>

                          {/* Actions: Report / Kick */}
                          <td className="p-3.5 pr-4 sm:pr-5 text-right print:hidden">
                            {!member.isPresident && !member.isCurrentUser ? (
                              <button
                                type="button"
                                onClick={() => handleOpenKickModal(member)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                                title="Report or request removal of this member from the TODA list"
                              >
                                <UserMinus size={13} className="shrink-0" />
                                <span>Report / Kick</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] italic">
                                Association Officer
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                      Upload Official Signed TODA Masterlist
                    </h2>
                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
                      Upload your physically signed endorsement roster. AI OCR will automatically digitize members for LGU approval.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] uppercase tracking-wider bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 px-2.5 py-0.5 rounded-md border border-[#9E2A2B]/20">
                    AI OCR Integrated
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
                      Select or drop physical roster file
                    </p>
                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mb-4 font-normal">
                      Supported formats: Scanned Image (JPG, PNG), PDF, Excel (.xlsx, .csv)
                    </p>
                    
                    <input 
                      type="file" 
                      id="file-upload" 
                      className="hidden" 
                      accept=".pdf, .xlsx, .csv, .xls, .png, .jpg, .jpeg"
                      onChange={handleFileChange}
                    />
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <label 
                        htmlFor="file-upload"
                        className="inline-flex items-center justify-center bg-[#1C1917] hover:bg-[#2E2A27] dark:bg-[#F6F5F3] dark:text-[#14110F] text-white px-5 py-2.5 rounded-lg font-bold text-xs sm:text-sm cursor-pointer transition-colors shadow-xs active:scale-95 min-h-[42px]"
                      >
                        Browse Files on Device
                      </label>
                    </div>

                    {file && (
                      <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 py-2 px-3 rounded-lg inline-flex border border-[#9E2A2B]/20 dark:border-[#D4AF37]/20">
                        <FileSpreadsheet size={16} />
                        <span className="truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
                        <button 
                          type="button" 
                          onClick={() => {
                            setFile(null);
                            setExtractedRoster([]);
                            setScanWarning('');
                            setDetectedToda('');
                          }} 
                          className="text-[#6B6761] dark:text-[#A8A29E] hover:text-red-500 ml-1 p-0.5 cursor-pointer rounded"
                          title="Remove file"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    {/* AI OCR Scanning Progress Banner */}
                    {isScanning && (
                      <div className="mt-4 p-3.5 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 border border-[#9E2A2B]/20 dark:border-[#D4AF37]/30 flex items-center gap-3 animate-pulse text-left">
                        <Loader2 size={20} className="animate-spin text-[#9E2A2B] dark:text-[#D4AF37] shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                            Scanning document with Google Gemini AI OCR...
                          </p>
                          <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
                            Analyzing association headers, driver names, unit body numbers, and plate details...
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Scan Warning / Fallback Notice */}
                    {scanWarning && !isScanning && (
                      <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2 text-left">
                        <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                        <div>
                          <p className="font-bold">AI Scan Note</p>
                          <p className="mt-0.5 leading-snug">{scanWarning}</p>
                        </div>
                      </div>
                    )}

                    {/* Digitized Members Live Preview */}
                    {extractedRoster.length > 0 && !isScanning && (
                      <div className="mt-5 border border-[#9E2A2B]/20 dark:border-[#9E2A2B]/30 bg-gradient-to-br from-[#9E2A2B]/5 via-amber-500/5 to-transparent dark:from-[#9E2A2B]/10 dark:via-[#1A1816] dark:to-transparent rounded-xl p-3.5 sm:p-4 text-left space-y-3 shadow-xs">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#9E2A2B]/20 text-[#9E2A2B] dark:text-[#E07A5F] flex items-center justify-center border border-[#9E2A2B]/20">
                              <Sparkles size={14} />
                            </div>
                            <h3 className="text-xs sm:text-sm font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                              Digitized Masterlist Preview ({extractedRoster.length} Members Detected)
                            </h3>
                          </div>
                          {detectedToda && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E2A2B] dark:text-[#D4AF37] bg-[#9E2A2B]/10 dark:bg-[#9E2A2B]/25 px-2.5 py-0.5 rounded-full border border-[#9E2A2B]/20">
                              {detectedToda}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
                          Review the detected members below. You may manually add or remove names before submitting to LGU Admin.
                        </p>

                        <div className="max-h-60 overflow-y-auto rounded-xl border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917]">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead className="sticky top-0 bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] font-bold uppercase text-[11px] tracking-wider z-10">
                              <tr>
                                <th className="p-2.5 pl-3 w-10">#</th>
                                <th className="p-2.5">Member Full Name</th>
                                <th className="p-2.5 w-28">Body No.</th>
                                <th className="p-2.5 pr-3 text-right w-16">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27]">
                              {extractedRoster.map((m, idx) => {
                                const displayName = m.operatorName || m.name || '';
                                const displayBodyNo = m.bodyNumber || m.unitNo || '';
                                const initials = (displayName || 'M')
                                  .split(' ')
                                  .filter(Boolean)
                                  .slice(0, 2)
                                  .map(w => w[0])
                                  .join('')
                                  .toUpperCase();

                                return (
                                  <tr key={idx} className="hover:bg-[#F6F5F3]/50 dark:hover:bg-[#14110F]/50 transition-colors">
                                    <td className="p-2.5 pl-3 font-mono text-[#6B6761] dark:text-[#A8A29E]">{idx + 1}</td>
                                    <td className="p-2.5 font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                                      <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-[#9E2A2B]/10 dark:bg-[#9E2A2B]/25 text-[#9E2A2B] dark:text-[#E07A5F] flex items-center justify-center text-[10px] font-bold shrink-0">
                                          {initials}
                                        </span>
                                        <span>{displayName}</span>
                                      </div>
                                    </td>
                                    <td className="p-2.5 font-mono font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                                      {displayBodyNo ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-xs text-[#1F1D1B] dark:text-[#EAE7E1] border border-[#E4E1DC] dark:border-[#2E2A27]">
                                          <Hash size={11} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                                          {displayBodyNo}
                                        </span>
                                      ) : (
                                        <span className="text-[#6B6761] dark:text-[#A8A29E] text-[11px] italic">Not set</span>
                                      )}
                                    </td>
                                    <td className="p-2.5 pr-3 text-right">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveExtractedMember(idx)}
                                        className="text-[#6B6761] hover:text-red-600 dark:hover:text-red-400 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                                        title="Remove from list"
                                      >
                                        <X size={14} />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Quick Add Member Option */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setShowAddMemberRow(prev => !prev)}
                            className="text-[11px] font-bold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>{showAddMemberRow ? '– Cancel manual entry' : '+ Add missing member name manually'}</span>
                          </button>
                        </div>

                        {showAddMemberRow && (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 bg-[#F6F5F3] dark:bg-[#14110F] p-2.5 rounded-xl border border-[#E4E1DC] dark:border-[#2E2A27]">
                            <input
                              type="text"
                              placeholder="Full Name (e.g. Dela Cruz, Juan A.)"
                              value={newMemberInput.name}
                              onChange={(e) => setNewMemberInput(prev => ({ ...prev, name: e.target.value }))}
                              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] text-[#1F1D1B] dark:text-[#EAE7E1] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37]"
                            />
                            <input
                              type="text"
                              placeholder="Body No. (e.g. GAS-001)"
                              value={newMemberInput.bodyNumber}
                              onChange={(e) => setNewMemberInput(prev => ({ ...prev, bodyNumber: e.target.value.toUpperCase() }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddExtractedMember();
                                }
                              }}
                              className="w-full sm:w-36 px-3 py-1.5 text-xs rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] text-[#1F1D1B] dark:text-[#EAE7E1] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37]"
                            />
                            <button
                              type="button"
                              onClick={handleAddExtractedMember}
                              className="px-3.5 py-1.5 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs"
                            >
                              Add to List
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    disabled={!file || isUploading || isScanning}
                    className={`w-full mt-4 py-2.5 rounded-lg font-bold text-xs sm:text-sm text-white transition-all shadow-xs flex items-center justify-center gap-1.5 min-h-[44px] active:scale-95 ${
                      !file || isUploading || isScanning
                      ? 'bg-[#6B7280] cursor-not-allowed' 
                      : 'bg-[#9E2A2B] hover:bg-[#7A1B22] cursor-pointer'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Submitting Masterlist to LGU Admin...</span>
                      </>
                    ) : isScanning ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Scanning Document with AI OCR...</span>
                      </>
                    ) : extractedRoster.length > 0 ? (
                      <span>Submit Masterlist with {extractedRoster.length} Digitized Members</span>
                    ) : (
                      <span>Submit Official Masterlist Document</span>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* History Card */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-[#1C1917] rounded-lg shadow-xs border border-[#E4E1DC] dark:border-[#2E2A27] p-4 sm:p-5 transition-colors">
                <h2 className="text-xs sm:text-sm font-bold text-[#1F1D1B] dark:text-[#EAE7E1] mb-3">
                  Submission History
                </h2>
                
                <div className="space-y-2.5">
                  {isLoadingHistory ? (
                    <SubmissionCardsSkeleton count={3} baseDelay={30} stepDelay={45} />
                  ) : submissions.length === 0 ? (
                    <div className="text-center py-6 text-[#6B6761] dark:text-[#A8A29E] text-xs font-medium bg-[#F6F5F3] dark:bg-[#14110F] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                      No roster documents submitted yet.
                    </div>
                  ) : (
                    submissions.map((sub, sIdx) => (
                      <div 
                        key={sub._id || sIdx} 
                        className="p-3 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] flex flex-col gap-1.5 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] min-w-0">
                            <FileText size={15} className="text-[#9E2A2B] dark:text-[#D4AF37] shrink-0" />
                            <span className="truncate">{sub.fileName}</span>
                          </div>
                          
                          <StatusBadge status={sub.status} />
                        </div>

                        {sub.extractedCount > 0 ? (
                          <button
                            type="button"
                            onClick={() => setSelectedHistoryOCR(sub)}
                            className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 cursor-pointer transition-colors"
                          >
                            <span className="flex items-center gap-1">
                              <Sparkles size={11} />
                              <span>{sub.extractedCount} members extracted</span>
                            </span>
                            <span className="text-[10px] underline">View List</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] italic">
                            Physical document attached
                          </span>
                        )}

                        <div className="flex items-center justify-between text-[11px] font-normal text-[#6B6761] dark:text-[#A8A29E] pt-0.5">
                          <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                          {sub.filePath && (
                            <a
                              href={sub.filePath.startsWith('http') ? sub.filePath : `${import.meta.env.VITE_API_URL}/${sub.filePath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#9E2A2B] dark:text-[#D4AF37] hover:underline flex items-center gap-0.5 font-semibold"
                            >
                              <Eye size={11} />
                              <span>View File</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: REMOVAL REQUESTS TRACKER */}
        {activeTab === 'removals' && (
          <div className="bg-white dark:bg-[#1C1917] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                  Member Disaffiliation &amp; Removal Requests
                </h2>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
                  Track all removal/kick requests filed to the Municipal Administrator.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchRemovalRequests}
                className="px-3 py-1.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] hover:bg-neutral-200 cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw size={12} className={isLoadingRemovals ? "animate-spin" : ""} />
                <span>Refresh Requests</span>
              </button>
            </div>

            {isLoadingRemovals ? (
              <div className="py-8 text-center text-xs text-[#6B6761]">
                <Loader2 size={20} className="animate-spin mx-auto mb-2 text-[#9E2A2B]" />
                Loading removal requests...
              </div>
            ) : removalRequests.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg text-xs text-[#6B6761] dark:text-[#A8A29E]">
                <UserMinus size={28} className="mx-auto mb-2 opacity-40" />
                <p className="font-semibold text-sm text-[#1F1D1B] dark:text-[#EAE7E1]">No removal requests filed</p>
                <p className="text-xs mt-1">If an operator is no longer part of your association, use the "Report / Kick" button on the Member Roster tab.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] text-xs uppercase tracking-wider font-bold">
                      <th className="p-3 pl-4">Member Name</th>
                      <th className="p-3">Reason</th>
                      <th className="p-3">President's Explanation</th>
                      <th className="p-3">Date Filed</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 pr-4">Admin Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27] text-xs">
                    {removalRequests.map((req) => (
                      <tr key={req._id} className="hover:bg-[#F6F5F3]/50 dark:hover:bg-[#14110F]/50">
                        <td className="p-3 pl-4 font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                          {req.memberName}
                        </td>
                        <td className="p-3 text-red-700 dark:text-red-400 font-semibold">
                          {req.reason}
                        </td>
                        <td className="p-3 text-[#6B6761] dark:text-[#A8A29E] max-w-xs truncate" title={req.details}>
                          {req.details}
                        </td>
                        <td className="p-3 text-[#6B6761] dark:text-[#A8A29E] font-mono">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <StatusBadge 
                            status={req.status === 'Approved' ? 'Active' : (req.status === 'Rejected' ? 'Expired' : 'Pending')} 
                            label={req.status} 
                          />
                        </td>
                        <td className="p-3 pr-4 text-[#6B6761] dark:text-[#A8A29E] italic">
                          {req.adminRemarks || 'Awaiting municipal review'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* REPORT / KICK MEMBER MODAL */}
      {kickModal.isOpen && kickModal.member && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xl rounded-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm sm:text-base">
                <ShieldAlert size={18} />
                <span>Request Member Removal</span>
              </div>
              <button
                type="button"
                onClick={() => setKickModal(prev => ({ ...prev, isOpen: false }))}
                className="text-[#6B6761] hover:text-[#1F1D1B] dark:text-[#A8A29E] dark:hover:text-white p-1 rounded cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg p-3 text-xs text-red-800 dark:text-red-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle size={14} className="shrink-0" />
                <span>Formal Disaffiliation Notice</span>
              </p>
              <p className="leading-snug">
                You are requesting to remove <strong className="font-bold underline">{kickModal.member.name}</strong> from <strong>{todaData.todaName}</strong>. 
                This request will be reviewed by the Municipal Administrator / BPLO before disaffiliation is finalized.
              </p>
            </div>

            <form onSubmit={handleSubmitKick} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F1D1B] dark:text-[#EAE7E1] mb-1">
                  Reason for Removal <span className="text-red-500">*</span>
                </label>
                <select
                  value={kickModal.reason}
                  onChange={(e) => setKickModal(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3 py-2 text-xs font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] outline-none focus:border-[#9E2A2B] focus:ring-1 focus:ring-[#9E2A2B] cursor-pointer min-h-[42px]"
                  required
                >
                  {REMOVAL_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F1D1B] dark:text-[#EAE7E1] mb-1">
                  Detailed Justification / Board Resolution <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={kickModal.details}
                  onChange={(e) => setKickModal(prev => ({ ...prev, details: e.target.value }))}
                  placeholder="Provide specific details, incidents, dates, or TODA board resolution number justifying this removal..."
                  className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-3 text-xs font-medium text-[#1F1D1B] dark:text-[#EAE7E1] placeholder:text-[#6B6761] outline-none focus:border-[#9E2A2B] focus:ring-1 focus:ring-[#9E2A2B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setKickModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] text-xs font-bold text-[#6B6761] dark:text-[#A8A29E] hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={kickModal.isSubmitting}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  {kickModal.isSubmitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Filing Request...</span>
                    </>
                  ) : (
                    <>
                      <UserMinus size={13} />
                      <span>Submit Removal Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIGITIZED MEMBERS HISTORY VIEWER MODAL */}
      {selectedHistoryOCR && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1A1816] border border-[#E4E1DC] dark:border-[#2E2A27] shadow-2xl rounded-2xl max-w-xl w-full p-4 sm:p-5 space-y-4 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#9E2A2B]/20 text-[#9E2A2B] dark:text-[#E07A5F] flex items-center justify-center border border-[#9E2A2B]/20">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#1F1D1B] dark:text-[#EAE7E1] leading-tight">
                    Digitized Masterlist Members
                  </h3>
                  <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
                    Endorsed roster records from submitted document
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHistoryOCR(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6761] hover:text-[#1F1D1B] dark:text-[#A8A29E] dark:hover:text-white hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] transition-colors cursor-pointer"
                title="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs bg-gradient-to-br from-[#F6F5F3] via-white to-[#F6F5F3] dark:from-[#14110F] dark:via-[#1A1816] dark:to-[#14110F] p-3 sm:p-3.5 rounded-xl border border-[#E4E1DC] dark:border-[#2E2A27] gap-2">
              <div>
                <p className="font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">{selectedHistoryOCR.fileName}</p>
                <p className="text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
                  Submitted on {new Date(selectedHistoryOCR.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className="font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px]">
                {selectedHistoryOCR.extractedCount || selectedHistoryOCR.extractedMembers?.length || 0} Certified Members
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto rounded-xl border border-[#E4E1DC] dark:border-[#2E2A27]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] font-bold uppercase text-[11px] tracking-wider z-10">
                  <tr>
                    <th className="p-2.5 pl-3 w-10">#</th>
                    <th className="p-2.5">Certified Member Name</th>
                    <th className="p-2.5 w-28">Body No.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27]">
                  {(selectedHistoryOCR.extractedMembers || []).map((m, idx) => {
                    const displayName = m.operatorName || m.name || '';
                    const displayBodyNo = m.bodyNumber || m.unitNo || '';
                    const initials = (displayName || 'M')
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map(w => w[0])
                      .join('')
                      .toUpperCase();

                    return (
                      <tr key={idx} className="hover:bg-[#F6F5F3]/50 dark:hover:bg-[#14110F]/50 transition-colors">
                        <td className="p-2.5 pl-3 font-mono text-[#6B6761] dark:text-[#A8A29E]">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#9E2A2B]/10 dark:bg-[#9E2A2B]/25 text-[#9E2A2B] dark:text-[#E07A5F] flex items-center justify-center text-[10px] font-bold shrink-0">
                              {initials}
                            </span>
                            <span>{displayName}</span>
                          </div>
                        </td>
                        <td className="p-2.5 font-mono font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                          {displayBodyNo ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-xs text-[#1F1D1B] dark:text-[#EAE7E1] border border-[#E4E1DC] dark:border-[#2E2A27]">
                              <Hash size={11} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                              {displayBodyNo}
                            </span>
                          ) : (
                            <span className="text-[#6B6761] dark:text-[#A8A29E] text-[11px] italic">Not set</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
              {selectedHistoryOCR.filePath && (
                <a
                  href={selectedHistoryOCR.filePath.startsWith('http') ? selectedHistoryOCR.filePath : `${import.meta.env.VITE_API_URL}/${selectedHistoryOCR.filePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline flex items-center gap-1"
                >
                  <Eye size={13} />
                  <span>View Original Uploaded Document</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setSelectedHistoryOCR(null)}
                className="px-4 py-1.5 rounded-lg bg-[#1C1917] hover:bg-[#2E2A27] dark:bg-[#F6F5F3] dark:hover:bg-white dark:text-[#14110F] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}


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
