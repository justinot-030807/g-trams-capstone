import React, { useState, useEffect, useRef } from 'react';
import { GASAN_BARANGAYS, TODA_LIST } from '../../utils/constants';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/MainLayout';
import { 
  User, Lock, Camera, Save, Loader2, Phone, Mail,
  CheckCircle2, AlertCircle, Moon, Sun, Laptop, Globe, 
  ShieldCheck, MapPin, Hash, Shield, Car, Check, LogOut,
  Eye, EyeOff, FileText, Bell, Smartphone, Send, RefreshCw,
  Volume2, Info, ShieldAlert, Sparkles
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { SettingsSkeleton } from '../../components/skeleton';
import FeedbackModal from '../../components/common/FeedbackModal';
import OperatorIdCard from '../../components/operator/OperatorIdCard';
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getPushStatus,
  updatePushPreferences,
  sendTestPush
} from '../../utils/pushNotification';

const OperatorSettings = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('name');
    navigate('/login');
  };

  // Profile and contact details state
  const [profileData, setProfileData] = useState({
    name: '',
    contact: '',
    emergencyContact: '',
    address: 'Municipality of Gasan',
    todaAssociation: 'NON-TODA'
  });
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);

  // Security and password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Preferences state
  const [preferences, setPreferences] = useState({
    theme: localStorage.getItem('theme') || 'light',
    language: localStorage.getItem('gtrams_lang') || language || 'en'
  });

  // Confirmation modal and centered feedback modal
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null });
  const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });
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

  // Push Notification State & Controls
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState('default');
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [pushPreferences, setPushPreferences] = useState({
    statusUpdates: true,
    renewalReminders: true,
    announcements: true
  });

  useEffect(() => {
    const checkPush = async () => {
      const supported = isPushSupported();
      setPushSupported(supported);
      if (supported) {
        setPushPermission(getNotificationPermission());
        const status = await getPushStatus();
        setIsPushSubscribed(status.isSubscribed);
        if (status.preferences) {
          setPushPreferences(prev => ({ ...prev, ...status.preferences }));
        }
      }
    };
    checkPush();
  }, [activeTab]);

  const handleTogglePushSubscription = async () => {
    if (isPushLoading) return;
    setIsPushLoading(true);
    try {
      if (isPushSubscribed) {
        await unsubscribeFromPush();
        setIsPushSubscribed(false);
        showToast('Push notifications disabled on this device.', 'success');
      } else {
        await subscribeToPush(pushPreferences);
        setIsPushSubscribed(true);
        setPushPermission('granted');
        showToast('Push notifications enabled! Your device will now receive alerts.', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to update push notification setting.', 'error', 4500);
      setPushPermission(getNotificationPermission());
    } finally {
      setIsPushLoading(false);
    }
  };

  const handleTogglePushPreference = async (key) => {
    const updated = { ...pushPreferences, [key]: !pushPreferences[key] };
    setPushPreferences(updated);
    try {
      if (isPushSubscribed) {
        await updatePushPreferences(updated);
      }
      showToast('Notification preference updated.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save preference to server.', 'error');
    }
  };

  const handleSendTestPush = async () => {
    if (isTestingPush || !isPushSubscribed) return;
    setIsTestingPush(true);
    try {
      await sendTestPush();
      showToast('Test push alert sent! Check your phone notification bar.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to send test push alert.', 'error');
    } finally {
      setIsTestingPush(false);
    }
  };

  // Load profile on mount
  useEffect(() => {
    const fetchOperatorProfile = async () => {
      setIsLoading(true);
      try {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const savedLang = localStorage.getItem('gtrams_lang') || language || 'en';

        setPreferences({ theme: savedTheme, language: savedLang });

        const token = localStorage.getItem('token');
        if (token) {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const dbUser = await res.json();
            setProfileData({
              name: dbUser.name || dbUser.fullName || localStorage.getItem('name') || '',
              contact: dbUser.contact || '',
              emergencyContact: dbUser.emergencyContact || '',
              address: dbUser.address || 'Municipality of Gasan',
              todaAssociation: dbUser.todaAssociation || 'NON-TODA'
            });

            if (dbUser.profilePic) setProfilePicPreview(dbUser.profilePic);
            if (dbUser.language) {
              setLanguage(dbUser.language);
              setPreferences(prev => ({ ...prev, language: dbUser.language }));
            }
            // Keep preferences.theme in sync with client active theme
            const currentTheme = localStorage.getItem('theme') || 'light';
            setPreferences(prev => ({ ...prev, theme: currentTheme }));
            localStorage.setItem('user', JSON.stringify(dbUser));
          }
        }
      } catch (err) {
        console.error('Failed to load operator settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOperatorProfile();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast(t('settings.fileTooLarge', 'File size must be less than 5MB.'), 'error');
        return;
      }
      if (profilePicPreview && profilePicPreview.startsWith('blob:')) {
        URL.revokeObjectURL(profilePicPreview);
      }
      setProfilePicFile(file);
      setProfilePicPreview(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    return () => {
      if (profilePicPreview && profilePicPreview.startsWith('blob:')) {
        URL.revokeObjectURL(profilePicPreview);
      }
    };
  }, [profilePicPreview]);

  const handleOpenConfirm = (type) => {
    if (type === 'profile') {
      const isEmail = profileData.contact.includes('@');
      if (!isEmail && profileData.contact) {
        const phoneRegex = /^(09|\+639)\d{9}$/;
        if (!phoneRegex.test(profileData.contact.replace(/[\s-]/g, ''))) {
          showToast(t('profile.invalidPhone', 'Please enter a valid Philippine mobile number.'), 'error');
          return;
        }
      }
    }
    
    if (type === 'security') {
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        showToast(t('profile.fillPassFields', 'Please fill out all password fields.'), 'error');
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        showToast(t('profile.passMismatch', 'New passwords do not match!'), 'error');
        return;
      }
      if (passwordData.newPassword.length < 6) {
        showToast(t('profile.passTooShort', 'Password must be at least 6 characters.'), 'error');
        return;
      }
      if (passwordData.currentPassword === passwordData.newPassword) {
        showToast(t('profile.passSame', 'New password must be different from current password.'), 'error');
        return;
      }
    }
    setConfirmModal({ isOpen: true, type });
  };

  const executeSave = async () => {
    setIsProcessing(true);
    const { type } = confirmModal;

    try {
      if (type === 'profile') {
        const formData = new FormData();
        formData.append('name', profileData.name);
        formData.append('contact', profileData.contact);
        formData.append('emergencyContact', profileData.emergencyContact);
        formData.append('address', profileData.address);
        formData.append('todaAssociation', profileData.todaAssociation);
        formData.append('language', preferences.language);
        formData.append('theme', preferences.theme);

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
          localStorage.setItem('name', updated.name || profileData.name);
          setConfirmModal({ isOpen: false, type: null });
          setFeedbackModal({
            isOpen: true,
            type: 'success',
            title: 'Profile Updated',
            message: 'Your profile details and contact information have been saved successfully.'
          });
        } else {
          setConfirmModal({ isOpen: false, type: null });
          setFeedbackModal({
            isOpen: true,
            type: 'error',
            title: 'Update Failed',
            message: 'Failed to save profile changes. Please review your input and try again.'
          });
        }
      } 
      else if (type === 'security') {
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
          setConfirmModal({ isOpen: false, type: null });
          setFeedbackModal({
            isOpen: true,
            type: 'success',
            title: 'Password Changed',
            message: 'Your account password has been updated successfully. Please use your new password next time you log in.'
          });
        } else {
          const errData = await res.json().catch(() => ({}));
          setConfirmModal({ isOpen: false, type: null });
          setFeedbackModal({
            isOpen: true,
            type: 'error',
            title: 'Password Change Failed',
            message: errData.message || 'Failed to change password. Please verify your current password and try again.'
          });
        }
      }
    } catch (err) {
      console.error(err);
      setConfirmModal({ isOpen: false, type: null });
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'Connection Error',
        message: 'Network error while saving settings. Please check your internet connection.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleThemeToggle = (newTheme) => {
    setTheme(newTheme);
    setPreferences(prev => ({ ...prev, theme: newTheme }));
    showToast(
      newTheme === 'dark' 
        ? 'Dark mode enabled' 
        : newTheme === 'system' 
          ? 'System mode enabled (matches phone/OS settings)' 
          : 'Light mode enabled', 
      'success'
    );
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setPreferences(prev => ({ ...prev, language: newLang }));
    localStorage.setItem('gtrams_lang', newLang);
    showToast(newLang === 'fil' ? 'Language set to Filipino' : 'Language set to English', 'success');
  };

  const inputClasses = "w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#7A1B22] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-[#7A1B22]/15 transition-all shadow-2xs";
  const lockedClasses = "w-full bg-slate-100/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed select-none";

  const isEmailContact = (profileData.contact || '').includes('@');
  const contactLabel = profileData.contact
    ? (isEmailContact ? 'Email Address' : 'Phone Number')
    : 'Email / Phone Number';

  return (
    <MainLayout>
      {/* Minimalist Floating Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.6)] backdrop-blur-md rounded-2xl px-4 py-3 flex items-center gap-3 max-w-sm">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
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
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Standard Slim Vertical Accent Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1.5 h-8 bg-[#7A1B22] dark:bg-[#D4AF37] rounded-full" />
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">Account Settings</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Manage your personal profile, security credentials, and portal display preferences.
          </p>
        </div>
      </div>

      {isLoading ? (
        <SettingsSkeleton />
      ) : (
        <div className="space-y-6 w-full pb-28 sm:pb-24">
          {/* TAB NAVIGATION PILLS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl w-full">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[42px] cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-white dark:bg-slate-800 text-[#7A1B22] dark:text-[#D4AF37] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User size={16} />
              <span>Profile &amp; Contact</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[42px] cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-white dark:bg-slate-800 text-[#7A1B22] dark:text-[#D4AF37] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Lock size={16} />
              <span>Account Security</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preferences')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[42px] cursor-pointer ${
                activeTab === 'preferences'
                  ? 'bg-white dark:bg-slate-800 text-[#7A1B22] dark:text-[#D4AF37] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe size={16} />
              <span>Preferences</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('idcard')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[42px] cursor-pointer ${
                activeTab === 'idcard'
                  ? 'bg-white dark:bg-slate-800 text-[#7A1B22] dark:text-[#D4AF37] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck size={16} />
              <span>Digital ID</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('vault')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[42px] cursor-pointer ${
                activeTab === 'vault'
                  ? 'bg-white dark:bg-slate-800 text-[#7A1B22] dark:text-[#D4AF37] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText size={16} />
              <span>Document Vault</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[42px] cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-white dark:bg-slate-800 text-[#7A1B22] dark:text-[#D4AF37] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bell size={16} />
              <span>Notifications</span>
            </button>
          </div>

          {/* TAB 1: PROFILE & CONTACT DETAILS */}
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors animate-in fade-in duration-200 w-full">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 bg-[#7A1B22]/10 dark:bg-[#7A1B22]/20 rounded-xl text-[#7A1B22] dark:text-[#D4AF37]">
                  <User size={20} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Operator Information
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Update personal details and registered {contactLabel}
                  </p>
                </div>
              </div>

              {/* Profile Photo Upload */}
              <div className="flex flex-col items-center mb-6 bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
                <div className="w-24 h-24 rounded-full border-2 border-[#D4AF37] shadow-xs overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative">
                  {profilePicPreview ? (
                    <img src={profilePicPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} className="text-slate-300 dark:text-slate-600" />
                  )}
                </div>
                <label className="mt-3.5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer active:scale-95 transition-all border border-slate-200 dark:border-slate-700 shadow-2xs min-h-[38px]">
                  <Camera size={15} className="text-[#7A1B22] dark:text-[#D4AF37]" />
                  <span>Change Profile Photo</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                  Select a clear photo of your face (JPG or PNG)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" maxLength="50"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className={inputClasses}
                    required
                    placeholder="Full Name of Operator"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {contactLabel} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    {isEmailContact ? (
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    ) : (
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    )}
                    <input
                      type={isEmailContact ? "email" : "tel"}
                      inputMode={isEmailContact ? "email" : "tel"}
                      value={profileData.contact}
                      onChange={(e) => setProfileData(prev => ({ ...prev, contact: e.target.value }))}
                      className={`${inputClasses} pl-10`}
                      required
                      placeholder={isEmailContact ? "e.g. operator@gmail.com" : "e.g. 0912 345 6789"}
                    />
                  </div>
                  <p className="text-xs font-medium text-slate-400 mt-1">
                    Office of the Vice Mayor Extension will use this {contactLabel} for notices and official updates.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Phone size={14} className="text-red-500" />
                    Emergency Contact Number
                  </label>
                  <input
                    type="text" maxLength="50"
                    value={profileData.emergencyContact}
                    onChange={(e) => setProfileData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                    placeholder="e.g. 09123456789"
                    className={inputClasses}
                  />
                  <p className="text-xs font-medium text-slate-400 mt-1">
                    Used only in case of accidents or emergencies.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      TODA Association
                    </label>
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800/80">
                      Locked (Official)
                    </span>
                  </div>
                  <input
                    type="text" maxLength="50"
                    value={profileData.todaAssociation}
                    readOnly
                    title="Registered TODA is permanent. Visit LGU office for TODA transfer."
                    className={lockedClasses}
                  />
                  <p className="text-xs text-slate-400 mt-1 font-medium">Contact the Office of the Vice Mayor Extension office for any TODA reassignment.</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Registered Barangay
                    </label>
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800/80">
                      Locked (Official)
                    </span>
                  </div>
                  <input
                    type="text" maxLength="50"
                    value={profileData.address}
                    readOnly
                    title="Official registered address cannot be self-edited. Contact Office of the Vice Mayor Extension for changes."
                    className={lockedClasses}
                  />
                  <p className="text-xs text-slate-400 mt-1 font-medium">Recorded in the official municipal registry of Gasan.</p>
                </div>
              </div>

              <div className="flex justify-end pt-5 mt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleOpenConfirm('profile')}
                  className="w-full sm:w-auto bg-[#7A1B22] hover:bg-[#5A1419] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] text-white dark:text-slate-950 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer min-h-[42px]"
                >
                  <Save size={16} /> 
                  <span>Save Information</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ACCOUNT SECURITY */}
          {activeTab === 'security' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors animate-in fade-in duration-200 w-full">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400">
                  <Lock size={20} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Account Password
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Keep your account secure with a strong password
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="••••••••"
                      className={`${inputClasses} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title={showCurrentPass ? 'Hide password' : 'Show password'}
                    >
                      {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="••••••••"
                      className={`${inputClasses} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title={showNewPass ? 'Hide password' : 'Show password'}
                    >
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs font-medium text-slate-400 mt-1">Must be at least 6 characters.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="••••••••"
                      className={`${inputClasses} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title={showConfirmPass ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-5 mt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleOpenConfirm('security')}
                  className="w-full sm:w-auto bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all min-h-[42px] cursor-pointer"
                >
                  <ShieldCheck size={16} /> 
                  <span>Update Password</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PREFERENCES & APPEARANCE */}
          {activeTab === 'preferences' && (
            <div className="w-full bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 animate-in fade-in duration-200 transition-colors">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 bg-[#D4AF37]/15 rounded-xl text-[#7A1B22] dark:text-[#D4AF37]">
                  <Globe size={20} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    App Preferences
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Adjust display appearance and system language
                  </p>
                </div>
              </div>

              {/* Theme Mode Selector Cards */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                  {theme === 'system' ? <Laptop size={16} className="text-blue-500" /> : isDark ? <Moon size={16} className="text-indigo-400" /> : <Sun size={16} className="text-amber-500" />}
                  <span>Theme Mode</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3.5">
                  Choose light mode, dark mode, or follow your phone/device appearance automatically.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Light Theme Button */}
                  <button
                    type="button"
                    onClick={() => handleThemeToggle('light')}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer min-h-[52px] text-left ${
                      theme === 'light' 
                        ? 'bg-white dark:bg-slate-800 border-[#7A1B22] dark:border-[#D4AF37] shadow-xs' 
                        : 'bg-slate-100 dark:bg-slate-800/80 border-transparent hover:border-slate-300 dark:hover:border-slate-700 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                        <Sun size={18} />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Light Mode</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Always light</p>
                      </div>
                    </div>
                    {theme === 'light' && (
                      <div className="w-5 h-5 rounded-full bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-950 flex items-center justify-center shrink-0">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                    )}
                  </button>

                  {/* Dark Theme Button */}
                  <button
                    type="button"
                    onClick={() => handleThemeToggle('dark')}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer min-h-[52px] text-left ${
                      theme === 'dark' 
                        ? 'bg-slate-800 border-[#D4AF37] shadow-xs' 
                        : 'bg-slate-100 dark:bg-slate-800/80 border-transparent hover:border-slate-300 dark:hover:border-slate-700 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-950 flex items-center justify-center text-indigo-400 shrink-0">
                        <Moon size={18} />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Dark Mode</p>
                        <p className="text-xs text-slate-400">Always dark</p>
                      </div>
                    </div>
                    {theme === 'dark' && (
                      <div className="w-5 h-5 rounded-full bg-[#D4AF37] text-slate-950 flex items-center justify-center shrink-0">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                    )}
                  </button>

                  {/* System Default Button */}
                  <button
                    type="button"
                    onClick={() => handleThemeToggle('system')}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer min-h-[52px] text-left ${
                      theme === 'system' 
                        ? 'bg-white dark:bg-slate-800 border-[#7A1B22] dark:border-[#D4AF37] shadow-xs' 
                        : 'bg-slate-100 dark:bg-slate-800/80 border-transparent hover:border-slate-300 dark:hover:border-slate-700 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <Laptop size={18} />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">System (Auto)</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Match phone settings</p>
                      </div>
                    </div>
                    {theme === 'system' && (
                      <div className="w-5 h-5 rounded-full bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-950 flex items-center justify-center shrink-0">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Language Selector Cards */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                  <Globe size={16} className="text-[#7A1B22] dark:text-[#D4AF37]" />
                  <span>Display Language</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3.5">
                  Select your preferred display language across the portal.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* English Language */}
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('en')}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer min-h-[52px] text-left ${
                      preferences.language === 'en'
                        ? 'bg-white dark:bg-slate-800 border-[#7A1B22] dark:border-[#D4AF37] shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800/80 border-transparent hover:border-slate-300 dark:hover:border-slate-700 opacity-70'
                    }`}
                  >
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">English (US)</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Default system language</p>
                    </div>
                    {preferences.language === 'en' && (
                      <div className="w-5 h-5 rounded-full bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-950 flex items-center justify-center shrink-0">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                    )}
                  </button>

                  {/* Filipino Language */}
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('fil')}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer min-h-[52px] text-left ${
                      preferences.language === 'fil'
                        ? 'bg-white dark:bg-slate-800 border-[#7A1B22] dark:border-[#D4AF37] shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800/80 border-transparent hover:border-slate-300 dark:hover:border-slate-700 opacity-70'
                    }`}
                  >
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Filipino / Tagalog</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Tagalog language</p>
                    </div>
                    {preferences.language === 'fil' && (
                      <div className="w-5 h-5 rounded-full bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-950 flex items-center justify-center shrink-0">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DIGITAL ID CARD */}
      {!isLoading && activeTab === 'idcard' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors animate-in fade-in duration-200 max-w-3xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 bg-[#7A1B22]/10 dark:bg-[#7A1B22]/20 rounded-xl text-[#7A1B22] dark:text-[#D4AF37]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Digital Operator ID
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your official LGU Gasan Digital Identification Card
              </p>
            </div>
          </div>
          
          <div className="py-4">
            <OperatorIdCard user={JSON.parse(localStorage.getItem('user') || '{}')} />
          </div>
          
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/50">
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-1">
              <AlertCircle size={14} /> Official Use Only
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-400/90 leading-relaxed">
              This digital ID card is an official document from the Municipality of Gasan. The QR code contains verifiable data used by LGU officers and traffic enforcers.
            </p>
          </div>
        </div>
      )}

      {/* TAB 5: DOCUMENT VAULT */}
      {!isLoading && activeTab === 'vault' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors animate-in fade-in duration-200 max-w-3xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 bg-[#7A1B22]/10 dark:bg-[#7A1B22]/20 rounded-xl text-[#7A1B22] dark:text-[#D4AF37]">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Document Vault
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Securely store and access your uploaded operator documents
              </p>
            </div>
          </div>
          
          <div className="py-10 text-center">
            <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Your Vault is Empty</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Any documents you submit during franchise application will be safely stored here for future reference.
            </p>
          </div>
        </div>
      )}

      {/* TAB 6: NOTIFICATIONS */}
      {!isLoading && activeTab === 'notifications' && (
        <div className="space-y-6 max-w-3xl animate-in fade-in duration-200">
          {/* Main Card: Device Push Notification Status & Toggle */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
            <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#7A1B22]/10 dark:bg-[#7A1B22]/20 rounded-xl text-[#7A1B22] dark:text-[#D4AF37]">
                  <Bell size={22} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Phone Push Notifications
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Real-time alerts sent to your phone lock screen &amp; status bar
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              {isPushSubscribed ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Active &amp; Subscribed</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Not Subscribed</span>
                </span>
              )}
            </div>

            {/* Browser Support or Permission Warning Alerts */}
            {!pushSupported && (
              <div className="mb-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3 text-amber-800 dark:text-amber-300">
                <Info size={18} className="shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <p className="font-bold">Push Notifications Not Supported</p>
                  <p className="mt-0.5 opacity-90">
                    This browser does not support web push notifications. To receive push alerts, please install G-TRAMS on your phone or use Google Chrome, Microsoft Edge, or Safari.
                  </p>
                </div>
              </div>
            )}

            {pushPermission === 'denied' && (
              <div className="mb-5 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 flex items-start gap-3 text-red-800 dark:text-red-300">
                <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <p className="font-bold">Notifications Blocked in Browser</p>
                  <p className="mt-0.5 opacity-90">
                    You have blocked notifications for G-TRAMS. To enable, tap the padlock / site settings icon beside the address bar and set <strong>Notifications</strong> to <strong>Allow</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Main Toggle Row */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[#7A1B22] dark:text-[#D4AF37] shrink-0 shadow-2xs">
                  <Smartphone size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Push Notifications on this Phone / Device
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Receive alert banners and sounds even when the G-TRAMS app is closed.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                {isPushLoading && <Loader2 size={18} className="animate-spin text-[#7A1B22] dark:text-[#D4AF37]" />}
                <button
                  type="button"
                  disabled={!pushSupported || isPushLoading}
                  onClick={handleTogglePushSubscription}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#7A1B22]/20 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isPushSubscribed ? 'bg-[#7A1B22] dark:bg-[#D4AF37]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  aria-label="Toggle push notifications on this device"
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isPushSubscribed ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Test Notification Row */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Subukan ang Notification (Test Alert)
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Magpadala ng agarang test alert upang masubukan kung tutunog at lalabas ang banner sa iyong telepono.
                </p>
              </div>

              <button
                type="button"
                disabled={!isPushSubscribed || isTestingPush}
                onClick={handleSendTestPush}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95 ${
                  isPushSubscribed
                    ? 'bg-[#7A1B22] hover:bg-[#601015] text-white dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] dark:text-slate-950'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                {isTestingPush ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Nagpapadala...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Send Test Push Alert</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preferences Card: Categories */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
                <Volume2 size={20} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Notification Categories
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Piliin kung anong mga uri ng abiso ang nais mong matanggap sa iyong telepono
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {/* Category 1: Status & Approvals */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="pr-4">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Franchise Status &amp; Approvals</span>
                  </h4>
                  <p className="text-xs sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Abiso kapag na-approve, for inspection, o may kinakailangang compliance sa iyong aplikasyon ng prangkisa.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePushPreference('statusUpdates')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    pushPreferences.statusUpdates ? 'bg-[#7A1B22] dark:bg-[#D4AF37]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      pushPreferences.statusUpdates ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Category 2: Renewal Reminders */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="pr-4">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Renewal Reminders &amp; Deadlines</span>
                  </h4>
                  <p className="text-xs sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Maagang paalala bago mag-expire ang iyong prangkisa upang makaiwas sa penalty at suspension.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePushPreference('renewalReminders')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    pushPreferences.renewalReminders ? 'bg-[#7A1B22] dark:bg-[#D4AF37]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      pushPreferences.renewalReminders ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Category 3: TODA & Municipal Advisories */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="pr-4">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>TODA &amp; Municipal Transport Advisories</span>
                  </h4>
                  <p className="text-xs sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Mga anunsyo mula sa Sangguniang Bayan, LGU Gasan, at TODA President tungkol sa ruta, taripa, at pagpupulong.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePushPreference('announcements')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    pushPreferences.announcements ? 'bg-[#7A1B22] dark:bg-[#D4AF37]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      pushPreferences.announcements ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Explanatory footer note */}
            <div className="mt-5 p-3.5 bg-[#7A1B22]/5 dark:bg-[#7A1B22]/10 rounded-2xl border border-[#7A1B22]/15 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
              <Sparkles size={16} className="text-[#7A1B22] dark:text-[#D4AF37] shrink-0 mt-0.5" />
              <p>
                <strong>Paalala:</strong> Kapag naka-install ang G-TRAMS bilang PWA sa iyong telepono (Add to Home Screen), matatanggap mo ang lahat ng mga abisong ito tulad ng isang regular na mobile app kahit nakapatay ang screen ng iyong telepono.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ACCOUNT SESSION & LOGOUT SECTION */}
      {!isLoading && (
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <LogOut size={16} className="text-slate-500" />
              <span>Account Session</span>
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Safely log out to end your current active portal session on this device.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 border border-red-100 dark:border-red-900/50 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut size={16} />
            <span>Log Out of Portal</span>
          </button>
        </div>
      )}

      {/* SAVE CHANGES CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !isProcessing && setConfirmModal({ isOpen: false, type: null })}
          />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3.5 bg-[#7A1B22]/10 dark:bg-[#7A1B22]/25 text-[#7A1B22] dark:text-[#D4AF37] border border-[#7A1B22]/20 shadow-xs">
              <Save size={22} />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5 tracking-tight">
              {confirmModal.type === 'profile' ? 'Save Profile Changes?' : 'Confirm Password Change?'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
              {confirmModal.type === 'profile'
                ? 'Are you sure you want to save these updated details to your profile?'
                : 'Are you sure you want to update your account password?'}
            </p>

            <div className="flex flex-col-reverse sm:flex-row items-stretch gap-2.5">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setConfirmModal({ isOpen: false, type: null })}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs sm:text-sm min-h-[42px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSave}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-white bg-[#7A1B22] hover:bg-[#5A1419] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] dark:text-slate-950 transition-all text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 min-h-[42px] cursor-pointer active:scale-95"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Confirm Save</span>
                  </>
                )}
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

export default OperatorSettings;

