import localforage from 'localforage';
import React, { useState, useEffect, useRef } from 'react';
import { GASAN_BARANGAYS, TODA_LIST, CANCEL_REASONS } from '../../utils/constants';
import MainLayout from '../../components/MainLayout';
import { 
  UploadCloud, Check, CheckCircle, FileCheck, Info, RefreshCw, PlusCircle, 
  ArrowLeft, AlertCircle, Loader2, X, CalendarDays, ZoomIn, 
  ChevronRight, ChevronLeft, ShieldCheck, Car, FileText, RotateCcw,
  Save, XCircle, CheckCircle2, Clock, Sparkles, User, Eye, Receipt
} from 'lucide-react';
import { GarageGridSkeleton } from '../../components/skeleton';
import DocumentUploadCard from '../../components/operator/DocumentUploadCard';
import FeedbackModal from '../../components/common/FeedbackModal';
import TodaZoneGuideModal from '../../components/operator/TodaZoneGuideModal';
import CancelApplicationModal from '../../components/operator/CancelApplicationModal';
import DocumentPreviewModal from '../../components/operator/DocumentPreviewModal';
import ApplicationSummaryModal from '../../components/operator/ApplicationSummaryModal';



const DRAFT_STORAGE_KEY = 'gtrams_apply_draft';



const STANDARD_DOC_IDS = ['orCrDocument', 'license', 'todaEndorsement', 'brgyClearance'];

const DEFAULT_REQUIREMENTS = [
  { id: 'orCrDocument', label: 'Tricycle OR / CR Document', fieldUrl: 'orCrUrl' },
  { id: 'license', label: "Driver's License", fieldUrl: 'licenseUrl' },
  { id: 'todaEndorsement', label: 'TODA Endorsement Certificate', fieldUrl: 'todaEndorsementUrl' },
  { id: 'brgyClearance', label: 'Barangay Clearance', fieldUrl: 'brgyClearanceUrl' }
];

const POPULAR_MAKES = [
  'Honda TMX 125',
  'Kawasaki Barako II',
  'Bajaj CT 150',
  'Yamaha YTX 125'
];

