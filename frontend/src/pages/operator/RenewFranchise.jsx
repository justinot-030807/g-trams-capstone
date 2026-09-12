import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../components/MainLayout';
import DocumentUploadCard from '../../components/operator/DocumentUploadCard';
import FeedbackModal from '../../components/common/FeedbackModal';
import { 
  RefreshCw, ArrowLeft, CheckCircle2, AlertCircle, Loader2, 
  X, FileCheck, ShieldCheck, Car, Calendar, MapPin, Hash, Sparkles
} from 'lucide-react';

const RenewFranchise = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [franchise, setFranchise] = useState(null);
  const [loadingFranchise, setLoadingFranchise] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    ctcNo: '',
    dateIssued: new Date().toISOString().substring(0, 10),
    placeIssued: 'Gasan, Marinduque'
  });

  const [orcrFile, setOrcrFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [fullPreview, setFullPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Centered Feedback Modal state
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    confirmText: 'OK',
    onConfirm: null
  });

  // Fetch the franchise details to show operator what they are renewing
  useEffect(() => {
    const fetchFranchise = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/my-franchises`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const list = await res.json();
          const target = list.find(f => f._id === id);
          if (target) {
            setFranchise(target);
            if (target.cedulaAddress) {
              setFormData(prev => ({
                ...prev,
                placeIssued: target.cedulaAddress
              }));
            }
          }
        }
      } catch (err) {
        console.error('Error fetching franchise:', err);
      } finally {
        setLoadingFranchise(false);
      }
    };

    if (id) fetchFranchise();
  }, [id]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let sanitized = value;
    if (name === 'ctcNo') {
      sanitized = value.replace(/\D/g, '');
    }
    setFormData(prev => ({ ...prev, [name]: sanitized }));
  };

  const handleFileSelect = (fieldId, file) => {
    if (file) {
      setOrcrFile(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleFileRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setOrcrFile(null);
    setPreviewUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.ctcNo || !formData.dateIssued || !formData.placeIssued) {
      showToast('Please fill out all Community Tax Certificate (CTC) fields.', 'error');
      return;
    }

    setIsSubmitting(true);

    const submitData = new FormData();
    submitData.append('ctcNo', formData.ctcNo);
    submitData.append('dateIssued', formData.dateIssued);
    submitData.append('placeIssued', formData.placeIssued);
    submitData.append('cedulaSerialNo', formData.ctcNo);
    submitData.append('cedulaDate', formData.dateIssued);
    submitData.append('cedulaAddress', formData.placeIssued);
    submitData.append('dateApplied', new Date().toISOString());

    if (orcrFile) {
      submitData.append('orcrFile', orcrFile);
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/${id}/renew`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: submitData
      });

      const resData = await response.json();

      if (response.ok) {
        setFeedbackModal({
          isOpen: true,
          type: 'success',
          title: 'Renewal Application Submitted!',
          message: 'Your franchise renewal has been submitted to the BPLO for verification. You can track your renewal status on the dashboard.',
          confirmText: 'OK',
          onConfirm: () => {
            setFeedbackModal(prev => ({ ...prev, isOpen: false }));
            navigate('/operator-dashboard');
          }
        });
      } else {
        setFeedbackModal({
          isOpen: true,
          type: 'error',
          title: 'Submission Failed',
          message: resData.message || resData.error || 'Failed to submit renewal application.',
          confirmText: 'OK',
          onConfirm: () => setFeedbackModal(prev => ({ ...prev, isOpen: false }))
        });
      }
    } catch (err) {
      console.error('Server error:', err);
      showToast('Network error. Cannot connect to the server.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.6)] backdrop-blur-md rounded-2xl px-4 py-3 flex items-center gap-3 max-w-sm">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
              toast.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400'
                : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400'
            }`}>
              {toast.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto pb-28 sm:pb-16 animate-in fade-in duration-300">
        {/* Back Link */}
        <button
          onClick={() => navigate('/operator-dashboard')}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-[#7A1B22] dark:hover:text-[#D4AF37] mb-4 p-2 -ml-2 rounded-xl transition-colors group cursor-pointer active:scale-95"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Dashboard</span>
        </button>

        {/* Card Container */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#7A1B22] via-[#65151c] to-[#4d1015] p-5 sm:p-7 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="bg-[#D4AF37] text-slate-950 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-2xs">
                  Annual Renewal
                </span>
                <span className="text-white/80 text-xs sm:text-sm font-medium">G-TRAMS Municipality of Gasan</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight">Franchise Renewal</h1>
              <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-xl leading-relaxed font-medium">
                Update your Community Tax Certificate (CTC / Cedula) and OR/CR to keep your franchise registration active.
              </p>
            </div>
            <RefreshCw size={120} className="absolute -right-4 -bottom-6 text-white/10 rotate-12 pointer-events-none" />
          </div>

          {/* Loading Skeleton */}
          {loadingFranchise && (
            <div className="p-6 sm:p-8 space-y-4">
              <div className="h-28 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
              <div className="h-44 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
            </div>
          )}

          {/* If Franchise Not Found */}
          {!loadingFranchise && !franchise && (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Franchise Record Not Found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto font-medium">
                This franchise record could not be located. Please return to your dashboard.
              </p>
              <button
                type="button"
                onClick={() => navigate('/operator-dashboard')}
                className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#7A1B22] text-white font-bold text-xs sm:text-sm shadow-sm hover:bg-[#5A1419] cursor-pointer active:scale-95"
              >
                <ArrowLeft size={15} />
                <span>Back to Dashboard</span>
              </button>
            </div>
          )}

          {/* Transport Boarding Pass Style Summary */}
          {!loadingFranchise && franchise && (
            <div className="p-4 sm:p-6 bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Car size={14} className="text-[#7A1B22] dark:text-[#D4AF37]" />
                  Official Tricycle Details (Transport Pass)
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {franchise.status || 'Active'}
                </span>
              </div>

              {/* The Pass Card */}
              <div className="relative bg-white dark:bg-slate-800/95 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs overflow-hidden">
                {/* Top Pass Header */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white px-4 sm:px-5 py-3 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#D4AF37] flex items-center justify-center text-slate-950 font-bold text-xs shadow-2xs">
                      GT
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">Municipality of Gasan &bull; MTOP</p>
                      <p className="text-xs font-semibold text-white/90">Tricycle Franchise Renewal Pass</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg text-xs font-mono font-medium text-white/90">
                    <Hash size={12} className="text-[#D4AF37]" />
                    <span>{franchise.mtopNo ? `MTOP #${franchise.mtopNo}` : `ID: ${franchise._id ? franchise._id.slice(-6).toUpperCase() : 'N/A'}`}</span>
                  </div>
                </div>

                {/* Main Pass Body */}
                <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-center">
                  {/* Plate Number & Model */}
                  <div className="sm:col-span-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Plate Number
                    </span>
                    <div className="inline-flex items-center gap-2.5 bg-slate-100 dark:bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-300/80 dark:border-slate-700 shadow-inner">
                      <span className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-slate-900 dark:text-white">
                        {franchise.plateNo}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#7A1B22] text-white">
                        GASAN
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1.5 flex items-center gap-1.5">
                      <span className="font-semibold">{franchise.make || 'Tricycle'}</span>
                      <span className="text-slate-300 dark:text-slate-600">&bull;</span>
                      <span className="text-slate-500 dark:text-slate-400">Model Year {franchise.made || 'N/A'}</span>
                    </p>
                  </div>

                  {/* Route & Toda Info Card */}
                  <div className="space-y-1.5 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">TODA Association</span>
                      <span className="text-xs sm:text-sm font-bold text-[#7A1B22] dark:text-[#D4AF37] truncate block mt-0.5">
                        {franchise.todaName || 'NON-TODA'}
                      </span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Route / Zone</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                        Zone {franchise.zone || 'N/A'} (Gasan)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Perforated Divider with Circular Notches */}
                <div className="relative flex items-center justify-between px-2">
                  <div className="w-4 h-4 rounded-full bg-slate-50 dark:bg-[#0b0f19] -ml-4 border-r border-slate-200/80 dark:border-slate-700"></div>
                  <div className="w-full border-t border-dashed border-slate-200 dark:border-slate-700 mx-1"></div>
                  <div className="w-4 h-4 rounded-full bg-slate-50 dark:bg-[#0b0f19] -mr-4 border-l border-slate-200/80 dark:border-slate-700"></div>
                </div>

                {/* Pass Footer / Stub Details */}
                <div className="px-4 sm:px-5 py-2.5 bg-slate-50/70 dark:bg-slate-900/40 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-3.5 flex-wrap">
                    {franchise.motorNo && (
                      <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] sm:text-xs">
                        <strong className="text-slate-700 dark:text-slate-300 font-semibold">Motor:</strong> {franchise.motorNo}
                      </span>
                    )}
                    {franchise.chassisNo && (
                      <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] sm:text-xs">
                        <strong className="text-slate-700 dark:text-slate-300 font-semibold">Chassis:</strong> {franchise.chassisNo}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-[#7A1B22] dark:text-[#D4AF37] flex items-center gap-1">
                    <ShieldCheck size={13} />
                    Official BPLO Registry
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Renewal Form */}
          {!loadingFranchise && franchise && (
            <form onSubmit={handleSubmit} className="p-4 sm:p-7 space-y-5 sm:space-y-6">
              
              {/* Step 1: Updated Cedula Information */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-[#7A1B22] text-white dark:bg-[#D4AF37] dark:text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    1
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Step 1: Latest Community Tax Certificate (CTC)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Enter details of your current Community Tax Certificate issued for this year.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      CTC / Cedula Serial No. <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="ctcNo" 
                      value={formData.ctcNo}
                      onChange={handleChange} 
                      required 
                      className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#7A1B22] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-[#7A1B22]/15 transition-all shadow-2xs placeholder:text-slate-400 min-h-[42px]" 
                      placeholder="e.g. 08123456"
                    />
                    <p className="text-[11px] font-medium text-slate-400 mt-1">Digits only</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Date Issued <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="date" 
                      name="dateIssued" 
                      value={formData.dateIssued}
                      onChange={handleChange} 
                      required 
                      className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#7A1B22] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-[#7A1B22]/15 transition-all shadow-2xs min-h-[42px]" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Place Issued <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      name="placeIssued" 
                      value={formData.placeIssued}
                      onChange={handleChange} 
                      required 
                      className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#7A1B22] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-[#7A1B22]/15 transition-all shadow-2xs min-h-[42px]" 
                      placeholder="Gasan, Marinduque"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Vehicle Document (Mobile-first Camera Upload) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-[#7A1B22] text-white dark:bg-[#D4AF37] dark:text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    2
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Step 2: Latest Tricycle OR/CR (LTO)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Take a photo or upload your latest Official Receipt & Certificate of Registration from LTO.
                    </p>
                  </div>
                </div>

                <div className="max-w-xl mt-4">
                  <DocumentUploadCard
                    id="orcrFile"
                    label="Official Receipt / Certificate of Registration (OR/CR)"
                    file={orcrFile}
                    previewUrl={previewUrl || franchise?.orCrUrl}
                    onFileSelect={handleFileSelect}
                    onFileRemove={handleFileRemove}
                    onPreviewZoom={setFullPreview}
                    required={false}
                  />
                </div>
              </div>

              {/* Renewal Fee & Reminder */}
              <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-900/60 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex items-start gap-3">
                <ShieldCheck size={20} className="text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-200">
                    Renewal Fee & Processing Notice
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-amber-300/90 mt-1 leading-relaxed font-medium">
                    Online submission is free of charge. Once verified by BPLO, bring your Claim Voucher and renewal fee of <strong>₱500.00</strong> to the Municipal Treasury / BPLO Office to receive your updated permit sticker.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 gap-2.5">
                <button 
                  type="button" 
                  onClick={() => navigate('/operator-dashboard')} 
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer min-h-[42px] flex items-center justify-center active:scale-95"
                >
                  Cancel
                </button>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white transition-all shadow-xs active:scale-95 cursor-pointer min-h-[42px] ${
                    isSubmitting ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed' : 'bg-[#7A1B22] hover:bg-[#5A1419] shadow-[#7A1B22]/20'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Submitting Renewal...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Submit Renewal Application</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>

      {/* Document Zoom Modal */}
      {fullPreview && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setFullPreview(null)}
        >
          <div 
            className="relative max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck size={16} className="text-[#7A1B22] dark:text-[#D4AF37]" />
                {fullPreview.title || 'Document Preview'}
              </h4>
              <button 
                onClick={() => setFullPreview(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-950/5 dark:bg-black/30 rounded-2xl p-2">
              {fullPreview.url?.toLowerCase().includes('.pdf') ? (
                <iframe 
                  src={fullPreview.url} 
                  title={fullPreview.title} 
                  className="w-full h-[60vh] rounded-xl border-0"
                />
              ) : (
                <img 
                  src={fullPreview.url} 
                  alt={fullPreview.title} 
                  className="max-h-[65vh] w-auto object-contain rounded-xl shadow-xs" 
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Centered Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        type={feedbackModal.type}
        title={feedbackModal.title}
        message={feedbackModal.message}
        confirmText={feedbackModal.confirmText || 'OK'}
        onConfirm={feedbackModal.onConfirm || (() => setFeedbackModal(prev => ({ ...prev, isOpen: false })))}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
      />
    </MainLayout>
  );
};

export default RenewFranchise;