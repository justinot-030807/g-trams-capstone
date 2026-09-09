import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout';
import { 
  RefreshCw, AlertCircle, CheckCircle, Clock, Loader2, 
  CalendarDays, PlusCircle, MapPin, Hash, Printer, X, ShieldCheck, Download, Eye,
  Check, FileText, User, ShieldAlert, Receipt, XCircle,
  Sun, Moon, SunMedium, ArrowRight, Users, Sparkles, HelpCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
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
  const { t, language } = useLanguage();
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

  // Application cancellation state
  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    unit: null,
    reason: CANCEL_REASONS[0],
    customReason: '',
    isSubmitting: false
  });

  const systemFranchiseFee = localStorage.getItem('franchise_fee') || '500';

  const calculateDaysRemaining = (dateApplied) => {
    if (!dateApplied) return null;
    const expDate = new Date(dateApplied);
    expDate.setFullYear(expDate.getFullYear() + 1);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  useEffect(() => {
    fetchMyFranchises();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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

  // Sequence first-time onboarding: Language preference selection first, then tour
  useEffect(() => {
    if (!isLoading) {
      const hasSelectedLang = localStorage.getItem('gtrams_lang_selected');
      if (!hasSelectedLang) {
        const timer = setTimeout(() => {
          setIsLangModalOpen(true);
        }, 500);
        return () => clearTimeout(timer);
      } else {
        const tourKey = 'gtrams_operator_tour_done';
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
    localStorage.setItem('gtrams_lang_selected', 'true');
    setIsLangModalOpen(false);

    // After language is chosen, launch the spotlight tour if not yet completed
    const tourKey = 'gtrams_operator_tour_done';
    const hasSeenTour = localStorage.getItem(tourKey);
    if (!hasSeenTour) {
      setTimeout(() => {
        setIsTourOpen(true);
      }, 500);
    }
  };

  const handleCloseTour = () => {
    setIsTourOpen(false);
    localStorage.setItem('gtrams_operator_tour_done', 'true');
  };

  const getTourSteps = () => {
    const steps = [
      {
        targetId: 'tour-hero-banner',
        title: 'Welcome to Operator Portal',
        titleFil: 'Maligayang Pagdating sa Portal',
        description: 'This is your primary command dashboard displaying your account greeting, active status notices, and quick actions.',
        descriptionFil: 'Ito ang iyong pangunahing dashboard kung saan makikita ang iyong account greeting, paunawa sa prangkisa, at mabilisang shortcuts.',
        icon: Sparkles
      }
    ];

    if (isTodaPresident) {
      steps.push({
        targetId: 'tour-toda-hub',
        title: 'TODA President Association Hub',
        titleFil: 'TODA President Association Hub',
        description: 'As TODA President, use this hub to upload and submit official member & driver rosters directly to the Municipal LGU.',
        descriptionFil: 'Bilang TODA President, gamitin ang hub na ito upang mag-upload at magsumite ng opisyal na listahan ng inyong mga miyembro at drayber sa Munisipyo.',
        icon: Users
      });
    }

    steps.push({
      targetId: 'tour-capacity-pill',
      title: 'Franchise Fleet Capacity',
      titleFil: 'Kapasidad ng Prangkisa',
      description: 'Municipal regulations allow up to 2 registered tricycle units per operator. This counter tracks your active slots.',
      descriptionFil: 'Pinapayagan ng ordinansa ang hanggang 2 rehistradong tricycle bawat operator. Sinusubaybayan nito ang iyong bakanteng slot.',
      icon: ShieldCheck
    });

    if (franchises.length > 0) {
      steps.push({
        targetId: 'tour-mtop-plate',
        title: 'Digital MTOP Tricycle Pass',
        titleFil: 'Digital MTOP Plaka at Pass',
        description: 'View your official Municipal MTOP Plate, assigned TODA, route zone, and motorcycle specifications.',
        descriptionFil: 'Suriin ang iyong opisyal na MTOP Plate number, kinabibilangang TODA, ruta/zone, at mga detalye ng motorsiklo.',
        icon: Hash
      });

      steps.push({
        targetId: 'tour-tracker-section',
        title: 'Live Application Tracker & Urgency',
        titleFil: 'Live Application & Urgency Tracker',
        description: 'Real-time step progression from Submitted to Active, plus countdown alerts for yearly franchise renewals.',
        descriptionFil: 'Masusubaybayan ang antas ng iyong aplikasyon (Submitted ➔ Review ➔ Payment ➔ Active) at paalala bago mag-expire ang permit.',
        icon: Clock
      });

      steps.push({
        targetId: 'tour-card-actions',
        title: 'Claim Stub Voucher & Actions',
        titleFil: 'Claim Stub Voucher at Mga Aksyon',
        description: 'When approved (Awaiting Payment), tap Claim Stub to download or print your official payment voucher for the Municipal Cashier.',
        descriptionFil: 'Kapag Awaiting Payment na, pindutin ang Claim Stub upang i-download o i-print ang voucher na ipapakita sa Municipal Cashier para magbayad.',
        icon: Receipt
      });
    } else {
      steps.push({
        targetId: 'tour-empty-garage',
        title: 'Register Your First Tricycle Unit',
        titleFil: 'Irehistro ang Iyong Unang Tricycle',
        description: 'Your garage is currently empty. Tap "Apply New Franchise" to begin submitting requirements online.',
        descriptionFil: 'Wala pang nakatalang tricycle. Pindutin ang "Apply New Franchise" upang magsumite ng inyong requirements online.',
        icon: PlusCircle
      });
    }

    steps.push({
      targetId: 'tour-bottom-nav',
      title: 'Floating Mobile Navigation Dock',
      titleFil: 'Floating Mobile Navigation Dock',
      description: 'Easily navigate between Dashboard, Franchise Application, Help Support, and Account Settings.',
      descriptionFil: 'Madaling lumipat sa Dashboard, Pag-apply ng prangkisa, Gabay/Suporta, at Account Settings gamit ang dock na ito.',
      icon: ArrowRight
    });

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
                  <div className="absolute top-3.5 left-1/2 w-full h-[3px] -translate-y-1/2 z-0 pointer-events-none">
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
                  className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isCompleted 
                      ? 'bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-900 shadow-xs' 
                      : isCurrent 
                      ? 'bg-white dark:bg-slate-800 border-2 border-[#7A1B22] dark:border-[#D4AF37] ring-4 ring-[#7A1B22]/15 dark:ring-[#D4AF37]/20 shadow-xs' 
                      : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={13} className="stroke-[3]" />
                  ) : isCurrent ? (
                    <div className="w-2 h-2 bg-[#7A1B22] dark:bg-[#D4AF37] rounded-full animate-pulse" />
                  ) : (
                    <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  )}
                </div>

                {/* Step Label */}
                <span className={`text-[10px] font-bold mt-1.5 tracking-tight text-center truncate max-w-full px-1 transition-colors ${
                  isCurrent 
                    ? 'text-[#7A1B22] dark:text-[#D4AF37] font-black' 
                    : isCompleted 
                    ? 'text-slate-800 dark:text-slate-200' 
                    : 'text-slate-400 dark:text-slate-500'
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

      {/* 1. HERO BANNER - Sleek, Minimalist, Mobile-Friendly */}
      <div 
        id="tour-hero-banner"
        className="animate-spring-in bg-gradient-to-br from-[#7A1B22] via-[#871F27] to-[#4A0E13] dark:bg-gradient-to-br dark:from-[#0d121f] dark:via-[#1e0e15] dark:to-[#0a0d16] rounded-3xl p-5 sm:p-7 mb-6 text-white shadow-lg dark:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.85)] relative overflow-hidden flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 border-l-6 sm:border-l-8 border-[#D4AF37] dark:border-slate-800/80 dark:border-l-6 sm:dark:border-l-8 dark:border-l-[#D4AF37] transition-all"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 dark:bg-[#D4AF37]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none animate-banner-orb" />
        
        <div className="relative z-10 min-w-0">
          <div className="inline-flex items-center gap-1.5 bg-white/10 dark:bg-white/5 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase mb-2 border border-white/15 dark:border-white/10 shadow-2xs">
            <OpGreetingIcon size={13} className={opGreeting.badgeColor} />
            <span>{opGreeting.tag}</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight mb-1 text-white">
            {opGreeting.text}, {loggedInUserName}!
          </h1>
          <p className="text-white/80 dark:text-slate-300 font-medium text-xs sm:text-sm max-w-xl leading-relaxed">
            {getOperatorSubtext()}
          </p>
        </div>

        {/* Right Side: Quick Action & Date Tag */}
        <div className="relative z-10 flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
          {franchises.some(f => f.status === 'Ready for Pickup') ? (
            <button
              onClick={() => {
                const target = franchises.find(f => f.status === 'Ready for Pickup');
                if (target) {
                  setSelectedUnit(target);
                  setIsPrintOpen(true);
                }
              }}
              className="group flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#c29e2f] active:scale-95 text-slate-950 font-black text-xs px-4 py-2.5 rounded-2xl transition-all shadow-md touch-bounce cursor-pointer"
            >
              <Receipt size={15} />
              <span>Claim Stub Ready</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          ) : franchises.length < 2 ? (
            <button
              onClick={() => navigate('/apply-franchise')}
              className="group flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#c29e2f] active:scale-95 text-slate-950 font-black text-xs px-4 py-2.5 rounded-2xl transition-all shadow-md touch-bounce cursor-pointer"
            >
              <PlusCircle size={15} />
              <span>{t('dashboard.applyNew', 'Apply Franchise')}</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <div className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-white/10 dark:bg-white/5 border border-white/15 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-emerald-300">
              <ShieldCheck size={16} />
              <span>Max Units (2/2)</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-white/10 dark:bg-white/5 border border-white/15 px-3 py-2 rounded-2xl text-xs font-semibold text-white/90">
            <OpGreetingIcon size={13} className={opGreeting.badgeColor} />
            <span>{currentTime.toLocaleDateString(language === 'fil' ? 'tl-PH' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* 2. TODA PRESIDENT EXCLUSIVE HUB (If logged-in user is TODA President) */}
      {isTodaPresident && (
        <div 
          id="tour-toda-hub"
          className="animate-spring-in mb-6 bg-gradient-to-r from-slate-900 via-[#1b0d11] to-slate-900 dark:from-[#0d121f] dark:via-[#1e0e15] dark:to-[#0a0d16] rounded-3xl p-5 sm:p-6 text-white border border-[#D4AF37]/30 shadow-lg relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0">
              <Users size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/15 px-2 py-0.5 rounded-full border border-[#D4AF37]/25">
                  TODA President Association Hub
                </span>
              </div>
              <h3 className="text-base font-black tracking-tight text-white">
                Member Roster & Driver Registry
              </h3>
              <p className="text-xs text-slate-300 dark:text-slate-400 font-medium max-w-lg mt-0.5">
                Submit and manage your official association member masterlist directly to the Municipal Administrator.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/submit-members')}
            className="shrink-0 flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#c29e2f] active:scale-95 text-slate-950 font-black text-xs px-4 py-2.5 rounded-2xl transition-all shadow-md touch-bounce cursor-pointer self-start sm:self-auto"
          >
            <Users size={15} />
            <span>Submit Members</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* 3. GARAGE HEADER */}
      <header className="animate-spring-in mb-5 flex flex-col sm:flex-row justify-between sm:items-end gap-3">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-[#7A1B22] dark:bg-[#D4AF37] rounded-full" />
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{t('dashboard.garageTitle', 'My Franchise Garage')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{t('dashboard.garageSub', 'Assigned tricycle units under your account')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Replay Tour / Gabay Button */}
          <button
            type="button"
            onClick={() => setIsTourOpen(true)}
            className="flex items-center gap-1.5 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/80 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs text-slate-700 dark:text-slate-200 text-xs font-bold transition-all touch-bounce active:scale-95 cursor-pointer"
            title={language === 'fil' ? 'Simulan ang Interactive Tour' : 'Start Interactive Tour'}
          >
            <HelpCircle size={14} className="text-[#7A1B22] dark:text-[#D4AF37]" />
            <span>{language === 'fil' ? 'Gabay' : 'Tour'}</span>
          </button>

          <div 
            id="tour-capacity-pill"
            className="flex items-center gap-2.5 bg-white dark:bg-slate-800/80 px-3.5 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs transition-colors"
          >
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{t('dashboard.unitCapacity', 'Unit Capacity')}</span>
            {isLoading ? (
              <SkeletonElement height="14px" className="w-16" rounded="rounded-full" delay={40} />
            ) : (
              <>
                <div className="flex gap-1.5">
                  <div className={`w-5 h-2 rounded-full transition-all duration-300 ${franchises.length >= 1 ? 'bg-[#7A1B22] dark:bg-[#D4AF37]' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  <div className={`w-5 h-2 rounded-full transition-all duration-300 ${franchises.length >= 2 ? 'bg-[#7A1B22] dark:bg-[#D4AF37]' : 'bg-slate-200 dark:bg-slate-700'}`} />
                </div>
                <span className="text-xs font-black text-[#7A1B22] dark:text-[#D4AF37]">{franchises.length}/2</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 4. GARAGE UNITS LIST / EMPTY STATE */}
      {isLoading ? (
        <GarageGridSkeleton count={2} baseDelay={70} />
      ) : franchises.length === 0 ? (
        <div 
          id="tour-empty-garage"
          className="animate-spring-in bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center min-h-[280px] transition-colors"
        >
          <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-3.5 text-[#7A1B22] dark:text-[#D4AF37]"><PlusCircle size={28} /></div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">{t('dashboard.noUnitsTitle', 'No Franchise Units Found')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 max-w-sm">{t('dashboard.noUnitsDesc', 'Your garage is currently empty. Register your tricycle unit for a franchise.')}</p>
          <button onClick={() => navigate('/apply-franchise')} className="bg-[#7A1B22] hover:bg-[#5A1419] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95 touch-bounce">{t('dashboard.applyNew', 'Apply New Franchise')}</button>
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
                  className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-slate-800/70 dark:to-slate-800/30 border border-slate-200/90 dark:border-slate-700/80 mb-4 flex items-center justify-between relative overflow-hidden"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7A1B22] dark:bg-[#D4AF37]" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 truncate">
                        MUNICIPALITY OF GASAN &bull; MTOP
                      </p>
                    </div>
                    <h3 className="font-mono text-2xl sm:text-3xl font-black tracking-wider text-slate-900 dark:text-white truncate">
                      {unit?.plateNo || t('dashboard.pendingPlate', 'PENDING')}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight shadow-2xs">
                      {unit?.make || 'Tricycle'}
                    </span>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1 uppercase">
                      {unit?.made || 'Model'}
                    </p>
                  </div>
                </div>

                {/* Minimalist 2x2 Specs Grid */}
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-white dark:bg-slate-700/60 flex items-center justify-center text-[#7A1B22] dark:text-[#D4AF37] shrink-0 shadow-2xs">
                      <MapPin size={13} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">{t('dashboard.routeZone', 'Route Zone')}</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{unit?.zone || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-white dark:bg-slate-700/60 flex items-center justify-center text-[#7A1B22] dark:text-[#D4AF37] shrink-0 shadow-2xs">
                      <Hash size={13} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">{t('dashboard.motorNumber', 'Motor Number')}</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{unit?.motorNo || 'N/A'}</p>
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
                      <div className={`mb-4 p-3.5 rounded-2xl border transition-all ${
                        isOverdue
                          ? 'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-900/60'
                          : isExpiringSoon
                          ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60'
                          : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50'
                      }`}>
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays size={14} className={isOverdue ? 'text-red-600 dark:text-red-400' : isExpiringSoon ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'} />
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isOverdue ? 'text-red-800 dark:text-red-300' : isExpiringSoon ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-800 dark:text-emerald-300'}`}>
                              {t('dashboard.validUntil', 'Valid Until')}
                            </span>
                          </div>
                          <p className={`text-xs font-black ${isOverdue ? 'text-red-950 dark:text-red-200' : isExpiringSoon ? 'text-amber-950 dark:text-amber-200' : 'text-emerald-950 dark:text-emerald-200'}`}>
                            {getExpirationDate(unit?.dateApplied)}
                          </p>
                        </div>

                        {/* Traffic-Light Urgency Meter */}
                        {daysRemaining !== null && (
                          <div className="space-y-1.5 pt-1">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                              <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                Status
                              </span>
                              <span className={`flex items-center gap-1 font-black ${
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
                              <div className="pt-2 flex items-center justify-between">
                                <p className="text-[10px] text-amber-800 dark:text-amber-300 font-medium leading-tight">
                                  Within 60-day renewal window. Renew early to avoid penalties.
                                </p>
                                <button
                                  onClick={() => navigate(`/renew-franchise/${unit._id}`)}
                                  className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-xs transition-colors shrink-0 ml-2 touch-bounce active:scale-95 cursor-pointer"
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
                    <div className="mb-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 p-3.5 rounded-2xl flex items-start gap-2.5">
                      <FileText className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={18} />
                      <div>
                        <h4 className="text-blue-900 dark:text-blue-200 font-black text-xs uppercase mb-0.5">{t('dashboard.approvedPaymentTitle', 'Approved! Next Step: Payment')}</h4>
                        <p className="text-[11px] font-medium text-blue-700 dark:text-blue-300 leading-snug">{t('dashboard.approvedPaymentDesc', 'Present your Claim Stub to the Municipal Cashier to pay the fee and claim your Official Permit.')} (<b>₱{parseFloat(systemFranchiseFee).toFixed(2)}</b>)</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Row */}
              <div 
                id={unitIndex === 0 ? "tour-card-actions" : undefined}
                className="flex flex-col sm:flex-row gap-2 mt-auto pt-3.5 border-t border-slate-100 dark:border-slate-800"
              >
                {unit?.status === 'Expired' ? (
                  <button onClick={() => navigate('/apply-franchise')} className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95 touch-bounce cursor-pointer"><RefreshCw size={14} /> {t('dashboard.btnRenew', 'Renew Franchise')}</button>
                ) : unit?.status === 'Active' ? (
                  <button onClick={() => { setSelectedUnit(unit); setIsDetailsOpen(true); }} className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 touch-bounce cursor-pointer">{t('dashboard.btnViewDetails', 'View Details')}</button>
                ) : unit?.status === 'Ready for Pickup' ? (
                  <div className="flex flex-col sm:flex-row w-full gap-2">
                    <button 
                      onClick={() => { setSelectedUnit(unit); setIsPrintOpen(true); }} 
                      className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#c59f2c] text-slate-950 hover:opacity-95 font-black text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 touch-bounce cursor-pointer"
                    >
                      <Receipt size={14} /> {t('dashboard.btnViewStub', 'Claim Stub')}
                    </button>
                    <button 
                      onClick={() => handleDirectDownload(unit)} 
                      className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-3 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 active:scale-95 touch-bounce cursor-pointer"
                    >
                      <Download size={14} />
                    </button>
                    <button 
                      onClick={() => { setSelectedUnit(unit); setIsDetailsOpen(true); }} 
                      className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-2.5 rounded-xl font-bold text-xs transition-colors active:scale-95 touch-bounce cursor-pointer"
                    >
                      {t('dashboard.btnViewDetails', 'Details')}
                    </button>
                  </div>
                ) : unit?.status === 'Cancelled' ? (
                  <button onClick={() => { localStorage.setItem('reapply_target', JSON.stringify(unit)); navigate('/apply-franchise'); }} className="w-full bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95 touch-bounce cursor-pointer">
                    <RefreshCw size={14} /> {t('dashboard.btnFixIssues', 'Fix Issues')}
                  </button>
                ) : (
                  <div className="flex items-center w-full gap-2">
                    <button onClick={() => { setSelectedUnit(unit); setIsDetailsOpen(true); }} className="flex-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-2.5 rounded-xl font-bold text-xs transition-colors active:scale-95 touch-bounce cursor-pointer">{t('dashboard.btnViewDetails', 'View Details')}</button>
                    {(unit?.status === 'Pending' || unit?.status === 'Ready for Pickup') && (
                      <button 
                        onClick={() => setCancelModal({
                          isOpen: true,
                          unit,
                          reason: CANCEL_REASONS[0],
                          customReason: '',
                          isSubmitting: false
                        })}
                        className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-900/60 px-3 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 active:scale-95 touch-bounce cursor-pointer shrink-0"
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
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl relative z-10 p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-black text-slate-900 dark:text-white">{t('dashboard.modalSpecsTitle', 'Unit Specifications')}</h2>
              <button onClick={() => setIsDetailsOpen(false)} className="text-slate-400 hover:text-red-500"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-y-3 text-xs text-slate-700 dark:text-slate-300">
              <div className="col-span-2">
                <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px]">{t('dashboard.operator', 'Operator')}</p>
                <p className="font-bold text-slate-900 dark:text-white">{selectedUnit?.fullName}</p>
              </div>
              <div><p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px]">{t('dashboard.toda', 'TODA')}</p><p className="font-bold text-slate-900 dark:text-white">{selectedUnit?.todaName}</p></div>
              <div><p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px]">{t('dashboard.routeZone', 'Route Zone')}</p><p className="font-bold text-slate-900 dark:text-white">{selectedUnit?.zone}</p></div>
              <div><p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px]">{t('dashboard.plateNo', 'Plate No.')}</p><p className="font-black text-slate-900 dark:text-white">{selectedUnit?.plateNo || 'N/A'}</p></div>
              <div><p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px]">{t('dashboard.makeModel', 'Make & Model')}</p><p className="font-bold text-slate-900 dark:text-white">{selectedUnit?.make} ({selectedUnit?.made})</p></div>
              <div><p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px]">{t('dashboard.motorNumber', 'Motor Number')}</p><p className="font-bold text-slate-900 dark:text-white">{selectedUnit?.motorNo}</p></div>
              <div><p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px]">{t('dashboard.chassisNumber', 'Chassis Number')}</p><p className="font-bold text-slate-900 dark:text-white">{selectedUnit?.chassisNo}</p></div>
            </div>
            <button onClick={() => setIsDetailsOpen(false)} className="w-full mt-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors">{t('dashboard.btnClose', 'Close')}</button>
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
