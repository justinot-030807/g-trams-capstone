import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/MainLayout';
import { 
  User, Lock, Camera, Save, Loader2, Phone, Mail,
  CheckCircle2, AlertCircle, Moon, Sun, Laptop, Globe, 
  ShieldCheck, Shield, Check, LogOut,
  Eye, EyeOff, FileText, Bell, Smartphone, Send, RefreshCw,
  Info, ShieldAlert, Printer, Download, ExternalLink,
  X, ChevronRight, Edit3, HelpCircle, Building2, MessageSquare
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { SettingsSkeleton } from '../../components/skeleton';
import FeedbackModal from '../../components/common/FeedbackModal';
import OperatorIdCard from '../../components/operator/OperatorIdCard';
import TermsPolicyModal from '../../components/common/TermsPolicyModal';
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

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal Visibility States
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isClearCacheModalOpen, setIsClearCacheModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Current logged in user object (reactive)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  });

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

  // Support & Helpdesk tab and ticket state
  const [supportTab, setSupportTab] = useState('hotlines'); // 'hotlines' | 'ticket'
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketContact, setTicketContact] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Feedback & Toast states
  const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const toastTimerRef = useRef(null);

  const showToast = (message, type = 'success', duration = 3000) => {
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

  // Vault Documents State
  const [vaultDocuments, setVaultDocuments] = useState([]);
  const [isVaultLoading, setIsVaultLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

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

  // Clear cache state
  const [isClearingCache, setIsClearingCache] = useState(false);

  // Check push support and status
  useEffect(() => {
    const checkPush = async () => {
      try {
        const supported = isPushSupported();
        setPushSupported(supported);
        if (supported) {
          setPushPermission(getNotificationPermission());
          const status = await getPushStatus();
          setIsPushSubscribed(Boolean(status?.isSubscribed));
          if (status?.preferences) {
            setPushPreferences(prev => ({ ...prev, ...status.preferences }));
          }
        }
      } catch (err) {
        console.warn('Push notification status check failed:', err);
      }
    };
    checkPush();
  }, []);

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
      showToast('Test push alert sent! Check your notification bar.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to send test push alert.', 'error');
    } finally {
      setIsTestingPush(false);
    }
  };

  // Load operator profile on mount
  useEffect(() => {
    const fetchOperatorProfile = async () => {
      setIsLoading(true);
      try {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const savedLang = localStorage.getItem('gtrams_lang') || language || 'en';

        setPreferences({ theme: savedTheme, language: savedLang });

        const token = localStorage.getItem('token');
        if (token) {
          const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const dbUser = await res.json();
            setCurrentUser(dbUser);
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

  // Fetch Vault Documents
  const fetchVaultDocs = async () => {
    setIsVaultLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/franchises/my-franchises`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const raw = await res.json();
        const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw?.franchises) ? raw.franchises : []));
        const docs = [];
        list.forEach(unit => {
          if (!unit) return;
          const unitPlate = unit.plateNo || 'PENDING PLATE';
          const unitDesc = `${unit.make || 'Tricycle'} (${unit.made || 'Unit'})`;
          
          if (unit.orCrUrl) {
            docs.push({
              id: `${unit._id}_orcr`,
              title: 'Tricycle OR / CR (LTO Registration)',
              category: 'Vehicle Document',
              plate: unitPlate,
              unitDesc,
              url: unit.orCrUrl,
              status: unit.status,
              type: 'orCr'
            });
          }
          if (unit.licenseUrl) {
            docs.push({
              id: `${unit._id}_license`,
              title: "Professional Driver's License",
              category: "Driver's Credential",
              plate: unitPlate,
              unitDesc,
              url: unit.licenseUrl,
              status: unit.status,
              type: 'license'
            });
          }
          if (unit.brgyClearanceUrl) {
            docs.push({
              id: `${unit._id}_brgy`,
              title: 'Barangay Clearance (Gasan)',
              category: 'LGU Clearance',
              plate: unitPlate,
              unitDesc,
              url: unit.brgyClearanceUrl,
              status: unit.status,
              type: 'brgy'
            });
          }
          if (unit.todaEndorsementUrl) {
            docs.push({
              id: `${unit._id}_toda`,
              title: 'TODA Endorsement Certificate',
              category: 'Association Certificate',
              plate: unitPlate,
              unitDesc,
              url: unit.todaEndorsementUrl,
              status: unit.status,
              type: 'toda'
            });
          }
        });
        setVaultDocuments(docs);
      }
    } catch (err) {
      console.error('Failed to load vault documents:', err);
    } finally {
      setIsVaultLoading(false);
    }
  };

  useEffect(() => {
    fetchVaultDocs();
  }, []);

  // Handle Photo Selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
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
      showToast('Photo chosen! Please click Save Changes to apply.', 'success');
      // Prompt user with the modal immediately to review and save
      setIsEditProfileModalOpen(true);
    }
  };

  useEffect(() => {
    return () => {
      if (profilePicPreview && profilePicPreview.startsWith('blob:')) {
        URL.revokeObjectURL(profilePicPreview);
      }
    };
  }, [profilePicPreview]);

  // Profile Save Execution
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    const isEmail = (profileData.contact || '').includes('@');
    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileData.contact.trim())) {
        showToast('Please enter a valid email address.', 'error');
        return;
      }
    } else if (profileData.contact) {
      const phoneRegex = /^(09|\+639)\d{9}$/;
      if (!phoneRegex.test(profileData.contact.replace(/[\s-]/g, ''))) {
        showToast(t('profile.invalidPhone', 'Please enter a valid Philippine mobile number.'), 'error');
        return;
      }
    }

    setIsProcessing(true);
    try {
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/auth/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const updated = await res.json();
        localStorage.setItem('user', JSON.stringify(updated));
        localStorage.setItem('name', updated.name || profileData.name);
        setCurrentUser(updated);
        setProfileData({
          name: updated.name || updated.fullName || profileData.name,
          contact: updated.contact || '',
          emergencyContact: updated.emergencyContact || '',
          address: updated.address || profileData.address,
          todaAssociation: updated.todaAssociation || profileData.todaAssociation
        });
        if (updated.profilePic) {
          setProfilePicPreview(updated.profilePic);
        }
        setProfilePicFile(null);
        setIsEditProfileModalOpen(false);
        setFeedbackModal({
          isOpen: true,
          type: 'success',
          title: 'Profile Updated',
          message: 'Your profile details and contact information have been saved successfully.'
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.message || 'Failed to save profile changes.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while saving profile.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Password Update Execution
  const handleUpdatePassword = async (e) => {
    if (e) e.preventDefault();
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

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/auth/change-password`, {
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
        setIsPasswordModalOpen(false);
        setFeedbackModal({
          isOpen: true,
          type: 'success',
          title: 'Password Changed',
          message: 'Your account password has been updated successfully. Please use your new password next time you log in.'
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.message || 'Failed to change password. Please verify your current password.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while changing password.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Support Ticket Submission
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      showToast('Please provide both a subject and message.', 'error');
      return;
    }
    setIsSubmittingTicket(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/tickets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: ticketSubject.trim(),
          contactNumber: ticketContact.trim() || profileData.contact,
          message: ticketMessage.trim()
        })
      });
      if (res.ok) {
        setTicketSubject('');
        setTicketMessage('');
        setIsSupportModalOpen(false);
        setFeedbackModal({
          isOpen: true,
          type: 'success',
          title: 'Ticket Submitted',
          message: 'Your inquiry has been submitted to the Office of the Vice Mayor Extension desk. Municipal officers will review and respond soon.'
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.message || 'Failed to submit ticket. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Ticket submission error:', err);
      showToast('Network error while submitting support ticket.', 'error');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Sync ticket contact when support modal opens
  useEffect(() => {
    if (isSupportModalOpen && profileData.contact) {
      setTicketContact(profileData.contact);
    }
  }, [isSupportModalOpen, profileData.contact]);

  // Theme Switcher
  const handleThemeToggle = (newTheme) => {
    setTheme(newTheme);
    setPreferences(prev => ({ ...prev, theme: newTheme }));
    showToast(
      newTheme === 'dark' 
        ? 'Dark mode enabled' 
        : newTheme === 'system' 
          ? 'System mode enabled (matches phone settings)' 
          : 'Light mode enabled', 
      'success'
    );
  };

  // Language Switcher
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setPreferences(prev => ({ ...prev, language: newLang }));
    localStorage.setItem('gtrams_lang', newLang);
    showToast(newLang === 'fil' ? 'Language set to Filipino' : 'Language set to English', 'success');
  };

  // Clear Cache Safely (CacheStorage, IndexedDB, localStorage, sessionStorage)
  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      // 1. Clear CacheStorage
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // 2. Clear IndexedDB
      if (typeof window !== 'undefined' && window.indexedDB && window.indexedDB.databases) {
        try {
          const dbs = await window.indexedDB.databases();
          await Promise.all(
            dbs.map(db => {
              if (db.name) {
                return new Promise((resolve) => {
                  const req = window.indexedDB.deleteDatabase(db.name);
                  req.onsuccess = () => resolve();
                  req.onerror = () => resolve();
                  req.onblocked = () => resolve();
                });
              }
              return Promise.resolve();
            })
          );
        } catch (idbErr) {
          console.warn('IndexedDB clear warning:', idbErr);
        }
      }

      // 3. Preserve critical authentication and session credentials
      const savedToken = localStorage.getItem('token');
      const savedRole = localStorage.getItem('role');
      const savedUser = localStorage.getItem('user');
      const savedUserId = localStorage.getItem('userId');
      const savedName = localStorage.getItem('name');
      const savedTheme = localStorage.getItem('theme');
      const savedLang = localStorage.getItem('gtrams_lang');

      // 4. Actually clear local and session storages
      localStorage.clear();
      sessionStorage.clear();

      // 5. Restore credentials
      if (savedToken) localStorage.setItem('token', savedToken);
      if (savedRole) localStorage.setItem('role', savedRole);
      if (savedUser) localStorage.setItem('user', savedUser);
      if (savedUserId) localStorage.setItem('userId', savedUserId);
      if (savedName) localStorage.setItem('name', savedName);
      if (savedTheme) localStorage.setItem('theme', savedTheme);
      if (savedLang) localStorage.setItem('gtrams_lang', savedLang);

      showToast('Cache cleared successfully! Refreshing...', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Error clearing cache:', err);
      showToast('Failed to clear cache: ' + err.message, 'error');
    } finally {
      setIsClearingCache(false);
      setIsClearCacheModalOpen(false);
    }
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('name');
    navigate('/login');
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

      {/* Main Container - Mobile First Centered Layout */}
      <div className="max-w-2xl mx-auto space-y-5 pb-28 sm:pb-24 pt-1 sm:pt-2">
        {isLoading ? (
          <SettingsSkeleton />
        ) : (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* PROFILE HEADER CARD */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
              <div className="flex items-center gap-4 sm:gap-5">
                {/* Avatar with Camera Trigger */}
                <div className="relative shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[#D4AF37] overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-inner">
                    {profilePicPreview ? (
                      <img src={profilePicPreview} alt={profileData.name || 'Operator'} className="w-full h-full object-cover" />
                    ) : (
                      <User size={36} className="text-slate-400 dark:text-slate-500" />
                    )}
                  </div>
                  <label
                    htmlFor="avatar-upload-header"
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-950 flex items-center justify-center shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
                    title="Change Profile Photo"
                  >
                    <Camera size={13} />
                    <input
                      id="avatar-upload-header"
                      type="file"
                      accept="image/*,.webp,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Profile Information */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                      {profileData.name || 'Registered Operator'}
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D4AF37]/15 text-[#7A1B22] dark:text-[#D4AF37] border border-[#D4AF37]/30 shrink-0">
                      <ShieldCheck size={12} className="text-[#D4AF37]" />
                      <span>{profileData.todaAssociation || 'NON-TODA'}</span>
                    </span>
                  </div>
                  
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium truncate mt-1">
                    {profileData.contact || 'No contact provided'}
                  </p>

                  <div className="mt-2.5">
                    <button
                      type="button"
                      onClick={() => setIsEditProfileModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#7A1B22] hover:bg-[#681419] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] text-white dark:text-slate-950 transition-all active:scale-95 shadow-2xs cursor-pointer min-h-[36px]"
                    >
                      <Edit3 size={13} />
                      <span>Edit profile</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* GROUP 1: OPERATOR CREDENTIALS */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 mb-2">
                Operator Credentials
              </h3>
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
                {/* Digital ID Card */}
                <button
                  type="button"
                  onClick={() => setIsIdCardModalOpen(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#7A1B22]/10 dark:bg-[#7A1B22]/20 text-[#7A1B22] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Digital ID Card
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 hidden sm:inline-flex items-center gap-1">
                      <CheckCircle2 size={11} /> Verified
                    </span>
                    <ChevronRight size={18} className="text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                {/* Document Vault */}
                <button
                  type="button"
                  onClick={() => setIsVaultModalOpen(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Document Vault
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                      {vaultDocuments.length} {vaultDocuments.length === 1 ? 'file' : 'files'}
                    </span>
                    <ChevronRight size={18} className="text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              </div>
            </div>

            {/* GROUP 2: PREFERENCES */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 mb-2">
                Preferences
              </h3>
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
                {/* Notifications & Sounds */}
                <div className="w-full flex items-center justify-between p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <button
                    type="button"
                    onClick={() => setIsNotificationModalOpen(true)}
                    className="flex items-center gap-3.5 text-left flex-1 min-w-0 pr-3 cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Bell size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#7A1B22] dark:group-hover:text-[#D4AF37] transition-colors">
                      Notifications and sounds
                    </span>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    {isPushLoading && <Loader2 size={16} className="animate-spin text-[#7A1B22] dark:text-[#D4AF37]" />}
                    <button
                      type="button"
                      disabled={!pushSupported || isPushLoading}
                      onClick={handleTogglePushSubscription}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#7A1B22] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isPushSubscribed ? 'bg-[#7A1B22] dark:bg-[#D4AF37]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      aria-label="Toggle push notifications"
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          isPushSubscribed ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Language Selection */}
                <button
                  type="button"
                  onClick={() => setIsLanguageModalOpen(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Globe size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Language
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                      {preferences.language === 'fil' ? 'Filipino' : 'English'}
                    </span>
                    <ChevronRight size={18} className="text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                {/* Theme Mode */}
                <button
                  type="button"
                  onClick={() => setIsThemeModalOpen(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      {theme === 'system' ? <Laptop size={20} /> : isDark ? <Moon size={20} /> : <Sun size={20} />}
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Theme
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 capitalize">
                      {theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light'}
                    </span>
                    <ChevronRight size={18} className="text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              </div>
            </div>

            {/* GROUP 3: ACCOUNT & SECURITY */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 mb-2">
                Account
              </h3>
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
                {/* Password Row */}
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Lock size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Password
                    </span>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Support & Municipal Helpdesk */}
                <button
                  type="button"
                  onClick={() => setIsSupportModalOpen(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                      <HelpCircle size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Support
                    </span>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Clear Cache */}
                <button
                  type="button"
                  onClick={() => setIsClearCacheModalOpen(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                      <RefreshCw size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Clear cache
                    </span>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Terms and Privacy Policy */}
                <button
                  type="button"
                  onClick={() => setIsTermsModalOpen(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                      <Shield size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Terms and Privacy Policy
                    </span>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={() => setIsLogoutConfirmOpen(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-red-50/70 dark:hover:bg-red-950/20 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                      <LogOut size={20} />
                    </div>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">
                      Logout
                    </span>
                  </div>
                  <ChevronRight size={18} className="text-red-400/80 dark:text-red-500 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODALS & SHEETS */}
      {/* ========================================================================= */}

      {/* 1. EDIT PROFILE MODAL */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
            onClick={() => !isProcessing && setIsEditProfileModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#7A1B22]/10 dark:bg-[#7A1B22]/20 text-[#7A1B22] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Profile</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Update personal details and contact info</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileModalOpen(false)}
                disabled={isProcessing}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Photo Upload Row */}
              <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 mb-2">
                <div className="w-20 h-20 rounded-full border-2 border-[#D4AF37] overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative shadow-inner">
                  {profilePicPreview ? (
                    <img src={profilePicPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={36} className="text-slate-300 dark:text-slate-600" />
                  )}
                </div>
                <label className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer active:scale-95 transition-all border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <Camera size={14} className="text-[#7A1B22] dark:text-[#D4AF37]" />
                  <span>Choose Photo</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  maxLength="50"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  className={inputClasses}
                  required
                  placeholder="Full Name of Operator"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {contactLabel}
                </label>
                <div className="relative">
                  {isEmailContact ? (
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  ) : (
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  )}
                  <input
                    type="text"
                    value={profileData.contact}
                    onChange={(e) => setProfileData(prev => ({ ...prev, contact: e.target.value }))}
                    className={`${inputClasses} pl-10`}
                    required
                    placeholder="e.g. 0912 345 6789 or operator@gmail.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Phone size={14} className="text-[#7A1B22] dark:text-[#D4AF37]" />
                  <span>Emergency Contact Number</span>
                </label>
                <input
                  type="text"
                  maxLength="50"
                  value={profileData.emergencyContact}
                  onChange={(e) => setProfileData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                  placeholder="e.g. 09123456789"
                  className={inputClasses}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    TODA Association
                  </label>
                  <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800/80">
                    Official Masterlist
                  </span>
                </div>
                <input
                  type="text"
                  value={profileData.todaAssociation}
                  readOnly
                  className={lockedClasses}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Registered Barangay
                  </label>
                  <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800/80">
                    Municipal Record
                  </span>
                </div>
                <input
                  type="text"
                  value={profileData.address}
                  readOnly
                  className={lockedClasses}
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  disabled={isProcessing}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-[#7A1B22] hover:bg-[#5A1419] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] dark:text-slate-950 text-xs shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. DIGITAL ID CARD MODAL */}
      {isIdCardModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
            onClick={() => setIsIdCardModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#7A1B22]/10 dark:bg-[#7A1B22]/20 text-[#7A1B22] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Digital Operator ID</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Official LGU Gasan Tricycle Credential</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#7A1B22] hover:bg-[#5A1419] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] text-white dark:text-slate-950 transition-all shadow-xs cursor-pointer"
                  title="Print ID Card"
                >
                  <Printer size={13} />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsIdCardModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* ID Card Display */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 flex items-center justify-center gap-1.5 font-medium">
                <RefreshCw size={12} className="text-[#D4AF37]" />
                <span>Tap or click card to flip between photo and QR code</span>
              </p>
              <OperatorIdCard user={currentUser} />

              <div className="mt-5 p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/50 text-left">
                <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                  <AlertCircle size={14} /> Official Use &amp; Verification
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-400/90 leading-relaxed">
                  This digital ID is an official credential issued by LGU Gasan. The QR code verifies registration and active status with municipal authorities.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. DOCUMENT VAULT MODAL */}
      {isVaultModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
            onClick={() => setIsVaultModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Document Vault</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Access and download verified franchise files</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchVaultDocs}
                  disabled={isVaultLoading}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <RefreshCw size={12} className={isVaultLoading ? "animate-spin" : ""} />
                  <span>Refresh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsVaultModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {isVaultLoading ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <Loader2 size={32} className="text-[#7A1B22] dark:text-[#D4AF37] animate-spin mb-3" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading documents...</p>
                </div>
              ) : vaultDocuments.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 mb-3">
                    <FileText size={30} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">No Uploaded Documents Found</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4 leading-relaxed">
                    Submitted franchise documents (OR/CR, Driver's License, Barangay Clearance, TODA Endorsement) will appear here for easy access.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsVaultModalOpen(false);
                      navigate('/apply-franchise');
                    }}
                    className="px-4 py-2 rounded-xl font-bold text-xs bg-[#7A1B22] hover:bg-[#5A1419] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] text-white dark:text-slate-950 transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <FileText size={14} />
                    <span>Apply / Upload Documents</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Stored Files ({vaultDocuments.length})
                    </p>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-1">
                      <ShieldCheck size={12} />
                      <span>Encrypted</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {vaultDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/80 transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {doc.category}
                            </span>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                              Available
                            </span>
                          </div>

                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1 mb-1 group-hover:text-[#7A1B22] dark:group-hover:text-[#D4AF37] transition-colors">
                            {doc.title}
                          </h4>
                          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-3">
                            Plate: <span className="font-bold text-slate-700 dark:text-slate-200">{doc.plate}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                          >
                            <Eye size={13} />
                            <span>Preview</span>
                          </button>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#7A1B22]/10 hover:bg-[#7A1B22]/20 dark:bg-[#D4AF37]/15 dark:hover:bg-[#D4AF37]/25 text-[#7A1B22] dark:text-[#D4AF37] text-xs font-bold transition-all cursor-pointer"
                            title="Download"
                          >
                            <Download size={13} />
                            <span>Download</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3b. DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200 cursor-pointer"
            onClick={() => setPreviewDoc(null)}
          />
          <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="min-w-0 pr-4">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                  {previewDoc.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {previewDoc.plate} &bull; {previewDoc.unitDesc}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
                  title="Open Original"
                >
                  <ExternalLink size={15} />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-slate-100 dark:bg-slate-950 flex items-center justify-center min-h-[300px]">
              {previewDoc.url.toLowerCase().endsWith('.pdf') ? (
                <iframe src={previewDoc.url} title={previewDoc.title} className="w-full h-[60vh] rounded-xl border border-slate-200 dark:border-slate-800" />
              ) : (
                <img src={previewDoc.url} alt={previewDoc.title} className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-md" />
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">G-TRAMS Secured Document Vault</span>
              <a
                href={previewDoc.url}
                target="_blank"
                rel="noreferrer"
                download
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#7A1B22] hover:bg-[#5A1419] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] text-white dark:text-slate-950 transition-all shadow-xs cursor-pointer"
              >
                <Download size={14} />
                <span>Download Document</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 4. NOTIFICATIONS AND SOUNDS MODAL */}
      {isNotificationModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
            onClick={() => setIsNotificationModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Bell size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Notifications and Sounds</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Push alert preferences &amp; test</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNotificationModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Browser warning alerts if applicable */}
              {!pushSupported && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
                  <Info size={16} className="shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    Web push is not supported in this browser. To receive push alerts, please use Chrome, Edge, or Safari on your device.
                  </p>
                </div>
              )}

              {pushPermission === 'denied' && (
                <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 flex items-start gap-2.5 text-red-800 dark:text-red-300">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    Notifications are blocked in your browser. Set permission to <strong>Allow</strong> in your site settings to enable alerts.
                  </p>
                </div>
              )}

              {/* Master Push Toggle Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[#7A1B22] dark:text-[#D4AF37] shrink-0">
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Push Notifications on Device
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Receive alerts on lock screen &amp; status bar
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!pushSupported || isPushLoading}
                  onClick={handleTogglePushSubscription}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isPushSubscribed ? 'bg-[#7A1B22] dark:bg-[#D4AF37]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isPushSubscribed ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Test Alert Button */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Send Test Push Alert
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Test sound and popup notification now
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!isPushSubscribed || isTestingPush}
                  onClick={handleSendTestPush}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95 ${
                    isPushSubscribed
                      ? 'bg-[#7A1B22] hover:bg-[#601015] text-white dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] dark:text-slate-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isTestingPush ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Test Alert</span>
                    </>
                  )}
                </button>
              </div>

              {/* Notification Categories */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Notification Types
                </h4>

                {/* Status Updates */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="pr-3">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Franchise Status &amp; Approvals</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Approval notices, inspections, and compliance requirements</p>
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

                {/* Renewal Reminders */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="pr-3">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Renewal Reminders &amp; Deadlines</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Advance notice before franchise expiry to avoid penalties</p>
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

                {/* Announcements */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="pr-3">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">TODA &amp; Transport Advisories</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Official notices on routes, fare updates, and municipal meetings</p>
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
            </div>
          </div>
        </div>
      )}

      {/* 5. LANGUAGE MODAL */}
      {isLanguageModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
            onClick={() => setIsLanguageModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Globe size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Language</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Piliin ang nais na wika</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLanguageModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-2">
              <button
                type="button"
                onClick={() => {
                  handleLanguageChange('en');
                  setIsLanguageModalOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${
                  preferences.language === 'en'
                    ? 'bg-[#7A1B22]/5 dark:bg-[#D4AF37]/10 border-[#7A1B22] dark:border-[#D4AF37]'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">English (US)</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Default portal language</p>
                </div>
                {preferences.language === 'en' && (
                  <div className="w-5 h-5 rounded-full bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-950 flex items-center justify-center shrink-0">
                    <Check size={12} className="stroke-[3]" />
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  handleLanguageChange('fil');
                  setIsLanguageModalOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${
                  preferences.language === 'fil'
                    ? 'bg-[#7A1B22]/5 dark:bg-[#D4AF37]/10 border-[#7A1B22] dark:border-[#D4AF37]'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Filipino / Tagalog</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Wikang Tagalog</p>
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

      {/* 6. THEME MODAL */}
      {isThemeModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
            onClick={() => setIsThemeModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Sun size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Display Theme</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Light, Dark, or System mode</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsThemeModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-2">
              {/* Light Mode */}
              <button
                type="button"
                onClick={() => {
                  handleThemeToggle('light');
                  setIsThemeModalOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${
                  theme === 'light'
                    ? 'bg-[#7A1B22]/5 dark:bg-[#D4AF37]/10 border-[#7A1B22] dark:border-[#D4AF37]'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Sun size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Light Mode</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Always bright</p>
                  </div>
                </div>
                {theme === 'light' && (
                  <div className="w-5 h-5 rounded-full bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-950 flex items-center justify-center shrink-0">
                    <Check size={12} className="stroke-[3]" />
                  </div>
                )}
              </button>

              {/* Dark Mode */}
              <button
                type="button"
                onClick={() => {
                  handleThemeToggle('dark');
                  setIsThemeModalOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-[#7A1B22]/5 dark:bg-[#D4AF37]/10 border-[#7A1B22] dark:border-[#D4AF37]'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center">
                    <Moon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Dark Mode</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Reduced eye strain</p>
                  </div>
                </div>
                {theme === 'dark' && (
                  <div className="w-5 h-5 rounded-full bg-[#D4AF37] text-slate-950 flex items-center justify-center shrink-0">
                    <Check size={12} className="stroke-[3]" />
                  </div>
                )}
              </button>

              {/* System Mode */}
              <button
                type="button"
                onClick={() => {
                  handleThemeToggle('system');
                  setIsThemeModalOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${
                  theme === 'system'
                    ? 'bg-[#7A1B22]/5 dark:bg-[#D4AF37]/10 border-[#7A1B22] dark:border-[#D4AF37]'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Laptop size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">System (Auto)</p>
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
        </div>
      )}

      {/* 7. PASSWORD CHANGE MODAL */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
            onClick={() => !isProcessing && setIsPasswordModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Lock size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Change Password</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Update your security credentials</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                disabled={isProcessing}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleUpdatePassword} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="••••••••"
                    className={`${inputClasses} pr-10`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="••••••••"
                    className={`${inputClasses} pr-10`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">Must be at least 6 characters.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="••••••••"
                    className={`${inputClasses} pr-10`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  disabled={isProcessing}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-[#7A1B22] hover:bg-[#5A1419] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] dark:text-slate-950 text-xs shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. SUPPORT & MUNICIPAL HELPDESK MODAL (Hotlines + Ticket Submission) */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
            onClick={() => !isSubmittingTicket && setIsSupportModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <HelpCircle size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Municipal Support &amp; Helpdesk</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Office of the Vice Mayor Extension &bull; LGU Gasan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSupportModalOpen(false)}
                disabled={isSubmittingTicket}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Switchable Tabs: Hotlines vs Send Support Ticket */}
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex gap-1">
              <button
                type="button"
                onClick={() => setSupportTab('hotlines')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  supportTab === 'hotlines'
                    ? 'bg-white dark:bg-slate-800 text-[#7A1B22] dark:text-[#D4AF37] shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Phone size={13} />
                <span>Hotlines &amp; Office</span>
              </button>
              <button
                type="button"
                onClick={() => setSupportTab('ticket')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  supportTab === 'ticket'
                    ? 'bg-white dark:bg-slate-800 text-[#7A1B22] dark:text-[#D4AF37] shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <MessageSquare size={13} />
                <span>Submit Ticket</span>
              </button>
            </div>

            {/* Content Tab 1: Hotlines & Location */}
            {supportTab === 'hotlines' ? (
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  For questions regarding franchise approvals, claim stubs, inspection schedules, or Toda reassignment, reach out to municipal officers:
                </p>

                <div className="space-y-2.5">
                  <a 
                    href="tel:09123456789" 
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#7A1B22]/10 dark:bg-[#D4AF37]/15 text-[#7A1B22] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">Office Hotline</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">+63 (042) 342-1234 / 0912 345 6789</p>
                    </div>
                  </a>

                  <a 
                    href="mailto:ovme@gasan.ph" 
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#7A1B22]/10 dark:bg-[#D4AF37]/15 text-[#7A1B22] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">Official Email</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">ovme@gasan.ph</p>
                    </div>
                  </a>

                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-left">
                    <div className="w-10 h-10 rounded-xl bg-[#7A1B22]/10 dark:bg-[#D4AF37]/15 text-[#7A1B22] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">Office Location &amp; Hours</p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Sangguniang Bayan Office, Municipal Hall, Gasan</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Mon - Fri: 8:00 AM - 5:00 PM</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSupportModalOpen(false);
                      navigate('/help-support');
                    }}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-[#7A1B22] hover:bg-[#5A1419] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] text-white dark:text-slate-950 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ExternalLink size={14} />
                    <span>Browse Help &amp; Support FAQs</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Content Tab 2: Direct Ticket Submission Form */
              <form onSubmit={handleSubmitTicket} className="p-5 space-y-3.5 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject / Concern
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="100"
                    placeholder="e.g. Schedule inspection, Renewal assistance"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    maxLength="50"
                    placeholder="Contact number for officer follow-up"
                    value={ticketContact}
                    onChange={(e) => setTicketContact(e.target.value)}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Message / Description
                  </label>
                  <textarea
                    rows={4}
                    required
                    maxLength="600"
                    placeholder="Please explain your question or issue in detail..."
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#7A1B22] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-[#7A1B22]/15 transition-all shadow-2xs resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSupportTab('hotlines')}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Back to Hotlines
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTicket}
                    className="px-5 py-2 rounded-xl font-bold text-white bg-[#7A1B22] hover:bg-[#5A1419] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] dark:text-slate-950 text-xs shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                  >
                    {isSubmittingTicket ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send size={13} />
                        <span>Send Ticket</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 9. CLEAR CACHE MODAL */}
      {isClearCacheModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
            onClick={() => !isClearingCache && setIsClearCacheModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3.5 border border-amber-200 dark:border-amber-800/60 shadow-xs">
              <RefreshCw size={22} className={isClearingCache ? "animate-spin" : ""} />
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">Clear Cache?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
              This will purge temporary offline cache, IndexedDB data, and refresh application data without logging you out.
            </p>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={isClearingCache}
                onClick={() => setIsClearCacheModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearingCache}
                onClick={handleClearCache}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-white bg-[#7A1B22] hover:bg-[#5A1419] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] dark:text-slate-950 text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                {isClearingCache ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Clearing...</span>
                  </>
                ) : (
                  <span>Clear &amp; Refresh</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. TERMS AND DATA PRIVACY POLICY MODAL */}
      <TermsPolicyModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        defaultLang={preferences.language}
        initialTab="privacy"
      />

      {/* 11. LOGOUT CONFIRMATION MODAL */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
            onClick={() => setIsLogoutConfirmOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-3.5 border border-red-200 dark:border-red-900/60 shadow-xs">
              <LogOut size={22} />
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">Log Out of G-TRAMS?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
              Are you sure you want to end your active operator session on this device?
            </p>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <LogOut size={14} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centered Feedback Modal for Saves & Submissions */}
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
