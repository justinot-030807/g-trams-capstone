import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '../../components/MainLayout';
import {
  ShieldAlert, Search, AlertTriangle, UploadCloud, X, Loader2,
  CheckCircle, CheckCircle2, AlertCircle, FileText, Eye, ChevronLeft,
  ChevronRight, ShieldCheck, History, Check, Lock, RotateCcw, Wallet
} from 'lucide-react';
import { TableRowsSkeleton } from '../../components/skeleton';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { cleanText, formatVehicleMakeAndModel } from '../../utils/vehicleFormatters';

const DEFAULT_FALLBACK_POLICY = {
  policyVersion: 1,
  policyUpdatedAt: null,
  types: [
    { code: 'OVERCHARGING', name: 'Overcharging of fare', severity: 'Medium', isGrave: false, defaultFine: 500, suspensionDays: 15, isActive: true },
    { code: 'REFUSAL_CONVEY', name: 'Refusal to convey passengers', severity: 'Medium', isGrave: false, defaultFine: 500, suspensionDays: 15, isActive: true },
    { code: 'DISCOURTEOUS', name: 'Arrogant/Discourteous behavior', severity: 'Low', isGrave: false, defaultFine: 300, suspensionDays: 7, isActive: true },
    { code: 'NO_FRANCHISE', name: 'Operating without valid franchise / Colorum', severity: 'Grave', isGrave: true, defaultFine: 2000, suspensionDays: 30, isActive: true },
    { code: 'OUT_OF_LINE', name: 'Out of line operation', severity: 'Medium', isGrave: false, defaultFine: 500, suspensionDays: 15, isActive: true },
    { code: 'RECKLESS_DRIVING', name: 'Reckless or dangerous driving', severity: 'High', isGrave: false, defaultFine: 1000, suspensionDays: 30, isActive: true },
    { code: 'OTHER', name: 'Other municipal ordinance violation', severity: 'Low', isGrave: false, defaultFine: 300, suspensionDays: 7, isActive: true }
  ],
  tiers: {
    firstOffense: { sanction: 'Warning', resultingStatus: 'Active - Under Warning' },
    secondOffense: { sanction: 'Suspension', resultingStatus: 'Suspended', defaultFine: 500, defaultSuspensionDays: 15 },
    thirdOffense: { sanction: 'Revocation', resultingStatus: 'Revoked' },
    graveViolation: { sanction: 'Revocation', resultingStatus: 'Revoked' }
  }
};

