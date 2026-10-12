import React, { useState, useEffect, useMemo } from 'react';
import { TODA_LIST } from '../../utils/constants';
import MainLayout from '../../components/MainLayout';
import { 
  Users, FileText, CheckCircle, CheckCircle2, Search, Eye, FolderTree,
  Building2, ShieldCheck, AlertCircle, AlertTriangle, Clock, ChevronDown,
  X, UserMinus, Sparkles, Check, CheckCheck, Loader2, RefreshCw
} from 'lucide-react';
import { AccordionListSkeleton, TableRowsSkeleton } from '../../components/skeleton';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { isNameMatch } from '../../utils/nameMatcher';

const ValidateTODA = () => {
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'validations' | 'removals'
  const [isLoading, setIsLoading] = useState(true);
  
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [removals, setRemovals] = useState([]);
  const [selectedSubmissionOCR, setSelectedSubmissionOCR] = useState(null);
  const [ocrModalSearch, setOcrModalSearch] = useState('');
  const [todaActiveSubTabs, setTodaActiveSubTabs] = useState({}); // key: todaName -> 'roster' | 'drivers'
  const [isRescanning, setIsRescanning] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };
  
  // Accordion state for directory
  const [expandedToda, setExpandedToda] = useState(null);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/toda/submissions', { 
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } 
      });
      if (response.ok) setSubmissions(await response.json());
    } catch (error) { 
      console.error('Error fetching TODA submissions:', error); 
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/auth', { 
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } 
      });
      if (response.ok) {
        const allUsers = await response.json();
        // Filter out staff/admin users (admin, administrator, cashier)
        setUsers(allUsers.filter(u => !['admin', 'administrator', 'cashier'].includes(String(u.role || '').toLowerCase().trim())));
      }
    } catch (error) { 
      console.error('Error fetching users:', error); 
    }
  };

  const fetchFranchises = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises?limit=2000`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        const records = Array.isArray(data) ? data : (data.data || []);
        
        // Ensure oldest applications are on top (FIFO)
        const queue = records.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        setFranchises(queue);
      }
    } catch (error) { 
      console.error('Error fetching franchises:', error); 
    }
  };

  const fetchRemovals = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/toda/removal-requests`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        setRemovals(await response.json());
      }
    } catch (err) {
      console.error('Error fetching removal requests:', err);
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.allSettled([
        fetchSubmissions(),
        fetchUsers(),
        fetchFranchises(),
        fetchRemovals()
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleApprove = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/toda/approve/${id}`, {
        method: 'PUT', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        setSubmissions(submissions.map(sub => sub._id === id ? { ...sub, status: 'Approved' } : sub));
        showToast('TODA member list approved successfully! Active OCR roster ingested.', 'success');
      } else { 
        showToast('Failed to approve list.', 'error'); 
      }
    } catch (error) { 
      showToast('Cannot connect to server.', 'error'); 
    }
  };

  const handleRescan = async (id) => {
    setIsRescanning(true);
    try {
      showToast('Re-scanning document with Google Gemini AI OCR...', 'info');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/toda/submissions/${id}/rescan`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToast(data.message || 'Re-scanned successfully!', 'success');
        await fetchSubmissions();
        if (selectedSubmissionOCR && selectedSubmissionOCR._id === id) {
          setSelectedSubmissionOCR(data.submission);
        }
      } else {
        showToast(data.message || 'Could not extract members during re-scan.', 'error');
      }
    } catch (e) {
      showToast('Cannot connect to server.', 'error');
    } finally {
      setIsRescanning(false);
    }
  };

  const handleApproveRemoval = async (id, memberName, todaName) => {
    if (!window.confirm(`Are you sure you want to approve the disaffiliation of ${memberName} from ${todaName}? This operator will be reset to NON-TODA.`)) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/toda/removal-requests/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminRemarks: 'Approved by Municipal Administrator.' })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Member disaffiliated successfully.', 'success');
        fetchRemovals();
        fetchUsers();
        fetchFranchises();
      } else {
        showToast(data.message || 'Failed to approve removal request.', 'error');
      }
    } catch (e) {
      showToast('Cannot connect to server.', 'error');
    }
  };

  const handleRejectRemoval = async (id) => {
    const remarks = window.prompt('Enter reason for rejecting this removal request (optional):', 'Disapproved by Administrator');
    if (remarks === null) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/toda/removal-requests/${id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminRemarks: remarks.trim() || 'Disapproved by Administrator' })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Removal request disapproved.', 'success');
        fetchRemovals();
      } else {
        showToast(data.message || 'Failed to reject removal request.', 'error');
      }
    } catch (e) {
      showToast('Cannot connect to server.', 'error');
    }
  };

  // Helper to find a member's corresponding franchise record
  const getMemberFranchise = (member) => {
    if (!member || !franchises.length) return null;
    const mId = String(member._id || '');
    const mName = (member.name || '').trim();
    return franchises.find(f => {
      const opId = f.operator?._id ? String(f.operator._id) : (typeof f.operator === 'string' ? f.operator : '');
      if (opId && opId === mId) return true;
      if (f.fullName && isNameMatch(f.fullName, mName)) return true;
      return false;
    });
  };

  // KPI Stats Strip calculations
  const totalRecognizedTodas = TODA_LIST.filter(t => t !== 'NON-TODA').length;
  const totalOperatorsCount = users.length;
  const activeMtopCount = franchises.filter(f => f.status === 'Active').length;
  const pendingRemovalsCount = removals.filter(r => r.status === 'Pending').length;
  const pendingValidationCount = submissions.filter(s => s.status !== 'Approved').length + pendingRemovalsCount;

  // Unified Smart Search & TODA Grouping
  const query = searchQuery.trim().toLowerCase();
  const isSearching = query.length > 0;

  const groupedToda = useMemo(() => {
    return TODA_LIST.map(todaName => {
      const todaMatchesQuery = isSearching && todaName.toLowerCase().includes(query);
      
      const allMembersInToda = users.filter(u => (u.todaAssociation || 'NON-TODA').trim().toUpperCase() === todaName.toUpperCase());

      // Find all submissions associated with this TODA (sorted by latest first)
      const todaSubmissions = submissions.filter(s => 
        (s.todaAssociation || '').trim().toUpperCase() === todaName.toUpperCase() ||
        (s.fileName || '').toUpperCase().includes(todaName.toUpperCase())
      );
      const latestSubmission = todaSubmissions[0] || null;
      const extractedMasterlist = latestSubmission?.extractedMembers || [];
      
      const matchingMembers = allMembersInToda.filter(member => {
        if (!isSearching) return true;
        if (todaMatchesQuery) return true;

        const nameMatch = (member.name || '').toLowerCase().includes(query);
        const contactMatch = (member.contact || '').toLowerCase().includes(query);
        const addressMatch = (member.address || '').toLowerCase().includes(query);

        const franchise = getMemberFranchise(member);
        const plateMatch = (franchise?.plateNo || '').toLowerCase().includes(query);
        const motorMatch = (franchise?.motorNo || '').toLowerCase().includes(query);
        const chassisMatch = (franchise?.chassisNo || '').toLowerCase().includes(query);

        return nameMatch || contactMatch || addressMatch || plateMatch || motorMatch || chassisMatch;
      });

      const masterlistMatchesQuery = isSearching && extractedMasterlist.some(m => 
        (m.name || '').toLowerCase().includes(query) ||
        (m.unitNo || '').toLowerCase().includes(query) ||
        (m.plateNo || '').toLowerCase().includes(query)
      );

      const compliantCount = allMembersInToda.filter(m => {
        const f = getMemberFranchise(m);
        return f && f.status === 'Active';
      }).length;

      const totalCount = allMembersInToda.length;
      const complianceRate = totalCount > 0 ? Math.round((compliantCount / totalCount) * 100) : 0;
      const colorumCount = totalCount - compliantCount;

      return {
        name: todaName,
        members: matchingMembers,
        totalCount,
        complianceRate,
        colorumCount,
        latestSubmission,
        todaSubmissions,
        extractedMasterlist
      };
    }).filter(toda => !isSearching || toda.members.length > 0 || toda.todaSubmissions.length > 0 || toda.extractedMasterlist.length > 0);
  }, [users, franchises, submissions, searchQuery, isSearching]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      if (!query) return true;
      const nameMatch = (sub.presidentName || '').toLowerCase().includes(query);
      const fileMatch = (sub.fileName || '').toLowerCase().includes(query);
      const todaMatch = (sub.todaAssociation || '').toLowerCase().includes(query);
      return nameMatch || fileMatch || todaMatch;
    });
  }, [submissions, query]);

  const filteredRemovals = useMemo(() => {
    return removals.filter(rem => {
      if (!query) return true;
      const mName = (rem.memberName || '').toLowerCase().includes(query);
      const pName = (rem.presidentName || '').toLowerCase().includes(query);
      const tName = (rem.todaName || '').toLowerCase().includes(query);
      const reason = (rem.reason || '').toLowerCase().includes(query);
      return mName || pName || tName || reason;
    });
  }, [removals, query]);

  return (
    <MainLayout>
      <div className="pb-28 sm:pb-24 space-y-4 sm:space-y-6">
        {/* Page Header */}
        <PageHeader 
          badge="LGU Municipal Association Roster"
          title="TODA Association & Masterlist Registry"
          description="Validate association endorsements, monitor street-legal active franchises, inspect AI OCR digitized masterlists, and review member disaffiliation requests."
        />

        {/* Analytics & Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Recognized TODAs */}
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-3.5 sm:p-4 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 flex items-center justify-center text-[#9E2A2B] dark:text-[#D4AF37] shrink-0 border border-[#9E2A2B]/20 dark:border-[#D4AF37]/30">
              <Building2 size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E]">Active TODAs</p>
              <h3 className="text-xl sm:text-2xl font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] font-mono tabular-nums">
                {totalRecognizedTodas}
              </h3>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] truncate">Gasan Jurisdictions</p>
            </div>
          </div>

          {/* Registered Operators */}
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-3.5 sm:p-4 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-700 dark:text-blue-400 shrink-0 border border-blue-200 dark:border-blue-800/40">
              <Users size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E]">Total Operators</p>
              <h3 className="text-xl sm:text-2xl font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] font-mono tabular-nums">
                {totalOperatorsCount}
              </h3>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] truncate">Affiliated Drivers</p>
            </div>
          </div>

          {/* Active MTOP */}
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-3.5 sm:p-4 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0 border border-emerald-200 dark:border-emerald-800/40">
              <ShieldCheck size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E]">Active &amp; Compliant</p>
              <h3 className="text-xl sm:text-2xl font-semibold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
                {activeMtopCount} <span className="text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] font-sans">({totalOperatorsCount > 0 ? Math.round((activeMtopCount / totalOperatorsCount) * 100) : 0}%)</span>
              </h3>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] truncate">Street-Legal Franchises</p>
            </div>
          </div>

          {/* Pending Actions */}
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-3.5 sm:p-4 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0 border border-amber-200 dark:border-amber-800/40">
              <Clock size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E]">Pending Actions</p>
              <h3 className="text-xl sm:text-2xl font-semibold text-amber-700 dark:text-amber-400 font-mono tabular-nums">
                {pendingValidationCount}
              </h3>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] truncate">Rosters &amp; Disaffiliations</p>
            </div>
          </div>
        </div>

        {/* Content Tabs & Main Card */}
        <div className="bg-white dark:bg-[#1C1917] rounded-lg shadow-xs border border-[#E4E1DC] dark:border-[#2E2A27] overflow-hidden transition-colors">
          {/* 3-Tab Header */}
          <div className="flex border-b border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F]">
            <button 
              onClick={() => { setActiveTab('directory'); setSearchQuery(''); }}
              className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'directory' 
                  ? 'text-[#9E2A2B] dark:text-[#D4AF37] border-b-2 border-[#9E2A2B] dark:border-[#D4AF37] bg-white dark:bg-[#1C1917]' 
                  : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
              }`}
            >
              <FolderTree size={16} /> Live Members Directory
            </button>

            <button 
              onClick={() => { setActiveTab('validations'); setSearchQuery(''); }}
              className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'validations' 
                  ? 'text-[#9E2A2B] dark:text-[#D4AF37] border-b-2 border-[#9E2A2B] dark:border-[#D4AF37] bg-white dark:bg-[#1C1917]' 
                  : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
              }`}
            >
              <FileText size={16} /> Document Validations &amp; OCR
              {submissions.filter(s => s.status !== 'Approved').length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                  {submissions.filter(s => s.status !== 'Approved').length}
                </span>
              )}
            </button>

            <button 
              onClick={() => { setActiveTab('removals'); setSearchQuery(''); }}
              className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'removals' 
                  ? 'text-[#9E2A2B] dark:text-[#D4AF37] border-b-2 border-[#9E2A2B] dark:border-[#D4AF37] bg-white dark:bg-[#1C1917]' 
                  : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
              }`}
            >
              <UserMinus size={16} /> Disaffiliation Requests
              {pendingRemovalsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-600 text-white animate-pulse">
                  {pendingRemovalsCount}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: DIRECTORY CONTENT */}
          {activeTab === 'directory' && (
            <div className="p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6761] dark:text-[#A8A29E]" size={15} />
                  <input 
                    type="text" 
                    placeholder="Search by driver name, plate no., barangay, motor no., or TODA..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="w-full bg-white dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg pl-9 pr-9 py-2 text-xs sm:text-sm font-medium text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] transition-colors" 
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6761] hover:text-[#1F1D1B] dark:text-[#A8A29E] dark:hover:text-[#F6F5F3] cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Directory Accordion List */}
              {isLoading ? (
                <AccordionListSkeleton count={5} baseDelay={30} stepDelay={45} />
              ) : groupedToda.length === 0 ? (
                <div className="text-center py-16 text-[#6B6761] dark:text-[#A8A29E] bg-[#F6F5F3]/50 dark:bg-[#14110F]/50 rounded-lg border border-dashed border-[#E4E1DC] dark:border-[#2E2A27]">
                  <Users size={32} className="mx-auto mb-2 opacity-40"/>
                  <p className="font-semibold text-xs sm:text-sm text-[#1F1D1B] dark:text-[#F6F5F3]">
                    {isSearching ? `No members or TODAs match "${searchQuery}"` : 'No registered members found yet.'}
                  </p>
                  {isSearching && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="mt-2 text-xs font-semibold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline cursor-pointer"
                    >
                      Reset Search Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {groupedToda.map((toda) => {
                    const isOpen = isSearching || expandedToda === toda.name;

                    return (
                      <div 
                        key={toda.name} 
                        className={`border rounded-lg overflow-hidden transition-colors ${
                          isOpen 
                            ? 'border-[#9E2A2B] dark:border-[#D4AF37]' 
                            : 'border-[#E4E1DC] dark:border-[#2E2A27] hover:border-[#9E2A2B]/40'
                        }`}
                      >
                        <button 
                          onClick={() => setExpandedToda(expandedToda === toda.name ? null : toda.name)}
                          className={`w-full p-3.5 sm:p-4 flex justify-between items-center transition-colors text-left cursor-pointer ${
                            isOpen 
                              ? 'bg-[#F6F5F3] dark:bg-[#2E2A27]/30' 
                              : 'bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3]/60 dark:hover:bg-[#14110F]/60'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 bg-[#9E2A2B] text-white font-semibold rounded-lg flex items-center justify-center text-xs shrink-0">
                              {(toda.name || '').substring(0, 3)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] text-sm sm:text-base truncate">
                                {toda.name}
                              </h3>
                              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
                                {(toda.members || []).length} {(toda.members || []).length === 1 ? 'Driver' : 'Drivers'} 
                                {toda.totalCount !== (toda.members || []).length && ` (filtered from ${toda.totalCount})`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap justify-end">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                              toda.complianceRate >= 80 
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' 
                                : toda.complianceRate >= 50 
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800' 
                                  : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800'
                            }`}>
                              {toda.complianceRate}% Compliant
                            </span>
                            {toda.colorumCount > 0 && (
                              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800/60" title={`${toda.colorumCount} driver(s) without active MTOP`}>
                                <AlertTriangle size={11} /> {toda.colorumCount} At-Risk
                              </span>
                            )}
                            <span className="text-xs font-semibold bg-white dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] px-2.5 py-0.5 rounded-lg text-[#1F1D1B] dark:text-[#F6F5F3] font-mono tabular-nums">
                              {(toda.members || []).length}
                            </span>
                            <div className={`p-1 text-[#6B6761] dark:text-[#A8A29E] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                              <ChevronDown size={16} />
                            </div>
                          </div>
                        </button>
                        
                        {/* Sub-tab Navigation and Content inside opened TODA card */}
                        {isOpen && (
                          <div className="bg-white dark:bg-[#1C1917] border-t border-[#E4E1DC] dark:border-[#2E2A27]">
                            {/* Sub-Tab Header */}
                            <div className="flex items-center gap-2 px-4 py-2 bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] overflow-x-auto">
                              <button
                                type="button"
                                onClick={() => setTodaActiveSubTabs(prev => ({ ...prev, [toda.name]: 'roster' }))}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer min-h-[34px] ${
                                  (todaActiveSubTabs[toda.name] || 'roster') === 'roster'
                                    ? 'bg-[#9E2A2B] text-white shadow-xs'
                                    : 'bg-white dark:bg-[#1C1917] text-[#1F1D1B] dark:text-[#EAE7E1] border border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-neutral-100'
                                }`}
                              >
                                <Sparkles size={13} />
                                <span>Official Scanned Roster</span>
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                  (todaActiveSubTabs[toda.name] || 'roster') === 'roster' 
                                    ? 'bg-white/20 text-white' 
                                    : 'bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#EAE7E1]'
                                }`}>
                                  {toda.latestSubmission ? (toda.latestSubmission.extractedCount || toda.latestSubmission.extractedMembers?.length || 0) : 0}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setTodaActiveSubTabs(prev => ({ ...prev, [toda.name]: 'drivers' }))}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer min-h-[34px] ${
                                  todaActiveSubTabs[toda.name] === 'drivers'
                                    ? 'bg-[#9E2A2B] text-white shadow-xs'
                                    : 'bg-white dark:bg-[#1C1917] text-[#1F1D1B] dark:text-[#EAE7E1] border border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-neutral-100'
                                }`}
                              >
                                <Users size={13} />
                                <span>Registered App Drivers</span>
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                  todaActiveSubTabs[toda.name] === 'drivers' 
                                    ? 'bg-white/20 text-white' 
                                    : 'bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#EAE7E1]'
                                }`}>
                                  {toda.members?.length || 0}
                                </span>
                              </button>
                            </div>

                            {/* SUB-TAB 1: OFFICIAL EXTRACTED MASTERLIST ROSTER */}
                            {(todaActiveSubTabs[toda.name] || 'roster') === 'roster' && (
                              <div className="p-3.5 sm:p-4 space-y-3">
                                {toda.latestSubmission ? (
                                  <>
                                    {/* Submission Info Bar */}
                                    <div className="p-3 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <div className="flex items-center gap-1 text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                                            <FileText size={14} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                                            <span>{toda.latestSubmission.fileName}</span>
                                          </div>
                                          <StatusBadge 
                                            status={toda.latestSubmission.status === 'Approved' ? 'Active' : 'Pending'} 
                                            label={toda.latestSubmission.status} 
                                          />
                                          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                            <Sparkles size={11} />
                                            <span>{toda.latestSubmission.extractedCount || toda.latestSubmission.extractedMembers?.length || 0} Members Digitized</span>
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
                                          Submitted by TODA President: <strong className="font-semibold text-[#1F1D1B] dark:text-[#EAE7E1]">{toda.latestSubmission.presidentName}</strong> on {new Date(toda.latestSubmission.createdAt).toLocaleDateString()}
                                        </p>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                        {toda.latestSubmission.filePath && (
                                          <a
                                            href={toda.latestSubmission.filePath.startsWith('http') ? toda.latestSubmission.filePath : `${import.meta.env.VITE_API_URL}/${toda.latestSubmission.filePath}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] text-xs font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] hover:bg-neutral-100 transition-colors shadow-xs"
                                          >
                                            <Eye size={12} />
                                            <span>View Document</span>
                                          </a>
                                        )}
                                        {toda.latestSubmission.status !== 'Approved' && (
                                          <button
                                            type="button"
                                            onClick={() => handleApprove(toda.latestSubmission._id)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                                          >
                                            <CheckCircle size={12} />
                                            <span>Approve Masterlist</span>
                                          </button>
                                        )}
                                        {(toda.latestSubmission.extractedCount === 0 || !toda.latestSubmission.extractedMembers?.length) && (
                                          <button
                                            type="button"
                                            onClick={() => handleRescan(toda.latestSubmission._id)}
                                            disabled={isRescanning}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#9E2A2B] hover:bg-[#7A1B22] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                                          >
                                            <RefreshCw size={12} className={isRescanning ? 'animate-spin' : ''} />
                                            <span>Re-scan with AI OCR</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Extracted Members Table */}
                                    <div className="overflow-x-auto rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                                      <table className="w-full text-left border-collapse text-xs min-w-[620px]">
                                        <thead>
                                          <tr className="bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] font-semibold text-[11px] uppercase tracking-wider">
                                            <th className="p-2.5 pl-4 w-12 text-center">#</th>
                                            <th className="p-2.5">Certified Member Name</th>
                                            <th className="p-2.5 pr-4 text-right">App Registration Status</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27]">
                                          {(!toda.latestSubmission.extractedMembers || toda.latestSubmission.extractedMembers.length === 0) ? (
                                            <tr>
                                              <td colSpan="3" className="p-6 text-center text-xs text-[#6B6761] dark:text-[#A8A29E]">
                                                <p className="font-semibold text-sm mb-1 text-[#1F1D1B] dark:text-[#EAE7E1]">0 member records digitized from this file.</p>
                                                <p className="text-[11px] mb-3">This file was uploaded as a document attachment without digitized rows.</p>
                                                <button
                                                  type="button"
                                                  onClick={() => handleRescan(toda.latestSubmission._id)}
                                                  disabled={isRescanning}
                                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#9E2A2B] hover:bg-[#7A1B22] text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
                                                >
                                                  <Sparkles size={13} />
                                                  <span>Run AI OCR Re-scan on Document</span>
                                                </button>
                                              </td>
                                            </tr>
                                          ) : (
                                            toda.latestSubmission.extractedMembers.filter(Boolean).map((m, idx) => {
                                              const todaUsers = users.filter(u => (u.todaAssociation || '').trim().toUpperCase() === toda.name.toUpperCase());
                                              const matchedUser = todaUsers.find(u => isNameMatch(u.name, m?.name)) ||
                                                                  users.find(u => isNameMatch(u.name, m?.name));
                                              const franchise = matchedUser ? getMemberFranchise(matchedUser) : null;

                                              return (
                                                <tr key={idx} className="hover:bg-[#F6F5F3]/50 dark:hover:bg-[#14110F]/50 transition-colors">
                                                  <td className="p-2.5 pl-4 font-mono text-[#6B6761]">{idx + 1}</td>
                                                  <td className="p-2.5 font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                                                    <div className="flex items-center gap-2">
                                                      <span className="w-6 h-6 rounded-full bg-[#9E2A2B]/10 dark:bg-[#9E2A2B]/25 text-[#9E2A2B] dark:text-[#EAE7E1] flex items-center justify-center text-[10px] font-bold shrink-0">
                                                        {(m.name || 'M').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                                                      </span>
                                                      <span>{m.name}</span>
                                                    </div>
                                                  </td>
                                                  <td className="p-2.5 pr-4 text-right">
                                                    {matchedUser ? (
                                                      <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                                          <CheckCircle2 size={11} />
                                                          <span>Registered User</span>
                                                        </span>
                                                        {franchise && <StatusBadge status={franchise.status} />}
                                                      </div>
                                                    ) : (
                                                      <span className="inline-flex items-center text-[11px] font-semibold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                                                        Not Registered in App
                                                      </span>
                                                    )}
                                                  </td>
                                                </tr>
                                              );
                                            })
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-center py-8 bg-[#F6F5F3]/50 dark:bg-[#14110F]/50 rounded-lg border border-dashed border-[#E4E1DC] dark:border-[#2E2A27]">
                                    <FileText size={26} className="mx-auto mb-2 opacity-40 text-[#6B6761]" />
                                    <p className="font-bold text-xs sm:text-sm text-[#1F1D1B] dark:text-[#EAE7E1]">
                                      No Official Masterlist Document Submitted Yet
                                    </p>
                                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5 max-w-sm mx-auto">
                                      The association officer of {toda.name} has not submitted a signed endorsement roster masterlist yet.
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* SUB-TAB 2: REGISTERED APP DRIVERS */}
                            {todaActiveSubTabs[toda.name] === 'drivers' && (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[650px]">
                                  <thead>
                                    <tr className="bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] text-xs uppercase tracking-wider font-semibold">
                                      <th className="p-3 pl-5">Operator Name</th>
                                      <th className="p-3">Barangay Residence</th>
                                      <th className="p-3">Plate No</th>
                                      <th className="p-3">Motor / Chassis No</th>
                                      <th className="p-3 pr-5">Compliance Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27] text-xs">
                                    {toda.members.length === 0 ? (
                                      <tr>
                                        <td colSpan="5" className="p-6 text-center text-[#6B6761] dark:text-[#A8A29E]">
                                          No registered user accounts found for this association.
                                        </td>
                                      </tr>
                                    ) : (
                                      toda.members.map((member) => {
                                        const franchise = getMemberFranchise(member);
                                        const isCompliant = franchise && franchise.status === 'Active';

                                        return (
                                          <tr key={member._id} className="hover:bg-[#F6F5F3]/50 dark:hover:bg-[#14110F]/50 transition-colors">
                                            <td className="p-3 pl-5 font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                                              {member.name}
                                              {member.contact && (
                                                <span className="block text-[11px] font-normal text-[#6B6761] dark:text-[#A8A29E]">
                                                  {member.contact}
                                                </span>
                                              )}
                                            </td>
                                            <td className="p-3 text-[#6B6761] dark:text-[#A8A29E]">
                                              {member.address || 'N/A'}
                                            </td>
                                            <td className="p-3 font-mono text-[#1F1D1B] dark:text-[#F6F5F3]">
                                              {franchise?.plateNo || 'NO RECORD'}
                                            </td>
                                            <td className="p-3 text-[#6B6761] dark:text-[#A8A29E] font-mono text-[11px]">
                                              <div>{franchise?.motorNo ? `M: ${franchise.motorNo}` : '—'}</div>
                                              <div>{franchise?.chassisNo ? `C: ${franchise.chassisNo}` : '—'}</div>
                                            </td>
                                            <td className="p-3 pr-5">
                                              {franchise ? (
                                                <StatusBadge status={franchise.status} />
                                              ) : (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                                                  No Franchise Application
                                                </span>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DOCUMENT VALIDATIONS & OCR */}
          {activeTab === 'validations' && (
            <>
              <div className="p-4 sm:p-5 border-b border-[#E4E1DC] dark:border-[#2E2A27] flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#F6F5F3] dark:bg-[#14110F]">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6761] dark:text-[#A8A29E]" size={15} />
                  <input 
                    type="text" 
                    placeholder="Search by TODA President or filename..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="w-full bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg pl-9 pr-3.5 py-1.5 text-xs sm:text-sm font-medium text-[#1F1D1B] dark:text-[#F6F5F3] placeholder-[#6B6761] dark:placeholder-[#A8A29E] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] transition-colors" 
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] text-xs uppercase tracking-wider font-semibold">
                      <th className="p-3.5 pl-5">Submitted By</th>
                      <th className="p-3.5">Document &amp; AI OCR Scan</th>
                      <th className="p-3.5">Date Submitted</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-center pr-5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27] text-xs">
                    {isLoading ? (
                      <TableRowsSkeleton rows={4} columns={5} baseDelay={30} stepDelay={45} />
                    ) : filteredSubmissions.length === 0 ? (
                      <tr><td colSpan="5" className="p-12 text-center text-xs text-[#6B6761] dark:text-[#A8A29E]">No TODA member lists found.</td></tr>
                    ) : (
                      filteredSubmissions.map((sub) => (
                        <tr 
                          key={sub._id} 
                          className="hover:bg-[#F6F5F3]/50 dark:hover:bg-[#14110F]/50 transition-colors"
                        >
                          <td className="p-3.5 pl-5">
                            <p className="font-semibold text-sm text-[#1F1D1B] dark:text-[#F6F5F3]">{sub.presidentName}</p>
                            {sub.todaAssociation && (
                              <span className="text-[10px] font-bold text-[#9E2A2B] dark:text-[#D4AF37]">
                                {sub.todaAssociation}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#1F1D1B] dark:text-[#F6F5F3]">
                              <FileText size={15} className="text-[#9E2A2B] dark:text-[#D4AF37] shrink-0" /> 
                              <span className="truncate max-w-xs">{sub.fileName}</span>
                            </div>
                            {sub.extractedCount > 0 ? (
                              <button
                                type="button"
                                onClick={() => setSelectedSubmissionOCR(sub)}
                                className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 cursor-pointer transition-colors"
                              >
                                <Sparkles size={11} />
                                <span>{sub.extractedCount} members extracted via OCR • View List</span>
                              </button>
                            ) : (
                              <div className="mt-1 flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] italic">
                                  0 members digitized
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRescan(sub._id)}
                                  disabled={isRescanning}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline cursor-pointer"
                                >
                                  <RefreshCw size={11} className={isRescanning ? 'animate-spin' : ''} />
                                  <span>Re-scan with AI OCR</span>
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="p-3.5 text-xs text-[#6B6761] dark:text-[#A8A29E] font-mono tabular-nums">{new Date(sub.createdAt).toLocaleDateString()}</td>
                          <td className="p-3.5">
                            <StatusBadge status={sub.status === 'Approved' ? 'Active' : 'Pending'} label={sub.status} />
                          </td>
                          <td className="p-3.5 pr-5 text-center space-x-2 flex justify-center flex-wrap gap-1">
                            {(() => {
                              const fileUrl = sub.filePath?.startsWith('http') ? sub.filePath : `${import.meta.env.VITE_API_URL}/${sub.filePath}`;
                              return (
                                <a 
                                  href={fileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] text-xs font-medium rounded-lg transition-colors border border-[#E4E1DC] dark:border-[#2E2A27]"
                                >
                                  <Eye size={13} /> View File
                                </a>
                              );
                            })()}
                            {sub.extractedCount > 0 && (
                              <button
                                type="button"
                                onClick={() => setSelectedSubmissionOCR(sub)}
                                className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                              >
                                <Sparkles size={12} /> View Roster
                              </button>
                            )}
                            <button 
                              onClick={() => handleApprove(sub._id)} 
                              disabled={sub.status === 'Approved'} 
                              className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                                sub.status === 'Approved' 
                                  ? 'bg-[#F6F5F3] dark:bg-[#14110F] text-[#6B6761] dark:text-[#A8A29E] border-[#E4E1DC] dark:border-[#2E2A27] cursor-not-allowed' 
                                  : 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-700 cursor-pointer'
                              }`}
                            >
                              <CheckCircle size={13} /> {sub.status === 'Approved' ? 'Approved' : 'Approve & Ingest'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* TAB 3: DISAFFILIATION / REMOVAL REQUESTS */}
          {activeTab === 'removals' && (
            <>
              <div className="p-4 sm:p-5 border-b border-[#E4E1DC] dark:border-[#2E2A27] flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#F6F5F3] dark:bg-[#14110F]">
                <div>
                  <h3 className="text-sm font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">
                    Member Disaffiliation &amp; Removal Petitions
                  </h3>
                  <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
                    Review requests filed by TODA Presidents to remove non-compliant, inactive, or unauthorized operators.
                  </p>
                </div>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6761] dark:text-[#A8A29E]" size={15} />
                  <input 
                    type="text" 
                    placeholder="Search by operator, president, or TODA..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="w-full bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg pl-9 pr-3.5 py-1.5 text-xs sm:text-sm font-medium text-[#1F1D1B] dark:text-[#F6F5F3] placeholder-[#6B6761] outline-none focus:border-[#9E2A2B] focus:ring-1 focus:ring-[#9E2A2B] transition-colors" 
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[760px]">
                  <thead>
                    <tr className="bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] text-xs uppercase tracking-wider font-semibold">
                      <th className="p-3.5 pl-5">TODA Association</th>
                      <th className="p-3.5">Operator Member</th>
                      <th className="p-3.5">Reason &amp; Explanation</th>
                      <th className="p-3.5">Date Filed</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-center pr-5">Admin Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27] text-xs">
                    {filteredRemovals.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-12 text-center text-xs text-[#6B6761] dark:text-[#A8A29E]">
                          No member removal requests filed yet.
                        </td>
                      </tr>
                    ) : (
                      filteredRemovals.map((rem) => (
                        <tr key={rem._id} className="hover:bg-[#F6F5F3]/50 dark:hover:bg-[#14110F]/50 transition-colors">
                          <td className="p-3.5 pl-5">
                            <span className="font-bold text-sm text-[#9E2A2B] dark:text-[#D4AF37] block">
                              {rem.todaName}
                            </span>
                            <span className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
                              Pres: {rem.presidentName}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <p className="font-bold text-sm text-[#1F1D1B] dark:text-[#F6F5F3]">
                              {rem.memberName}
                            </p>
                            <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
                              {rem.memberAddress || rem.memberContact || 'No contact'}
                            </p>
                          </td>
                          <td className="p-3.5 max-w-sm">
                            <span className="font-semibold text-red-700 dark:text-red-400 block text-xs">
                              {rem.reason}
                            </span>
                            <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] line-clamp-2 mt-0.5" title={rem.details}>
                              {rem.details}
                            </p>
                          </td>
                          <td className="p-3.5 font-mono text-[#6B6761] dark:text-[#A8A29E]">
                            {new Date(rem.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3.5">
                            <StatusBadge 
                              status={rem.status === 'Approved' ? 'Active' : (rem.status === 'Rejected' ? 'Expired' : 'Pending')} 
                              label={rem.status} 
                            />
                          </td>
                          <td className="p-3.5 pr-5 text-center">
                            {rem.status === 'Pending' ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleApproveRemoval(rem._id, rem.memberName, rem.todaName)}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                                >
                                  <Check size={12} />
                                  <span>Approve Kick</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectRemoval(rem._id)}
                                  className="px-2.5 py-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] text-[#6B6761] hover:text-red-600 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <X size={12} />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] italic">
                                {rem.adminRemarks || `Request ${rem.status}`}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* OCR EXTRACTED MEMBERS MODAL */}
      {selectedSubmissionOCR && (() => {
        const rawMembers = (selectedSubmissionOCR.extractedMembers || []).filter(Boolean);
        const modalMembers = rawMembers.filter(m => {
          if (!ocrModalSearch.trim()) return true;
          const q = ocrModalSearch.toLowerCase().trim();
          return isNameMatch(m.name, q) || (m.name || '').toLowerCase().includes(q);
        });

        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1A1816] border border-[#E4E1DC] dark:border-[#2E2A27] shadow-2xl rounded-2xl max-w-2xl w-full p-4 sm:p-5 space-y-4 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#9E2A2B]/20 text-[#9E2A2B] dark:text-[#E07A5F] flex items-center justify-center border border-[#9E2A2B]/20">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-[#1F1D1B] dark:text-[#EAE7E1] leading-tight">
                      TODA Masterlist — AI Digitized Members
                    </h3>
                    <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
                      Certified driver &amp; operator roster extracted from official documentation
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedSubmissionOCR(null); setOcrModalSearch(''); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6761] hover:text-[#1F1D1B] dark:text-[#A8A29E] dark:hover:text-white hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] transition-colors cursor-pointer"
                  title="Close modal"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Document Overview Card */}
              <div className="bg-gradient-to-br from-[#F6F5F3] via-white to-[#F6F5F3] dark:from-[#14110F] dark:via-[#1A1816] dark:to-[#14110F] p-3 sm:p-3.5 rounded-xl border border-[#E4E1DC] dark:border-[#2E2A27] space-y-2">
                <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={16} className="text-[#9E2A2B] dark:text-[#D4AF37] shrink-0" />
                    <span className="font-bold text-xs sm:text-sm text-[#1F1D1B] dark:text-[#EAE7E1] truncate">
                      {selectedSubmissionOCR.fileName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#9E2A2B]/10 text-[#9E2A2B] dark:bg-[#9E2A2B]/25 dark:text-[#EAE7E1] border border-[#9E2A2B]/20">
                      {selectedSubmissionOCR.todaAssociation || 'TODA'}
                    </span>
                    <StatusBadge status={selectedSubmissionOCR.status === 'Approved' ? 'Active' : 'Pending'} label={selectedSubmissionOCR.status} />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px] text-[#6B6761] dark:text-[#A8A29E] pt-1 border-t border-[#E4E1DC]/60 dark:border-[#2E2A27]/60 flex-wrap">
                  <div>
                    Endorsed by: <strong className="text-[#1F1D1B] dark:text-[#EAE7E1]">{selectedSubmissionOCR.presidentName}</strong> • {new Date(selectedSubmissionOCR.createdAt).toLocaleDateString()}
                  </div>
                  <span className="font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px]">
                    {selectedSubmissionOCR.extractedCount || rawMembers.length || 0} Total Certified
                  </span>
                </div>
              </div>

              {/* Search Filter */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6761]" />
                <input
                  type="text"
                  placeholder="Filter certified members by name..."
                  value={ocrModalSearch}
                  onChange={(e) => setOcrModalSearch(e.target.value)}
                  className="w-full pl-8 pr-20 py-2 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] text-xs font-medium text-[#1F1D1B] dark:text-[#EAE7E1] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] transition-colors"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#6B6761] dark:text-[#A8A29E] bg-white dark:bg-[#1C1917] px-1.5 py-0.5 rounded border border-[#E4E1DC] dark:border-[#2E2A27]">
                  {modalMembers.length} {modalMembers.length === 1 ? 'member' : 'members'}
                </span>
              </div>

              {/* Table */}
              <div className="max-h-72 overflow-y-auto rounded-xl border border-[#E4E1DC] dark:border-[#2E2A27]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] font-bold uppercase text-[11px] tracking-wider z-10">
                    <tr>
                      <th className="p-2.5 pl-3 w-10">#</th>
                      <th className="p-2.5">Certified Member Name</th>
                      <th className="p-2.5 pr-3 text-right">App Registration Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27]">
                    {modalMembers.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="p-8 text-center text-xs text-[#6B6761] dark:text-[#A8A29E]">
                          <FileText size={24} className="mx-auto mb-2 opacity-30 text-[#6B6761]" />
                          <p className="font-semibold text-[#1F1D1B] dark:text-[#EAE7E1]">
                            {rawMembers.length === 0
                              ? 'No member records digitized from this file yet.'
                              : 'No members match the search query.'}
                          </p>
                          <p className="text-[11px] mt-0.5">
                            {rawMembers.length === 0
                              ? 'You can trigger an AI OCR re-scan below.'
                              : 'Try searching with a different name spelling.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      modalMembers.filter(Boolean).map((m, idx) => {
                        const currentToda = (selectedSubmissionOCR.todaAssociation || '').trim();
                        const todaUsers = currentToda ? users.filter(u => (u.todaAssociation || '').trim().toUpperCase() === currentToda.toUpperCase()) : [];
                        const matchedUser = todaUsers.find(u => isNameMatch(u.name, m?.name)) ||
                                            users.find(u => isNameMatch(u.name, m?.name));
                        const franchise = matchedUser ? getMemberFranchise(matchedUser) : null;
                        const initials = (m.name || 'M')
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
                              <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-full bg-[#9E2A2B]/10 dark:bg-[#9E2A2B]/25 text-[#9E2A2B] dark:text-[#E07A5F] flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {initials}
                                </span>
                                <span>{m.name}</span>
                              </div>
                            </td>
                            <td className="p-2.5 pr-3 text-right">
                              {matchedUser ? (
                                <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                    <CheckCircle2 size={11} />
                                    <span>Registered User</span>
                                  </span>
                                  {franchise && <StatusBadge status={franchise.status} />}
                                </div>
                              ) : (
                                <span className="inline-flex items-center text-[11px] font-semibold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                                  Not Registered in App
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Actions Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
                <div className="flex items-center gap-3">
                  {selectedSubmissionOCR.filePath && (
                    <a
                      href={selectedSubmissionOCR.filePath.startsWith('http') ? selectedSubmissionOCR.filePath : `${import.meta.env.VITE_API_URL}/${selectedSubmissionOCR.filePath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline flex items-center gap-1"
                    >
                      <Eye size={13} />
                      <span>View Original Document File</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRescan(selectedSubmissionOCR._id)}
                    disabled={isRescanning}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#6B6761] hover:text-[#1F1D1B] dark:text-[#A8A29E] dark:hover:text-white cursor-pointer"
                  >
                    <RefreshCw size={12} className={isRescanning ? 'animate-spin' : ''} />
                    <span>Re-scan AI OCR</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {selectedSubmissionOCR.status !== 'Approved' && (
                    <button
                      type="button"
                      onClick={() => {
                        handleApprove(selectedSubmissionOCR._id);
                        setSelectedSubmissionOCR(prev => ({ ...prev, status: 'Approved' }));
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                    >
                      Approve &amp; Ingest
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setSelectedSubmissionOCR(null); setOcrModalSearch(''); }}
                    className="px-4 py-1.5 rounded-lg bg-[#1C1917] hover:bg-[#2E2A27] dark:bg-[#F6F5F3] dark:hover:bg-white dark:text-[#14110F] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    Close Viewer
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Floating Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none">
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xl rounded-lg px-4 py-3 flex items-center gap-3 max-w-sm">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
              toast.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400'
                : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400'
            }`}>
              {toast.type === 'error' ? (
                <AlertCircle size={14} />
              ) : (
                <CheckCircle2 size={14} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] leading-snug">
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default ValidateTODA;
