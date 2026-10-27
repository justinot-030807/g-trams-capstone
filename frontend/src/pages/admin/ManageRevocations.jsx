import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout';
import { 
  ShieldAlert, Search, AlertTriangle, UploadCloud, X, Loader2, 
  CheckCircle, CheckCircle2, AlertCircle, FileText, Eye, ChevronLeft, 
  ChevronRight, Clock, ShieldCheck, Scale, History, User, Check, RefreshCw
} from 'lucide-react';
import { TableRowsSkeleton } from '../../components/skeleton';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';

const ManageRevocations = () => {
  const [franchises, setFranchises] = useState([]);
  const [violations, setViolations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isViolationsLoading, setIsViolationsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('operators'); // 'operators' | 'violations' | 'revoked'
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // System Violation Policy
  const [violationPolicy, setViolationPolicy] = useState({
    types: [
      { code: 'OVERCHARGING', name: 'Overcharging of fare', severity: 'Medium', isGrave: false, defaultFine: 500, suspensionDays: 15 },
      { code: 'REFUSAL_CONVEY', name: 'Refusal to convey passengers', severity: 'Medium', isGrave: false, defaultFine: 500, suspensionDays: 15 },
      { code: 'DISCOURTEOUS', name: 'Arrogant/Discourteous behavior', severity: 'Low', isGrave: false, defaultFine: 300, suspensionDays: 7 },
      { code: 'NO_FRANCHISE', name: 'Operating without valid franchise / Colorum', severity: 'Grave', isGrave: true, defaultFine: 2000, suspensionDays: 30 },
      { code: 'OUT_OF_LINE', name: 'Out of line operation', severity: 'Medium', isGrave: false, defaultFine: 500, suspensionDays: 15 },
      { code: 'RECKLESS_DRIVING', name: 'Reckless or dangerous driving', severity: 'High', isGrave: false, defaultFine: 1000, suspensionDays: 30 },
      { code: 'OTHER', name: 'Other municipal ordinance violation', severity: 'Low', isGrave: false, defaultFine: 300, suspensionDays: 7 }
    ],
    tiers: {
      firstOffense: { sanction: 'Warning', resultingStatus: 'Active - Under Warning' },
      secondOffense: { sanction: 'Suspension', resultingStatus: 'Suspended', defaultFine: 500, defaultSuspensionDays: 15 },
      thirdOffense: { sanction: 'Revocation', resultingStatus: 'Revoked' },
      graveViolation: { sanction: 'Revocation', resultingStatus: 'Revoked' }
    }
  });

  // Modal states for Recording Violation
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [operatorHistory, setOperatorHistory] = useState(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('Medium');
  const [isGraveViolation, setIsGraveViolation] = useState(false);
  const [fineAmount, setFineAmount] = useState(500);
  const [suspensionDays, setSuspensionDays] = useState(15);
  const [driverName, setDriverName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Settlement Modal State
  const [settleModal, setSettleModal] = useState({
    isOpen: false,
    violation: null,
    notes: '',
    isSubmitting: false
  });

  // Evidence Previewer Modal
  const [previewDoc, setPreviewDoc] = useState(null);

  // Toast Notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Fetch Settings / Policy
  const fetchPolicy = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/settings`);
      if (res.ok) {
        const json = await res.json();
        if (json.data?.violationPolicy) {
          setViolationPolicy(json.data.violationPolicy);
        }
      }
    } catch (err) {
      console.error('Failed to load violation policy:', err);
    }
  };

  // Fetch Franchises
  const fetchFranchises = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises?limit=1000`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const raw = await res.json();
        const allFranchises = Array.isArray(raw) ? raw : (raw?.data || []);
        // Only show relevant franchises (Active, Warning, Suspended, Revoked)
        const relevant = allFranchises.filter(f => 
          ['Active', 'Active - Under Warning', 'Suspended', 'Revoked'].includes(f.status)
        );
        setFranchises(relevant);
      }
    } catch (error) {
      console.error('Failed to fetch franchises:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Violation Logs
  const fetchViolations = async () => {
    setIsViolationsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/violations?limit=200`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const json = await res.json();
        setViolations(json.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch violations history:', error);
    } finally {
      setIsViolationsLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy();
    fetchFranchises();
    fetchViolations();
  }, []);

  // When a franchise is selected to record violation, fetch live history & previous offenses count
  const handleSelectFranchiseForViolation = async (franchise) => {
    setSelectedFranchise(franchise);
    setIsHistoryLoading(true);
    setDriverName(franchise.driverName || franchise.fullName || '');
    setRemarks('');
    setEvidenceFile(null);

    // Default to first active violation in policy
    const defaultType = violationPolicy.types?.[0] || {
      name: 'Overcharging of fare',
      severity: 'Medium',
      isGrave: false,
      defaultFine: 500,
      suspensionDays: 15
    };
    setSelectedViolation(defaultType.name);
    setSelectedSeverity(defaultType.severity);
    setIsGraveViolation(defaultType.isGrave || false);
    setFineAmount(defaultType.defaultFine || 500);
    setSuspensionDays(defaultType.suspensionDays || 15);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/violations/history/${franchise._id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOperatorHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch operator violation history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Handle violation type change in modal
  const handleViolationTypeChange = (typeName) => {
    setSelectedViolation(typeName);
    const matched = violationPolicy.types?.find(t => t.name === typeName);
    if (matched) {
      setSelectedSeverity(matched.severity);
      setIsGraveViolation(Boolean(matched.isGrave));
      if (matched.defaultFine) setFineAmount(matched.defaultFine);
      if (matched.suspensionDays) setSuspensionDays(matched.suspensionDays);
    }
  };

  // Compute calculated sanction preview for the modal
  const getCalculatedSanctionPreview = () => {
    const priorCount = operatorHistory?.activeViolationsCount || 0;
    const nextOffense = priorCount + 1;

    if (isGraveViolation || selectedSeverity === 'Grave') {
      return {
        offenseLabel: 'Grave Violation Clause',
        sanctionType: 'Revocation',
        resultingStatus: 'Revoked',
        color: 'border-rose-400 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200',
        badge: 'bg-rose-600 text-white',
        title: '⚠️ Immediate Permanent Revocation',
        description: 'Critical municipal ordinance violation. Bypasses 1st and 2nd offense tiers directly to permanent revocation of MTOP permit.'
      };
    }

    if (nextOffense === 1) {
      return {
        offenseLabel: '1st Offense',
        sanctionType: 'Warning',
        resultingStatus: 'Active - Under Warning',
        color: 'border-amber-300 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200',
        badge: 'bg-amber-600 text-white',
        title: 'Official Warning (Active - Under Warning)',
        description: 'Formal written warning entered into the municipal record. The tricycle remains authorized to operate while notice is in effect.'
      };
    }

    if (nextOffense === 2) {
      return {
        offenseLabel: '2nd Offense',
        sanctionType: 'Suspension',
        resultingStatus: 'Suspended',
        color: 'border-orange-400 bg-orange-50/70 dark:bg-orange-950/30 text-orange-900 dark:text-orange-200',
        badge: 'bg-orange-600 text-white',
        title: `Temporary Suspension (${suspensionDays} Days) + Fine ₱${fineAmount}`,
        description: `Operations temporarily suspended. Operator must settle administrative fine of ₱${fineAmount} at the Treasury Cashier before reinstatement.`
      };
    }

    return {
      offenseLabel: `${nextOffense}${nextOffense === 3 ? 'rd' : 'th'} Offense`,
      sanctionType: 'Revocation',
      resultingStatus: 'Revoked',
      color: 'border-red-400 bg-red-50/70 dark:bg-red-950/30 text-red-900 dark:text-red-200',
      badge: 'bg-red-700 text-white',
      title: 'Final Escalation: Permanent Franchise Revocation',
      description: '3rd Offense reached. Franchise and MTOP license are permanently revoked; assigned body number is forfeited and returned to municipal pool.'
    };
  };

  // Submit violation form
  const handleRecordViolationSubmit = async (e) => {
    e.preventDefault();
    if (!evidenceFile) {
      return showToast("Please upload documentary evidence (citation ticket or photo proof).", "error");
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('franchiseId', selectedFranchise._id);
    formData.append('violationType', selectedViolation);
    formData.append('severity', selectedSeverity);
    formData.append('isGrave', isGraveViolation);
    formData.append('driverName', driverName);
    formData.append('remarks', remarks);
    formData.append('customFine', fineAmount);
    formData.append('customSuspensionDays', suspensionDays);
    formData.append('evidence', evidenceFile);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/violations`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast(data.message, "success");
        setSelectedFranchise(null);
        setEvidenceFile(null);
        fetchFranchises();
        fetchViolations();
      } else {
        showToast(data.message || "Failed to record violation.", "error");
      }
    } catch {
      showToast("Network Error occurred while recording violation.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Settle / Lift Violation
  const handleSettleViolationSubmit = async (e) => {
    e.preventDefault();
    if (!settleModal.violation) return;

    setSettleModal(prev => ({ ...prev, isSubmitting: true }));
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/violations/${settleModal.violation._id}/settle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settledNotes: settleModal.notes })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Violation successfully settled. Franchise standing updated.", "success");
        setSettleModal({ isOpen: false, violation: null, notes: '', isSubmitting: false });
        fetchFranchises();
        fetchViolations();
      } else {
        showToast(data.message || "Failed to settle violation.", "error");
        setSettleModal(prev => ({ ...prev, isSubmitting: false }));
      }
    } catch {
      showToast("Network error settling violation.", "error");
      setSettleModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // Filtered operators / franchises
  const filteredFranchises = franchises.filter(f => {
    const isSearchMatch = 
      (f.fullName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
      (f.plateNo?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (f.todaName?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    if (activeTab === 'revoked') {
      return isSearchMatch && f.status === 'Revoked';
    }

    if (statusFilter !== 'All') {
      return isSearchMatch && f.status === statusFilter;
    }

    return isSearchMatch;
  });

  // Filtered violations list
  const filteredViolations = violations.filter(v => {
    const isSearchMatch = 
      (v.plateNo?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (v.violationType?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (v.driverName?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    return isSearchMatch;
  });

  // Pagination calculations
  const currentList = activeTab === 'violations' ? filteredViolations : filteredFranchises;
  const totalRecords = currentList.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const paginatedItems = currentList.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, statusFilter]);

  // Statistics KPI counts
  const activeCount = franchises.filter(f => f.status === 'Active').length;
  const warningCount = franchises.filter(f => f.status === 'Active - Under Warning').length;
  const suspendedCount = franchises.filter(f => f.status === 'Suspended').length;
  const revokedCount = franchises.filter(f => f.status === 'Revoked').length;

  return (
    <MainLayout>
      {/* EVIDENCE VIEWER MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-[200] bg-slate-900/95 flex flex-col items-center justify-center p-4 md:p-8 backdrop-blur-sm animate-in fade-in">
          <div className="flex justify-between items-center w-full max-w-4xl mb-3">
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <Eye size={18} /> Documentary Evidence Viewer
            </h3>
            <button 
              onClick={() => setPreviewDoc(null)} 
              className="text-white hover:text-red-400 transition-colors bg-white/10 p-1.5 rounded-lg cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
          <iframe 
            src={previewDoc} 
            className="w-full max-w-4xl h-[75vh] md:h-[82vh] bg-white rounded-lg shadow-2xl" 
            title="Evidence Document" 
          />
        </div>
      )}

      {/* HEADER RIBBON */}
      <PageHeader
        title="Violations & Progressive Sanctions"
        subtitle="Enforce the municipal 3-tier progressive violation policy: Warning → Suspension → Revocation."
      />

      {/* PROGRESSIVE ENGINE SUMMARY METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <div className="p-4 rounded-lg bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E]">Active Units</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#1F1D1B] dark:text-[#F6F5F3] tabular-nums">{activeCount}</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Good Standing</p>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-[#1C1917] border border-amber-200 dark:border-amber-900/40 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">Under Warning</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-400 tabular-nums">{warningCount}</p>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-0.5">1st Offense Notice</p>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-[#1C1917] border border-orange-200 dark:border-orange-900/40 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-orange-800 dark:text-orange-300">Suspended</span>
            <span className="w-2 h-2 rounded-full bg-orange-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-orange-700 dark:text-orange-400 tabular-nums">{suspendedCount}</p>
          <p className="text-[11px] text-orange-700 dark:text-orange-400 font-medium mt-0.5">2nd Offense Penalty</p>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-[#1C1917] border border-red-200 dark:border-red-900/40 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-red-800 dark:text-red-300">Revoked</span>
            <span className="w-2 h-2 rounded-full bg-red-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-red-700 dark:text-red-400 tabular-nums">{revokedCount}</p>
          <p className="text-[11px] text-red-700 dark:text-red-400 font-medium mt-0.5">3rd Offense / Grave</p>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="bg-white dark:bg-[#1C1917] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] overflow-hidden transition-colors shadow-xs">
        {/* TABS */}
        <div className="flex border-b border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F]">
          <button 
            onClick={() => { setActiveTab('operators'); setSearchQuery(''); setStatusFilter('All'); }}
            className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'operators' 
                ? 'text-[#9E2A2B] dark:text-[#F6F5F3] border-b-2 border-[#9E2A2B] bg-white dark:bg-[#1C1917]' 
                : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
            }`}
          >
            <ShieldCheck size={16} /> Operators & Franchises
          </button>
          
          <button 
            onClick={() => { setActiveTab('violations'); setSearchQuery(''); }}
            className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'violations' 
                ? 'text-[#9E2A2B] dark:text-[#F6F5F3] border-b-2 border-[#9E2A2B] bg-white dark:bg-[#1C1917]' 
                : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
            }`}
          >
            <History size={16} /> Violation Citation Logs ({violations.length})
          </button>

          <button 
            onClick={() => { setActiveTab('revoked'); setSearchQuery(''); }}
            className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'revoked' 
                ? 'text-red-700 dark:text-red-400 border-b-2 border-red-700 dark:border-red-400 bg-white dark:bg-[#1C1917]' 
                : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
            }`}
          >
            <AlertTriangle size={16} /> Revoked Records ({revokedCount})
          </button>
        </div>

        {/* SEARCH AND FILTER CONTROLS */}
        <div className="p-3.5 sm:p-4 border-b border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6761] dark:text-[#A8A29E]" size={15} />
            <input
              type="text"
              placeholder={activeTab === 'violations' ? "Search violations, plate, driver..." : "Search operator, plate, TODA..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg text-xs text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] transition-all"
            />
          </div>

          {activeTab === 'operators' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-medium shrink-0">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] outline-none cursor-pointer"
              >
                <option value="All">All Standings</option>
                <option value="Active">Active (Good Standing)</option>
                <option value="Active - Under Warning">Active - Under Warning</option>
                <option value="Suspended">Suspended</option>
                <option value="Revoked">Revoked</option>
              </select>
            </div>
          )}
        </div>

        {/* DATA TABLE VIEW */}
        <div className="overflow-x-auto">
          {activeTab === 'violations' ? (
            /* TAB 2: VIOLATION CITATION LOGS TABLE */
            <table className="w-full text-left border-collapse min-w-[850px] text-xs">
              <thead>
                <tr className="bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider font-semibold">
                  <th className="p-3.5 pl-5">Date & Offense</th>
                  <th className="p-3.5">Operator & Vehicle</th>
                  <th className="p-3.5">Violation Details</th>
                  <th className="p-3.5">Sanction Enacted</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center pr-5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27]">
                {isViolationsLoading ? (
                  <TableRowsSkeleton rows={5} columns={6} />
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-[#6B6761] dark:text-[#A8A29E]">
                      <CheckCircle size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="font-semibold text-sm">No violation citations recorded.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((v) => (
                    <tr key={v._id} className="hover:bg-[#F6F5F3]/70 dark:hover:bg-[#14110F]/70 transition-colors">
                      <td className="p-3.5 pl-5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-1 ${
                          v.offenseNumber === 1 
                            ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                            : v.offenseNumber === 2
                              ? 'bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300'
                              : 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300'
                        }`}>
                          {v.isGrave ? 'GRAVE OFFENSE' : `${v.offenseNumber}${v.offenseNumber === 1 ? 'st' : v.offenseNumber === 2 ? 'nd' : v.offenseNumber === 3 ? 'rd' : 'th'} Offense`}
                        </span>
                        <p className="text-[#6B6761] dark:text-[#A8A29E] text-[11px]">{new Date(v.createdAt).toLocaleDateString()}</p>
                      </td>

                      <td className="p-3.5">
                        <p className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{v.operator?.name || 'Operator'}</p>
                        <p className="text-[#6B6761] dark:text-[#A8A29E] font-mono mt-0.5">Plate: {v.plateNo}</p>
                        {v.driverName && <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">Driver: {v.driverName}</p>}
                      </td>

                      <td className="p-3.5">
                        <p className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{v.violationType}</p>
                        <span className="text-[10px] text-[#6B6761] dark:text-[#A8A29E]">Severity: {v.severity}</span>
                        {v.remarks && <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] italic mt-0.5">"{v.remarks}"</p>}
                      </td>

                      <td className="p-3.5">
                        <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{v.sanction?.type}</span>
                        {v.sanction?.fineAmount > 0 && (
                          <p className="text-orange-700 dark:text-orange-400 font-mono font-medium">Fine: ₱{v.sanction.fineAmount.toLocaleString()}</p>
                        )}
                        {v.sanction?.suspensionDays > 0 && (
                          <p className="text-[#6B6761] dark:text-[#A8A29E] text-[11px]">{v.sanction.suspensionDays} days suspension</p>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          v.status === 'Active'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        }`}>
                          {v.status}
                        </span>
                      </td>

                      <td className="p-3.5 pr-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {v.evidenceUrl && (
                            <button
                              onClick={() => setPreviewDoc(v.evidenceUrl)}
                              className="p-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3] text-[#1F1D1B] dark:text-[#F6F5F3] cursor-pointer"
                              title="View Citation Evidence"
                            >
                              <FileText size={13} />
                            </button>
                          )}

                          {v.status === 'Active' && (
                            <button
                              onClick={() => setSettleModal({ isOpen: true, violation: v, notes: '', isSubmitting: false })}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 cursor-pointer"
                              title="Settle fine or lift sanction"
                            >
                              Settle
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            /* TAB 1 & TAB 3: OPERATORS & FRANCHISE LIST */
            <table className="w-full text-left border-collapse min-w-[850px] text-xs">
              <thead>
                <tr className="bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider font-semibold">
                  <th className="p-3.5 pl-5">Operator & Vehicle</th>
                  <th className="p-3.5">Association / TODA</th>
                  <th className="p-3.5 text-center">Current Status</th>
                  <th className="p-3.5">Sanction / Warnings</th>
                  <th className="p-3.5 text-center pr-5">Discipline Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27]">
                {isLoading ? (
                  <TableRowsSkeleton rows={5} columns={5} />
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-[#6B6761] dark:text-[#A8A29E]">
                      <CheckCircle size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="font-semibold text-sm">No franchise records found.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((f) => (
                    <tr key={f._id} className="hover:bg-[#F6F5F3]/70 dark:hover:bg-[#14110F]/70 transition-colors">
                      <td className="p-3.5 pl-5">
                        <p className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] text-sm">{f.fullName}</p>
                        <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5 flex items-center gap-1.5">
                          <span>Plate:</span>
                          <span className="font-mono font-medium px-1.5 py-0.2 rounded bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3]">{f.plateNo || 'N/A'}</span>
                          {f.motorNo && <span>&bull; Eng: {f.motorNo}</span>}
                        </p>
                      </td>

                      <td className="p-3.5">
                        <p className="font-medium text-[#1F1D1B] dark:text-[#F6F5F3]">{f.todaName || 'NON-TODA'}</p>
                        <span className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">{f.zone || 'Gasan'}</span>
                      </td>

                      <td className="p-3.5 text-center">
                        <StatusBadge status={f.status} />
                      </td>

                      <td className="p-3.5">
                        {f.status === 'Revoked' ? (
                          <div>
                            <p className="font-semibold text-red-700 dark:text-red-400">{f.cancelReason || 'Revoked by BPLO'}</p>
                            <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">Date: {new Date(f.updatedAt).toLocaleDateString()}</p>
                          </div>
                        ) : f.status === 'Suspended' ? (
                          <div>
                            <p className="font-semibold text-orange-700 dark:text-orange-400">{f.suspensionReason || 'Temporary Suspension'}</p>
                            {f.suspensionEndDate && (
                              <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">Until: {new Date(f.suspensionEndDate).toLocaleDateString()}</p>
                            )}
                          </div>
                        ) : f.status === 'Active - Under Warning' ? (
                          <div>
                            <p className="font-semibold text-amber-700 dark:text-amber-400">1st Offense Warning Active</p>
                            <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">Unit operational under probation</p>
                          </div>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">Clean Record (0 Active Violations)</span>
                        )}
                      </td>

                      <td className="p-3.5 pr-5 text-center">
                        {f.status === 'Revoked' ? (
                          f.evidenceUrl ? (
                            <button
                              onClick={() => setPreviewDoc(f.evidenceUrl)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3] text-xs font-semibold cursor-pointer"
                            >
                              <FileText size={13} /> View Evidence
                            </button>
                          ) : (
                            <span className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">Revoked</span>
                          )
                        ) : (
                          <button
                            onClick={() => handleSelectFranchiseForViolation(f)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/60 cursor-pointer shadow-2xs transition-colors"
                          >
                            <ShieldAlert size={13} /> Record Violation
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION BAR */}
        {!isLoading && totalRecords > 0 && (
          <div className="px-4 py-3 sm:px-5 bg-[#F6F5F3] dark:bg-[#14110F] border-t border-[#E4E1DC] dark:border-[#2E2A27] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs rounded-b-lg">
            <div className="flex items-center gap-2 text-[#6B6761] dark:text-[#A8A29E] font-medium">
              <span>Showing</span>
              <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] tabular-nums">{startIndex + 1}</span>
              <span>to</span>
              <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] tabular-nums">{endIndex}</span>
              <span>of</span>
              <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] tabular-nums">{totalRecords}</span>
              <span>records</span>

              <span className="mx-1 text-[#E4E1DC] dark:text-[#2E2A27] hidden sm:inline">|</span>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <span>Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded px-2 py-0.5 text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={validCurrentPage <= 1}
                className="p-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3] disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 font-semibold tabular-nums">{validCurrentPage} of {totalPages}</span>
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={validCurrentPage >= totalPages}
                className="p-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3] disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RECORD VIOLATION MODAL (PROGRESSIVE DISCIPLINE FORM) */}
      {selectedFranchise && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 transition-opacity" 
            onClick={() => !isSubmitting && setSelectedFranchise(null)} 
          />

          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] w-full max-w-xl rounded-lg shadow-xl relative z-10 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E4E1DC] dark:border-[#2E2A27] flex justify-between items-center bg-[#F6F5F3] dark:bg-[#14110F] rounded-t-lg">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 rounded-lg">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                    Record Operator Violation
                  </h2>
                  <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
                    3-Tier Progressive Discipline Engine
                  </p>
                </div>
              </div>
              <button 
                onClick={() => !isSubmitting && setSelectedFranchise(null)} 
                className="text-[#6B6761] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordViolationSubmit} className="p-5 space-y-4">
              {/* Operator Summary Card */}
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-3.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-[#6B6761] dark:text-[#A8A29E] font-bold uppercase tracking-wider">Target Operator</span>
                    <p className="font-semibold text-sm text-[#1F1D1B] dark:text-[#F6F5F3]">{selectedFranchise.fullName}</p>
                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
                      Plate: <span className="font-mono font-semibold px-1 py-0.2 rounded bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27]">{selectedFranchise.plateNo}</span>
                      &bull; TODA: {selectedFranchise.todaName || 'NON-TODA'}
                    </p>
                  </div>
                  <StatusBadge status={selectedFranchise.status} />
                </div>

                {/* Prior Offenses Auto-Count */}
                <div className="mt-3 pt-2.5 border-t border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-between text-xs">
                  <span className="text-[#6B6761] dark:text-[#A8A29E] flex items-center gap-1.5">
                    <History size={13} /> Active Prior Offenses:
                  </span>
                  {isHistoryLoading ? (
                    <span className="text-[#6B6761] animate-pulse">Calculating...</span>
                  ) : (
                    <span className="font-bold font-mono text-[#1F1D1B] dark:text-[#F6F5F3]">
                      {operatorHistory?.activeViolationsCount ?? 0} Recorded
                    </span>
                  )}
                </div>
              </div>

              {/* DYNAMIC SANCTION PREVIEW ALERT */}
              {(() => {
                const sanction = getCalculatedSanctionPreview();
                return (
                  <div className={`p-4 rounded-lg border ${sanction.color} transition-all`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${sanction.badge}`}>
                        {sanction.offenseLabel}
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-wider">
                        Next Sanction
                      </span>
                    </div>
                    <p className="text-xs font-bold mt-1">{sanction.title}</p>
                    <p className="text-[11px] mt-1 leading-relaxed opacity-90">{sanction.description}</p>
                  </div>
                );
              })()}

              {/* Violation Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] mb-1.5">
                  Select Violation Committed
                </label>
                <select 
                  value={selectedViolation} 
                  onChange={(e) => handleViolationTypeChange(e.target.value)} 
                  className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] rounded-lg px-3 py-2 text-xs outline-none focus:border-red-500 cursor-pointer font-medium"
                >
                  {(violationPolicy.types || []).map((v, i) => (
                    <option key={i} value={v.name}>
                      {v.name} ({v.severity}{v.isGrave ? ' - Direct Revoke' : ''})
                    </option>
                  ))}
                </select>
              </div>

              {/* Severity & Grave Override */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6B6761] dark:text-[#A8A29E] mb-1">
                    Severity Level
                  </label>
                  <select
                    value={selectedSeverity}
                    onChange={(e) => {
                      setSelectedSeverity(e.target.value);
                      if (e.target.value === 'Grave') setIsGraveViolation(true);
                    }}
                    className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] rounded-lg px-2.5 py-1.5 text-xs outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Grave">Grave (Critical Escalation)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-rose-800 dark:text-rose-300">
                    <input
                      type="checkbox"
                      checked={isGraveViolation}
                      onChange={(e) => {
                        setIsGraveViolation(e.target.checked);
                        if (e.target.checked) setSelectedSeverity('Grave');
                      }}
                      className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    <span>Grave Infraction (Bypass to Revoke)</span>
                  </label>
                </div>
              </div>

              {/* 2nd Offense Fine and Suspension customization if applicable */}
              {((operatorHistory?.activeViolationsCount === 1 && !isGraveViolation) || selectedSeverity === 'High') && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40">
                  <div>
                    <label className="block text-[11px] font-semibold text-orange-900 dark:text-orange-200 mb-1">
                      Administrative Fine (₱)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={fineAmount}
                      onChange={(e) => setFineAmount(Number(e.target.value))}
                      className="w-full bg-white dark:bg-[#1C1917] border border-orange-200 dark:border-orange-900/60 rounded px-2.5 py-1.5 text-xs font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-orange-900 dark:text-orange-200 mb-1">
                      Suspension Period (Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={suspensionDays}
                      onChange={(e) => setSuspensionDays(Number(e.target.value))}
                      className="w-full bg-white dark:bg-[#1C1917] border border-orange-200 dark:border-orange-900/60 rounded px-2.5 py-1.5 text-xs font-semibold outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Driver Name & Specific Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6B6761] dark:text-[#A8A29E] mb-1">
                    Operating Driver (if not operator)
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Driver's full name"
                    className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] rounded-lg px-2.5 py-1.5 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6B6761] dark:text-[#A8A29E] mb-1">
                    Citation Remarks / Location
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Brgy. Poblacion checkpoint"
                    className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] rounded-lg px-2.5 py-1.5 text-xs outline-none"
                  />
                </div>
              </div>

              {/* Upload Documentary Evidence */}
              <div>
                <label className="block text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] mb-1.5">
                  Upload Documentary Evidence (Citation Ticket / Photo)
                </label>
                <div className="border border-dashed border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] rounded-lg p-4 text-center relative cursor-pointer hover:border-[#9E2A2B] transition-colors">
                  <input 
                    type="file" 
                    accept=".pdf, image/*" 
                    onChange={(e) => setEvidenceFile(e.target.files[0])} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                  <UploadCloud className="mx-auto text-[#6B6761] dark:text-[#A8A29E] mb-1.5" size={24} />
                  <p className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                    {evidenceFile ? evidenceFile.name : 'Tap to upload municipal citation ticket or incident photo'}
                  </p>
                  <p className="text-[10px] text-[#6B6761] dark:text-[#A8A29E] mt-0.5">Accepts PDF, JPG, PNG, WebP up to 10MB</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
                <button 
                  type="button" 
                  onClick={() => setSelectedFranchise(null)} 
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-lg font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#E4E1DC] border border-[#E4E1DC] dark:border-[#2E2A27] transition-colors text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className={`flex-1 py-2 rounded-lg font-semibold text-white transition-colors text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                    isGraveViolation || operatorHistory?.activeViolationsCount >= 2
                      ? 'bg-red-700 hover:bg-red-800'
                      : operatorHistory?.activeViolationsCount === 1
                        ? 'bg-orange-700 hover:bg-orange-800'
                        : 'bg-amber-700 hover:bg-amber-800'
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <ShieldAlert size={14} />
                  )}
                  {isSubmitting 
                    ? 'Recording...' 
                    : isGraveViolation || operatorHistory?.activeViolationsCount >= 2
                      ? 'Confirm Revocation'
                      : operatorHistory?.activeViolationsCount === 1
                        ? 'Enforce Suspension'
                        : 'Issue Official Warning'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SETTLE VIOLATION MODAL */}
      {settleModal.isOpen && settleModal.violation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 transition-opacity" 
            onClick={() => !settleModal.isSubmitting && setSettleModal(prev => ({ ...prev, isOpen: false }))} 
          />

          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] w-full max-w-md rounded-lg shadow-xl relative z-10 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27] mb-4">
              <h3 className="font-semibold text-sm text-[#1F1D1B] dark:text-[#F6F5F3] flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" /> Settle Violation Citation
              </h3>
              <button 
                onClick={() => setSettleModal(prev => ({ ...prev, isOpen: false }))}
                className="text-[#6B6761] hover:text-[#1F1D1B] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSettleViolationSubmit} className="space-y-3.5 text-xs">
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-3 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <p className="text-[10px] uppercase font-bold text-[#6B6761] dark:text-[#A8A29E]">Citation Target</p>
                <p className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] text-sm">{settleModal.violation.plateNo}</p>
                <p className="text-[#6B6761] dark:text-[#A8A29E] mt-0.5">Offense: {settleModal.violation.violationType}</p>
                {settleModal.violation.sanction?.fineAmount > 0 && (
                  <p className="text-orange-700 dark:text-orange-400 font-mono font-bold mt-1">
                    Fine to Settle: ₱{settleModal.violation.sanction.fineAmount.toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] mb-1">
                  Settlement Notes / Treasury OR Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid via OR #1234567 / Suspension served"
                  value={settleModal.notes}
                  onChange={(e) => setSettleModal(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3 py-2 text-xs outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettleModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-2 rounded-lg font-semibold bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settleModal.isSubmitting}
                  className="flex-1 py-2 rounded-lg font-semibold bg-emerald-700 hover:bg-emerald-800 text-white text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {settleModal.isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Mark as Settled
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] shadow-lg rounded-lg px-4 py-3 flex items-center gap-3 max-w-sm">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
              toast.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400'
                : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400'
            }`}>
              {toast.type === 'error' ? (
                <AlertCircle size={15} />
              ) : (
                <CheckCircle2 size={15} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] leading-snug">
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default ManageRevocations;