const formatOrdinal = (n) => {
  const num = Number(n) || 1;
  const suffix = num === 1 ? 'st' : num === 2 ? 'nd' : num === 3 ? 'rd' : 'th';
  return `${num}${suffix} Offense`;
};

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

  // Live System Violation Policy (read-only for LLSA I)
  const [violationPolicy, setViolationPolicy] = useState(DEFAULT_FALLBACK_POLICY);

  // Modal states for Recording Violation (LLSA I simplified inputs only)
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [operatorHistory, setOperatorHistory] = useState(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [selectedViolationCode, setSelectedViolationCode] = useState('');
  const [driverName, setDriverName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unit Violation History Modal (for inspecting locked rates, balances & actions)
  const [historyModal, setHistoryModal] = useState({
    isOpen: false,
    franchise: null,
    data: null,
    isLoading: false,
    error: ''
  });

  // Resolution Modal State ('settle' = fine payment, 'lift' = dismiss citation in error)
  const [settleModal, setSettleModal] = useState({
    isOpen: false,
    action: 'settle',
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
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4500);
  };

  // Active violation types filtered strictly from live SystemSettings policy
  const activePolicyTypes = useMemo(() => {
    const raw = Array.isArray(violationPolicy?.types) ? violationPolicy.types : [];
    return raw.filter((t) => t && t.isActive !== false);
  }, [violationPolicy]);

  const selectedPolicyType = useMemo(() => {
    if (!activePolicyTypes.length) return null;
    return activePolicyTypes.find((t) => t.code === selectedViolationCode) || activePolicyTypes[0];
  }, [activePolicyTypes, selectedViolationCode]);

  // Helper to compare a historical citation's locked fine against current live SystemSettings fine
  const getLivePolicyFineForViolation = (violation) => {
    const allTypes = Array.isArray(violationPolicy?.types) ? violationPolicy.types : [];
    const targetCode = String(violation?.policySnapshot?.violationCode || violation?.violationCode || '').trim().toUpperCase();
    const targetName = String(violation?.policySnapshot?.violationName || violation?.violationType || '').trim().toLowerCase();

    let matched = null;
    if (targetCode) {
      matched = allTypes.find((t) => String(t?.code || '').trim().toUpperCase() === targetCode);
    }
    if (!matched && targetName) {
      matched = allTypes.find((t) => String(t?.name || '').trim().toLowerCase() === targetName);
    }
    if (!matched || matched.defaultFine === undefined || matched.defaultFine === null) return null;
    const parsed = Number(matched.defaultFine);
    return Number.isFinite(parsed) ? parsed : null;
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
        const relevant = allFranchises
          .map(f => f.issuedPermit ? { ...f, status: f.issuedPermit.status } : f)
          .filter(f => ['Active', 'Active - Under Warning', 'Suspended', 'Revoked'].includes(f.status));
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

  // Load live unit history & sync fresh policy from backend
  const loadFranchiseHistory = async (franchiseId) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/violations/history/${franchiseId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to load operator violation history.');
    }
    if (data.policy) {
      setViolationPolicy(data.policy);
    }
    return data;
  };

  // When a franchise is selected to record violation, fetch live history & fresh policy
  const handleSelectFranchiseForViolation = async (franchise) => {
    setSelectedFranchise(franchise);
    setOperatorHistory(null);
    setHistoryError('');
    setIsHistoryLoading(true);
    setDriverName(franchise.driverName || franchise.fullName || '');
    setRemarks('');
    setEvidenceFile(null);

    const initialActive = activePolicyTypes[0];
    setSelectedViolationCode(initialActive?.code || '');

    try {
      const data = await loadFranchiseHistory(franchise._id);
      setOperatorHistory(data);
      const freshActive = (data.policy?.types || []).filter((t) => t && t.isActive !== false);
      if (freshActive.length > 0) {
        setSelectedViolationCode((prev) =>
          freshActive.some((t) => t.code === prev) ? prev : freshActive[0].code
        );
      } else {
        setSelectedViolationCode('');
      }
    } catch (err) {
      console.error('Failed to fetch operator violation history:', err);
      setHistoryError(err.message || 'Unable to synchronize operator offense history and policy.');
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Open dedicated Violation History Modal for a franchise
  const handleOpenHistoryModal = async (franchise) => {
    setHistoryModal({
      isOpen: true,
      franchise,
      data: null,
      isLoading: true,
      error: ''
    });

    try {
      const data = await loadFranchiseHistory(franchise._id);
      setHistoryModal({
        isOpen: true,
        franchise,
        data,
        isLoading: false,
        error: ''
      });
    } catch (err) {
      setHistoryModal({
        isOpen: true,
        franchise,
        data: null,
        isLoading: false,
        error: err.message || 'Failed to load violation history.'
      });
    }
  };

  // Compute read-only System Policy sanction preview strictly from cumulativeOffenseCount + live policy
  const getReadOnlyPolicyPreview = () => {
    const typeConfig = selectedPolicyType;
    const tiers = violationPolicy?.tiers || DEFAULT_FALLBACK_POLICY.tiers;
    const policyVersion = violationPolicy?.policyVersion || 1;
    const cumulativeStrikes = operatorHistory?.cumulativeOffenseCount ?? 0;
    const nextOffense = cumulativeStrikes + 1;

    const isGrave = Boolean(typeConfig?.isGrave || typeConfig?.severity === 'Grave');
    const severity = isGrave ? 'Grave' : (typeConfig?.severity || 'Medium');
    const rawFine = typeConfig?.defaultFine ?? tiers?.secondOffense?.defaultFine ?? 500;
    const lockedFine = Number.isFinite(Number(rawFine)) ? Math.max(0, Number(rawFine)) : 0;

    if (isGrave) {
      return {
        policyVersion,
        severity,
        isGrave: true,
        nextOffense,
        offenseLabel: 'Grave Violation Clause',
        sanctionType: 'Revocation',
        resultingStatus: 'Revoked',
        lockedFine,
        suspensionDays: 0,
        color: 'border-rose-300 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200',
        badge: 'bg-rose-700 text-white',
        title: 'Immediate Permanent Revocation (Grave Violation)',
        description: `Bypasses 1st and 2nd offense tiers directly to permanent revocation. Administrative fine of ₱${lockedFine.toLocaleString()} will be locked under Policy v${policyVersion}.`
      };
    }

    if (nextOffense === 1) {
      return {
        policyVersion,
        severity,
        isGrave: false,
        nextOffense,
        offenseLabel: '1st Offense',
        sanctionType: 'Warning',
        resultingStatus: 'Active - Under Warning',
        lockedFine,
        suspensionDays: 0,
        color: 'border-amber-300 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200',
        badge: 'bg-amber-700 text-white',
        title: `Official Warning + Fine ₱${lockedFine.toLocaleString()}`,
        description: 'Formal warning entered into the municipal record. Unit remains authorized to operate while notice and fine balance are in effect.'
      };
    }

    if (nextOffense === 2) {
      const rawSusp = typeConfig?.suspensionDays ?? tiers?.secondOffense?.defaultSuspensionDays ?? 15;
      const suspDays = Number.isFinite(Number(rawSusp)) ? Math.max(0, Number(rawSusp)) : 15;
      return {
        policyVersion,
        severity,
        isGrave: false,
        nextOffense,
        offenseLabel: '2nd Offense',
        sanctionType: 'Suspension',
        resultingStatus: 'Suspended',
        lockedFine,
        suspensionDays: suspDays,
        color: 'border-orange-300 dark:border-orange-900/60 bg-orange-50/70 dark:bg-orange-950/30 text-orange-900 dark:text-orange-200',
        badge: 'bg-orange-700 text-white',
        title: `Temporary Suspension (${suspDays} Days) + Fine ₱${lockedFine.toLocaleString()}`,
        description: `Operations temporarily suspended for ${suspDays} days. Operator must settle the locked administrative fine of ₱${lockedFine.toLocaleString()} before reinstatement.`
      };
    }

    return {
      policyVersion,
      severity,
      isGrave: false,
      nextOffense,
      offenseLabel: formatOrdinal(nextOffense),
      sanctionType: 'Revocation',
      resultingStatus: 'Revoked',
      lockedFine,
      suspensionDays: 0,
      color: 'border-red-300 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30 text-red-900 dark:text-red-200',
      badge: 'bg-red-700 text-white',
      title: `Final Escalation: Permanent Revocation + Fine ₱${lockedFine.toLocaleString()}`,
      description: '3rd Offense threshold reached. Franchise and MTOP permit are permanently revoked and cannot be reinstated by fine payment.'
    };
  };

  // Submit violation form (sends ONLY violationCode, violationType, driverName, remarks, evidence)
  const handleRecordViolationSubmit = async (e) => {
    e.preventDefault();
    if (isHistoryLoading || historyError) return;
    if (!selectedPolicyType) {
      return showToast('No active violation type is available in System Settings.', 'error');
    }
    if (!evidenceFile) {
      return showToast('Please upload documentary evidence (citation ticket or photo proof).', 'error');
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('franchiseId', selectedFranchise._id);
    formData.append('violationCode', selectedPolicyType.code);
    formData.append('violationType', selectedPolicyType.name);
    formData.append('driverName', driverName);
    formData.append('remarks', remarks);
    formData.append('evidence', evidenceFile);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/violations`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast(data.message, 'success');
        setSelectedFranchise(null);
        setOperatorHistory(null);
        setEvidenceFile(null);
        fetchFranchises();
        fetchViolations();
      } else {
        showToast(data.message || 'Failed to record violation.', 'error');
      }
    } catch {
      showToast('Network error occurred while recording violation.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Settle Fine or Dismiss in Error modal
  const openResolutionModal = (violation, action = 'settle') => {
    setSettleModal({
      isOpen: true,
      action,
      violation,
      notes: '',
      isSubmitting: false
    });
  };

  // Submit Settle Fine ('settle') or Dismiss in Error ('lift')
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
        body: JSON.stringify({
          action: settleModal.action,
          settledNotes: settleModal.notes
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          data.message || (settleModal.action === 'lift' ? 'Citation dismissed in error.' : 'Violation fine settled.'),
          'success'
        );
        setSettleModal({ isOpen: false, action: 'settle', violation: null, notes: '', isSubmitting: false });
        fetchFranchises();
        fetchViolations();
        if (historyModal.isOpen && historyModal.franchise?._id) {
          handleOpenHistoryModal(historyModal.franchise);
        }
      } else {
        showToast(data.message || 'Failed to update violation citation.', 'error');
        setSettleModal(prev => ({ ...prev, isSubmitting: false }));
      }
    } catch {
      showToast('Network error resolving violation citation.', 'error');
      setSettleModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // Filtered operators / franchises
  const cleanQuery = (searchQuery || '').toLowerCase().trim();
  const filteredFranchises = franchises.filter(f => {
    const isSearchMatch = !cleanQuery ||
      (f.fullName?.toLowerCase() || '').includes(cleanQuery) ||
      (f.plateNo?.toLowerCase() || '').includes(cleanQuery) ||
      (f.todaName?.toLowerCase() || '').includes(cleanQuery);

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
    const operatorDisplayName = (v.operator?.name || v.franchise?.fullName || '').toLowerCase();
    return !cleanQuery ||
      operatorDisplayName.includes(cleanQuery) ||
      (v.plateNo?.toLowerCase() || '').includes(cleanQuery) ||
      (v.violationType?.toLowerCase() || '').includes(cleanQuery) ||
      (v.violationCode?.toLowerCase() || '').includes(cleanQuery) ||
      (v.driverName?.toLowerCase() || '').includes(cleanQuery);
  });

  // Total unpaid fines across filtered violations for Citation Logs banner
  const filteredUnpaidFines = useMemo(() => {
    return filteredViolations.reduce((sum, v) => {
      if (v.status !== 'Active') return sum;
      const amt = Number(v.sanction?.fineAmount || 0);
      return sum + (Number.isFinite(amt) && amt > 0 ? amt : 0);
    }, 0);
  }, [filteredViolations]);

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

  const preview = selectedFranchise ? getReadOnlyPolicyPreview() : null;
  const isSettleTargetRevoked = Boolean(
    settleModal.violation?.sanction?.type === 'Revocation' ||
    settleModal.violation?.franchise?.status === 'Revoked' ||
    (historyModal.isOpen && historyModal.data?.franchise?.status === 'Revoked')
  );

  // Shared helper for rendering locked fine + rate comparison badge
  const renderLockedFineMeta = (v) => {
    const lockedFine = Number(v?.sanction?.fineAmount ?? 0);
    const snapshotVersion = v?.policySnapshot?.policyVersion;
    const liveFine = getLivePolicyFineForViolation(v);
    const rateChanged = liveFine !== null && liveFine !== lockedFine;

    return (
      <div className="space-y-1 mt-1">
        <p className="text-orange-700 dark:text-orange-400 font-mono tabular-nums font-semibold">
          Fine: ₱{lockedFine.toLocaleString()}
        </p>
        {snapshotVersion && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-[10px] font-mono tabular-nums font-semibold text-[#6B6761] dark:text-[#A8A29E]">
            <Lock size={10} /> Locked @ Policy v{snapshotVersion}
          </span>
        )}
        {rateChanged && (
          <p className="text-[11px] font-mono tabular-nums text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded px-1.5 py-0.5 inline-block">
            Rate locked at ₱{lockedFine.toLocaleString()} (Current policy: ₱{liveFine.toLocaleString()})
          </p>
        )}
      </div>
    );
  };

  return (
    <MainLayout>
      {/* EVIDENCE VIEWER MODAL */}
      {previewDoc && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[200] bg-[#14110F]/95 flex flex-col items-center justify-center p-4 md:p-8 backdrop-blur-sm animate-in fade-in">
          <div className="flex justify-between items-center w-full max-w-4xl mb-3">
            <h3 className="text-[#F6F5F3] font-bold text-base flex items-center gap-2">
              <Eye size={18} /> Documentary Evidence Viewer
            </h3>
            <button
              type="button"
              onClick={() => setPreviewDoc(null)}
              className="text-[#F6F5F3] hover:text-red-400 transition-colors bg-white/10 p-1.5 rounded-lg cursor-pointer"
              aria-label="Close evidence viewer"
            >
              <X size={20} />
            </button>
          </div>
          <iframe
            src={previewDoc}
            className="w-full max-w-4xl h-[75vh] md:h-[82vh] bg-white rounded-xl shadow-2xl"
            title="Evidence Document"
          />
        </div>
      )}

      {/* HEADER RIBBON */}
      <PageHeader
        title="Violations & Progressive Sanctions"
        subtitle="Enforce the municipal 3-tier progressive violation policy (Warning → Suspension → Revocation) using System Settings rates."
      />

      {/* PROGRESSIVE ENGINE SUMMARY METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <div className="p-4 rounded-xl bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E]">Active Units</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-[#1F1D1B] dark:text-[#F6F5F3] tabular-nums">{activeCount}</p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">Good Standing</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#1C1917] border border-amber-200 dark:border-amber-900/40 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">Under Warning</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-amber-700 dark:text-amber-400 tabular-nums">{warningCount}</p>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-0.5">1st Offense Notice</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#1C1917] border border-orange-200 dark:border-orange-900/40 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-orange-800 dark:text-orange-300">Suspended</span>
            <span className="w-2 h-2 rounded-full bg-orange-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-orange-700 dark:text-orange-400 tabular-nums">{suspendedCount}</p>
          <p className="text-[11px] text-orange-700 dark:text-orange-400 font-medium mt-0.5">2nd Offense Penalty</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#1C1917] border border-red-200 dark:border-red-900/40 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-red-800 dark:text-red-300">Revoked</span>
            <span className="w-2 h-2 rounded-full bg-red-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-red-700 dark:text-red-400 tabular-nums">{revokedCount}</p>
          <p className="text-[11px] text-red-700 dark:text-red-400 font-medium mt-0.5">3rd Offense / Grave</p>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="bg-white dark:bg-[#1C1917] rounded-xl border border-[#E4E1DC] dark:border-[#2E2A27] overflow-hidden transition-colors shadow-sm">
        {/* TABS */}
        <div className="flex border-b border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F]">
          <button
            type="button"
            onClick={() => { setActiveTab('operators'); setSearchQuery(''); setStatusFilter('All'); }}
            className={`flex-1 py-3 px-2 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'operators'
                ? 'text-[#9E2A2B] dark:text-[#F6F5F3] border-b-2 border-[#9E2A2B] bg-white dark:bg-[#1C1917]'
                : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
            }`}
          >
            <ShieldCheck size={16} /> Operators & Franchises
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('violations'); setSearchQuery(''); }}
            className={`flex-1 py-3 px-2 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'violations'
                ? 'text-[#9E2A2B] dark:text-[#F6F5F3] border-b-2 border-[#9E2A2B] bg-white dark:bg-[#1C1917]'
                : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
            }`}
          >
            <History size={16} /> Violation Citation Logs ({violations.length})
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('revoked'); setSearchQuery(''); }}
            className={`flex-1 py-3 px-2 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
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
              placeholder={activeTab === 'violations' ? 'Search operator, violation, plate, driver...' : 'Search operator, plate, TODA...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg text-xs text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] transition-all"
            />
          </div>

          {activeTab === 'operators' ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-medium shrink-0">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-2.5 py-2 text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] outline-none cursor-pointer"
              >
                <option value="All">All Standings</option>
                <option value="Active">Active (Good Standing)</option>
                <option value="Active - Under Warning">Active - Under Warning</option>
                <option value="Suspended">Suspended</option>
                <option value="Revoked">Revoked</option>
              </select>
            </div>
          ) : activeTab === 'violations' ? (
            <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-end">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] text-xs">
                <Lock size={13} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                <span className="text-[#6B6761] dark:text-[#A8A29E]">Active Policy:</span>
                <span className="font-mono font-bold text-[#1F1D1B] dark:text-[#F6F5F3] tabular-nums">
                  v{violationPolicy?.policyVersion || 1}
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs">
                <Wallet size={13} className="text-amber-700 dark:text-amber-400" />
                <span className="text-amber-900 dark:text-amber-200 font-medium">Total Unpaid Balance:</span>
                <span className="font-mono font-bold text-amber-800 dark:text-amber-300 tabular-nums">
                  ₱{filteredUnpaidFines.toLocaleString()}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* DATA TABLE VIEW */}
        <div className="overflow-x-auto">
          {activeTab === 'violations' ? (
            /* TAB 2: VIOLATION CITATION LOGS TABLE */
            <table className="w-full text-left border-collapse min-w-[920px] text-xs">
              <thead>
                <tr className="bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider font-semibold">
                  <th className="p-3.5 pl-5">Date & Offense</th>
                  <th className="p-3.5">Operator & Vehicle</th>
                  <th className="p-3.5">Violation Details</th>
                  <th className="p-3.5">Sanction & Locked Fine</th>
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
                  paginatedItems.map((v) => {
                    const operatorDisplayName = v.operator?.name || v.franchise?.fullName || 'Operator';
                    const isGraveBadge = Boolean(v.isGrave || v.severity === 'Grave');
                    const offenseBadgeClass = isGraveBadge || v.offenseNumber >= 3
                      ? 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300'
                      : v.offenseNumber === 2
                        ? 'bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300'
                        : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300';

                    const statusBadgeClass = v.status === 'Active'
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                      : v.status === 'Lifted'
                        ? 'bg-[#E4E1DC]/70 dark:bg-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E]'
                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300';

                    return (
                      <tr key={v._id} className="hover:bg-[#F6F5F3]/70 dark:hover:bg-[#14110F]/70 transition-colors">
                        <td className="p-3.5 pl-5 align-top">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-1 ${offenseBadgeClass}`}>
                            {isGraveBadge ? 'GRAVE OFFENSE' : formatOrdinal(v.offenseNumber)}
                          </span>
                          <p className="text-[#6B6761] dark:text-[#A8A29E] text-[11px] font-mono tabular-nums">
                            {new Date(v.createdAt).toLocaleDateString()}
                          </p>
                        </td>

                        <td className="p-3.5 align-top">
                          <p className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{operatorDisplayName}</p>
                          <p className="text-[#6B6761] dark:text-[#A8A29E] font-mono tabular-nums mt-0.5">Plate: {v.plateNo}</p>
                          {v.driverName && <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">Driver: {v.driverName}</p>}
                        </td>

                        <td className="p-3.5 align-top">
                          <p className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{v.violationType}</p>
                          <span className="text-[10px] text-[#6B6761] dark:text-[#A8A29E]">Severity: {v.severity}</span>
                          {v.remarks && <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] italic mt-0.5">&ldquo;{v.remarks}&rdquo;</p>}
                        </td>

                        <td className="p-3.5 align-top">
                          <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{v.sanction?.type}</span>
                          {renderLockedFineMeta(v)}
                          {v.sanction?.suspensionDays > 0 && (
                            <p className="text-[#6B6761] dark:text-[#A8A29E] text-[11px] font-mono tabular-nums mt-0.5">
                              {v.sanction.suspensionDays} days suspension
                            </p>
                          )}
                        </td>

                        <td className="p-3.5 text-center align-top">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${statusBadgeClass}`}>
                            {v.status === 'Lifted' ? 'Dismissed / Lifted' : v.status}
                          </span>
                          {v.settledNotes && v.status !== 'Active' && (
                            <p className="text-[10px] text-[#6B6761] dark:text-[#A8A29E] mt-1 max-w-[140px] mx-auto truncate" title={v.settledNotes}>
                              {v.settledNotes}
                            </p>
                          )}
                        </td>

                        <td className="p-3.5 pr-5 text-center align-top">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {v.evidenceUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewDoc(v.evidenceUrl)}
                                className="p-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3] dark:hover:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] cursor-pointer"
                                title="View Citation Evidence"
                              >
                                <FileText size={13} />
                              </button>
                            )}

                            {v.status === 'Active' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openResolutionModal(v, 'settle')}
                                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 cursor-pointer"
                                  title="Record fine payment as settled"
                                >
                                  Settle Fine
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openResolutionModal(v, 'lift')}
                                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-950/50 cursor-pointer"
                                  title="Dismiss citation recorded in error and remove strike"
                                >
                                  Dismiss in Error
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
                        <p className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] text-sm">{cleanText(f.fullName, 'Operator')}</p>
                        <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>Plate:</span>
                          <span className="font-mono tabular-nums font-medium px-1.5 py-0.5 rounded bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3]">{cleanText(f.plateNo, 'N/A')}</span>
                          <span>&bull; {formatVehicleMakeAndModel(f, 'Tricycle Unit')}</span>
                          {cleanText(f.motorNo) && <span>&bull; Eng: {cleanText(f.motorNo)}</span>}
                        </p>
                      </td>

                      <td className="p-3.5">
                        <p className="font-medium text-[#1F1D1B] dark:text-[#F6F5F3]">{cleanText(f.todaName, 'NON-TODA')}</p>
                        <span className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">{cleanText(f.zone, 'Gasan')}</span>
                      </td>

                      <td className="p-3.5 text-center">
                        <StatusBadge status={f.status} />
                      </td>

                      <td className="p-3.5">
                        {f.status === 'Revoked' ? (
                          <div>
                            <p className="font-semibold text-red-700 dark:text-red-400">
                              {cleanText(f.cancelReason || f.suspensionReason, 'Revoked by OVM Franchising (LLSA I)')}
                            </p>
                            <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] font-mono tabular-nums">
                              Date: {new Date(f.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        ) : f.status === 'Suspended' ? (
                          <div>
                            <p className="font-semibold text-orange-700 dark:text-orange-400">{f.suspensionReason || 'Temporary Suspension'}</p>
                            {f.suspensionEndDate && (
                              <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] font-mono tabular-nums">
                                Until: {new Date(f.suspensionEndDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ) : f.status === 'Active - Under Warning' ? (
                          <div>
                            <p className="font-semibold text-amber-700 dark:text-amber-400">{f.currentSanction || 'Warning Active'}</p>
                            <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">Unit operational under probation</p>
                          </div>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">Good Standing</span>
                        )}
                      </td>

                      <td className="p-3.5 pr-5 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleOpenHistoryModal(f)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3] dark:hover:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] text-xs font-semibold cursor-pointer transition-colors"
                            title="Inspect unit violation history & fine ledger"
                          >
                            <History size={13} /> History
                          </button>

                          {f.status === 'Revoked' ? (
                            f.evidenceUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewDoc(f.evidenceUrl)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3] dark:hover:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] text-xs font-semibold cursor-pointer"
                              >
                                <FileText size={13} /> Evidence
                              </button>
                            )
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectFranchiseForViolation(f)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/60 cursor-pointer shadow-sm transition-colors"
                            >
                              <ShieldAlert size={13} /> Record Violation
                            </button>
                          )}
                        </div>
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
          <div className="px-4 py-3 sm:px-5 bg-[#F6F5F3] dark:bg-[#14110F] border-t border-[#E4E1DC] dark:border-[#2E2A27] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs rounded-b-xl">
            <div className="flex items-center gap-2 text-[#6B6761] dark:text-[#A8A29E] font-medium">
              <span>Showing</span>
              <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] font-mono tabular-nums">{startIndex + 1}</span>
              <span>to</span>
              <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] font-mono tabular-nums">{endIndex}</span>
              <span>of</span>
              <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] font-mono tabular-nums">{totalRecords}</span>
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
              <span className="px-2 font-semibold font-mono tabular-nums">{validCurrentPage} of {totalPages}</span>
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

      {/* RECORD VIOLATION MODAL (SIMPLIFIED LLSA I FORM + READ-ONLY POLICY PREVIEW) */}
      {selectedFranchise && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 transition-opacity"
            onClick={() => !isSubmitting && setSelectedFranchise(null)}
          />

          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] w-full max-w-xl rounded-xl shadow-xl relative z-10 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E4E1DC] dark:border-[#2E2A27] flex justify-between items-center bg-[#F6F5F3] dark:bg-[#14110F] rounded-t-xl">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-100 dark:bg-red-950/50 text-[#9E2A2B] dark:text-red-400 rounded-lg">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                    Record Operator Violation
                  </h2>
                  <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
                    Sanctions and fines are enforced strictly from System Settings
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSubmitting && setSelectedFranchise(null)}
                className="text-[#6B6761] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] cursor-pointer p-1"
                aria-label="Close record violation modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordViolationSubmit} className="p-5 space-y-4">
              {/* Operator Summary Card */}
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-3.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] text-[#6B6761] dark:text-[#A8A29E] font-bold uppercase tracking-wider">Target Operator</span>
                    <p className="font-semibold text-sm text-[#1F1D1B] dark:text-[#F6F5F3]">{selectedFranchise.fullName}</p>
                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
                      Plate: <span className="font-mono tabular-nums font-semibold px-1 py-0.5 rounded bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27]">{selectedFranchise.plateNo}</span>
                      {' '}&bull; TODA: {selectedFranchise.todaName || 'NON-TODA'}
                    </p>
                  </div>
                  <StatusBadge status={selectedFranchise.status} />
                </div>

                {/* Cumulative & Active Offenses */}
                <div className="mt-3 pt-2.5 border-t border-[#E4E1DC] dark:border-[#2E2A27] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-[#6B6761] dark:text-[#A8A29E] flex items-center gap-1.5">
                    <History size={13} /> Cumulative Strike History:
                  </span>
                  {isHistoryLoading ? (
                    <span className="text-[#6B6761] dark:text-[#A8A29E] animate-pulse">Syncing history & policy...</span>
                  ) : historyError ? (
                    <span className="text-red-700 dark:text-red-400 font-semibold">Sync failed</span>
                  ) : (
                    <span className="font-bold font-mono tabular-nums text-[#1F1D1B] dark:text-[#F6F5F3]">
                      {operatorHistory?.cumulativeOffenseCount ?? 0} Recorded ({operatorHistory?.activeViolationCount ?? 0} Unsettled)
                    </span>
                  )}
                </div>

                {/* Total Unpaid Fine Balance Banner inside Modal */}
                {!isHistoryLoading && !historyError && (operatorHistory?.fineSummary?.totalUnpaidFines || 0) > 0 && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-2 text-xs">
                    <span className="text-amber-900 dark:text-amber-200 font-semibold flex items-center gap-1.5">
                      <Wallet size={13} /> Existing Unpaid Fine Balance
                    </span>
                    <span className="font-mono tabular-nums font-bold text-amber-800 dark:text-amber-300">
                      ₱{Number(operatorHistory.fineSummary.totalUnpaidFines).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* 1. VIOLATION TYPE / REASON SELECTOR (Active Types Only) */}
              <div>
                <label className="block text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] mb-1.5">
                  Violation Type / Reason <span className="text-[#9E2A2B]">*</span>
                </label>
                <select
                  value={selectedPolicyType?.code || ''}
                  onChange={(e) => setSelectedViolationCode(e.target.value)}
                  disabled={isHistoryLoading || activePolicyTypes.length === 0}
                  className="w-full min-h-[44px] bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#9E2A2B] cursor-pointer font-medium disabled:opacity-60"
                >
                  {activePolicyTypes.length === 0 ? (
                    <option value="">No active violation types configured</option>
                  ) : (
                    activePolicyTypes.map((v) => (
                      <option key={v.code} value={v.code}>
                        {v.name} ({v.severity}{v.isGrave || v.severity === 'Grave' ? ' — Direct Revocation' : ''})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* READ-ONLY SYSTEM POLICY PREVIEW CARD */}
              {isHistoryLoading ? (
                <div className="p-4 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] flex items-center justify-center gap-2 text-xs text-[#6B6761] dark:text-[#A8A29E]">
                  <Loader2 size={15} className="animate-spin" />
                  <span>Loading live System Settings policy preview...</span>
                </div>
              ) : historyError ? (
                <div className="p-3.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 flex items-center justify-between gap-2 text-xs text-red-800 dark:text-red-300">
                  <span>{historyError}</span>
                  <button
                    type="button"
                    onClick={() => handleSelectFranchiseForViolation(selectedFranchise)}
                    className="px-2.5 py-1 rounded bg-white dark:bg-[#1C1917] border border-red-200 dark:border-red-800 font-semibold cursor-pointer shrink-0"
                  >
                    Retry
                  </button>
                </div>
              ) : preview ? (
                <div className={`p-4 rounded-lg border ${preview.color} transition-all space-y-2.5`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${preview.badge}`}>
                      {preview.offenseLabel}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/80 dark:bg-[#14110F]/80 border border-current/20 text-[10px] font-mono tabular-nums font-bold">
                      <Lock size={10} /> System Policy v{preview.policyVersion} (Read-Only)
                    </span>
                  </div>

                  <p className="text-xs font-bold">{preview.title}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="p-2 rounded bg-white/75 dark:bg-[#14110F]/60 border border-black/5 dark:border-white/10">
                      <p className="text-[10px] uppercase tracking-wider opacity-75">Severity</p>
                      <p className="text-xs font-bold mt-0.5">{preview.severity}</p>
                    </div>
                    <div className="p-2 rounded bg-white/75 dark:bg-[#14110F]/60 border border-black/5 dark:border-white/10">
                      <p className="text-[10px] uppercase tracking-wider opacity-75">Next Tier</p>
                      <p className="text-xs font-bold mt-0.5">{preview.sanctionType}</p>
                    </div>
                    <div className="p-2 rounded bg-white/75 dark:bg-[#14110F]/60 border border-black/5 dark:border-white/10">
                      <p className="text-[10px] uppercase tracking-wider opacity-75">Locked Fine</p>
                      <p className="text-xs font-bold font-mono tabular-nums mt-0.5">₱{preview.lockedFine.toLocaleString()}</p>
                    </div>
                    <div className="p-2 rounded bg-white/75 dark:bg-[#14110F]/60 border border-black/5 dark:border-white/10">
                      <p className="text-[10px] uppercase tracking-wider opacity-75">Suspension</p>
                      <p className="text-xs font-bold font-mono tabular-nums mt-0.5">
                        {preview.suspensionDays > 0 ? `${preview.suspensionDays} Days` : 'None'}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] leading-relaxed opacity-90">{preview.description}</p>
                </div>
              ) : null}

              {/* 2. OPERATING DRIVER & INCIDENT REMARKS / DETAILS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6B6761] dark:text-[#A8A29E] mb-1">
                    Operating Driver (optional)
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Driver's full name"
                    className="w-full min-h-[44px] bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#9E2A2B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6B6761] dark:text-[#A8A29E] mb-1">
                    Incident Remarks / Details
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Brgy. Poblacion checkpoint / citation details"
                    className="w-full min-h-[44px] bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#9E2A2B]"
                  />
                </div>
              </div>

              {/* 3. DOCUMENTARY EVIDENCE (REQUIRED) */}
              <div>
                <label className="block text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] mb-1.5">
                  Documentary Evidence (Citation Ticket / Photo) <span className="text-[#9E2A2B]">*</span>
                </label>
                <div className="border border-dashed border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] rounded-lg p-4 text-center relative cursor-pointer hover:border-[#9E2A2B] transition-colors">
                  <input
                    type="file"
                    accept=".pdf, image/*"
                    onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
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
                  className="flex-1 min-h-[44px] py-2 rounded-lg font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#E4E1DC] dark:hover:bg-[#2E2A27] border border-[#E4E1DC] dark:border-[#2E2A27] transition-colors text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isHistoryLoading || Boolean(historyError) || !selectedPolicyType}
                  className={`flex-1 min-h-[44px] py-2 rounded-lg font-semibold text-white transition-colors text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    preview?.resultingStatus === 'Revoked'
                      ? 'bg-red-700 hover:bg-red-800'
                      : preview?.resultingStatus === 'Suspended'
                        ? 'bg-orange-700 hover:bg-orange-800'
                        : 'bg-[#9E2A2B] hover:bg-[#7A1B22]'
                  }`}
                >
                  {isSubmitting || isHistoryLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <ShieldAlert size={14} />
                  )}
                  {isSubmitting
                    ? 'Recording...'
                    : isHistoryLoading
                      ? 'Syncing Policy...'
                      : preview?.resultingStatus === 'Revoked'
                        ? 'Confirm Revocation'
                        : preview?.resultingStatus === 'Suspended'
                          ? 'Enforce Suspension'
                          : 'Issue Official Warning'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UNIT VIOLATION HISTORY & FINE LEDGER MODAL */}
      {historyModal.isOpen && historyModal.franchise && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 transition-opacity"
            onClick={() => setHistoryModal(prev => ({ ...prev, isOpen: false }))}
          />

          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] w-full max-w-2xl rounded-xl shadow-xl relative z-10 max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-[#E4E1DC] dark:border-[#2E2A27] flex justify-between items-center bg-[#F6F5F3] dark:bg-[#14110F] rounded-t-xl">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#9E2A2B] dark:text-[#D4AF37] rounded-lg">
                  <History size={18} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                    Unit Violation Ledger & History
                  </h2>
                  <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
                    {historyModal.franchise.fullName} &bull; Plate{' '}
                    <span className="font-mono font-semibold">{historyModal.franchise.plateNo}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModal(prev => ({ ...prev, isOpen: false }))}
                className="text-[#6B6761] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] cursor-pointer p-1"
                aria-label="Close violation history modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {historyModal.isLoading ? (
                <div className="py-10 flex items-center justify-center gap-2 text-xs text-[#6B6761] dark:text-[#A8A29E]">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Loading violation history and fine balance...</span>
                </div>
              ) : historyModal.error ? (
                <div className="p-4 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-xs text-red-800 dark:text-red-300 flex items-center justify-between gap-2">
                  <span>{historyModal.error}</span>
                  <button
                    type="button"
                    onClick={() => handleOpenHistoryModal(historyModal.franchise)}
                    className="px-3 py-1 rounded bg-white dark:bg-[#1C1917] border border-red-200 dark:border-red-800 font-semibold cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              ) : historyModal.data ? (
                <>
                  {/* TOTAL UNPAID FINE BALANCE BANNER */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1">
                        <Wallet size={12} /> Total Unpaid Fine Balance
                      </p>
                      <p className="text-lg font-bold font-mono tabular-nums text-amber-900 dark:text-amber-200 mt-1">
                        ₱{Number(historyModal.data.fineSummary?.totalUnpaidFines || 0).toLocaleString()}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27]">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E]">
                        Settled Fines / Assessed
                      </p>
                      <p className="text-sm font-bold font-mono tabular-nums text-[#1F1D1B] dark:text-[#F6F5F3] mt-1">
                        ₱{Number(historyModal.data.fineSummary?.totalSettledFines || 0).toLocaleString()}
                        <span className="text-[11px] font-normal text-[#6B6761] dark:text-[#A8A29E]">
                          {' '}/ ₱{Number(historyModal.data.fineSummary?.totalFinesAssessed || 0).toLocaleString()}
                        </span>
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27]">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E]">
                        Cumulative Strikes
                      </p>
                      <p className="text-sm font-bold font-mono tabular-nums text-[#1F1D1B] dark:text-[#F6F5F3] mt-1">
                        {historyModal.data.cumulativeOffenseCount ?? 0} Valid
                        <span className="text-[11px] font-normal text-[#6B6761] dark:text-[#A8A29E]">
                          {' '}({historyModal.data.activeViolationCount ?? 0} Unsettled)
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* HISTORY LIST */}
                  {(historyModal.data.history || []).length === 0 ? (
                    <div className="py-10 text-center text-[#6B6761] dark:text-[#A8A29E]">
                      <CheckCircle size={28} className="mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-semibold">No violation citations on record for this tricycle unit.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {historyModal.data.history.map((v) => {
                        const isGraveBadge = Boolean(v.isGrave || v.severity === 'Grave');
                        return (
                          <div
                            key={v._id}
                            className="p-3.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#14110F]/60 text-xs space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isGraveBadge || v.offenseNumber >= 3
                                      ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'
                                      : v.offenseNumber === 2
                                        ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300'
                                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                  }`}>
                                    {isGraveBadge ? 'GRAVE OFFENSE' : formatOrdinal(v.offenseNumber)}
                                  </span>
                                  <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{v.violationType}</span>
                                </div>
                                <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] mt-0.5 font-mono tabular-nums">
                                  {new Date(v.createdAt).toLocaleDateString()} &bull; Severity: {v.severity} &bull; Sanction: {v.sanction?.type}
                                </p>
                              </div>

                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                v.status === 'Active'
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                  : v.status === 'Lifted'
                                    ? 'bg-[#E4E1DC]/70 dark:bg-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E]'
                                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              }`}>
                                {v.status === 'Lifted' ? 'Dismissed / Lifted' : v.status}
                              </span>
                            </div>

                            {renderLockedFineMeta(v)}

                            {v.remarks && (
                              <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] italic">&ldquo;{v.remarks}&rdquo;</p>
                            )}
                            {v.settledNotes && v.status !== 'Active' && (
                              <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
                                Resolution Notes: {v.settledNotes}
                              </p>
                            )}

                            <div className="flex items-center justify-end gap-1.5 pt-1 flex-wrap">
                              {v.evidenceUrl && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewDoc(v.evidenceUrl)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#1C1917] text-[11px] font-semibold cursor-pointer"
                                >
                                  <FileText size={12} /> Evidence
                                </button>
                              )}
                              {v.status === 'Active' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openResolutionModal(v, 'settle')}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 cursor-pointer"
                                  >
                                    Settle Fine
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openResolutionModal(v, 'lift')}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 cursor-pointer"
                                  >
                                    Dismiss in Error
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* SETTLE FINE / DISMISS IN ERROR MODAL */}
      {settleModal.isOpen && settleModal.violation && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 transition-opacity"
            onClick={() => !settleModal.isSubmitting && setSettleModal(prev => ({ ...prev, isOpen: false }))}
          />

          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] w-full max-w-md rounded-xl shadow-xl relative z-10 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27] mb-4">
              <h3 className="font-semibold text-sm text-[#1F1D1B] dark:text-[#F6F5F3] flex items-center gap-2">
                {settleModal.action === 'lift' ? (
                  <>
                    <RotateCcw size={16} className="text-amber-700 dark:text-amber-400" /> Dismiss Citation in Error
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} className="text-emerald-700 dark:text-emerald-400" /> Settle Violation Fine
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => !settleModal.isSubmitting && setSettleModal(prev => ({ ...prev, isOpen: false }))}
                className="text-[#6B6761] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] cursor-pointer"
                aria-label="Close resolution modal"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSettleViolationSubmit} className="space-y-3.5 text-xs">
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-3 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <p className="text-[10px] uppercase font-bold text-[#6B6761] dark:text-[#A8A29E]">Citation Target</p>
                <p className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] text-sm font-mono tabular-nums">
                  {settleModal.violation?.plateNo}
                </p>
                <p className="text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
                  Offense: {settleModal.violation?.violationType}
                </p>
                {renderLockedFineMeta(settleModal.violation)}
              </div>

              {settleModal.action === 'lift' ? (
                <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed">
                  <strong>Dismiss in Error:</strong> Use only when this citation was issued mistakenly or overturned on appeal.
                  The citation will be marked <strong>Lifted</strong>, removed from the operator&apos;s cumulative offense strike history, and permit standing will be recalculated.
                </div>
              ) : isSettleTargetRevoked ? (
                <div className="p-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200 text-[11px] leading-relaxed">
                  <strong>Permanent Revocation Notice:</strong> Settling this fine records payment of the locked monetary balance only.
                  The franchise will remain permanently <strong>Revoked</strong>. Use <em>Dismiss in Error</em> only if the revocation citation itself was mistaken.
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] text-[#6B6761] dark:text-[#A8A29E] text-[11px] leading-relaxed">
                  Marking this violation as <strong>Settled</strong> clears the unpaid fine and lifts suspension/warning if no other unsettled citations remain.
                  Valid prior offense strikes stay on record for future progressive escalation.
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] mb-1">
                  {settleModal.action === 'lift'
                    ? 'Reason for Dismissal / Appeal Reference'
                    : 'Settlement Notes / Treasury OR Number'}
                </label>
                <input
                  type="text"
                  placeholder={settleModal.action === 'lift'
                    ? 'e.g. Wrong plate encoded / OVM review approval'
                    : 'e.g. Paid via OR #1234567 / Suspension served'}
                  value={settleModal.notes}
                  onChange={(e) => setSettleModal(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full min-h-[44px] bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#9E2A2B]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettleModal(prev => ({ ...prev, isOpen: false }))}
                  disabled={settleModal.isSubmitting}
                  className="flex-1 min-h-[44px] py-2 rounded-lg font-semibold bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settleModal.isSubmitting}
                  className={`flex-1 min-h-[44px] py-2 rounded-lg font-semibold text-white text-xs shadow-sm cursor-pointer flex items-center justify-center gap-1.5 ${
                    settleModal.action === 'lift'
                      ? 'bg-amber-700 hover:bg-amber-800'
                      : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  {settleModal.isSubmitting ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : settleModal.action === 'lift' ? (
                    <RotateCcw size={13} />
                  ) : (
                    <Check size={13} />
                  )}
                  {settleModal.action === 'lift' ? 'Confirm Dismiss / Lift' : 'Confirm Fine Settlement'}
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
