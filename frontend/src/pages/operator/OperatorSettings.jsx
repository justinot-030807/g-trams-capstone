import React, { useState, useEffect, useRef } from 'react';
import { GASAN_BARANGAYS, TODA_LIST } from '../../utils/constants';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/MainLayout';
import { 
  User, Lock, Camera, Save, Loader2, Phone, 
  CheckCircle2, AlertCircle, Moon, Sun, Globe, 
  ShieldCheck, MapPin, Hash, Shield, Car, Check, LogOut,
  Eye, EyeOff
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { SettingsSkeleton } from '../../components/skeleton';
import FeedbackModal from '../../components/common/FeedbackModal';



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
      setProfilePicFile(file);
      setProfilePicPreview(URL.createObjectURL(file));
    }
  };

  const handleOpenConfirm = (type) => {
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
    showToast(newTheme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled', 'success');
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setPreferences(prev => ({ ...prev, language: newLang }));
    localStorage.setItem('gtrams_lang', newLang);
    showToast(newLang === 'fil' ? 'Language set to Filipino' : 'Language set to English', 'success');
  };

  const inputClasses = "w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#7A1B22] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-[#7A1B22]/15 transition-all shadow-2xs";
  const lockedClasses = "w-full bg-slate-100/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed select-none";

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
        <div className="space-y-6 max-w-5xl pb-28 sm:pb-24">
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
          </div>

          {/* TAB 1: PROFILE & CONTACT DETAILS */}
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors animate-in fade-in duration-200 max-w-3xl">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 bg-[#7A1B22]/10 dark:bg-[#7A1B22]/20 rounded-xl text-[#7A1B22] dark:text-[#D4AF37]">
                  <User size={20} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Operator Information
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Update personal details and registered Contact Phone Number
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
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                  Select a clear photo of your face (JPG or PNG)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className={inputClasses}
                    required
                    placeholder="Full Name of Operator"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Contact Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="tel"
                      inputMode="tel"
                      value={profileData.contact}
                      onChange={(e) => setProfileData(prev => ({ ...prev, contact: e.target.value }))}
                      className={`${inputClasses} pl-10`}
                      required
                      placeholder="e.g. 0912 345 6789"
                    />
                  </div>
                  <p className="text-[11px] font-medium text-slate-400 mt-1">BPLO will use this Contact Phone Number for notices and official updates.</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      TODA Association
                    </label>
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800/80">
                      Locked (Official)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={profileData.todaAssociation}
                    readOnly
                    title="Registered TODA is permanent. Visit LGU office for TODA transfer."
                    className={lockedClasses}
                  />
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">Contact the BPLO office for any TODA reassignment.</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Registered Barangay
                    </label>
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800/80">
                      Locked (Official)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={profileData.address}
                    readOnly
                    title="Official registered address cannot be self-edited. Contact BPLO for changes."
                    className={lockedClasses}
                  />
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">Recorded in the official municipal registry of Gasan.</p>
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
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors animate-in fade-in duration-200 max-w-2xl">
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer rounded-lg"
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer rounded-lg"
                      title={showNewPass ? 'Hide password' : 'Show password'}
                    >
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-[11px] font-medium text-slate-400 mt-1">Must be at least 6 characters.</p>
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer rounded-lg"
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
            <div className="max-w-2xl bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 animate-in fade-in duration-200 transition-colors">
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
                  {isDark ? <Moon size={16} className="text-indigo-400" /> : <Sun size={16} className="text-amber-500" />}
                  <span>Theme Mode</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3.5">
                  Choose light or dark mode for comfortable reading.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Light Theme Button */}
                  <button
                    type="button"
                    onClick={() => handleThemeToggle('light')}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer min-h-[52px] text-left ${
                      !isDark 
                        ? 'bg-white border-[#7A1B22] dark:border-[#D4AF37] shadow-xs' 
                        : 'bg-slate-100 dark:bg-slate-800/80 border-transparent hover:border-slate-300 dark:hover:border-slate-700 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <Sun size={18} />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Light Mode</p>
                        <p className="text-[11px] text-slate-500">Clean light background</p>
                      </div>
                    </div>
                    {!isDark && (
                      <div className="w-5 h-5 rounded-full bg-[#7A1B22] text-white flex items-center justify-center shrink-0">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                    )}
                  </button>

                  {/* Dark Theme Button */}
                  <button
                    type="button"
                    onClick={() => handleThemeToggle('dark')}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer min-h-[52px] text-left ${
                      isDark 
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
                        <p className="text-[11px] text-slate-400">Easy on the eyes in low light</p>
                      </div>
                    </div>
                    {isDark && (
                      <div className="w-5 h-5 rounded-full bg-[#D4AF37] text-slate-950 flex items-center justify-center shrink-0">
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
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Default system language</p>
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
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Tagalog language</p>
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

      {/* ACCOUNT SESSION & LOGOUT SECTION */}
      {!isLoading && (
        <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-red-50/70 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div>
            <h4 className="text-sm font-bold text-red-800 dark:text-red-300 flex items-center gap-2">
              <LogOut size={16} />
              <span>Account Session</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium max-w-xl">
              Safely log out to end your current active portal session on this device.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-xs shrink-0 flex items-center justify-center gap-2 min-h-[42px] cursor-pointer"
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
