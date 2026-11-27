import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/MainLayout';
import { unsubscribeFromPush } from '../../utils/pushNotification';
import { 
  Sliders, User, Lock, Camera, Save, Loader2, 
  CheckCircle2, AlertCircle, Moon, Sun, Globe, Clock, 
  Wallet, CalendarDays, AlertTriangle, ShieldCheck, 
  Bell, FileCheck, Shield, ChevronRight, ChevronLeft, X, Search, RefreshCw, Info,
  ShieldAlert, Plus, Trash2, Scale, Database, RotateCcw, Download, UploadCloud, FileArchive, HardDrive, Megaphone
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useConfirm } from '../../components/ui/ConfirmContext';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '../../components/ui/Dialog';
import { SettingsSkeleton, TableRowsSkeleton } from '../../components/skeleton';
import PageHeader from '../../components/common/PageHeader';

const EMPTY_RESTORE_MODAL = {
  filename: null,
  file: null,
  isRestoring: false,
  confirmText: '',
  adminPassword: '',
  error: ''
};

const RESTORE_OUTCOME_UNKNOWN =
  'The restore result could not be confirmed. Check the audit log before trying again.';

const DEFAULT_REQUIRED_DOCS = ['OR / CR ng Motor', "Driver's License", 'TODA Endorsement', 'Barangay Clearance'];
const DEFAULT_MAINTENANCE_MESSAGE = 'G-TRAMS portal is currently undergoing scheduled system maintenance. Please check back later.';

const DEFAULT_VIOLATION_TYPES = [
  { code: 'OVERCHARGING', name: 'Overcharging of fare', severity: 'Medium', isGrave: false, defaultFine: 500, suspensionDays: 15, isActive: true },
  { code: 'REFUSAL_CONVEY', name: 'Refusal to convey passengers', severity: 'Medium', isGrave: false, defaultFine: 500, suspensionDays: 15, isActive: true },
  { code: 'DISCOURTEOUS', name: 'Arrogant/Discourteous behavior', severity: 'Low', isGrave: false, defaultFine: 300, suspensionDays: 7, isActive: true },
  { code: 'NO_FRANCHISE', name: 'Operating without valid franchise / Colorum', severity: 'Grave', isGrave: true, defaultFine: 2000, suspensionDays: 30, isActive: true },
  { code: 'OUT_OF_LINE', name: 'Out of line operation', severity: 'Medium', isGrave: false, defaultFine: 500, suspensionDays: 15, isActive: true },
  { code: 'RECKLESS_DRIVING', name: 'Reckless or dangerous driving', severity: 'High', isGrave: false, defaultFine: 1000, suspensionDays: 30, isActive: true },
  { code: 'OTHER', name: 'Other municipal ordinance violation', severity: 'Low', isGrave: false, defaultFine: 300, suspensionDays: 7, isActive: true }
];

const DEFAULT_VIOLATION_TIERS = {
  firstOffense: { sanction: 'Warning', resultingStatus: 'Active - Under Warning', description: 'Official Warning recorded in municipal database; franchise remains operational.' },
  secondOffense: { sanction: 'Suspension', resultingStatus: 'Suspended', defaultFine: 500, defaultSuspensionDays: 15, description: 'Temporary suspension of franchise operations and imposition of administrative fine.' },
  thirdOffense: { sanction: 'Revocation', resultingStatus: 'Revoked', description: 'Immediate and permanent revocation of MTOP franchise and permit.' },
  graveViolation: { sanction: 'Revocation', resultingStatus: 'Revoked', description: 'Direct revocation regardless of prior offense count due to critical offense severity.' }
};

const normalizeFiscalYear = (val) => {
  const match = String(val ?? '').trim().match(/^(\d{4})/);
  if (match) {
    const yr = Number(match[1]);
    if (yr >= 2020 && yr <= 2100) return match[1];
  }
  return new Date().getFullYear().toString();
};

const buildFiscalYearOptions = (currentValue) => {
  const currentYear = new Date().getFullYear();
  const options = [];
  for (let yr = currentYear - 1; yr <= currentYear + 5; yr += 1) {
    options.push(String(yr));
  }
  const cleanCurrent = String(currentValue ?? '').trim();
  if (/^\d{4}$/.test(cleanCurrent)) {
    const yrNum = Number(cleanCurrent);
    if (yrNum >= 2020 && yrNum <= 2100 && !options.includes(cleanCurrent)) {
      options.push(cleanCurrent);
      options.sort((a, b) => Number(a) - Number(b));
    }
  }
  return options;
};

const safeParseDocs = (raw, fallback = DEFAULT_REQUIRED_DOCS) => {
  if (!raw) return [...fallback];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === 'string' && item.trim() !== '');
    }
  } catch {
    // Ignore corrupted cached JSON and fall back cleanly
  }
  return [...fallback];
};

const cloneViolationPolicy = (policy) => {
  const types = Array.isArray(policy?.types)
    ? policy.types.map((t) => ({
        ...(t?._id ? { _id: t._id } : {}),
        code: String(t?.code || '').trim(),
        name: String(t?.name || '').trim(),
        severity: (t?.isGrave || t?.severity === 'Grave') ? 'Grave' : (t?.severity || 'Medium'),
        isGrave: Boolean(t?.isGrave || t?.severity === 'Grave'),
        defaultFine: t?.defaultFine ?? 0,
        suspensionDays: t?.suspensionDays ?? 0,
        isActive: t?.isActive !== false
      }))
    : DEFAULT_VIOLATION_TYPES.map((t) => ({ ...t }));

  const tiers = {
    firstOffense: { ...DEFAULT_VIOLATION_TIERS.firstOffense, ...(policy?.tiers?.firstOffense || {}) },
    secondOffense: { ...DEFAULT_VIOLATION_TIERS.secondOffense, ...(policy?.tiers?.secondOffense || {}) },
    thirdOffense: { ...DEFAULT_VIOLATION_TIERS.thirdOffense, ...(policy?.tiers?.thirdOffense || {}) },
    graveViolation: { ...DEFAULT_VIOLATION_TIERS.graveViolation, ...(policy?.tiers?.graveViolation || {}) }
  };

  return {
    policyVersion: Number(policy?.policyVersion) >= 1 ? Number(policy.policyVersion) : 1,
    policyUpdatedAt: policy?.policyUpdatedAt || null,
    types,
    tiers
  };
};

const serializeViolationPolicyForCompare = (policy) => JSON.stringify({
  types: (policy?.types || []).map((t) => ({
    code: String(t.code || '').trim().toUpperCase(),
    name: String(t.name || '').trim(),
    severity: (t.isGrave || t.severity === 'Grave') ? 'Grave' : (t.severity || 'Medium'),
    isGrave: Boolean(t.isGrave || t.severity === 'Grave'),
    defaultFine: String(t.defaultFine ?? ''),
    suspensionDays: String(t.suspensionDays ?? ''),
    isActive: t.isActive !== false
  })),
  secondOffenseFine: String(policy?.tiers?.secondOffense?.defaultFine ?? ''),
  secondOffenseDays: String(policy?.tiers?.secondOffense?.defaultSuspensionDays ?? '')
});

const serializeAnnouncementsForCompare = (list) => JSON.stringify(
  (Array.isArray(list) ? list : []).map((a) => ({
    title: String(a.title || '').trim(),
    desc: String(a.desc || '').trim(),
    type: a.type || 'info',
    date: String(a.date || '').trim(),
    isActive: a.isActive !== false
  }))
);

