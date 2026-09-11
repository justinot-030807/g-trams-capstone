import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import MainLayout from '../../components/MainLayout';
import { 
  RefreshCw, AlertCircle, CheckCircle, Clock, Loader2, 
  CalendarDays, PlusCircle, MapPin, Hash, Printer, X, ShieldCheck, Download, Eye,
  Check, FileText, User, ShieldAlert, Receipt, XCircle, Car,
  Sun, Moon, SunMedium, ArrowRight, Users, Sparkles, HelpCircle,
  Bell, Settings, ChevronRight, LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { GarageGridSkeleton, SkeletonElement } from '../../components/skeleton';
import ClaimStubVoucher from '../../components/operator/ClaimStubVoucher';
import SpotlightTour from '../../components/operator/SpotlightTour';
import LanguagePreferenceModal from '../../components/operator/LanguagePreferenceModal';

const CANCEL_REASONS = [
  "Need to correct vehicle or tricycle details",
  "Incomplete requirements / Postponing application",
  "Personal reasons / Attending to other matters",
  "Duplicate or accidental submission",
  "Other reason (Please specify below)"
];

const OperatorDashboard = () => {
  const { t, language, changeLanguage } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const [franchises, setFranchises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  const loggedInUserName = localStorage.getItem('name') || 'Operator';
  const currentRole = String(localStorage.getItem('role') || '').toLowerCase().trim().replace(/_/g, ' ');
  const isTodaPresident = currentRole === 'toda president' || currentRole === 'toda_president';

  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('name');
    navigate('/login');
  };

  // Application cancellation state
  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    unit: null,
    reason: CANCEL_REASONS[0],
    customReason: '',
    isSubmitting: false
  });

  const systemFranchiseFee = localStorage.getItem('franchise_fee') || '500';

  const [maxUnits, setMaxUnits] = useState(() => {
    const saved = localStorage.getItem('max_units_per_operator');
    return saved ? parseInt(saved, 10) || 2 : 2;
  });

  const [profilePic, setProfilePic] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.profilePic || user.profilePicUrl || null;
    } catch {
      return null;
    }
  });

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gtrams_read_notification_ids')) || [];
    } catch {
      return [];
    }
  });

  const toggleLanguage = () => {
    const nextLang = language === 'fil' ? 'en' : 'fil';
    if (changeLanguage) changeLanguage(nextLang);
  };

  const calculateDaysRemaining = (dateApplied) => {
    if (!dateApplied) return null;
    const expDate = new Date(dateApplied);
    expDate.setFullYear(expDate.getFullYear() + 1);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Sync notifications with franchise updates
  useEffect(() => {
    const notifs = [];
    franchises.forEach(item => {
      if (item.status === 'Ready for Pickup') {
        notifs.push({
          id: `op_ready_${item._id}`,
          title: language === 'fil' ? 'Aprubado na ang Prangkisa!' : 'Franchise Approved!',
          desc: language === 'fil' ? `Ang prangkisa para sa unit ${item.plateNo || ''} ay aprubado na. Pumunta sa BPLO para sa Claim Stub.` : `Franchise for unit ${item.plateNo || ''} is approved. Proceed to BPLO cashier.`,
          time: 'Action Required',
          type: 'success',
          link: '/operator-dashboard'
        });
      } else if (item.status === 'Cancelled') {
        notifs.push({
          id: `op_cancelled_${item._id}`,
          title: language === 'fil' ? 'Kailangang Ayusin ang Aplikasyon' : 'Application Returned / Needs Revision',
          desc: item.cancelReason ? `LGU Note: ${item.cancelReason}` : 'Your application was returned for correction. Click to fix.',
          time: 'Attention',
          type: 'reminder',
          link: '/apply-franchise'
        });
      } else if (item.status === 'Expired') {
        notifs.push({
          id: `op_expired_${item._id}`,
          title: language === 'fil' ? 'Paso na ang Prangkisa' : 'Franchise Expired Alert',
          desc: language === 'fil' ? `Ang permit para sa ${item.plateNo || 'unit'} ay expired na. Mag-renew agad.` : `Unit ${item.plateNo || 'N/A'} has expired and requires renewal.`,
          time: 'Renewal',
          type: 'reminder',
          link: '/apply-franchise'
        });
      }
    });
    setNotifications(notifs);
  }, [franchises, language]);

  const unreadNotifCount = notifications.filter(n => !readNotifIds.includes(n.id)).length;

  const markAllNotifsRead = () => {
    const allIds = notifications.map(n => n.id);
    const updated = Array.from(new Set([...readNotifIds, ...allIds]));
    setReadNotifIds(updated);
    localStorage.setItem('gtrams_read_notification_ids', JSON.stringify(updated));
  };

  useEffect(() => {
    fetchMyFranchises();
    fetchSystemSettings();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchSystemSettings = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/system-settings`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const json = await res.json();
        const count = json.data?.maxUnitsPerOperator ?? json.maxUnitsPerOperator;
        if (count !== undefined && count !== null) {
          const num = Number(count) || 2;
          setMaxUnits(num);
          localStorage.setItem('max_units_per_operator', num);
        }
      }
    } catch (err) {
      console.warn('Could not load system settings:', err);
    }
  };

  const fetchMyFranchises = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/franchises/my-franchises', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Ensure data is an array before updating state
        setFranchises(Array.isArray(data) ? data : []);
      } else {
        setFranchises([]);
      }
    } catch (error) {
      console.error('Error loading dashboard units:', error);
      setFranchises([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentUserId = () => {
    try {
      const id = localStorage.getItem('userId');
      if (id) return id;
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user._id || user.id) return user._id || user.id;
      if (user.email) return user.email;
      const name = localStorage.getItem('name');
      if (name) return name;
    } catch (e) {}
    return 'default';
  };

  // Sequence first-time onboarding: Language preference selection first, then tour (user-scoped)
  useEffect(() => {
    if (!isLoading) {
      const uid = getCurrentUserId();
      const langKey = `gtrams_lang_selected_${uid}`;
      const tourKey = `gtrams_operator_tour_done_${uid}`;

      const hasSelectedLang = localStorage.getItem(langKey);
      if (!hasSelectedLang) {
        const timer = setTimeout(() => {
          setIsLangModalOpen(true);
        }, 500);
        return () => clearTimeout(timer);
      } else {
        const hasSeenTour = localStorage.getItem(tourKey);
        if (!hasSeenTour) {
          const timer = setTimeout(() => {
            setIsTourOpen(true);
          }, 800);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [isLoading]);

  const handleLanguageConfirmed = () => {
    const uid = getCurrentUserId();
    localStorage.setItem(`gtrams_lang_selected_${uid}`, 'true');
    setIsLangModalOpen(false);

    // After language is chosen, launch the spotlight tour if not yet completed for this account
    const tourKey = `gtrams_operator_tour_done_${uid}`;
    const hasSeenTour = localStorage.getItem(tourKey);
    if (!hasSeenTour) {
      setTimeout(() => {
        setIsTourOpen(true);
      }, 500);
    }
  };

  const handleCloseTour = () => {
    const uid = getCurrentUserId();
    setIsTourOpen(false);
    localStorage.setItem(`gtrams_operator_tour_done_${uid}`, 'true');
  };

  const getTourSteps = () => {
    const steps = [
      {
        targetId: 'tour-hero-banner',
        title: 'Welcome to Operator Portal',
        titleFil: 'Maligayang Pagdating sa Portal',
        description: 'This is your primary command dashboard displaying your account greeting, active status notices, and profile quick access.',
        descriptionFil: 'Ito ang iyong pangunahing dashboard kung saan makikita ang iyong account greeting, paunawa sa prangkisa, at profile shortcuts.',
        icon: Sparkles
      },
      {
        targetId: 'tour-hero-action',
        title: 'Franchise Action Banner',
        titleFil: 'Aksyon at Katayuan ng Prangkisa',
        description: 'Track real-time franchise alerts, apply for open slots, or access approved Claim Stub vouchers directly here.',
        descriptionFil: 'Subaybayan ang paunawa sa prangkisa, mag-apply sa bakanteng slot, o kunin ang aprubadong Claim Stub dito.',
        icon: ShieldCheck
      },
      {
        targetId: 'tour-capacity-card',
        title: 'Franchise Fleet Capacity',
        titleFil: 'Kapasidad ng Prangkisa',
        description: 'Municipal regulations allow up to 2 registered tricycle units per operator. This counter tracks your active slots.',
        descriptionFil: 'Pinapayagan ng ordinansa ang hanggang 2 rehistradong tricycle bawat operator. Sinusubaybayan nito ang iyong bakanteng slot.',
        icon: ShieldCheck
      },
      {
        targetId: 'tour-garage-section',
        title: 'My Franchise Garage',
        titleFil: 'Garahe ng Aking Prangkisa',
        description: 'Review your registered tricycle units, official MTOP plate, route zones, and renewal schedules.',
        descriptionFil: 'Suriin ang iyong mga rehistradong tricycle, MTOP plate number, ruta, at iskedyul ng renewal.',
        icon: Hash
      },
      {
        targetId: 'tour-bottom-nav',
        title: 'Floating Mobile Navigation Dock',
        titleFil: 'Floating Mobile Navigation Dock',
        description: 'Easily navigate between Dashboard, Franchise Application, Help Support, and Account Settings.',
        descriptionFil: 'Madaling lumipat sa Dashboard, Pag-apply ng prangkisa, Gabay/Suporta, at Account Settings gamit ang dock na ito.',
        icon: ArrowRight
      }
    ];

    return steps;
  };

  const getExpirationDate = (dateApplied) => {
    if (!dateApplied) return 'N/A';
    const date = new Date(dateApplied);
    date.setFullYear(date.getFullYear() + 1); 
    const locale = language === 'fil' ? 'tl-PH' : 'en-US';
    return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleDirectDownload = (unit) => {
    setSelectedUnit(unit);
    setIsPrintOpen(true);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleConfirmCancel = async () => {
    if (!cancelModal.unit) return;
    setCancelModal(prev => ({ ...prev, isSubmitting: true }));
    const finalReason = (cancelModal.reason === 'Other reason (Please specify below)' || cancelModal.reason === 'Iba pang dahilan (Pakilagay sa ibaba)')
      ? (cancelModal.customReason?.trim() || 'Cancelled by operator') 
      : cancelModal.reason;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/${cancelModal.unit._id}/cancel`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cancelReason: finalReason })
      });

      if (res.ok) {
        setCancelModal({ isOpen: false, unit: null, reason: CANCEL_REASONS[0], customReason: '', isSubmitting: false });
        fetchMyFranchises();
      } else {
        const d = await res.json();
        alert(d.message || "Unable to cancel application.");
        setCancelModal(prev => ({ ...prev, isSubmitting: false }));
      }
    } catch (err) {
      alert("Network error. Cannot connect to server.");
      setCancelModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // Visual application tracker
  const renderApplicationTracker = (status) => {
    if (status === 'Active') return null;

    if (status === 'Cancelled') {
      return (
        <div className="mb-5 bg-red-50/80 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl p-3.5 flex items-start gap-2.5">
          <AlertCircle className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-xs font-bold text-red-900 dark:text-red-300">{t('dashboard.attentionTitle', 'Application Needs Attention')}</p>
            <p className="text-[11px] text-red-700 dark:text-red-400 leading-snug">{t('dashboard.attentionDesc', 'Please review the reason below and click "Fix Issues" to re-submit corrected details.')}</p>
          </div>
        </div>
      );
    }

    if (status === 'Expired') {
      return (
        <div className="mb-5 bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 rounded-2xl p-3.5 flex items-start gap-2.5">
          <AlertCircle className="text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-xs font-bold text-orange-900 dark:text-orange-300">{t('dashboard.expiredTitle', 'Franchise Expired')}</p>
            <p className="text-[11px] text-orange-700 dark:text-orange-400 leading-snug">{t('dashboard.expiredDesc', 'Your franchise validity has ended. Click "Renew Franchise" to submit your updated CTC/Cedula.')}</p>
          </div>
        </div>
      );
    }

    const steps = [
      { id: 1, label: t('dashboard.stepSubmitted', 'Submitted') },
      { id: 2, label: t('dashboard.stepReview', 'Review') },
      { id: 3, label: t('dashboard.stepPayment', 'Payment') },
      { id: 4, label: t('dashboard.stepActive', 'Active') }
    ];

    let currentStepNum = 1;
    if (status === 'Pending') currentStepNum = 2;
    else if (status === 'Ready for Pickup') currentStepNum = 3;
    else if (status === 'Active') currentStepNum = 4;

    return (
      <div className="mb-5 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3.5 sm:mb-4">
          {t('dashboard.appProgress', 'Application Progress')}
        </p>
        
        {/* Seamless Step progress track & nodes */}
        <div className="flex items-start w-full">
          {steps.map((step, idx) => {
            const isCompleted = currentStepNum > step.id || (status === 'Active' && step.id === 4);
            const isCurrent = currentStepNum === step.id && status !== 'Active';

            return (
              <div key={step.id} className="relative flex-1 flex flex-col items-center group">
                {/* Seamless Connector Line to Next Step */}
                {idx < steps.length - 1 && (
                  <div className="absolute top-4 left-1/2 w-full h-[3px] -translate-y-1/2 z-0 pointer-events-none">
                    {/* Background Inactive Track */}
                    <div className="w-full h-full bg-slate-200 dark:bg-slate-700/80 rounded-full" />
                    {/* Active Progress Fill */}
                    <div 
                      className={`absolute top-0 left-0 h-full bg-[#7A1B22] dark:bg-[#D4AF37] rounded-full transition-all duration-500 ease-out ${
                        currentStepNum > step.id ? 'w-full' : 'w-0'
                      }`} 
                    />
                  </div>
                )}

                {/* Step Circle Badge */}
                <div 
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isCompleted 
                      ? 'bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-900 shadow-xs' 
                      : isCurrent 
                      ? 'bg-white dark:bg-slate-800 border-2 border-[#7A1B22] dark:border-[#D4AF37] ring-4 ring-[#7A1B22]/15 dark:ring-[#D4AF37]/20 shadow-xs' 
                      : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={16} className="stroke-[3]" />
                  ) : isCurrent ? (
                    <div className="w-2.5 h-2.5 bg-[#7A1B22] dark:bg-[#D4AF37] rounded-full animate-pulse" />
                  ) : (
                    <div className="w-2 h-2 bg-slate-300 dark:bg-slate-700 rounded-full" />
                  )}
                </div>

                {/* Step Label */}
                <span className={`text-xs mt-2 tracking-tight text-center truncate max-w-full px-0.5 transition-colors ${
                  isCurrent 
                    ? 'text-[#7A1B22] dark:text-[#D4AF37] font-black' 
                    : isCompleted 
                    ? 'text-slate-800 dark:text-slate-200 font-bold' 
                    : 'text-slate-400 dark:text-slate-500 font-semibold'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getOperatorGreeting = () => {
    const hour = currentTime.getHours();
    const portalTag = isTodaPresident 
      ? t('dashboard.badgeToda', 'TODA President Portal') 
      : t('dashboard.badge', 'Operator Portal');

    if (hour >= 5 && hour < 12) {
      return { 
        text: t('greeting.morning', 'Good morning'), 
        tag: portalTag,
        icon: Sun, 
        badgeColor: 'text-amber-300' 
      };
    } else if (hour >= 12 && hour < 18) {
      return { 
        text: t('greeting.afternoon', 'Good afternoon'), 
        tag: portalTag,
        icon: SunMedium, 
        badgeColor: 'text-orange-300' 
      };
    } else {
      return { 
        text: t('greeting.evening', 'Good evening'), 
        tag: portalTag,
        icon: Moon, 
        badgeColor: 'text-indigo-200' 
      };
    }
  };

  const getOperatorSubtext = () => {
    const hasReady = franchises.some(f => f.status === 'Ready for Pickup');
    const hasPending = franchises.some(f => f.status === 'Pending');
    const hasActive = franchises.some(f => f.status === 'Active');

    if (hasReady) return t('greeting.subReady', 'Welcome back! Your MTOP Certificate is ready for pickup at the Municipal Cashier.');
    if (hasPending) return t('greeting.subPending', 'Welcome back! Your franchise application is currently under municipal review.');
    if (hasActive) return t('greeting.subActive', 'Welcome back! Your registered tricycle franchise is active and road-authorized.');
    return t('dashboard.welcomeSub', 'Welcome back! Manage your active and pending franchises securely.');
  };

  const opGreeting = getOperatorGreeting();
  const OpGreetingIcon = opGreeting.icon;

  return (
    <MainLayout>
      <style>{`
        @keyframes slideFadeUp { 0% { opacity: 0; transform: translateY(22px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes floatSlow { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(15px, -15px) scale(1.1); } }
        .animate-dashboard-card { opacity: 0; animation: slideFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-banner-orb { animation: floatSlow 8s ease-in-out infinite alternate; }
        @media print {
          body:not(.printing-claim-stub) * { visibility: hidden; }
          body:not(.printing-claim-stub) #printable-document, 
          body:not(.printing-claim-stub) #printable-document * { visibility: visible; }
          body:not(.printing-claim-stub) #printable-document { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      {/* 1. ELEVATED MOBILE & DESKTOP HERO APP HEADER (Matching media_1788958383307.jpg) */}
      <div 
        id="tour-hero-banner"
        className="animate-spring-in bg-gradient-to-br from-[#681419] via-[#7A1B22] to-[#3a0b0f] dark:from-[#0d121f] dark:via-[#1e0e15] dark:to-[#0a0d16] rounded-3xl p-4 sm:p-7 mb-6 text-white shadow-xl dark:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.85)] relative overflow-hidden border border-[#D4AF37]/30 transition-all"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 dark:bg-[#D4AF37]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none animate-banner-orb" />
        
        {/* Top Native Mobile Header Bar: Avatar (with Logout Menu) + Greeting + Micro-actions */}
        <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            {/* Interactive Circular Avatar with Profile Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(prev => !prev)}
                className="w-11 h-11 rounded-full border-2 border-[#D4AF37] shadow-md overflow-hidden bg-[#520f14] flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer ring-2 ring-white/20 hover:ring-[#D4AF37]/50"
                title={language === 'fil' ? 'Aking Account at Logout' : 'My Account & Logout'}
              >
                {profilePic ? (
                  <img src={profilePic} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#D4AF37] font-black text-base">
                    {loggedInUserName.charAt(0).toUpperCase()}
                  </span>
                )}
              </button>

              {/* Profile / Account Bottom Sheet Modal via Portal */}
              {isProfileMenuOpen && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[120] flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4">
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                    onClick={() => setIsProfileMenuOpen(false)}
                  />
                  
                  {/* Sheet / Modal Dialog */}
                  <div 
                    role="dialog"
                    aria-modal="true"
                    className="relative z-10 w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-3xl shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 p-5 sm:p-6 text-slate-900 dark:text-white animate-in slide-in-from-bottom sm:zoom-in-95 duration-250 pb-8 sm:pb-6"
                  >
                    {/* Mobile drag handle */}
                    <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden" />

                    {/* Header with user info and close button */}
                    <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7A1B22] to-[#9E2A2B] dark:from-[#D4AF37] dark:to-[#B8860B] text-white dark:text-slate-950 font-black flex items-center justify-center text-lg shadow-md shrink-0">
                          {loggedInUserName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-black text-base text-slate-900 dark:text-white truncate">
                            {loggedInUserName}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#7A1B22]/10 dark:bg-[#D4AF37]/20 text-[#7A1B22] dark:text-[#D4AF37]">
                              {isTodaPresident ? 'TODA President' : 'Operator'}
                            </span>
                            <span className="text-[11px] text-slate-400">G-TRAMS Gasan</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
                        aria-label="Close"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Quick navigation actions */}
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          navigate('/operator/settings');
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all cursor-pointer group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-[#7A1B22]/10 group-hover:text-[#7A1B22] dark:group-hover:text-[#D4AF37] transition-colors">
                            <Settings size={18} />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                              {language === 'fil' ? 'Mga Setting ng Account' : 'Account Settings'}
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-slate-400">
                              {language === 'fil' ? 'Profile, password at seguridad' : 'Profile, password & security'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setIsTourOpen(true);
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all cursor-pointer group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <Sparkles size={18} />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400">
                              {language === 'fil' ? 'Panoorin ang Gabay (Tour)' : 'Replay Walkthrough Tour'}
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-slate-400">
                              {language === 'fil' ? 'Alamin ang mga features ng portal' : 'Quick visual guide of portal features'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          navigate('/help-support');
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all cursor-pointer group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            <HelpCircle size={18} />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                              {language === 'fil' ? 'Gabay at Suporta' : 'Help & Support'}
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-slate-400">
                              {language === 'fil' ? 'FAQs, hotline at impormasyon' : 'FAQs, hotline & info'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>

                    {/* Prominent Log Out */}
                    <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center justify-center gap-2.5 p-3 rounded-2xl text-xs sm:text-sm font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/70 transition-all cursor-pointer active:scale-98"
                      >
                        <LogOut size={16} className="stroke-[2.5]" />
                        <span>{language === 'fil' ? 'Mag-logout sa Account' : 'Log Out of Account'}</span>
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}
            </div>

            {/* Greeting & Bold User Name */}
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">
                {opGreeting.text},
              </span>
              <span className="text-base sm:text-xl font-black text-white tracking-tight truncate">
                {loggedInUserName}!
              </span>
            </div>
          </div>

          {/* Micro Action Buttons in Frosted Glass Circles (Theme & Bell only) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Theme Toggle Circle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? "Light Mode" : "Dark Mode"}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-2xs cursor-pointer"
            >
              {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-indigo-200" />}
            </button>

            {/* Notification Bell Circle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-2xs cursor-pointer"
              >
                <Bell size={17} />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* In-Header Notification Modal via Portal */}
              {isNotifOpen && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[120] flex flex-col justify-end sm:justify-start sm:items-end p-0 sm:p-4 sm:pt-16 sm:pr-8">
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
                    onClick={() => setIsNotifOpen(false)} 
                  />

                  {/* Notification Card */}
                  <div 
                    role="dialog"
                    aria-modal="true"
                    className="relative z-10 w-full sm:w-96 bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-3xl shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 py-4 text-slate-900 dark:text-white animate-in slide-in-from-bottom sm:slide-in-from-top-2 duration-250 max-h-[85vh] flex flex-col"
                  >
                    {/* Mobile drag bar */}
                    <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

                    {/* Header */}
                    <div className="px-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Bell size={16} className="text-[#7A1B22] dark:text-[#D4AF37]" />
                          <h4 className="font-black text-sm text-slate-900 dark:text-white">
                            {t('nav.notifications', 'Notifications')}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {unreadNotifCount > 0 ? `${unreadNotifCount} ${language === 'fil' ? 'bagong abiso' : 'update(s)'}` : t('nav.allCaughtUp', 'All caught up')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {unreadNotifCount > 0 && (
                          <button 
                            type="button"
                            onClick={markAllNotifsRead} 
                            className="text-[11px] font-bold text-[#7A1B22] dark:text-[#D4AF37] hover:underline cursor-pointer"
                          >
                            {t('nav.markAllRead', 'Mark all read')}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsNotifOpen(false)}
                          className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Close"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 flex-1 max-h-[60vh] overscroll-contain">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center flex flex-col items-center justify-center">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 mb-2.5">
                            <Bell size={22} />
                          </div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('nav.noNotifications', 'No new notifications')}</p>
                          <p className="text-[11px] text-slate-400 mt-1 max-w-xs">{language === 'fil' ? 'Lilitaw dito ang mga update sa prangkisa at mga anunsyo.' : 'Franchise updates and announcements will appear here.'}</p>
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              if (notif.action) notif.action();
                              else if (notif.link) navigate(notif.link);
                              setIsNotifOpen(false);
                            }}
                            className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                          >
                            <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{notif.title}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">{notif.desc}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>,
                document.body
              )}
            </div>
          </div>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="relative z-10 pt-4 pb-2">
          <div className="inline-flex items-center gap-1.5 bg-white/10 dark:bg-white/5 backdrop-blur-md px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase mb-2 border border-white/15 dark:border-white/10 shadow-2xs">
            <OpGreetingIcon size={12} className={opGreeting.badgeColor} />
            <span>{opGreeting.tag}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1 text-white">
            {language === 'fil' ? 'Pamahalaang Bayan ng Gasan' : 'Gasan Municipal Transport'}
          </h1>
          <p className="text-white/80 dark:text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
            {getOperatorSubtext()}
          </p>
        </div>

        {/* Action Status Banner */}
        <div id="tour-hero-action" className="relative z-10 mt-3 pt-3 border-t border-white/10">
          {franchises.some(f => f.status === 'Ready for Pickup') ? (
            <div className="bg-white/95 dark:bg-slate-900/95 text-slate-950 dark:text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg backdrop-blur-md border border-white/20">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Receipt size={18} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold truncate">
                    {language === 'fil' ? 'Aprubado na ang Prangkisa!' : 'Franchise Approved!'}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                    {language === 'fil' ? 'Handa na ang Claim Stub para sa Municipal Cashier' : 'Claim Stub is ready for Municipal Cashier'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const target = franchises.find(f => f.status === 'Ready for Pickup');
                  if (target) {
                    setSelectedUnit(target);
                    setIsPrintOpen(true);
                  }
                }}
                className="w-full sm:w-auto bg-[#7A1B22] hover:bg-[#5A1419] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] text-white dark:text-slate-950 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shrink-0 transition-all active:scale-95 shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Receipt size={15} />
                <span>{language === 'fil' ? 'Kunin ang Claim Stub' : 'Get Voucher'}</span>
              </button>
            </div>
          ) : franchises.some(f => f.status === 'Cancelled') ? (
            <div className="bg-white/95 dark:bg-slate-900/95 text-slate-950 dark:text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg backdrop-blur-md border border-red-300 dark:border-red-900/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <AlertCircle size={18} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold truncate">
                    {language === 'fil' ? 'Kailangang Ayusin ang Aplikasyon' : 'Application Needs Attention'}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                    {language === 'fil' ? 'Pakitugunan ang puna ng LGU evaluator' : 'Review remarks and submit corrected documents'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/apply-franchise')}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shrink-0 transition-all active:scale-95 shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={15} />
                <span>{language === 'fil' ? 'Ayusin Ngayon' : 'Fix Issues'}</span>
              </button>
            </div>
          ) : (
            <div className="bg-white/10 dark:bg-white/5 text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-md border border-white/15">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold truncate">
                    {franchises.length >= maxUnits 
                      ? (language === 'fil' ? `Kumpleto ang Kapasidad (${maxUnits}/${maxUnits} Yunit)` : `Maximum Fleet Capacity (${maxUnits}/${maxUnits})`)
                      : (language === 'fil' ? 'May Bakanteng Slot Para sa Prangkisa' : 'Available Franchise Slot')}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-white/80 mt-0.5">
                    {franchises.length >= maxUnits
                      ? (language === 'fil' ? `Lahat ng pinapayagang ${maxUnits} units ay rehistrado` : `All allowed ${maxUnits} units are currently registered`)
                      : (language === 'fil' ? `Maaari kang mag-rehistro ng hanggang ${maxUnits} units sa Gasan` : `Registered operators may register up to ${maxUnits} units in Gasan`)}
                  </p>
                </div>
              </div>
              {franchises.length < maxUnits && (
                <button
                  onClick={() => navigate('/apply-franchise')}
                  className="w-full sm:w-auto bg-[#D4AF37] hover:bg-[#c29e2f] text-slate-950 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shrink-0 transition-all active:scale-95 shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <PlusCircle size={15} />
                  <span>{language === 'fil' ? 'Mag-apply ng Prangkisa' : 'Apply Now'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. FLEET CAPACITY SLOTS (Dynamic with Admin Settings, Clean & Minimal) */}
      <div 
        id="tour-capacity-card"
        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xs mb-5 transition-all"
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {language === 'fil' ? 'Kapasidad ng Prangkisa' : 'Fleet Capacity'}
            </span>
            <span className="text-xs font-bold text-[#7A1B22] dark:text-[#D4AF37]">
              {franchises.length} / {maxUnits}
            </span>
          </div>

          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {franchises.length >= maxUnits 
              ? (language === 'fil' ? 'Puno na ang Slots' : 'Slots Full') 
              : (language === 'fil' ? `May ${maxUnits - franchises.length} Bakanteng Slot` : `${maxUnits - franchises.length} Slot(s) Available`)}
          </span>
        </div>

        {/* Dynamic Slot Bars */}
        <div 
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${maxUnits}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: maxUnits }).map((_, idx) => {
            const isFilled = idx < franchises.length;
            return (
              <div key={idx} className="relative">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isFilled 
                      ? 'bg-[#7A1B22] dark:bg-[#D4AF37]' 
                      : 'bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80'
                  }`} 
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. GARAGE SECTION HEADER */}
      <header id="tour-garage-section" className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-75 mb-4 flex flex-col sm:flex-row justify-between sm:items-end gap-3">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 bg-[#7A1B22] dark:bg-[#D4AF37] rounded-full" />
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {t('dashboard.garageTitle', 'My Franchise Garage')}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
              {language === 'fil' ? 'Mga nakatalang motor at prangkisa sa ilalim ng iyong account' : t('dashboard.garageSub', 'Assigned tricycle units under your account')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
            {franchises.length} {language === 'fil' ? 'Nakatala' : 'Registered'}
          </span>
        </div>
      </header>

      {/* 4. GARAGE UNITS LIST / EMPTY STATE */}
      {isLoading ? (
        <GarageGridSkeleton count={2} baseDelay={70} />
      ) : franchises.length === 0 ? (
        <div 
          id="tour-empty-garage"
          className="animate-in fade-in slide-in-from-bottom-3 duration-300 delay-100 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-6 sm:p-10 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center min-h-[260px] transition-colors shadow-2xs"
        >
          {/* Glowing Halo Icon Container */}
          <div className="relative mb-3">
            <div className="absolute inset-0 bg-[#7A1B22]/15 dark:bg-[#D4AF37]/20 rounded-full blur-lg scale-125 animate-pulse pointer-events-none" />
            <div className="relative w-14 h-14 bg-gradient-to-br from-red-50 to-amber-50 dark:from-slate-800 dark:to-slate-800/80 rounded-2xl border border-red-200/60 dark:border-amber-800/40 flex items-center justify-center text-[#7A1B22] dark:text-[#D4AF37] shadow-2xs">
              <Car size={26} />
            </div>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">
            {language === 'fil' ? 'Wala Ka Pang Nakatalang Tricycle' : t('dashboard.noUnitsTitle', 'No Franchise Units Found')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 max-w-sm leading-relaxed">
            {language === 'fil' 
              ? 'Magsimula sa pamamagitan ng pagpaparehistro ng iyong unang tricycle unit upang makakuha ng opisyal na prangkisa mula sa Munisipyo ng Gasan.' 
              : t('dashboard.noUnitsDesc', 'Your garage is currently empty. Register your tricycle unit for a franchise.')}
          </p>

          <button 
            onClick={() => navigate('/apply-franchise')} 
            className="inline-flex items-center gap-1.5 bg-[#7A1B22] hover:bg-[#5A1419] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] text-white dark:text-slate-950 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <PlusCircle size={16} />
            <span>{language === 'fil' ? 'Mag-apply ng Bagong Prangkisa' : t('dashboard.applyNew', 'Apply New Franchise')}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6">
          {franchises.map((unit, unitIndex) => (
            <div 
              key={unit?._id} 
              className="animate-spring-in bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden group"
              style={{ animationDelay: `${0.04 + unitIndex * 0.08}s` }}
            >
              {/* Top Accent Strip */}
              <div className={`absolute top-0 left-0 w-full h-1.5 ${
                unit?.status === 'Active' ? 'bg-emerald-500' :
                unit?.status === 'Ready for Pickup' ? 'bg-blue-500' :
                unit?.status === 'Expired' ? 'bg-orange-500' :
                unit?.status === 'Cancelled' ? 'bg-red-500' : 'bg-amber-400'
              }`} />

              <div>
                {/* Header Row: TODA tag & Status Badge */}
                <div className="flex justify-between items-center mb-3 mt-0.5 gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-[11px] font-black uppercase tracking-wider border border-slate-200/60 dark:border-slate-700/60 truncate">
                    <Users size={12} className="text-[#7A1B22] dark:text-[#D4AF37] shrink-0" />
                    <span className="truncate">{unit?.todaName || 'TODA'}</span>
                  </span>

                  <span className={`px-2.5 py-1 text-[10px] font-black rounded-xl uppercase tracking-wider flex items-center gap-1.5 border shadow-2xs shrink-0 ${
                    unit?.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60' :
                    unit?.status === 'Ready for Pickup' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60' :
                    unit?.status === 'Expired' ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/60' :
                    unit?.status === 'Cancelled' ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/60' :
                    'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                  }`}>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      unit?.status === 'Active' ? 'bg-emerald-500' :
                      unit?.status === 'Ready for Pickup' ? 'bg-blue-500 animate-pulse-beacon' :
                      unit?.status === 'Expired' ? 'bg-orange-500' :
                      unit?.status === 'Cancelled' ? 'bg-red-500' : 'bg-amber-500 animate-pulse-beacon'
                    }`} />
                    {unit?.status === 'Active' ? t('dashboard.statusActive', 'Active') :
                     unit?.status === 'Ready for Pickup' ? t('dashboard.statusReadyPickup', 'Awaiting Payment') :
                     unit?.status === 'Expired' ? t('dashboard.statusExpired', 'Expired') :
                     unit?.status === 'Cancelled' ? t('dashboard.statusCancelled', 'Cancelled') :
                     t('dashboard.statusPending', 'Pending')}
                  </span>
                </div>

                {/* Modern Government MTOP Plate Box */}
                <div 
                  id={unitIndex === 0 ? "tour-mtop-plate" : undefined}
                  className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-slate-800/70 dark:to-slate-800/30 border border-slate-200/90 dark:border-slate-700/80 mb-3.5 flex items-center justify-between relative overflow-hidden"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7A1B22] dark:bg-[#D4AF37]" />
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400 truncate">
                        MUNICIPALITY OF GASAN &bull; MTOP
                      </p>
                    </div>
                    <h3 className="font-mono text-lg sm:text-xl font-bold tracking-wider text-slate-900 dark:text-white truncate">
                      {unit?.plateNo || t('dashboard.pendingPlate', 'PENDING')}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block px-2.5 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight shadow-2xs">
                      {unit?.make || 'Tricycle'}
                    </span>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 uppercase">
                      {unit?.made || 'Model'}
                    </p>
                  </div>
                </div>

                {/* Minimalist 2x2 Specs Grid */}
                <div 
                  id={unitIndex === 0 ? "tour-specs-grid" : undefined}
                  className="grid grid-cols-2 gap-2.5 mb-3.5"
                >
                  <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700/60 flex items-center justify-center text-[#7A1B22] dark:text-[#D4AF37] shrink-0 shadow-2xs">
                      <MapPin size={12} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">{t('dashboard.routeZone', 'Route Zone')}</p>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{unit?.zone || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700/60 flex items-center justify-center text-[#7A1B22] dark:text-[#D4AF37] shrink-0 shadow-2xs">
                      <Hash size={12} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">{t('dashboard.motorNumber', 'Motor Number')}</p>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{unit?.motorNo || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div id={unitIndex === 0 ? "tour-tracker-section" : undefined}>
                  {renderApplicationTracker(unit?.status)}

                  {unit?.status === 'Active' && (() => {
                    const daysRemaining = calculateDaysRemaining(unit?.dateApplied);
                    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 60 && daysRemaining > 0;
                    const isOverdue = daysRemaining !== null && daysRemaining <= 0;

                    return (
                      <div className={`mb-3.5 p-3 rounded-2xl border transition-all ${
                        isOverdue
                          ? 'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-900/60'
                          : isExpiringSoon
                          ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60'
                          : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50'
                      }`}>
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays size={13} className={isOverdue ? 'text-red-600 dark:text-red-400' : isExpiringSoon ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'} />
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isOverdue ? 'text-red-800 dark:text-red-300' : isExpiringSoon ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-800 dark:text-emerald-300'}`}>
                              {t('dashboard.validUntil', 'Valid Until')}
                            </span>
                          </div>
                          <p className={`text-xs font-bold ${isOverdue ? 'text-red-950 dark:text-red-200' : isExpiringSoon ? 'text-amber-950 dark:text-amber-200' : 'text-emerald-950 dark:text-emerald-200'}`}>
                            {getExpirationDate(unit?.dateApplied)}
                          </p>
                        </div>

                        {/* Traffic-Light Urgency Meter */}
                        {daysRemaining !== null && (
                          <div className="space-y-1 pt-0.5">
                            <div className="flex justify-between items-center text-[10px] font-semibold">
                              <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                Status
                              </span>
                              <span className={`flex items-center gap-1 font-bold ${
                                isOverdue ? 'text-red-600 dark:text-red-400' : isExpiringSoon ? 'text-amber-600 dark:text-amber-400 animate-pulse' : 'text-emerald-700 dark:text-emerald-400'
                              }`}>
                                {isOverdue 
                                  ? `⚠️ Overdue by ${Math.abs(daysRemaining)} days` 
                                  : isExpiringSoon 
                                  ? `⏳ Renewal Window Open • ${daysRemaining} days left` 
                                  : `✓ Active • ${daysRemaining} days remaining`}
                              </span>
                            </div>

                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isOverdue ? 'w-full bg-red-500' : isExpiringSoon ? 'w-3/4 bg-amber-500' : 'w-full bg-emerald-500'
                                }`} 
                              />
                            </div>

                            {isExpiringSoon && (
                              <div className="pt-1.5 flex items-center justify-between">
                                <p className="text-[10px] text-amber-800 dark:text-amber-300 font-medium leading-tight">
                                  Within 60-day renewal window. Renew early to avoid penalties.
                                </p>
                                <button
                                  onClick={() => navigate(`/renew-franchise/${unit._id}`)}
                                  className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-md shadow-2xs transition-colors shrink-0 ml-2 active:scale-95 cursor-pointer"
                                >
                                  Renew Now
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {unit?.status === 'Ready for Pickup' && (
                    <div className="mb-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 p-3 rounded-2xl flex items-start gap-2.5">
                      <FileText className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={16} />
                      <div>
                        <h4 className="text-blue-900 dark:text-blue-200 font-bold text-xs uppercase mb-0.5">{t('dashboard.approvedPaymentTitle', 'Approved! Next Step: Payment')}</h4>
                        <p className="text-[11px] font-normal text-blue-700 dark:text-blue-300 leading-snug">{t('dashboard.approvedPaymentDesc', 'Present your Claim Stub to the Municipal Cashier to pay the fee and claim your Official Permit.')} (<b>₱{parseFloat(systemFranchiseFee).toFixed(2)}</b>)</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Row */}
              <div 
                id={unitIndex === 0 ? "tour-card-actions" : undefined}
                className="flex flex-col sm:flex-row gap-2 mt-auto pt-3 border-t border-slate-100 dark:border-slate-800"
              >
                {unit?.status === 'Expired' ? (
                  <button onClick={() => navigate('/apply-franchise')} className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs"><RefreshCw size={14} /> {t('dashboard.btnRenew', 'Renew Franchise')}</button>
                ) : unit?.status === 'Active' ? (
                  <button onClick={() => { setSelectedUnit(unit); setIsDetailsOpen(true); }} className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer">{t('dashboard.btnViewDetails', 'View Details')}</button>
                ) : unit?.status === 'Ready for Pickup' ? (
                  <div className="flex flex-col sm:flex-row w-full gap-2">
                    <button 
                      onClick={() => { setSelectedUnit(unit); setIsPrintOpen(true); }} 
                      className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#c59f2c] text-slate-950 hover:opacity-95 font-bold text-xs sm:text-sm py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
                    >
                      <Receipt size={14} /> {t('dashboard.btnViewStub', 'Claim Stub')}
                    </button>
                    <button 
                      onClick={() => handleDirectDownload(unit)} 
                      className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                      title="Download PDF"
                    >
                      <Download size={14} />
                      <span className="sm:hidden font-bold">Download</span>
                    </button>
                    <button 
                      onClick={() => { setSelectedUnit(unit); setIsDetailsOpen(true); }} 
                      className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors active:scale-95 cursor-pointer"
                    >
                      {t('dashboard.btnViewDetails', 'Details')}
                    </button>
                  </div>
                ) : unit?.status === 'Cancelled' ? (
                  <button onClick={() => { localStorage.setItem('reapply_target', JSON.stringify(unit)); navigate('/apply-franchise'); }} className="w-full bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs">
                    <RefreshCw size={14} /> {t('dashboard.btnFixIssues', 'Fix Issues')}
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center w-full gap-2">
                    <button onClick={() => { setSelectedUnit(unit); setIsDetailsOpen(true); }} className="w-full sm:flex-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors active:scale-95 cursor-pointer">{t('dashboard.btnViewDetails', 'View Details')}</button>
                    {(unit?.status === 'Pending' || unit?.status === 'Ready for Pickup') && (
                      <button 
                        onClick={() => setCancelModal({
                          isOpen: true,
                          unit,
                          reason: CANCEL_REASONS[0],
                          customReason: '',
                          isSubmitting: false
                        })}
                        className="w-full sm:w-auto bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-900/60 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
                      >
                        <XCircle size={14} /> Cancel
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {isDetailsOpen && selectedUnit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsDetailsOpen(false)} />
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl relative z-10 p-5 sm:p-7 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('dashboard.modalSpecsTitle', 'Unit Specifications')}</h2>
              <button onClick={() => setIsDetailsOpen(false)} className="text-slate-400 hover:text-red-500 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <div className="sm:col-span-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                <p className="text-slate-400 dark:text-slate-500 font-semibold uppercase text-[10px]">{t('dashboard.operator', 'Operator')}</p>
                <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{selectedUnit?.fullName}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl"><p className="text-slate-400 dark:text-slate-500 font-semibold uppercase text-[10px]">{t('dashboard.toda', 'TODA')}</p><p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mt-0.5">{selectedUnit?.todaName}</p></div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl"><p className="text-slate-400 dark:text-slate-500 font-semibold uppercase text-[10px]">{t('dashboard.routeZone', 'Route Zone')}</p><p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mt-0.5">Zone {selectedUnit?.zone}</p></div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl"><p className="text-slate-400 dark:text-slate-500 font-semibold uppercase text-[10px]">{t('dashboard.plateNo', 'Plate No.')}</p><p className="font-mono font-bold text-sm sm:text-base text-slate-900 dark:text-white mt-0.5">{selectedUnit?.plateNo || 'N/A'}</p></div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl"><p className="text-slate-400 dark:text-slate-500 font-semibold uppercase text-[10px]">{t('dashboard.makeModel', 'Make & Model')}</p><p className="font-medium text-xs sm:text-sm text-slate-900 dark:text-white mt-0.5">{selectedUnit?.make} ({selectedUnit?.made})</p></div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl"><p className="text-slate-400 dark:text-slate-500 font-semibold uppercase text-[10px]">{t('dashboard.motorNumber', 'Motor Number')}</p><p className="font-mono font-medium text-xs text-slate-900 dark:text-white mt-0.5">{selectedUnit?.motorNo}</p></div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl"><p className="text-slate-400 dark:text-slate-500 font-semibold uppercase text-[10px]">{t('dashboard.chassisNumber', 'Chassis Number')}</p><p className="font-mono font-medium text-xs text-slate-900 dark:text-white mt-0.5">{selectedUnit?.chassisNo}</p></div>
            </div>
            <button onClick={() => setIsDetailsOpen(false)} className="w-full mt-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer">{t('dashboard.btnClose', 'Close')}</button>
          </div>
        </div>
      )}

      {/* Official Voucher Claim Stub (NO QR or Barcode) */}
      <ClaimStubVoucher 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        unit={selectedUnit} 
        systemFranchiseFee={systemFranchiseFee} 
      />

      {/* Operator Application Cancellation Modal */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200" 
            onClick={() => !cancelModal.isSubmitting && setCancelModal(prev => ({ ...prev, isOpen: false }))} 
          />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl relative z-10 p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
                <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center shrink-0">
                  <XCircle size={18} />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">Cancel Application</h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Unit: {cancelModal.unit?.plateNo || 'PENDING PLATE'}</p>
                </div>
              </div>
              <button 
                disabled={cancelModal.isSubmitting}
                onClick={() => setCancelModal(prev => ({ ...prev, isOpen: false }))} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3.5 rounded-2xl flex items-start gap-2.5">
                <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
                  Notice: Cancelling this application will set its status to <b>Cancelled</b>. The reason provided will be recorded and visible to the LGU Admin.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Select Reason for Cancellation:
                </label>
                <div className="space-y-2">
                  {CANCEL_REASONS.map((r, idx) => (
                    <label 
                      key={idx} 
                      className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                        cancelModal.reason === r 
                          ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20 text-slate-900 dark:text-white font-bold' 
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="dash_cancel_reason"
                        checked={cancelModal.reason === r}
                        onChange={() => setCancelModal(prev => ({ ...prev, reason: r }))}
                        className="mt-0.5 text-red-600 focus:ring-red-500"
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              {cancelModal.reason === "Other reason (Please specify below)" && (
                <div className="animate-in fade-in duration-150">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Other Reason Details:
                  </label>
                  <textarea
                    rows={3}
                    value={cancelModal.customReason}
                    onChange={(e) => setCancelModal(prev => ({ ...prev, customReason: e.target.value }))}
                    placeholder="Enter reason for cancelling..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={cancelModal.isSubmitting}
                onClick={() => setCancelModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                disabled={cancelModal.isSubmitting || (cancelModal.reason === "Other reason (Please specify below)" && !cancelModal.customReason?.trim())}
                onClick={handleConfirmCancel}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelModal.isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                {cancelModal.isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* First-Time Login Language Preference Modal */}
      <LanguagePreferenceModal 
        isOpen={isLangModalOpen} 
        onConfirm={handleLanguageConfirmed} 
      />

      {/* Interactive Spotlight Walkthrough Tour */}
      <SpotlightTour 
        isOpen={isTourOpen} 
        onClose={handleCloseTour} 
        steps={getTourSteps()} 
      />
    </MainLayout>
  );
};

export default OperatorDashboard;
