import React, { useState, useEffect, useMemo } from 'react';
import { TODA_LIST } from '../../utils/constants';
import MainLayout from '../../components/MainLayout';
import { 
  Users, FileText, CheckCircle, CheckCircle2, Search, Eye, FolderTree,
  Building2, ShieldCheck, AlertCircle, AlertTriangle, Clock, ChevronDown,
  X, UserMinus, Sparkles, Check, CheckCheck, Loader2
} from 'lucide-react';
import { AccordionListSkeleton, TableRowsSkeleton } from '../../components/skeleton';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';

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
        // Filter out admin users
        setUsers(allUsers.filter(u => u.role !== 'admin'));
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
    const mName = (member.name || '').trim().toLowerCase();
    return franchises.find(f => {
      const opId = f.operator?._id ? String(f.operator._id) : (f.operator ? String(f.operator) : '');
      if (opId && opId === mId) return true;
      if (f.fullName && f.fullName.trim().toLowerCase() === mName) return true;
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
      
      const allMembersInToda = users.filter(u => (u.todaAssociation || 'NON-TODA') === todaName);
      
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
        colorumCount
      };
    }).filter(toda => !isSearching || toda.members.length > 0);
  }, [users, franchises, searchQuery, isSearching]);

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
                        
                        {/* Member Roster Table */}
                        {isOpen && (
                          <div className="bg-white dark:bg-[#1C1917] border-t border-[#E4E1DC] dark:border-[#2E2A27] overflow-x-auto">
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
                                      No members found in this association.
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
                              <span className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] italic block mt-0.5">
                                Physical document attached
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-xs text-[#6B6761] dark:text-[#A8A29E] font-mono tabular-nums">{new Date(sub.createdAt).toLocaleDateString()}</td>
                          <td className="p-3.5">
                            <StatusBadge status={sub.status === 'Approved' ? 'Active' : 'Pending'} label={sub.status} />
                          </td>
                          <td className="p-3.5 pr-5 text-center space-x-2 flex justify-center">
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
      {selectedSubmissionOCR && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xl rounded-xl max-w-xl w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm sm:text-base">
                <Sparkles size={18} />
                <span>AI OCR Extracted Roster Members</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmissionOCR(null)}
                className="text-[#6B6761] hover:text-[#1F1D1B] dark:text-[#A8A29E] dark:hover:text-white p-1 rounded cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs bg-[#F6F5F3] dark:bg-[#14110F] p-3 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
              <div>
                <p className="font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">{selectedSubmissionOCR.fileName}</p>
                <p className="text-[#6B6761] dark:text-[#A8A29E]">Submitted by: {selectedSubmissionOCR.presidentName} ({selectedSubmissionOCR.todaAssociation || 'TODA'})</p>
              </div>
              <span className="font-bold px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                {selectedSubmissionOCR.extractedCount || selectedSubmissionOCR.extractedMembers?.length || 0} Members Detected
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] font-bold uppercase">
                  <tr>
                    <th className="p-2.5 pl-3">#</th>
                    <th className="p-2.5">Extracted Member Name</th>
                    <th className="p-2.5">Unit / Body #</th>
                    <th className="p-2.5 pr-3">Plate No</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27]">
                  {(selectedSubmissionOCR.extractedMembers || []).map((m, idx) => (
                    <tr key={idx} className="hover:bg-[#F6F5F3]/50 dark:hover:bg-[#14110F]/50">
                      <td className="p-2.5 pl-3 font-mono text-[#6B6761]">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">{m.name}</td>
                      <td className="p-2.5 font-mono text-[#6B6761]">{m.unitNo || '—'}</td>
                      <td className="p-2.5 pr-3 font-mono text-[#6B6761]">{m.plateNo || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedSubmissionOCR(null)}
                className="px-4 py-2 rounded-lg bg-[#1C1917] hover:bg-[#2E2A27] dark:bg-[#F6F5F3] dark:text-[#14110F] text-white text-xs font-bold cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

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
