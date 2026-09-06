import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../components/MainLayout';
import DocumentUploadCard from '../../components/operator/DocumentUploadCard';
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
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleFileRemove = () => {
    setOrcrFile(null);
    setPreviewUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.ctcNo || !formData.dateIssued || !formData.placeIssued) {
      showToast('Please fill out all Cedula / CTC details.', 'error');
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
        showToast('Franchise renewal application submitted successfully!', 'success');
        setTimeout(() => {
          navigate('/operator-dashboard');
        }, 1200);
      } else {
        showToast(resData.message || resData.error || 'Failed to submit renewal application.', 'error');
      }
    } catch (err) {
      console.error('Server error:', err);
      showToast('Network error. Failed to reach server.', 'error');
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

      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <button
          onClick={() => navigate('/operator-dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-[#7A1B22] dark:hover:text-[#D4AF37] mb-4 transition-colors group cursor-pointer"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Garage Dashboard</span>
        </button>

        {/* Card Container */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#7A1B22] to-[#5A1419] p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-[#D4AF37] text-slate-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md">
                  Annual Renewal
                </span>
                <span className="text-white/70 text-xs font-medium">G-TRAMS Municipal Franchising</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight">Renew Tricycle Franchise</h1>
              <p className="text-xs text-white/80 mt-1 max-w-xl">
                Submit your updated Cedula (CTC) and valid documents to renew your franchise validity for another calendar year.
              </p>
            </div>
            <RefreshCw size={140} className="absolute -right-6 -bottom-8 text-white/10 rotate-12 pointer-events-none" />
          </div>

          {/* Franchise Summary Pill */}
          {franchise && (
            <div className="p-4 sm:p-6 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">
                Vehicle To Renew
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Plate Number</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white truncate block">{franchise.plateNo}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">TODA Association</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">{franchise.todaName || 'N/A'}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Zone Route</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">Zone {franchise.zone || 'N/A'}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Make / Year</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">{franchise.make} ({franchise.made})</span>
                </div>
              </div>
            </div>
          )}

          {/* Renewal Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            
            {/* Step 1: Updated Cedula Information */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-[#7A1B22]/10 dark:bg-[#D4AF37]/10 text-[#7A1B22] dark:text-[#D4AF37] flex items-center justify-center font-black text-xs">
                  1
                </div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Community Tax Certificate (Cedula)
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Provide your latest Community Tax Certificate (CTC) issued for this renewal year.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    New CTC / Cedula No. <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    name="ctcNo" 
                    value={formData.ctcNo}
                    onChange={handleChange} 
                    required 
                    className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#7A1B22] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-[#7A1B22]/15 transition-all" 
                    placeholder="e.g. 08123456"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Date Issued <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="date" 
                    name="dateIssued" 
                    value={formData.dateIssued}
                    onChange={handleChange} 
                    required 
                    className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#7A1B22] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-[#7A1B22]/15 transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Place Issued <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="placeIssued" 
                    value={formData.placeIssued}
                    onChange={handleChange} 
                    required 
                    className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#7A1B22] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-[#7A1B22]/15 transition-all" 
                    placeholder="Gasan, Marinduque"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Vehicle Document (Mobile-first Camera Upload) */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-[#7A1B22]/10 dark:bg-[#D4AF37]/10 text-[#7A1B22] dark:text-[#D4AF37] flex items-center justify-center font-black text-xs">
                  2
                </div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Updated Vehicle OR/CR Document
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Capture with your mobile camera or upload an updated Official Receipt & Certificate of Registration (OR/CR) from LTO.
              </p>

              <div className="max-w-md">
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
            <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 flex items-start gap-3">
              <ShieldCheck size={20} className="text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">Renewal Fee & Verification</h4>
                <p className="text-[11px] text-amber-800 dark:text-amber-400 mt-0.5 leading-relaxed">
                  Upon online submission, your renewal request is placed in review. Once approved, present your Claim Stub Voucher and official renewal fee of <strong>₱500.00</strong> at the Municipal Treasury / Franchising Office to receive your renewed sticker.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 gap-3">
              <button 
                type="button" 
                onClick={() => navigate('/operator-dashboard')} 
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white transition-all shadow-xs active:scale-95 cursor-pointer ${
                  isSubmitting ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed' : 'bg-[#7A1B22] hover:bg-[#5A1419]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Submitting Renewal...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Submit Renewal Application</span>
                  </>
                )}
              </button>
            </div>

          </form>
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
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
    </MainLayout>
  );
};

export default RenewFranchise;