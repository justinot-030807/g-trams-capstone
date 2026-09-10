import React, { useState, useEffect, useRef } from 'react';
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

const GASAN_BARANGAYS = [
  "Antipolo", "Bachao Ibaba", "Bachao Ilaya", "Bacong-Bacong", "Bahi", 
  "Bangbang", "Banot", "Banuyo", "Bognuyan", "Cabugao", "Dawis", "Dili", 
  "Libtangin", "Mahunig", "Mangiliol", "Masiga", "Matandang Gasan", "Pangi", 
  "Pinggan", "Tabionan", "Tiguion", "Tremol", "Tulingon", 
  "Barangay I (Poblacion)", "Barangay II (Poblacion)", "Barangay III (Poblacion)"
];

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

  // Confirmation modal and toast
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

  const inputClasses = "w-full bg-slate-50 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-slate-700/80 rounded-2xl px-4 py-3.5 text-base font-bold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#7A1B22] dark:focus:border-[#D4AF37] focus:ring-4 focus:ring-[#7A1B22]/15 transition-all shadow-2xs";
  const lockedClasses = "w-full bg-slate-100/90 dark:bg-slate-800/50 border-2 border-slate-200/80 dark:border-slate-700/60 rounded-2xl px-4 py-3.5 text-base font-bold text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed select-none";

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
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Mga Setting (Settings)</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">
            {t('profile.subtitle', 'Pamahalaan ang profile, seguridad ng account, at mga kagustuhan.')}
          </p>
        </div>
      </div>

      {isLoading ? (
        <SettingsSkeleton />
      ) : (
        <div className="space-y-6 max-w-5xl pb-28 sm:pb-24">
          {/* TAB NAVIGATION PILLS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl w-full">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl font-black text-xs sm:text-sm transition-all min-h-[48px] cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-white dark:bg-slate-800 text-[#7A1B22] dark:text-[#D4AF37] shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User size={18} />
              <span>{language === 'fil' ? 'Profile at Impormasyon' : t('profile.publicInfo', 'Profile & Contact')}</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl font-black text-xs sm:text-sm transition-all min-h-[48px] cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-white dark:bg-slate-800 text-[#7A1B22] dark:text-[#D4AF37] shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Lock size={18} />
              <span>{language === 'fil' ? 'Seguridad at Password' : t('profile.changePassword', 'Account Security')}</span>
            </button>

            <button
              onClick={() => setActiveTab('preferences')}
              className={`flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl font-black text-xs sm:text-sm transition-all min-h-[48px] cursor-pointer ${
                activeTab === 'preferences'
                  ? 'bg-white dark:bg-slate-800 text-[#7A1B22] dark:text-[#D4AF37] shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe size={18} />
              <span>{language === 'fil' ? 'Wika at Hitsura' : t('profile.preferencesTitle', 'Preferences & Appearance')}</span>
            </button>
          </div>

          {/* TAB 1: PROFILE & CONTACT DETAILS */}
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors animate-in fade-in duration-200 max-w-3xl">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2.5 bg-[#7A1B22]/10 dark:bg-[#7A1B22]/20 rounded-2xl text-[#7A1B22] dark:text-[#D4AF37]">
                  <User size={24} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {language === 'fil' ? 'Impormasyon ng Operator' : t('profile.publicInfo', 'Operator Information')}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    {language === 'fil' ? 'I-update ang personal na detalye at numero ng telepono' : 'Update personal details and registered contact numbers'}
                  </p>
                </div>
              </div>

              {/* Profile Photo Upload */}
              <div className="flex flex-col items-center mb-8 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-3xl border border-slate-200/70 dark:border-slate-700/60">
                <div className="w-28 h-28 rounded-full border-4 border-[#D4AF37] shadow-md overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative">
                  {profilePicPreview ? (
                    <img src={profilePicPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={48} className="text-slate-300 dark:text-slate-600" />
                  )}
                </div>
                <label className="mt-4 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-xs sm:text-sm cursor-pointer active:scale-95 transition-all border-2 border-slate-200 dark:border-slate-700 shadow-2xs min-h-[46px]">
                  <Camera size={18} className="text-[#7A1B22] dark:text-[#D4AF37]" />
                  <span>{language === 'fil' ? 'Palitan ang Litrato (Change Photo)' : 'Change Profile Photo'}</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                  {t('profile.uploadPhotoHint', 'Pumili ng malinaw na litrato ng inyong mukha (JPG / PNG)')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    {language === 'fil' ? 'Buong Pangalan (Full Name)' : t('profile.fullName', 'Full Name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className={inputClasses}
                    required
                    placeholder="Pangalan ng Operator"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    {language === 'fil' ? 'Numero ng Telepono / Mobile Phone' : t('profile.contact', 'Contact Phone / Email')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="tel"
                      inputMode="tel"
                      value={profileData.contact}
                      onChange={(e) => setProfileData(prev => ({ ...prev, contact: e.target.value }))}
                      className={`${inputClasses} pl-12`}
                      required
                      placeholder="Hal. 0912 345 6789"
                    />
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 mt-1">Dito kayo kokontakin ng BPLO para sa mga anunsyo at updates.</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {language === 'fil' ? 'Samahan ng TODA' : t('profile.toda', 'TODA Association')}
                    </label>
                    <span className="text-[11px] font-black text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-lg border border-amber-300 dark:border-amber-800/80">
                      Naka-lock (Official)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={profileData.todaAssociation}
                    readOnly
                    title="Registered TODA is permanent. Visit LGU office for TODA transfer."
                    className={lockedClasses}
                  />
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">Pumunta sa Tanggapan ng BPLO kung kailangang ilipat ang TODA.</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {language === 'fil' ? 'Rehistradong Barangay' : t('profile.address', 'Registered Barangay')}
                    </label>
                    <span className="text-[11px] font-black text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-lg border border-amber-300 dark:border-amber-800/80">
                      Naka-lock (Official)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={profileData.address}
                    readOnly
                    title="Official registered address cannot be self-edited. Contact BPLO for changes."
                    className={lockedClasses}
                  />
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">Nakatala sa opisyal na rekord ng Munisipalidad ng Gasan.</p>
                </div>
              </div>

              <div className="flex justify-end pt-6 mt-8 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleOpenConfirm('profile')}
                  className="w-full sm:w-auto bg-[#7A1B22] hover:bg-[#5A1419] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] text-white dark:text-slate-950 px-8 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer min-h-[48px]"
                >
                  <Save size={18} /> 
                  <span>{language === 'fil' ? 'I-save ang mga Pagbabago' : t('profile.saveBtn', 'Save Information')}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ACCOUNT SECURITY */}
          {activeTab === 'security' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors animate-in fade-in duration-200 max-w-2xl">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400">
                  <Lock size={24} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {language === 'fil' ? 'Password ng Account' : t('profile.changePassword', 'Account Password')}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    {language === 'fil' ? 'Siguraduhing ligtas ang iyong account sa pamamagitan ng bagong password' : 'Keep your account secure with a strong password'}
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    {language === 'fil' ? 'Kasalukuyang Password (Current Password)' : t('profile.currentPassword', 'Current Password')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="••••••••"
                      className={`${inputClasses} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 cursor-pointer rounded-xl"
                      title={showCurrentPass ? 'Itago ang password' : 'Ipakita ang password'}
                    >
                      {showCurrentPass ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    {language === 'fil' ? 'Bagong Password (New Password)' : t('profile.newPassword', 'New Password')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="••••••••"
                      className={`${inputClasses} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 cursor-pointer rounded-xl"
                      title={showNewPass ? 'Itago ang password' : 'Ipakita ang password'}
                    >
                      {showNewPass ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 mt-1">Dapat ay hindi bababa sa 6 na karakter (At least 6 characters).</p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    {language === 'fil' ? 'Ulitin ang Bagong Password (Confirm New Password)' : t('profile.confirmNewPassword', 'Confirm New Password')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="••••••••"
                      className={`${inputClasses} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 cursor-pointer rounded-xl"
                      title={showConfirmPass ? 'Itago ang password' : 'Ipakita ang password'}
                    >
                      {showConfirmPass ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 mt-8 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleOpenConfirm('security')}
                  className="w-full sm:w-auto bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white px-8 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all min-h-[48px] cursor-pointer"
                >
                  <ShieldCheck size={18} /> 
                  <span>{language === 'fil' ? 'Palitan ang Password' : t('profile.updatePasswordBtn', 'Update Password')}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PREFERENCES & APPEARANCE */}
          {activeTab === 'preferences' && (
            <div className="max-w-2xl bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in duration-200 transition-colors">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2.5 bg-[#D4AF37]/15 rounded-2xl text-[#7A1B22] dark:text-[#D4AF37]">
                  <Globe size={24} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {language === 'fil' ? 'Kagustuhan at Hitsura' : t('profile.preferencesTitle', 'App Preferences')}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    {language === 'fil' ? 'I-adjust ang kulay ng screen at lengguwahe' : 'Adjust display appearance and language'}
                  </p>
                </div>
              </div>

              {/* Theme Mode Selector Cards */}
              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border-2 border-slate-200/80 dark:border-slate-700/60">
                <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                  {isDark ? <Moon size={18} className="text-indigo-400" /> : <Sun size={18} className="text-amber-500" />}
                  <span>{language === 'fil' ? 'Tema ng Kulay (Screen Theme)' : t('profile.theme', 'Theme Mode')}</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  {language === 'fil' ? 'Pumili sa Maliwanag (Light) o Madilim (Dark) para sa komportableng pagbasa.' : 'Choose light or dark mode for comfortable reading.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Light Theme Button */}
                  <button
                    type="button"
                    onClick={() => handleThemeToggle('light')}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer min-h-[60px] text-left ${
                      !isDark 
                        ? 'bg-white border-[#7A1B22] dark:border-[#D4AF37] shadow-sm' 
                        : 'bg-slate-100 dark:bg-slate-800/80 border-transparent hover:border-slate-300 dark:hover:border-slate-700 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                        <Sun size={22} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">Maliwanag (Light)</p>
                        <p className="text-[11px] font-bold text-slate-500">Puting Background</p>
                      </div>
                    </div>
                    {!isDark && (
                      <div className="w-6 h-6 rounded-full bg-[#7A1B22] text-white flex items-center justify-center">
                        <Check size={14} className="stroke-[3]" />
                      </div>
                    )}
                  </button>

                  {/* Dark Theme Button */}
                  <button
                    type="button"
                    onClick={() => handleThemeToggle('dark')}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer min-h-[60px] text-left ${
                      isDark 
                        ? 'bg-slate-800 border-[#D4AF37] shadow-sm' 
                        : 'bg-slate-100 dark:bg-slate-800/80 border-transparent hover:border-slate-300 dark:hover:border-slate-700 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-950 flex items-center justify-center text-indigo-400">
                        <Moon size={22} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">Madilim (Dark)</p>
                        <p className="text-[11px] font-bold text-slate-400">Madilim sa Mata</p>
                      </div>
                    </div>
                    {isDark && (
                      <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-slate-950 flex items-center justify-center">
                        <Check size={14} className="stroke-[3]" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Language Selector Cards */}
              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border-2 border-slate-200/80 dark:border-slate-700/60">
                <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                  <Globe size={18} className="text-[#7A1B22] dark:text-[#D4AF37]" />
                  <span>{language === 'fil' ? 'Wika ng Sistema (Language)' : t('profile.language', 'Display Language')}</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  {language === 'fil' ? 'Pumili sa Tagalog/Filipino o Ingles para sa lahat ng teksto.' : 'Select preferred display language across the portal.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Filipino Language */}
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('fil')}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer min-h-[60px] text-left ${
                      preferences.language === 'fil'
                        ? 'bg-white dark:bg-slate-800 border-[#7A1B22] dark:border-[#D4AF37] shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800/80 border-transparent hover:border-slate-300 dark:hover:border-slate-700 opacity-70'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">Filipino / Tagalog</p>
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Wikang Pambansa</p>
                    </div>
                    {preferences.language === 'fil' && (
                      <div className="w-6 h-6 rounded-full bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-950 flex items-center justify-center">
                        <Check size={14} className="stroke-[3]" />
                      </div>
                    )}
                  </button>

                  {/* English Language */}
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('en')}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer min-h-[60px] text-left ${
                      preferences.language === 'en'
                        ? 'bg-white dark:bg-slate-800 border-[#7A1B22] dark:border-[#D4AF37] shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800/80 border-transparent hover:border-slate-300 dark:hover:border-slate-700 opacity-70'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">English (US)</p>
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Standard English</p>
                    </div>
                    {preferences.language === 'en' && (
                      <div className="w-6 h-6 rounded-full bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-950 flex items-center justify-center">
                        <Check size={14} className="stroke-[3]" />
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
        <div className="mt-8 p-5 sm:p-6 rounded-3xl bg-red-50/80 dark:bg-red-950/30 border-2 border-red-200/90 dark:border-red-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div>
            <h4 className="text-base font-black text-red-800 dark:text-red-300 flex items-center gap-2">
              <LogOut size={20} className="stroke-[2.5]" />
              <span>{language === 'fil' ? 'Sesyon ng Account (Account Session)' : 'Account Session'}</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium max-w-xl">
              {language === 'fil' 
                ? 'Ligtas na mag-logout upang tapusin ang iyong kasalukuyang sesyon sa portal.' 
                : 'Safely log out to end your current active portal session on this device.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-sm text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-md shrink-0 flex items-center justify-center gap-2.5 min-h-[48px] cursor-pointer"
          >
            <LogOut size={18} className="stroke-[2.5]" />
            <span>{language === 'fil' ? 'Mag-logout sa Portal' : 'Log Out of Portal'}</span>
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
          <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 text-center animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-[#7A1B22]/10 dark:bg-[#7A1B22]/25 text-[#7A1B22] dark:text-[#D4AF37] border-2 border-[#7A1B22]/20 shadow-sm">
              <Save size={28} />
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
              {confirmModal.type === 'profile'
                ? (language === 'fil' ? 'I-save ang mga Pagbabago?' : t('profile.saveConfirmTitle', 'Save Profile Changes?'))
                : (language === 'fil' ? 'Kumpirmahin ang Bagong Password?' : t('profile.confirmTitle', 'Confirm Password Change?'))}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              {confirmModal.type === 'profile'
                ? (language === 'fil' ? 'Sigurado ka ba na nais mong i-save ang mga bagong impormasyon sa iyong profile?' : t('profile.saveConfirmDesc', 'Are you sure you want to save these changes to your profile?'))
                : (language === 'fil' ? 'Sigurado ka ba na nais mong palitan ang iyong account password?' : t('profile.confirmPassDesc', 'Are you sure you want to change your account password?'))}
            </p>

            <div className="flex flex-col-reverse sm:flex-row items-stretch gap-3">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setConfirmModal({ isOpen: false, type: null })}
                className="flex-1 py-3.5 px-4 rounded-2xl font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm min-h-[48px] cursor-pointer"
              >
                {language === 'fil' ? 'Kanselahin (Cancel)' : t('profile.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={executeSave}
                disabled={isProcessing}
                className="flex-1 py-3.5 px-4 rounded-2xl font-black text-white bg-[#7A1B22] hover:bg-[#5A1419] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] dark:text-slate-950 transition-all text-sm shadow-md shadow-[#7A1B22]/20 flex items-center justify-center gap-2 min-h-[48px] cursor-pointer active:scale-95"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Nagsusumite...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>{language === 'fil' ? 'Oo, I-save' : t('profile.confirmSaveBtn', 'Confirm Save')}</span>
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
