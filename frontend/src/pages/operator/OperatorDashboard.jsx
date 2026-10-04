import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import MainLayout from '../../components/MainLayout';
import { 
  RefreshCw, AlertCircle, CheckCircle, CheckCircle2, Clock, Loader2, 
  CalendarDays, PlusCircle, MapPin, Hash, Printer, X, ShieldCheck, Download, Eye,
  Check, FileText, User, ShieldAlert, Receipt, XCircle, Banknote,
  Sun, Moon, SunMedium, ArrowRight, Users, Sparkles, HelpCircle,
  Bell, Settings, ChevronRight, LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useTextSize } from '../../context/TextSizeContext';
import TricycleIcon from '../../components/common/TricycleIcon';
import StatusBadge from '../../components/common/StatusBadge';
import { GarageGridSkeleton, SkeletonElement } from '../../components/skeleton';
import ClaimStubVoucher from '../../components/operator/ClaimStubVoucher';
import OperatorGuideModal from '../../components/operator/OperatorGuideModal';
import LanguagePreferenceModal from '../../components/operator/LanguagePreferenceModal';
import FeedbackModal from '../../components/common/FeedbackModal';
import { useNotifications } from '../../context/NotificationContext';
import { 
  getNotificationVisuals, 
  formatRelativeTime, 
  renderRichNotificationMessage 
} from '../../utils/notificationUtils';
import { formatZoneLabel } from '../../utils/constants';

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
  const { textScale, cycleTextScale, scaleLabel } = useTextSize();
  const [franchises, setFranchises] = useState(() => {
    try {
      const cached = localStorage.getItem('gtrams_cached_franchises');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(true);
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
    localStorage.removeItem('gtrams_apply_draft');
    localStorage.removeItem('reapply_target');
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

  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    confirmText: 'OK',
    onConfirm: null
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
  const { notifications, unreadCount: unreadNotifCount, markAllRead, markAsRead } = useNotifications();

  const toggleLanguage = () => {
    const nextLang = language === 'fil' ? 'en' : 'fil';
    if (changeLanguage) changeLanguage(nextLang);
  };

  const calculateDaysRemaining = (unit) => {
    if (!unit) return null;
    const dateToUse = typeof unit === 'object' ? (unit.approvalDate || unit.dateApplied) : unit;
    if (!dateToUse) return null;
    const expDate = new Date(dateToUse);
    expDate.setFullYear(expDate.getFullYear() + 1);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const markAllNotifsRead = () => {
    markAllRead();
  };

  // Re-fetch franchises if we get a status_change notification
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (latest.type === 'status_change' && !latest.isRead) {
        fetchMyFranchises();
      }
    }
  }, [notifications]);

  useEffect(() => {
    fetchMyFranchises();
    fetchSystemSettings();
  }, []);

  const fetchSystemSettings = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/settings`, {
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
        const fee = json.data?.franchiseFee ?? json.franchiseFee;
        if (fee !== undefined && fee !== null) {
          localStorage.setItem('franchise_fee', fee);
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
        const list = Array.isArray(data) ? data : [];
        setFranchises(list);
        try {
          localStorage.setItem('gtrams_cached_franchises', JSON.stringify(list));
        } catch (e) {}
      } else if (response.status === 401 || response.status === 403) {
        setFranchises([]);
      }
    } catch (error) {
      console.warn('Network offline or error loading dashboard units; preserving cached fleet:', error);
      try {
        const cached = localStorage.getItem('gtrams_cached_franchises');
        if (cached) {
          setFranchises(JSON.parse(cached));
        }
      } catch (e) {}
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

  // On-demand guide and language controls: modals do not intrusively auto-popup on fresh loads
  useEffect(() => {
    // Left clean so users can navigate their dashboard without intrusive popups
  }, [isLoading]);

  const handleLanguageConfirmed = (chosenLang) => {
    const uid = getCurrentUserId();
    localStorage.setItem(`gtrams_lang_selected_${uid}`, 'true');
    localStorage.setItem('gtrams_lang_selected', 'true');
    localStorage.setItem('gtrams_lang_selected_global', 'true');
    setIsLangModalOpen(false);

    // After language is chosen, launch the spotlight tour if not yet completed
    const tourKey = `gtrams_operator_tour_done_${uid}`;
    const hasSeenTour = 
      localStorage.getItem(tourKey) === 'true' || 
      localStorage.getItem('gtrams_operator_tour_done') === 'true' || 
      localStorage.getItem('gtrams_operator_tour_done_global') === 'true';

    // Guide is accessible on demand via menu and quick help buttons
  };

  const handleCloseTour = () => {
    const uid = getCurrentUserId();
    setIsTourOpen(false);
    localStorage.setItem(`gtrams_operator_tour_done_${uid}`, 'true');
    localStorage.setItem('gtrams_operator_tour_done', 'true');
    localStorage.setItem('gtrams_operator_tour_done_global', 'true');
  };


  const getExpirationDate = (unit) => {
    if (!unit) return 'N/A';
    const dateToUse = typeof unit === 'object' ? (unit.approvalDate || unit.dateApplied) : unit;
    if (!dateToUse) return 'N/A';
    const date = new Date(dateToUse);
    date.setFullYear(date.getFullYear() + 1); 
    const locale = language === 'fil' ? 'tl-PH' : 'en-US';
    return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleFixIssues = (targetUnit) => {
    if (!targetUnit) return;
    localStorage.setItem('reapply_target', JSON.stringify(targetUnit));
    
    // Determine target field from rejectedField or parse from cancelReason
    let targetField = targetUnit.rejectedField || '';
    if (!targetField && targetUnit.cancelReason) {
      const lower = targetUnit.cancelReason.toLowerCase();
      if (lower.includes('chassis')) targetField = 'chassisNo';
      else if (lower.includes('motor') || lower.includes('engine')) targetField = 'motorNo';
      else if (lower.includes('plate')) targetField = 'plateNo';
      else if (lower.includes('make') || lower.includes('brand')) targetField = 'make';
      else if (lower.includes('year') || lower.includes('made')) targetField = 'made';
      else if (lower.includes('route') || lower.includes('zone')) targetField = 'zone';
      else if (lower.includes('cedula') || lower.includes('ctc')) targetField = 'cedulaDoc';
      else if (lower.includes('or/cr') || lower.includes('orcr') || lower.includes('cr')) targetField = 'orCrDocument';
      else if (lower.includes('license')) targetField = 'license';
      else if (lower.includes('toda')) targetField = 'todaEndorsement';
      else if (lower.includes('barangay') || lower.includes('clearance')) targetField = 'brgyClearance';
    }

    // Determine target step based on targetField
    let targetStep = 1;
    if (['make', 'made', 'motorNo', 'chassisNo', 'plateNo', 'zone'].includes(targetField)) {
      targetStep = 2;
    } else if (['cedulaSerialNo', 'cedulaDate', 'cedulaAddress'].includes(targetField)) {
      targetStep = 3;
    } else if (['orCrDocument', 'license', 'todaEndorsement', 'brgyClearance', 'cedulaDoc'].includes(targetField)) {
      targetStep = 4;
    }

    const focusQuery = targetField ? `&focus=${targetField}` : '';
    navigate(`/apply-franchise?mode=reapply&step=${targetStep}${focusQuery}`);
  };

  const getApplicationValidityInfo = (unit) => {
    if (!unit) return null;
    const filingDate = unit.dateApplied ? new Date(unit.dateApplied) : null;
    const locale = language === 'fil' ? 'tl-PH' : 'en-US';

    if (unit.status === 'Pending' || unit.status === 'For Signing') {
      if (!filingDate) return null;
      // 30 calendar days evaluation window
      const deadline = new Date(filingDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const now = new Date();
      const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        filingDateStr: filingDate.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }),
        deadlineStr: deadline.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }),
        diffDays,
        isUrgent: diffDays <= 7 && diffDays >= 0,
        isOverdue: diffDays < 0,
        type: 'evaluation'
      };
    }

    if (unit.status === 'Ready for Pickup') {
      const baseDate = unit.approvalDate ? new Date(unit.approvalDate) : (filingDate || new Date());
      // 30 calendar days payment & claim window
      const deadline = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const now = new Date();
      const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        filingDateStr: baseDate.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }),
        deadlineStr: deadline.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }),
        diffDays,
        isUrgent: diffDays <= 7 && diffDays >= 0,
        isOverdue: diffDays < 0,
        type: 'payment'
      };
    }

    return null;
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
    const finalReason = (cancelModal.reason === 'Other reason (Please specify below)')
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
        setFeedbackModal({
          isOpen: true,
          type: 'error',
          title: 'Cancellation Failed',
          message: d.message || "Unable to cancel application.",
          confirmText: 'OK',
          onConfirm: () => setFeedbackModal(prev => ({ ...prev, isOpen: false }))
        });
        setCancelModal(prev => ({ ...prev, isSubmitting: false }));
      }
    } catch (err) {
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'Network Error',
        message: "Cannot connect to server.",
        confirmText: 'OK',
        onConfirm: () => setFeedbackModal(prev => ({ ...prev, isOpen: false }))
      });
      setCancelModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // Visual application tracker
  const renderApplicationTracker = (status) => {
    if (status === 'Active') return null;

    if (status === 'Cancelled') {
      return (
        <div className="mb-4 bg-[#FEE2E2]/50 dark:bg-[#7F1D1D]/20 border border-[#EF4444]/30 rounded-lg p-3.5 flex items-start gap-2.5">
          <AlertCircle className="text-[#B91C1C] dark:text-[#EF4444] shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-xs font-bold text-[#991B1B] dark:text-[#FCA5A5]">{t('dashboard.attentionTitle', 'Application Needs Attention')}</p>
            <p className="text-xs text-[#B91C1C] dark:text-[#F87171] leading-snug mt-0.5">{t('dashboard.attentionDesc', 'Please review the reason below and click "Fix Issues" to re-submit corrected details.')}</p>
          </div>
        </div>
      );
    }

    if (status === 'Expired') {
      return (
        <div className="mb-4 bg-[#FEF3C7]/50 dark:bg-[#78350F]/20 border border-[#F59E0B]/30 rounded-lg p-3.5 flex items-start gap-2.5">
          <AlertCircle className="text-[#B45309] dark:text-[#F59E0B] shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-xs font-bold text-[#92400E] dark:text-[#FDE68A]">{t('dashboard.expiredTitle', 'Franchise Expired')}</p>
            <p className="text-xs text-[#B45309] dark:text-[#FCD34D] leading-snug mt-0.5">{t('dashboard.expiredDesc', 'Your franchise validity has ended. Click "Renew Franchise" to submit your updated CTC/Cedula.')}</p>
          </div>
        </div>
      );
    }

    const steps = [
      { id: 1, label: 'Submit' },
      { id: 2, label: 'Review' },
      { id: 3, label: 'Sign' },
      { id: 4, label: 'Pay' },
      { id: 5, label: 'Active' }
    ];

    let currentStepNum = 1;
    if (status === 'Pending') currentStepNum = 2;
    else if (status === 'For Signing') currentStepNum = 3;
    else if (status === 'Ready for Pickup') currentStepNum = 4;
    else if (status === 'Active') currentStepNum = 5;

    return (
      <div className="mb-4 bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-3.5 sm:p-4">
        <p className="text-[11px] font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider mb-3">
          {t('dashboard.appProgress', 'Application Progress')}
        </p>
        
        {/* Seamless Step progress track & nodes */}
        <div className="flex items-start w-full px-1">
          {steps.map((step, idx) => {
            const isCompleted = currentStepNum > step.id || (status === 'Active' && step.id === 5);
            const isCurrent = currentStepNum === step.id && status !== 'Active';

            return (
              <div key={step.id} className="relative flex-1 flex flex-col items-center group min-w-0">
                {/* Seamless Connector Line to Next Step */}
                {idx < steps.length - 1 && (
                  <div className="absolute top-3.5 sm:top-4 left-1/2 w-full h-[2px] -translate-y-1/2 z-0 pointer-events-none">
                    {/* Background Inactive Track */}
                    <div className="w-full h-full bg-[#E4E1DC] dark:bg-[#2E2A27]" />
                    {/* Active Progress Fill */}
                    <div 
                      className={`absolute top-0 left-0 h-full bg-[#9E2A2B] dark:bg-[#D4AF37] transition-all duration-300 ease-out ${
                        currentStepNum > step.id ? 'w-full' : 'w-0'
                      }`} 
                    />
                  </div>
                )}

                {/* Step Circle Badge */}
                <div 
                  className={`relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 ${
                    isCompleted 
                      ? 'bg-[#9E2A2B] dark:bg-[#D4AF37] text-white dark:text-[#14110F] shadow-xs' 
                      : isCurrent 
                      ? 'bg-white dark:bg-[#1C1917] border-2 border-[#9E2A2B] dark:border-[#D4AF37] ring-2 ring-[#9E2A2B]/20 dark:ring-[#D4AF37]/30 shadow-xs' 
                      : 'bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27]'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={14} className="stroke-[3]" />
                  ) : isCurrent ? (
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#9E2A2B] dark:bg-[#D4AF37] rounded-full animate-pulse" />
                  ) : (
                    <div className="w-1.5 h-1.5 bg-[#6B6761]/40 dark:bg-[#A8A29E]/40 rounded-full" />
                  )}
                </div>

                {/* Step Label */}
                <span className={`text-[10px] sm:text-xs mt-1.5 tracking-tight text-center leading-tight max-w-full px-0.5 whitespace-nowrap transition-colors ${
                  isCurrent 
                    ? 'text-[#9E2A2B] dark:text-[#D4AF37] font-bold' 
                    : isCompleted 
                    ? 'text-[#1F1D1B] dark:text-[#F6F5F3] font-semibold' 
                    : 'text-[#6B6761] dark:text-[#A8A29E] font-medium'
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
    const hour = new Date().getHours();
    const portalTag = isTodaPresident ? t('nav.roleTodaPresident', 'TODA PRESIDENT') : t('dashboard.badge', 'Operator Portal');

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
    const hasSigning = franchises.some(f => f.status === 'For Signing');
    const hasPending = franchises.some(f => f.status === 'Pending');
    const hasActive = franchises.some(f => f.status === 'Active');

    if (hasReady) return t('greeting.subReady', 'Welcome back! Your MTOP Certificate is ready for pickup at the Municipal Cashier.');
    if (hasSigning) return t('greeting.subSigning', 'Welcome back! Your application is approved and is currently routing for municipal signatures.');
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

      {/* 1. ELEVATED GOVERNMENT OPERATOR HERO CARD */}
      <div 
        id="tour-hero-banner"
        className="bg-white dark:bg-[#1C1917] rounded-lg p-5 sm:p-6 mb-6 text-[#1F1D1B] dark:text-[#F6F5F3] shadow-xs border border-[#E4E1DC] dark:border-[#2E2A27] border-l-4 border-l-[#9E2A2B] relative transition-all"
      >
        {/* Top Header Bar: Avatar (with Logout Menu) + Greeting + Micro-actions */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
          <div className="flex items-center gap-3 min-w-0">
            {/* Interactive Rounded Avatar with Profile Popover */}
            <div className="relative" id="tour-profile-menu">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(prev => !prev)}
                className="w-11 h-11 rounded-lg border-2 border-[#D4AF37] shadow-xs overflow-hidden bg-[#9E2A2B] text-white flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer hover:ring-2 hover:ring-[#9E2A2B]/20"
                title="My Account & Logout"
              >
                {profilePic ? (
                  <img src={profilePic} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#D4AF37] font-bold text-base">
                    {loggedInUserName.charAt(0).toUpperCase()}
                  </span>
                )}
              </button>
            </div>

            {/* Greeting & Bold User Name */}
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">
                {opGreeting.text},
              </span>
              <span className="text-base sm:text-xl font-bold text-[#1F1D1B] dark:text-[#F6F5F3] tracking-tight truncate">
                {loggedInUserName}!
              </span>
            </div>
          </div>

          {/* Micro Action Buttons (Text Size, Guide, Theme & Bell) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Text Size Accessibility Button */}
            <button
              type="button"
              onClick={cycleTextScale}
              title={`Text Size: ${scaleLabel} (Click to toggle A / A+ / A++)`}
              aria-label={`Text Size: ${scaleLabel}`}
              className="px-2.5 py-1.5 h-9 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#EAE7E1] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#EAE7E1] font-bold text-xs font-mono flex items-center justify-center active:scale-95 cursor-pointer shadow-xs select-none"
            >
              <span>{textScale === 'xlarge' ? 'A++' : textScale === 'large' ? 'A+' : 'A'}</span>
            </button>

            {/* Quick Guide / Help Trigger */}
            <button
              type="button"
              onClick={() => setIsTourOpen(true)}
              title="Operator Quick Guide & FAQs"
              className="w-9 h-9 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#EAE7E1] dark:hover:bg-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] flex items-center justify-center active:scale-95 transition-colors cursor-pointer shadow-xs"
            >
              <HelpCircle size={17} />
            </button>

            {/* Quick Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? "Theme: Dark Mode (Click for Light Mode)" : "Theme: Light Mode (Click for Dark Mode)"}
              className="w-9 h-9 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#EAE7E1] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#EAE7E1] flex items-center justify-center active:scale-95 transition-colors cursor-pointer shadow-xs"
            >
              {isDark ? (
                <Moon size={17} className="text-amber-300" />
              ) : (
                <Sun size={17} className="text-amber-500" />
              )}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative w-9 h-9 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#EAE7E1] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#EAE7E1] flex items-center justify-center active:scale-95 transition-colors cursor-pointer shadow-xs"
              >
                <Bell size={17} />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#B91C1C] px-1 text-[9px] font-bold text-white shadow-xs">
                    {unreadNotifCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="pt-4 pb-2">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight mb-1 text-[#1F1D1B] dark:text-[#F6F5F3] uppercase">
            Operator Portal
          </h1>
          <p className="text-[#6B6761] dark:text-[#A8A29E] text-xs sm:text-sm max-w-xl leading-relaxed">
            {getOperatorSubtext()}
          </p>
        </div>

        {/* Action Status Banner */}
        <div id="tour-hero-action" className="mt-3 pt-3 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
          {isLoading ? (
            <div className="bg-[#F6F5F3] dark:bg-[#14110F] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#E4E1DC] dark:border-[#2E2A27] animate-pulse">
              <div className="space-y-1.5 flex-1 pr-4">
                <div className="h-3.5 w-44 bg-[#E4E1DC] dark:bg-[#2E2A27] rounded-md" />
                <div className="h-2.5 w-64 bg-[#E4E1DC] dark:bg-[#2E2A27] rounded-sm" />
              </div>
              <div className="h-8 w-24 bg-[#E4E1DC] dark:bg-[#2E2A27] rounded-lg shrink-0" />
            </div>
          ) : franchises.some(f => f.status === 'Ready for Pickup') ? (
            <div className="bg-[#FEF3C7]/50 dark:bg-[#78350F]/20 text-[#1F1D1B] dark:text-[#F6F5F3] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#F59E0B]/30 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/15 text-[#B45309] dark:text-[#FBBF24] flex items-center justify-center shrink-0">
                  <Banknote size={20} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold truncate text-[#92400E] dark:text-[#FDE68A]">
                    Ready for Municipal Cashier Payment
                  </h4>
                  <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
                    Amount Payable: <strong className="text-[#9E2A2B] dark:text-[#D4AF37] font-mono">₱500.00</strong> • Settle at Treasury window with Plate No.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const target = franchises.find(f => f.status === 'Ready for Pickup');
                  if (target) {
                    setSelectedUnit(target);
                    setIsDetailsOpen(true);
                  }
                }}
                className="w-full sm:w-auto bg-[#9E2A2B] hover:bg-[#7A1B22] text-white font-bold text-xs sm:text-sm px-4 py-2.5 min-h-[44px] rounded-lg shrink-0 transition-colors active:scale-95 shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Banknote size={15} />
                <span>View Payment Details</span>
              </button>
            </div>
          ) : franchises.some(f => f.status === 'For Signing') ? (
            <div className="bg-[#FEF3C7]/50 dark:bg-[#78350F]/20 text-[#1F1D1B] dark:text-[#F6F5F3] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#F59E0B]/30 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/15 text-[#B45309] dark:text-[#FBBF24] flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold truncate text-[#92400E] dark:text-[#FDE68A]">
                    {t('dashboard.signingTitle', 'Application Approved — Signing in Progress')}
                  </h4>
                  <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5 leading-snug">
                    {t('dashboard.signingDesc', 'Approved. Documents are being signed. We will notify you when ready for payment.')}
                  </p>
                </div>
              </div>
              <StatusBadge status="For Signing" />
            </div>
          ) : franchises.some(f => f.status === 'Cancelled') ? (
            <div className="bg-[#FEE2E2]/50 dark:bg-[#7F1D1D]/20 text-[#1F1D1B] dark:text-[#F6F5F3] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#EF4444]/30 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-[#EF4444]/15 text-[#B91C1C] dark:text-[#EF4444] flex items-center justify-center shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold truncate text-[#991B1B] dark:text-[#FCA5A5]">
                    Application Needs Attention
                  </h4>
                  <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
                    Review remarks and submit corrected documents
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const attentionUnit = franchises.find(f => f.status === 'Cancelled');
                  handleFixIssues(attentionUnit);
                }}
                className="w-full sm:w-auto bg-[#B91C1C] hover:bg-[#991B1B] text-white font-bold text-xs sm:text-sm px-4 py-2.5 min-h-[44px] rounded-lg shrink-0 transition-colors active:scale-95 shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={15} />
                <span>Fix Issues</span>
              </button>
            </div>
          ) : (
            <div className="bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#E4E1DC] dark:border-[#2E2A27]">
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold truncate text-[#1F1D1B] dark:text-[#F6F5F3]">
                  {franchises.length >= maxUnits 
                    ? `Maximum Capacity (${maxUnits}/${maxUnits})`
                    : 'Available Franchise Slot'}
                </h4>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
                  {franchises.length >= maxUnits
                    ? `All ${maxUnits} units are registered`
                    : `You can register up to ${maxUnits} tricycle units`}
                </p>
              </div>
              {franchises.length < maxUnits && (
                <button
                  onClick={() => navigate('/apply-franchise?mode=new&step=1')}
                  className="w-full sm:w-auto bg-[#9E2A2B] hover:bg-[#7A1B22] text-white font-bold text-xs sm:text-sm px-4 py-2.5 min-h-[44px] rounded-lg shrink-0 transition-colors active:scale-95 shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <PlusCircle size={15} />
                  <span>Apply Now</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* TODA PRESIDENT SUMMARY SECTION */}
      {isTodaPresident && !isLoading && (
        <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-4 sm:p-5 shadow-xs mb-6 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-l-[#D4AF37]">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-11 h-11 bg-[#F6F5F3] dark:bg-[#14110F] rounded-lg flex items-center justify-center text-[#9E2A2B] dark:text-[#D4AF37] shrink-0 border border-[#E4E1DC] dark:border-[#2E2A27]">
              <Users size={22} />
            </div>
            <div>
              <h3 className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3] text-sm">TODA Management Console</h3>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5 max-w-md leading-relaxed">
                Manage your association members and submit the official TODA masterlist.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/submit-members')}
            className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] bg-[#9E2A2B] hover:bg-[#7A1B22] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-xs cursor-pointer shrink-0"
          >
            <span>Open TODA Tools</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* 2. FLEET CAPACITY SLOTS (Dynamic with Admin Settings, Clean & Minimal) */}
      <div 
        id="tour-capacity-card"
        className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-3 sm:p-4 shadow-xs mb-5 transition-all"
      >
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-28 bg-[#E4E1DC] dark:bg-[#2E2A27] rounded-md" />
              <div className="h-3 w-24 bg-[#E4E1DC] dark:bg-[#2E2A27] rounded-sm" />
            </div>
            <div 
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${maxUnits}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: maxUnits }).map((_, idx) => (
                <div key={idx} className="h-2 rounded-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27]" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                  Unit Capacity
                </span>
                <span className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37]">
                  {franchises.length} / {maxUnits}
                </span>
              </div>

              <span className="text-xs font-medium text-[#6B6761] dark:text-[#A8A29E]">
                {franchises.length >= maxUnits 
                  ? 'Slots Full' 
                  : `${maxUnits - franchises.length} Slot(s) Available`}
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
                          ? 'bg-[#9E2A2B] dark:bg-[#D4AF37]' 
                          : 'bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27]'
                      }`} 
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 3. GARAGE SECTION HEADER */}
      <header id="tour-garage-section" className="mb-4 flex flex-col sm:flex-row justify-between sm:items-end gap-3">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 bg-[#9E2A2B] dark:bg-[#D4AF37] rounded-full" />
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#1F1D1B] dark:text-[#F6F5F3] tracking-tight">
              {t('dashboard.garageTitle', 'My Franchise Garage')}
            </h2>
            <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-normal mt-0.5">
              {t('dashboard.garageSub', 'Assigned tricycle units under your account')}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
          {isLoading ? (
            <div className="w-24 h-6 bg-[#E4E1DC] dark:bg-[#2E2A27] rounded-lg animate-pulse" />
          ) : (
            <span className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] bg-[#F6F5F3] dark:bg-[#14110F] px-2.5 py-1 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
              {franchises.length} Registered
            </span>
          )}
        </div>
      </header>

      {/* 4. GARAGE UNITS LIST / EMPTY STATE */}
      {isLoading ? (
        <GarageGridSkeleton count={2} baseDelay={70} />
      ) : franchises.length === 0 ? (
        <div 
          id="tour-empty-garage"
          className="bg-white dark:bg-[#1C1917] rounded-lg border border-dashed border-[#E4E1DC] dark:border-[#2E2A27] p-8 sm:p-12 text-center text-[#6B6761] dark:text-[#A8A29E] flex flex-col items-center justify-center min-h-[260px] shadow-xs"
        >
          {/* Tricycle Icon Container */}
          <div className="relative mb-3">
            <div className="relative w-16 h-16 bg-[#F6F5F3] dark:bg-[#14110F] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-center p-2.5 shadow-xs">
              <TricycleIcon size={42} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
            </div>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-[#1F1D1B] dark:text-[#F6F5F3] mb-1">
            {t('dashboard.noUnitsTitle', 'No Franchise Units Found')}
          </h3>
          <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mb-5 max-w-sm leading-relaxed">
            {t('dashboard.noUnitsDesc', 'Your garage is currently empty. Register your tricycle unit for a franchise.')}
          </p>

          <button 
            onClick={() => navigate('/apply-franchise?mode=new&step=1')} 
            className="inline-flex items-center gap-1.5 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white px-5 py-2.5 min-h-[44px] rounded-lg font-bold text-xs sm:text-sm transition-colors shadow-xs active:scale-95 cursor-pointer"
          >
            <PlusCircle size={16} />
            <span>{t('dashboard.applyNew', 'Apply New Franchise')}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {franchises.map((unit, unitIndex) => (
            <div 
              key={unit?._id} 
              className="bg-white dark:bg-[#1C1917] rounded-lg p-5 sm:p-6 border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs hover:border-[#9E2A2B]/40 dark:hover:border-[#D4AF37]/40 transition-colors flex flex-col justify-between relative overflow-hidden group"
            >
              {/* Top Accent Strip */}
              <div className={`absolute top-0 left-0 w-full h-1 ${
                unit?.status === 'Active' ? 'bg-[#15803D]' :
                (unit?.status === 'Expired' || unit?.status === 'Cancelled' || unit?.status === 'Rejected') ? 'bg-[#B91C1C]' :
                'bg-[#B45309]'
              }`} />

              <div>
                {/* Header Row: TODA tag & Status Badge */}
                <div className="flex justify-between items-center mb-3 mt-0.5 gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] text-xs font-bold uppercase tracking-wider border border-[#E4E1DC] dark:border-[#2E2A27] shrink-0 max-w-[60%]">
                    <Users size={12} className="text-[#9E2A2B] dark:text-[#D4AF37] shrink-0" />
                    <span className="truncate">{unit?.todaName || 'TODA'}</span>
                  </span>

                  <StatusBadge status={unit?.status} />
                </div>

                {/* Modern Government MTOP Plate Box */}
                <div 
                  id={unitIndex === 0 ? "tour-mtop-plate" : undefined}
                  className="p-3 sm:p-3.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] mb-3.5 flex items-center justify-between relative overflow-hidden"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9E2A2B] dark:bg-[#D4AF37]" />
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E] whitespace-nowrap">
                        MUNICIPALITY OF GASAN &bull; MTOP
                      </p>
                    </div>
                    <h3 className="font-mono text-lg sm:text-xl font-bold tracking-wider text-[#1F1D1B] dark:text-[#F6F5F3] truncate">
                      {unit?.plateNo || t('dashboard.pendingPlate', 'PENDING')}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] text-xs font-bold text-[#1F1D1B] dark:text-[#F6F5F3] uppercase tracking-tight shadow-xs">
                      {unit?.make || 'Tricycle'}
                    </span>
                    <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] font-medium mt-0.5 uppercase">
                      {unit?.made || 'Model'}
                    </p>
                  </div>
                </div>

                {/* Minimalist 2x2 Specs Grid */}
                <div 
                  id={unitIndex === 0 ? "tour-specs-grid" : undefined}
                  className="grid grid-cols-2 gap-2.5 mb-3.5"
                >
                  <div className="p-2.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-center text-[#9E2A2B] dark:text-[#D4AF37] shrink-0 shadow-xs">
                      <MapPin size={12} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider truncate">{t('dashboard.routeZone', 'Route Zone')}</p>
                      <p className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] truncate">{unit?.zone ? formatZoneLabel(unit.zone) : 'N/A'}</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-center text-[#9E2A2B] dark:text-[#D4AF37] shrink-0 shadow-xs">
                      <Hash size={12} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider truncate">{t('dashboard.motorNumber', 'Motor Number')}</p>
                      <p className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] font-mono truncate">{unit?.motorNo || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div id={unitIndex === 0 ? "tour-tracker-section" : undefined}>
                  {renderApplicationTracker(unit?.status)}

                  {unit?.status === 'Active' && (() => {
                    const daysRemaining = calculateDaysRemaining(unit);
                    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 60 && daysRemaining > 0;
                    const isOverdue = daysRemaining !== null && daysRemaining <= 0;

                    return (
                      <div className={`mb-3.5 p-3 rounded-lg border transition-all ${
                        isOverdue
                          ? 'bg-[#FEE2E2]/50 dark:bg-[#7F1D1D]/20 border-[#EF4444]/30'
                          : isExpiringSoon
                          ? 'bg-[#FEF3C7]/50 dark:bg-[#78350F]/20 border-[#F59E0B]/30'
                          : 'bg-[#F0FDF4]/60 dark:bg-[#052E16]/30 border-[#BBF7D0] dark:border-[#166534]'
                      }`}>
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays size={13} className={isOverdue ? 'text-[#B91C1C]' : isExpiringSoon ? 'text-[#B45309]' : 'text-[#15803D]'} />
                            <span className={`text-xs font-bold uppercase tracking-wider ${isOverdue ? 'text-[#B91C1C]' : isExpiringSoon ? 'text-[#B45309]' : 'text-[#15803D]'}`}>
                              {t('dashboard.validUntil', 'Valid Until')}
                            </span>
                          </div>
                          <p className={`text-xs font-bold ${isOverdue ? 'text-[#991B1B] dark:text-[#FCA5A5]' : isExpiringSoon ? 'text-[#92400E] dark:text-[#FDE68A]' : 'text-[#15803D] dark:text-[#4ADE80]'}`}>
                            {getExpirationDate(unit)}
                          </p>
                        </div>

                        {/* Urgency Meter */}
                        {daysRemaining !== null && (
                          <div className="space-y-1 pt-0.5">
                            <div className="flex justify-between items-center text-xs font-semibold">
                              <span className="text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">
                                Status
                              </span>
                              <span className={`flex items-center gap-1 font-bold ${
                                isOverdue ? 'text-[#B91C1C]' : isExpiringSoon ? 'text-[#B45309]' : 'text-[#15803D] dark:text-[#4ADE80]'
                              }`}>
                                {isOverdue 
                                  ? `⚠️ Overdue by ${Math.abs(daysRemaining)} days` 
                                  : isExpiringSoon 
                                  ? `⏳ Renewal Window Open • ${daysRemaining} days left` 
                                  : `✓ Active • ${daysRemaining} days remaining`}
                              </span>
                            </div>

                            <div className="w-full h-1.5 bg-[#E4E1DC] dark:bg-[#2E2A27] rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isOverdue ? 'w-full bg-[#B91C1C]' : isExpiringSoon ? 'w-3/4 bg-[#B45309]' : 'w-full bg-[#15803D]'
                                }`} 
                              />
                            </div>

                            {isExpiringSoon && (
                              <div className="pt-1.5 flex items-center justify-between">
                                <p className="text-xs text-[#92400E] dark:text-[#FDE68A] font-medium leading-tight">
                                  Within 60-day renewal window. Renew early to avoid penalties.
                                </p>
                                <button
                                  onClick={() => navigate(`/renew-franchise/${unit._id}`)}
                                  className="bg-[#9E2A2B] hover:bg-[#7A1B22] text-white text-xs font-bold uppercase px-3.5 py-2.5 min-h-[44px] rounded-lg shadow-xs transition-colors shrink-0 ml-2 active:scale-95 cursor-pointer flex items-center justify-center"
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

                  {unit?.status === 'Pending' && (() => {
                    const info = getApplicationValidityInfo(unit);
                    if (!info) return null;
                    return (
                      <div className="mb-3.5 bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] p-3 rounded-lg space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-[#6B6761] dark:text-[#A8A29E]">
                            Filing Date: <strong className="text-[#1F1D1B] dark:text-[#F6F5F3]">{info.filingDateStr}</strong>
                          </span>
                          <span className="font-semibold text-[#6B6761] dark:text-[#A8A29E]">
                            Eval Window: <strong className="text-[#1F1D1B] dark:text-[#F6F5F3]">{info.deadlineStr}</strong>
                          </span>
                        </div>
                        <div className={`text-xs font-bold flex items-center justify-between pt-1 border-t border-[#E4E1DC] dark:border-[#2E2A27] ${
                          info.isOverdue ? 'text-[#B91C1C]' : info.isUrgent ? 'text-[#B45309]' : 'text-[#6B6761] dark:text-[#A8A29E]'
                        }`}>
                          <span className="flex items-center gap-1">
                            <Clock size={12} className={info.isUrgent ? 'animate-pulse' : ''} />
                            {info.isOverdue ? 'Evaluation period lapsed' : `${info.diffDays} day(s) remaining for evaluation`}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#E4E1DC] dark:bg-[#2E2A27] font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                            30-Day Charter
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {unit?.status === 'For Signing' && (() => {
                    const info = getApplicationValidityInfo(unit);
                    return (
                      <div className="mb-3.5 bg-[#FEF3C7]/50 dark:bg-[#78350F]/20 border border-[#F59E0B]/30 p-3 rounded-lg space-y-1.5">
                        <div className="flex items-start gap-2.5">
                          <FileText className="text-[#B45309] dark:text-[#FBBF24] shrink-0 mt-0.5" size={16} />
                          <div>
                            <h4 className="text-[#92400E] dark:text-[#FDE68A] font-bold text-xs uppercase mb-0.5">{t('dashboard.signingTitle', 'Application Approved — Routing for Signature')}</h4>
                            <p className="text-xs font-normal text-[#92400E]/90 dark:text-[#FDE68A]/90 leading-snug">{t('dashboard.signingDesc', 'MTOP is currently being printed and routed for official municipal signatures. Please wait for pickup notice.')}</p>
                          </div>
                        </div>
                        {info && (
                          <div className="flex justify-between items-center text-[11px] font-semibold text-[#92400E] dark:text-[#FDE68A] pt-1 border-t border-[#F59E0B]/30">
                            <span>Processing Window: {info.filingDateStr} → {info.deadlineStr}</span>
                            <span>⏳ {info.diffDays > 0 ? `${info.diffDays} days left` : 'Finalizing'}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {unit?.status === 'Ready for Pickup' && (() => {
                    const info = getApplicationValidityInfo(unit);
                    return (
                      <div className="mb-3.5 bg-[#FEF3C7]/50 dark:bg-[#78350F]/20 border border-[#F59E0B]/30 p-3 rounded-lg space-y-1.5">
                        <div className="flex items-start gap-2.5">
                          <Banknote className="text-[#B45309] dark:text-[#FBBF24] shrink-0 mt-0.5" size={16} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap mb-0.5">
                              <h4 className="text-[#92400E] dark:text-[#FDE68A] font-bold text-xs uppercase">
                                Ready for Cashier Payment
                              </h4>
                              <span className="font-mono font-bold text-xs text-[#9E2A2B] dark:text-[#D4AF37] bg-white dark:bg-[#1C1917] px-2 py-0.5 rounded-md border border-[#E4E1DC] dark:border-[#2E2A27]">
                                Amount Payable: ₱{parseFloat(systemFranchiseFee || 500).toFixed(2)}
                              </span>
                            </div>
                            <p className="text-xs font-normal text-[#92400E]/90 dark:text-[#FDE68A]/90 leading-snug">
                              Pay ₱500 at the Municipal Cashier window with Plate No. <b>{unit.plateNo}</b>. Your franchise will be activated once payment is confirmed.
                            </p>
                          </div>
                        </div>
                        {unit.paymentStatus === 'Paid' ? (
                          <div className="flex justify-between items-center text-[11px] font-bold pt-1.5 border-t border-[#F59E0B]/30 text-[#15803D] dark:text-[#4ADE80]">
                            <span>Status: Paid at Cashier (OR# {unit.officialReceiptNo || 'Recorded'})</span>
                            <span>Awaiting Admin Release</span>
                          </div>
                        ) : info && (
                          <div className={`flex justify-between items-center text-[11px] font-bold pt-1 border-t border-[#F59E0B]/30 ${
                            info.isOverdue ? 'text-[#B91C1C]' : info.isUrgent ? 'text-[#B45309]' : 'text-[#92400E] dark:text-[#FDE68A]'
                          }`}>
                            <span>Payment Deadline: {info.deadlineStr}</span>
                            <span className="flex items-center gap-1">
                              <Clock size={11} />
                              {info.isOverdue ? 'Payment window overdue' : `Settle payment within ${info.diffDays} day(s)`}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {unit?.status === 'Cancelled' && (
                    <div className="mb-3.5 bg-[#FEE2E2]/50 dark:bg-[#7F1D1D]/20 border border-[#EF4444]/30 p-3 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="text-[#B91C1C] dark:text-[#EF4444] shrink-0 mt-0.5" size={15} />
                        <div className="min-w-0">
                          <h4 className="text-[#991B1B] dark:text-[#FCA5A5] font-bold text-xs uppercase mb-0.5">Application Needs Correction</h4>
                          <p className="text-xs text-[#B91C1C] dark:text-[#F87171] font-medium leading-relaxed">
                            {unit.cancelReason || 'Application requires correction. Click Fix Issues below.'}
                          </p>
                          {unit.rejectedField && (
                            <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-[#FEE2E2] dark:bg-[#7F1D1D]/60 text-[#B91C1C] dark:text-[#FCA5A5] text-[10px] font-bold uppercase tracking-wider">
                              Target Field: {unit.rejectedField}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Row */}
              <div 
                id={unitIndex === 0 ? "tour-card-actions" : undefined}
                className="flex flex-col sm:flex-row gap-2 mt-auto pt-3 border-t border-[#E4E1DC] dark:border-[#2E2A27]"
              >
                {unit?.status === 'Expired' ? (
                  <button onClick={() => navigate(`/renew-franchise/${unit._id}`)} className="w-full bg-[#9E2A2B] hover:bg-[#7A1B22] text-white px-4 py-2.5 min-h-[44px] rounded-lg font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-xs"><RefreshCw size={14} /> {t('dashboard.btnRenew', 'Renew Franchise')}</button>
                ) : unit?.status === 'Active' ? (
                  <button onClick={() => { setSelectedUnit(unit); setIsDetailsOpen(true); }} className="w-full bg-[#F6F5F3] hover:bg-[#EAE7E1] dark:bg-[#14110F] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] border border-[#E4E1DC] dark:border-[#2E2A27] px-4 py-2.5 min-h-[44px] rounded-lg font-bold text-xs sm:text-sm transition-colors active:scale-95 cursor-pointer shadow-xs">{t('dashboard.btnViewDetails', 'View Details')}</button>
                ) : unit?.status === 'Ready for Pickup' ? (
                  <div className="flex flex-col sm:flex-row w-full gap-2">
                    {unit.paymentStatus === 'Paid' ? (
                      <button 
                        onClick={() => { setSelectedUnit(unit); setIsDetailsOpen(true); }} 
                        className="flex-1 bg-[#F0FDF4] dark:bg-[#052E16]/40 text-[#15803D] dark:text-[#4ADE80] border border-[#BBF7D0] dark:border-[#166534] font-bold text-xs sm:text-sm py-2.5 px-3.5 min-h-[44px] rounded-lg flex items-center justify-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
                      >
                        <CheckCircle2 size={14} /> 
                        <span>Paid • Awaiting Release</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => { setSelectedUnit(unit); setIsDetailsOpen(true); }} 
                        className="flex-1 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white font-bold text-xs sm:text-sm py-2.5 px-3.5 min-h-[44px] rounded-lg flex items-center justify-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
                      >
                        <Banknote size={14} /> 
                        <span>Pay ₱500 at Cashier (Plate: {unit.plateNo})</span>
                      </button>
                    )}
                    <button 
                      onClick={() => { setSelectedUnit(unit); setIsDetailsOpen(true); }} 
                      className="bg-[#F6F5F3] hover:bg-[#EAE7E1] dark:bg-[#14110F] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] border border-[#E4E1DC] dark:border-[#2E2A27] px-3.5 py-2.5 min-h-[44px] rounded-lg font-bold text-xs sm:text-sm transition-colors active:scale-95 cursor-pointer shadow-xs"
                    >
                      {t('dashboard.btnViewDetails', 'Details')}
                    </button>
                  </div>
                ) : unit?.status === 'Cancelled' ? (
                  <button onClick={() => handleFixIssues(unit)} className="w-full bg-[#B91C1C] hover:bg-[#991B1B] text-white px-4 py-2.5 min-h-[44px] rounded-lg font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-xs">
                    <RefreshCw size={14} /> {t('dashboard.btnFixIssues', 'Fix Issues')}
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center w-full gap-2">
                    <button onClick={() => { setSelectedUnit(unit); setIsDetailsOpen(true); }} className="w-full sm:flex-1 bg-[#F6F5F3] hover:bg-[#EAE7E1] dark:bg-[#14110F] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] border border-[#E4E1DC] dark:border-[#2E2A27] px-4 py-2.5 min-h-[44px] rounded-lg font-bold text-xs sm:text-sm transition-colors active:scale-95 cursor-pointer shadow-xs">{t('dashboard.btnViewDetails', 'View Details')}</button>
                    {(unit?.status === 'Pending' || unit?.status === 'For Signing' || unit?.status === 'Ready for Pickup') && (
                      <button 
                        onClick={() => setCancelModal({
                          isOpen: true,
                          unit,
                          reason: CANCEL_REASONS[0],
                          customReason: '',
                          isSubmitting: false
                        })}
                        className="w-full sm:w-auto bg-white dark:bg-[#1C1917] hover:bg-[#FEE2E2]/50 text-[#B91C1C] dark:text-[#EF4444] border border-[#EF4444]/40 px-3.5 py-2.5 min-h-[44px] rounded-lg font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
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
          <div className="absolute inset-0 bg-black/60 animate-in fade-in duration-200" onClick={() => setIsDetailsOpen(false)} />
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] w-full max-w-lg rounded-lg shadow-xl relative z-10 p-5 sm:p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
              <h2 className="text-base font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{t('dashboard.modalSpecsTitle', 'Unit Specifications')}</h2>
              <button onClick={() => setIsDetailsOpen(false)} className="text-[#6B6761] dark:text-[#A8A29E] hover:text-[#B91C1C] p-1.5 rounded-lg hover:bg-[#F6F5F3] dark:hover:bg-[#14110F] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-[#1F1D1B] dark:text-[#F6F5F3]">
              <div className="sm:col-span-2 bg-[#F6F5F3] dark:bg-[#14110F] p-3 rounded-lg border border-[#E4E1DC]/60 dark:border-[#2E2A27]">
                <p className="text-[#6B6761] dark:text-[#A8A29E] font-semibold uppercase text-xs">{t('dashboard.operator', 'Operator')}</p>
                <p className="font-bold text-sm text-[#1F1D1B] dark:text-[#F6F5F3] mt-0.5">{selectedUnit?.fullName}</p>
              </div>
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-3 rounded-lg border border-[#E4E1DC]/60 dark:border-[#2E2A27]"><p className="text-[#6B6761] dark:text-[#A8A29E] font-semibold uppercase text-xs">{t('dashboard.toda', 'TODA')}</p><p className="font-bold text-xs sm:text-sm text-[#1F1D1B] dark:text-[#F6F5F3] mt-0.5">{selectedUnit?.todaName}</p></div>
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-3 rounded-lg border border-[#E4E1DC]/60 dark:border-[#2E2A27]"><p className="text-[#6B6761] dark:text-[#A8A29E] font-semibold uppercase text-xs">{t('dashboard.routeZone', 'Route Zone')}</p><p className="font-bold text-xs sm:text-sm text-[#1F1D1B] dark:text-[#F6F5F3] mt-0.5">{selectedUnit?.zone ? formatZoneLabel(selectedUnit.zone) : 'N/A'}</p></div>
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-3 rounded-lg border border-[#E4E1DC]/60 dark:border-[#2E2A27]"><p className="text-[#6B6761] dark:text-[#A8A29E] font-semibold uppercase text-xs">{t('dashboard.plateNo', 'Plate No.')}</p><p className="font-mono font-bold text-sm sm:text-base text-[#1F1D1B] dark:text-[#F6F5F3] mt-0.5">{selectedUnit?.plateNo || 'N/A'}</p></div>
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-3 rounded-lg border border-[#E4E1DC]/60 dark:border-[#2E2A27]"><p className="text-[#6B6761] dark:text-[#A8A29E] font-semibold uppercase text-xs">{t('dashboard.makeModel', 'Make & Model')}</p><p className="font-medium text-xs sm:text-sm text-[#1F1D1B] dark:text-[#F6F5F3] mt-0.5">{selectedUnit?.make} ({selectedUnit?.made})</p></div>
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-3 rounded-lg border border-[#E4E1DC]/60 dark:border-[#2E2A27]"><p className="text-[#6B6761] dark:text-[#A8A29E] font-semibold uppercase text-xs">{t('dashboard.motorNumber', 'Motor Number')}</p><p className="font-mono font-medium text-xs text-[#1F1D1B] dark:text-[#F6F5F3] mt-0.5">{selectedUnit?.motorNo}</p></div>
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-3 rounded-lg border border-[#E4E1DC]/60 dark:border-[#2E2A27]"><p className="text-[#6B6761] dark:text-[#A8A29E] font-semibold uppercase text-xs">{t('dashboard.chassisNumber', 'Chassis Number')}</p><p className="font-mono font-medium text-xs text-[#1F1D1B] dark:text-[#F6F5F3] mt-0.5">{selectedUnit?.chassisNo}</p></div>
              {selectedUnit?.cedulaSerialNo && (
                <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-3 rounded-lg border border-[#E4E1DC]/60 dark:border-[#2E2A27]">
                  <p className="text-[#6B6761] dark:text-[#A8A29E] font-semibold uppercase text-xs">Cedula / CTC No.</p>
                  <p className="font-mono font-medium text-xs sm:text-sm text-[#1F1D1B] dark:text-[#F6F5F3] mt-0.5">{selectedUnit?.cedulaSerialNo}</p>
                </div>
              )}
              {selectedUnit?.officialReceiptNo && (
                <div className="bg-[#F0FDF4] dark:bg-[#052E16]/40 p-3 rounded-lg border border-[#BBF7D0] dark:border-[#166534]">
                  <p className="text-[#15803D] dark:text-[#4ADE80] font-semibold uppercase text-xs">Official Receipt (OR) No.</p>
                  <p className="font-mono font-bold text-xs sm:text-sm text-[#15803D] dark:text-[#4ADE80] mt-0.5">{selectedUnit?.officialReceiptNo} (₱{selectedUnit?.amountPaid || 500})</p>
                </div>
              )}
              {selectedUnit?.cedulaUrl && (
                <div className="sm:col-span-2 bg-[#F6F5F3] dark:bg-[#14110F] p-3 rounded-lg border border-[#E4E1DC]/60 dark:border-[#2E2A27]">
                  <p className="text-[#6B6761] dark:text-[#A8A29E] font-semibold uppercase text-xs mb-1.5">Cedula / CTC Document</p>
                  <a href={selectedUnit.cedulaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline">
                    <FileText size={14} /> View Uploaded Cedula
                  </a>
                </div>
              )}
            </div>
            <button onClick={() => setIsDetailsOpen(false)} className="w-full mt-5 py-2.5 min-h-[44px] bg-[#1F1D1B] hover:bg-black dark:bg-[#2E2A27] dark:hover:bg-[#3E3835] text-white font-bold rounded-lg text-xs sm:text-sm transition-colors cursor-pointer">{t('dashboard.btnClose', 'Close')}</button>
          </div>
        </div>
      )}

      {/* Official Voucher Claim Stub (NO QR or Barcode) */}
      {isPrintOpen && (
        <ClaimStubVoucher 
          isOpen={isPrintOpen} 
          onClose={() => setIsPrintOpen(false)} 
          unit={selectedUnit} 
          systemFranchiseFee={systemFranchiseFee} 
        />
      )}

      {/* Operator Application Cancellation Modal */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 animate-in fade-in duration-200" 
            onClick={() => !cancelModal.isSubmitting && setCancelModal(prev => ({ ...prev, isOpen: false }))} 
          />
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] w-full max-w-lg rounded-lg shadow-xl relative z-10 p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
              <div className="flex items-center gap-2.5 text-[#B91C1C] dark:text-[#EF4444]">
                <div className="w-8 h-8 rounded-lg bg-[#FEE2E2] dark:bg-[#7F1D1D]/60 flex items-center justify-center shrink-0">
                  <XCircle size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1F1D1B] dark:text-[#F6F5F3]">Cancel Application</h3>
                  <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-medium">Unit: {cancelModal.unit?.plateNo || 'PENDING PLATE'}</p>
                </div>
              </div>
              <button 
                disabled={cancelModal.isSubmitting}
                onClick={() => setCancelModal(prev => ({ ...prev, isOpen: false }))} 
                className="text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[#FEF3C7]/50 dark:bg-[#78350F]/20 border border-[#F59E0B]/30 p-3.5 rounded-lg flex items-start gap-2.5">
                <AlertCircle size={16} className="text-[#B45309] dark:text-[#F59E0B] shrink-0 mt-0.5" />
                <p className="text-xs text-[#92400E] dark:text-[#FDE68A] leading-relaxed font-medium">
                  Notice: Cancelling this application will set its status to <b>Cancelled</b>. The reason provided will be recorded and visible to the LGU Admin.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F1D1B] dark:text-[#F6F5F3] mb-2">
                  Select Reason for Cancellation:
                </label>
                <div className="space-y-2">
                  {CANCEL_REASONS.map((r, idx) => (
                    <label 
                      key={idx} 
                      className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                        cancelModal.reason === r 
                          ? 'border-[#B91C1C] bg-[#FEE2E2]/30 dark:bg-[#7F1D1D]/20 text-[#1F1D1B] dark:text-[#F6F5F3] font-bold' 
                          : 'border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-[#F6F5F3] dark:hover:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="dash_cancel_reason"
                        checked={cancelModal.reason === r}
                        onChange={() => setCancelModal(prev => ({ ...prev, reason: r }))}
                        className="mt-0.5 text-[#B91C1C] focus:ring-[#B91C1C]"
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              {cancelModal.reason === "Other reason (Please specify below)" && (
                <div className="animate-in fade-in duration-150">
                  <label className="block text-xs font-bold text-[#1F1D1B] dark:text-[#F6F5F3] mb-1">
                    Other Reason Details:
                  </label>
                  <textarea
                    rows={3}
                    value={cancelModal.customReason}
                    onChange={(e) => setCancelModal(prev => ({ ...prev, customReason: e.target.value }))}
                    placeholder="Enter reason for cancelling..."
                    className="w-full text-xs p-3 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] focus:outline-none focus:ring-1 focus:ring-[#9E2A2B]"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
              <button
                type="button"
                disabled={cancelModal.isSubmitting}
                onClick={() => setCancelModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2.5 min-h-[44px] rounded-lg font-bold text-xs text-[#1F1D1B] dark:text-[#F6F5F3] bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-[#EAE7E1] dark:hover:bg-[#2E2A27] transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                disabled={cancelModal.isSubmitting || (cancelModal.reason === "Other reason (Please specify below)" && !cancelModal.customReason?.trim())}
                onClick={handleConfirmCancel}
                className="flex items-center gap-1.5 px-5 py-2.5 min-h-[44px] rounded-lg font-bold text-xs text-white bg-[#B91C1C] hover:bg-[#991B1B] transition-colors shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelModal.isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                {cancelModal.isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* First-Time Login Language Preference Modal */}
      {isLangModalOpen && (
        <LanguagePreferenceModal 
          isOpen={isLangModalOpen} 
          onConfirm={handleLanguageConfirmed} 
        />
      )}

      {/* Operator Quick Guide & FAQs Modal */}
      {isTourOpen && (
        <OperatorGuideModal 
          isOpen={isTourOpen} 
          onClose={handleCloseTour} 
        />
      )}

      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        type={feedbackModal.type}
        title={feedbackModal.title}
        message={feedbackModal.message}
        confirmText={feedbackModal.confirmText || 'OK'}
        onConfirm={feedbackModal.onConfirm || (() => setFeedbackModal(prev => ({ ...prev, isOpen: false })))}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Portalled Profile Bottom Sheet / Modal (Escape stacking context) */}
      {isProfileMenuOpen && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 transition-opacity animate-in fade-in duration-200 cursor-pointer"
            onClick={() => setIsProfileMenuOpen(false)}
          />

          {/* Bottom Sheet Card */}
          <div className="relative z-10 w-full sm:max-w-md bg-white dark:bg-[#1C1917] rounded-t-lg sm:rounded-lg shadow-xl border-t sm:border border-[#E4E1DC] dark:border-[#2E2A27] p-5 sm:p-6 text-[#1F1D1B] dark:text-[#F6F5F3] animate-in slide-in-from-bottom duration-200 max-h-[90vh] flex flex-col overflow-y-auto">
            {/* Drag Handle Bar (Mobile) */}
            <div className="w-12 h-1 bg-[#E4E1DC] dark:bg-[#2E2A27] rounded-full mx-auto mb-4 sm:hidden" />

            {/* Header Profile Info */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
              <div className="w-12 h-12 rounded-lg border-2 border-[#D4AF37] shadow-xs overflow-hidden bg-[#9E2A2B] text-white flex items-center justify-center shrink-0">
                {profilePic ? (
                  <img src={profilePic} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#D4AF37] font-bold text-lg">
                    {loggedInUserName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-base text-[#1F1D1B] dark:text-[#F6F5F3] truncate">
                  {loggedInUserName}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-[#FEF3C7]/60 text-[#92400E] dark:bg-[#78350F]/40 dark:text-[#FDE68A] border border-[#F59E0B]/30">
                    {isTodaPresident ? 'TODA President' : 'Franchise Operator'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#EAE7E1] dark:hover:bg-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Menu Options */}
            <div className="py-3 space-y-1">
              {/* Settings & Profile */}
              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  navigate('/operator/settings');
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#F6F5F3] dark:hover:bg-[#14110F] transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#9E2A2B]/10 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                    <Settings size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#1F1D1B] dark:text-[#F6F5F3]">Account & Document Settings</p>
                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">Manage profile, documents & security</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[#6B6761] dark:text-[#A8A29E] group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Language Preference */}
              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  setIsLangModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#F6F5F3] dark:hover:bg-[#14110F] transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] flex items-center justify-center shrink-0">
                    <span className="font-bold text-xs">A/文</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#1F1D1B] dark:text-[#F6F5F3]">Language / Wika</p>
                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">{language === 'fil' ? 'Filipino (Tagalog)' : 'English (US)'}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[#6B6761] dark:text-[#A8A29E] group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Operator Quick Guide & FAQs */}
              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  setIsTourOpen(true);
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#F6F5F3] dark:hover:bg-[#14110F] transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#FEF3C7]/60 dark:bg-[#78350F]/40 text-[#B45309] dark:text-[#FBBF24] flex items-center justify-center shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#1F1D1B] dark:text-[#F6F5F3]">Operator Quick Guide & FAQs</p>
                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">Step-by-step instructions & tips</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[#6B6761] dark:text-[#A8A29E] group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Logout Button */}
            <div className="pt-3 mt-2 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-3 min-h-[44px] rounded-lg bg-[#FEE2E2]/60 hover:bg-[#FEE2E2] dark:bg-[#7F1D1D]/30 dark:hover:bg-[#7F1D1D]/50 text-[#B91C1C] dark:text-[#EF4444] font-bold text-sm transition-colors active:scale-98 cursor-pointer"
              >
                <LogOut size={18} />
                <span>Sign Out / Mag-logout</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Portalled Notification Bottom Sheet / Dropdown (Escape stacking context) */}
      {isNotifOpen && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-start sm:items-end sm:p-4 sm:pt-16 sm:pr-8">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 transition-opacity animate-in fade-in duration-200 cursor-pointer" 
            onClick={() => setIsNotifOpen(false)} 
          />

          {/* Notification Card */}
          <div 
            className="relative z-10 w-full sm:w-96 bg-white dark:bg-[#1C1917] rounded-t-lg sm:rounded-lg shadow-xl border-t sm:border border-[#E4E1DC] dark:border-[#2E2A27] py-4 text-[#1F1D1B] dark:text-[#F6F5F3] animate-in slide-in-from-bottom sm:slide-in-from-top-2 duration-200 max-h-[85vh] flex flex-col"
          >
            {/* Mobile drag bar */}
            <div className="w-12 h-1 bg-[#E4E1DC] dark:bg-[#2E2A27] rounded-full mx-auto mb-3 sm:hidden" />

            {/* Header */}
            <div className="px-5 pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                  <h4 className="font-bold text-sm text-[#1F1D1B] dark:text-[#F6F5F3]">
                    {t('nav.notifications', 'Notifications')}
                  </h4>
                </div>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-medium mt-0.5">
                  {unreadNotifCount > 0 ? `${unreadNotifCount} update(s)` : t('nav.allCaughtUp', 'All caught up')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {unreadNotifCount > 0 && (
                  <button 
                    type="button"
                    onClick={markAllNotifsRead} 
                    className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline cursor-pointer"
                  >
                    {t('nav.markAllRead', 'Mark all read')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsNotifOpen(false)}
                  className="w-7 h-7 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#EAE7E1] dark:hover:bg-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto divide-y divide-[#E4E1DC] dark:divide-[#2E2A27] flex-1 max-h-[60vh] overscroll-contain">
              {notifications.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-center text-[#6B6761] dark:text-[#A8A29E] mb-2.5">
                    <Bell size={22} />
                  </div>
                  <p className="text-xs font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{t('nav.noNotifications', 'No new notifications')}</p>
                  <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-1 max-w-xs">Franchise updates and announcements will appear here.</p>
                </div>
              ) : (
                notifications.map(notif => {
                  const visuals = getNotificationVisuals(notif);
                  const IconComponent = visuals.icon;
                  const timeStr = formatRelativeTime(notif.createdAt, language);

                  return (
                    <div
                      key={notif._id}
                      onClick={() => {
                        markAsRead(notif._id);
                        if (notif.relatedFranchise) navigate('/operator-dashboard');
                        setIsNotifOpen(false);
                      }}
                      className={`p-4 cursor-pointer transition-colors border-l-4 flex items-start gap-3.5 ${
                        notif.isRead 
                          ? 'bg-white dark:bg-[#1C1917] border-l-transparent hover:bg-[#F6F5F3] dark:hover:bg-[#14110F]' 
                          : 'bg-[#FEF3C7]/20 dark:bg-[#78350F]/10 ' + visuals.accentBorder + ' hover:bg-[#FEF3C7]/30 dark:hover:bg-[#78350F]/20'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${visuals.iconBg}`}>
                          <IconComponent size={18} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border shrink-0 ${visuals.badgeClass}`}>
                              {visuals.badgeText}
                            </span>
                            <p className={`text-xs truncate ${notif.isRead ? 'font-semibold text-[#6B6761] dark:text-[#A8A29E]' : 'font-bold text-[#1F1D1B] dark:text-[#F6F5F3]'}`}>
                              {notif.title}
                            </p>
                          </div>
                          {!notif.isRead && <span className="w-2 h-2 bg-[#9E2A2B] dark:bg-[#D4AF37] rounded-full shrink-0" />}
                        </div>
                        <p className={`text-xs line-clamp-2 leading-relaxed ${notif.isRead ? 'text-[#6B6761] dark:text-[#A8A29E]' : 'text-[#1F1D1B] dark:text-[#F6F5F3]'}`}>
                          {renderRichNotificationMessage(notif.message)}
                        </p>
                        <span className="text-[10px] text-[#6B6761] dark:text-[#A8A29E] font-medium mt-1.5 block">
                          {timeStr}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </MainLayout>
  );
};

export default OperatorDashboard;

