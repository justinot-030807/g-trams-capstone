import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '../../components/MainLayout';
import { 
  User, Lock, Camera, Save, Loader2, Phone, 
  AlertTriangle, CheckCircle2, AlertCircle, Moon, Sun, Globe 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const ManageProfile = () => {
  const { language, setLanguage, t } = useLanguage();
  const [profileData, setProfileData] = useState({ name: '', contact: '', address: '', todaAssociation: 'NON-TODA' });
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  // App Preferences State (Dark Mode & Language)
  const [preferences, setPreferences] = useState(() => {
    const savedTheme = localStorage.getItem('gtrams_theme') || localStorage.getItem('theme') || 'light';
    const savedLang = localStorage.getItem('gtrams_lang') || 'en';
    return { theme: savedTheme, language: savedLang };
  });

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null });
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Floating Toast Notification State
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

  useEffect(() => {
    // I-load ang saved Preferences (Dark Mode at Language)
    const savedTheme = localStorage.getItem('gtrams_theme') || localStorage.getItem('theme') || 'light';
    const savedLang = localStorage.getItem('gtrams_lang') || language || 'en';
    setPreferences({ theme: savedTheme, language: savedLang });

    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const fetchProfileData = async () => {
      setIsLoadingData(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/auth/profile', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const dbUser = await response.json();
          setProfileData({
            name: dbUser.name || dbUser.fullName || '',
            contact: dbUser.contact || '',
            address: dbUser.address || 'Municipality of Gasan',
            todaAssociation: dbUser.todaAssociation || 'NON-TODA'
          });
          
          if (dbUser.profilePic) setProfilePicPreview(dbUser.profilePic);
          if (dbUser.language) {
            setPreferences(prev => ({ ...prev, language: dbUser.language }));
            setLanguage(dbUser.language);
          }
          if (dbUser.theme) {
            setPreferences(prev => ({ ...prev, theme: dbUser.theme }));
            localStorage.setItem('gtrams_theme', dbUser.theme);
            localStorage.setItem('theme', dbUser.theme);
            if (dbUser.theme === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }
          
          localStorage.setItem('name', dbUser.name || dbUser.fullName || '');
          localStorage.setItem('user', JSON.stringify(dbUser));
        }
      } catch (error) {
        console.error("Fetch profile error", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchProfileData();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicFile(file);
      setProfilePicPreview(URL.createObjectURL(file)); 
    }
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setConfirmModal({ isOpen: true, type: 'profile' });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast(t('profile.passMismatch', 'New passwords do not match!'), 'error');
      return;
    }
    setConfirmModal({ isOpen: true, type: 'password' });
  };

  const executeAction = async () => {
    setIsProcessing(true);

    if (confirmModal.type === 'profile') {
      try {
        const formData = new FormData();
        formData.append('name', profileData.name);
        formData.append('contact', profileData.contact);
        formData.append('address', profileData.address);
        formData.append('todaAssociation', profileData.todaAssociation);
        formData.append('language', preferences.language);
        formData.append('theme', preferences.theme);
        
        if (profilePicFile) formData.append('profilePic', profilePicFile);

        const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/auth/profile', {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: formData 
        });

        if (response.ok) {
          const updatedUser = await response.json();
          localStorage.setItem('user', JSON.stringify(updatedUser));
          localStorage.setItem('name', updatedUser.name || profileData.name);
          if (updatedUser.language) {
            setLanguage(updatedUser.language);
          }
          
          setConfirmModal({ isOpen: false, type: null });
          showToast(t('profile.successProfile', 'Profile details updated successfully!'), 'success');
        } else {
          showToast(t('profile.failedSave', 'Failed to save profile.'), 'error');
          setConfirmModal({ isOpen: false, type: null });
        }
      } catch (error) {
        showToast('Network Error.', 'error');
        setConfirmModal({ isOpen: false, type: null });
      }
    } else if (confirmModal.type === 'password') {
      try {
        const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/auth/change-password', {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ oldPassword: passwordData.currentPassword, newPassword: passwordData.newPassword })
        });

        if (response.ok) {
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setConfirmModal({ isOpen: false, type: null });
          showToast(t('profile.successPass', 'Password changed successfully!'), 'success');
        } else {
          const data = await response.json();
          showToast(data.message || t('profile.failedPass', 'Failed to change password.'), 'error');
          setConfirmModal({ isOpen: false, type: null });
        }
      } catch (error) {
        showToast('Network Error.', 'error');
        setConfirmModal({ isOpen: false, type: null });
      }
    }

    setIsProcessing(false);
  };

  // I-save ang User System Preferences sa mismong browser at database
  const savePreferences = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    localStorage.setItem(`gtrams_${key}`, value);

    if (key === 'language') {
      setLanguage(value);
      showToast(value === 'fil' ? 'Inilapat ang wikang Filipino' : 'Language set to English', 'success');
    }

    if (key === 'theme') {
      localStorage.setItem('theme', value);
      if (value === 'dark') {
        document.documentElement.classList.add('dark');
        showToast((language === 'fil' ? 'Madilim na Tema (Dark Mode) inilapat' : 'Dark Mode activated'), 'success');
      } else {
        document.documentElement.classList.remove('dark');
        showToast((language === 'fil' ? 'Maliwanag na Tema (Light Mode) inilapat' : 'Light Mode activated'), 'success');
      }
      
      const token = localStorage.getItem('token');
      if (token) {
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ theme: value })
        }).catch(err => console.error('Failed to sync theme:', err));
      }
    }
  };

  const inputClasses = "w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#7A1B22] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-[#7A1B22]/10 transition-all";
  const lockedClasses = "w-full bg-slate-100 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed select-none";

  return (
    <MainLayout>
      {/* Centered Auto-Dismiss Floating Toast Notification */}
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

      {/* Header */}
      <header className="mb-6 relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-[#7A1B22] rounded-full" />
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('profile.title', 'Account Settings')}</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('profile.subtitle', 'Update personal details, credentials, and app preferences.')}</p>
          </div>
        </div>
      </header>

      {isLoadingData ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-[#7A1B22]" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
          
          {/* PUBLIC INFORMATION FORM */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <h2 className="flex items-center gap-2 font-black text-slate-900 dark:text-white mb-6 text-base border-b border-slate-100 dark:border-slate-800 pb-3">
              <User size={18} className="text-[#7A1B22]" /> {t('profile.publicInfo', 'Public Information')}
            </h2>

            <form onSubmit={handleProfileSubmit}>
              <div className="flex flex-col items-center justify-center mb-6 relative">
                <div className="w-24 h-24 rounded-full border-4 border-[#D4AF37]/30 shadow-md overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative group">
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

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">{t('profile.fullName', 'Full Name')}</label>
                  <input type="text" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} className={inputClasses} required />
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">{t('profile.contact', 'Email / Contact Number')}</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={profileData.contact} onChange={(e) => setProfileData({...profileData, contact: e.target.value})} className={`${inputClasses} pl-10`} required />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{t('profile.toda', 'TODA Association')}</label>
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">{t('profile.locked', 'Locked')}</span>
                  </div>
                  <input type="text" value={profileData.todaAssociation} readOnly title="Registered TODA is permanent. Visit LGU office for TODA transfer." className={lockedClasses} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{t('profile.address', 'Registered Address / Barangay')}</label>
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">{t('profile.locked', 'Locked')}</span>
                  </div>
                  <input type="text" value={profileData.address} readOnly title="Official registered address cannot be self-edited. Contact BPLO for changes." className={lockedClasses} />
                </div>
              </div>

              <button type="submit" className="mt-6 w-full bg-[#7A1B22] text-white hover:bg-[#5A1419] px-4 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]">
                <Save size={16} /> {t('profile.saveBtn', 'Save Information')}
              </button>
            </form>
          </div>

          <div className="flex flex-col gap-6">
            
            {/* APP PREFERENCES (Language at Dark Mode) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm h-fit transition-colors">
              <h2 className="flex items-center gap-2 font-black text-slate-900 dark:text-white mb-6 text-base border-b border-slate-100 dark:border-slate-800 pb-3">
                <Globe size={18} className="text-[#D4AF37]" /> {t('profile.preferencesTitle', 'App Preferences')}
              </h2>
              
              <div className="space-y-4">
                {/* Language Preference */}
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 p-4 rounded-2xl transition-colors">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{t('profile.language', 'Language')}</p>
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{t('profile.languageDesc', 'Select preferred system language')}</p>
                  </div>
                  <select 
                    value={preferences.language}
                    onChange={(e) => savePreferences('language', e.target.value)}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg px-3 py-1.5 outline-none cursor-pointer focus:ring-2 focus:ring-[#7A1B22]/20 transition-all"
                  >
                    <option value="en">English (US)</option>
                    <option value="fil">Tagalog / Filipino</option>
                  </select>
                </div>

                {/* Dark Mode Toggle Switch */}
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 p-4 rounded-2xl transition-colors">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {preferences.theme === 'dark' ? <Moon size={15} className="text-indigo-400"/> : <Sun size={15} className="text-amber-500"/>} 
                      {t('profile.theme', 'Theme Display')}
                    </p>
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      {preferences.theme === 'dark' ? t('profile.themeDark', 'Dark Mode') : t('profile.themeLight', 'Light Mode')} — {t('profile.themeDesc', 'Toggle light or dark mode styling')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => savePreferences('theme', preferences.theme === 'dark' ? 'light' : 'dark')}
                    className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${
                      preferences.theme === 'dark' ? 'bg-[#7A1B22]' : 'bg-slate-300'
                    }`}
                    role="switch"
                    aria-checked={preferences.theme === 'dark'}
                    title={preferences.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  >
                    <span className="sr-only">Toggle theme</span>
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                        preferences.theme === 'dark' ? 'translate-x-7 text-indigo-900' : 'translate-x-0 text-amber-600'
                      }`}
                    >
                      {preferences.theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* SECURITY & PASSWORD */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm h-fit transition-colors">
              <h2 className="flex items-center gap-2 font-black text-slate-900 dark:text-white mb-6 text-base border-b border-slate-100 dark:border-slate-800 pb-3">
                <Lock size={18} className="text-[#D4AF37]" /> {t('profile.changePassword', 'Change Password')}
              </h2>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">{t('profile.currentPassword', 'Current Password')}</label>
                  <input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} placeholder="••••••••" className={inputClasses} required />
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">{t('profile.newPassword', 'New Password')}</label>
                  <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} placeholder="••••••••" className={inputClasses} required minLength="6" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">{t('profile.confirmNewPassword', 'Confirm New Password')}</label>
                  <input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} placeholder="••••••••" className={inputClasses} required minLength="6" />
                </div>
                
                <button type="submit" className="mt-6 w-full bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]">
                  <Lock size={16} /> {t('profile.updatePasswordBtn', 'Update Password')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Save Changes Confirmation Dialog / Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
            onClick={() => !isProcessing && setConfirmModal({ isOpen: false, type: null })} 
          />
          <div className="relative bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 sm:p-7 text-center animate-in fade-in zoom-in-95 duration-150">
            
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-[#7A1B22]/10 dark:bg-[#7A1B22]/25 text-[#7A1B22] dark:text-[#D4AF37] border border-[#7A1B22]/20 shadow-sm">
              {confirmModal.type === 'profile' ? <Save size={24} /> : <Lock size={24} />}
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
                className="flex-1 py-3 rounded-xl font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs disabled:opacity-50"
              >
                {t('profile.cancel', 'Cancel')}
              </button>
              <button 
                type="button"
                onClick={executeAction}
                disabled={isProcessing}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#7A1B22] to-[#9B2A33] hover:brightness-110 active:scale-[0.98] transition-all text-xs shadow-md shadow-[#7A1B22]/20 flex items-center justify-center gap-2 disabled:opacity-50"
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

export default ManageProfile;