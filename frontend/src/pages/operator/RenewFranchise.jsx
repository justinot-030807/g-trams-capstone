import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../components/MainLayout';
import DocumentUploadCard from '../../components/operator/DocumentUploadCard';
import FeedbackModal from '../../components/common/FeedbackModal';
import DocumentPreviewModal from '../../components/operator/DocumentPreviewModal';
import SimpleDatePicker from '../../components/common/SimpleDatePicker';
import { 
  RefreshCw, ArrowLeft, CheckCircle2, AlertCircle, Loader2, 
  X, FileCheck, ShieldCheck, Calendar, CalendarDays, MapPin, Hash,
  FileText, User
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import TricycleIcon from '../../components/common/TricycleIcon';
import { formatZoneLabel } from '../../utils/constants';

const RenewFranchise = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { language } = useLanguage();

  const handleBack = () => {
    navigate('/operator-dashboard');
  };

  const systemFranchiseFee = localStorage.getItem('franchise_fee') || '500';

  const [franchise, setFranchise] = useState(null);
  const [loadingFranchise, setLoadingFranchise] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    ctcNo: '',
    dateIssued: new Date().toISOString().substring(0, 10),
    placeIssued: 'Gasan, Marinduque',
    orCrNo: '',
    orCrExpiryDate: '',
    driverLicenseNo: '',
    driverLicenseExpiryDate: ''
  });

  const [orcrFile, setOrcrFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [cedulaFile, setCedulaFile] = useState(null);
  const [cedulaPreviewUrl, setCedulaPreviewUrl] = useState('');
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
            setFormData(prev => ({
              ...prev,
              placeIssued: target.cedulaAddress || prev.placeIssued,
              ctcNo: target.cedulaSerialNo || prev.ctcNo,
              orCrNo: target.orCrNo || '',
              orCrExpiryDate: target.orCrExpiryDate ? target.orCrExpiryDate.substring(0, 10) : '',
              driverLicenseNo: target.driverLicenseNo || '',
              driverLicenseExpiryDate: target.driverLicenseExpiryDate ? target.driverLicenseExpiryDate.substring(0, 10) : ''
            }));
            if (target.cedulaUrl) {
              setCedulaPreviewUrl(target.cedulaUrl);
            }
            if (target.orCrUrl) {
              setPreviewUrl(target.orCrUrl);
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
      sanitized = value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 16).toUpperCase();
    }
    setFormData(prev => ({ ...prev, [name]: sanitized }));
  };

  const handleFileSelect = (fieldId, file) => {
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast('File is too large. Maximum size is 10MB.', 'error');
        return;
      }
      if (fieldId === 'cedulaDoc') {
        setCedulaFile(file);
        if (cedulaPreviewUrl && cedulaPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(cedulaPreviewUrl);
        setCedulaPreviewUrl(URL.createObjectURL(file));
      } else {
        setOrcrFile(file);
        if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(file));
      }
    }
  };

  const handleFileRemove = (fieldId) => {
    if (fieldId === 'cedulaDoc') {
      if (cedulaPreviewUrl && cedulaPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(cedulaPreviewUrl);
      setCedulaFile(null);
      setCedulaPreviewUrl('');
    } else {
      if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
      setOrcrFile(null);
      setPreviewUrl('');
    }
  };

  // Revoke object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      if (cedulaPreviewUrl && cedulaPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(cedulaPreviewUrl);
      }
    };
  }, [previewUrl, cedulaPreviewUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.ctcNo || !formData.dateIssued || !formData.placeIssued) {
      showToast('Please fill out all Community Tax Certificate (CTC) fields.', 'error');
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    // Cedula Current Fiscal Year Check
    if (formData.dateIssued) {
      const currentYear = new Date().getFullYear();
      const cedulaYear = new Date(formData.dateIssued).getFullYear();
      if (cedulaYear < currentYear) {
        showToast(`Expired Community Tax Certificate (Cedula). A Cedula issued in ${cedulaYear} is not valid for this fiscal year (${currentYear}).`, 'error');
        return;
      }
      if (formData.dateIssued > today) {
        showToast('Date issued for Cedula cannot be in the future.', 'error');
        return;
      }
    }

    // Expiry validation: Warn operator that LTO renewal is required before franchise renewal
    if (formData.orCrExpiryDate && formData.orCrExpiryDate < today) {
      showToast('Expired LTO OR/CR: Renewal with LTO is required before franchise renewal.', 'error');
      return;
    }

    if (formData.driverLicenseExpiryDate && formData.driverLicenseExpiryDate < today) {
      showToast("Expired Driver's License: Renewal with LTO is required before franchise renewal.", 'error');
      return;
    }

    setIsSubmitting(true);
    const slowNetTimer = setTimeout(() => {
      showToast("Network seems slow. Please wait while uploading...", "warning");
    }, 7000);

    const submitData = new FormData();
    submitData.append('ctcNo', formData.ctcNo);
    submitData.append('dateIssued', formData.dateIssued);
    submitData.append('placeIssued', formData.placeIssued);
    submitData.append('cedulaSerialNo', formData.ctcNo);
    submitData.append('cedulaDate', formData.dateIssued);
    submitData.append('cedulaAddress', formData.placeIssued);
    submitData.append('dateApplied', new Date().toISOString());

    submitData.append('orCrNo', formData.orCrNo || '');
    submitData.append('orCrExpiryDate', formData.orCrExpiryDate || '');
    submitData.append('driverLicenseNo', formData.driverLicenseNo || '');
    submitData.append('driverLicenseExpiryDate', formData.driverLicenseExpiryDate || '');

    if (orcrFile) {
      submitData.append('orcrFile', orcrFile);
    }
    if (cedulaFile) {
      submitData.append('cedulaDoc', cedulaFile);
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
          message: 'Your franchise renewal has been submitted to the Office of the Vice Mayor Extension for verification. You can track your renewal status on the dashboard.',
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
      clearTimeout(slowNetTimer);
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout hideNav={true}>
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] shadow-lg rounded-lg px-4 py-3 flex items-center gap-3 max-w-sm">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
              toast.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400'
                : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400'
            }`}>
              {toast.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] leading-snug">
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Immersive Form Layout (Zero Navbars) */}
      <div className="w-full min-h-screen bg-[#F6F5F3] dark:bg-[#14110F] flex flex-col transition-colors">
        {/* Top Hero Banner */}
        <div className="w-full bg-[#9E2A2B] text-white pt-4 pb-6 px-4 sm:px-6 relative overflow-hidden border-b border-[#7A1B22] shadow-xs">
          {/* Official Gasan Seal Watermark */}
          <div className="absolute -right-6 -bottom-8 pointer-events-none select-none">
            <img 
              src="/gasan-logo.png" 
              alt="Seal of Gasan" 
              className="w-52 h-52 sm:w-60 sm:h-60 object-contain opacity-20 drop-shadow-md" 
            />
          </div>

          <div className="max-w-2xl mx-auto relative z-10">
            {/* Top Navigation Row */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white text-sm font-bold transition-all border border-white/20 shadow-xs cursor-pointer min-h-[44px]"
                title="Back"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
            </div>

            {/* Form Title in Banner */}
            <div className="text-center pt-1 pb-3 flex flex-col items-center">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white uppercase">
                Franchise Renewal Application
              </h1>
              <p className="text-xs sm:text-sm text-white/90 font-medium mt-0.5">
                Bayan ng Gasan • Sangguniang Bayan Franchising Office
              </p>
            </div>
          </div>
        </div>

        {/* Form Container - Unboxed Full-Width Edge-to-Edge */}
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-16 flex-1 flex flex-col relative z-10 space-y-6">

          {/* Loading Skeleton */}
          {loadingFranchise && (
            <div className="p-6 sm:p-8 space-y-4">
              <div className="h-28 bg-[#E4E1DC]/60 dark:bg-[#2E2A27] rounded-lg animate-pulse" />
              <div className="h-44 bg-[#E4E1DC]/60 dark:bg-[#2E2A27] rounded-lg animate-pulse" />
            </div>
          )}

          {/* If Franchise Not Found */}
          {!loadingFranchise && !franchise && (
            <div className="p-8 sm:p-12 text-center bg-white dark:bg-[#1C1917] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs">
              <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                Franchise Record Not Found
              </h3>
              <p className="text-xs sm:text-sm text-[#6B6761] dark:text-[#A8A29E] mt-1 max-w-sm mx-auto font-medium">
                This franchise record could not be located. Please return to your franchises list.
              </p>
              <button
                type="button"
                onClick={handleBack}
                className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#9E2A2B] text-white font-bold text-sm shadow-xs hover:bg-[#7A1B22] cursor-pointer active:scale-95 min-h-[44px]"
              >
                <ArrowLeft size={15} />
                <span>Back</span>
              </button>
            </div>
          )}

          {/* Transport Summary Pass Card */}
          {!loadingFranchise && franchise && (
            <div className="p-4 sm:p-6 bg-white dark:bg-[#1C1917] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider flex items-center gap-1.5">
                  <TricycleIcon size={16} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                  Official Tricycle Details (Transport Pass)
                </span>
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  {franchise.status || 'Active'}
                </span>
              </div>

              {/* The Pass Card */}
              <div className="relative bg-[#F6F5F3] dark:bg-[#14110F] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] overflow-hidden">
                {/* Top Pass Header */}
                <div className="bg-[#1C1917] dark:bg-[#14110F] text-white px-4 sm:px-5 py-3 flex items-center justify-between flex-wrap gap-2 border-b border-[#2E2A27]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-[#D4AF37] flex items-center justify-center text-[#14110F] font-bold text-xs shadow-xs">
                      GT
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Municipality of Gasan &bull; MTOP</p>
                      <p className="text-xs font-semibold text-white/90">Tricycle Franchise Renewal Pass</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-md text-xs font-mono font-medium text-white/90 border border-white/10">
                    <Hash size={12} className="text-[#D4AF37]" />
                    <span>{franchise.mtopNo ? `MTOP #${franchise.mtopNo}` : `ID: ${franchise._id ? franchise._id.slice(-6).toUpperCase() : 'N/A'}`}</span>
                  </div>
                </div>

                {/* Main Pass Body */}
                <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-center">
                  {/* Plate Number & Model */}
                  <div className="sm:col-span-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E] block mb-1">
                      Plate Number
                    </span>
                    <div className="inline-flex items-center gap-2.5 bg-white dark:bg-[#1C1917] px-3.5 py-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs">
                      <span className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-[#1F1D1B] dark:text-[#EAE7E1]">
                        {franchise.plateNo}
                      </span>
                      <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-md bg-[#9E2A2B] text-white">
                        GASAN
                      </span>
                    </div>
                    <p className="text-xs font-medium text-[#1F1D1B] dark:text-[#EAE7E1] mt-1.5 flex items-center gap-1.5">
                      <span className="font-semibold">{franchise.make || 'Tricycle'}</span>
                      <span className="text-[#6B6761] dark:text-[#A8A29E]">&bull;</span>
                      <span className="text-[#6B6761] dark:text-[#A8A29E]">Model Year {franchise.made || 'N/A'}</span>
                    </p>
                  </div>

                  {/* Route & Toda Info Card */}
                  <div className="space-y-1.5 bg-white dark:bg-[#1C1917] p-3 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E] block">TODA Association</span>
                      <span className="text-xs sm:text-sm font-bold text-[#9E2A2B] dark:text-[#D4AF37] truncate block mt-0.5">
                        {franchise.todaName || 'NON-TODA'}
                      </span>
                    </div>
                    <div className="pt-1.5 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E] block">Route / Zone</span>
                      <span className="text-xs sm:text-sm font-bold text-[#1F1D1B] dark:text-[#EAE7E1] truncate block mt-0.5">
                        {formatZoneLabel(franchise.zone)} (Gasan)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pass Footer / Stub Details */}
                <div className="px-4 sm:px-5 py-2.5 bg-[#F6F5F3] dark:bg-[#14110F] border-t border-[#E4E1DC] dark:border-[#2E2A27] flex flex-wrap items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-3.5 flex-wrap">
                    {franchise.motorNo && (
                      <span className="text-[#6B6761] dark:text-[#A8A29E] font-medium text-xs">
                        <strong className="text-[#1F1D1B] dark:text-[#EAE7E1] font-semibold">Motor:</strong> {franchise.motorNo}
                      </span>
                    )}
                    {franchise.chassisNo && (
                      <span className="text-[#6B6761] dark:text-[#A8A29E] font-medium text-xs">
                        <strong className="text-[#1F1D1B] dark:text-[#EAE7E1] font-semibold">Chassis:</strong> {franchise.chassisNo}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-[#9E2A2B] dark:text-[#D4AF37] flex items-center gap-1">
                    <ShieldCheck size={13} />
                    Official Franchising & MTOP Extension Registry
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Renewal Form */}
          {!loadingFranchise && franchise && (
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 bg-white dark:bg-[#1C1917] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] space-y-5 sm:space-y-6 shadow-xs">
              
              {/* Step 1: Updated Cedula Information */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                  <div className="w-8 h-8 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/10 text-[#9E2A2B] dark:text-[#D4AF37] font-bold text-sm flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                      Step 1: Latest Community Tax Certificate (CTC)
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6B6761] dark:text-[#A8A29E] font-medium">
                      Enter details of your current Community Tax Certificate issued for this year.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
                  <div>
                    <label className="block text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1.5">
                      CTC / Cedula Serial No.
                    </label>
                    <input 
                      type="text" 
                      maxLength={16}
                      name="ctcNo" 
                      value={formData.ctcNo}
                      onChange={handleChange} 
                      required 
                      className="w-full bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-4 py-3 text-base font-medium text-[#1F1D1B] dark:text-[#EAE7E1] outline-none focus:outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] dark:focus:ring-[#D4AF37] transition-all shadow-xs placeholder:text-[#6B6761] dark:placeholder:text-[#A8A29E] min-h-[48px]" 
                      placeholder="e.g. 08123456"
                    />
                    <p className="text-xs font-medium text-[#6B6761] dark:text-[#A8A29E] mt-1">8–16 characters (letters &amp; numbers)</p>
                  </div>

                  <div>
                    <SimpleDatePicker
                      name="dateIssued"
                      value={formData.dateIssued}
                      onChange={handleChange}
                      label="Date Issued"
                      required
                      mode="issuance"
                      helperText="Date CTC was issued."
                    />
                    {formData.dateIssued && new Date(formData.dateIssued).getFullYear() < new Date().getFullYear() && (
                      <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                        <AlertCircle size={14} className="shrink-0" />
                        Please verify that CTC was issued for {new Date().getFullYear()}.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1.5">
                      Place Issued
                    </label>
                    <input 
                      type="text" 
                      name="placeIssued" 
                      value={formData.placeIssued}
                      onChange={handleChange} 
                      required 
                      className="w-full bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-4 py-3 text-base font-medium text-[#1F1D1B] dark:text-[#EAE7E1] outline-none focus:outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] dark:focus:ring-[#D4AF37] transition-all shadow-xs min-h-[48px]" 
                      placeholder="Gasan, Marinduque"
                    />
                  </div>
                </div>

                {/* Cedula Photo Upload */}
                <div className="mt-4 max-w-xl">
                  <DocumentUploadCard
                    id="cedulaDoc"
                    label="Community Tax Certificate (Cedula) Photo / Scanned Copy"
                    file={cedulaFile}
                    previewUrl={cedulaPreviewUrl || franchise?.cedulaUrl}
                    onFileSelect={handleFileSelect}
                    onFileRemove={() => handleFileRemove('cedulaDoc')}
                    onPreviewZoom={setFullPreview}
                    required={false}
                  />
                </div>
              </div>

              {/* Step 2: Vehicle Document (Mobile-first Camera Upload) */}
              <div className="space-y-3.5 pt-2">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                  <div className="w-8 h-8 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/10 text-[#9E2A2B] dark:text-[#D4AF37] font-bold text-sm flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                      Step 2: Latest Tricycle OR/CR (LTO)
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6B6761] dark:text-[#A8A29E] font-medium">
                      Take a photo or upload your latest Official Receipt & Certificate of Registration from LTO.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-xl">
                  <div>
                    <label className="block text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1.5">
                      OR / CR Number
                    </label>
                    <input 
                      type="text" 
                      name="orCrNo" 
                      value={formData.orCrNo}
                      onChange={handleChange} 
                      className="w-full bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-4 py-3 text-base font-medium text-[#1F1D1B] dark:text-[#EAE7E1] outline-none focus:outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] dark:focus:ring-[#D4AF37] transition-all shadow-xs min-h-[48px]" 
                      placeholder="e.g. OR-12345678 / CR-87654321"
                    />
                  </div>

                  <div>
                    <SimpleDatePicker
                      name="orCrExpiryDate"
                      value={formData.orCrExpiryDate}
                      onChange={handleChange}
                      label="LTO Registration Expiry Date"
                      mode="expiry"
                      helperText="LTO registration expiration date."
                    />
                  </div>
                </div>

                {Boolean(formData.orCrExpiryDate && formData.orCrExpiryDate < new Date().toISOString().split('T')[0]) && (
                  <div className="max-w-xl p-3.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-lg flex items-start gap-2.5 text-xs sm:text-sm font-bold text-red-700 dark:text-red-300 animate-in fade-in duration-200">
                    <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                    <p className="leading-snug">
                      Expired LTO OR/CR: Renewal with LTO is required before franchise renewal.
                    </p>
                  </div>
                )}

                <div className="max-w-xl mt-3">
                  <DocumentUploadCard
                    id="orcrFile"
                    label="Official Receipt / Certificate of Registration (OR/CR) Document"
                    file={orcrFile}
                    previewUrl={previewUrl || franchise?.orCrUrl}
                    onFileSelect={handleFileSelect}
                    onFileRemove={() => handleFileRemove('orcrFile')}
                    onPreviewZoom={setFullPreview}
                    required={false}
                  />
                </div>
              </div>

              {/* Step 3: Driver's License Information */}
              <div className="space-y-3.5 pt-2">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                  <div className="w-8 h-8 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/10 text-[#9E2A2B] dark:text-[#D4AF37] font-bold text-sm flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                      Step 3: Driver's License Information
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6B6761] dark:text-[#A8A29E] font-medium">
                      Enter the current Driver's License number and validity details.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-xl">
                  <div>
                    <label className="block text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1.5">
                      Driver's License No.
                    </label>
                    <input 
                      type="text" 
                      name="driverLicenseNo" 
                      value={formData.driverLicenseNo}
                      onChange={handleChange} 
                      className="w-full bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-4 py-3 text-base font-medium text-[#1F1D1B] dark:text-[#EAE7E1] outline-none focus:outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] dark:focus:ring-[#D4AF37] transition-all shadow-xs min-h-[48px]" 
                      placeholder="e.g. D01-23-456789"
                    />
                  </div>

                  <div>
                    <SimpleDatePicker
                      name="driverLicenseExpiryDate"
                      value={formData.driverLicenseExpiryDate}
                      onChange={handleChange}
                      label="License Expiry Date"
                      mode="expiry"
                      helperText="Driver's license expiration date."
                    />
                  </div>
                </div>

                {Boolean(formData.driverLicenseExpiryDate && formData.driverLicenseExpiryDate < new Date().toISOString().split('T')[0]) && (
                  <div className="max-w-xl p-3.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-lg flex items-start gap-2.5 text-xs sm:text-sm font-bold text-red-700 dark:text-red-300 animate-in fade-in duration-200">
                    <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                    <p className="leading-snug">
                      Expired Driver's License: Renewal with LTO is required before franchise renewal.
                    </p>
                  </div>
                )}
              </div>

              {/* Payment & Collection Notice */}
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-4 sm:p-5 flex items-start gap-3">
                <ShieldCheck size={22} className="text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-amber-950 dark:text-amber-200">
                    Payment & Collection Notice
                  </h4>
                  <p className="text-xs sm:text-sm text-[#6B6761] dark:text-amber-300/90 mt-1 leading-relaxed font-medium">
                    Submission is free. Once approved by the Franchising Office, pay the ₱500 fee at the Municipal Treasury window to claim your updated MTOP and sticker.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between pt-4 border-t border-[#E4E1DC] dark:border-[#2E2A27] gap-3">
                <button 
                  type="button" 
                  onClick={handleBack} 
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-bold text-sm sm:text-base text-[#1F1D1B] dark:text-[#EAE7E1] bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-[#F6F5F3] dark:hover:bg-[#252220] transition-all cursor-pointer min-h-[44px] flex items-center justify-center active:scale-95 shadow-xs"
                >
                  <span>Back</span>
                </button>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-2.5 rounded-lg font-bold text-sm sm:text-base text-white transition-all shadow-xs active:scale-95 cursor-pointer min-h-[44px] ${
                    isSubmitting ? 'bg-[#6B7280] cursor-not-allowed' : 'bg-[#9E2A2B] hover:bg-[#7A1B22]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Submitting Renewal...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
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
        <DocumentPreviewModal 
          fullPreview={fullPreview} 
          setFullPreview={setFullPreview} 
        />
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

