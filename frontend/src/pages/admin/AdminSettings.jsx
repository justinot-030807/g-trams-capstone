import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '../../components/MainLayout';
import { 
  Sliders, User, Lock, Camera, Save, Loader2, 
  CheckCircle2, AlertCircle, Moon, Sun, Globe, Clock, 
  Wallet, CalendarDays, AlertTriangle, ShieldCheck, 
  Bell, FileCheck, Shield, ChevronRight, X
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const AdminSettings = () => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState('system'); // 'system' | 'account' | 'preferences'
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // TAB 1: SYSTEM & PLATFORM CONFIGURATION STATE
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

  // TAB 2: ACCOUNT & SECURITY STATE
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

  // TAB 3: PREFERENCES STATE
  const [preferences, setPreferences] = useState({
    theme: localStorage.getItem('theme') || 'light',
    language: localStorage.getItem('gtrams_lang') || language || 'en',
    inAppToastAlerts: localStorage.getItem('gtrams_toast_alerts') !== 'false'
  });

  // CONFIRMATION MODAL & TOAST
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

  // LOAD SAVED SYSTEM CONFIG & PROFILE ON MOUNT
  useEffect(() => {
    const loadAllSettings = async () => {
      setIsLoading(true);
      try {
        // 1. System Config from LocalStorage & Backend
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

        // Fetch authoritative settings from backend
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
                return newState;
              });
              localStorage.setItem('maintenance_mode', d.maintenanceMode ? 'true' : 'false');
              localStorage.setItem('fiscal_year', d.fiscalYear || prev.fiscalYear);
              localStorage.setItem('franchise_fee', d.franchiseFee ?? prev.franchiseFee);
              localStorage.setItem('validity_new', d.validityNew ?? prev.newFranchise);
              localStorage.setItem('validity_renew', d.validityRenew ?? prev.renewFranchise);
              localStorage.setItem('max_units_per_operator', d.maxUnitsPerOperator ?? 2);
              localStorage.setItem('required_docs', JSON.stringify(loadedDocs));
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

        // 3. Admin Account Profile from Backend
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
            if (dbUser.theme && dbUser.theme !== currentSavedTheme) {
              setTheme(dbUser.theme);
            }
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
    }
    setConfirmModal({ isOpen: true, type, data });
  };

  const executeSave = async () => {
    setIsProcessing(true);
    const { type } = confirmModal;

    try {
      if (type === 'system') {
        const docsArray = Array.isArray(systemConfig.requiredDocs) ? systemConfig.requiredDocs : [];

        // 1. Save System Settings to backend database
        const token = localStorage.getItem('token');
        if (token) {
          try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/v1/settings`, {
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
                expiryWarningDays: Number(systemConfig.expiryWarningDays),
                maxUnitsPerOperator: Number(systemConfig.maxUnitsPerOperator) || 2,
                requiredDocs: docsArray,
                docChecklist: docsArray.join(', '),
                maintenanceMode: Boolean(systemConfig.maintenanceMode)
              })
            });
          } catch (err) {
            console.error('Failed to sync settings with backend:', err);
          }
        }

        // 2. Save System Settings locally
        localStorage.setItem('validity_new', systemConfig.newFranchise);
        localStorage.setItem('validity_renew', systemConfig.renewFranchise);
        localStorage.setItem('fiscal_year', systemConfig.fiscalYear);
        localStorage.setItem('franchise_fee', systemConfig.franchiseFee);
        localStorage.setItem('penalty_fee', systemConfig.penaltyFee);
        localStorage.setItem('fare_base', systemConfig.fareBase);
        localStorage.setItem('fare_per_km', systemConfig.farePerKm);
        localStorage.setItem('max_units_per_operator', systemConfig.maxUnitsPerOperator);
        localStorage.setItem('maintenance_mode', systemConfig.maintenanceMode ? 'true' : 'false');
        localStorage.setItem('expiry_warning_days', systemConfig.expiryWarningDays);
        localStorage.setItem('required_docs', JSON.stringify(docsArray));

        setConfirmModal({ isOpen: false, type: null, data: null });

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
          showToast('No settings were changed.', 'info');
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
          setConfirmModal({ isOpen: false, type: null, data: null });
          showToast('Admin account details updated successfully!', 'success');
        } else {
          showToast('Failed to update account details.', 'error');
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
          setConfirmModal({ isOpen: false, type: null, data: null });
          showToast('Admin password changed successfully!', 'success');
        } else {
          const errData = await res.json();
          showToast(errData.message || 'Failed to change password.', 'error');
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while saving settings.', 'error');
    } finally {
      setIsProcessing(false);
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

  const inputClasses = "w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#7A1B22] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-[#7A1B22]/15 transition-all";

  return (
    <MainLayout>
      {/* Minimalist Floating Toast Notification */}
      {toast.show && preferences.inAppToastAlerts && (
        <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.6)] backdrop-blur-md rounded-2xl px-4 py-3 flex items-center gap-3 max-w-sm">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
              toast.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400'
                : toast.type === 'info'
                ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400'
                : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400'
            }`}>
              {toast.type === 'error' ? (
                <AlertCircle size={15} />
              ) : toast.type === 'info' ? (
                <Info size={15} />
              ) : (
                <CheckCircle2 size={15} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Standard Slim Vertical Accent Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-[#7A1B22] rounded-full" />
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Manage your account, preferences, and system configurations.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-[#7A1B22] dark:text-[#D4AF37]" size={36} />
        </div>
      ) : (
        <div className="space-y-6 max-w-5xl">
          {/* TAB NAVIGATION PILLS */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full sm:w-fit overflow-x-auto">
            <button
              onClick={() => setActiveTab('system')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                activeTab === 'system'
                  ? 'bg-white dark:bg-slate-800 text-[#7A1B22] dark:text-[#D4AF37] shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sliders size={16} />
              <span>System & Platform</span>
            </button>

            <button
              onClick={() => setActiveTab('account')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                activeTab === 'account'
                  ? 'bg-white dark:bg-slate-800 text-[#7A1B22] dark:text-[#D4AF37] shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User size={16} />
              <span>Account & Security</span>
            </button>

            <button
              onClick={() => setActiveTab('preferences')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                activeTab === 'preferences'
                  ? 'bg-white dark:bg-slate-800 text-[#7A1B22] dark:text-[#D4AF37] shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe size={16} />
              <span>Preferences & Appearance</span>
            </button>
          </div>

          {/* TAB 1: SYSTEM & PLATFORM CONFIGURATION */}
          {activeTab === 'system' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Franchise Rules & Validity */}
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="p-2 bg-[#7A1B22]/10 dark:bg-[#7A1B22]/20 rounded-xl">
                    <Clock size={20} className="text-[#7A1B22] dark:text-[#D4AF37]" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">Franchise Validity Period</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Configure validity duration for first-time and renewed permits</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
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
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">Years</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
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
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">Years</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
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
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">Days before</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fiscal & Fare Settings */}
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60">
                    <Wallet size={20} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">Fiscal & Fare Rates</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Establish municipal fees, penalties, and official TODA fare tariffs</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Fiscal Year Cycle
                    </label>
                    <div className="relative">
                      <CalendarDays size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        name="fiscalYear"
                        value={systemConfig.fiscalYear}
                        onChange={handleSystemConfigChange}
                        className={`${inputClasses} pl-10`}
                        placeholder="2026-2027"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
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
                    <p className="text-[10px] text-slate-400 mt-1">Default is 2 units</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Franchise Application Fee
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">₱</span>
                      <input
                        type="number"
                        step="0.01"
                        name="franchiseFee"
                        value={systemConfig.franchiseFee}
                        onChange={handleSystemConfigChange}
                        className={`${inputClasses} pl-8`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Late Renewal Penalty
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">₱</span>
                      <input
                        type="number"
                        step="0.01"
                        name="penaltyFee"
                        value={systemConfig.penaltyFee}
                        onChange={handleSystemConfigChange}
                        className={`${inputClasses} pl-8`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Base TODA Fare Rate
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">₱</span>
                      <input
                        type="number"
                        step="0.5"
                        name="fareBase"
                        value={systemConfig.fareBase}
                        onChange={handleSystemConfigChange}
                        className={`${inputClasses} pl-8`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Requirement Checklist Builder & Maintenance Mode */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <FileCheck size={20} className="text-[#7A1B22] dark:text-[#D4AF37]" />
                        <h2 className="text-base font-black text-slate-900 dark:text-white">Required Documents</h2>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetDefaultDocs}
                        className="text-[10px] font-bold text-slate-400 hover:text-[#7A1B22] dark:hover:text-[#D4AF37] transition-colors"
                      >
                        Reset Defaults
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Manage the list of documents required from operators when submitting franchise applications:</p>

                    {/* DYNAMIC DOCUMENT LIST */}
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {(Array.isArray(systemConfig.requiredDocs) ? systemConfig.requiredDocs : []).map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 transition-colors">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7A1B22] dark:bg-[#D4AF37]" />
                            {doc}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRequirement(doc)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            title="Remove document requirement"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      {(Array.isArray(systemConfig.requiredDocs) ? systemConfig.requiredDocs : []).length === 0 && (
                        <p className="text-xs text-slate-400 italic py-2 text-center">No document requirements defined. Add one below.</p>
                      )}
                    </div>
                  </div>

                  {/* ADD NEW DOCUMENT INPUT */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                    <input
                      type="text"
                      name="newDocInput"
                      value={systemConfig.newDocInput || ''}
                      onChange={handleSystemConfigChange}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddRequirement(); } }}
                      placeholder="e.g. Medical Certificate, Emission Test"
                      className={`${inputClasses} py-2 text-xs`}
                    />
                    <button
                      type="button"
                      onClick={handleAddRequirement}
                      className="px-4 py-2 bg-[#7A1B22] hover:bg-[#5A1419] text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-xs"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
                  <div>
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <AlertTriangle size={20} className="text-orange-500" />
                      <h2 className="text-base font-black text-slate-900 dark:text-white">Maintenance Mode</h2>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                      Enabling Maintenance Mode prevents operators from submitting new applications while system maintenance or database migration is in progress.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-orange-900 dark:text-orange-300">System Access Status</p>
                      <p className="text-[11px] font-semibold text-orange-700 dark:text-orange-400">
                        {systemConfig.maintenanceMode ? 'Locked for non-admin users' : 'Live & Accessible to all operators'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSystemConfig(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                      className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        systemConfig.maintenanceMode ? 'bg-orange-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                          systemConfig.maintenanceMode ? 'translate-x-7' : 'translate-x-0'
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
                  className="flex items-center gap-2 bg-[#7A1B22] hover:bg-[#5A1419] text-white px-8 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-sm active:scale-98 transition-all"
                >
                  <Save size={16} /> Save System Configurations
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ACCOUNT & SECURITY */}
          {activeTab === 'account' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
              {/* Profile Details */}
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <User size={20} className="text-[#7A1B22] dark:text-[#D4AF37]" />
                  <h2 className="text-base font-black text-slate-900 dark:text-white">Admin Profile</h2>
                </div>

                <div className="flex flex-col items-center mb-6">
                  <div className="w-24 h-24 rounded-full border-4 border-[#D4AF37]/40 shadow-md overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative group">
                    {profilePicPreview ? (
                      <img src={profilePicPreview} alt="Admin Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <img src="/gasan-logo.png" alt="Gasan Seal" className="w-full h-full object-contain p-2" />
                    )}
                    <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                      <Camera size={20} className="mb-0.5" />
                      <span className="text-[9px] font-bold uppercase">Change</span>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">Click to upload custom administrator avatar</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
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
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
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
                  className="mt-6 w-full bg-[#7A1B22] hover:bg-[#5A1419] text-white py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all"
                >
                  <Save size={16} /> Save Profile Changes
                </button>
              </div>

              {/* Password Change */}
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm h-fit transition-colors">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <Lock size={20} className="text-[#D4AF37]" />
                  <h2 className="text-base font-black text-slate-900 dark:text-white">Security & Password</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
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

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
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
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
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
                  className="mt-6 w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all"
                >
                  <ShieldCheck size={16} /> Update Password
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PREFERENCES & APPEARANCE */}
          {activeTab === 'preferences' && (
            <div className="max-w-2xl bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 animate-in fade-in duration-200 transition-colors">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <Globe size={20} className="text-[#D4AF37]" />
                <h2 className="text-base font-black text-slate-900 dark:text-white">System Appearance & Preferences</h2>
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {isDark ? <Moon size={16} className="text-indigo-400" /> : <Sun size={16} className="text-amber-500" />}
                    Theme Mode
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {isDark ? 'Dark Theme active (High Contrast)' : 'Light Theme active'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleThemeToggle(isDark ? 'light' : 'dark')}
                  className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isDark ? 'bg-[#7A1B22]' : 'bg-slate-300'
                  }`}
                  role="switch"
                  aria-checked={isDark}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out flex items-center justify-center ${
                      isDark ? 'translate-x-7 text-indigo-900' : 'translate-x-0 text-amber-600'
                    }`}
                  >
                    {isDark ? <Moon size={12} /> : <Sun size={12} />}
                  </span>
                </button>
              </div>

              {/* Language Selector */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Globe size={16} className="text-[#7A1B22] dark:text-[#D4AF37]" />
                    Display Language
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    Select language for UI labels and notifications
                  </p>
                </div>

                <select
                  value={preferences.language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer focus:ring-2 focus:ring-[#7A1B22]/20"
                >
                  <option value="en">English (US)</option>
                  <option value="fil">Tagalog / Filipino</option>
                </select>
              </div>

              {/* In-App Toast Alerts */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell size={16} className="text-[#7A1B22] dark:text-[#D4AF37]" />
                    In-App Action Toasts
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    Show centered pop-up toasts on save and updates
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToastPrefToggle}
                  className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    preferences.inAppToastAlerts ? 'bg-[#7A1B22]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      preferences.inAppToastAlerts ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SAVE CHANGES MINIMALIST CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => !isProcessing && setConfirmModal({ isOpen: false, type: null, data: null })}
          />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6 animate-in zoom-in-95 duration-150 transition-colors">
            
            {/* Minimalist Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#7A1B22]/10 dark:bg-[#7A1B22]/30 flex items-center justify-center text-[#7A1B22] dark:text-[#D4AF37]">
                  <Save size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                    {confirmModal.type === 'system' ? 'Save System Configuration' : 'Confirm Action'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Apply updates to platform database</p>
                </div>
              </div>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setConfirmModal({ isOpen: false, type: null, data: null })}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Summary Breakdown */}
            {confirmModal.type === 'system' ? (
              <div className="space-y-3 mb-5">
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-100 dark:border-slate-700/50 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Max Units / Operator:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{systemConfig.maxUnitsPerOperator} unit(s)</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Fiscal Year Cycle:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{systemConfig.fiscalYear}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Franchise Application Fee:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">₱{Number(systemConfig.franchiseFee).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Maintenance Mode:</span>
                    <span className={`font-bold ${systemConfig.maintenanceMode ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      {systemConfig.maintenanceMode ? 'Active (Restricted)' : 'Inactive (Public Access)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Required Documents:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{Array.isArray(systemConfig.requiredDocs) ? systemConfig.requiredDocs.length : 0} items</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 text-center">
                  Changes will take effect immediately across all operator portals.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
                Are you sure you want to proceed with this account update?
              </p>
            )}

            {/* Minimalist Action Buttons */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setConfirmModal({ isOpen: false, type: null, data: null })}
                className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSave}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-[#7A1B22] hover:bg-[#5A1419] transition-all text-xs shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
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
