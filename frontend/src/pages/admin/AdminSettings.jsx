import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '../../components/MainLayout';
import { 
  Sliders, User, Lock, Camera, Save, Loader2, 
  CheckCircle2, AlertCircle, Moon, Sun, Globe, Clock, 
  Wallet, CalendarDays, AlertTriangle, ShieldCheck, 
  Bell, FileCheck, Shield, ChevronRight, ChevronLeft, X, Search, RefreshCw, Info
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { SettingsSkeleton } from '../../components/skeleton';
import PageHeader from '../../components/common/PageHeader';

const AdminSettings = () => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState('system');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // System configuration state
  const [initialSystemConfig, setInitialSystemConfig] = useState(null);
  const [systemConfig, setSystemConfig] = useState({
    newFranchise: 3,
    renewFranchise: 1,
    fiscalYear: new Date().getFullYear().toString(),
    franchiseFee: 500,
    penaltyFee: 150,
    fareBase: 15,
    farePerKm: 2.5,
    maxUnitsPerOperator: 2,
    maintenanceMode: false,
    expiryWarningDays: 30,
    requiredDocs: ['OR / CR ng Motor', "Driver's License", 'TODA Endorsement', 'Barangay Clearance'],
    newDocInput: ''
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
        const savedFiscal = localStorage.getItem('fiscal_year');
        const savedFee = localStorage.getItem('franchise_fee');
        const savedPenalty = localStorage.getItem('penalty_fee');
        const savedFareBase = localStorage.getItem('fare_base');
        const savedFareKm = localStorage.getItem('fare_per_km');
        const savedMaint = localStorage.getItem('maintenance_mode');
        const savedExpiryDays = localStorage.getItem('expiry_warning_days');
        const savedDocs = localStorage.getItem('required_docs');
        const savedMaxUnits = localStorage.getItem('max_units_per_operator');

        setSystemConfig(prev => {
          const newState = {
            ...prev,
            newFranchise: savedNew ? parseInt(savedNew) : 3,
            renewFranchise: savedRenew ? parseInt(savedRenew) : 1,
            fiscalYear: savedFiscal || new Date().getFullYear().toString(),
            franchiseFee: savedFee ? parseFloat(savedFee) : 500,
            penaltyFee: savedPenalty ? parseFloat(savedPenalty) : 150,
            fareBase: savedFareBase ? parseFloat(savedFareBase) : 15,
            farePerKm: savedFareKm ? parseFloat(savedFareKm) : 2.5,
            maxUnitsPerOperator: savedMaxUnits ? parseInt(savedMaxUnits) : 2,
            maintenanceMode: savedMaint === 'true',
            expiryWarningDays: savedExpiryDays ? parseInt(savedExpiryDays) : 30,
            requiredDocs: savedDocs ? JSON.parse(savedDocs) : prev.requiredDocs
          };
          setInitialSystemConfig(newState);
          return newState;
        });

        // Fetch settings from backend
        try {
          const setRes = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/settings`);
          if (setRes.ok) {
            const setJson = await setRes.json();
            if (setJson.data) {
              const d = setJson.data;
              const loadedDocs = Array.isArray(d.requiredDocs) && d.requiredDocs.length > 0 
                ? d.requiredDocs 
                : (savedDocs ? JSON.parse(savedDocs) : ['OR / CR ng Motor', "Driver's License", 'TODA Endorsement', 'Barangay Clearance']);
              
              setSystemConfig(prev => {
                const newState = {
                  ...prev,
                  newFranchise: d.validityNew ?? prev.newFranchise,
                  renewFranchise: d.validityRenew ?? prev.renewFranchise,
                  fiscalYear: d.fiscalYear || prev.fiscalYear,
                  franchiseFee: d.franchiseFee ?? prev.franchiseFee,
                  penaltyFee: d.penaltyRate ?? prev.penaltyFee,
                  fareBase: d.baseFare ?? prev.fareBase,
                  maxUnitsPerOperator: d.maxUnitsPerOperator ?? prev.maxUnitsPerOperator,
                  maintenanceMode: Boolean(d.maintenanceMode),
                  expiryWarningDays: d.expiryWarningDays ?? prev.expiryWarningDays,
                  requiredDocs: loadedDocs
                };
                setInitialSystemConfig(newState);

                localStorage.setItem('maintenance_mode', d.maintenanceMode ? 'true' : 'false');
                localStorage.setItem('fiscal_year', newState.fiscalYear || '');
                localStorage.setItem('franchise_fee', String(newState.franchiseFee ?? ''));
                localStorage.setItem('validity_new', String(newState.newFranchise ?? ''));
                localStorage.setItem('validity_renew', String(newState.renewFranchise ?? ''));
                localStorage.setItem('max_units_per_operator', String(newState.maxUnitsPerOperator ?? 2));
                localStorage.setItem('required_docs', JSON.stringify(loadedDocs));

                return newState;
              });
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
    }
  }, [activeTab]);

  const handleSystemConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSystemConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
    showToast(`Added "${docName}" to document checklist.`, 'success');
  };

  const handleRemoveRequirement = (docName) => {
    setSystemConfig(prev => ({
      ...prev,
      requiredDocs: (Array.isArray(systemConfig.requiredDocs) ? systemConfig.requiredDocs : []).filter(d => d !== docName)
    }));
    showToast(`Removed "${docName}" from document checklist.`, 'info');
  };

  const handleResetDefaultDocs = () => {
    const defaults = ['OR / CR ng Motor', "Driver's License", 'TODA Endorsement', 'Barangay Clearance'];
    setSystemConfig(prev => ({
      ...prev,
      requiredDocs: defaults
    }));
    showToast('Reset document requirements to default standard.', 'success');
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

  const executeSave = async () => {
    setIsProcessing(true);
    const { type } = confirmModal;

    // Immediately close modal so it doesn't get stuck on screen
    setConfirmModal({ isOpen: false, type: null, data: null });

    try {
      if (type === 'system') {
        const docsArray = Array.isArray(systemConfig.requiredDocs) ? systemConfig.requiredDocs : [];

        // 1. Save system settings to backend
        const token = localStorage.getItem('token');
        if (!token) {
          showToast('Authentication error: You must be logged in as an administrator.', 'error');
          setIsProcessing(false);
          return;
        }

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/settings`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            validityNew: Number(systemConfig.newFranchise),
            validityRenew: Number(systemConfig.renewFranchise),
            fiscalYear: systemConfig.fiscalYear,
            franchiseFee: Number(systemConfig.franchiseFee),
            penaltyRate: Number(systemConfig.penaltyFee),
            baseFare: Number(systemConfig.fareBase),
            farePerKm: Number(systemConfig.farePerKm),
            expiryWarningDays: Number(systemConfig.expiryWarningDays),
            maxUnitsPerOperator: Number(systemConfig.maxUnitsPerOperator) || 2,
            requiredDocs: docsArray,
            maintenanceMode: Boolean(systemConfig.maintenanceMode)
          })
        });

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Your session has expired. Please log in again.');
          }
          if (res.status === 403) {
            throw new Error('Access denied. Administrator privileges required.');
          }
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `Server responded with error ${res.status}`);
        }

        const resData = await res.json();
        const savedBackend = resData.data || {};

        // 2. Save system settings locally to cache
        localStorage.setItem('validity_new', savedBackend.validityNew ?? systemConfig.newFranchise);
        localStorage.setItem('validity_renew', savedBackend.validityRenew ?? systemConfig.renewFranchise);
        localStorage.setItem('fiscal_year', savedBackend.fiscalYear || systemConfig.fiscalYear);
        localStorage.setItem('franchise_fee', savedBackend.franchiseFee ?? systemConfig.franchiseFee);
        localStorage.setItem('penalty_fee', savedBackend.penaltyRate ?? systemConfig.penaltyFee);
        localStorage.setItem('fare_base', savedBackend.baseFare ?? systemConfig.fareBase);
        localStorage.setItem('fare_per_km', savedBackend.farePerKm ?? systemConfig.farePerKm);
        localStorage.setItem('max_units_per_operator', savedBackend.maxUnitsPerOperator ?? systemConfig.maxUnitsPerOperator);
        localStorage.setItem('maintenance_mode', (savedBackend.maintenanceMode ?? systemConfig.maintenanceMode) ? 'true' : 'false');
        localStorage.setItem('expiry_warning_days', savedBackend.expiryWarningDays ?? systemConfig.expiryWarningDays);
        localStorage.setItem('required_docs', JSON.stringify(savedBackend.requiredDocs ?? docsArray));

        // Notify other components of settings change immediately
        window.dispatchEvent(new Event('gtrams_settings_updated'));

        const changes = [];
        if (initialSystemConfig) {
          if (Number(systemConfig.newFranchise) !== Number(initialSystemConfig.newFranchise)) changes.push('New Validity');
          if (Number(systemConfig.renewFranchise) !== Number(initialSystemConfig.renewFranchise)) changes.push('Renew Validity');
          if (systemConfig.fiscalYear !== initialSystemConfig.fiscalYear) changes.push('Fiscal Year');
          if (Number(systemConfig.franchiseFee) !== Number(initialSystemConfig.franchiseFee)) changes.push('Franchise Fee');
          if (Number(systemConfig.penaltyFee) !== Number(initialSystemConfig.penaltyFee)) changes.push('Penalty Fee');
          if (Number(systemConfig.fareBase) !== Number(initialSystemConfig.fareBase)) changes.push('Base Fare');
          if (Number(systemConfig.farePerKm) !== Number(initialSystemConfig.farePerKm)) changes.push('Fare Per KM');
          if (Number(systemConfig.maxUnitsPerOperator) !== Number(initialSystemConfig.maxUnitsPerOperator)) changes.push('Max Units');
          if (systemConfig.maintenanceMode !== initialSystemConfig.maintenanceMode) changes.push('Maintenance Mode');
          if (Number(systemConfig.expiryWarningDays) !== Number(initialSystemConfig.expiryWarningDays)) changes.push('Expiry Warning');
          if (JSON.stringify(docsArray) !== JSON.stringify(initialSystemConfig.requiredDocs)) changes.push('Required Docs');
        }

        setInitialSystemConfig(systemConfig);
        if (changes.length > 0) {
          showToast(`Updated: ${changes.join(', ')}`, 'success');
        } else {
          showToast('Settings saved successfully.', 'info');
        }
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
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/change-password`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            oldPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
          })
        });

        if (res.ok) {
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
          showToast('Admin password changed successfully!', 'success');
        } else {
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

  const inputClasses = "w-full bg-white dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] transition-colors";

  return (
    <MainLayout>
      {/* Floating Toast Notification */}
      {toast.show && preferences.inAppToastAlerts && (
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
          <div className="flex items-center gap-1.5 p-1 bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg w-full sm:w-fit overflow-x-auto">
            <button
              onClick={() => setActiveTab('system')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'system'
                  ? 'bg-white dark:bg-[#1C1917] text-[#9E2A2B] dark:text-[#D4AF37] shadow-xs border border-[#E4E1DC] dark:border-[#2E2A27]'
                  : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
              }`}
            >
              <Sliders size={15} />
              <span>System & Platform</span>
            </button>

            <button
              onClick={() => setActiveTab('account')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'account'
                  ? 'bg-white dark:bg-[#1C1917] text-[#9E2A2B] dark:text-[#D4AF37] shadow-xs border border-[#E4E1DC] dark:border-[#2E2A27]'
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
                  ? 'bg-white dark:bg-[#1C1917] text-[#9E2A2B] dark:text-[#D4AF37] shadow-xs border border-[#E4E1DC] dark:border-[#2E2A27]'
                  : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
              }`}
            >
              <Globe size={15} />
              <span>Preferences & Appearance</span>
            </button>

            <button
              onClick={() => { setActiveTab('audit'); fetchAuditLogs(1, auditActionFilter, auditSearchQuery); }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-white dark:bg-[#1C1917] text-[#9E2A2B] dark:text-[#D4AF37] shadow-xs border border-[#E4E1DC] dark:border-[#2E2A27]'
                  : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
              }`}
            >
              <Shield size={15} />
              <span>Audit Trail & Security Logs</span>
            </button>
          </div>

          {/* TAB 1: SYSTEM & PLATFORM CONFIGURATION */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              {/* Franchise Rules & Validity */}
              <div className="bg-white dark:bg-[#1C1917] p-5 sm:p-6 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs transition-colors">
                <div className="flex items-center gap-3 mb-5 pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                  <div className="p-2 bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 text-[#9E2A2B] dark:text-[#D4AF37] rounded-lg">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">Franchise Validity Period</h2>
                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">Configure validity duration for first-time and renewed permits</p>
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
                        max="10"
                        value={systemConfig.newFranchise}
                        onChange={handleSystemConfigChange}
                        className={inputClasses}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-600 dark:text-slate-400 font-bold">Years</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Renewal Validity
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="renewFranchise"
                        min="1"
                        max="10"
                        value={systemConfig.renewFranchise}
                        onChange={handleSystemConfigChange}
                        className={inputClasses}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-600 dark:text-slate-400 font-bold">Years</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Expiry Warning Alert
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="expiryWarningDays"
                        min="5"
                        max="90"
                        value={systemConfig.expiryWarningDays}
                        onChange={handleSystemConfigChange}
                        className={inputClasses}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-600 dark:text-slate-400 font-bold">Days before</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fiscal & Fare Settings */}
              <div className="bg-white dark:bg-[#1C1917] p-5 sm:p-6 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs transition-colors">
                <div className="flex items-center gap-3 mb-5 pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800/60">
                    <Wallet size={18} className="text-amber-700 dark:text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">Fiscal & Fare Rates</h2>
                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">Establish municipal fees, penalties, and official TODA fare tariffs</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider mb-1.5">
                      Fiscal Year Cycle
                    </label>
                    <div className="relative">
                      <CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6761] dark:text-[#A8A29E]" />
                      <input
                        type="text"
                        name="fiscalYear"
                        value={systemConfig.fiscalYear}
                        onChange={handleSystemConfigChange}
                        className={`${inputClasses} pl-9`}
                        placeholder="2026-2027"
                      />
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
                        max="10"
                        name="maxUnitsPerOperator"
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
                        step="0.01"
                        name="franchiseFee"
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
                        step="0.01"
                        name="penaltyFee"
                        value={systemConfig.penaltyFee}
                        onChange={handleSystemConfigChange}
                        className={`${inputClasses} pl-7 font-mono tabular-nums`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider mb-1.5">
                      Base TODA Fare Rate
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E]">₱</span>
                      <input
                        type="number"
                        step="0.5"
                        name="fareBase"
                        value={systemConfig.fareBase}
                        onChange={handleSystemConfigChange}
                        className={`${inputClasses} pl-7 font-mono tabular-nums`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Requirement Checklist Builder & Maintenance Mode */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1C1917] p-5 sm:p-6 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                      <div className="flex items-center gap-3">
                        <FileCheck size={18} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                        <h2 className="text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">Required Documents</h2>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetDefaultDocs}
                        className="text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] hover:text-[#9E2A2B] dark:hover:text-[#D4AF37] transition-colors cursor-pointer"
                      >
                        Reset Defaults
                      </button>
                    </div>
                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mb-4">Manage the list of documents required from operators when submitting franchise applications:</p>

                    {/* DYNAMIC DOCUMENT LIST */}
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {(Array.isArray(systemConfig.requiredDocs) ? systemConfig.requiredDocs : []).map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] transition-colors">
                          <span className="text-xs font-medium text-[#1F1D1B] dark:text-[#F6F5F3] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#9E2A2B] dark:bg-[#D4AF37]" />
                            {doc}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRequirement(doc)}
                            className="text-[#6B6761] dark:text-[#A8A29E] hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
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
                      value={systemConfig.newDocInput || ''}
                      onChange={handleSystemConfigChange}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddRequirement(); } }}
                      placeholder="e.g. Medical Certificate, Emission Test"
                      className={`${inputClasses} py-1.5 text-xs`}
                    />
                    <button
                      type="button"
                      onClick={handleAddRequirement}
                      className="px-3.5 py-1.5 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white rounded-lg text-xs font-medium shrink-0 transition-colors shadow-xs cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1C1917] p-5 sm:p-6 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs flex flex-col justify-between transition-colors">
                  <div>
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                      <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
                      <h2 className="text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">Maintenance Mode</h2>
                    </div>
                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] leading-relaxed mb-6">
                      Enabling Maintenance Mode prevents operators from submitting new applications while system maintenance or database migration is in progress.
                    </p>
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
                      onClick={() => setSystemConfig(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                      className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        systemConfig.maintenanceMode ? 'bg-[#9E2A2B]' : 'bg-[#E4E1DC] dark:bg-[#2E2A27]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                          systemConfig.maintenanceMode ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* SAVE BUTTON FOR SYSTEM CONFIG */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenConfirm('system')}
                  className="flex items-center gap-2 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white px-5 py-2.5 rounded-lg font-medium text-xs sm:text-sm shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Save size={15} /> Save System Configurations
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ACCOUNT & SECURITY */}
          {activeTab === 'account' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Details */}
              <div className="bg-white dark:bg-[#1C1917] p-5 sm:p-6 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs transition-colors">
                <div className="flex items-center gap-3 mb-5 pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                  <User size={18} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                  <h2 className="text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">Admin Profile</h2>
                </div>

                <div className="flex flex-col items-center mb-6">
                  <div className="w-20 h-20 rounded-full border-2 border-[#D4AF37]/50 shadow-xs overflow-hidden bg-[#F6F5F3] dark:bg-[#14110F] flex items-center justify-center relative group">
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
                      onChange={(e) => setAccountData(prev => ({ ...prev, contact: e.target.value }))}
                      placeholder="(042) 342-1234"
                      className={inputClasses}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenConfirm('account')}
                  className="mt-6 w-full bg-[#9E2A2B] hover:bg-[#7A1B22] text-white py-2.5 rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Save size={15} /> Save Profile Changes
                </button>
              </div>

              {/* Password Change */}
              <div className="bg-white dark:bg-[#1C1917] p-5 sm:p-6 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs h-fit transition-colors">
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
                      placeholder="••••••••"
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
                      placeholder="••••••••"
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
                      placeholder="••••••••"
                      className={inputClasses}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenConfirm('password')}
                  className="mt-6 w-full bg-[#1F1D1B] dark:bg-[#2E2A27] hover:bg-[#3D3834] dark:hover:bg-[#3D3834] text-white py-2.5 rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <ShieldCheck size={15} /> Update Password
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PREFERENCES & APPEARANCE */}
          {activeTab === 'preferences' && (
            <div className="w-full bg-white dark:bg-[#1C1917] p-5 sm:p-6 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs space-y-4 transition-colors">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                <Globe size={18} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                <h2 className="text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">System Appearance & Preferences</h2>
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] transition-colors">
                <div>
                  <p className="text-sm font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] flex items-center gap-2">
                    {isDark ? <Moon size={15} className="text-indigo-400" /> : <Sun size={15} className="text-amber-500" />}
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
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out flex items-center justify-center ${
                      isDark ? 'translate-x-6 text-indigo-900' : 'translate-x-0 text-amber-600'
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
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                      preferences.inAppToastAlerts ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT TRAIL & SECURITY LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#1C1917] p-5 sm:p-6 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 rounded-lg border border-[#9E2A2B]/20 text-[#9E2A2B] dark:text-[#D4AF37]">
                      <Shield size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] flex items-center gap-2">
                        System Audit Trail & Security Logs
                        <span className="text-[10px] bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                          Immutable Ledger
                        </span>
                      </h2>
                      <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
                        Chronological record of administrative operations, approvals, revocations, and security events.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => fetchAuditLogs(auditPage, auditActionFilter, auditSearchQuery)}
                    disabled={auditLoading}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#E4E1DC] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] text-xs font-medium rounded-lg transition-colors active:scale-95 shrink-0 border border-[#E4E1DC] dark:border-[#2E2A27] cursor-pointer"
                  >
                    <RefreshCw size={13} className={auditLoading ? 'animate-spin' : ''} />
                    <span>Refresh Logs</span>
                  </button>
                </div>

                {/* Filter and Search Bar */}
                <div className="pt-5 grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-8 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6761] dark:text-[#A8A29E]" size={15} />
                    <input
                      type="text"
                      placeholder="Search by Actor Name, Action, or Record ID..."
                      value={auditSearchQuery}
                      onChange={(e) => {
                        setAuditSearchQuery(e.target.value);
                        fetchAuditLogs(1, auditActionFilter, e.target.value);
                      }}
                      className={inputClasses + " pl-9"}
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <select
                      value={auditActionFilter}
                      onChange={(e) => {
                        setAuditActionFilter(e.target.value);
                        fetchAuditLogs(1, e.target.value, auditSearchQuery);
                      }}
                      className={inputClasses}
                    >
                      <option value="All">All Event Types</option>
                      <option value="FRANCHISE_STATUS_UPDATE">Franchise Status Updates</option>
                      <option value="FRANCHISE_REVOKED">Franchise Revocations</option>
                      <option value="FRANCHISE_ARCHIVED">Franchise Archives</option>
                      <option value="FRANCHISE_DELETED">Franchise Deletions</option>
                      <option value="USER_UPDATED">User Profile Updates</option>
                      <option value="USER_DEACTIVATED">User Deactivations</option>
                      <option value="USER_ACTIVATED">User Activations</option>
                      <option value="PASSWORD_CHANGED">Password Changes</option>
                      <option value="PASSWORD_RESET">Password Resets</option>
                    </select>
                  </div>
                </div>

                {/* Logs Table */}
                <div className="mt-5 overflow-x-auto border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] text-xs uppercase tracking-wider font-semibold">
                        <th className="py-2.5 px-4">Timestamp & IP</th>
                        <th className="py-2.5 px-4">Administrator / Actor</th>
                        <th className="py-2.5 px-4">Action Event</th>
                        <th className="py-2.5 px-4">Target & Summary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27] text-xs">
                      {auditLoading ? (
                        <tr>
                          <td colSpan="4" className="py-12 text-center text-[#6B6761] dark:text-[#A8A29E]">
                            <Loader2 className="animate-spin mx-auto mb-2 text-[#9E2A2B] dark:text-[#D4AF37]" size={20} />
                            <p className="font-semibold text-xs">Loading audit ledger...</p>
                          </td>
                        </tr>
                      ) : auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-12 text-center text-[#6B6761] dark:text-[#A8A29E]">
                            <ShieldCheck size={28} className="mx-auto mb-2 opacity-30" />
                            <p className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">No audit log entries recorded yet.</p>
                            <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5">Admin operations will automatically appear here in real time.</p>
                          </td>
                        </tr>
                      ) : (
                        auditLogs.map((log) => {
                          const isDeleteOrRevoke = log.action?.includes('REVOKE') || log.action?.includes('DELETE') || log.action?.includes('DEACTIVATE');
                          const isSuccess = log.action?.includes('APPROVE') || log.action?.includes('ACTIVATE') || log.action?.includes('RESTORE');
                          
                          return (
                            <tr key={log._id} className="hover:bg-[#F6F5F3]/50 dark:hover:bg-[#14110F]/50 transition-colors">
                              <td className="py-3 px-4 font-mono text-xs text-[#6B6761] dark:text-[#A8A29E] tabular-nums">
                                <div className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                                  {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                                <div className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
                                  {new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} &bull; IP: {log.ipAddress || '127.0.0.1'}
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <div className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] flex items-center gap-1.5">
                                  <User size={13} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                                  {log.actorName || 'System'}
                                </div>
                                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6761] dark:text-[#A8A29E]">
                                  {log.actorRole || 'admin'}
                                </span>
                              </td>

                              <td className="py-3 px-4">
                                <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${
                                  isDeleteOrRevoke 
                                    ? 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-300 dark:border-red-800'
                                    : isSuccess
                                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                    : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                }`}>
                                  {log.action?.replace(/_/g, ' ')}
                                </span>
                              </td>

                              <td className="py-3 px-4">
                                <div className="font-medium text-[#1F1D1B] dark:text-[#F6F5F3]">
                                  {log.targetType}: {log.details?.plateNo || log.details?.name || log.targetId || 'N/A'}
                                </div>
                                {log.details?.reason && (
                                  <p className="text-xs text-red-700 dark:text-red-400 font-medium truncate max-w-xs">
                                    Reason: {log.details.reason}
                                  </p>
                                )}
                                {log.details?.previousStatus && log.details?.newStatus && (
                                  <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-mono">
                                    {log.details.previousStatus} ➜ {log.details.newStatus}
                                  </p>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {auditPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-[#E4E1DC] dark:border-[#2E2A27] mt-4 text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E]">
                    <div className="font-mono tabular-nums">
                      Page {auditPagination.currentPage} of {auditPagination.totalPages} ({auditPagination.totalRecords} records)
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => fetchAuditLogs(auditPage - 1, auditActionFilter, auditSearchQuery)}
                        disabled={!auditPagination.hasPrevPage || auditLoading}
                        className="p-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] disabled:opacity-30 hover:bg-[#F6F5F3] dark:hover:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] transition-colors cursor-pointer"
                      >
                        <ChevronLeft size={15} />
                      </button>
                      <button
                        onClick={() => fetchAuditLogs(auditPage + 1, auditActionFilter, auditSearchQuery)}
                        disabled={!auditPagination.hasNextPage || auditLoading}
                        className="p-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] disabled:opacity-30 hover:bg-[#F6F5F3] dark:hover:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] transition-colors cursor-pointer"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SAVE CHANGES CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => !isProcessing && setConfirmModal({ isOpen: false, type: null, data: null })}
          />
          <div className="relative bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg shadow-xl w-full max-w-md p-5 sm:p-6 transition-colors">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E4E1DC] dark:border-[#2E2A27] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 flex items-center justify-center text-[#9E2A2B] dark:text-[#D4AF37]">
                  <Save size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                    {confirmModal.type === 'system' ? 'Save System Configuration' : 'Confirm Action'}
                  </h3>
                  <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">Apply updates to platform database</p>
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
            {confirmModal.type === 'system' ? (
              <div className="space-y-3 mb-5">
                <div className="bg-[#F6F5F3] dark:bg-[#14110F] rounded-lg p-3.5 border border-[#E4E1DC] dark:border-[#2E2A27] space-y-2 text-xs">
                  <div className="flex justify-between items-center text-[#6B6761] dark:text-[#A8A29E]">
                    <span>Max Units / Operator:</span>
                    <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{systemConfig.maxUnitsPerOperator} unit(s)</span>
                  </div>
                  <div className="flex justify-between items-center text-[#6B6761] dark:text-[#A8A29E]">
                    <span>Fiscal Year Cycle:</span>
                    <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{systemConfig.fiscalYear}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#6B6761] dark:text-[#A8A29E]">
                    <span>Franchise Application Fee:</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">₱{Number(systemConfig.franchiseFee).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#6B6761] dark:text-[#A8A29E]">
                    <span>Maintenance Mode:</span>
                    <span className={`font-semibold ${systemConfig.maintenanceMode ? 'text-amber-700 dark:text-amber-400' : 'text-[#6B6761] dark:text-[#A8A29E]'}`}>
                      {systemConfig.maintenanceMode ? 'Active (Restricted)' : 'Inactive (Public Access)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[#6B6761] dark:text-[#A8A29E]">
                    <span>Required Documents:</span>
                    <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{Array.isArray(systemConfig.requiredDocs) ? systemConfig.requiredDocs.length : 0} items</span>
                  </div>
                </div>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] text-center">
                  Changes will take effect immediately across all operator portals.
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
                className="flex-1 py-2 rounded-lg font-medium text-white bg-[#9E2A2B] hover:bg-[#7A1B22] transition-colors text-xs shadow-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
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
