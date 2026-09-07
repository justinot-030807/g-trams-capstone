import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout';
import { 
  UploadCloud, Check, CheckCircle, FileCheck, Info, RefreshCw, PlusCircle, 
  ArrowLeft, AlertCircle, Loader2, X, CalendarDays, ZoomIn, 
  ChevronRight, ChevronLeft, ShieldCheck, Car, FileText, RotateCcw,
  Save, XCircle, CheckCircle2, Clock, Sparkles
} from 'lucide-react';
import { GarageGridSkeleton } from '../../components/skeleton';
import DocumentUploadCard from '../../components/operator/DocumentUploadCard';

const GASAN_BARANGAYS = [
  "Antipolo", "Bachao Ibaba", "Bachao Ilaya", "Bacong-Bacong", "Bahi", 
  "Bangbang", "Banot", "Banuyo", "Bognuyan", "Cabugao", "Dawis", "Dili", 
  "Libtangin", "Mahunig", "Mangiliol", "Masiga", "Matandang Gasan", "Pangi", 
  "Pinggan", "Tabionan", "Tiguion", "Tremol", "Tulingon", 
  "Barangay I (Poblacion)", "Barangay II (Poblacion)", "Barangay III (Poblacion)"
];

const DRAFT_STORAGE_KEY = 'gtrams_apply_draft';

const CANCEL_REASONS = [
  "Nais baguhin ang detalye ng motor o tricycle",
  "Kulang pa sa mga dokumento / Ipagpapaliban muna",
  "May ibang kailangang asikasuhin / Personal na dahilan",
  "Duplicate o nagkamaling submission",
  "Iba pang dahilan (Pakilagay sa ibaba)"
];

const DEFAULT_REQUIREMENTS = [
  { id: 'orCrDocument', label: 'OR / CR ng Motor', fieldUrl: 'orCrUrl' },
  { id: 'license', label: "Driver's License", fieldUrl: 'licenseUrl' },
  { id: 'todaEndorsement', label: 'TODA Endorsement', fieldUrl: 'todaEndorsementUrl' },
  { id: 'brgyClearance', label: 'Barangay Clearance', fieldUrl: 'brgyClearanceUrl' }
];