import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const ApplyFranchise = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();

  const modeParam = searchParams.get('mode');
  const stepParam = parseInt(searchParams.get('step') || '1', 10);
  const initialStep = (stepParam >= 1 && stepParam <= 4) ? stepParam : 1;

  const [myFranchises, setMyFranchises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formMode, setFormMode] = useState(() => {
    if (modeParam === 'reapply') return 'Re-apply';
    if (modeParam === 'renewal') return 'Renewal';
    return 'New';
  }); 
  const [selectedId, setSelectedId] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadPhase, setUploadPhase] = useState('');
  
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [slideDirection, setSlideDirection] = useState('forward');
  const [showChecklist, setShowChecklist] = useState(false);
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

  // Centered Feedback Modal state
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    confirmText: 'OK',
    onConfirm: null
  });

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [fullPreview, setFullPreview] = useState(null);
  const [showTodaGuide, setShowTodaGuide] = useState(false);

  // Real-time uniqueness checker state
  const [duplicateStatus, setDuplicateStatus] = useState({
    plateNo: { checking: false, duplicate: false, message: '' },
    motorNo: { checking: false, duplicate: false, message: '' },
    chassisNo: { checking: false, duplicate: false, message: '' }
  });
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

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
            id: STANDARD_DOC_IDS[idx] || `doc_${idx}`,
            label: doc,
            fieldUrl: STANDARD_DOC_IDS[idx] ? `${STANDARD_DOC_IDS[idx]}Url` : `doc_${idx}Url`
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
    dateApplied: new Date().toISOString().split('T')[0], 
    cedulaDate: '', cedulaAddress: 'Gasan, Marinduque', 
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
                id: STANDARD_DOC_IDS[idx] || `doc_${idx}`,
                label: doc,
                fieldUrl: STANDARD_DOC_IDS[idx] ? `${STANDARD_DOC_IDS[idx]}Url` : `doc_${idx}Url`
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
    } else {
      handleStartNewApplication();
    }
  }, []);

  // Sync step and formMode from searchParams (handles browser / gesture back & forward)
  useEffect(() => {
    const s = parseInt(searchParams.get('step') || '1', 10);
    const validS = (s >= 1 && s <= 4) ? s : 1;
    if (validS !== currentStep) {
      setSlideDirection(validS < currentStep ? 'backward' : 'forward');
      if (!document.startViewTransition) {
        setCurrentStep(validS);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        document.startViewTransition(() => {
          setCurrentStep(validS);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    }
    const m = searchParams.get('mode');
    if (m === 'reapply' && formMode !== 'Re-apply') {
      setFormMode('Re-apply');
    } else if (m === 'renewal' && formMode !== 'Renewal') {
      setFormMode('Renewal');
    } else if (m === 'new' && formMode !== 'New') {
      setFormMode('New');
    }
  }, [searchParams]);

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
      formData.address
    ].filter(Boolean).length;

    const step2Fields = [
      formData.zone,
      formData.made,
      formData.make,
      formData.motorNo,
      formData.chassisNo,
      formData.plateNo
    ].filter(Boolean).length;

    const step3Fields = [
      formData.dateApplied,
      formData.cedulaDate,
      formData.cedulaAddress,
      formData.cedulaSerialNo
    ].filter(Boolean).length;

    const step4Files = requirementsList.filter(req => uploadedDocs[req.id] || filePreviews[req.id]).length;

    const total = 2 + 6 + 4 + (requirementsList?.length || 4);
    const done = step1Fields + step2Fields + step3Fields + step4Files;
    const pct = Math.round((done / total) * 100);
    return { percentage: Math.min(pct, 100), completed: done, total, remaining: total - done };
  };

  const handleSaveProgress = (isManual = true) => {
    if (!formMode) return;
    const key = getDraftKey();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      localforage.setItem(key, {
        formData,
        currentStep,
        savedAt: now.toISOString(),
        timeFormatted: timeStr,
        formMode,
        selectedId
      }).catch(err => console.error('LocalForage save error:', err));

      setLastSavedTime(timeStr);
      setHasDraftRestored(true);
      if (isManual) {
        setFeedbackModal({
          isOpen: true,
          type: 'success',
          title: 'Progress Saved',
          message: `Your application draft has been saved (${timeStr}). You can safely return and continue anytime.`,
          confirmText: 'OK',
          onConfirm: () => setFeedbackModal(prev => ({ ...prev, isOpen: false }))
        });
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

  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      Object.values(filePreviews).forEach(url => {
        if (url && typeof url === 'string' && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

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

  const handleStartNewApplication = async () => {
    setFormMode('New');
    setSelectedId(null);
    setFilePreviews({});
    
    try {
      const savedDraft = await localforage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft && savedDraft.formData) {
        setFormData({
          ...savedDraft.formData,
          dateApplied: savedDraft.formData.dateApplied || new Date().toISOString().split('T')[0],
          todaName: loggedInToda 
        });
        const urlStep = parseInt(searchParams.get('step') || '0', 10);
        const targetStep = (urlStep >= 1 && urlStep <= 4) ? urlStep : (savedDraft.currentStep || 1);
        setCurrentStep(targetStep);
        setHasDraftRestored(true);
        setLastSavedTime(savedDraft.timeFormatted || null);
        showToast("Your saved draft has been restored.", "success");
        return;
      }
    } catch (e) {
      console.error('Error loading draft from IndexedDB', e);
    }

    setHasDraftRestored(false);
    setLastSavedTime(null);
    // Smart Defaults (Tesler's Law): Auto-fill recent CTC/Cedula if available
    let smartCedulaDate = '';
    let smartCedulaAddress = 'Gasan, Marinduque';
    let smartCedulaSerialNo = '';

    if (myFranchises && myFranchises.length > 0) {
      // Find the most recent franchise
      const recent = [...myFranchises].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      if (recent) {
        smartCedulaDate = recent.cedulaDate ? recent.cedulaDate.substring(0, 10) : '';
        smartCedulaAddress = recent.cedulaAddress || 'Gasan, Marinduque';
        smartCedulaSerialNo = recent.cedulaSerialNo || '';
      }
    }

    setFormData({ 
      fullName: loggedInUserName, 
      address: loggedInAddress, 
      zone: '', made: '', make: '', motorNo: '', chassisNo: '', plateNo: '', 
      todaName: loggedInToda, 
      dateApplied: new Date().toISOString().split('T')[0], 
      cedulaDate: smartCedulaDate, 
      cedulaAddress: smartCedulaAddress, 
      cedulaSerialNo: smartCedulaSerialNo 
    });
  };

  const handleClearDraft = async () => {
    const key = getDraftKey();
    try {
      await localforage.removeItem(key);
    } catch(e) { console.error('Error removing draft', e); }
    setHasDraftRestored(false);
    setLastSavedTime(null);
    setCurrentStep(1);
    
    if (formMode === 'New') {
      let smartCedulaDate = '';
      let smartCedulaAddress = 'Gasan, Marinduque';
      let smartCedulaSerialNo = '';

      if (myFranchises && myFranchises.length > 0) {
        const recent = [...myFranchises].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        if (recent) {
          smartCedulaDate = recent.cedulaDate ? recent.cedulaDate.substring(0, 10) : '';
          smartCedulaAddress = recent.cedulaAddress || 'Gasan, Marinduque';
          smartCedulaSerialNo = recent.cedulaSerialNo || '';
        }
      }

      setFormData({ 
        fullName: loggedInUserName, 
        address: loggedInAddress, 
        zone: '', made: '', make: '', motorNo: '', chassisNo: '', plateNo: '', 
        todaName: loggedInToda, 
        dateApplied: new Date().toISOString().split('T')[0], 
        cedulaDate: smartCedulaDate, 
        cedulaAddress: smartCedulaAddress, 
        cedulaSerialNo: smartCedulaSerialNo 
      });
      setUploadedDocs({});
      setFilePreviews({});
    }
    setFeedbackModal({
      isOpen: true,
      type: 'info',
      title: 'Draft Cleared',
      message: 'Your application draft has been cleared and the form has been reset.',
      confirmText: 'OK',
      onConfirm: () => setFeedbackModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const handleBackToDashboard = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/operator-dashboard');
    }
  };

  const handleTopBack = () => {
    if (currentStep > 1) {
      prevStep();
    } else {
      handleBackToDashboard();
    }
  };

  const handleRenewClick = (franchise) => {
    navigate('/renew-franchise/' + franchise._id);
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
        showToast("Application successfully cancelled.", "success");
        setCancelModal({ isOpen: false, unit: null, reason: CANCEL_REASONS[0], customReason: '', isSubmitting: false });
        fetchMyFranchises();
      } else {
        const d = await res.json();
        showToast(d.message || "Unable to cancel application.", "error");
        setCancelModal(prev => ({ ...prev, isSubmitting: false }));
      }
    } catch (err) {
      showToast("Network error. Cannot connect to server.", "error");
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
      sanitized = value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 16).toUpperCase();
    } else if (name === 'motorNo' || name === 'chassisNo' || name === 'plateNo') {
      sanitized = value.toUpperCase();
    }
    setFormData(prev => ({ ...prev, [name]: sanitized }));
  };

  const handleFileChange = (reqId, file) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast(language === 'fil' ? 'Masyadong malaki ang dokumento. Hanggang 5MB lamang ang pinapayagan.' : 'File is too large. Maximum size is 5MB.', 'error');
        return;
      }
      setFilePreviews(prev => {
        if (prev[reqId]) URL.revokeObjectURL(prev[reqId]);
        return { ...prev, [reqId]: URL.createObjectURL(file) };
      });
      setUploadedDocs(prev => ({ ...prev, [reqId]: file }));
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
      if (prev[reqId]) URL.revokeObjectURL(prev[reqId]);
      const copy = { ...prev };
      delete copy[reqId];
      return copy;
    });
  };

  // Real-time debounced checker for plateNo, motorNo, chassisNo uniqueness
  useEffect(() => {
    if (formMode !== 'New' && formMode !== 'Re-apply') return;

    const fieldsToCheck = [
      { name: 'plateNo', value: formData.plateNo, label: 'Plate Number' },
      { name: 'motorNo', value: formData.motorNo, label: 'Motor Number' },
      { name: 'chassisNo', value: formData.chassisNo, label: 'Chassis Number' }
    ];

    const timers = fieldsToCheck.map(({ name, value, label }) => {
      const trimmed = (value || '').trim();
      if (!trimmed || trimmed.length < 3) {
        setDuplicateStatus(prev => ({
          ...prev,
          [name]: { checking: false, duplicate: false, message: '' }
        }));
        return null;
      }

      setDuplicateStatus(prev => ({
        ...prev,
        [name]: { ...prev[name], checking: true }
      }));

      return setTimeout(async () => {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/v1/franchises/check-unique?field=${name}&value=${encodeURIComponent(trimmed)}&currentFranchiseId=${selectedId || ''}`,
            {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            }
          );
          if (res.ok) {
            const data = await res.json();
            if (data.exists) {
              setDuplicateStatus(prev => ({
                ...prev,
                [name]: {
                  checking: false,
                  duplicate: true,
                  message: `⚠️ This ${label} is already registered in the system.`
                }
              }));
            } else {
              setDuplicateStatus(prev => ({
                ...prev,
                [name]: {
                  checking: false,
                  duplicate: false,
                  message: 'Available'
                }
              }));
            }
          } else {
            setDuplicateStatus(prev => ({
              ...prev,
              [name]: { checking: false, duplicate: false, message: '' }
            }));
          }
        } catch {
          setDuplicateStatus(prev => ({
            ...prev,
            [name]: { checking: false, duplicate: false, message: '' }
          }));
        }
      }, 400);
    });

    return () => {
      timers.forEach(t => t && clearTimeout(t));
    };
  }, [formData.plateNo, formData.motorNo, formData.chassisNo, formMode, selectedId]);

  const validateAndNext = () => {
    if (currentStep === 1) {
      if (!formData.fullName || !formData.address) {
        showToast("Please fill out all required operator details.", "error");
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.zone || !formData.make || !formData.made || !formData.motorNo || !formData.chassisNo || !formData.plateNo) {
        showToast("Please fill out all required vehicle details.", "error");
        return;
      }
      if (duplicateStatus.plateNo?.duplicate || duplicateStatus.motorNo?.duplicate || duplicateStatus.chassisNo?.duplicate) {
        showToast("Please resolve duplicate vehicle numbers before continuing.", "error");
        return;
      }
    } else if (currentStep === 3) {
      const today = new Date().toISOString().split('T')[0];
      if (!formData.dateApplied) {
        setFormData(prev => ({ ...prev, dateApplied: today }));
      }
      if (!formData.cedulaSerialNo || !formData.cedulaSerialNo.trim()) {
        showToast(language === 'fil' ? 'Pakilagay ang CTC / Cedula Serial No.' : 'Please enter your CTC / Cedula Serial No.', 'error');
        return;
      }
      if (!formData.cedulaDate) {
        showToast(language === 'fil' ? 'Piliin ang Araw ng Pagkuha ng Cedula (Date Issued).' : 'Please select the Date Issued of your Cedula.', 'error');
        return;
      }
      if (!formData.cedulaAddress || !formData.cedulaAddress.trim()) {
        showToast(language === 'fil' ? 'Pakilagay ang Lugar ng Pagkuha ng Cedula (Place Issued).' : 'Please enter the Place Issued of your Cedula.', 'error');
        return;
      }
    }
    const nextStep = currentStep + 1;
    setSlideDirection('forward');
    if (!document.startViewTransition) {
      setCurrentStep(nextStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      document.startViewTransition(() => {
        setCurrentStep(nextStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
    const currentMode = (formMode || 'New').toLowerCase();
    const newParams = new URLSearchParams(searchParams);
    newParams.set('mode', currentMode);
    newParams.set('step', String(nextStep));
    navigate(`?${newParams.toString()}`);
  };

  const prevStep = () => {
    setSlideDirection('backward');
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      const prev = Math.max(currentStep - 1, 1);
      if (!document.startViewTransition) {
        setCurrentStep(prev);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        document.startViewTransition(() => {
          setCurrentStep(prev);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
      const currentMode = (formMode || 'New').toLowerCase();
      const newParams = new URLSearchParams(searchParams);
      newParams.set('mode', currentMode);
      newParams.set('step', String(prev));
      navigate(`?${newParams.toString()}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    if (formMode === 'New') {
      const missing = requirementsList.filter(req => !uploadedDocs[req.id]);
      if (missing.length > 0) {
        showToast(`Please ensure all ${requirementsList.length} required documents are uploaded.`, "error");
        return;
      }
    }

    setIsSubmitting(true);
    setUploadPhase('Preparing application & files...');
    const slowNetTimer = setTimeout(() => {
      showToast("Network seems slow. Please wait while uploading...", "warning");
    }, 7000);

    try {
      let response;

      if (formMode === 'New' || formMode === 'Re-apply') {
        const submitData = new FormData();
        submitData.append('applicationType', 'New');
        if (formMode === 'Re-apply') submitData.append('status', 'Pending');

        Object.keys(formData).forEach(key => {
          if (formData[key] !== undefined && formData[key] !== null) {
            submitData.append(key, formData[key]);
          }
        });
        
        // Ensure dates are not empty
        if (!formData.dateApplied) {
          submitData.append('dateApplied', new Date().toISOString().substring(0, 10));
        }
        if (!formData.cedulaDate) {
          submitData.append('cedulaDate', new Date().toISOString().substring(0, 10));
        }
        
        const docCount = Object.keys(uploadedDocs).length;
        setUploadPhase(`Uploading ${docCount || 7} requirements to secure cloud...`);

        requirementsList.forEach((req, idx) => {
          const file = uploadedDocs[req.id];
          if (file) {
            submitData.append(req.id, file);
            if (STANDARD_DOC_IDS[idx] && STANDARD_DOC_IDS[idx] !== req.id) {
              submitData.append(STANDARD_DOC_IDS[idx], file);
            }
          }
        });

        const url = formMode === 'Re-apply' ? `${import.meta.env.VITE_API_URL}/api/v1/franchises/${selectedId}` : `${import.meta.env.VITE_API_URL}/api/v1/franchises`;
        response = await fetch(url, {
          method: formMode === 'Re-apply' ? 'PUT' : 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: submitData
        });
      }

      setUploadPhase('Registering franchise record...');
      const data = await response.json();

      if (response.ok) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        if (selectedId) {
          localStorage.removeItem(`gtrams_renewal_draft_${selectedId}`);
        }
        setFeedbackModal({
          isOpen: true,
          type: 'success',
          title: formMode === 'Re-apply' ? 'Revision Submitted!' : formMode === 'Renewal' ? 'Renewal Submitted!' : 'Application Submitted!',
          message: 'Your application has been received by the Office of the Vice Mayor Extension office for evaluation. You can track the status directly on your dashboard.',
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
          message: data.message || data.error || 'Failed to submit application. Please check your inputs and requirements.',
          confirmText: 'OK',
          onConfirm: () => setFeedbackModal(prev => ({ ...prev, isOpen: false }))
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      showToast(error.message ? `Submission error: ${error.message}` : 'Network error. Cannot connect to server.', 'error');
    } finally {
      clearTimeout(slowNetTimer);
      setIsSubmitting(false);
      setUploadPhase('');
    }
  };

  const inputClasses = "w-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-2 focus:ring-[#9E2A2B] focus:ring-offset-2 transition-all shadow-xs min-h-[46px]";
  const disabledClasses = "w-full bg-slate-100 dark:bg-slate-800/60 border-2 border-slate-300/80 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 outline-none cursor-not-allowed select-none min-h-[46px]";

  if (!isLoading && myFranchises.length >= maxAllowedUnits && formMode === 'New') {
    return (
      <MainLayout hideNav={true}>
        {/* Minimalist Floating Toast Notification */}
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

        <div className="w-full min-h-screen bg-slate-100/60 dark:bg-[#080b11] flex flex-col items-center justify-center p-4 sm:p-6 transition-colors">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">
              Maximum Fleet Capacity Reached
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              You have already registered the maximum allowed limit of {maxAllowedUnits} tricycle units for your operator account in Gasan, Marinduque.
            </p>
            <button
              type="button"
              onClick={handleBackToDashboard}
              className="w-full inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#9E2A2B] hover:bg-[#7A1B22] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] text-white dark:text-slate-950 font-bold text-xs sm:text-sm shadow-sm cursor-pointer active:scale-95 min-h-[44px]"
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const steps = [
    { num: 1, title: 'Operator Info' },
    { num: 2, title: 'Vehicle Details' },
    { num: 3, title: 'Cedula & Tax' },
    { num: 4, title: 'Requirements' }
  ];

  return (
    <MainLayout hideNav={true}>
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

      {/* Full-Screen Immersive Form Layout (Zero Navbars) */}
      <div className="w-full min-h-screen bg-slate-100/60 dark:bg-[#080b11] flex flex-col transition-colors">
        {/* Top Hero Banner */}
        <div className="w-full bg-gradient-to-br from-[#541116] via-[#9E2A2B] to-[#3f0b0f] dark:from-[#0a0d16] dark:via-[#190c12] dark:to-[#07090f] text-white pt-4 pb-7 px-4 sm:px-6 relative overflow-hidden shadow-md">
          {/* Official Gasan Seal Watermark in Full Color */}
          <div className="absolute -right-6 -bottom-8 pointer-events-none select-none">
            <img 
              src="/gasan-logo.png" 
              alt="Seal of Gasan" 
              className="w-52 h-52 sm:w-60 sm:h-60 object-contain opacity-25 dark:opacity-30 drop-shadow-md" 
            />
          </div>
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-96 h-28 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl mx-auto relative z-10">
            {/* Top Navigation Row */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={handleTopBack}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white backdrop-blur-md text-xs font-bold transition-all border border-white/15 shadow-xs cursor-pointer"
                title="Back"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
            </div>

            {/* Form Title in Banner */}
            <div className="text-center pt-1 pb-4 flex flex-col items-center">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase drop-shadow-sm">
                {formMode === 'New' ? 'New Franchise Application' : formMode === 'Renewal' ? 'Franchise Renewal' : 'Update Application Details'}
              </h1>
            </div>

            {/* Stepper Navigation - Seamlessly embedded directly inside Hero Banner */}
            <div className="flex items-start w-full px-2 sm:px-8 pt-1 select-none">
              {steps.map((step, idx) => {
                const isCompleted = currentStep > step.num;
                const isCurrent = currentStep === step.num;

                return (
                  <div
                    key={step.num}
                    onClick={() => {
                      if (step.num < currentStep) {
                        setSlideDirection('backward');
                        if (!document.startViewTransition) {
                          setCurrentStep(step.num);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        } else {
                          document.startViewTransition(() => {
                            setCurrentStep(step.num);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          });
                        }
                        const currentMode = (formMode || 'New').toLowerCase();
                        const newParams = new URLSearchParams(searchParams);
                        newParams.set('mode', currentMode);
                        newParams.set('step', String(step.num));
                        navigate(`?${newParams.toString()}`);
                      }
                    }}
                    className={`relative flex-1 flex flex-col items-center select-none ${
                      step.num < currentStep ? 'cursor-pointer group' : ''
                    }`}
                  >
                    {/* Seamless Connector Line to Next Step */}
                    {idx < steps.length - 1 && (
                      <div className="absolute top-3.5 sm:top-4 left-1/2 w-full h-[2px] -translate-y-1/2 z-0 pointer-events-none">
                        <div className="w-full h-full bg-white/20 rounded-full" />
                        <div 
                          className={`absolute top-0 left-0 h-full bg-[#D4AF37] rounded-full transition-all duration-300 ease-out ${
                            currentStep > step.num ? 'w-full' : 'w-0'
                          }`} 
                        />
                      </div>
                    )}

                    {/* Step Circle */}
                    <div 
                      className={`relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isCompleted 
                          ? 'bg-[#D4AF37] text-slate-950 font-black shadow-xs' 
                          : isCurrent 
                          ? 'bg-white text-[#9E2A2B] font-black ring-4 ring-white/30 scale-105 shadow-md' 
                          : 'bg-white/10 text-white/60 border border-white/20'
                      }`}
                    >
                      {isCompleted ? (
                        <Check size={14} className="stroke-[3]" />
                      ) : (
                        <span className="text-xs font-black">{step.num}</span>
                      )}
                    </div>
                    
                    <span className={`text-[11px] sm:text-xs font-bold mt-2 text-center tracking-tight transition-colors px-1 truncate max-w-full ${
                      isCurrent ? 'text-white' : isCompleted ? 'text-[#D4AF37]' : 'text-white/50'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form Container - Unboxed Full-Width Edge-to-Edge */}
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-16 flex-1 flex flex-col relative z-10">
          <form onSubmit={handleSubmit} className="space-y-6 w-full">
        
        {currentStep === 1 && (
          <div className={`space-y-4 ${slideDirection === 'forward' ? 'animate-slide-right' : 'animate-slide-left'}`}>
            {/* Compact Pre-Flight Checklist Banner */}
            <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl p-3 sm:p-3.5 transition-all">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck size={16} className="text-[#9E2A2B] dark:text-[#D4AF37] shrink-0" />
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    <span>Requirements Checklist: </span>
                    <span className="font-medium text-slate-500 dark:text-slate-600 dark:text-slate-400">4 items needed</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowChecklist(prev => !prev)}
                  className="text-[11px] font-bold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline shrink-0 cursor-pointer"
                >
                  {showChecklist ? 'Hide List' : 'View Checklist'}
                </button>
              </div>
              {showChecklist && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2.5 mt-2 border-t border-amber-200/60 dark:border-amber-900/40 animate-slide-right">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 bg-white/90 dark:bg-slate-900/90 p-2 rounded-xl text-[11px] border border-slate-100 dark:border-slate-800">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[9px] font-black shrink-0">1</span>
                    <span className="truncate">LTO OR / CR</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 bg-white/90 dark:bg-slate-900/90 p-2 rounded-xl text-[11px] border border-slate-100 dark:border-slate-800">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[9px] font-black shrink-0">2</span>
                    <span className="truncate">Driver's License</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 bg-white/90 dark:bg-slate-900/90 p-2 rounded-xl text-[11px] border border-slate-100 dark:border-slate-800">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[9px] font-black shrink-0">3</span>
                    <span className="truncate">Brgy Clearance</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 bg-white/90 dark:bg-slate-900/90 p-2 rounded-xl text-[11px] border border-slate-100 dark:border-slate-800">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[9px] font-black shrink-0">4</span>
                    <span className="truncate">TODA Endorsement</span>
                  </div>
                </div>
              )}
            </div>

            {/* Section 1: Operator Information */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="w-7 h-7 rounded-xl bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/10 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                  <User size={16} />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Operator Information (Owner)
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Operator Full Name
                  </label>
                  <input 
                    type="text" 
                    name="fullName" 
                    value={formData.fullName} 
                    className={disabledClasses} 
                    required 
                    readOnly
                    title="Assigned automatically based on your account."
                    placeholder="e.g. Juan Dela Cruz"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Barangay in Gasan
                  </label>
                  {formMode === 'Renewal' || formMode === 'Re-apply' ? (
                    <input type="text" name="address" value={formData.address} className={disabledClasses} readOnly />
                  ) : (
                    <select name="address" value={formData.address} onChange={handleInputChange} className={inputClasses} required>
                      <option value="">Select Barangay...</option>
                      {GASAN_BARANGAYS.map((brgy, i) => (
                        <option key={i} value={brgy}>{brgy}, Gasan</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      TODA Association
                    </label>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                      Registered
                    </span>
                  </div>
                  <input 
                    type="text" 
                    name="todaName" 
                    value={formData.todaName || loggedInToda || 'NON-TODA'} 
                    readOnly 
                    className={disabledClasses} 
                    title="Assigned automatically based on your account."
                  />
                </div>
              </div>

              {/* Step Navigation & Action Buttons */}
              <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-2.5">
                  <button 
                    type="button" 
                    onClick={handleBackToDashboard}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all cursor-pointer min-h-[44px] shadow-xs active:scale-95"
                  >
                    <ArrowLeft size={15} />
                    <span>Back</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={validateAndNext}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-[#9E2A2B] hover:bg-[#7A1B22] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] text-white dark:text-slate-950 border-2 border-[#541116] dark:border-[#b89428] px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs active:scale-95 cursor-pointer min-h-[44px]"
                  >
                    <span>Continue to Step 2</span>
                  </button>
                </div>

                {/* Secondary buttons below continue */}
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSaveProgress(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Save size={13} />
                    <span>Save Draft</span>
                  </button>
                  {hasDraftRestored && (
                    <button
                      type="button"
                      onClick={handleClearDraft}
                      className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 dark:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    >
                      <RotateCcw size={13} />
                      <span>Reset Draft</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className={`space-y-4 ${slideDirection === 'forward' ? 'animate-slide-right' : 'animate-slide-left'}`}>
            {/* Section 2: Vehicle Details */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="w-7 h-7 rounded-xl bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/10 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                  <Car size={16} />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Vehicle Details (Tricycle / Motorcycle)
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Make / Brand
                  </label>

                  <input 
                    type="text" 
                    name="make" 
                    value={formData.make} 
                    onChange={handleInputChange} 
                    className={formMode === 'Renewal' || formMode === 'Re-apply' ? disabledClasses : inputClasses} 
                    required 
                    readOnly={formMode === 'Renewal' || formMode === 'Re-apply'} 
                    placeholder="e.g. Honda TMX 125 or enter brand" 
                  />

                  {/* Quick Select Brand Chips placed cleanly BELOW input box */}
                  {formMode === 'New' && (
                    <div className="mt-2 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-600 dark:text-slate-400 block">
                        Quick Select Brand:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_MAKES.map((brand) => (
                          <button
                            key={brand}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, make: brand }))}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border-2 transition-all cursor-pointer shadow-2xs active:scale-95 ${
                              formData.make === brand
                                ? 'bg-[#9E2A2B] text-white border-[#541116] dark:bg-[#D4AF37] dark:text-slate-950 dark:border-[#b89428]'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {brand}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Model Year
                  </label>
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
                    placeholder="e.g. 2024" 
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Route / Zone
                    </label>
                    <button type="button" onClick={() => setShowTodaGuide(true)} className="p-1 rounded-xl text-[#9E2A2B] dark:text-[#D4AF37] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="View TODA Zone Guide">
                      <Info size={16} />
                    </button>
                  </div>
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
                    placeholder="e.g. 1 or 2" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Plate Number
                  </label>
                  <input 
                    type="text" 
                    name="plateNo" 
                    maxLength="8"
                    value={formData.plateNo} 
                    onChange={handleInputChange} 
                    className={`${formMode === 'Renewal' || formMode === 'Re-apply' ? disabledClasses : inputClasses} ${duplicateStatus.plateNo.duplicate ? 'border-red-500 dark:border-red-500 focus:border-red-600 focus:ring-red-500/20' : ''}`} 
                    required 
                    readOnly={formMode === 'Renewal' || formMode === 'Re-apply'} 
                    placeholder="e.g. 123-ABC" 
                  />
                  {duplicateStatus.plateNo.checking && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-1">
                      <Loader2 size={11} className="animate-spin" /> Checking plate number...
                    </p>
                  )}
                  {!duplicateStatus.plateNo.checking && duplicateStatus.plateNo.duplicate && (
                    <p className="text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} className="shrink-0" /> {duplicateStatus.plateNo.message}
                    </p>
                  )}
                  {!duplicateStatus.plateNo.checking && !duplicateStatus.plateNo.duplicate && duplicateStatus.plateNo.message && (
                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                      <CheckCircle size={12} className="shrink-0" /> {duplicateStatus.plateNo.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Engine / Motor No.
                  </label>
                  <input 
                    type="text" 
                    name="motorNo" 
                    maxLength="25"
                    value={formData.motorNo} 
                    onChange={handleInputChange} 
                    className={`${formMode === 'Renewal' || formMode === 'Re-apply' ? disabledClasses : inputClasses} ${duplicateStatus.motorNo.duplicate ? 'border-red-500 dark:border-red-500 focus:border-red-600 focus:ring-red-500/20' : ''}`} 
                    required 
                    readOnly={formMode === 'Renewal' || formMode === 'Re-apply'} 
                    placeholder="Motor Serial Number" 
                  />
                  {duplicateStatus.motorNo.checking && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-1">
                      <Loader2 size={11} className="animate-spin" /> Checking motor number...
                    </p>
                  )}
                  {!duplicateStatus.motorNo.checking && duplicateStatus.motorNo.duplicate && (
                    <p className="text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} className="shrink-0" /> {duplicateStatus.motorNo.message}
                    </p>
                  )}
                  {!duplicateStatus.motorNo.checking && !duplicateStatus.motorNo.duplicate && duplicateStatus.motorNo.message && (
                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                      <CheckCircle size={12} className="shrink-0" /> {duplicateStatus.motorNo.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Chassis Serial No.
                  </label>
                  <input 
                    type="text" 
                    name="chassisNo" 
                    maxLength="25"
                    value={formData.chassisNo} 
                    onChange={handleInputChange} 
                    className={`${formMode === 'Renewal' || formMode === 'Re-apply' ? disabledClasses : inputClasses} ${duplicateStatus.chassisNo.duplicate ? 'border-red-500 dark:border-red-500 focus:border-red-600 focus:ring-red-500/20' : ''}`} 
                    required 
                    readOnly={formMode === 'Renewal' || formMode === 'Re-apply'} 
                    placeholder="Chassis Serial Number" 
                  />
                  {duplicateStatus.chassisNo.checking && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-1">
                      <Loader2 size={11} className="animate-spin" /> Checking chassis number...
                    </p>
                  )}
                  {!duplicateStatus.chassisNo.checking && duplicateStatus.chassisNo.duplicate && (
                    <p className="text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} className="shrink-0" /> {duplicateStatus.chassisNo.message}
                    </p>
                  )}
                  {!duplicateStatus.chassisNo.checking && !duplicateStatus.chassisNo.duplicate && duplicateStatus.chassisNo.message && (
                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                      <CheckCircle size={12} className="shrink-0" /> {duplicateStatus.chassisNo.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Step Navigation & Action Buttons */}
              <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-2.5">
                  <button 
                    type="button" 
                    onClick={prevStep}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all cursor-pointer min-h-[44px] shadow-xs active:scale-95"
                  >
                    <span>Back</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={validateAndNext}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-[#9E2A2B] hover:bg-[#7A1B22] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] text-white dark:text-slate-950 border-2 border-[#541116] dark:border-[#b89428] px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs active:scale-95 cursor-pointer min-h-[44px]"
                  >
                    <span>Continue to Step 3</span>
                  </button>
                </div>

                {/* Secondary buttons below continue */}
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSaveProgress(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Save size={13} />
                    <span>Save Draft</span>
                  </button>
                  {hasDraftRestored && (
                    <button
                      type="button"
                      onClick={handleClearDraft}
                      className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 dark:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    >
                      <RotateCcw size={13} />
                      <span>Reset Draft</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className={`space-y-6 ${slideDirection === 'forward' ? 'animate-slide-right' : 'animate-slide-left'}`}>
            <div className="flex items-center gap-2.5 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-8 h-8 rounded-xl bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/10 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                <FileText size={18} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Community Tax Certificate (CTC / Cedula)
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 dark:text-slate-500 font-medium">
                  Enter CTC details issued by the Municipal Treasurer
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  CTC / Cedula Serial No.
                </label>
                <input 
                  type="text" 
                  maxLength={16}
                  name="cedulaSerialNo" 
                  value={formData.cedulaSerialNo} 
                  onChange={handleInputChange} 
                  className={inputClasses} 
                  placeholder="e.g. 08123456" 
                  required 
                />
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                  8–16 characters (letters &amp; numbers)
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <CalendarDays size={14} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                  <span>Date Issued</span>
                </label>
                <input 
                  type="date" 
                  name="cedulaDate" 
                  max={new Date().toISOString().split('T')[0]}
                  value={formData.cedulaDate} 
                  onChange={handleInputChange} 
                  className={inputClasses} 
                  placeholder="Piliin ang Araw ng Pagkuha ng Cedula"
                  required 
                />
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                  Piliin ang Araw ng Pagkuha ng Cedula
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Place Issued
                </label>
                <input 
                  type="text" 
                  name="cedulaAddress" 
                  value={formData.cedulaAddress} 
                  onChange={handleInputChange} 
                  className={inputClasses} 
                  placeholder="Gasan, Marinduque"
                  required 
                />
              </div>

              <div className="flex flex-col justify-end">
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3 flex items-center justify-between min-h-[46px]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center font-bold text-xs shrink-0">
                      <CalendarDays size={16} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        Application Date
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Automatic
                  </span>
                </div>
              </div>
            </div>

            {/* Step Navigation & Action Buttons */}
            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
              <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-2.5">
                <button 
                  type="button" 
                  onClick={prevStep}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all cursor-pointer min-h-[44px] shadow-xs active:scale-95"
                >
                  <span>Back</span>
                </button>

                <button 
                  type="button" 
                  onClick={validateAndNext}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-[#9E2A2B] hover:bg-[#7A1B22] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] text-white dark:text-slate-950 border-2 border-[#541116] dark:border-[#b89428] px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs active:scale-95 cursor-pointer min-h-[44px]"
                >
                  <span>Continue to Step 4</span>
                </button>
              </div>

              {/* Secondary buttons below continue */}
              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleSaveProgress(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Save size={13} />
                  <span>Save Draft</span>
                </button>
                {hasDraftRestored && (
                  <button
                    type="button"
                    onClick={handleClearDraft}
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 dark:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>Reset Draft</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className={`space-y-6 ${slideDirection === 'forward' ? 'animate-slide-right' : 'animate-slide-left'}`}>
            <div className="flex items-center gap-2.5 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-8 h-8 rounded-xl bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/10 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                <UploadCloud size={18} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Step 4: Upload Required Documents
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 dark:text-slate-500 font-medium">
                  Take a clear photo with your mobile camera or upload from device gallery
                </p>
              </div>
            </div>

            {formMode === 'Renewal' ? (
              <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 rounded-2xl text-xs sm:text-sm font-semibold mb-5 flex items-start gap-3">
                <Info size={18} className="shrink-0 mt-0.5" />
                <p className="leading-relaxed">No new document uploads required for renewal. Please review the summary below before submitting.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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

            {/* Slide 1: See Application Summary Button */}
            <div className="bg-gradient-to-r from-[#9E2A2B]/5 via-amber-500/5 to-transparent dark:from-[#D4AF37]/10 dark:via-transparent border border-[#9E2A2B]/15 dark:border-[#D4AF37]/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Application Summary</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-600 dark:text-slate-400">Review all operator, vehicle, cedula, and document details before final submission.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSummaryModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-[#9E2A2B] dark:text-[#D4AF37] hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
              >
                <Eye size={15} />
                <span>See Summary</span>
              </button>
            </div>

            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
              <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-2.5">
                <button 
                  type="button" 
                  onClick={prevStep}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all cursor-pointer min-h-[44px] shadow-xs active:scale-95"
                >
                  <span>Back</span>
                </button>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white transition-all shadow-xs active:scale-95 cursor-pointer min-h-[44px] border-2 border-[#541116] dark:border-[#b89428] ${
                    isSubmitting 
                      ? 'bg-slate-500 dark:bg-slate-700 cursor-not-allowed border-transparent' 
                      : 'bg-[#9E2A2B] hover:bg-[#7A1B22] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] dark:text-slate-950'
                  }`}
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  <span>{isSubmitting ? (uploadPhase || 'Submitting...') : formMode === 'Re-apply' ? 'Submit Revision' : 'Submit Application'}</span>
                </button>
              </div>

              {/* Secondary buttons below submit */}
              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleSaveProgress(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Save size={13} />
                  <span>Save Draft</span>
                </button>
                {hasDraftRestored && (
                  <button
                    type="button"
                    onClick={handleClearDraft}
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 dark:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>Reset Draft</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </form>
        </div>
      </div>

      <DocumentPreviewModal 
        fullPreview={fullPreview} 
        setFullPreview={setFullPreview} 
      />

      <ApplicationSummaryModal 
        isSummaryModalOpen={isSummaryModalOpen} 
        setIsSummaryModalOpen={setIsSummaryModalOpen} 
        formData={formData} 
        loggedInToda={loggedInToda} 
        requirementsList={requirementsList} 
        uploadedDocs={uploadedDocs} 
        filePreviews={filePreviews} 
      />

      <CancelApplicationModal 
        cancelModal={cancelModal} 
        setCancelModal={setCancelModal} 
        handleConfirmCancel={handleConfirmCancel} 
      />

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

      <TodaZoneGuideModal isOpen={showTodaGuide} onClose={() => setShowTodaGuide(false)} />
    </MainLayout>
  );
};

export default ApplyFranchise;

