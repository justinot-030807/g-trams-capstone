import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '../../components/MainLayout';
import { 
  User, Lock, Camera, Save, Loader2, Phone, 
  CheckCircle2, AlertCircle, Moon, Sun, Globe, 
  ShieldCheck, MapPin, Hash, Shield, Car, Check
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const GASAN_BARANGAYS = [
  "Antipolo", "Bachao Ibaba", "Bachao Ilaya", "Bacong-Bacong", "Bahi", 
  "Bangbang", "Banot", "Banuyo", "Bognuyan", "Cabugao", "Dawis", "Dili", 
  "Libtangin", "Mahunig", "Mangiliol", "Masiga", "Matandang Gasan", "Pangi", 
  "Pinggan", "Tabionan", "Tiguion", "Tremol", "Tulingon", 
  "Barangay I (Poblacion)", "Barangay II (Poblacion)", "Barangay III (Poblacion)"
];

const OperatorSettings = () => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'preferences'
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // TAB 1: PROFILE & CONTACT DETAILS
  const [profileData, setProfileData] = useState({
    name: '',
    contact: '',
    address: 'Municipality of Gasan',
    todaAssociation: 'NON-TODA'
  });
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);

  // TAB 2: SECURITY & PASSWORD
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // TAB 3: PREFERENCES
  const [preferences, setPreferences] = useState({
    theme: localStorage.getItem('theme') || 'light',
    language: localStorage.getItem('gtrams_lang') || language || 'en'
  });

  // CONFIRMATION MODAL & TOAST
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null });
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

  // LOAD PROFILE ON MOUNT
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
            if (dbUser.theme && dbUser.theme !== savedTheme) {
              setTheme(dbUser.theme);
            }
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
          showToast(t('profile.successProfile', 'Profile details updated successfully!'), 'success');
        } else {
          showToast(t('profile.failedSave', 'Failed to save profile.'), 'error');
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
          showToast(t('profile.successPass', 'Password changed successfully!'), 'success');
        } else {
          const errData = await res.json();
          showToast(errData.message || t('profile.failedPass', 'Failed to change password.'), 'error');
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
    showToast(newTheme === 'dark' ? (language === 'fil' ? 'Madilim na Tema (Dark Mode) inilapat' : 'Dark Mode activated') : (language === 'fil' ? 'Maliwanag na Tema (Light Mode) inilapat' : 'Light Mode activated'), 'success');
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setPreferences(prev => ({ ...prev, language: newLang }));
    localStorage.setItem('gtrams_lang', newLang);
    showToast(newLang === 'fil' ? 'Inilapat ang wikang Filipino' : 'Language set to English', 'success');
  };

  const inputClasses = "w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#7A1B22] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-[#7A1B22]/15 transition-all";
  const lockedClasses = "w-full bg-slate-100 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed select-none";

  return (
    <MainLayout>
      {/* Centered Auto-Dismiss Floating Toast */}
      {toast.show && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md ${
            toast.type === 'error' 
              ? 'bg-red-600/95 border-red-500 text-white shadow-red-950/30' 
              : 'bg-emerald-600/95 border-emerald-500 text-white shadow-emerald-950/30'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle size={20} className="shrink-0 text-white animate-pulse" />
            ) : (
              <CheckCircle2 size={20} className="shrink-0 text-white" />
            )}
            <span className="font-bold text-xs sm:text-sm tracking-wide">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Standard Slim Vertical Accent Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-[#7A1B22] rounded-full" />
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {t('profile.subtitle', 'Manage your account, preferences, and security configurations.')}
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
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'bg-white dark:bg-slate-800 text-[#7A1B22] dark:text-[#D4AF37] shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User size={16} />
              <span>{t('profile.publicInfo', 'Profile & Contact')}</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                activeTab === 'security'
                  ? 'bg-white dark:bg-slate-800 text-[#7A1B22] dark:text-[#D4AF37] shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Lock size={16} />
              <span>{t('profile.changePassword', 'Account Security')}</span>
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
              <span>{t('profile.preferencesTitle', 'Preferences & Appearance')}</span>
            </button>
          </div>

          {/* TAB 1: PROFILE & CONTACT DETAILS */}
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors animate-in fade-in duration-200 max-w-3xl">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 bg-[#7A1B22]/10 dark:bg-[#7A1B22]/20 rounded-xl">
                  <User size={20} className="text-[#7A1B22] dark:text-[#D4AF37]" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">{t('profile.publicInfo', 'Operator Information')}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Update personal and official franchise registry details</p>
                </div>
              </div>

              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full border-4 border-[#D4AF37]/40 shadow-md overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative group">
                  {profilePicPreview ? (
                    <img src={profilePicPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} className="text-slate-300 dark:text-slate-600" />
                  )}
                  <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                    <Camera size={20} className="mb-0.5" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Change</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">{t('profile.uploadPhotoHint', 'Click to upload photo (JPG / PNG)')}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {t('profile.fullName', 'Full Name')}
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className={inputClasses}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {t('profile.contact', 'Contact Phone / Email')}
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={profileData.contact}
                      onChange={(e) => setProfileData(prev => ({ ...prev, contact: e.target.value }))}
                      className={`${inputClasses} pl-10`}
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {t('profile.toda', 'TODA Association')}
                    </label>
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
                      {t('profile.locked', 'Locked')}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={profileData.todaAssociation}
                    readOnly
                    title="Registered TODA is permanent. Visit LGU office for TODA transfer."
                    className={lockedClasses}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {t('profile.address', 'Registered Barangay')}
                    </label>
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
                      {t('profile.locked', 'Locked')}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={profileData.address}
                    readOnly
                    title="Official registered address cannot be self-edited. Contact BPLO for changes."
                    className={lockedClasses}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleOpenConfirm('profile')}
                  className="w-full sm:w-auto bg-[#7A1B22] hover:bg-[#5A1419] text-white px-8 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all"
                >
                  <Save size={16} /> {t('profile.saveBtn', 'Save Information')}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ACCOUNT SECURITY */}
          {activeTab === 'security' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors animate-in fade-in duration-200 max-w-xl">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60">
                  <Lock size={20} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">{t('profile.changePassword', 'Account Password')}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Keep your account secure with a strong password</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {t('profile.currentPassword', 'Current Password')}
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
                    {t('profile.newPassword', 'New Password')}
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
                    {t('profile.confirmNewPassword', 'Confirm New Password')}
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

              <div className="flex justify-end pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleOpenConfirm('security')}
                  className="w-full sm:w-auto bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all"
                >
                  <ShieldCheck size={16} /> {t('profile.updatePasswordBtn', 'Update Password')}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PREFERENCES & APPEARANCE */}
          {activeTab === 'preferences' && (
            <div className="max-w-2xl bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 animate-in fade-in duration-200 transition-colors">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <Globe size={20} className="text-[#D4AF37]" />
                <h2 className="text-base font-black text-slate-900 dark:text-white">{t('profile.preferencesTitle', 'App Preferences')}</h2>
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {isDark ? <Moon size={16} className="text-indigo-400" /> : <Sun size={16} className="text-amber-500" />}
                    {t('profile.theme', 'Theme Mode')}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {isDark ? t('profile.themeDark', 'Dark Mode') : t('profile.themeLight', 'Light Mode')} — {t('profile.themeDesc', 'Toggle light or dark mode styling')}
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
                    {t('profile.language', 'Display Language')}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('profile.languageDesc', 'Select preferred system language')}
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
            </div>
          )}
        </div>
      )}

      {/* SAVE CHANGES CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !isProcessing && setConfirmModal({ isOpen: false, type: null })}
          />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 sm:p-7 text-center animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-[#7A1B22]/10 dark:bg-[#7A1B22]/25 text-[#7A1B22] dark:text-[#D4AF37] border border-[#7A1B22]/20 shadow-sm">
              <Save size={24} />
            </div>

            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1.5 tracking-tight">
              {confirmModal.type === 'profile'
                ? t('profile.saveConfirmTitle', 'Save Profile Changes?')
                : t('profile.confirmTitle', 'Confirm Password Change?')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              {confirmModal.type === 'profile'
                ? t('profile.saveConfirmDesc', 'Are you sure you want to save these changes to your profile?')
                : t('profile.confirmPassDesc', 'Are you sure you want to change your account password?')}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setConfirmModal({ isOpen: false, type: null })}
                className="flex-1 py-3 rounded-xl font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs"
              >
                {t('profile.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={executeSave}
                disabled={isProcessing}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-[#7A1B22] hover:bg-[#5A1419] transition-all text-xs shadow-md shadow-[#7A1B22]/20 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>{t('profile.confirmSaveBtn', 'Confirm Save')}</span>
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

export default OperatorSettings;