const AdminSettings = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme, isDark } = useTheme();
  const { confirm } = useConfirm();

  const userRole = String(localStorage.getItem('role') || '').toLowerCase().trim().replace(/_/g, ' ');
  const isSystemAdmin = userRole === 'system admin' || userRole === 'admin' || userRole === 'administrator';
  const [activeTab, setActiveTab] = useState(isSystemAdmin ? 'system' : 'account');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [savingSection, setSavingSection] = useState({
    validity: false,
    fiscal: false,
    documents: false,
    maintenance: false,
    violationPolicy: false
  });

  // System configuration state
  const [initialSystemConfig, setInitialSystemConfig] = useState(null);
  const [systemConfig, setSystemConfig] = useState({
    newFranchise: 3,
    renewFranchise: 1,
    fiscalYear: normalizeFiscalYear(new Date().getFullYear().toString()),
    franchiseFee: 500,
    penaltyFee: 50,
    maxUnitsPerOperator: 2,
    maintenanceMode: false,
    maintenanceMessage: DEFAULT_MAINTENANCE_MESSAGE,
    expiryWarningDays: 30,
    requiredDocs: [...DEFAULT_REQUIRED_DOCS],
    newDocInput: '',
    violationPolicy: cloneViolationPolicy(null)
  });

  const [newViolationInput, setNewViolationInput] = useState({
    name: '',
    severity: 'Medium',
    isGrave: false,
    defaultFine: '500',
    suspensionDays: '15'
  });

  // Account and security state
  const [accountData, setAccountData] = useState({
    name: 'Administrator',
    email: '',
    contact: '',
    profilePic: null
  });
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    theme: localStorage.getItem('theme') || 'light',
    language: localStorage.getItem('gtrams_lang') || language || 'en',
    inAppToastAlerts: localStorage.getItem('gtrams_toast_alerts') !== 'false'
  });

  // Announcements state (clientKey is UI-only; never send synthetic _id to Mongoose)
  const [announcements, setAnnouncements] = useState([
    {
      clientKey: 'default-1',
      title: 'Franchise Renewal Schedule',
      desc: 'All registered tricycle operators must complete annual MTOP renewal before designated deadline to maintain active status.',
      type: 'alert',
      date: 'Annual Cycle',
      isActive: true
    },
    {
      clientKey: 'default-2',
      title: 'Digital MTOP & QR Verification',
      desc: 'Approved operators can now view and download their digitally signed MTOP certificates with verifiable QR codes directly from their dashboard.',
      type: 'info',
      date: 'Portal Update',
      isActive: true
    },
    {
      clientKey: 'default-3',
      title: 'Online Application Support',
      desc: 'Municipal Tricycle Franchising staff are available to assist operators with online registration, document scanning, and route zoning inquiries.',
      type: 'event',
      date: 'Advisory',
      isActive: true
    }
  ]);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    desc: '',
    type: 'info',
    date: 'General Advisory'
  });
  const [initialAnnouncements, setInitialAnnouncements] = useState(null);
  const [isSavingAnnouncements, setIsSavingAnnouncements] = useState(false);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPagination, setAuditPagination] = useState({
    totalRecords: 0,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [auditActionFilter, setAuditActionFilter] = useState('All');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');

  // Database Backup & Disaster Recovery state
  const [backups, setBackups] = useState([]);
  const [backupStats, setBackupStats] = useState({
    totalBackups: 0,
    latestBackupDate: null,
    totalStorageFormatted: '0 KB',
    cronSchedule: 'Every Sunday @ 00:00 PST',
    retentionPolicy: 'Rolling 8 Weeks'
  });
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [restoreModal, setRestoreModal] = useState(EMPTY_RESTORE_MODAL);
  const backupUploadInputRef = useRef(null);
  const backupUploadButtonRef = useRef(null);
  const restoreTriggerRef = useRef(null);
  const restorePendingRef = useRef(false);

  const fetchBackups = async () => {
    setIsLoadingBackups(true);
    try {
      const token = localStorage.getItem('token');
      const [listRes, statusRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/backups/list`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/backups/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (listRes.ok) {
        const listData = await listRes.json();
        const loadedBackups = Array.isArray(listData.backups) ? listData.backups : [];
        setBackups(loadedBackups);
        if (!statusRes.ok && loadedBackups.length > 0) {
          const totalBytes = loadedBackups.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);
          setBackupStats(prev => ({
            ...prev,
            totalBackups: loadedBackups.length,
            latestBackupDate: loadedBackups[0]?.createdAt || null,
            totalStorageFormatted: totalBytes > 1024 * 1024
              ? `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`
              : `${(totalBytes / 1024).toFixed(1)} KB`
          }));
        }
      }
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (statusData.stats) setBackupStats(statusData.stats);
      }
      if (!listRes.ok && !statusRes.ok) {
        const errData = await listRes.json().catch(() => ({}));
        showToast(errData.message || 'Unable to load backup archives right now.', 'error');
      }
    } catch (err) {
      console.error('Error fetching backups:', err);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleCreateManualBackup = async () => {
    setIsBackingUp(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/backups/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: 'Manual admin snapshot' })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Database snapshot created successfully!', 'success');
        fetchBackups();
      } else {
        showToast(data.message || 'Failed to create backup.', 'error');
      }
    } catch (err) {
      showToast('Network error while creating backup.', 'error');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDownloadDirectSnapshot = () => {
    const token = localStorage.getItem('token');
    showToast('Preparing direct database snapshot...', 'info');
    fetch(`${import.meta.env.VITE_API_URL}/api/v1/backups/direct-download`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Download failed');
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gtrams_live_snapshot_${new Date().toISOString().slice(0, 10)}.json.gz`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast('Snapshot downloaded to offline storage.', 'success');
      })
      .catch(() => showToast('Error downloading direct snapshot.', 'error'));
  };

  const handleDownloadBackupFile = (filename) => {
    const token = localStorage.getItem('token');
    fetch(`${import.meta.env.VITE_API_URL}/api/v1/backups/download/${filename}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Download failed');
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch(() => showToast('Error downloading file.', 'error'));
  };

  const openArchiveRestore = (filename, trigger) => {
    restoreTriggerRef.current = trigger;
    setRestoreModal({ ...EMPTY_RESTORE_MODAL, filename });
  };

  const handleUploadBackupRestore = (event) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    restoreTriggerRef.current = backupUploadButtonRef.current;
    setRestoreModal({ ...EMPTY_RESTORE_MODAL, filename: file.name, file });
  };

  const handleExecuteRestore = async (event) => {
    event.preventDefault();
    const { filename, file, confirmText, adminPassword } = restoreModal;
    if (restorePendingRef.current || !filename || confirmText.trim() !== 'RESTORE' || !adminPassword) return;

    restorePendingRef.current = true;
    setRestoreModal(prev => ({ ...prev, isRestoring: true, adminPassword: '', error: '' }));

    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      let body;
      if (file) {
        body = new FormData();
        body.append('adminPassword', adminPassword);
        body.append('backupFile', file);
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({ adminPassword });
      }

      const endpoint = file ? 'restore-upload' : `restore-file/${encodeURIComponent(filename)}`;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/backups/${endpoint}`, {
        method: 'POST',
        headers,
        body
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        showToast('Database successfully restored from archive.', 'success');
        setRestoreModal(EMPTY_RESTORE_MODAL);
        fetchBackups();
      } else {
        const error = !data || [408, 502, 504].includes(res.status)
          ? RESTORE_OUTCOME_UNKNOWN
          : data.message || 'Restore failed.';
        setRestoreModal(prev => ({ ...prev, isRestoring: false, error }));
      }
    } catch {
      setRestoreModal(prev => ({ ...prev, isRestoring: false, error: RESTORE_OUTCOME_UNKNOWN }));
    } finally {
      restorePendingRef.current = false;
    }
  };

  const handleDeleteBackupFile = async (filename) => {
    const ok = await confirm({
      title: 'Delete Backup Archive',
      description: `Are you sure you want to delete the backup file "${filename}"?`,
      confirmLabel: 'Delete Archive',
      cancelLabel: 'Cancel',
      variant: 'danger'
    });
    if (!ok) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/backups/${filename}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Backup archive deleted.', 'success');
        fetchBackups();
      }
    } catch {
      showToast('Error deleting backup file.', 'error');
    }
  };

  // Modal and toast state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, data: null });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const toastTimerRef = useRef(null);

  const showToast = (message, type = 'success', duration = 2800) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ show: true, message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, duration);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Load saved configuration and profile on mount
  useEffect(() => {
    const loadAllSettings = async () => {
      setIsLoading(true);
      try {
        // 1. Local configuration cache
        const savedNew = localStorage.getItem('validity_new');
        const savedRenew = localStorage.getItem('validity_renew');
        const savedFiscalRaw = localStorage.getItem('fiscal_year');
        const savedFiscal = normalizeFiscalYear(savedFiscalRaw);
        if (savedFiscalRaw && savedFiscalRaw !== savedFiscal) {
          localStorage.setItem('fiscal_year', savedFiscal);
        }
        const savedFee = localStorage.getItem('franchise_fee');
        const savedPenalty = localStorage.getItem('penalty_fee');
        const savedMaint = localStorage.getItem('maintenance_mode');
        const savedExpiryDays = localStorage.getItem('expiry_warning_days');
        const savedDocs = localStorage.getItem('required_docs');
        const savedMaxUnits = localStorage.getItem('max_units_per_operator');

        const parsedSavedDocs = safeParseDocs(savedDocs, DEFAULT_REQUIRED_DOCS);

        setSystemConfig(prev => {
          const newState = {
            ...prev,
            newFranchise: savedNew !== null && savedNew !== '' && Number.isFinite(Number(savedNew)) ? parseInt(savedNew, 10) : 3,
            renewFranchise: savedRenew !== null && savedRenew !== '' && Number.isFinite(Number(savedRenew)) ? parseInt(savedRenew, 10) : 1,
            fiscalYear: savedFiscal,
            franchiseFee: savedFee !== null && savedFee !== '' && Number.isFinite(Number(savedFee)) ? parseFloat(savedFee) : 500,
            penaltyFee: savedPenalty !== null && savedPenalty !== '' && Number.isFinite(Number(savedPenalty)) ? parseFloat(savedPenalty) : 50,
            maxUnitsPerOperator: savedMaxUnits !== null && savedMaxUnits !== '' && Number.isFinite(Number(savedMaxUnits)) ? parseInt(savedMaxUnits, 10) : 2,
            maintenanceMode: savedMaint === 'true',
            expiryWarningDays: savedExpiryDays !== null && savedExpiryDays !== '' && Number.isFinite(Number(savedExpiryDays)) ? parseInt(savedExpiryDays, 10) : 30,
            requiredDocs: parsedSavedDocs
          };
          setInitialSystemConfig({
            ...newState,
            requiredDocs: [...newState.requiredDocs],
            violationPolicy: cloneViolationPolicy(newState.violationPolicy)
          });
          return newState;
        });

        // Fetch settings from backend
        try {
          const setRes = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/settings`);
          if (setRes.ok) {
            const setJson = await setRes.json();
            if (setJson.data) {
              const d = setJson.data;
              const loadedDocs = Array.isArray(d.requiredDocs)
                ? d.requiredDocs
                : safeParseDocs(savedDocs, DEFAULT_REQUIRED_DOCS);
              const normalizedFiscalYear = normalizeFiscalYear(d.fiscalYear || savedFiscal);
              const hydratedPolicy = cloneViolationPolicy(d.violationPolicy);

              setSystemConfig(prev => {
                const newState = {
                  ...prev,
                  newFranchise: d.validityNew ?? prev.newFranchise,
                  renewFranchise: d.validityRenew ?? prev.renewFranchise,
                  fiscalYear: normalizedFiscalYear,
                  franchiseFee: d.franchiseFee ?? prev.franchiseFee,
                  penaltyFee: d.penaltyRate ?? prev.penaltyFee,
                  maxUnitsPerOperator: d.maxUnitsPerOperator ?? prev.maxUnitsPerOperator,
                  maintenanceMode: Boolean(d.maintenanceMode),
                  maintenanceMessage: d.maintenanceMessage || DEFAULT_MAINTENANCE_MESSAGE,
                  expiryWarningDays: d.expiryWarningDays ?? prev.expiryWarningDays,
                  requiredDocs: [...loadedDocs],
                  violationPolicy: hydratedPolicy
                };
                setInitialSystemConfig({
                  ...newState,
                  requiredDocs: [...loadedDocs],
                  violationPolicy: cloneViolationPolicy(hydratedPolicy)
                });

                localStorage.setItem('maintenance_mode', d.maintenanceMode ? 'true' : 'false');
                localStorage.setItem('fiscal_year', normalizedFiscalYear);
                localStorage.setItem('franchise_fee', String(newState.franchiseFee ?? ''));
                localStorage.setItem('penalty_fee', String(newState.penaltyFee ?? ''));
                localStorage.setItem('validity_new', String(newState.newFranchise ?? ''));
                localStorage.setItem('validity_renew', String(newState.renewFranchise ?? ''));
                localStorage.setItem('expiry_warning_days', String(newState.expiryWarningDays ?? ''));
                localStorage.setItem('max_units_per_operator', String(newState.maxUnitsPerOperator ?? 2));
                localStorage.setItem('required_docs', JSON.stringify(loadedDocs));

                return newState;
              });

              if (Array.isArray(d.announcements)) {
                const loadedAnnouncements = d.announcements.map((item, idx) => ({
                  ...item,
                  clientKey: item?._id ? String(item._id) : `loaded-${idx}-${Date.now()}`
                }));
                setAnnouncements(loadedAnnouncements);
                setInitialAnnouncements(loadedAnnouncements.map((item) => ({ ...item })));
              }
            }
          }
        } catch (err) {
          console.error('Failed to fetch backend settings:', err);
        }

        // 2. Preferences
        const currentSavedTheme = localStorage.getItem('theme') || 'light';
        const currentSavedLang = localStorage.getItem('gtrams_lang') || language || 'en';
        setPreferences({
          theme: currentSavedTheme,
          language: currentSavedLang,
          inAppToastAlerts: localStorage.getItem('gtrams_toast_alerts') !== 'false'
        });

        // 3. Admin profile from backend
        const token = localStorage.getItem('token');
        if (token) {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const dbUser = await res.json();
            setAccountData({
              name: dbUser.name || dbUser.fullName || 'Administrator',
              email: dbUser.email || '',
              contact: dbUser.contact || '',
              profilePic: dbUser.profilePic || null
            });
            if (dbUser.profilePic) setProfilePicPreview(dbUser.profilePic);
            const activeAdminTheme = localStorage.getItem('theme') || 'light';
            setPreferences(prev => ({ ...prev, theme: activeAdminTheme }));
          }
        }
      } catch (err) {
        console.error('Failed to load admin settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllSettings();
  }, []);

  const fetchAuditLogs = async (page = 1, action = auditActionFilter, search = auditSearchQuery) => {
    setAuditLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page,
        limit: 10,
        action: action || 'All',
        search: search || ''
      });
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/audit-logs?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.data || []);
        setAuditPagination(data.pagination || {});
        setAuditPage(page);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      showToast('Cannot load audit logs right now.', 'error');
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs(1, auditActionFilter, auditSearchQuery);
    } else if (activeTab === 'backup') {
      fetchBackups();
    }
  }, [activeTab]);

  const fiscalYearOptions = useMemo(
    () => buildFiscalYearOptions(systemConfig.fiscalYear),
    [systemConfig.fiscalYear]
  );

  const isValidityDirty = useMemo(() => {
    if (!initialSystemConfig) return false;
    return (
      String(systemConfig.newFranchise) !== String(initialSystemConfig.newFranchise) ||
      String(systemConfig.renewFranchise) !== String(initialSystemConfig.renewFranchise) ||
      String(systemConfig.expiryWarningDays) !== String(initialSystemConfig.expiryWarningDays)
    );
  }, [systemConfig.newFranchise, systemConfig.renewFranchise, systemConfig.expiryWarningDays, initialSystemConfig]);

  const isFiscalDirty = useMemo(() => {
    if (!initialSystemConfig) return false;
    return (
      String(systemConfig.fiscalYear) !== String(initialSystemConfig.fiscalYear) ||
      String(systemConfig.maxUnitsPerOperator) !== String(initialSystemConfig.maxUnitsPerOperator) ||
      String(systemConfig.franchiseFee) !== String(initialSystemConfig.franchiseFee) ||
      String(systemConfig.penaltyFee) !== String(initialSystemConfig.penaltyFee)
    );
  }, [
    systemConfig.fiscalYear,
    systemConfig.maxUnitsPerOperator,
    systemConfig.franchiseFee,
    systemConfig.penaltyFee,
    initialSystemConfig
  ]);

  const isDocumentsDirty = useMemo(() => {
    if (!initialSystemConfig) return false;
    return JSON.stringify(systemConfig.requiredDocs || []) !== JSON.stringify(initialSystemConfig.requiredDocs || []);
  }, [systemConfig.requiredDocs, initialSystemConfig]);

  const isMaintenanceDirty = useMemo(() => {
    if (!initialSystemConfig) return false;
    return (
      Boolean(systemConfig.maintenanceMode) !== Boolean(initialSystemConfig.maintenanceMode) ||
      String(systemConfig.maintenanceMessage || '') !== String(initialSystemConfig.maintenanceMessage || '')
    );
  }, [systemConfig.maintenanceMode, systemConfig.maintenanceMessage, initialSystemConfig]);

  const isViolationPolicyDirty = useMemo(() => {
    if (!initialSystemConfig) return false;
    return (
      serializeViolationPolicyForCompare(systemConfig.violationPolicy) !==
      serializeViolationPolicyForCompare(initialSystemConfig.violationPolicy)
    );
  }, [systemConfig.violationPolicy, initialSystemConfig]);

  const isAnnouncementsDirty = useMemo(() => {
    if (!initialAnnouncements) return false;
    return serializeAnnouncementsForCompare(announcements) !== serializeAnnouncementsForCompare(initialAnnouncements);
  }, [announcements, initialAnnouncements]);

  const handleSystemConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSystemConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAdminContactChange = (rawValue) => {
    const val = String(rawValue ?? '');
    // Cap purely numeric mobile entries at 11 digits while keeping landlines like (042) 342-1234 and emails intact
    const nextVal = /^\d+$/.test(val) ? val.slice(0, 11) : val.slice(0, 60);
    setAccountData(prev => ({ ...prev, contact: nextVal }));
  };

  const handleAddRequirement = (e) => {
    e?.preventDefault();
    const docName = (systemConfig.newDocInput || '').trim();
    if (!docName) return;
    const currentList = Array.isArray(systemConfig.requiredDocs) ? systemConfig.requiredDocs : [];
    if (currentList.some(d => d.toLowerCase() === docName.toLowerCase())) {
      showToast('This document requirement is already in the list.', 'error');
      return;
    }
    setSystemConfig(prev => ({
      ...prev,
      requiredDocs: [...(Array.isArray(prev.requiredDocs) ? prev.requiredDocs : []), docName],
      newDocInput: ''
    }));
    showToast(`Added "${docName}" to draft list. Click "Save Checklist" to apply.`, 'info');
  };

  const handleRemoveRequirement = (docName) => {
    setSystemConfig(prev => ({
      ...prev,
      requiredDocs: (Array.isArray(prev.requiredDocs) ? prev.requiredDocs : []).filter(d => d !== docName)
    }));
    showToast(`Removed "${docName}" from draft list. Click "Save Checklist" to apply.`, 'info');
  };

  const handleResetDefaultDocs = () => {
    setSystemConfig(prev => ({
      ...prev,
      requiredDocs: [...DEFAULT_REQUIRED_DOCS]
    }));
    showToast('Reset draft document checklist to defaults. Click "Save Checklist" to apply.', 'info');
  };

  const handleViolationFieldChange = (index, field, value) => {
    setSystemConfig(prev => {
      const types = [...(prev.violationPolicy?.types || [])];
      if (!types[index]) return prev;
      if (field === 'severity') {
        const nextIsGrave = value === 'Grave';
        types[index] = { ...types[index], severity: value, isGrave: nextIsGrave };
      } else {
        types[index] = { ...types[index], [field]: value };
      }
      return {
        ...prev,
        violationPolicy: {
          ...(prev.violationPolicy || {}),
          types
        }
      };
    });
  };

  const handleToggleViolationActive = (index) => {
    setSystemConfig(prev => {
      const types = [...(prev.violationPolicy?.types || [])];
      if (types[index]) {
        types[index] = { ...types[index], isActive: !(types[index].isActive !== false) };
      }
      return {
        ...prev,
        violationPolicy: {
          ...(prev.violationPolicy || {}),
          types
        }
      };
    });
  };

  const handleToggleViolationGrave = (index) => {
    setSystemConfig(prev => {
      const types = [...(prev.violationPolicy?.types || [])];
      if (types[index]) {
        const nextGrave = !types[index].isGrave;
        types[index] = {
          ...types[index],
          isGrave: nextGrave,
          severity: nextGrave ? 'Grave' : (types[index].severity === 'Grave' ? 'High' : types[index].severity)
        };
      }
      return {
        ...prev,
        violationPolicy: {
          ...(prev.violationPolicy || {}),
          types
        }
      };
    });
  };

  const handleRemoveViolation = (index) => {
    setSystemConfig(prev => {
      const types = (prev.violationPolicy?.types || []).filter((_, i) => i !== index);
      return {
        ...prev,
        violationPolicy: {
          ...(prev.violationPolicy || {}),
          types
        }
      };
    });
    showToast('Removed violation type from draft policy. Click "Save Policy" to apply.', 'info');
  };

  const handleAddViolation = (e) => {
    e?.preventDefault();
    const name = (newViolationInput.name || '').trim();
    if (!name) {
      showToast('Please enter a violation name.', 'error');
      return;
    }
    const currentTypes = systemConfig.violationPolicy?.types || [];
    if (currentTypes.some(t => String(t.name || '').trim().toLowerCase() === name.toLowerCase())) {
      showToast('This violation type already exists in policy.', 'error');
      return;
    }

    const code = name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 30);

    if (!code) {
      showToast('Violation name must contain at least one letter or number.', 'error');
      return;
    }
    if (currentTypes.some(t => String(t.code || '').trim().toUpperCase() === code)) {
      showToast(`A violation with code "${code}" already exists in policy.`, 'error');
      return;
    }

    const rawFine = String(newViolationInput.defaultFine ?? '').trim();
    const parsedFine = rawFine === '' ? NaN : Number(rawFine);
    if (!Number.isFinite(parsedFine) || parsedFine < 0) {
      showToast('Default fine must be a valid non-negative amount (₱0 or higher).', 'error');
      return;
    }

    const rawDays = String(newViolationInput.suspensionDays ?? '').trim();
    const parsedDays = rawDays === '' ? NaN : Number(rawDays);
    if (!Number.isFinite(parsedDays) || !Number.isInteger(parsedDays) || parsedDays < 0 || parsedDays > 365) {
      showToast('Suspension days must be a whole number between 0 and 365.', 'error');
      return;
    }

    const isGrave = Boolean(newViolationInput.isGrave || newViolationInput.severity === 'Grave');
    const newEntry = {
      code,
      name,
      severity: isGrave ? 'Grave' : newViolationInput.severity,
      isGrave,
      defaultFine: parsedFine,
      suspensionDays: parsedDays,
      isActive: true
    };

    setSystemConfig(prev => ({
      ...prev,
      violationPolicy: {
        ...(prev.violationPolicy || {}),
        types: [...(prev.violationPolicy?.types || []), newEntry]
      }
    }));

    setNewViolationInput({
      name: '',
      severity: 'Medium',
      isGrave: false,
      defaultFine: '500',
      suspensionDays: '15'
    });

    showToast(`Added "${name}" to draft policy. Click "Save Policy" to apply.`, 'info');
  };

  const handleTierConfigChange = (tierName, field, value) => {
    setSystemConfig(prev => ({
      ...prev,
      violationPolicy: {
        ...(prev.violationPolicy || {}),
        tiers: {
          ...(prev.violationPolicy?.tiers || {}),
          [tierName]: {
            ...(prev.violationPolicy?.tiers?.[tierName] || {}),
            [field]: value
          }
        }
      }
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicFile(file);
      setProfilePicPreview(URL.createObjectURL(file));
    }
  };

  const handleOpenConfirm = (type, data = null) => {
    if (type === 'password') {
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        showToast('Please fill out all password fields.', 'error');
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        showToast('New passwords do not match!', 'error');
        return;
      }
      if (passwordData.newPassword.length < 6) {
        showToast('Password must be at least 6 characters long.', 'error');
        return;
      }
      if (passwordData.currentPassword === passwordData.newPassword) {
        showToast('New password must be different from current password.', 'error');
        return;
      }
    }
    setConfirmModal({ isOpen: true, type, data });
  };

  const handleSaveSection = async (sectionKey, { skipConfirm = false } = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Authentication error: You must be logged in as an administrator.', 'error', 4500);
      return;
    }

    let payload = {};
    let successMessage = 'Settings saved successfully.';

    if (sectionKey === 'validity') {
      const validityNew = systemConfig.newFranchise === '' ? NaN : Number(systemConfig.newFranchise);
      const validityRenew = systemConfig.renewFranchise === '' ? NaN : Number(systemConfig.renewFranchise);
      const expiryWarningDays = systemConfig.expiryWarningDays === '' ? NaN : Number(systemConfig.expiryWarningDays);

      if (!Number.isInteger(validityNew) || validityNew < 1 || validityNew > 20) {
        showToast('New Application Validity must be a whole number between 1 and 20 years.', 'error', 4500);
        return;
      }
      if (!Number.isInteger(validityRenew) || validityRenew < 1 || validityRenew > 20) {
        showToast('Renewal Validity must be a whole number between 1 and 20 years.', 'error', 4500);
        return;
      }
      if (!Number.isInteger(expiryWarningDays) || expiryWarningDays < 0 || expiryWarningDays > 365) {
        showToast('Expiry Warning Alert must be a whole number between 0 and 365 days.', 'error', 4500);
        return;
      }
      payload = { validityNew, validityRenew, expiryWarningDays };
      successMessage = 'Franchise validity period saved.';
    } else if (sectionKey === 'fiscal') {
      const fiscalYear = String(systemConfig.fiscalYear ?? '').trim();
      const fyNum = Number(fiscalYear);
      if (!/^\d{4}$/.test(fiscalYear) || fyNum < 2020 || fyNum > 2100) {
        showToast('Fiscal year must be a single 4-digit year (e.g., 2026).', 'error', 4500);
        return;
      }
      const maxUnitsPerOperator = systemConfig.maxUnitsPerOperator === '' ? NaN : Number(systemConfig.maxUnitsPerOperator);
      const franchiseFee = systemConfig.franchiseFee === '' ? NaN : Number(systemConfig.franchiseFee);
      const penaltyRate = systemConfig.penaltyFee === '' ? NaN : Number(systemConfig.penaltyFee);

      if (!Number.isInteger(maxUnitsPerOperator) || maxUnitsPerOperator < 1 || maxUnitsPerOperator > 50) {
        showToast('Max Units per Operator must be a whole number of at least 1.', 'error', 4500);
        return;
      }
      if (!Number.isFinite(franchiseFee) || franchiseFee < 0) {
        showToast('Franchise Application Fee must be ₱0 or higher.', 'error', 4500);
        return;
      }
      if (!Number.isFinite(penaltyRate) || penaltyRate < 0) {
        showToast('Late Renewal Penalty must be ₱0 or higher.', 'error', 4500);
        return;
      }
      // Deliberately omit hidden fare fields (baseFare, farePerKm) so backend defaults remain untouched
      payload = { fiscalYear, maxUnitsPerOperator, franchiseFee, penaltyRate };
      successMessage = 'Fiscal & municipal fee settings saved.';
    } else if (sectionKey === 'documents') {
      const docsArray = (Array.isArray(systemConfig.requiredDocs) ? systemConfig.requiredDocs : [])
        .map((d) => String(d || '').trim())
        .filter(Boolean);
      payload = { requiredDocs: docsArray };
      successMessage = 'Required document checklist saved.';
    } else if (sectionKey === 'maintenance') {
      const turningOn = Boolean(systemConfig.maintenanceMode) && !initialSystemConfig?.maintenanceMode;
      if (turningOn && !skipConfirm) {
        setConfirmModal({ isOpen: true, type: 'maintenance', data: null });
        return;
      }
      const maintenanceMessage = String(systemConfig.maintenanceMessage || '').trim() || DEFAULT_MAINTENANCE_MESSAGE;
      payload = {
        maintenanceMode: Boolean(systemConfig.maintenanceMode),
        maintenanceMessage
      };
      successMessage = systemConfig.maintenanceMode
        ? 'Maintenance Mode enabled. Non-admin portals are now restricted.'
        : 'Maintenance settings saved.';
    } else if (sectionKey === 'violationPolicy') {
      const rawTypes = Array.isArray(systemConfig.violationPolicy?.types) ? systemConfig.violationPolicy.types : [];
      const sanitizedTypes = [];
      const seenCodes = new Set();
      const seenNames = new Set();

      for (let i = 0; i < rawTypes.length; i += 1) {
        const vt = rawTypes[i];
        const name = String(vt?.name || '').trim();
        const code = String(vt?.code || '').trim().toUpperCase();
        if (!name || !code) {
          showToast(`Violation row #${i + 1} is missing a valid name or code.`, 'error', 4500);
          return;
        }
        if (seenCodes.has(code) || seenNames.has(name.toLowerCase())) {
          showToast(`Duplicate violation entry "${name}" (${code}).`, 'error', 4500);
          return;
        }
        seenCodes.add(code);
        seenNames.add(name.toLowerCase());

        const rawFine = vt.defaultFine === '' || vt.defaultFine === null || vt.defaultFine === undefined ? '' : String(vt.defaultFine).trim();
        const fine = rawFine === '' ? NaN : Number(rawFine);
        if (!Number.isFinite(fine) || fine < 0) {
          showToast(`Default fine for "${name}" must be ₱0 or higher.`, 'error', 4500);
          return;
        }

        const rawDays = vt.suspensionDays === '' || vt.suspensionDays === null || vt.suspensionDays === undefined ? '' : String(vt.suspensionDays).trim();
        const days = rawDays === '' ? NaN : Number(rawDays);
        if (!Number.isInteger(days) || days < 0 || days > 365) {
          showToast(`Suspension days for "${name}" must be a whole number (0–365).`, 'error', 4500);
          return;
        }

        const isGrave = Boolean(vt.isGrave || vt.severity === 'Grave');
        sanitizedTypes.push({
          ...(vt._id ? { _id: vt._id } : {}),
          code,
          name,
          severity: isGrave ? 'Grave' : (vt.severity || 'Medium'),
          isGrave,
          defaultFine: fine,
          suspensionDays: days,
          isActive: vt.isActive !== false
        });
      }

      const rawTierFine = systemConfig.violationPolicy?.tiers?.secondOffense?.defaultFine;
      const tierFine = rawTierFine === '' || rawTierFine === null || rawTierFine === undefined ? NaN : Number(rawTierFine);
      if (!Number.isFinite(tierFine) || tierFine < 0) {
        showToast('2nd Offense default fine must be ₱0 or higher.', 'error', 4500);
        return;
      }
      const rawTierDays = systemConfig.violationPolicy?.tiers?.secondOffense?.defaultSuspensionDays;
      const tierDays = rawTierDays === '' || rawTierDays === null || rawTierDays === undefined ? NaN : Number(rawTierDays);
      if (!Number.isInteger(tierDays) || tierDays < 0 || tierDays > 365) {
        showToast('2nd Offense suspension days must be a whole number (0–365).', 'error', 4500);
        return;
      }

      const sanitizedTiers = {
        ...DEFAULT_VIOLATION_TIERS,
        ...(systemConfig.violationPolicy?.tiers || {}),
        secondOffense: {
          ...DEFAULT_VIOLATION_TIERS.secondOffense,
          ...(systemConfig.violationPolicy?.tiers?.secondOffense || {}),
          defaultFine: tierFine,
          defaultSuspensionDays: tierDays
        }
      };

      payload = {
        violationPolicy: {
          types: sanitizedTypes,
          tiers: sanitizedTiers
        }
      };
    } else {
      return;
    }

    setSavingSection(prev => ({ ...prev, [sectionKey]: true }));
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error('Your session has expired. Please log in again.');
        if (res.status === 403) throw new Error('Access denied. Administrator privileges required.');
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Server responded with error ${res.status}`);
      }

      const resData = await res.json();
      const saved = resData.data || {};

      // Merge ONLY the saved section's fields into systemConfig & initialSystemConfig so unsaved edits in other cards are preserved!
      if (sectionKey === 'validity') {
        const patch = {
          newFranchise: saved.validityNew ?? payload.validityNew,
          renewFranchise: saved.validityRenew ?? payload.validityRenew,
          expiryWarningDays: saved.expiryWarningDays ?? payload.expiryWarningDays
        };
        setSystemConfig(prev => ({ ...prev, ...patch }));
        setInitialSystemConfig(prev => (prev ? { ...prev, ...patch } : prev));
        localStorage.setItem('validity_new', String(patch.newFranchise));
        localStorage.setItem('validity_renew', String(patch.renewFranchise));
        localStorage.setItem('expiry_warning_days', String(patch.expiryWarningDays));
      } else if (sectionKey === 'fiscal') {
        const normalizedFy = normalizeFiscalYear(saved.fiscalYear || payload.fiscalYear);
        const patch = {
          fiscalYear: normalizedFy,
          maxUnitsPerOperator: saved.maxUnitsPerOperator ?? payload.maxUnitsPerOperator,
          franchiseFee: saved.franchiseFee ?? payload.franchiseFee,
          penaltyFee: saved.penaltyRate ?? payload.penaltyRate
        };
        setSystemConfig(prev => ({ ...prev, ...patch }));
        setInitialSystemConfig(prev => (prev ? { ...prev, ...patch } : prev));
        localStorage.setItem('fiscal_year', normalizedFy);
        localStorage.setItem('max_units_per_operator', String(patch.maxUnitsPerOperator));
        localStorage.setItem('franchise_fee', String(patch.franchiseFee));
        localStorage.setItem('penalty_fee', String(patch.penaltyFee));
      } else if (sectionKey === 'documents') {
        const savedDocsList = Array.isArray(saved.requiredDocs) ? saved.requiredDocs : payload.requiredDocs;
        setSystemConfig(prev => ({ ...prev, requiredDocs: [...savedDocsList] }));
        setInitialSystemConfig(prev => (prev ? { ...prev, requiredDocs: [...savedDocsList] } : prev));
        localStorage.setItem('required_docs', JSON.stringify(savedDocsList));
      } else if (sectionKey === 'maintenance') {
        const patch = {
          maintenanceMode: Boolean(saved.maintenanceMode ?? payload.maintenanceMode),
          maintenanceMessage: saved.maintenanceMessage || payload.maintenanceMessage || DEFAULT_MAINTENANCE_MESSAGE
        };
        setSystemConfig(prev => ({ ...prev, ...patch }));
        setInitialSystemConfig(prev => (prev ? { ...prev, ...patch } : prev));
        localStorage.setItem('maintenance_mode', patch.maintenanceMode ? 'true' : 'false');
      } else if (sectionKey === 'violationPolicy') {
        const savedPolicy = cloneViolationPolicy(saved.violationPolicy || payload.violationPolicy);
        setSystemConfig(prev => ({ ...prev, violationPolicy: savedPolicy }));
        setInitialSystemConfig(prev => (prev ? { ...prev, violationPolicy: cloneViolationPolicy(savedPolicy) } : prev));
        successMessage = `Violation policy saved (Policy v${savedPolicy.policyVersion}).`;
      }

      window.dispatchEvent(new Event('gtrams_settings_updated'));
      showToast(successMessage, 'success');
    } catch (err) {
      console.error(`Error saving ${sectionKey} settings:`, err);
      const isFailedFetch = err?.name === 'TypeError' || String(err?.message || '').toLowerCase().includes('failed to fetch');
      const msg = isFailedFetch
        ? 'Cannot connect to backend server. It may still be deploying or waking up. Please try again in a few seconds.'
        : (err.message || 'Error saving settings.');
      showToast(msg, 'error', 4500);
    } finally {
      setSavingSection(prev => ({ ...prev, [sectionKey]: false }));
    }
  };

  const executeSave = async () => {
    setIsProcessing(true);
    const { type } = confirmModal;

    // Immediately close modal so it doesn't get stuck on screen
    setConfirmModal({ isOpen: false, type: null, data: null });

    try {
      if (type === 'maintenance') {
        await handleSaveSection('maintenance', { skipConfirm: true });
      }
      else if (type === 'account') {
        const formData = new FormData();
        formData.append('name', accountData.name);
        formData.append('contact', accountData.contact);
        if (profilePicFile) formData.append('profilePic', profilePicFile);

        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/profile`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        if (res.ok) {
          const updated = await res.json();
          localStorage.setItem('user', JSON.stringify(updated));
          localStorage.setItem('name', updated.name || accountData.name);
          showToast('Admin account details updated successfully!', 'success');
        } else {
          const errData = await res.json().catch(() => ({}));
          showToast(errData.message || 'Failed to update account details.', 'error');
        }
      } 
      else if (type === 'password') {
        const reqToken = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/change-password`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${reqToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            oldPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
          })
        });

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (!reqToken || localStorage.getItem('token') !== reqToken) {
            return;
          }
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
          if (data?.token) {
            localStorage.setItem('token', data.token);
            window.dispatchEvent(new Event('gtrams-auth-changed'));
            window.dispatchEvent(new Event('gtrams-auth-change'));
            showToast('Admin password changed successfully! Your session has been refreshed.', 'success');
          } else {
            await unsubscribeFromPush().catch(() => {});
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('user');
            localStorage.removeItem('userId');
            localStorage.removeItem('name');
            window.dispatchEvent(new Event('gtrams-auth-changed'));
            window.dispatchEvent(new Event('gtrams-auth-change'));
            navigate('/login');
          }
        } else {
          if (!reqToken || localStorage.getItem('token') !== reqToken) {
            return;
          }
          const errData = await res.json().catch(() => ({}));
          showToast(errData.message || 'Failed to change password.', 'error');
        }
      }
    } catch (err) {
      console.error('Save error:', err);
      const isFailedFetch = err?.name === 'TypeError' || String(err?.message || '').toLowerCase().includes('failed to fetch');
      const msg = isFailedFetch
        ? 'Cannot connect to backend server. It may still be deploying or waking up. Please try again in a few seconds.'
        : (err.message || 'Error saving settings.');
      showToast(msg, 'error', 4500);
    } finally {
      setIsProcessing(false);
      setConfirmModal({ isOpen: false, type: null, data: null });
    }
  };

  const handleThemeToggle = (newTheme) => {
    setTheme(newTheme);
    setPreferences(prev => ({ ...prev, theme: newTheme }));
    showToast(newTheme === 'dark' ? 'Dark Mode activated' : 'Light Mode activated', 'success');
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setPreferences(prev => ({ ...prev, language: newLang }));
    localStorage.setItem('gtrams_lang', newLang);
    showToast(newLang === 'fil' ? 'Inilapat ang wikang Filipino' : 'Language set to English', 'success');
  };

  const handleToastPrefToggle = () => {
    const nextVal = !preferences.inAppToastAlerts;
    setPreferences(prev => ({ ...prev, inAppToastAlerts: nextVal }));
    localStorage.setItem('gtrams_toast_alerts', String(nextVal));
    showToast(nextVal ? 'Toast notifications enabled' : 'Toast notifications silenced', 'success');
  };

  const handleUpdateAnnouncement = (idx, field, value) => {
    setAnnouncements(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleDeleteAnnouncement = (idx) => {
    setAnnouncements(prev => prev.filter((_, i) => i !== idx));
  };

  const handleClearAllAnnouncements = () => {
    setAnnouncements([]);
    showToast('All announcements cleared from draft. Click "Publish to Homepage" to save.', 'info');
  };

  const handleAddAnnouncement = () => {
    const title = (newAnnouncement.title || '').trim();
    const desc = (newAnnouncement.desc || '').trim();
    if (!title) {
      showToast('Announcement title is required.', 'error');
      return;
    }
    if (!desc) {
      showToast('Announcement description is required.', 'error');
      return;
    }
    setAnnouncements(prev => [
      ...prev,
      {
        clientKey: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title,
        desc,
        type: newAnnouncement.type || 'info',
        date: (newAnnouncement.date || '').trim() || 'General Advisory',
        isActive: true
      }
    ]);
    setNewAnnouncement({
      title: '',
      desc: '',
      type: 'info',
      date: 'General Advisory'
    });
    showToast('New announcement drafted. Remember to click "Publish to Homepage".', 'info');
  };

  const handleSaveAnnouncements = async () => {
    const OBJECT_ID_HEX_RE = /^[a-f0-9]{24}$/i;
    const sanitized = announcements.map((item) => {
      const clean = {
        title: String(item.title || '').trim(),
        desc: String(item.desc || '').trim(),
        type: ['alert', 'info', 'event'].includes(item.type) ? item.type : 'info',
        date: String(item.date || 'General Advisory').trim() || 'General Advisory',
        isActive: item.isActive !== false
      };
      const rawId = item._id !== undefined && item._id !== null ? String(item._id).trim() : '';
      if (OBJECT_ID_HEX_RE.test(rawId)) {
        clean._id = rawId;
      }
      return clean;
    });

    const invalidIdx = sanitized.findIndex((a) => !a.title || !a.desc);
    if (invalidIdx !== -1) {
      showToast(`Announcement #${invalidIdx + 1} requires both a title and description.`, 'error');
      return;
    }

    setIsSavingAnnouncements(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ announcements: sanitized })
      });
      if (res.ok) {
        const savedJson = await res.json().catch(() => ({}));
        const persisted = Array.isArray(savedJson.data?.announcements)
          ? savedJson.data.announcements
          : sanitized;
        const normalizedSaved = persisted.map((item, idx) => ({
          ...item,
          clientKey: item?._id ? String(item._id) : `saved-${idx}-${Date.now()}`
        }));
        setAnnouncements(normalizedSaved);
        setInitialAnnouncements(normalizedSaved.map((item) => ({ ...item })));
        window.dispatchEvent(new Event('gtrams_settings_updated'));
        showToast(
          persisted.length === 0
            ? 'All homepage announcements cleared and published.'
            : `Published ${persisted.length} homepage announcement${persisted.length === 1 ? '' : 's'} successfully!`,
          'success'
        );
      } else {
        const errJson = await res.json().catch(() => ({}));
        showToast(errJson.message || 'Failed to publish announcements.', 'error');
      }
    } catch (err) {
      showToast('Network error saving announcements.', 'error');
    } finally {
      setIsSavingAnnouncements(false);
    }
  };

  const inputClasses = "w-full bg-white dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] transition-colors";

  return (
    <MainLayout>
      {/* Floating Toast Notification (never suppress error alerts) */}
      {toast.show && (preferences.inAppToastAlerts || toast.type === 'error') && (
        <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none">
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xl rounded-lg px-4 py-3 flex items-center gap-3 max-w-sm">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
              toast.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400'
                : toast.type === 'info'
                ? 'bg-[#F6F5F3] dark:bg-[#2E2A27] border-[#E4E1DC] dark:border-[#3D3834] text-[#1F1D1B] dark:text-[#F6F5F3]'
                : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400'
            }`}>
              {toast.type === 'error' ? (
                <AlertCircle size={14} />
              ) : toast.type === 'info' ? (
                <Info size={14} />
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

      {/* Page Header */}
      <div className="mb-6">
        <PageHeader 
          title="Settings"
          subtitle="Manage your account, preferences, and system configurations."
        />
      </div>

      {isLoading ? (
        <SettingsSkeleton />
      ) : (
        <div className="space-y-6 w-full">
          {/* TAB NAVIGATION PILLS */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg w-full sm:w-fit">
            {isSystemAdmin && (
              <button
                onClick={() => setActiveTab('system')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'system'
                    ? 'bg-white dark:bg-[#1C1917] text-[#9E2A2B] dark:text-[#D4AF37] shadow-sm border border-[#E4E1DC] dark:border-[#2E2A27]'
                    : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
                }`}
              >
                <Sliders size={15} />
                <span>System & Platform</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('account')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'account'
                  ? 'bg-white dark:bg-[#1C1917] text-[#9E2A2B] dark:text-[#D4AF37] shadow-sm border border-[#E4E1DC] dark:border-[#2E2A27]'
                  : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
              }`}
            >
              <User size={15} />
              <span>Account & Security</span>
            </button>

            <button
              onClick={() => setActiveTab('preferences')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'preferences'
                  ? 'bg-white dark:bg-[#1C1917] text-[#9E2A2B] dark:text-[#D4AF37] shadow-sm border border-[#E4E1DC] dark:border-[#2E2A27]'
                  : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
              }`}
            >
              <Globe size={15} />
              <span>Preferences & Appearance</span>
            </button>

            {isSystemAdmin && (
              <button
                onClick={() => { setActiveTab('backup'); fetchBackups(); }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'backup'
                    ? 'bg-white dark:bg-[#1C1917] text-[#9E2A2B] dark:text-[#D4AF37] shadow-sm border border-[#E4E1DC] dark:border-[#2E2A27]'
                    : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
                }`}
              >
                <Database size={15} />
                <span>Database Backup & Recovery</span>
              </button>
            )}
          </div>

          {/* TAB 1: SYSTEM & PLATFORM CONFIGURATION */}
          {activeTab === 'system' && isSystemAdmin && (
            <div className="space-y-6">
              {/* 1. Franchise Rules & Validity */}
              <div className="bg-white dark:bg-[#1C1917] p-5 sm:p-6 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-sm transition-colors">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-5 pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 text-[#9E2A2B] dark:text-[#D4AF37] rounded-lg">
                      <Clock size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">Franchise Validity Period</h2>
                      <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">Configure validity duration for first-time and renewed permits</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isValidityDirty && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
                        Unsaved changes
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSaveSection('validity')}
                      disabled={savingSection.validity}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#9E2A2B] hover:bg-[#7A1B22] text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {savingSection.validity ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      <span>{savingSection.validity ? 'Saving...' : 'Save Validity'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider mb-1.5">
                      New Application Validity
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="newFranchise"
                        min="1"
                        max="20"
                        disabled={savingSection.validity}
                        value={systemConfig.newFranchise}
                        onChange={handleSystemConfigChange}
                        className={inputClasses}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#6B6761] dark:text-[#A8A29E] font-bold">Years</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider mb-1.5">
                      Renewal Validity
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="renewFranchise"
                        min="1"
                        max="20"
                        disabled={savingSection.validity}
                        value={systemConfig.renewFranchise}
                        onChange={handleSystemConfigChange}
                        className={inputClasses}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#6B6761] dark:text-[#A8A29E] font-bold">Years</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider mb-1.5">
                      Expiry Warning Alert
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="expiryWarningDays"
                        min="0"
                        max="365"
                        disabled={savingSection.validity}
                        value={systemConfig.expiryWarningDays}
                        onChange={handleSystemConfigChange}
                        className={inputClasses}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#6B6761] dark:text-[#A8A29E] font-bold">Days before</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Fiscal & Fare Settings */}
              <div className="bg-white dark:bg-[#1C1917] p-5 sm:p-6 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-sm transition-colors">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-5 pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800/60">
                      <Wallet size={18} className="text-amber-700 dark:text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">Fiscal & Municipal Fees</h2>
                      <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">Establish fiscal year, unit cap, franchise fees, and late renewal penalties</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isFiscalDirty && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
                        Unsaved changes
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSaveSection('fiscal')}
                      disabled={savingSection.fiscal}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#9E2A2B] hover:bg-[#7A1B22] text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {savingSection.fiscal ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      <span>{savingSection.fiscal ? 'Saving...' : 'Save Fees'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="settings-fiscal-year" className="block text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider mb-1.5">
                      Fiscal Year
                    </label>
                    <div className="relative">
                      <CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6761] dark:text-[#A8A29E] pointer-events-none" />
                      <select
                        id="settings-fiscal-year"
                        name="fiscalYear"
                        disabled={savingSection.fiscal}
                        value={systemConfig.fiscalYear}
                        onChange={handleSystemConfigChange}
                        className={`${inputClasses} pl-9 font-mono tabular-nums cursor-pointer`}
                      >
                        {fiscalYearOptions.map((yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider mb-1.5">
                      Max Units / Operator
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="50"
                        name="maxUnitsPerOperator"
                        disabled={savingSection.fiscal}
                        value={systemConfig.maxUnitsPerOperator}
                        onChange={handleSystemConfigChange}
                        className={inputClasses}
                      />
                    </div>
                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-1">Default is 2 units</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider mb-1.5">
                      Franchise Application Fee
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E]">₱</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        name="franchiseFee"
                        disabled={savingSection.fiscal}
                        value={systemConfig.franchiseFee}
                        onChange={handleSystemConfigChange}
                        className={`${inputClasses} pl-7 font-mono tabular-nums`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider mb-1.5">
                      Late Renewal Penalty
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E]">₱</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        name="penaltyFee"
                        disabled={savingSection.fiscal}
                        value={systemConfig.penaltyFee}
                        onChange={handleSystemConfigChange}
                        className={`${inputClasses} pl-7 font-mono tabular-nums`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Requirement Checklist Builder & 4. Maintenance Mode */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1C1917] p-5 sm:p-6 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-sm transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between flex-wrap gap-2.5 mb-4 pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                      <div className="flex items-center gap-2.5">
                        <FileCheck size={18} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                        <h2 className="text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">Required Documents</h2>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {isDocumentsDirty && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
                            Unsaved changes
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={handleResetDefaultDocs}
                          disabled={savingSection.documents}
                          className="text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] hover:text-[#9E2A2B] dark:hover:text-[#D4AF37] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Reset Defaults
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveSection('documents')}
                          disabled={savingSection.documents}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#9E2A2B] hover:bg-[#7A1B22] text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {savingSection.documents ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                          <span>{savingSection.documents ? 'Saving...' : 'Save Checklist'}</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mb-4">Manage the list of documents required from operators when submitting franchise applications:</p>

                    {/* DYNAMIC DOCUMENT LIST */}
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {(Array.isArray(systemConfig.requiredDocs) ? systemConfig.requiredDocs : []).map((doc, idx) => (
                        <div key={`${doc}-${idx}`} className="flex items-center justify-between p-2.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] transition-colors">
                          <span className="text-xs font-medium text-[#1F1D1B] dark:text-[#F6F5F3] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#9E2A2B] dark:bg-[#D4AF37]" />
                            {doc}
                          </span>
                          <button
                            type="button"
                            disabled={savingSection.documents}
                            onClick={() => handleRemoveRequirement(doc)}
                            className="text-[#6B6761] dark:text-[#A8A29E] hover:text-red-600 p-1 rounded transition-colors cursor-pointer disabled:opacity-50"
                            title="Remove document requirement"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      {(Array.isArray(systemConfig.requiredDocs) ? systemConfig.requiredDocs : []).length === 0 && (
                        <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] italic py-2 text-center">No document requirements defined. Add one below.</p>
                      )}
                    </div>
                  </div>

                  {/* ADD NEW DOCUMENT INPUT */}
                  <div className="mt-4 pt-4 border-t border-[#E4E1DC] dark:border-[#2E2A27] flex gap-2">
                    <input
                      type="text"
                      name="newDocInput"
                      disabled={savingSection.documents}
                      value={systemConfig.newDocInput || ''}
                      onChange={handleSystemConfigChange}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddRequirement(); } }}
                      placeholder="e.g. Medical Certificate, Emission Test"
                      className={`${inputClasses} py-1.5 text-xs`}
                    />
                    <button
                      type="button"
                      disabled={savingSection.documents}
                      onClick={handleAddRequirement}
                      className="px-3.5 py-1.5 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white rounded-lg text-xs font-medium shrink-0 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1C1917] p-5 sm:p-6 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-sm flex flex-col justify-between transition-colors">
                  <div>
                    <div className="flex items-center justify-between flex-wrap gap-2.5 mb-4 pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                      <div className="flex items-center gap-2.5">
                        <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
                        <h2 className="text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">Maintenance Mode</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        {isMaintenanceDirty && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
                            Unsaved changes
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleSaveSection('maintenance')}
                          disabled={savingSection.maintenance}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#9E2A2B] hover:bg-[#7A1B22] text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {savingSection.maintenance ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                          <span>{savingSection.maintenance ? 'Saving...' : 'Save Maintenance'}</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] leading-relaxed mb-4">
                      Enabling Maintenance Mode prevents operators from submitting new applications while system maintenance or database migration is in progress.
                    </p>

                    <div className="mb-4">
                      <label htmlFor="settings-maintenance-message" className="block text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider mb-1.5">
                        Maintenance Advisory Message
                      </label>
                      <textarea
                        id="settings-maintenance-message"
                        name="maintenanceMessage"
                        rows={2}
                        disabled={savingSection.maintenance}
                        value={systemConfig.maintenanceMessage || ''}
                        onChange={handleSystemConfigChange}
                        placeholder={DEFAULT_MAINTENANCE_MESSAGE}
                        className={`${inputClasses} text-xs`}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">System Access Status</p>
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                        {systemConfig.maintenanceMode ? 'Locked for non-admin users' : 'Live & Accessible to all operators'}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={savingSection.maintenance}
                      onClick={() => setSystemConfig(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                      role="switch"
                      aria-checked={Boolean(systemConfig.maintenanceMode)}
                      aria-label="Toggle Maintenance Mode"
                      className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                        systemConfig.maintenanceMode ? 'bg-[#9E2A2B]' : 'bg-[#E4E1DC] dark:bg-[#2E2A27]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                          systemConfig.maintenanceMode ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. PROGRESSIVE VIOLATION & PENALTY POLICY CONFIGURATION */}
              <div className="bg-white dark:bg-[#1C1917] p-5 sm:p-6 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-sm transition-colors space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-[#E4E1DC] dark:border-[#2E2A27] flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 text-[#9E2A2B] dark:text-[#D4AF37] rounded-lg">
                      <ShieldAlert size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                        Progressive Violation & Penalty Policy
                      </h2>
                      <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
                        3-Tier Progressive Discipline Engine & Municipal Violation Matrix
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#D4AF37] border border-[#E4E1DC] dark:border-[#2E2A27]">
                      <ShieldCheck size={13} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                      Policy v{systemConfig.violationPolicy?.policyVersion || 1}
                    </span>
                    {isViolationPolicyDirty && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
                        Unsaved changes
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSaveSection('violationPolicy')}
                      disabled={savingSection.violationPolicy}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#9E2A2B] hover:bg-[#7A1B22] text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {savingSection.violationPolicy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      <span>{savingSection.violationPolicy ? 'Saving...' : 'Save Policy'}</span>
                    </button>
                  </div>
                </div>

                {/* Non-Retroactive Rate Policy Banner */}
                <div className="p-3.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-start gap-2.5 text-xs">
                  <Info size={16} className="text-[#9E2A2B] dark:text-[#D4AF37] shrink-0 mt-0.5" />
                  <p className="text-[#1F1D1B] dark:text-[#EAE7E1] leading-relaxed">
                    <span className="font-semibold">Non-Retroactive Rate Policy:</span> Changes to violation fines, suspension durations, or severity classifications automatically increment the policy version, log an exact audit diff, and apply <span className="font-semibold">only to future citations</span> — historical violations remain permanently locked at the rate active when recorded.
                  </p>
                </div>

                {/* 3-Tier Policy Architecture Cards */}
                <div>
                  <label className="block text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider mb-3">
                    Progressive Sanction Engine Rules
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* 1st Offense */}
                    <div className="p-3.5 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Tier 1</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                            1st Offense
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#1F1D1B] dark:text-[#F6F5F3] mb-1">Official Warning & Fine</p>
                        <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] leading-relaxed">
                          Resulting Status: <span className="font-semibold text-amber-700 dark:text-amber-400">Active - Under Warning</span>. Unit remains authorized while violation fine and notice are recorded.
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-amber-200/60 dark:border-amber-900/40 text-[10px] font-medium text-amber-800 dark:text-amber-300">
                        Sanction: Formal Warning + Policy Fine
                      </div>
                    </div>

                    {/* 2nd Offense */}
                    <div className="p-3.5 rounded-lg border border-orange-200 dark:border-orange-900/40 bg-orange-50/50 dark:bg-orange-950/20 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wider">Tier 2</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-200">
                            2nd Offense
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#1F1D1B] dark:text-[#F6F5F3] mb-1">Fine & Suspension</p>
                        <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] leading-relaxed mb-2.5">
                          Resulting Status: <span className="font-semibold text-orange-700 dark:text-orange-400">Suspended</span>. Operations temporarily barred.
                        </p>

                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <label className="text-[10px] font-semibold text-[#6B6761] dark:text-[#A8A29E]">Fallback Fine (₱)</label>
                            <input
                              type="number"
                              min="0"
                              disabled={savingSection.violationPolicy}
                              value={systemConfig.violationPolicy?.tiers?.secondOffense?.defaultFine ?? 500}
                              onChange={(e) => handleTierConfigChange('secondOffense', 'defaultFine', e.target.value)}
                              className="w-full bg-white dark:bg-[#1C1917] border border-orange-200 dark:border-orange-900/60 rounded px-2 py-1 text-xs font-mono font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-[#6B6761] dark:text-[#A8A29E]">Fallback Days</label>
                            <input
                              type="number"
                              min="0"
                              max="365"
                              disabled={savingSection.violationPolicy}
                              value={systemConfig.violationPolicy?.tiers?.secondOffense?.defaultSuspensionDays ?? 15}
                              onChange={(e) => handleTierConfigChange('secondOffense', 'defaultSuspensionDays', e.target.value)}
                              className="w-full bg-white dark:bg-[#1C1917] border border-orange-200 dark:border-orange-900/60 rounded px-2 py-1 text-xs font-mono font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] outline-none"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-2 border-t border-orange-200/60 dark:border-orange-900/40 text-[10px] font-medium text-orange-800 dark:text-orange-300">
                        Sanction: Temporary Suspension
                      </div>
                    </div>

                    {/* 3rd Offense */}
                    <div className="p-3.5 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-red-800 dark:text-red-300 uppercase tracking-wider">Tier 3</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200">
                            3rd Offense
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#1F1D1B] dark:text-[#F6F5F3] mb-1">Franchise Revocation</p>
                        <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] leading-relaxed">
                          Resulting Status: <span className="font-semibold text-red-700 dark:text-red-400">Revoked</span>. Permanent cancellation of permit; assigned body number returned to municipal roster.
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-red-200/60 dark:border-red-900/40 text-[10px] font-medium text-red-800 dark:text-red-300">
                        Sanction: Permanent Cancellation
                      </div>
                    </div>

                    {/* Grave Violation */}
                    <div className="p-3.5 rounded-lg border border-rose-300 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wider">Direct Rule</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-200 dark:bg-rose-900/80 text-rose-900 dark:text-rose-100">
                            Grave Violation
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#1F1D1B] dark:text-[#F6F5F3] mb-1">Direct Revocation</p>
                        <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] leading-relaxed">
                          Resulting Status: <span className="font-semibold text-rose-700 dark:text-rose-400">Revoked</span>. Bypasses 1st and 2nd offense tiers directly due to critical severity (Colorum, endangerment).
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-rose-300/60 dark:border-rose-900/60 text-[10px] font-medium text-rose-900 dark:text-rose-200">
                        Sanction: Instant Revocation
                      </div>
                    </div>
                  </div>
                </div>

                {/* Configured Violation Types Table (Inline Editable) */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">
                      Municipal Violation Types & Classifications ({systemConfig.violationPolicy?.types?.length || 0})
                    </label>
                    <span className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
                      Edit fines, suspension days, severity, or status inline then click Save Policy
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                    <table className="w-full text-left border-collapse min-w-[760px] text-xs">
                      <thead>
                        <tr className="bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider font-semibold">
                          <th className="p-3 pl-4">Violation Name</th>
                          <th className="p-3">Severity</th>
                          <th className="p-3 text-center">Direct Revoke (Grave)</th>
                          <th className="p-3 text-right">Default Fine (₱)</th>
                          <th className="p-3 text-center">Suspension (Days)</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-center pr-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27]">
                        {(systemConfig.violationPolicy?.types || []).map((vt, index) => (
                          <tr key={vt.code || index} className="hover:bg-[#F6F5F3]/50 dark:hover:bg-[#14110F]/50 transition-colors">
                            <td className="p-3 pl-4 font-medium text-[#1F1D1B] dark:text-[#F6F5F3]">
                              <p className="font-semibold">{vt.name}</p>
                              <span className="text-[10px] font-mono text-[#6B6761] dark:text-[#A8A29E]">{vt.code}</span>
                            </td>
                            <td className="p-3">
                              <select
                                aria-label={`Severity for ${vt.name}`}
                                disabled={savingSection.violationPolicy}
                                value={vt.isGrave ? 'Grave' : (vt.severity || 'Medium')}
                                onChange={(e) => handleViolationFieldChange(index, 'severity', e.target.value)}
                                className={`text-[11px] font-semibold rounded px-2 py-1 border outline-none cursor-pointer ${
                                  (vt.isGrave || vt.severity === 'Grave')
                                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-900/60'
                                    : vt.severity === 'High'
                                      ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/40'
                                      : vt.severity === 'Medium'
                                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40'
                                        : 'bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#EAE7E1] border-[#E4E1DC] dark:border-[#2E2A27]'
                                }`}
                              >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Grave">Grave</option>
                              </select>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                disabled={savingSection.violationPolicy}
                                onClick={() => handleToggleViolationGrave(index)}
                                className={`text-[10px] font-semibold px-2 py-1 rounded border transition-colors cursor-pointer disabled:opacity-50 ${
                                  vt.isGrave
                                    ? 'bg-rose-600 text-white border-rose-600'
                                    : 'bg-white dark:bg-[#1C1917] text-[#6B6761] dark:text-[#A8A29E] border-[#E4E1DC] dark:border-[#2E2A27] hover:border-rose-400'
                                }`}
                                title="Click to toggle Grave classification"
                              >
                                {vt.isGrave ? 'Yes (Direct Revocation)' : 'No (3-Tier)'}
                              </button>
                            </td>
                            <td className="p-3 text-right">
                              <div className="inline-flex items-center relative">
                                <span className="absolute left-2 text-[11px] font-semibold text-[#6B6761] dark:text-[#A8A29E] pointer-events-none">₱</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="50"
                                  aria-label={`Default fine for ${vt.name}`}
                                  disabled={savingSection.violationPolicy}
                                  value={vt.defaultFine ?? 0}
                                  onChange={(e) => handleViolationFieldChange(index, 'defaultFine', e.target.value)}
                                  className="w-24 bg-white dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded pl-5 pr-2 py-1 text-right font-mono tabular-nums text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37]"
                                />
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <div className="inline-flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="365"
                                  aria-label={`Suspension days for ${vt.name}`}
                                  disabled={savingSection.violationPolicy}
                                  value={vt.suspensionDays ?? 0}
                                  onChange={(e) => handleViolationFieldChange(index, 'suspensionDays', e.target.value)}
                                  className="w-16 bg-white dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded px-2 py-1 text-center font-mono tabular-nums text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37]"
                                />
                                <span className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">d</span>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                disabled={savingSection.violationPolicy}
                                onClick={() => handleToggleViolationActive(index)}
                                className={`text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer disabled:opacity-50 ${
                                  vt.isActive !== false
                                    ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                                    : 'bg-[#F6F5F3] dark:bg-[#14110F] text-[#6B6761] dark:text-[#A8A29E] border border-[#E4E1DC] dark:border-[#2E2A27]'
                                }`}
                              >
                                {vt.isActive !== false ? 'Active' : 'Inactive'}
                              </button>
                            </td>
                            <td className="p-3 text-center pr-4">
                              <button
                                type="button"
                                disabled={savingSection.violationPolicy}
                                onClick={() => handleRemoveViolation(index)}
                                className="p-1 rounded text-red-600 hover:text-red-800 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer disabled:opacity-50"
                                title="Remove violation from policy"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {(systemConfig.violationPolicy?.types || []).length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-6 text-center text-xs text-[#6B6761] dark:text-[#A8A29E] italic">
                              No violation types configured. Add a municipal violation type below.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Add New Violation Type Form */}
                  <div className="mt-4 p-4 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27]">
                    <p className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] mb-3 flex items-center gap-1.5">
                      <Plus size={14} className="text-[#9E2A2B] dark:text-[#D4AF37]" /> Add New Municipal Violation Type
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
                      <div className="lg:col-span-2">
                        <label className="block text-[10px] font-semibold text-[#6B6761] dark:text-[#A8A29E] mb-1">Violation Name / Description</label>
                        <input
                          type="text"
                          disabled={savingSection.violationPolicy}
                          placeholder="e.g. Failure to convey student discount"
                          value={newViolationInput.name}
                          onChange={(e) => setNewViolationInput(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-2.5 py-1.5 text-xs text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-[#6B6761] dark:text-[#A8A29E] mb-1">Severity Level</label>
                        <select
                          disabled={savingSection.violationPolicy}
                          value={newViolationInput.severity}
                          onChange={(e) => {
                            const nextSev = e.target.value;
                            setNewViolationInput(prev => ({
                              ...prev,
                              severity: nextSev,
                              isGrave: nextSev === 'Grave'
                            }));
                          }}
                          className="w-full bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-2 py-1.5 text-xs text-[#1F1D1B] dark:text-[#F6F5F3] outline-none"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Grave">Grave (Direct Revoke)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-[#6B6761] dark:text-[#A8A29E] mb-1">Default Fine (₱)</label>
                        <input
                          type="number"
                          min="0"
                          disabled={savingSection.violationPolicy}
                          value={newViolationInput.defaultFine}
                          onChange={(e) => setNewViolationInput(prev => ({ ...prev, defaultFine: e.target.value }))}
                          className="w-full bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-2 py-1.5 text-xs font-mono tabular-nums text-[#1F1D1B] dark:text-[#F6F5F3] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-[#6B6761] dark:text-[#A8A29E] mb-1">Suspension Days</label>
                        <input
                          type="number"
                          min="0"
                          max="365"
                          disabled={savingSection.violationPolicy}
                          value={newViolationInput.suspensionDays}
                          onChange={(e) => setNewViolationInput(prev => ({ ...prev, suspensionDays: e.target.value }))}
                          className="w-full bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-2 py-1.5 text-xs font-mono tabular-nums text-[#1F1D1B] dark:text-[#F6F5F3] outline-none"
                        />
                      </div>
                      <div>
                        <button
                          type="button"
                          disabled={savingSection.violationPolicy}
                          onClick={handleAddViolation}
                          className="w-full bg-[#9E2A2B] hover:bg-[#7A1B22] text-white py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Plus size={14} /> Add Violation
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. HOMEPAGE BULLETIN BOARD ANNOUNCEMENTS */}
              <div className="bg-white dark:bg-[#1C1917] p-5 sm:p-6 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-sm transition-colors space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-[#E4E1DC] dark:border-[#2E2A27] flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 text-[#9E2A2B] dark:text-[#D4AF37] rounded-lg">
                      <Megaphone size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                        Homepage Announcements ({announcements.length})
                      </h2>
                      <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
                        Manage public advisories displayed on the G-TRAMS Municipal Bulletin Board
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {isAnnouncementsDirty && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
                        Unsaved changes
                      </span>
                    )}
                    {announcements.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllAnnouncements}
                        disabled={isSavingAnnouncements}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-950/60 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Clear All
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveAnnouncements}
                      disabled={isSavingAnnouncements}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#9E2A2B] hover:bg-[#7A1B22] text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSavingAnnouncements ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      <span>{isSavingAnnouncements ? 'Publishing...' : 'Publish to Homepage'}</span>
                    </button>
                  </div>
                </div>

                {/* Active / Drafted Announcements List */}
                {announcements.length === 0 ? (
                  <div className="p-5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-center text-xs text-[#6B6761] dark:text-[#A8A29E]">
                    No announcements drafted. Add an announcement below or click <strong>Publish to Homepage</strong> to clear the bulletin board.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {announcements.map((item, idx) => (
                      <div
                        key={item.clientKey || item._id || idx}
                        className="p-3.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] space-y-2.5"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                          <div className="sm:col-span-5">
                            <label className="block text-[10px] font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase mb-1">
                              Title
                            </label>
                            <input
                              type="text"
                              value={item.title || ''}
                              disabled={isSavingAnnouncements}
                              onChange={(e) => handleUpdateAnnouncement(idx, 'title', e.target.value)}
                              className={inputClasses}
                              placeholder="Announcement title"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <label className="block text-[10px] font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase mb-1">
                              Category
                            </label>
                            <select
                              value={item.type || 'info'}
                              disabled={isSavingAnnouncements}
                              onChange={(e) => handleUpdateAnnouncement(idx, 'type', e.target.value)}
                              className={inputClasses}
                            >
                              <option value="info">Info</option>
                              <option value="alert">Alert</option>
                              <option value="event">Event</option>
                            </select>
                          </div>
                          <div className="sm:col-span-3">
                            <label className="block text-[10px] font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase mb-1">
                              Date / Tag
                            </label>
                            <input
                              type="text"
                              value={item.date || ''}
                              disabled={isSavingAnnouncements}
                              onChange={(e) => handleUpdateAnnouncement(idx, 'date', e.target.value)}
                              className={inputClasses}
                              placeholder="General Advisory"
                            />
                          </div>
                          <div className="sm:col-span-1 flex items-end justify-end sm:pt-4 gap-1">
                            <button
                              type="button"
                              disabled={isSavingAnnouncements}
                              onClick={() => handleDeleteAnnouncement(idx)}
                              className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-200 dark:hover:border-red-900/50 transition-colors cursor-pointer disabled:opacity-50"
                              title="Remove announcement"
                              aria-label="Remove announcement"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase mb-1">
                            Description
                          </label>
                          <textarea
                            rows={2}
                            disabled={isSavingAnnouncements}
                            value={item.desc || ''}
                            onChange={(e) => handleUpdateAnnouncement(idx, 'desc', e.target.value)}
                            className={inputClasses}
                            placeholder="Write official advisory message..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Draft New Announcement Form */}
                <div className="p-4 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] space-y-3">
                  <p className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] flex items-center gap-1.5">
                    <Plus size={14} className="text-[#9E2A2B] dark:text-[#D4AF37]" /> Draft New Announcement
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      disabled={isSavingAnnouncements}
                      value={newAnnouncement.title}
                      onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Announcement title (required)"
                      className={inputClasses}
                    />
                    <select
                      disabled={isSavingAnnouncements}
                      value={newAnnouncement.type}
                      onChange={(e) => setNewAnnouncement(prev => ({ ...prev, type: e.target.value }))}
                      className={inputClasses}
                    >
                      <option value="info">Info Notice</option>
                      <option value="alert">Urgent Alert</option>
                      <option value="event">Schedule / Event</option>
                    </select>
                    <input
                      type="text"
                      disabled={isSavingAnnouncements}
                      value={newAnnouncement.date}
                      onChange={(e) => setNewAnnouncement(prev => ({ ...prev, date: e.target.value }))}
                      placeholder="Date / Label (e.g. Annual Cycle)"
                      className={inputClasses}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-end">
                    <textarea
                      rows={2}
                      disabled={isSavingAnnouncements}
                      value={newAnnouncement.desc}
                      onChange={(e) => setNewAnnouncement(prev => ({ ...prev, desc: e.target.value }))}
                      placeholder="Announcement description (required)"
                      className={`${inputClasses} flex-1`}
                    />
                    <button
                      type="button"
                      disabled={isSavingAnnouncements}
                      onClick={handleAddAnnouncement}
                      className="px-4 py-2 bg-[#1F1D1B] dark:bg-[#2E2A27] hover:bg-[#9E2A2B] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      <Plus size={14} />
                      <span>Add Draft</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACCOUNT & SECURITY */}
          {activeTab === 'account' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Details */}
              <div className="bg-white dark:bg-[#1C1917] p-5 sm:p-6 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-sm transition-colors">
                <div className="flex items-center gap-3 mb-5 pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                  <User size={18} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                  <h2 className="text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">Admin Profile</h2>
                </div>

                <div className="flex flex-col items-center mb-6">
                  <div className="w-20 h-20 rounded-full border-2 border-[#D4AF37]/50 shadow-sm overflow-hidden bg-[#F6F5F3] dark:bg-[#14110F] flex items-center justify-center relative group">
                    {profilePicPreview ? (
                      <img src={profilePicPreview} alt="Admin Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <img src="/gasan-logo.png" alt="Gasan Seal" className="w-full h-full object-contain p-2" />
                    )}
                    <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                      <Camera size={18} className="mb-0.5" />
                      <span className="text-[9px] font-semibold uppercase">Change</span>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  </div>
                  <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-2 font-medium">Click to upload custom administrator avatar</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider mb-1">
                      Administrator Name
                    </label>
                    <input
                      type="text"
                      value={accountData.name}
                      onChange={(e) => setAccountData(prev => ({ ...prev, name: e.target.value }))}
                      className={inputClasses}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider mb-1">
                      Official Contact Phone
                    </label>
                    <input
                      type="text"
                      value={accountData.contact}
                      onChange={(e) => handleAdminContactChange(e.target.value)}
                      placeholder="(042) 342-1234"
                      className={inputClasses}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenConfirm('account')}
                  className="mt-6 w-full bg-[#9E2A2B] hover:bg-[#7A1B22] text-white py-2.5 rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <Save size={15} /> Save Profile Changes
                </button>
              </div>

              {/* Password Change */}
              <div className="bg-white dark:bg-[#1C1917] p-5 sm:p-6 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-sm h-fit transition-colors">
                <div className="flex items-center gap-3 mb-5 pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                  <Lock size={18} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                  <h2 className="text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">Security & Password</h2>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter current password"
                      className={inputClasses}
                    />
                  </div>

                  <div className="pt-2 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
                    <label className="block text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                      className={inputClasses}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenConfirm('password')}
                  className="mt-6 w-full bg-[#1F1D1B] dark:bg-[#2E2A27] hover:bg-[#3D3834] dark:hover:bg-[#3D3834] text-white py-2.5 rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <ShieldCheck size={15} /> Update Password
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PREFERENCES & APPEARANCE */}
          {activeTab === 'preferences' && (
            <div className="w-full bg-white dark:bg-[#1C1917] p-5 sm:p-6 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-sm space-y-4 transition-colors">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                <Globe size={18} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                <h2 className="text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">System Appearance & Preferences</h2>
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] transition-colors">
                <div>
                  <p className="text-sm font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] flex items-center gap-2">
                    {isDark ? <Moon size={15} className="text-[#D4AF37]" /> : <Sun size={15} className="text-amber-500" />}
                    Theme Mode
                  </p>
                  <p className="text-xs font-medium text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
                    {isDark ? 'Dark Theme active (Warm Dark)' : 'Light Theme active'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleThemeToggle(isDark ? 'light' : 'dark')}
                  className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isDark ? 'bg-[#9E2A2B]' : 'bg-[#E4E1DC]'
                  }`}
                  role="switch"
                  aria-checked={isDark}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out flex items-center justify-center ${
                      isDark ? 'translate-x-6 text-[#1F1D1B]' : 'translate-x-0 text-amber-600'
                    }`}
                  >
                    {isDark ? <Moon size={10} /> : <Sun size={10} />}
                  </span>
                </button>
              </div>

              {/* Language Selector */}
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] transition-colors">
                <div>
                  <p className="text-sm font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] flex items-center gap-2">
                    <Globe size={15} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                    Display Language
                  </p>
                  <p className="text-xs font-medium text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
                    Select language for UI labels and notifications
                  </p>
                </div>

                <select
                  value={preferences.language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] text-xs font-medium rounded-lg px-3 py-1.5 outline-none cursor-pointer focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B]"
                >
                  <option value="en">English (US)</option>
                  <option value="fil">Tagalog / Filipino</option>
                </select>
              </div>

              {/* In-App Toast Alerts */}
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] transition-colors">
                <div>
                  <p className="text-sm font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] flex items-center gap-2">
                    <Bell size={15} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                    In-App Action Toasts
                  </p>
                  <p className="text-xs font-medium text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
                    Show corner pop-up toasts on save and updates
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToastPrefToggle}
                  className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    preferences.inAppToastAlerts ? 'bg-[#9E2A2B]' : 'bg-[#E4E1DC] dark:bg-[#2E2A27]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                      preferences.inAppToastAlerts ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: DATABASE BACKUP & DISASTER RECOVERY */}
          {activeTab === 'backup' && isSystemAdmin && (
            <div className="space-y-6">
              {/* Status Header Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-white dark:bg-[#1C1917] p-4 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 flex items-center justify-center text-[#9E2A2B] dark:text-[#D4AF37] shrink-0">
                    <Database size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">Total Archives</p>
                    <p className="text-lg font-extrabold font-mono tabular-nums text-[#1F1D1B] dark:text-[#F6F5F3] mt-0.5">{backupStats.totalBackups} Snapshots</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1C1917] p-4 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Clock size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">Last Backup Date</p>
                    <p className="text-xs font-bold text-[#1F1D1B] dark:text-[#F6F5F3] mt-0.5 truncate">
                      {backupStats.latestBackupDate ? new Date(backupStats.latestBackupDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No Backups Yet'}
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1C1917] p-4 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <CalendarDays size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">Weekly Schedule</p>
                    <p className="text-xs font-bold text-[#1F1D1B] dark:text-[#F6F5F3] mt-0.5">Every Sun @ 12:00 MN</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1C1917] p-4 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                    <HardDrive size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">Storage &amp; Retention</p>
                    <p className="text-xs font-bold text-[#1F1D1B] dark:text-[#F6F5F3] mt-0.5">{backupStats.totalStorageFormatted} (8 Wks)</p>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="bg-white dark:bg-[#1C1917] p-5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#1F1D1B] dark:text-[#F6F5F3] flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                    <span>LGU Database Disaster Recovery Operations</span>
                  </h3>
                  <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
                    Generate point-in-time archives (.json.gz) covering all 13 collections, permits, and audit trails.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <input
                    type="file"
                    ref={backupUploadInputRef}
                    onChange={handleUploadBackupRestore}
                    accept=".gz,.json"
                    className="hidden"
                  />

                  <button
                    type="button"
                    ref={backupUploadButtonRef}
                    onClick={() => backupUploadInputRef.current?.click()}
                    className="min-h-[44px] px-3 py-2 rounded-lg text-xs font-bold bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#EAE7E1] border border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-[#E4E1DC] dark:hover:bg-[#2E2A27] flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                    title="Restore the database using an uploaded .json.gz backup archive"
                  >
                    <UploadCloud size={14} />
                    <span>Upload &amp; Restore</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadDirectSnapshot}
                    className="px-3 py-2 rounded-lg text-xs font-bold bg-[#F6F5F3] dark:bg-[#14110F] text-[#9E2A2B] dark:text-[#D4AF37] border border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-[#E4E1DC] dark:hover:bg-[#2E2A27] flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                    title="Directly download a live compressed backup snapshot to your device"
                  >
                    <Download size={14} />
                    <span>Direct Offline Download</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateManualBackup}
                    disabled={isBackingUp}
                    className="px-3.5 py-2 rounded-lg text-xs font-bold bg-[#9E2A2B] hover:bg-[#7A1B22] text-white flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isBackingUp ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Creating Snapshot...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        <span>Backup Database Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Backup Archives Table */}
              <div className="bg-white dark:bg-[#1C1917] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#1F1D1B] dark:text-[#F6F5F3] uppercase tracking-wider flex items-center gap-1.5">
                    <FileArchive size={15} className="text-[#6B6761] dark:text-[#A8A29E]" />
                    <span>Available Backup Archives ({backups.length})</span>
                  </h3>
                  <button
                    type="button"
                    onClick={fetchBackups}
                    className="p-1.5 rounded-lg text-[#6B6761] hover:text-[#1F1D1B] dark:text-[#A8A29E] dark:hover:text-[#F6F5F3] hover:bg-[#F6F5F3] dark:hover:bg-[#14110F] transition-colors cursor-pointer"
                    title="Refresh backups list"
                  >
                    <RefreshCw size={14} className={isLoadingBackups ? 'animate-spin' : ''} />
                  </button>
                </div>

                {isLoadingBackups ? (
                  <div className="p-8 text-center text-xs text-[#6B6761] dark:text-[#A8A29E]">
                    <Loader2 size={20} className="animate-spin mx-auto mb-2 text-[#9E2A2B] dark:text-[#D4AF37]" />
                    <span>Loading backup archives...</span>
                  </div>
                ) : backups.length === 0 ? (
                  <div className="p-10 text-center text-xs text-[#6B6761] dark:text-[#A8A29E]">
                    <Database size={28} className="mx-auto mb-2.5 opacity-30" />
                    <p className="font-bold text-sm text-[#1F1D1B] dark:text-[#F6F5F3]">No backup archives stored yet.</p>
                    <p className="mt-1 max-w-sm mx-auto">
                      Click <strong>"Backup Database Now"</strong> or <strong>"Direct Offline Download"</strong> to save a full snapshot of the database.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Backup Archive Cards */}
                    <div className="md:hidden divide-y divide-[#E4E1DC] dark:divide-[#2E2A27]">
                      {backups.map((b, idx) => (
                        <div key={idx} className="p-3.5 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-mono font-medium text-xs text-[#1F1D1B] dark:text-[#F6F5F3] break-all min-w-0">
                              {b.filename}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                              b.isAutomated
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
                            }`}>
                              {b.type}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
                            <span className="tabular-nums">{new Date(b.createdAt).toLocaleString('en-PH')}</span>
                            <span className="font-mono tabular-nums font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{b.sizeFormatted}</span>
                          </div>
                          <div className="flex items-center justify-end gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => handleDownloadBackupFile(b.filename)}
                              className="p-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] hover:bg-[#E4E1DC] dark:hover:bg-[#2E2A27] text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Download size={13} />
                              <span>Download</span>
                            </button>
                            <button
                              type="button"
                              onClick={(event) => openArchiveRestore(b.filename, event.currentTarget)}
                              className="min-h-[44px] p-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw size={13} />
                              <span>Restore</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBackupFile(b.filename)}
                              className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs cursor-pointer"
                              title="Delete backup file"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] text-[#6B6761] dark:text-[#A8A29E] uppercase font-bold text-[11px] tracking-wider">
                            <th className="p-3 pl-4">Archive Filename</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Creation Date</th>
                            <th className="p-3">Size</th>
                            <th className="p-3 pr-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27]">
                          {backups.map((b, idx) => (
                            <tr key={idx} className="hover:bg-[#F6F5F3]/60 dark:hover:bg-[#14110F]/60 transition-colors">
                              <td className="p-3 pl-4 font-mono font-medium text-[#1F1D1B] dark:text-[#F6F5F3] truncate max-w-xs">
                                {b.filename}
                              </td>
                              <td className="p-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  b.isAutomated
                                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60'
                                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
                                }`}>
                                  {b.type}
                                </span>
                              </td>
                              <td className="p-3 text-[#6B6761] dark:text-[#A8A29E] tabular-nums">
                                {new Date(b.createdAt).toLocaleString('en-PH')}
                              </td>
                              <td className="p-3 font-mono tabular-nums font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                                {b.sizeFormatted}
                              </td>
                              <td className="p-3 pr-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadBackupFile(b.filename)}
                                    className="p-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] hover:bg-[#E4E1DC] dark:hover:bg-[#2E2A27] text-xs flex items-center gap-1 cursor-pointer"
                                    title="Download .json.gz"
                                  >
                                    <Download size={13} />
                                    <span>Download</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(event) => openArchiveRestore(b.filename, event.currentTarget)}
                                    className="min-h-[44px] p-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                    title="Restore database from this archive"
                                  >
                                    <RotateCcw size={13} />
                                    <span>Restore</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBackupFile(b.filename)}
                                    className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs cursor-pointer"
                                    title="Delete backup file"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog
        open={Boolean(restoreModal.filename)}
        onOpenChange={(open) => {
          if (!open && !restorePendingRef.current) setRestoreModal(EMPTY_RESTORE_MODAL);
        }}
      >
        <DialogContent
          showClose={false}
          className="max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto"
          onEscapeKeyDown={(event) => {
            if (restorePendingRef.current) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (restorePendingRef.current) event.preventDefault();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const trigger = restoreTriggerRef.current;
            (trigger?.isConnected ? trigger : backupUploadButtonRef.current)?.focus();
            restoreTriggerRef.current = null;
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle size={18} aria-hidden="true" className="shrink-0 text-[var(--status-danger-text)]" />
              Restore database
            </DialogTitle>
            <DialogDescription>
              The archive will overwrite current records in the collections it contains. A safety snapshot is saved before records are replaced.
            </DialogDescription>
          </DialogHeader>

          <p className="mt-4 break-all rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-3 font-mono text-xs text-[var(--text-main)]">
            {restoreModal.filename}
          </p>

          <form onSubmit={handleExecuteRestore} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="restore-confirm-text" className="block text-sm font-semibold">
                Type <span className="font-mono">RESTORE</span> to confirm
              </label>
              <input
                id="restore-confirm-text"
                type="text"
                autoComplete="off"
                spellCheck={false}
                required
                disabled={restoreModal.isRestoring}
                value={restoreModal.confirmText}
                onChange={(event) => setRestoreModal(prev => ({ ...prev, confirmText: event.target.value, error: '' }))}
                className="min-h-[44px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="restore-admin-password" className="block text-sm font-semibold">
                System Administrator password
              </label>
              <input
                id="restore-admin-password"
                name="adminPassword"
                type="password"
                autoComplete="current-password"
                required
                disabled={restoreModal.isRestoring}
                value={restoreModal.adminPassword}
                onChange={(event) => setRestoreModal(prev => ({ ...prev, adminPassword: event.target.value, error: '' }))}
                className="min-h-[44px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 text-sm"
              />
            </div>

            {restoreModal.error && (
              <p role="alert" className="break-words rounded-lg bg-[var(--status-danger-bg)] p-3 text-sm text-[var(--status-danger-text)]">
                {restoreModal.error}
              </p>
            )}
            {restoreModal.isRestoring && (
              <p role="status" className="text-sm text-[var(--text-muted)]">Restoring the database. Keep this page open.</p>
            )}

            <DialogFooter className="border-t border-[var(--color-border)] pt-4">
              <button
                type="button"
                disabled={restoreModal.isRestoring}
                onClick={() => setRestoreModal(EMPTY_RESTORE_MODAL)}
                className="min-h-[44px] rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-4 text-sm font-semibold hover:bg-[var(--color-border)] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={restoreModal.isRestoring || restoreModal.confirmText.trim() !== 'RESTORE' || !restoreModal.adminPassword}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-brand-hover)] disabled:opacity-50"
              >
                {restoreModal.isRestoring && <Loader2 size={15} aria-hidden="true" className="motion-safe:animate-spin" />}
                {restoreModal.isRestoring ? 'Restoring?' : 'Confirm restore'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* SAVE CHANGES CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => !isProcessing && setConfirmModal({ isOpen: false, type: null, data: null })}
          />
          <div className="relative bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg shadow-xl w-full max-w-md p-5 sm:p-6 transition-colors">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E4E1DC] dark:border-[#2E2A27] mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  confirmModal.type === 'maintenance'
                    ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'
                    : 'bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 text-[#9E2A2B] dark:text-[#D4AF37]'
                }`}>
                  {confirmModal.type === 'maintenance' ? <AlertTriangle size={16} /> : <Save size={16} />}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                    {confirmModal.type === 'maintenance' ? 'Enable Maintenance Mode' : 'Confirm Action'}
                  </h3>
                  <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
                    {confirmModal.type === 'maintenance'
                      ? 'Restrict operator application & renewal portals'
                      : 'Apply updates to platform database'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setConfirmModal({ isOpen: false, type: null, data: null })}
                className="text-[#6B6761] hover:text-[#1F1D1B] dark:text-[#A8A29E] dark:hover:text-[#F6F5F3] p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Summary Breakdown */}
            {confirmModal.type === 'maintenance' ? (
              <div className="space-y-3 mb-5">
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3.5 border border-amber-200 dark:border-amber-900/50 space-y-2 text-xs">
                  <p className="font-semibold text-amber-900 dark:text-amber-200">
                    Operators and TODA members will be temporarily blocked from submitting new applications or renewals.
                  </p>
                  <p className="text-[#6B6761] dark:text-[#A8A29E] leading-relaxed">
                    <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">Banner Message:</span>{' '}
                    {String(systemConfig.maintenanceMessage || '').trim() || DEFAULT_MAINTENANCE_MESSAGE}
                  </p>
                </div>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] text-center">
                  Administrators, LLSA I staff, and Cashiers will retain portal access.
                </p>
              </div>
            ) : (
              <p className="text-xs text-[#1F1D1B] dark:text-[#F6F5F3] mb-5 leading-relaxed">
                Are you sure you want to proceed with this account update?
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setConfirmModal({ isOpen: false, type: null, data: null })}
                className="flex-1 py-2 rounded-lg font-medium text-[#1F1D1B] dark:text-[#F6F5F3] bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#E4E1DC] dark:hover:bg-[#2E2A27] border border-[#E4E1DC] dark:border-[#2E2A27] transition-colors text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSave}
                disabled={isProcessing}
                className="flex-1 py-2 rounded-lg font-medium text-white bg-[#9E2A2B] hover:bg-[#7A1B22] transition-colors text-xs shadow-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={13} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default AdminSettings;
