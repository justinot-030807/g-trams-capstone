import React, { useState, useEffect, useMemo } from 'react';
import { TODA_LIST } from '../../utils/constants';
import MainLayout from '../../components/MainLayout';
import { 
  Users, FileText, CheckCircle, CheckCircle2, Search, Eye, FolderTree,
  Building2, ShieldCheck, AlertCircle, AlertTriangle, Clock, ChevronDown,
  X, UserMinus, Sparkles, Check, CheckCheck, Loader2, RefreshCw, Hash
} from 'lucide-react';
import { AccordionListSkeleton, TableRowsSkeleton } from '../../components/skeleton';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { isNameMatch } from '../../utils/nameMatcher';
import { formatVehicleMakeAndModel } from '../../utils/vehicleFormatters';

const ValidateTODA = () => {
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'validations' | 'removals'
  const [isLoading, setIsLoading] = useState(true);
  
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [rosters, setRosters] = useState([]);
  const [users, setUsers] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [removals, setRemovals] = useState([]);
  const [selectedSubmissionOCR, setSelectedSubmissionOCR] = useState(null);
  const [ocrModalSearch, setOcrModalSearch] = useState('');
  const [selectedTodaModal, setSelectedTodaModal] = useState(null);
  const [todaModalSearch, setTodaModalSearch] = useState('');
  const [todaModalFilter, setTodaModalFilter] = useState('all'); // 'all' | 'active_mtop' | 'registered' | 'roster'
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
      if (response.ok) {
        const d = await response.json();
        setSubmissions(Array.isArray(d) ? d : (d.data || []));
      }
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
        const raw = await response.json();
        const allUsers = Array.isArray(raw) ? raw : (raw.data || []);
        // Filter out staff/admin users (admin, administrator, cashier)
        setUsers(allUsers.filter(u => !['admin', 'administrator', 'system_admin', 'system admin', 'bplo_staff', 'bplo staff', 'cashier'].includes(String(u.role || '').toLowerCase().trim())));
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
        const d = await response.json();
        setRemovals(Array.isArray(d) ? d : (d.data || []));
      }
    } catch (err) {
      console.error('Error fetching removal requests:', err);
    }
  };

  const fetchRosters = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/toda/rosters`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const d = await response.json();
        setRosters(Array.isArray(d) ? d : (d.data || []));
      }
    } catch (err) {
      console.error('Error fetching TODA rosters:', err);
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.allSettled([
        fetchSubmissions(),
        fetchRosters(),
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
        fetchRosters();
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
  const totalOperatorsCount = Array.isArray(users) ? users.length : 0;
  const activeMtopCount = (Array.isArray(franchises) ? franchises : []).filter(f => f.status === 'Active').length;
  const pendingRemovalsCount = (Array.isArray(removals) ? removals : []).filter(r => r.status === 'Pending').length;
  const pendingValidationCount = (Array.isArray(submissions) ? submissions : []).filter(s => s.status !== 'Approved').length + pendingRemovalsCount;

  // Unified Smart Search & TODA Grouping
  const query = searchQuery.trim().toLowerCase();
  const isSearching = query.length > 0;

  const groupedToda = useMemo(() => {
    return TODA_LIST.map(todaName => {
      const todaUpper = todaName.toUpperCase();
      const todaMatchesQuery = isSearching && todaName.toLowerCase().includes(query);
      
      const allMembersInToda = users.filter(u => (u.todaAssociation || 'NON-TODA').trim().toUpperCase() === todaUpper);
      const todaFranchises = franchises.filter(f => (f.todaName || 'NON-TODA').trim().toUpperCase() === todaUpper);
      const todaRosterDoc = rosters.find(r => (r.todaName || '').trim().toUpperCase() === todaUpper) || null;
      const officialRosterMembers = todaRosterDoc?.members || [];

      // Find all submissions associated with this TODA (sorted by latest first)
      const todaSubmissions = submissions.filter(s => 
        (s.todaAssociation || '').trim().toUpperCase() === todaUpper ||
        (s.fileName || '').toUpperCase().includes(todaUpper)
      );
      const latestSubmission = todaSubmissions[0] || null;
      const extractedMasterlist = latestSubmission?.extractedMembers || [];

      // Build unified deduplicated member list for this TODA
      const unifiedMap = [];
      const findOrAddUnified = (rawName) => {
        const cleanName = String(rawName || '').trim();
        if (!cleanName) return null;
        let existing = unifiedMap.find(item => isNameMatch(item.name, cleanName));
        if (!existing) {
          existing = {
            id: `${todaUpper}-${unifiedMap.length + 1}`,
            name: cleanName,
            bodyNumber: '',
            contact: '',
            address: '',
            plateNo: '',
            makeModel: '',
            motorNo: '',
            chassisNo: '',
            mtopNumber: '',
            franchiseStatus: null,
            isRegisteredUser: false,
            isPresident: false,
            inOfficialRoster: false,
            inOcrSubmission: false,
            sources: []
          };
          unifiedMap.push(existing);
        }
        return existing;
      };

      // 1. Official TodaRoster entries
      officialRosterMembers.forEach((rm) => {
        const entry = findOrAddUnified(rm.operatorName || rm.name);
        if (!entry) return;
        entry.inOfficialRoster = true;
        if (!entry.sources.includes('Official Roster')) entry.sources.push('Official Roster');
        if (rm.bodyNumber && !entry.bodyNumber) entry.bodyNumber = rm.bodyNumber;
        if (rm.plateNo && !entry.plateNo) entry.plateNo = rm.plateNo;
        if (rm.contactNumber && !entry.contact) entry.contact = rm.contactNumber;
      });

      // 2. Extracted OCR submission members
      extractedMasterlist.forEach((em) => {
        const entry = findOrAddUnified(em.operatorName || em.name);
        if (!entry) return;
        entry.inOcrSubmission = true;
        if (!entry.sources.includes('OCR Masterlist')) entry.sources.push('OCR Masterlist');
        const bNo = em.bodyNumber || em.unitNo || '';
        if (bNo && !entry.bodyNumber) entry.bodyNumber = bNo;
        if (em.plateNo && !entry.plateNo) entry.plateNo = em.plateNo;
      });

      // 3. Registered App Users in this TODA
      allMembersInToda.forEach((u) => {
        const entry = findOrAddUnified(u.name);
        if (!entry) return;
        entry.isRegisteredUser = true;
        entry.userId = u._id;
        if (String(u.role || '').toLowerCase() === 'toda_president') entry.isPresident = true;
        if (!entry.sources.includes('App Account')) entry.sources.push('App Account');
        if (u.contact && !entry.contact) entry.contact = u.contact;
        if (u.address && !entry.address) entry.address = u.address;
        const f = getMemberFranchise(u);
        if (f) {
          entry.franchiseStatus = f.status;
          entry.plateNo = f.plateNo || entry.plateNo;
          entry.makeModel = formatVehicleMakeAndModel(f, '');
          entry.motorNo = f.motorNo || entry.motorNo;
          entry.chassisNo = f.chassisNo || entry.chassisNo;
          entry.mtopNumber = f.mtopNumber || entry.mtopNumber;
          if (!entry.address && f.address) entry.address = f.address;
          if (!entry.sources.includes('MTOP Record')) entry.sources.push('MTOP Record');
        }
      });

      // 4. Franchise applications explicitly under this TODA
      todaFranchises.forEach((f) => {
        const fName = f.fullName || f.operator?.name || '';
        const entry = findOrAddUnified(fName);
        if (!entry) return;
        if (!entry.sources.includes('MTOP Record')) entry.sources.push('MTOP Record');
        if (!entry.franchiseStatus || f.status === 'Active') {
          entry.franchiseStatus = f.status;
        }
        if (f.plateNo && !entry.plateNo) entry.plateNo = f.plateNo;
        if (!entry.makeModel) entry.makeModel = formatVehicleMakeAndModel(f, '');
        if (f.motorNo && !entry.motorNo) entry.motorNo = f.motorNo;
        if (f.chassisNo && !entry.chassisNo) entry.chassisNo = f.chassisNo;
        if (f.mtopNumber && !entry.mtopNumber) entry.mtopNumber = f.mtopNumber;
        if (f.address && !entry.address) entry.address = f.address;
        if (f.contact && !entry.contact) entry.contact = f.contact;
      });
      
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

      const matchingCombinedMembers = unifiedMap.filter(m => {
        if (!isSearching || todaMatchesQuery) return true;
        return (
          (m.name || '').toLowerCase().includes(query) ||
          (m.bodyNumber || '').toLowerCase().includes(query) ||
          (m.plateNo || '').toLowerCase().includes(query) ||
          (m.address || '').toLowerCase().includes(query) ||
          (m.contact || '').toLowerCase().includes(query) ||
          (m.motorNo || '').toLowerCase().includes(query)
        );
      });

      const compliantCount = unifiedMap.filter(m => m.franchiseStatus === 'Active').length;
      const totalCount = unifiedMap.length;
      const registeredCount = unifiedMap.filter(m => m.isRegisteredUser).length;
      const rosterCount = unifiedMap.filter(m => m.inOfficialRoster || m.inOcrSubmission).length;
      const complianceRate = totalCount > 0 ? Math.round((compliantCount / totalCount) * 100) : 0;
      const colorumCount = Math.max(0, totalCount - compliantCount);

      return {
        name: todaName,
        members: matchingMembers,
        combinedMembers: unifiedMap,
        matchingCombinedMembers,
        totalCount,
        compliantCount,
        registeredCount,
        rosterCount,
        complianceRate,
        colorumCount,
        latestSubmission,
        todaSubmissions,
        extractedMasterlist,
        todaRosterDoc
      };
    }).filter(toda => !isSearching || toda.matchingCombinedMembers.length > 0 || toda.members.length > 0 || toda.todaSubmissions.length > 0 || toda.extractedMasterlist.length > 0);
  }, [users, franchises, submissions, rosters, searchQuery, isSearching]);

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
                <div className="grid grid-cols-1 gap-2.5">
                  {groupedToda.map((toda) => (
                    <div 
                      key={toda.name} 
                      onClick={() => {
                        setSelectedTodaModal(toda);
                        setTodaModalSearch('');
                        setTodaModalFilter('all');
                      }}
                      className="group border border-[#E4E1DC] dark:border-[#2E2A27] hover:border-[#9E2A2B]/50 dark:hover:border-[#D4AF37]/50 rounded-xl bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3]/60 dark:hover:bg-[#14110F]/60 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all shadow-2xs cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 bg-[#9E2A2B] text-white font-bold rounded-xl flex items-center justify-center text-xs shrink-0 shadow-xs tracking-wider">
                          {(toda.name || '').substring(0, 3)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3] text-sm sm:text-base truncate group-hover:text-[#9E2A2B] dark:group-hover:text-[#D4AF37] transition-colors">
                              {toda.name}
                            </h3>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 text-[#9E2A2B] dark:text-[#D4AF37] border border-[#9E2A2B]/20 dark:border-[#D4AF37]/30 font-mono tabular-nums">
                              <Users size={11} />
                              <span>{toda.totalCount} {toda.totalCount === 1 ? 'Member' : 'Members'}</span>
                            </span>
                          </div>
                          <div className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-1 flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{toda.registeredCount} App Account{toda.registeredCount === 1 ? '' : 's'}</span>
                            <span className="text-[#E4E1DC] dark:text-[#2E2A27]">•</span>
                            <span className="font-medium text-emerald-700 dark:text-emerald-400">{toda.compliantCount} Active MTOP</span>
                            {toda.rosterCount > 0 && (
                              <>
                                <span className="text-[#E4E1DC] dark:text-[#2E2A27]">•</span>
                                <span className="font-medium">{toda.rosterCount} Official Roster</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E4E1DC]/70 dark:border-[#2E2A27]">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border tabular-nums ${
                          toda.complianceRate >= 80 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60' 
                            : toda.complianceRate >= 50 
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60' 
                              : 'bg-neutral-100 dark:bg-neutral-800/70 text-[#6B6761] dark:text-[#A8A29E] border-[#E4E1DC] dark:border-[#2E2A27]'
                        }`}>
                          {toda.complianceRate}% Compliant
                        </span>
                        {toda.colorumCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60" title={`${toda.colorumCount} member(s) without active MTOP`}>
                            <AlertTriangle size={11} /> {toda.colorumCount} Pending MTOP
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTodaModal(toda);
                            setTodaModalSearch('');
                            setTodaModalFilter('all');
                          }}
                          className="ml-auto sm:ml-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#9E2A2B] hover:bg-[#7A1B22] text-white text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
                          title={`Open full member list modal for ${toda.name}`}
                        >
                          <Users size={13} />
                          <span>See Members ({toda.totalCount})</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DOCUMENT VALIDATIONS & OCR */}
          {activeTab === 'validations' && (
            <>
              <div className="p-4 sm:p-5 border-b border-[#E4E1DC] dark:border-[#2E2A27] flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-[#F6F5F3]/70 dark:bg-[#14110F]">
                <div>
                  <h3 className="text-sm font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">
                    Submitted TODA Masterlists &amp; AI OCR Digitization
                  </h3>
                  <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
                    Verify official roster documents uploaded by TODA Presidents and inspect AI-extracted member records.
                  </p>
                </div>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6761] dark:text-[#A8A29E]" size={15} />
                  <input 
                    type="text" 
                    placeholder="Search by TODA, President, or filename..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="w-full bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg pl-9 pr-3.5 py-2 text-xs sm:text-sm font-medium text-[#1F1D1B] dark:text-[#F6F5F3] placeholder-[#6B6761] dark:placeholder-[#A8A29E] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] transition-colors" 
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[780px]">
                  <thead>
                    <tr className="bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] text-[11px] uppercase tracking-wider font-semibold">
                      <th className="py-3 pl-5 pr-3">TODA &amp; Submitted By</th>
                      <th className="py-3 px-3">Roster File &amp; AI Extraction</th>
                      <th className="py-3 px-3 whitespace-nowrap">Date Submitted</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 pl-3 pr-5 text-right">Actions</th>
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
                          className="hover:bg-[#F6F5F3]/60 dark:hover:bg-[#14110F]/60 transition-colors"
                        >
                          <td className="py-3.5 pl-5 pr-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 text-[#9E2A2B] dark:text-[#D4AF37] font-bold text-[11px] flex items-center justify-center shrink-0 border border-[#9E2A2B]/20 dark:border-[#D4AF37]/30">
                                {(sub.todaAssociation || 'TOD').substring(0, 3)}
                              </div>
                              <div className="min-w-0">
                                {sub.todaAssociation && (
                                  <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#9E2A2B] dark:text-[#D4AF37]">
                                    {sub.todaAssociation}
                                  </span>
                                )}
                                <p className="font-semibold text-xs sm:text-sm text-[#1F1D1B] dark:text-[#F6F5F3] truncate max-w-[220px]" title={sub.presidentName}>
                                  {sub.presidentName}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                                <FileText size={14} className="text-[#9E2A2B] dark:text-[#D4AF37] shrink-0" /> 
                                <span className="truncate max-w-[240px]" title={sub.fileName}>{sub.fileName}</span>
                              </div>
                              {sub.extractedCount > 0 ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                                    <Sparkles size={11} />
                                    <span>{sub.extractedCount} {sub.extractedCount === 1 ? 'member' : 'members'} digitized via AI OCR</span>
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
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
                                    <span>Re-scan</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-xs text-[#6B6761] dark:text-[#A8A29E] font-mono tabular-nums whitespace-nowrap">
                            {new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <StatusBadge status={sub.status === 'Approved' ? 'Active' : 'Pending'} label={sub.status === 'Approved' ? 'Approved' : sub.status} />
                          </td>
                          <td className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {(() => {
                                const fileUrl = sub.filePath?.startsWith('http') ? sub.filePath : `${import.meta.env.VITE_API_URL}/${sub.filePath}`;
                                return (
                                  <a 
                                    href={fileUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] text-xs font-semibold rounded-lg transition-colors border border-[#E4E1DC] dark:border-[#2E2A27] shadow-2xs"
                                  >
                                    <Eye size={13} />
                                    <span>View File</span>
                                  </a>
                                );
                              })()}
                              {sub.extractedCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedSubmissionOCR(sub)}
                                  className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-[#9E2A2B]/10 hover:bg-[#9E2A2B]/15 dark:bg-[#D4AF37]/15 dark:hover:bg-[#D4AF37]/25 text-[#9E2A2B] dark:text-[#D4AF37] border border-[#9E2A2B]/25 dark:border-[#D4AF37]/30 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  <Users size={13} />
                                  <span>View Roster ({sub.extractedCount})</span>
                                </button>
                              )}
                              {sub.status !== 'Approved' && (
                                <button 
                                  onClick={() => handleApprove(sub._id)} 
                                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-700 shadow-2xs cursor-pointer"
                                >
                                  <CheckCircle size={13} />
                                  <span>Approve</span>
                                </button>
                              )}
                            </div>
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
                      <th className="p-2.5 w-28">Body No.</th>
                      <th className="p-2.5 pr-3 text-right">App Registration Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27]">
                    {modalMembers.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-xs text-[#6B6761] dark:text-[#A8A29E]">
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
                        const displayName = m?.operatorName || m?.name || '';
                        const displayBodyNo = m?.bodyNumber || m?.unitNo || '';
                        const franchise = matchedUser ? getMemberFranchise(matchedUser) : null;
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
                              <div className="flex items-center gap-2.5">
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

      {/* UNIFIED TODA DIRECTORY MEMBER LIST MODAL */}
      {selectedTodaModal && (() => {
        const liveToda = groupedToda.find(t => t.name === selectedTodaModal.name) || selectedTodaModal;
        const allTodaMembers = liveToda.combinedMembers || [];
        const modalQuery = todaModalSearch.trim().toLowerCase();

        const filteredTodaMembers = allTodaMembers.filter((m) => {
          if (todaModalFilter === 'active_mtop' && m.franchiseStatus !== 'Active') return false;
          if (todaModalFilter === 'registered' && !m.isRegisteredUser) return false;
          if (todaModalFilter === 'roster' && !m.inOfficialRoster && !m.inOcrSubmission) return false;

          if (!modalQuery) return true;
          return (
            (m.name || '').toLowerCase().includes(modalQuery) ||
            (m.bodyNumber || '').toLowerCase().includes(modalQuery) ||
            (m.plateNo || '').toLowerCase().includes(modalQuery) ||
            (m.address || '').toLowerCase().includes(modalQuery) ||
            (m.contact || '').toLowerCase().includes(modalQuery) ||
            (m.motorNo || '').toLowerCase().includes(modalQuery)
          );
        });

        return (
          <div className="fixed inset-0 z-[9998] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div 
              className="fixed inset-0"
              onClick={() => { setSelectedTodaModal(null); setTodaModalSearch(''); setTodaModalFilter('all'); }}
            />
            <div className="relative z-10 bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] shadow-2xl rounded-xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-[#9E2A2B] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                    {(liveToda.name || '').substring(0, 3)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base sm:text-lg text-[#1F1D1B] dark:text-[#F6F5F3] truncate">
                        {liveToda.name} — Member Directory
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 text-[#9E2A2B] dark:text-[#D4AF37] border border-[#9E2A2B]/25 dark:border-[#D4AF37]/30 font-mono tabular-nums">
                        {allTodaMembers.length} {allTodaMembers.length === 1 ? 'Member' : 'Members'}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
                      Consolidated directory combining registered app operators, active MTOP franchises, and certified TODA rosters.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedTodaModal(null); setTodaModalSearch(''); setTodaModalFilter('all'); }}
                  className="p-2 rounded-lg text-[#6B6761] hover:text-[#1F1D1B] dark:text-[#A8A29E] dark:hover:text-[#F6F5F3] hover:bg-[#E4E1DC]/50 dark:hover:bg-[#2E2A27] transition-colors cursor-pointer"
                  title="Close member list modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Summary Strip & Filter Bar */}
              <div className="p-4 sm:p-5 border-b border-[#E4E1DC] dark:border-[#2E2A27] space-y-3 bg-white dark:bg-[#1C1917]">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E] block">Total Members</span>
                    <span className="text-lg font-bold font-mono tabular-nums text-[#1F1D1B] dark:text-[#F6F5F3]">{allTodaMembers.length}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">Active MTOP</span>
                    <span className="text-lg font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">{liveToda.compliantCount || 0}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 block">App Accounts</span>
                    <span className="text-lg font-bold font-mono tabular-nums text-blue-700 dark:text-blue-400">{liveToda.registeredCount || 0}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">Official Roster</span>
                    <span className="text-lg font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400">{liveToda.rosterCount || 0}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {[
                      { id: 'all', label: `All (${allTodaMembers.length})` },
                      { id: 'active_mtop', label: `Active MTOP (${liveToda.compliantCount || 0})` },
                      { id: 'registered', label: `App Accounts (${liveToda.registeredCount || 0})` },
                      { id: 'roster', label: `Certified Roster (${liveToda.rosterCount || 0})` }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setTodaModalFilter(tab.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          todaModalFilter === tab.id
                            ? 'bg-[#9E2A2B] text-white'
                            : 'bg-[#F6F5F3] dark:bg-[#14110F] text-[#6B6761] dark:text-[#A8A29E] border border-[#E4E1DC] dark:border-[#2E2A27] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Search Input */}
                  <div className="relative w-full sm:w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6761] dark:text-[#A8A29E]" />
                    <input
                      type="text"
                      placeholder="Search member, body #, plate..."
                      value={todaModalSearch}
                      onChange={(e) => setTodaModalSearch(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] text-xs font-medium text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37]"
                    />
                    {todaModalSearch && (
                      <button
                        type="button"
                        onClick={() => setTodaModalSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6761] hover:text-[#1F1D1B] cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Member List Table */}
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[680px]">
                  <thead className="sticky top-0 bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] font-bold uppercase text-[11px] tracking-wider z-10">
                    <tr>
                      <th className="p-3 pl-5 w-24">Body #</th>
                      <th className="p-3">Member / Operator Name</th>
                      <th className="p-3">Tricycle Unit (Plate / Model)</th>
                      <th className="p-3">Record Source</th>
                      <th className="p-3 pr-5 text-right">Franchise Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27]">
                    {filteredTodaMembers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-10 text-center text-[#6B6761] dark:text-[#A8A29E]">
                          <Users size={28} className="mx-auto mb-2 opacity-40" />
                          <p className="font-semibold text-sm text-[#1F1D1B] dark:text-[#F6F5F3]">
                            No members found matching this filter.
                          </p>
                          <p className="text-xs mt-0.5">
                            Try switching filter tabs or clearing your search query.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredTodaMembers.map((member, idx) => {
                        const initials = (member.name || 'M')
                          .split(' ')
                          .filter(Boolean)
                          .slice(0, 2)
                          .map(w => w[0])
                          .join('')
                          .toUpperCase();

                        return (
                          <tr key={member.id || idx} className="hover:bg-[#F6F5F3]/60 dark:hover:bg-[#14110F]/60 transition-colors">
                            <td className="p-3 pl-5 font-mono font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">
                              {member.bodyNumber ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-xs">
                                  <Hash size={11} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                                  {member.bodyNumber}
                                </span>
                              ) : (
                                <span className="text-[#6B6761] dark:text-[#A8A29E] font-normal">#{idx + 1}</span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                <span className="w-7 h-7 rounded-full bg-[#9E2A2B]/10 dark:bg-[#9E2A2B]/25 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {initials}
                                </span>
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3] text-xs sm:text-sm">
                                      {member.name}
                                    </span>
                                    {member.isPresident && (
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#D4AF37]/20 text-[#9E2A2B] dark:text-[#D4AF37] border border-[#D4AF37]/40">
                                        TODA President
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
                                    {[member.address, member.contact].filter(Boolean).join(' • ') || 'Gasan, Marinduque'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              {member.plateNo ? (
                                <div>
                                  <span className="font-mono font-bold text-[#1F1D1B] dark:text-[#F6F5F3] px-1.5 py-0.5 rounded bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27]">
                                    {member.plateNo}
                                  </span>
                                  {member.makeModel && (
                                    <span className="block text-[11px] text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
                                      {member.makeModel}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] italic">No unit linked</span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {(member.sources || []).map((src) => (
                                  <span
                                    key={src}
                                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#EAE7E1] border border-[#E4E1DC] dark:border-[#2E2A27]"
                                  >
                                    {src}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-3 pr-5 text-right">
                              {member.franchiseStatus ? (
                                <StatusBadge status={member.franchiseStatus} />
                              ) : member.isRegisteredUser ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                                  Registered Account
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[11px] font-semibold text-[#6B6761] dark:text-[#A8A29E] bg-[#F6F5F3] dark:bg-[#14110F] px-2 py-0.5 rounded border border-[#E4E1DC] dark:border-[#2E2A27]">
                                  Roster Listed
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

              {/* Modal Footer */}
              <div className="px-5 py-3.5 border-t border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
                  Showing <strong className="text-[#1F1D1B] dark:text-[#F6F5F3]">{filteredTodaMembers.length}</strong> of <strong className="text-[#1F1D1B] dark:text-[#F6F5F3]">{allTodaMembers.length}</strong> members in {liveToda.name}
                </div>
                <div className="flex items-center gap-2">
                  {liveToda.latestSubmission && (
                    <button
                      type="button"
                      onClick={() => {
                        const sub = liveToda.latestSubmission;
                        setSelectedTodaModal(null);
                        setSelectedSubmissionOCR(sub);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] text-[#1F1D1B] dark:text-[#F6F5F3] hover:bg-[#E4E1DC]/40 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles size={13} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                      <span>Inspect OCR Submission</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setSelectedTodaModal(null); setTodaModalSearch(''); setTodaModalFilter('all'); }}
                    className="px-4 py-1.5 rounded-lg bg-[#9E2A2B] hover:bg-[#7A1B22] text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Close Directory
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