const ApplyFranchise = () => {
  const [myFranchises, setMyFranchises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formMode, setFormMode] = useState(null); 
  const [selectedId, setSelectedId] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [hasDraftRestored, setHasDraftRestored] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // Cancellation modal state
  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    unit: null,
    reason: CANCEL_REASONS[0],
    customReason: '',
    isSubmitting: false
  });

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [fullPreview, setFullPreview] = useState(null);

  // Dynamic settings: max units and requirements list
  const [maxAllowedUnits, setMaxAllowedUnits] = useState(() => {
    return Number(localStorage.getItem('max_units_per_operator')) || 2;
  });

  const [requirementsList, setRequirementsList] = useState(() => {
    try {
      const saved = localStorage.getItem('required_docs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((doc, idx) => ({
            id: `doc_${idx}_${doc.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            label: doc,
            fieldUrl: `doc_${idx}Url`
          }));
        }
      }
    } catch {}
    return DEFAULT_REQUIREMENTS;
  });

  let loggedInUserName = localStorage.getItem('name') || '';
  let loggedInAddress = ''; 
  let loggedInToda = 'NON-TODA'; 

  const userObj = localStorage.getItem('user');
  if (userObj) {
    try {
      const parsedUser = JSON.parse(userObj);
      if (!loggedInUserName) loggedInUserName = parsedUser.name || '';
      if (parsedUser.address) loggedInAddress = parsedUser.address; 
      if (parsedUser.todaAssociation) loggedInToda = parsedUser.todaAssociation; 
    } catch (e) { console.error(e); }
  }
  
  const [formData, setFormData] = useState({
    fullName: loggedInUserName, 
    address: loggedInAddress, 
    zone: '', made: '', make: '', motorNo: '', chassisNo: '', plateNo: '', 
    todaName: loggedInToda,
    dateApplied: '', cedulaDate: '', cedulaAddress: 'Gasan, Marinduque', 
    cedulaSerialNo: ''
  });
  
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [filePreviews, setFilePreviews] = useState({});

  useEffect(() => {
    fetchMyFranchises();

    // Fetch system settings for unit limits and document requirements
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/settings`);
        if (res.ok) {
          const json = await res.json();
          if (json && json.data) {
            if (json.data.maxUnitsPerOperator !== undefined && json.data.maxUnitsPerOperator !== null) {
              const numUnits = Number(json.data.maxUnitsPerOperator) || 2;
              setMaxAllowedUnits(numUnits);
              localStorage.setItem('max_units_per_operator', numUnits);
            }
            if (Array.isArray(json.data.requiredDocs) && json.data.requiredDocs.length > 0) {
              const mapped = json.data.requiredDocs.map((doc, idx) => ({
                id: `doc_${idx}_${doc.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                label: doc,
                fieldUrl: `doc_${idx}Url`
              }));
              setRequirementsList(mapped);
              localStorage.setItem('required_docs', JSON.stringify(json.data.requiredDocs));
            }
          }
        }
      } catch (e) {
        console.error('Error fetching dynamic settings:', e);
      }
    };
    fetchSettings();

    const reapplyData = localStorage.getItem('reapply_target');
    if (reapplyData) {
      try {
        const parsed = JSON.parse(reapplyData);
        handleReapplyClick(parsed);
        localStorage.removeItem('reapply_target');
      } catch (e) { console.error(e); }
    }
  }, []);

  const getDraftKey = () => {
    if (formMode === 'Renewal' && selectedId) {
      return `gtrams_renewal_draft_${selectedId}`;
    }
    return DRAFT_STORAGE_KEY;
  };

  const calculateProgress = () => {
    if (formMode === 'Renewal') {
      const vehicleFields = 8;
      const cedulaFields = [
        formData.dateApplied,
        formData.cedulaDate,
        formData.cedulaAddress,
        formData.cedulaSerialNo
      ].filter(Boolean).length;
      const total = 12;
      const done = vehicleFields + cedulaFields;
      const pct = Math.round((done / total) * 100);
      return { percentage: Math.min(pct, 100), completed: done, total, remaining: total - done };
    }

    const step1Fields = [
      formData.fullName,
      formData.address,
      formData.zone,
      formData.made,
      formData.make,
      formData.motorNo,
      formData.chassisNo,
      formData.plateNo
    ].filter(Boolean).length;

    const step2Fields = [
      formData.dateApplied,
      formData.cedulaDate,
      formData.cedulaAddress,
      formData.cedulaSerialNo
    ].filter(Boolean).length;

    const step3Files = requirementsList.filter(req => uploadedDocs[req.id] || filePreviews[req.id]).length;

    const total = 8 + 4 + (requirementsList?.length || 4);
    const done = step1Fields + step2Fields + step3Files;
    const pct = Math.round((done / total) * 100);
    return { percentage: Math.min(pct, 100), completed: done, total, remaining: total - done };
  };

  const handleSaveProgress = (isManual = true) => {
    if (!formMode) return;
    const key = getDraftKey();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      localStorage.setItem(key, JSON.stringify({
        formData,
        currentStep,
        savedAt: now.toISOString(),
        timeFormatted: timeStr,
        formMode,
        selectedId
      }));

      setLastSavedTime(timeStr);
      setHasDraftRestored(true);
      if (isManual) {
        showToast(`✓ Na-save ang iyong progress! (${timeStr})`, "success");
      }
    } catch (e) {
      console.error('Error saving draft:', e);
    }
  };

  // Background auto-save while typing
  useEffect(() => {
    if (formMode === 'New' || formMode === 'Renewal') {
      const timer = setTimeout(() => {
        handleSaveProgress(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [formData, currentStep, formMode, selectedId]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  const fetchMyFranchises = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/franchises/my-franchises', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMyFranchises(data);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getExpirationDate = (dateApplied) => {
    if (!dateApplied) return 'N/A';
    const date = new Date(dateApplied);
    date.setFullYear(date.getFullYear() + 1); 
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleStartNewApplication = () => {
    setFormMode('New');
    setSelectedId(null);
    setFilePreviews({});
    
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        if (parsedDraft.formData) {
          setFormData({
            ...parsedDraft.formData,
            todaName: loggedInToda 
          });
          setCurrentStep(parsedDraft.currentStep || 1);
          setHasDraftRestored(true);
          setLastSavedTime(parsedDraft.timeFormatted || null);
          showToast("Na-restore ang iyong dating nai-save na draft.", "success");
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    setHasDraftRestored(false);
    setLastSavedTime(null);
    setCurrentStep(1);
    setFormData({ 
      fullName: loggedInUserName, 
      address: loggedInAddress, 
      zone: '', made: '', make: '', motorNo: '', chassisNo: '', plateNo: '', 
      todaName: loggedInToda, 
      dateApplied: '', cedulaDate: '', 
      cedulaAddress: 'Gasan, Marinduque', 
      cedulaSerialNo: '' 
    });
  };

  const handleClearDraft = () => {
    const key = getDraftKey();
    localStorage.removeItem(key);
    setHasDraftRestored(false);
    setLastSavedTime(null);
    setCurrentStep(1);
    if (formMode === 'New') {
      setFormData({ 
        fullName: loggedInUserName, 
        address: loggedInAddress, 
        zone: '', made: '', make: '', motorNo: '', chassisNo: '', plateNo: '', 
        todaName: loggedInToda, 
        dateApplied: '', cedulaDate: '', 
        cedulaAddress: 'Gasan, Marinduque', 
        cedulaSerialNo: '' 
      });
      setUploadedDocs({});
      setFilePreviews({});
    }
    showToast("Binura ang draft. Naka-reset na ang form.", "success");
  };

  const handleRenewClick = (franchise) => {
    setFormMode('Renewal');
    setSelectedId(franchise._id);
    setFilePreviews({});
    
    const renewDraftKey = `gtrams_renewal_draft_${franchise._id}`;
    const savedDraft = localStorage.getItem(renewDraftKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.formData) {
          setFormData(parsed.formData);
          setCurrentStep(parsed.currentStep || 1);
          setHasDraftRestored(true);
          setLastSavedTime(parsed.timeFormatted || null);
          showToast("Na-restore ang iyong dating nai-save na renewal draft.", "success");
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    setHasDraftRestored(false);
    setLastSavedTime(null);
    setCurrentStep(1);
    setFormData({
      fullName: franchise.fullName || '',
      address: franchise.address || '',
      zone: franchise.zone || '',
      made: franchise.made || '', 
      make: franchise.make || '',
      motorNo: franchise.motorNo || '',
      chassisNo: franchise.chassisNo || '',
      plateNo: franchise.plateNo || '',
      todaName: franchise.todaName || loggedInToda,
      dateApplied: '', cedulaDate: '', 
      cedulaAddress: franchise.cedulaAddress || 'Gasan, Marinduque', 
      cedulaSerialNo: franchise.cedulaSerialNo || ''
    });
  };

  const handleConfirmCancel = async () => {
    if (!cancelModal.unit) return;
    setCancelModal(prev => ({ ...prev, isSubmitting: true }));
    const finalReason = cancelModal.reason === 'Iba pang dahilan (Pakilagay sa ibaba)' 
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
        showToast("Matagumpay na nai-cancel ang aplikasyon.", "success");
        setCancelModal({ isOpen: false, unit: null, reason: CANCEL_REASONS[0], customReason: '', isSubmitting: false });
        fetchMyFranchises();
      } else {
        const d = await res.json();
        showToast(d.message || "Hindi nai-cancel ang aplikasyon.", "error");
        setCancelModal(prev => ({ ...prev, isSubmitting: false }));
      }
    } catch (err) {
      showToast("Network error. Hindi makakonekta sa server.", "error");
      setCancelModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleReapplyClick = (franchise) => {
    setFormMode('Re-apply');
    setSelectedId(franchise._id);
    setCurrentStep(1);
    
    setFormData({
      fullName: franchise.fullName || '',
      address: franchise.address || '',
      zone: franchise.zone || '',
      made: franchise.made || '',
      make: franchise.make || '',
      motorNo: franchise.motorNo || '',
      chassisNo: franchise.chassisNo || '',
      plateNo: franchise.plateNo || '',
      todaName: franchise.todaName || loggedInToda,
      dateApplied: franchise.dateApplied ? franchise.dateApplied.substring(0, 10) : '',
      cedulaDate: franchise.cedulaDate ? franchise.cedulaDate.substring(0, 10) : '',
      cedulaAddress: franchise.cedulaAddress || 'Gasan, Marinduque',
      cedulaSerialNo: franchise.cedulaSerialNo || ''
    });

    const previews = {};
    if (franchise.orCrUrl) previews.orCrDocument = franchise.orCrUrl;
    if (franchise.licenseUrl) previews.license = franchise.licenseUrl;
    if (franchise.todaEndorsementUrl) previews.todaEndorsement = franchise.todaEndorsementUrl;
    if (franchise.brgyClearanceUrl) previews.brgyClearance = franchise.brgyClearanceUrl;
    setFilePreviews(previews);
    setUploadedDocs({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let sanitized = value;
    if (name === 'made') {
      sanitized = value.replace(/\D/g, '').slice(0, 4);
    } else if (name === 'zone') {
      sanitized = value.replace(/\D/g, '');
    } else if (name === 'cedulaSerialNo') {
      sanitized = value.replace(/\D/g, '');
    } else if (name === 'motorNo' || name === 'chassisNo' || name === 'plateNo') {
      sanitized = value.toUpperCase();
    }
    setFormData(prev => ({ ...prev, [name]: sanitized }));
  };

  const handleFileChange = (reqId, file) => {
    if (file) {
      setUploadedDocs(prev => ({ ...prev, [reqId]: file }));
      setFilePreviews(prev => ({ ...prev, [reqId]: URL.createObjectURL(file) }));
    }
  };

  const handleRemoveFile = (reqId, e) => {
    if (e?.preventDefault) e.preventDefault();
    if (e?.stopPropagation) e.stopPropagation();
    
    setUploadedDocs(prev => {
      const copy = { ...prev };
      delete copy[reqId];
      return copy;
    });
    
    setFilePreviews(prev => {
      const copy = { ...prev };
      delete copy[reqId];
      return copy;
    });
  };

  const validateAndNext = () => {
    if (currentStep === 1) {
      if (!formData.fullName || !formData.address || !formData.zone || !formData.make || !formData.made || !formData.motorNo || !formData.chassisNo || !formData.plateNo) {
        showToast("Pakipunan ang lahat ng impormasyon bago magpatuloy.", "error");
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.dateApplied || !formData.cedulaDate || !formData.cedulaSerialNo || !formData.cedulaAddress) {
        showToast("Pakilagay ang kumpletong detalye ng Cedula.", "error");
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formMode === 'New') {
      const missing = requirementsList.filter(req => !uploadedDocs[req.id]);
      if (missing.length > 0) {
        showToast(`Pakisiguradong kumpleto ang ${requirementsList.length} na requirements na in-upload.`, "error");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let response;

      if (formMode === 'New' || formMode === 'Re-apply') {
        const submitData = new FormData();
        submitData.append('applicationType', 'New');
        if (formMode === 'Re-apply') submitData.append('status', 'Pending');

        Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
        
        requirementsList.forEach(req => {
          if (uploadedDocs[req.id]) {
            submitData.append(req.id, uploadedDocs[req.id]);
          }
        });

        const url = formMode === 'Re-apply' ? `${import.meta.env.VITE_API_URL}/api/v1/franchises/${selectedId}` : `${import.meta.env.VITE_API_URL}/api/v1/franchises`;
        response = await fetch(url, {
          method: formMode === 'Re-apply' ? 'PUT' : 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: submitData
        });
      } else if (formMode === 'Renewal') {
        response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/${selectedId}/renew`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            dateApplied: formData.dateApplied,
            cedulaDate: formData.cedulaDate,
            cedulaAddress: formData.cedulaAddress,
            cedulaSerialNo: formData.cedulaSerialNo
          })
        });
      }

      const data = await response.json();

      if (response.ok) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        if (selectedId) {
          localStorage.removeItem(`gtrams_renewal_draft_${selectedId}`);
        }
        showToast("Matagumpay na naisumite ang aplikasyon!", "success");
        setFormMode(null);
        setCurrentStep(1);
        fetchMyFranchises(); 
        setUploadedDocs({});
        setFilePreviews({});
      } else {
        showToast(data.message || data.error || 'Hindi naisumite ang aplikasyon.', 'error');
      }
    } catch (error) {
      showToast('Network error. Hindi makakonekta sa server.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#7A1B22] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-[#7A1B22]/15 transition-all";
  const disabledClasses = "w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed select-none";

  if (formMode === null) {
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

        <header className="mb-6 flex items-center gap-3">
          <div className="w-1 h-6 bg-[#7A1B22] rounded-full" />
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">My Franchises</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage your active tricycle units and pending applications.</p>
          </div>
        </header>

        {/* Draft Resume Alert Banner */}
        {localStorage.getItem(DRAFT_STORAGE_KEY) && myFranchises.length < maxAllowedUnits && (
          <div className="mb-6 max-w-5xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-700/60 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">May Hindi Natapos na Bagong Aplikasyon</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">May na-save kang draft ng aplikasyon. Maaari mo itong ipagpatuloy o i-reset.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(DRAFT_STORAGE_KEY);
                  showToast("Na-clear ang lumang draft.", "success");
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                I-clear
              </button>
              <button
                type="button"
                onClick={handleStartNewApplication}
                className="bg-[#7A1B22] hover:bg-[#5A1419] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
              >
                Ipagpatuloy <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="max-w-5xl">
            <GarageGridSkeleton count={2} baseDelay={50} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
            {myFranchises.map((unit, index) => {
              const hasRenewalDraft = localStorage.getItem(`gtrams_renewal_draft_${unit._id}`);

              return (
              <div 
                key={unit._id} 
                className="stagger-reveal bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div>
                  <div className="absolute top-0 right-0 w-2 h-full bg-[#7A1B22]" />
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Unit {index + 1}</h3>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">{unit.plateNo || 'PENDING PLATE'}</div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">{unit.todaName} &bull; {unit.make} ({unit.made})</p>
                </div>
                
                <div>
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 mt-2 gap-2 flex-wrap">
                    <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1.5 border shadow-xs ${
                      unit.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60' :
                      unit.status === 'Cancelled' ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/60' :
                      unit.status === 'Expired' ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/60' :
                      unit.status === 'Ready for Pickup' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60' :
                      'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                    }`}>
                      {(unit.status === 'Cancelled' || unit.status === 'Expired') && <AlertCircle size={13}/>}
                      {unit.status === 'Active' && <CheckCircle size={13}/>}
                      {unit.status === 'Ready for Pickup' ? 'Awaiting Payment' : unit.status}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      {unit.status === 'Expired' && (
                        <button 
                          onClick={() => handleRenewClick(unit)}
                          className="text-xs font-bold bg-[#7A1B22] text-white px-4 py-2 rounded-xl hover:bg-[#5A1419] transition-colors flex items-center gap-2 shadow-xs active:scale-95"
                        >
                          <RefreshCw size={14} /> {hasRenewalDraft ? 'Ipagpatuloy ang Renewal' : 'Renew Now'}
                        </button>
                      )}

                      {unit.status === 'Cancelled' && (
                        <button 
                          onClick={() => handleReapplyClick(unit)}
                          className="text-xs font-bold bg-slate-900 dark:bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-xs active:scale-95"
                        >
                          <RefreshCw size={14} /> Fix Issues
                        </button>
                      )}

                      {(unit.status === 'Pending' || unit.status === 'Ready for Pickup') && (
                        <button 
                          onClick={() => setCancelModal({
                            isOpen: true,
                            unit,
                            reason: CANCEL_REASONS[0],
                            customReason: '',
                            isSubmitting: false
                          })}
                          className="text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 border border-red-200 dark:border-red-900/60 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 active:scale-95"
                        >
                          <XCircle size={14} /> I-cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {unit.status === 'Active' && (
                    <div className="mt-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 p-3.5 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Validity</p>
                          <p className="text-xs font-black text-emerald-900 dark:text-emerald-300">1 Year</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Expires On</p>
                        <p className="text-xs font-black text-emerald-900 dark:text-emerald-300">{getExpirationDate(unit.dateApplied)}</p>
                      </div>
                    </div>
                  )}

                  {unit.status === 'Cancelled' && (
                    <div className="mt-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-4 rounded-2xl">
                      <h4 className="text-red-900 dark:text-red-300 font-black text-[10px] uppercase mb-1 flex items-center gap-1.5">
                        <AlertCircle size={14} className="text-red-600 dark:text-red-400" /> Reason for Rejection
                      </h4>
                      <p className="text-xs font-medium text-red-700 dark:text-red-300 leading-snug">
                        {unit.cancelReason || 'LGU did not provide a specific reason. Please visit the office.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              );
            })}

            {myFranchises.length < maxAllowedUnits ? (
              <button 
                onClick={handleStartNewApplication}
                className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-6 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[#7A1B22] dark:hover:text-[#D4AF37] hover:border-[#7A1B22]/50 dark:hover:border-[#D4AF37]/50 transition-all min-h-[200px] group active:scale-98"
              >
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:border-[#7A1B22]/30 dark:group-hover:border-[#D4AF37]/30 transition-all">
                  <PlusCircle size={30} className="text-[#7A1B22] dark:text-[#D4AF37]" />
                </div>
                <span className="font-black text-sm text-slate-800 dark:text-slate-200">Apply New Franchise</span>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">Capacity Available ({maxAllowedUnits - myFranchises.length} slot{maxAllowedUnits - myFranchises.length > 1 ? 's' : ''} left)</span>
              </button>
            ) : (
              <div className="bg-red-50/60 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-3xl p-6 flex flex-col items-center justify-center text-red-700 dark:text-red-300 min-h-[200px] text-center">
                <AlertCircle size={32} className="mb-2.5 opacity-60 text-red-600 dark:text-red-400" />
                <span className="font-black text-sm text-red-900 dark:text-red-200">Maximum Limit Reached</span>
                <span className="text-xs font-medium mt-1 px-4 text-red-600 dark:text-red-400 leading-snug">You have reached the maximum allowed limit of {maxAllowedUnits} registered tricycle units per operator.</span>
              </div>
            )}
          </div>
        )}
      </MainLayout>
    );
  }

  const steps = [
    { num: 1, title: 'Operator & Vehicle' },
    { num: 2, title: 'Cedula & Tax' },
    { num: 3, title: 'Requirements' }
  ];

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

      {/* Document preview modal */}
      {fullPreview && (
        <div className="fixed inset-0 z-[200] bg-slate-950/95 flex flex-col items-center justify-center p-4 sm:p-8 backdrop-blur-md animate-in fade-in">
          <button 
            onClick={() => setFullPreview(null)} 
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 text-white bg-red-500/80 hover:bg-red-500 p-2 sm:p-2.5 rounded-full shadow-lg transition-all"
          >
            <X size={20} />
          </button>
          
          <div className="w-full max-w-5xl mb-3 mt-8 sm:mt-0 text-center">
            <h3 className="text-white font-bold text-sm sm:text-lg flex items-center justify-center gap-2">
              <ShieldCheck size={20} className="text-[#D4AF37]" /> {fullPreview.title}
            </h3>
          </div>

          <div className="w-full max-w-5xl h-[75vh] flex items-center justify-center relative">
            {fullPreview.url.toLowerCase().includes('.pdf') ? (
              <iframe src={fullPreview.url} className="w-full h-full bg-white rounded-2xl shadow-2xl" title="PDF Preview" />
            ) : (
              <img src={fullPreview.url} alt="Preview" className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl bg-slate-800" />
            )}
          </div>
        </div>
      )}

      <header className="mb-6 max-w-3xl flex flex-col sm:flex-row justify-between sm:items-end gap-2">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-[#7A1B22] rounded-full" />
          <div>
            <button 
              onClick={() => { setFormMode(null); setCurrentStep(1); }} 
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-1"
            >
              <ArrowLeft size={15} /> Back to My Units
            </button>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formMode === 'New' ? 'New Franchise Application' : formMode === 'Renewal' ? 'Franchise Renewal' : 'Update Application'}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {formMode === 'Renewal' ? 'Pakisuri ang inyong mga detalye at i-update ang impormasyon ng Cedula.' : 'Punan ang mga kinakailangang impormasyon at mag-upload ng mga dokumento.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => handleSaveProgress(true)}
            className="flex items-center gap-1.5 text-[11px] font-bold text-[#7A1B22] dark:text-[#D4AF37] bg-red-50 dark:bg-amber-950/30 hover:bg-red-100 dark:hover:bg-amber-900/40 px-3 py-1.5 rounded-xl border border-red-200 dark:border-amber-800/60 transition-colors shadow-2xs active:scale-95"
            title="I-save ang inyong progress upang balikan mamaya"
          >
            <Save size={13} /> I-save ang Progress
          </button>

          {hasDraftRestored && (
            <button
              type="button"
              onClick={handleClearDraft}
              className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
              title="Burahin ang draft at mag-umpisa ulit"
            >
              <RotateCcw size={13} /> Reset Draft
            </button>
          )}
        </div>
      </header>

      {/* Dynamic Completion Progress Bar */}
      {(() => {
        const progress = calculateProgress();
        return (
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs max-w-3xl mb-5 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                  progress.percentage === 100 
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400' 
                    : 'bg-[#7A1B22]/10 dark:bg-[#D4AF37]/20 text-[#7A1B22] dark:text-[#D4AF37]'
                }`}>
                  {progress.percentage === 100 ? <CheckCircle2 size={18} /> : `${progress.percentage}%`}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      Progress ng Aplikasyon
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {progress.completed} sa {progress.total} detalye
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    {progress.remaining > 0 
                      ? (formMode === 'Renewal' ? `${progress.remaining} Cedula field pa ang kailangan` : `${progress.remaining} kulang na detalye / dokumento`)
                      : '✓ Kumpleto na ang lahat ng kinakailangan!'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 self-end sm:self-center">
                <Clock size={12} />
                <span>{lastSavedTime ? `Huling na-save: ${lastSavedTime}` : 'Awtomatikong nase-save'}</span>
              </div>
            </div>

            {/* Visual Progress Bar Track */}
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60 mb-4">
              <div 
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  progress.percentage === 100
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                    : 'bg-gradient-to-r from-[#7A1B22] to-[#D4AF37]'
                }`}
                style={{ width: `${progress.percentage}%` }}
              />
            </div>

            {/* Stepper Navigation */}
            <div className="relative flex items-center justify-between px-2 sm:px-8 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <div className="absolute left-[15%] right-[15%] sm:left-[20%] sm:right-[20%] top-[22px] sm:top-[24px] h-[2px] bg-slate-200 dark:bg-slate-700 z-0" />
              <div 
                className="absolute left-[15%] sm:left-[20%] top-[22px] sm:top-[24px] h-[2px] bg-[#7A1B22] dark:bg-[#D4AF37] transition-all duration-300 ease-out z-0"
                style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '35%' : '70%' }}
              />

              {steps.map((step) => {
                const isCompleted = currentStep > step.num;
                const isCurrent = currentStep === step.num;

                return (
                  <button
                    type="button"
                    key={step.num}
                    onClick={() => setCurrentStep(step.num)}
                    className="relative z-10 flex flex-col items-center w-24 sm:w-32 group cursor-pointer focus:outline-hidden"
                  >
                    <div 
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isCompleted 
                          ? 'bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-900 shadow-md group-hover:scale-105' 
                          : isCurrent 
                          ? 'bg-white dark:bg-slate-800 border-[3px] border-[#7A1B22] dark:border-[#D4AF37] ring-4 ring-[#7A1B22]/10 dark:ring-[#D4AF37]/20 scale-105' 
                          : 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 group-hover:border-slate-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Check size={14} className="stroke-[3]" />
                      ) : isCurrent ? (
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#7A1B22] dark:bg-[#D4AF37] rounded-full" />
                      ) : (
                        <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-600">{step.num}</span>
                      )}
                    </div>
                    
                    <span className={`text-[10px] sm:text-xs font-bold mt-2 text-center tracking-tight transition-colors ${
                      isCurrent ? 'text-[#7A1B22] dark:text-[#D4AF37] font-black' : isCompleted ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'
                    }`}>
                      {step.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
        
        {currentStep === 1 && (
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-2xl sm:rounded-3xl shadow-xs border border-slate-200/90 dark:border-slate-800 animate-in fade-in duration-150 transition-colors">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Car className="text-[#7A1B22] dark:text-[#D4AF37]" size={18} />
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">Impormasyon ng Operator at Motor</h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Ipasok ang tamang mga detalye ng sasakyan</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Pangalan ng Operator</label>
                <input 
                  type="text" 
                  name="fullName" 
                  value={formData.fullName} 
                  onChange={handleInputChange} 
                  className={formMode === 'Renewal' || formMode === 'Re-apply' ? disabledClasses : inputClasses} 
                  required 
                  readOnly={formMode === 'Renewal' || formMode === 'Re-apply'} 
                  placeholder="Hal. Juan Dela Cruz"
                />
              </div>
              
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Barangay</label>
                {formMode === 'Renewal' || formMode === 'Re-apply' ? (
                  <input type="text" name="address" value={formData.address} className={disabledClasses} readOnly />
                ) : (
                  <select name="address" value={formData.address} onChange={handleInputChange} className={inputClasses} required>
                    <option value="">Pumili ng Barangay...</option>
                    {GASAN_BARANGAYS.map((brgy, i) => (
                      <option key={i} value={brgy}>{brgy}, Gasan</option>
                    ))}
                  </select>
                )}
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Route Zone</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  name="zone" 
                  value={formData.zone} 
                  onChange={handleInputChange} 
                  className={formMode === 'Renewal' || formMode === 'Re-apply' ? disabledClasses : inputClasses} 
                  required 
                  readOnly={formMode === 'Renewal' || formMode === 'Re-apply'} 
                  placeholder="Hal. 1 o 2" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Year Made</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  name="made" 
                  value={formData.made} 
                  onChange={handleInputChange} 
                  className={formMode === 'Renewal' || formMode === 'Re-apply' ? disabledClasses : inputClasses} 
                  required 
                  readOnly={formMode === 'Renewal' || formMode === 'Re-apply'} 
                  placeholder="Hal. 2024" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Make / Brand</label>
                <input type="text" name="make" value={formData.make} onChange={handleInputChange} className={formMode === 'Renewal' || formMode === 'Re-apply' ? disabledClasses : inputClasses} required readOnly={formMode === 'Renewal' || formMode === 'Re-apply'} placeholder="Hal. Honda / Kawasaki" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">TODA Association</label>
                  <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">Registered</span>
                </div>
                <input 
                  type="text" 
                  name="todaName" 
                  value={formData.todaName || loggedInToda || 'NON-TODA'} 
                  readOnly 
                  className={disabledClasses} 
                  title="Ang inyong TODA ay awtomatikong nakabase sa inyong registered account."
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Motor Number</label>
                <input type="text" name="motorNo" value={formData.motorNo} onChange={handleInputChange} className={formMode === 'Renewal' || formMode === 'Re-apply' ? disabledClasses : inputClasses} required readOnly={formMode === 'Renewal' || formMode === 'Re-apply'} placeholder="Motor Serial No." />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Chassis Number</label>
                <input type="text" name="chassisNo" value={formData.chassisNo} onChange={handleInputChange} className={formMode === 'Renewal' || formMode === 'Re-apply' ? disabledClasses : inputClasses} required readOnly={formMode === 'Renewal' || formMode === 'Re-apply'} placeholder="Chassis Serial No." />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Plate Number</label>
                <input type="text" name="plateNo" value={formData.plateNo} onChange={handleInputChange} className={formMode === 'Renewal' || formMode === 'Re-apply' ? disabledClasses : inputClasses} required readOnly={formMode === 'Renewal' || formMode === 'Re-apply'} placeholder="Hal. 123-ABC" />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-between items-center mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 gap-2.5">
              <button
                type="button"
                onClick={() => handleSaveProgress(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 active:scale-95"
              >
                <Save size={14} /> I-save ang Progress
              </button>

              <button 
                type="button" 
                onClick={validateAndNext}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-[#7A1B22] text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-[#5A1419] transition-all shadow-xs active:scale-95"
              >
                Susunod <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-2xl sm:rounded-3xl shadow-xs border border-slate-200/90 dark:border-slate-800 animate-in fade-in duration-150 transition-colors">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <FileText className="text-[#7A1B22] dark:text-[#D4AF37]" size={18} />
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">Impormasyon ng Cedula</h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Ilagay ang pinakabagong Community Tax Certificate</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Petsa ng Pag-apply</label>
                <input type="date" name="dateApplied" value={formData.dateApplied} onChange={handleInputChange} className={inputClasses} required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Petsa Kinuha (Cedula)</label>
                <input type="date" name="cedulaDate" value={formData.cedulaDate} onChange={handleInputChange} className={inputClasses} required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Cedula Serial No.</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  name="cedulaSerialNo" 
                  value={formData.cedulaSerialNo} 
                  onChange={handleInputChange} 
                  className={inputClasses} 
                  placeholder="Hal. 12345678" 
                  required 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Lugar Kinuha (Cedula)</label>
                <input type="text" name="cedulaAddress" value={formData.cedulaAddress} onChange={handleInputChange} className={inputClasses} required />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 gap-2.5">
              <button 
                type="button" 
                onClick={prevStep}
                className="w-full sm:w-auto flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft size={15} /> Bumalik
              </button>

              <div className="w-full sm:w-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveProgress(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 active:scale-95"
                >
                  <Save size={14} /> I-save ang Progress
                </button>

                <button 
                  type="button" 
                  onClick={validateAndNext}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#7A1B22] text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-[#5A1419] transition-all shadow-xs active:scale-95"
                >
                  Susunod <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-2xl sm:rounded-3xl shadow-xs border border-slate-200/90 dark:border-slate-800 animate-in fade-in duration-150 transition-colors">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <UploadCloud className="text-[#7A1B22] dark:text-[#D4AF37]" size={18} />
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">Upload ng mga Dokumento</h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">I-upload ang mga larawan o PDF ng requirements</p>
              </div>
            </div>

            {formMode === 'Renewal' ? (
              <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 rounded-2xl text-xs font-semibold mb-5 flex items-start gap-2.5">
                <Info size={17} className="shrink-0 mt-0.5" />
                <p className="leading-relaxed">Hindi na kailangang mag-upload ng mga bagong file para sa renewal. Pakisuri ang buod sa ibaba bago i-submit.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {requirementsList.map((req) => (
                  <DocumentUploadCard
                    key={req.id}
                    id={req.id}
                    label={req.label}
                    file={uploadedDocs[req.id]}
                    previewUrl={filePreviews[req.id]}
                    onFileSelect={handleFileChange}
                    onFileRemove={handleRemoveFile}
                    onPreviewZoom={setFullPreview}
                    required={formMode === 'New'}
                  />
                ))}
              </div>
            )}

            <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 mb-6">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">Buod ng Aplikasyon</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div><span className="text-slate-400 dark:text-slate-500 font-bold block text-[9px]">Operator</span><span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{formData.fullName}</span></div>
                <div><span className="text-slate-400 dark:text-slate-500 font-bold block text-[9px]">Plate No.</span><span className="font-black text-slate-900 dark:text-white truncate block">{formData.plateNo}</span></div>
                <div><span className="text-slate-400 dark:text-slate-500 font-bold block text-[9px]">TODA</span><span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{formData.todaName || loggedInToda}</span></div>
                <div><span className="text-slate-400 dark:text-slate-500 font-bold block text-[9px]">Zone</span><span className="font-bold text-slate-800 dark:text-slate-200 truncate block">Zone {formData.zone}</span></div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-4 gap-2.5">
              <button 
                type="button" 
                onClick={prevStep}
                className="w-full sm:w-auto flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft size={15} /> Bumalik
              </button>

              <div className="w-full sm:w-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveProgress(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 active:scale-95"
                >
                  <Save size={14} /> I-save ang Progress
                </button>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl font-bold text-xs text-white transition-all shadow-xs active:scale-95 ${
                    isSubmitting ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed' : 'bg-[#7A1B22] hover:bg-[#5A1419]'
                  }`}
                >
                  {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                  {isSubmitting ? 'Isinusumite...' : formMode === 'Re-apply' ? 'Isumite ang Update' : `Isumite ang Aplikasyon`}
                </button>
              </div>
            </div>
          </div>
        )}

      </form>

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
                  <h3 className="font-black text-base text-slate-900 dark:text-white">I-cancel ang Aplikasyon</h3>
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
                  Paalala: Kapag kinansela ang aplikasyong ito, babaguhin ang status nito bilang <b>Cancelled</b> at makikita ng LGU Admin ang dahilan sa audit records.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Pumili ng Dahilan sa Pag-cancel:
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
                        name="cancel_reason"
                        checked={cancelModal.reason === r}
                        onChange={() => setCancelModal(prev => ({ ...prev, reason: r }))}
                        className="mt-0.5 text-red-600 focus:ring-red-500"
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              {cancelModal.reason === "Iba pang dahilan (Pakilagay sa ibaba)" && (
                <div className="animate-in fade-in duration-150">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Iba pang Detalye ng Dahilan:
                  </label>
                  <textarea
                    rows={3}
                    value={cancelModal.customReason}
                    onChange={(e) => setCancelModal(prev => ({ ...prev, customReason: e.target.value }))}
                    placeholder="Ilagay ang dahilan kung bakit nais i-cancel..."
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
                Bumalik
              </button>
              <button
                type="button"
                disabled={cancelModal.isSubmitting || (cancelModal.reason === "Iba pang dahilan (Pakilagay sa ibaba)" && !cancelModal.customReason?.trim())}
                onClick={handleConfirmCancel}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelModal.isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                {cancelModal.isSubmitting ? 'Kinakansela...' : 'Kumpirmahin ang Pag-cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default ApplyFranchise;