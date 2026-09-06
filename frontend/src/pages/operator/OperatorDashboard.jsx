import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout';
import { 
  RefreshCw, AlertCircle, CheckCircle, Clock, Loader2, 
  CalendarDays, PlusCircle, MapPin, Hash, Printer, X, ShieldCheck, Download, Eye,
  Check, FileText, Star, ShieldAlert, Receipt
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { GarageGridSkeleton, SkeletonElement } from '../../components/skeleton';

const OperatorDashboard = () => {
  const { t, language } = useLanguage();
  const [franchises, setFranchises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  const loggedInUserName = localStorage.getItem('name') || 'Operator';
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const systemFranchiseFee = localStorage.getItem('franchise_fee') || '500';

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
    if (status === 'Ready for Pickup') currentStepNum = 3;

    return (
      <div className="mb-5 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">{t('dashboard.appProgress', 'Application Progress')}</p>
        
        {/* Step progress line */}
        <div className="relative flex items-center justify-between z-10 before:absolute before:left-0 before:top-3 before:w-full before:h-[3px] before:bg-slate-200 dark:before:bg-slate-700 before:-z-10">
          
          <div 
            className="absolute left-0 top-3 h-[3px] bg-[#7A1B22] dark:bg-[#D4AF37] transition-all duration-500 ease-out -z-10"
            style={{ width: currentStepNum === 1 ? '0%' : currentStepNum === 2 ? '33.33%' : currentStepNum === 3 ? '66.66%' : '100%' }}
          />
          
          {steps.map((step) => {
            const isCompleted = currentStepNum > step.id;
            const isCurrent = currentStepNum === step.id;

            return (
              <div key={step.id} className="flex flex-col items-center bg-slate-50 dark:bg-slate-800/90 px-2 sm:px-3 rounded-lg">
                <div 
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isCompleted 
                      ? 'bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-900 shadow-xs' 
                      : isCurrent 
                      ? 'bg-white dark:bg-slate-800 border-2 border-[#7A1B22] dark:border-[#D4AF37] ring-3 ring-[#7A1B22]/15 dark:ring-[#D4AF37]/20' 
                      : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={12} className="stroke-[3]" />
                  ) : isCurrent ? (
                    <div className="w-2 h-2 bg-[#7A1B22] dark:bg-[#D4AF37] rounded-full animate-pulse" />
                  ) : (
                    <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  )}
                </div>
                <span className={`text-[10px] font-bold mt-1.5 tracking-tight text-center ${
                  isCurrent ? 'text-[#7A1B22] dark:text-[#D4AF37] font-black' : isCompleted ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'
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

  return (
    <MainLayout>
      <style>{`
        @keyframes slideFadeUp { 0% { opacity: 0; transform: translateY(22px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes floatSlow { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(15px, -15px) scale(1.1); } }
        .animate-dashboard-card { opacity: 0; animation: slideFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-banner-orb { animation: floatSlow 8s ease-in-out infinite alternate; }
        @media print {
          body * { visibility: hidden; }
          #printable-document, #printable-document * { visibility: visible; }
          #printable-document { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <div className="animate-dashboard-card bg-gradient-to-r from-[#7A1B22] via-[#8C2028] to-[#551016] rounded-3xl p-6 sm:p-8 mb-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border-l-8 border-[#D4AF37]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none animate-banner-orb" />
        <div className="relative z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase mb-2 border border-white/10">
            <Star size={12} /> {t('dashboard.badge', 'Operator Portal')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">{t('dashboard.welcome', 'Welcome')}, {loggedInUserName}!</h1>
          <p className="text-white/80 font-medium text-xs sm:text-sm">{t('dashboard.welcomeSub', 'Manage your active and pending franchises securely.')}</p>
        </div>
        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3.5 rounded-2xl text-center md:text-right shadow-sm shrink-0">
          <p className="font-black text-sm sm:text-base tracking-wide text-white">{currentTime.toLocaleDateString(language === 'fil' ? 'tl-PH' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
          <p className="text-xs font-semibold text-white/80 flex items-center justify-center md:justify-end gap-1.5 mt-0.5"><Clock size={14} className="text-[#D4AF37]" />{currentTime.toLocaleTimeString(language === 'fil' ? 'tl-PH' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      <header className="animate-dashboard-card mb-6 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-[#7A1B22] rounded-full" />
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{t('dashboard.garageTitle', 'My Franchise Garage')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{t('dashboard.garageSub', 'Assigned tricycle units under your account')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{t('dashboard.unitCapacity', 'Unit Capacity')}</span>
          {isLoading ? (
            <SkeletonElement height="14px" className="w-16" rounded="rounded-full" delay={40} />
          ) : (
            <>
              <div className="flex gap-1.5">
                <div className={`w-6 h-2 rounded-full transition-all ${franchises.length >= 1 ? 'bg-[#7A1B22] dark:bg-[#D4AF37]' : 'bg-slate-200 dark:bg-slate-700'}`} />
                <div className={`w-6 h-2 rounded-full transition-all ${franchises.length >= 2 ? 'bg-[#7A1B22] dark:bg-[#D4AF37]' : 'bg-slate-200 dark:bg-slate-700'}`} />
              </div>
              <span className="text-xs font-black text-[#7A1B22] dark:text-[#D4AF37]">{franchises.length}/2</span>
            </>
          )}
        </div>
      </header>

      {isLoading ? (
        <GarageGridSkeleton count={2} baseDelay={70} />
      ) : franchises.length === 0 ? (
        <div className="animate-dashboard-card bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center min-h-[300px] transition-colors">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-[#7A1B22] dark:text-[#D4AF37]"><PlusCircle size={32} /></div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">{t('dashboard.noUnitsTitle', 'No Franchise Units Found')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-sm">{t('dashboard.noUnitsDesc', 'Your garage is currently empty. Register your tricycle unit for a franchise.')}</p>
          <button onClick={() => navigate('/apply-franchise')} className="bg-[#7A1B22] hover:bg-[#5A1419] text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95">{t('dashboard.applyNew', 'Apply New Franchise')}</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {franchises.map((unit, unitIndex) => (
            <div 
              key={unit?._id} 
              className="animate-dashboard-card bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all"
              style={{ animationDelay: `${0.06 + unitIndex * 0.09}s` }}
            >
              <div className={`absolute top-0 left-0 w-full h-1.5 ${
                unit?.status === 'Active' ? 'bg-emerald-500' :
                unit?.status === 'Ready for Pickup' ? 'bg-blue-500' :
                unit?.status === 'Expired' ? 'bg-orange-500' :
                unit?.status === 'Cancelled' ? 'bg-red-500' : 'bg-amber-400'
              }`} />

              <div>
                <div className="flex justify-between items-start mb-5 mt-1">
                  <div>
                    <h3 className="font-black text-2xl text-slate-900 dark:text-white tracking-wider mb-0.5">{unit?.plateNo || t('dashboard.pendingPlate', 'PENDING PLATE')}</h3>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{unit?.todaName} &bull; {unit?.make} ({unit?.made})</p>
                  </div>
                  
                  <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1.5 border shadow-sm ${
                    unit?.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60' :
                    unit?.status === 'Ready for Pickup' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60' :
                    unit?.status === 'Expired' ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/60' :
                    unit?.status === 'Cancelled' ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/60' :
                    'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                  }`}>
                    {unit?.status === 'Active' && <CheckCircle size={13}/>}
                    {unit?.status === 'Ready for Pickup' && <FileText size={13}/>}
                    {unit?.status === 'Pending' && <Clock size={13} className="animate-pulse"/>}
                    {(unit?.status === 'Cancelled' || unit?.status === 'Expired') && <AlertCircle size={13}/>}
                    {unit?.status === 'Active' ? t('dashboard.statusActive', 'Active') :
                     unit?.status === 'Ready for Pickup' ? t('dashboard.statusReadyPickup', 'Awaiting Payment') :
                     unit?.status === 'Expired' ? t('dashboard.statusExpired', 'Expired') :
                     unit?.status === 'Cancelled' ? t('dashboard.statusCancelled', 'Cancelled') :
                     t('dashboard.statusPending', 'Pending')}
                  </span>
                </div>

                {renderApplicationTracker(unit?.status)}

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800">
                    <MapPin className="text-[#7A1B22] dark:text-[#D4AF37] shrink-0" size={16} />
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('dashboard.routeZone', 'Route Zone')}</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{unit?.zone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800">
                    <Hash className="text-[#7A1B22] dark:text-[#D4AF37] shrink-0" size={16} />
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('dashboard.motorNumber', 'Motor Number')}</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{unit?.motorNo}</p>
                    </div>
                  </div>
                </div>

                {unit?.status === 'Active' && (
                  <div className="mb-5 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 p-4 rounded-2xl">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2"><CalendarDays size={16} className="text-emerald-600 dark:text-emerald-400" /><span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">{t('dashboard.validUntil', 'Valid Until')}</span></div>
                      <p className="text-xs font-black text-emerald-950 dark:text-emerald-200">{getExpirationDate(unit?.dateApplied)}</p>
                    </div>
                  </div>
                )}

                {unit?.status === 'Ready for Pickup' && (
                  <div className="mb-5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 p-4 rounded-2xl flex items-start gap-3">
                    <FileText className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={20} />
                    <div>
                      <h4 className="text-blue-900 dark:text-blue-200 font-black text-xs uppercase mb-1">{t('dashboard.approvedPaymentTitle', 'Approved! Next Step: Payment')}</h4>
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-300 leading-snug">{t('dashboard.approvedPaymentDesc', 'Present your Claim Stub to the Municipal Cashier to pay the fee and claim your Official Permit.')} (<b>₱{parseFloat(systemFranchiseFee).toFixed(2)}</b>)</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                {unit?.status === 'Expired' ? (
                  <button onClick={() => navigate('/apply-franchise')} className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-98"><RefreshCw size={14} /> {t('dashboard.btnRenew', 'Renew Franchise')}</button>
                ) : unit?.status === 'Active' ? (
                  <button onClick={() => { setSelectedUnit(unit); setIsDetailsOpen(true); }} className="w-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors active:scale-98">{t('dashboard.btnViewDetails', 'View Details')}</button>
                ) : unit?.status === 'Ready for Pickup' ? (
                  <div className="flex flex-col sm:flex-row w-full gap-2.5">
                    <button onClick={() => { setSelectedUnit(unit); setIsDetailsOpen(true); }} className="flex-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-2.5 rounded-xl font-bold text-xs transition-colors active:scale-98">{t('dashboard.btnViewDetails', 'View Details')}</button>
                    <div className="flex flex-1 gap-2">
                      <button onClick={() => { setSelectedUnit(unit); setIsPrintOpen(true); }} className="flex-1 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-3 py-2.5 rounded-xl font-bold text-[11px] transition-colors flex items-center justify-center gap-1.5 active:scale-98">
                        <Eye size={14} /> {t('dashboard.btnViewStub', 'View Stub')}
                      </button>
                      <button onClick={() => handleDirectDownload(unit)} className="flex-1 bg-blue-600 text-white hover:bg-blue-700 px-3 py-2.5 rounded-xl font-bold text-[11px] transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-98">
                        <Download size={14} /> {t('dashboard.btnDownload', 'Download')}
                      </button>
                    </div>
                  </div>
                ) : unit?.status === 'Cancelled' ? (
                  <button onClick={() => { localStorage.setItem('reapply_target', JSON.stringify(unit)); navigate('/apply-franchise'); }} className="w-full bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 active:scale-98">
                    <RefreshCw size={14} /> {t('dashboard.btnFixIssues', 'Fix Issues')}
                  </button>
                ) : (
                  <>
                    <button onClick={() => { setSelectedUnit(unit); setIsDetailsOpen(true); }} className="flex-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors active:scale-98">{t('dashboard.btnViewDetails', 'View Details')}</button>
                    <button disabled className="flex-1 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs cursor-not-allowed">{t('dashboard.btnPendingReview', 'Pending Review')}</button>
                  </>
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

      {/* Document View & Download Modal */}
      {isPrintOpen && selectedUnit && (
        <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-950 flex flex-col">
          <div className="bg-slate-900 p-4 flex justify-between items-center text-white print:hidden">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <FileText size={18} className="text-[#D4AF37]" /> {t('dashboard.claimStubTitle', 'Payment & Claim Stub')}
            </h2>
            <div className="flex gap-2">
              <button onClick={() => setIsPrintOpen(false)} className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5"><X size={14} /> {t('dashboard.btnClose', 'Close')}</button>
              <button onClick={() => window.print()} className="px-4 py-1.5 bg-[#7A1B22] hover:bg-[#5A1419] text-white rounded-xl text-xs font-bold flex items-center gap-1.5">
                <Download size={14} /> {t('dashboard.savePdf', 'Save as PDF / Print')}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-8 print:p-0 print:bg-white flex justify-center items-start">
            <div id="printable-document" className="bg-white w-full max-w-[600px] border-2 border-dashed border-slate-300 shadow-xl p-8 sm:p-12 print:border-none print:shadow-none relative">
              <div className="text-center mb-6 border-b-2 border-dashed border-slate-300 pb-6">
                <div className="inline-flex justify-center items-center w-16 h-16 bg-blue-50 text-blue-600 rounded-full mb-4">
                  <FileText size={32} />
                </div>
                <h1 className="text-2xl font-black uppercase tracking-widest text-[#7A1B22]">{t('dashboard.claimStubHeader', 'Franchise Claim Stub')}</h1>
                <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">{t('dashboard.municipality', 'Municipality of Gasan')}</p>
              </div>

              <div className="text-center mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{t('dashboard.totalAmountDue', 'Total Amount Due')}</p>
                <p className="text-5xl font-black text-slate-900">₱ {parseFloat(systemFranchiseFee).toFixed(2)}</p>
                <p className="text-xs text-red-500 font-semibold mt-2">{t('dashboard.penaltyNote', '* Amount may vary if late penalties apply.')}</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-sm text-slate-500 font-bold uppercase">{t('dashboard.applicantName', 'Applicant Name')}</span>
                  <span className="text-sm font-black text-slate-900 uppercase text-right">{selectedUnit?.fullName}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-sm text-slate-500 font-bold uppercase">{t('dashboard.plateNo', 'Tricycle Plate No.')}</span>
                  <span className="text-sm font-black text-slate-900 uppercase text-right">{selectedUnit?.plateNo || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-sm text-slate-500 font-bold uppercase">{t('dashboard.applicationType', 'Application Type')}</span>
                  <span className="text-sm font-black text-slate-900 uppercase text-right">{selectedUnit?.applicationType}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-sm text-slate-500 font-bold uppercase">{t('dashboard.dateApproved', 'Date Approved')}</span>
                  <span className="text-sm font-black text-slate-900 uppercase text-right">{selectedUnit?.updatedAt ? new Date(selectedUnit?.updatedAt).toLocaleDateString(language === 'fil' ? 'tl-PH' : 'en-US') : 'N/A'}</span>
                </div>
              </div>

              <div className="mt-8 text-center bg-blue-50 border border-blue-200 p-4 rounded-xl">
                <p className="text-xs font-bold text-blue-800 leading-relaxed uppercase">
                  {t('dashboard.claimInstructions', 'Please present this stub (Digital or Printed) to the Municipal Cashier to process your payment and claim your Official Dry-Sealed Franchise Permit.')}
                </p>
              </div>
              
              <div className="mt-8 flex flex-col items-center justify-center opacity-60">
                <div className="flex gap-1 h-10 w-48 bg-slate-800" style={{ background: 'repeating-linear-gradient(90deg, #1e293b, #1e293b 2px, transparent 2px, transparent 4px, #1e293b 4px, #1e293b 8px, transparent 8px, transparent 10px)' }}></div>
                <p className="text-[10px] font-mono font-bold mt-1 tracking-widest">{selectedUnit?._id}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default OperatorDashboard;
