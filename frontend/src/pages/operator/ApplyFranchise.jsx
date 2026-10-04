import localforage from 'localforage';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  GASAN_BARANGAYS, TODA_LIST, CANCEL_REASONS, 
  getZoneForBarangay, normalizeZone, normalizeBarangayName, formatZoneLabel 
} from '../../utils/constants';
import MainLayout from '../../components/MainLayout';
import { 
  UploadCloud, Check, CheckCircle, FileCheck, Info, RefreshCw, PlusCircle, 
  ArrowLeft, AlertCircle, Loader2, X, CalendarDays, ZoomIn, 
  ChevronRight, ChevronLeft, ShieldCheck, FileText, RotateCcw,
  Save, XCircle, CheckCircle2, Clock, User, Eye, Receipt,
  Compass, MapPin, ExternalLink
} from 'lucide-react';
import { GarageGridSkeleton } from '../../components/skeleton';
import DocumentUploadCard from '../../components/operator/DocumentUploadCard';
import FeedbackModal from '../../components/common/FeedbackModal';
import TricycleIcon from '../../components/common/TricycleIcon';
import TodaZoneGuideModal, { TODA_DIRECTORY, GASAN_ZONES } from '../../components/operator/TodaZoneGuideModal';
import CancelApplicationModal from '../../components/operator/CancelApplicationModal';
import DocumentPreviewModal from '../../components/operator/DocumentPreviewModal';
import ApplicationSummaryModal from '../../components/operator/ApplicationSummaryModal';
import SimpleDatePicker from '../../components/common/SimpleDatePicker';
import { useLanguage } from '../../context/LanguageContext';

const DRAFT_STORAGE_KEY = 'gtrams_apply_draft';

const STANDARD_DOC_IDS = ['orCrDocument', 'license', 'todaEndorsement', 'brgyClearance'];

const normalizeDateStr = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parts = trimmed.split(/[/.-]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    if (parts[2].length === 4) {
      const p1 = parseInt(parts[0], 10);
      const p2 = parseInt(parts[1], 10);
      const year = parts[2];
      if (p1 > 12) {
        return `${year}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
      }
      return `${year}-${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}`;
    }
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toISOString().substring(0, 10);
  }
  return trimmed;
};

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

const ApplyFranchise = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage() || { language: 'en' };

  const modeParam = searchParams.get('mode');
  const stepParam = parseInt(searchParams.get('step') || '1', 10);
  const focusParam = searchParams.get('focus');
  const initialStep = (stepParam >= 1 && stepParam <= 4) ? stepParam : 1;

  const [myFranchises, setMyFranchises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formMode, setFormMode] = useState(() => {
    if (modeParam === 'reapply') return 'Re-apply';
    if (modeParam === 'renewal') return 'Renewal';
    if (modeParam === 'new') return 'New';
    return null;
  }); 
  const [selectedId, setSelectedId] = useState(null); 
  const [reapplyTarget, setReapplyTarget] = useState(null);
  const [focusField, setFocusField] = useState(focusParam || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadPhase, setUploadPhase] = useState('');
  
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [slideDirection, setSlideDirection] = useState('forward');
  const [hasDraftRestored, setHasDraftRestored] = useState(false);

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

  // Draft Resume Modal state
  const [draftResumeModal, setDraftResumeModal] = useState({
    isOpen: false,
    draftData: null,
    savedTime: '',
    step: 1
  });

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [formErrors, setFormErrors] = useState({});
  const [fullPreview, setFullPreview] = useState(null);
  const [showTodaGuide, setShowTodaGuide] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  // AI Scanning state per document
  const [aiScanning, setAiScanning] = useState({
    license: false,
    orCrDocument: false,
    todaEndorsement: false,
    brgyClearance: false,
    cedulaDoc: false
  });

  const [aiSuccess, setAiSuccess] = useState({
    license: false,
    orCrDocument: false,
    todaEndorsement: false,
    brgyClearance: false,
    cedulaDoc: false
  });

  // Raw AI Scanned data tracker & discrepancy confirmation modal
  const [aiScannedData, setAiScannedData] = useState({});
  const [discrepancyModal, setDiscrepancyModal] = useState({
    isOpen: false,
    discrepancies: []
  });

  // Real-time uniqueness checker state
  const [duplicateStatus, setDuplicateStatus] = useState({
    plateNo: { checking: false, duplicate: false, message: '' },
    motorNo: { checking: false, duplicate: false, message: '' },
    chassisNo: { checking: false, duplicate: false, message: '' }
  });

  // Dynamic settings: max units
  const [maxAllowedUnits, setMaxAllowedUnits] = useState(() => {
    return Number(localStorage.getItem('max_units_per_operator')) || 2;
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
    zone: loggedInAddress ? getZoneForBarangay(loggedInAddress) : '', 
    made: '', make: '', motorNo: '', chassisNo: '', plateNo: '', 
    todaName: loggedInToda,
    dateApplied: new Date().toISOString().split('T')[0], 
    cedulaDate: '', 
    cedulaAddress: 'Gasan, Marinduque', 
    cedulaSerialNo: '',
    orCrNo: '',
    orCrExpiryDate: '',
    isOperatorDriver: true,
    driverName: '',
    driverContact: '',
    driverLicenseNo: '',
    driverLicenseExpiryDate: '',
    todaCertNo: '',
    todaCertDate: '',
    todaSignatory: '',
    brgyClearanceNo: '',
    brgyClearanceDate: '',
    brgyIssuer: '',
    orCrUrl: '',
    licenseUrl: '',
    todaEndorsementUrl: '',
    brgyClearanceUrl: '',
    cedulaUrl: ''
  });
  
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [filePreviews, setFilePreviews] = useState({});

  useEffect(() => {
    fetchMyFranchises();

    const fetchSettings = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/settings`);
        if (res.ok) {
          const json = await res.json();
          if (json?.data?.maxUnitsPerOperator !== undefined && json?.data?.maxUnitsPerOperator !== null) {
            const numUnits = Number(json.data.maxUnitsPerOperator) || 2;
            setMaxAllowedUnits(numUnits);
            localStorage.setItem('max_units_per_operator', numUnits);
          }
        }
      } catch (e) {
        console.error('Error fetching settings:', e);
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
    } else if (modeParam === 'new') {
      handleStartNewApplication();
    }
  }, []);

  // Sync step and formMode from searchParams
  useEffect(() => {
    const s = parseInt(searchParams.get('step') || '1', 10);
    const validS = (s >= 1 && s <= 4) ? s : 1;
    if (validS !== currentStep) {
      setSlideDirection(validS < currentStep ? 'backward' : 'forward');
      setCurrentStep(validS);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Focus flagged field if present
  useEffect(() => {
    if (focusField) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`field-${focusField}`) || document.querySelector(`[name="${focusField}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const targetInput = el.tagName === 'INPUT' || el.tagName === 'SELECT' ? el : el.querySelector('input, select');
          targetInput?.focus?.();
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [focusField, currentStep]);

  const isFieldFocused = (field) => focusField === field;

  // Smooth scroll and focus helper for error fields
  const scrollToField = (fieldName) => {
    setTimeout(() => {
      const target = 
        document.getElementById(`field-${fieldName}`) ||
        document.getElementById(`card-${fieldName}`) ||
        document.getElementById(fieldName) ||
        document.querySelector(`[name="${fieldName}"]`) ||
        document.querySelector(`[data-field="${fieldName}"]`);

      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const inputToFocus = 
          ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName) 
            ? target 
            : target.querySelector('input, select, textarea, button');
        inputToFocus?.focus?.();
      }
    }, 120);
  };

  // Center modal popup for validation errors with auto-scroll and red highlight
  const showValidationModal = (fieldName, title, message) => {
    if (fieldName) {
      setFormErrors(prev => ({ ...prev, [fieldName]: message }));
    }

    setFeedbackModal({
      isOpen: true,
      type: 'error',
      title,
      message,
      confirmText: 'Review & Correct',
      onConfirm: () => {
        setFeedbackModal(prev => ({ ...prev, isOpen: false }));
        if (fieldName) {
          scrollToField(fieldName);
        }
      }
    });

    if (fieldName) {
      scrollToField(fieldName);
    }
  };

  // Auto-sync route/zone with TODA association if zone is not yet chosen
  useEffect(() => {
    if (!formData.zone && formData.todaName) {
      const match = TODA_DIRECTORY.find(t => t.id === formData.todaName || t.name.startsWith(formData.todaName));
      if (match && match.zone) {
        if (match.zone.includes('Central')) setFormData(prev => ({ ...prev, zone: 'Central' }));
        else if (match.zone.includes('North')) setFormData(prev => ({ ...prev, zone: 'North' }));
        else if (match.zone.includes('South')) setFormData(prev => ({ ...prev, zone: 'South' }));
      }
    }
  }, [formData.todaName]);

  const getCurrentUserId = () => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      if (u._id) return String(u._id);
      if (u.id) return String(u.id);
      if (u.contact) return String(u.contact);
    } catch {}
    const uid = localStorage.getItem('userId');
    if (uid) return String(uid);
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.id) return String(payload.id);
      } catch {}
    }
    return 'operator_user';
  };

  const getDraftKey = () => {
    const uid = getCurrentUserId();
    if (formMode === 'Renewal' && selectedId) {
      return `gtrams_renewal_draft_${uid}_${selectedId}`;
    }
    return `gtrams_apply_draft_${uid}`;
  };

  // Accurate 4-Step Progress Calculation
  const calculateProgress = () => {
    let completed = 0;
    const total = 14;

    // Step 1 items (4)
    if (formData.fullName?.trim()) completed++;
    if (formData.address?.trim()) completed++;
    if (uploadedDocs.license || filePreviews.license || formData.licenseUrl) completed++;
    if (formData.driverLicenseNo?.trim()) completed++;

    // Step 2 items (6)
    if (uploadedDocs.orCrDocument || filePreviews.orCrDocument || formData.orCrUrl) completed++;
    if (formData.make?.trim()) completed++;
    if (formData.made?.trim()) completed++;
    if (formData.zone?.trim()) completed++;
    if (formData.plateNo?.trim()) completed++;
    if (formData.motorNo?.trim() && formData.chassisNo?.trim()) completed++;

    // Step 3 items (2)
    if (uploadedDocs.todaEndorsement || filePreviews.todaEndorsement || formData.todaEndorsementUrl) completed++;
    if (uploadedDocs.brgyClearance || filePreviews.brgyClearance || formData.brgyClearanceUrl) completed++;

    // Step 4 items (2)
    if (uploadedDocs.cedulaDoc || uploadedDocs.cedula || filePreviews.cedulaDoc || filePreviews.cedula || formData.cedulaUrl) completed++;
    if (formData.cedulaSerialNo?.trim() && formData.cedulaDate) completed++;

    const pct = Math.round((completed / total) * 100);
    return { percentage: Math.min(pct, 100), completed, total };
  };

  const handleSaveProgress = (isManual = true) => {
    if (!formMode || formMode === 'Re-apply') return;
    const key = getDraftKey();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Don't auto-save if form is completely pristine/empty
    if (!isManual) {
      const hasContent = (
        currentStep > 1 ||
        Boolean(formData.plateNo?.trim()) ||
        Boolean(formData.motorNo?.trim()) ||
        Boolean(formData.chassisNo?.trim()) ||
        Boolean(formData.make?.trim()) ||
        Boolean(formData.driverLicenseNo?.trim()) ||
        Boolean(formData.cedulaSerialNo?.trim()) ||
        Boolean(formData.orCrUrl) ||
        Boolean(formData.licenseUrl) ||
        Object.keys(uploadedDocs).length > 0
      );
      if (!hasContent) return;
    }

    try {
      localforage.setItem(key, {
        formData,
        aiScannedData,
        currentStep,
        savedAt: now.toISOString(),
        timeFormatted: timeStr,
        formMode,
        selectedId,
        userId: getCurrentUserId()
      }).catch(err => console.error('Draft save error:', err));
 
      if (isManual) {
        setHasDraftRestored(true);
        setFeedbackModal({
          isOpen: true,
          type: 'success',
          title: 'Draft Saved',
          message: `Application draft saved at ${timeStr}. You can safely return and finish anytime.`,
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
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [formData, aiScannedData, currentStep, formMode, selectedId]);

  // Keep references for immediate auto-save on navigation / back / unload
  const formDataRef = useRef(formData);
  const currentStepRef = useRef(currentStep);
  const formModeRef = useRef(formMode);
  const aiScannedDataRef = useRef(aiScannedData);

  useEffect(() => { formDataRef.current = formData; }, [formData]);
  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);
  useEffect(() => { formModeRef.current = formMode; }, [formMode]);
  useEffect(() => { aiScannedDataRef.current = aiScannedData; }, [aiScannedData]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (formModeRef.current === 'New' || formModeRef.current === 'Renewal') {
        const key = getDraftKey();
        const dataToSave = formDataRef.current;
        const stepToSave = currentStepRef.current;
        const aiToSave = aiScannedDataRef.current;
        const hasContent = (
          stepToSave > 1 ||
          Boolean(dataToSave.plateNo?.trim()) ||
          Boolean(dataToSave.motorNo?.trim()) ||
          Boolean(dataToSave.chassisNo?.trim()) ||
          Boolean(dataToSave.make?.trim()) ||
          Boolean(dataToSave.driverLicenseNo?.trim()) ||
          Boolean(dataToSave.cedulaSerialNo?.trim()) ||
          Boolean(dataToSave.orCrUrl) ||
          Boolean(dataToSave.licenseUrl)
        );
        if (hasContent) {
          const now = new Date();
          localforage.setItem(key, {
            formData: dataToSave,
            aiScannedData: aiToSave,
            currentStep: stepToSave,
            savedAt: now.toISOString(),
            timeFormatted: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            formMode: formModeRef.current,
            userId: getCurrentUserId()
          }).catch(() => {});
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, []);

  // Cleanup object URLs on unmount
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
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
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

  const initFreshForm = () => {
    navigate('/apply-franchise?mode=new&step=1');
    setCurrentStep(1);
    setHasDraftRestored(false);
    setUploadedDocs({});
    setFilePreviews({});
    setAiScannedData({});

    setFormData({ 
      fullName: loggedInUserName, 
      address: loggedInAddress, 
      zone: loggedInAddress ? getZoneForBarangay(loggedInAddress) : '', 
      made: '', make: '', motorNo: '', chassisNo: '', plateNo: '', 
      todaName: loggedInToda, 
      dateApplied: new Date().toISOString().split('T')[0], 
      cedulaDate: '', 
      cedulaAddress: 'Gasan, Marinduque', 
      cedulaSerialNo: '',
      orCrNo: '',
      orCrExpiryDate: '',
      isOperatorDriver: true,
      driverName: '',
      driverContact: '',
      driverLicenseNo: '',
      driverLicenseExpiryDate: '',
      todaCertNo: '',
      todaCertDate: '',
      todaSignatory: '',
      brgyClearanceNo: '',
      brgyClearanceDate: '',
      brgyIssuer: '',
      orCrUrl: '',
      licenseUrl: '',
      todaEndorsementUrl: '',
      brgyClearanceUrl: '',
      cedulaUrl: ''
    });
  };

  const handleStartNewApplication = async () => {
    setFormMode('New');
    setSelectedId(null);
    setFilePreviews({});
    
    // Purge any legacy global un-scoped draft key to prevent cross-account leak
    localforage.removeItem('gtrams_apply_draft').catch(() => {});
    localStorage.removeItem('gtrams_apply_draft');

    try {
      const userDraftKey = getDraftKey();
      const savedDraft = await localforage.getItem(userDraftKey);
      
      const hasMeaningfulDraft = savedDraft && savedDraft.formData && (
        savedDraft.currentStep > 1 ||
        Boolean(savedDraft.formData.plateNo?.trim()) ||
        Boolean(savedDraft.formData.motorNo?.trim()) ||
        Boolean(savedDraft.formData.chassisNo?.trim()) ||
        Boolean(savedDraft.formData.make?.trim()) ||
        Boolean(savedDraft.formData.driverLicenseNo?.trim()) ||
        Boolean(savedDraft.formData.cedulaSerialNo?.trim()) ||
        Boolean(savedDraft.formData.orCrUrl) ||
        Boolean(savedDraft.formData.licenseUrl)
      );

      if (hasMeaningfulDraft) {
        setDraftResumeModal({
          isOpen: true,
          draftData: savedDraft,
          savedTime: savedDraft.timeFormatted || (savedDraft.savedAt ? new Date(savedDraft.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'),
          step: savedDraft.currentStep || 1
        });
        return;
      }
    } catch (e) {
      console.error('Error checking draft in IndexedDB', e);
    }

    initFreshForm();
  };

  const handleConfirmResumeDraft = () => {
    if (!draftResumeModal.draftData) return;
    const { formData: savedForm, currentStep: savedStep, aiScannedData: savedAiData } = draftResumeModal.draftData;

    setFormData({
      ...savedForm,
      fullName: loggedInUserName || savedForm.fullName,
      address: loggedInAddress || savedForm.address,
      zone: savedForm.zone ? normalizeZone(savedForm.zone) : (loggedInAddress ? getZoneForBarangay(loggedInAddress) : ''),
      todaName: loggedInToda || savedForm.todaName
    });

    if (savedAiData && typeof savedAiData === 'object') {
      setAiScannedData(savedAiData);
    }

    const previews = {};
    if (savedForm.orCrUrl) previews.orCrDocument = savedForm.orCrUrl;
    if (savedForm.licenseUrl) previews.license = savedForm.licenseUrl;
    if (savedForm.todaEndorsementUrl) previews.todaEndorsement = savedForm.todaEndorsementUrl;
    if (savedForm.brgyClearanceUrl) previews.brgyClearance = savedForm.brgyClearanceUrl;
    if (savedForm.cedulaUrl) previews.cedulaDoc = savedForm.cedulaUrl;
    setFilePreviews(previews);

    const urlStep = parseInt(searchParams.get('step') || '0', 10);
    const targetStep = (urlStep >= 1 && urlStep <= 4) ? urlStep : (savedStep || 1);
    navigate(`/apply-franchise?mode=new&step=${targetStep}`);
    setCurrentStep(targetStep);
    setHasDraftRestored(true);
    setDraftResumeModal({ isOpen: false, draftData: null, savedTime: '', step: 1 });
    showToast('Your saved draft has been restored.', 'success');
  };

  const handleDiscardDraft = async () => {
    const userDraftKey = getDraftKey();
    try {
      await localforage.removeItem(userDraftKey);
      await localforage.removeItem('gtrams_apply_draft');
      localStorage.removeItem('gtrams_apply_draft');
    } catch (err) {
      console.error('Error clearing draft:', err);
    }
    setDraftResumeModal({ isOpen: false, draftData: null, savedTime: '', step: 1 });
    initFreshForm();
    showToast('Draft cleared. Starting a fresh application.', 'info');
  };

  const handleClearDraft = async () => {
    const key = getDraftKey();
    try {
      await localforage.removeItem(key);
      await localforage.removeItem('gtrams_apply_draft');
      localStorage.removeItem('gtrams_apply_draft');
      setHasDraftRestored(false);
      setAiScannedData({});
      initFreshForm();
      showToast('Draft has been reset.', 'info');
    } catch (err) {
      console.error('Error resetting draft:', err);
    }
  };

  const handleBackToDashboard = () => {
    if (formMode === 'New' || formMode === 'Renewal') {
      try {
        handleSaveProgress(false);
      } catch {
        // ignore
      }
    }
    navigate('/operator-dashboard');
  };

  const handleTopBack = () => {
    if (currentStep > 1) {
      prevStep();
    } else {
      handleBackToDashboard();
    }
  };

  const handleReapplyClick = (franchise) => {
    setFormMode('Re-apply');
    setSelectedId(franchise._id);
    setReapplyTarget(franchise);
    navigate(`/apply-franchise?mode=reapply&step=1${franchise.rejectedField ? `&focus=${franchise.rejectedField}` : ''}`);
    
    const s = parseInt(searchParams.get('step') || '1', 10);
    const validStep = (s >= 1 && s <= 4) ? s : 1;
    setCurrentStep(validStep);

    if (focusParam) {
      setFocusField(focusParam);
    } else if (franchise.rejectedField) {
      setFocusField(franchise.rejectedField);
    }
    
    setFormData({
      fullName: franchise.fullName || '',
      address: franchise.address || '',
      zone: franchise.zone ? normalizeZone(franchise.zone) : (franchise.address ? getZoneForBarangay(franchise.address) : ''),
      made: franchise.made || '',
      make: franchise.make || '',
      motorNo: franchise.motorNo || '',
      chassisNo: franchise.chassisNo || '',
      plateNo: franchise.plateNo || '',
      todaName: franchise.todaName || loggedInToda,
      dateApplied: franchise.dateApplied ? franchise.dateApplied.substring(0, 10) : '',
      cedulaDate: franchise.cedulaDate ? franchise.cedulaDate.substring(0, 10) : '',
      cedulaAddress: franchise.cedulaAddress || 'Gasan, Marinduque',
      cedulaSerialNo: franchise.cedulaSerialNo || '',
      orCrNo: franchise.orCrNo || '',
      orCrExpiryDate: franchise.orCrExpiryDate ? franchise.orCrExpiryDate.substring(0, 10) : '',
      isOperatorDriver: franchise.isOperatorDriver !== undefined ? Boolean(franchise.isOperatorDriver) : true,
      driverName: franchise.driverName || '',
      driverContact: franchise.driverContact || '',
      driverLicenseNo: franchise.driverLicenseNo || '',
      driverLicenseExpiryDate: franchise.driverLicenseExpiryDate ? franchise.driverLicenseExpiryDate.substring(0, 10) : '',
      todaCertNo: franchise.todaCertNo || '',
      todaCertDate: franchise.todaCertDate ? franchise.todaCertDate.substring(0, 10) : '',
      todaSignatory: franchise.todaSignatory || '',
      brgyClearanceNo: franchise.brgyClearanceNo || '',
      brgyClearanceDate: franchise.brgyClearanceDate ? franchise.brgyClearanceDate.substring(0, 10) : '',
      brgyIssuer: franchise.brgyIssuer || '',
      orCrUrl: franchise.orCrUrl || '',
      licenseUrl: franchise.licenseUrl || '',
      todaEndorsementUrl: franchise.todaEndorsementUrl || '',
      brgyClearanceUrl: franchise.brgyClearanceUrl || '',
      cedulaUrl: franchise.cedulaUrl || ''
    });

    if (franchise.aiScannedData && typeof franchise.aiScannedData === 'object') {
      setAiScannedData(franchise.aiScannedData);
    } else {
      setAiScannedData({});
    }

    const previews = {};
    if (franchise.orCrUrl) previews.orCrDocument = franchise.orCrUrl;
    if (franchise.licenseUrl) previews.license = franchise.licenseUrl;
    if (franchise.todaEndorsementUrl) previews.todaEndorsement = franchise.todaEndorsementUrl;
    if (franchise.brgyClearanceUrl) previews.brgyClearance = franchise.brgyClearanceUrl;
    if (franchise.cedulaUrl) previews.cedulaDoc = franchise.cedulaUrl;
    setFilePreviews(previews);
    setUploadedDocs({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (formErrors[name]) {
      setFormErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
    let sanitized = value;
    if (name === 'made') {
      sanitized = value.replace(/\D/g, '').slice(0, 4);
    } else if (name === 'cedulaSerialNo') {
      sanitized = value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 20).toUpperCase();
    } else if (['motorNo', 'chassisNo', 'plateNo', 'orCrNo', 'driverLicenseNo', 'todaCertNo', 'brgyClearanceNo'].includes(name)) {
      sanitized = value.toUpperCase();
    }

    if (name === 'address') {
      const autoZone = getZoneForBarangay(sanitized);
      setFormData(prev => ({
        ...prev,
        address: sanitized,
        zone: autoZone || prev.zone
      }));
      return;
    }

    if (name === 'zone') {
      setFormData(prev => ({
        ...prev,
        zone: normalizeZone(sanitized)
      }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: sanitized }));
  };

  // AI OCR Scanner Engine for Operator Form
  const triggerAiScan = async (reqId, fileArg = null) => {
    let docType = '';
    const lower = (reqId || '').toLowerCase();
    if (lower === 'license' || lower.includes('license')) docType = 'license';
    else if (lower === 'orcrdocument' || lower.includes('orcr')) docType = 'orCr';
    else if (lower === 'todaendorsement' || lower.includes('toda')) docType = 'todaEndorsement';
    else if (lower === 'brgyclearance' || lower.includes('brgy')) docType = 'brgyClearance';
    else if (lower === 'ceduladoc' || lower.includes('cedula') || lower === 'cedula') docType = 'cedula';

    if (!docType) return;

    setAiScanning(prev => ({ ...prev, [reqId]: true }));
    setAiSuccess(prev => ({ ...prev, [reqId]: false }));

    try {
      const scanFormData = new FormData();
      scanFormData.append('docType', docType);

      let fileToScan = fileArg || uploadedDocs[reqId] || uploadedDocs[docType];
      const preview = filePreviews[reqId] || filePreviews[docType] || formData[`${docType === 'orCr' ? 'orCr' : docType}Url`];

      if (!fileToScan && preview && typeof preview === 'string') {
        if (preview.startsWith('blob:')) {
          try {
            const resp = await fetch(preview);
            fileToScan = await resp.blob();
          } catch (e) {
            console.warn('Could not fetch blob for re-scan:', e);
          }
        } else if (preview.startsWith('http')) {
          scanFormData.append('fileUrl', preview);
        }
      }

      if (fileToScan) {
        scanFormData.append('file', fileToScan, 'document.jpg');
        // Pre-read base64 client-side to eliminate extra remote Cloudinary re-fetch
        try {
          const base64Data = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(fileToScan);
          });
          if (base64Data) {
            scanFormData.append('base64', base64Data);
          }
        } catch (err) {
          console.warn('Local base64 conversion skipped:', err);
        }
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/scan-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: scanFormData
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;

          if (json.fileUrl) {
            const urlKeyMap = {
              orCr: 'orCrUrl',
              license: 'licenseUrl',
              todaEndorsement: 'todaEndorsementUrl',
              brgyClearance: 'brgyClearanceUrl',
              cedula: 'cedulaUrl'
            };
            if (urlKeyMap[docType]) {
              setFormData(prev => ({ ...prev, [urlKeyMap[docType]]: json.fileUrl }));
            }
          }

          if (docType === 'license') {
            const hasData = d.licenseNo || d.driverName || d.expiryDate;
            if (hasData) {
              const normExpiry = d.expiryDate ? normalizeDateStr(d.expiryDate) : '';
              const today = new Date().toISOString().split('T')[0];
              const isExpired = normExpiry && normExpiry < today;

              setAiScannedData(prev => ({
                ...prev,
                license: {
                  licenseNo: d.licenseNo ? d.licenseNo.toUpperCase() : '',
                  expiryDate: normExpiry || '',
                  driverName: d.driverName || '',
                  isExpired: Boolean(isExpired),
                  scannedAt: new Date().toISOString()
                }
              }));

              setFormData(prev => ({
                ...prev,
                fullName: (!prev.fullName && d.driverName) ? d.driverName : prev.fullName,
                driverLicenseNo: d.licenseNo ? d.licenseNo.toUpperCase() : prev.driverLicenseNo,
                driverLicenseExpiryDate: normExpiry || prev.driverLicenseExpiryDate,
                driverName: (!prev.isOperatorDriver && d.driverName) ? d.driverName : (prev.driverName || d.driverName)
              }));
              setAiSuccess(prev => ({ ...prev, [reqId]: true }));

              if (isExpired) {
                showValidationModal(
                  'driverLicenseExpiryDate',
                  "Driver's License Expired",
                  `The scanned Driver's License has expired (validity ended on ${normExpiry}). An active, unexpired license is required by the Sangguniang Bayan Franchising Office. Please verify or update the license.`
                );
              } else {
                showToast("AI Scan: Driver's License details detected.", 'success');
              }
            } else {
              showToast("Document attached. Text was unclear for auto-fill — please type details manually.", 'info');
            }
          } else if (docType === 'orCr') {
            const hasData = d.plateNo || d.motorNo || d.chassisNo || d.make || d.year || d.orCrNo || d.expiryDate;
            if (hasData) {
              const normExpiry = d.expiryDate ? normalizeDateStr(d.expiryDate) : '';
              const today = new Date().toISOString().split('T')[0];
              const isExpired = normExpiry && normExpiry < today;

              setAiScannedData(prev => ({
                ...prev,
                orCr: {
                  plateNo: d.plateNo ? d.plateNo.toUpperCase() : '',
                  motorNo: d.motorNo ? d.motorNo.toUpperCase() : '',
                  chassisNo: d.chassisNo ? d.chassisNo.toUpperCase() : '',
                  make: d.make || '',
                  year: d.year ? String(d.year) : '',
                  orCrNo: d.orCrNo ? d.orCrNo.toUpperCase() : '',
                  expiryDate: normExpiry || '',
                  isExpired: Boolean(isExpired),
                  scannedAt: new Date().toISOString()
                }
              }));

              setFormData(prev => ({
                ...prev,
                plateNo: d.plateNo ? d.plateNo.toUpperCase() : prev.plateNo,
                motorNo: d.motorNo ? d.motorNo.toUpperCase() : prev.motorNo,
                chassisNo: d.chassisNo ? d.chassisNo.toUpperCase() : prev.chassisNo,
                make: d.make || prev.make,
                made: d.year ? String(d.year) : prev.made,
                orCrNo: d.orCrNo ? d.orCrNo.toUpperCase() : prev.orCrNo,
                orCrExpiryDate: normExpiry || prev.orCrExpiryDate
              }));
              setAiSuccess(prev => ({ ...prev, [reqId]: true }));

              if (isExpired) {
                showValidationModal(
                  'orCrExpiryDate',
                  "LTO Registration Expired",
                  `The scanned vehicle registration has expired (validity ended on ${normExpiry}). Please renew with the LTO before applying for a franchise.`
                );
              } else {
                showToast("AI Scan: Vehicle details auto-filled from OR/CR.", 'success');
              }
            } else {
              showToast("Document attached. Vehicle serials were unclear — please enter Plate, Motor, and Chassis manually.", 'info');
            }
          } else if (docType === 'todaEndorsement') {
            const hasData = d.certNo || d.signatory || d.todaName || d.dateIssued;
            if (hasData) {
              setAiScannedData(prev => ({
                ...prev,
                todaEndorsement: {
                  certNo: d.certNo ? d.certNo.toUpperCase() : '',
                  signatory: d.signatory || '',
                  todaName: d.todaName || '',
                  dateIssued: d.dateIssued ? normalizeDateStr(d.dateIssued) : '',
                  scannedAt: new Date().toISOString()
                }
              }));
              setFormData(prev => ({
                ...prev,
                todaCertNo: d.certNo ? d.certNo.toUpperCase() : prev.todaCertNo,
                todaSignatory: d.signatory || prev.todaSignatory,
                todaCertDate: d.dateIssued ? normalizeDateStr(d.dateIssued) : prev.todaCertDate
              }));
              setAiSuccess(prev => ({ ...prev, [reqId]: true }));
              showToast("AI Scan: TODA Certificate details detected.", 'success');
            } else {
              showToast("Document attached. Please verify TODA Certificate No manually.", 'info');
            }
          } else if (docType === 'brgyClearance') {
            const hasData = d.barangay || d.clearanceNo || d.issuer || d.dateIssued;
            if (hasData) {
              setAiScannedData(prev => ({
                ...prev,
                brgyClearance: {
                  clearanceNo: d.clearanceNo ? d.clearanceNo.toUpperCase() : '',
                  barangay: d.barangay || '',
                  issuer: d.issuer || '',
                  dateIssued: d.dateIssued ? normalizeDateStr(d.dateIssued) : '',
                  scannedAt: new Date().toISOString()
                }
              }));
              setFormData(prev => {
                const detectedBrgy = d.barangay ? normalizeBarangayName(d.barangay) : prev.address;
                const autoZone = detectedBrgy ? getZoneForBarangay(detectedBrgy) : prev.zone;
                return {
                  ...prev,
                  address: detectedBrgy || prev.address,
                  zone: autoZone || prev.zone,
                  brgyClearanceNo: d.clearanceNo ? d.clearanceNo.toUpperCase() : prev.brgyClearanceNo,
                  brgyClearanceDate: d.dateIssued ? normalizeDateStr(d.dateIssued) : prev.brgyClearanceDate,
                  brgyIssuer: d.issuer || prev.brgyIssuer
                };
              });
              setAiSuccess(prev => ({ ...prev, [reqId]: true }));
              showToast("AI Scan: Barangay Clearance details detected.", 'success');
            } else {
              showToast("Document attached. Please verify Barangay Clearance details manually.", 'info');
            }
          } else if (docType === 'cedula') {
            const hasData = d.serialNo || d.dateIssued || d.placeIssued;
            if (hasData) {
              setAiScannedData(prev => ({
                ...prev,
                cedula: {
                  serialNo: d.serialNo ? d.serialNo.toUpperCase() : '',
                  dateIssued: d.dateIssued ? normalizeDateStr(d.dateIssued) : '',
                  placeIssued: d.placeIssued || '',
                  scannedAt: new Date().toISOString()
                }
              }));
              setFormData(prev => ({
                ...prev,
                cedulaSerialNo: d.serialNo ? d.serialNo.toUpperCase() : prev.cedulaSerialNo,
                cedulaDate: d.dateIssued ? normalizeDateStr(d.dateIssued) : prev.cedulaDate,
                cedulaAddress: d.placeIssued || prev.cedulaAddress
              }));
              setAiSuccess(prev => ({ ...prev, [reqId]: true }));
              showToast("AI Scan: Cedula (CTC) details detected.", 'success');
            } else {
              showToast("Document attached. Please enter Cedula Serial Number manually.", 'info');
            }
          }
        } else if (json.noKey) {
          showToast(json.message || 'Notice: GEMINI_API_KEY is not configured on the server. AI auto-fill is disabled.', 'warning');
        } else if (json.message) {
          showToast(json.message, 'info');
        }
      } else {
        const errText = await res.text().catch(() => '');
        console.warn('AI Scan server responded with status:', res.status, errText);
        showToast('Document attached. (Server AI scan is taking longer than expected — you can continue typing manually.)', 'info');
      }
    } catch (err) {
      console.warn('AI Scan network notice:', err);
      showToast('Document attached. AI scan timed out — please type details manually.', 'info');
    } finally {
      setAiScanning(prev => ({ ...prev, [reqId]: false }));
    }
  };

  const handleRescan = (reqId) => {
    showToast('Re-scanning document with AI...', 'info');
    triggerAiScan(reqId);
  };

  const handleFileChange = (reqId, file) => {
    if (file) {
      if (formErrors[reqId]) {
        setFormErrors(prev => {
          const copy = { ...prev };
          delete copy[reqId];
          return copy;
        });
      }
      if (file.size > 10 * 1024 * 1024) {
        showValidationModal(reqId, 'File Exceeds Size Limit', 'Document file is too large. Maximum allowed size is 10MB.');
        return;
      }
      setFilePreviews(prev => {
        if (prev[reqId] && typeof prev[reqId] === 'string' && prev[reqId].startsWith('blob:')) {
          URL.revokeObjectURL(prev[reqId]);
        }
        return { ...prev, [reqId]: URL.createObjectURL(file) };
      });
      setUploadedDocs(prev => ({ ...prev, [reqId]: file }));

      // Trigger automatic smart AI scanning
      triggerAiScan(reqId, file);
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
      if (prev[reqId] && typeof prev[reqId] === 'string' && prev[reqId].startsWith('blob:')) {
        URL.revokeObjectURL(prev[reqId]);
      }
      const copy = { ...prev };
      delete copy[reqId];
      return copy;
    });

    setFormErrors(prev => {
      const copy = { ...prev };
      delete copy[reqId];
      return copy;
    });

    setAiSuccess(prev => ({ ...prev, [reqId]: false }));
  };

  // Real-time debounced duplicate checker (Step 2)
  useEffect(() => {
    if (currentStep !== 2) return;
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

      return setTimeout(async () => {
        setDuplicateStatus(prev => ({
          ...prev,
          [name]: { ...prev[name], checking: true }
        }));
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/v1/franchises/check-unique?field=${name}&value=${encodeURIComponent(trimmed)}${selectedId ? `&excludeId=${selectedId}` : ''}`,
            { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
          );
          if (res.ok) {
            const data = await res.json();
            const isUnique = data.unique !== undefined ? Boolean(data.unique) : Boolean(data.isUnique);
            const isDuplicate = !isUnique;
            setDuplicateStatus(prev => ({
              ...prev,
              [name]: {
                checking: false,
                duplicate: isDuplicate,
                message: isUnique 
                  ? `${label} is available.` 
                  : (data.message || `This ${label.toLowerCase()} is already registered to another unit.`)
              }
            }));
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
      }, 500);
    });

    return () => {
      timers.forEach(t => t && clearTimeout(t));
    };
  }, [formData.plateNo, formData.motorNo, formData.chassisNo, currentStep, formMode, selectedId]);

  // Validation before proceeding to next step
  const validateCurrentStep = () => {
    const today = new Date().toISOString().split('T')[0];

    if (currentStep === 1) {
      if (!formData.fullName?.trim()) {
        showValidationModal('fullName', 'Operator Full Name Required', 'Please enter the complete name of the tricycle operator.');
        return false;
      }
      if (!formData.address?.trim()) {
        showValidationModal('address', 'Barangay Address Required', 'Please select your official Barangay of residence in Gasan.');
        return false;
      }
      if (!formData.isOperatorDriver) {
        if (!formData.driverName?.trim()) {
          showValidationModal('driverName', "Driver's Name Required", 'Please enter the full name of the hired or designated driver.');
          return false;
        }
        if (!formData.driverContact?.trim()) {
          showValidationModal('driverContact', "Driver's Contact Number Required", 'Please enter an active contact number for the designated driver.');
          return false;
        }
      }
      if (formMode === 'New') {
        const hasLicense = uploadedDocs.license || filePreviews.license || formData.licenseUrl;
        if (!hasLicense) {
          showValidationModal('license', "Driver's License Upload Required", "Please upload a clear photo or copy of the driver's license.");
          return false;
        }
        if (!formData.driverLicenseNo?.trim()) {
          showValidationModal('driverLicenseNo', "Driver's License Number Required", "Please enter or scan the official Driver's License Number.");
          return false;
        }
        if (!formData.driverLicenseExpiryDate) {
          showValidationModal('driverLicenseExpiryDate', "License Expiry Date Required", "Please select or verify the Driver's License expiration date.");
          return false;
        }
        if (formData.driverLicenseExpiryDate && formData.driverLicenseExpiryDate < today) {
          showValidationModal('driverLicenseExpiryDate', "Driver's License Expired", `The Driver's License expired on ${formData.driverLicenseExpiryDate}. An active, unexpired license is required.`);
          return false;
        }
      }
      return true;
    }

    if (currentStep === 2) {
      if (formMode === 'New') {
        const hasOrCr = uploadedDocs.orCrDocument || filePreviews.orCrDocument || formData.orCrUrl;
        if (!hasOrCr) {
          showValidationModal('orCrDocument', 'LTO OR/CR Document Required', 'Please upload a photo of your LTO Official Receipt / Certificate of Registration (OR/CR).');
          return false;
        }
        if (!formData.make?.trim()) {
          showValidationModal('make', 'Vehicle Make Required', 'Please enter or select the vehicle make and model (e.g. Honda TMX 125).');
          return false;
        }
        if (!formData.made?.trim()) {
          showValidationModal('made', 'Model Year Required', 'Please enter the 4-digit model year of the vehicle.');
          return false;
        }
        if (!formData.zone?.trim()) {
          showValidationModal('zone', 'Municipal Route / Zone Required', 'Please select the authorized Route Zone for this franchise.');
          return false;
        }
        if (!formData.plateNo?.trim()) {
          showValidationModal('plateNo', 'Plate Number Required', 'Please enter the official Plate Number or MV File Number.');
          return false;
        }
        if (!formData.motorNo?.trim()) {
          showValidationModal('motorNo', 'Engine / Motor Number Required', 'Please enter the Engine / Motor Number from your OR/CR.');
          return false;
        }
        if (!formData.chassisNo?.trim()) {
          showValidationModal('chassisNo', 'Chassis Serial Number Required', 'Please enter the 17-digit Chassis Serial Number / VIN.');
          return false;
        }
        if (duplicateStatus.plateNo.duplicate) {
          showValidationModal('plateNo', 'Duplicate Plate Number', duplicateStatus.plateNo.message || 'This plate number is already registered to another unit.');
          return false;
        }
        if (duplicateStatus.motorNo.duplicate) {
          showValidationModal('motorNo', 'Duplicate Motor Number', duplicateStatus.motorNo.message || 'This motor number is already registered to another unit.');
          return false;
        }
        if (duplicateStatus.chassisNo.duplicate) {
          showValidationModal('chassisNo', 'Duplicate Chassis Number', duplicateStatus.chassisNo.message || 'This chassis number is already registered to another unit.');
          return false;
        }
        if (formData.orCrExpiryDate && formData.orCrExpiryDate < today) {
          showValidationModal('orCrExpiryDate', 'LTO Registration Expired', `The LTO OR/CR expired on ${formData.orCrExpiryDate}. Please renew vehicle registration with LTO.`);
          return false;
        }
      }
      return true;
    }

    if (currentStep === 3) {
      if (formMode === 'New') {
        const hasToda = uploadedDocs.todaEndorsement || filePreviews.todaEndorsement || formData.todaEndorsementUrl;
        const hasBrgy = uploadedDocs.brgyClearance || filePreviews.brgyClearance || formData.brgyClearanceUrl;
        if (!hasToda) {
          showValidationModal('todaEndorsement', 'TODA Endorsement Required', 'Please upload the TODA Endorsement Certificate issued by your association.');
          return false;
        }
        if (!hasBrgy) {
          showValidationModal('brgyClearance', 'Barangay Clearance Required', 'Please upload the Barangay Clearance document.');
          return false;
        }
      }
      return true;
    }

    return true;
  };

  const nextStep = () => {
    if (!validateCurrentStep()) return;
    if (currentStep < 4) {
      setSlideDirection('forward');
      const nextS = currentStep + 1;
      setCurrentStep(nextS);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const currentMode = (formMode || 'New').toLowerCase();
      navigate(`?mode=${currentMode}&step=${nextS}`);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setSlideDirection('backward');
      const prevS = currentStep - 1;
      setCurrentStep(prevS);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const currentMode = (formMode || 'New').toLowerCase();
      navigate(`?mode=${currentMode}&step=${prevS}`);
    }
  };

  // AI OCR Discrepancy Analysis (Detects if applicant edited scanned data or expired dates)
  const getAiDiscrepancies = (currForm = formData, currAi = aiScannedData) => {
    const discrepancies = [];
    const today = new Date().toISOString().split('T')[0];

    // 1. License Expiry Discrepancy
    if (currAi?.license?.expiryDate) {
      const aiExp = currAi.license.expiryDate;
      const userExp = currForm.driverLicenseExpiryDate || '';
      const wasScannedExpired = aiExp < today;
      const isEnteredValid = userExp >= today;

      if (wasScannedExpired && isEnteredValid) {
        discrepancies.push({
          field: 'driverLicenseExpiryDate',
          docType: 'license',
          step: 1,
          label: "Driver's License Expiry Date",
          scannedValue: aiExp,
          enteredValue: userExp,
          severity: 'critical',
          reason: `Scanned Driver's License indicates expired date (${aiExp}), but entered date was modified to an unexpired date (${userExp}).`
        });
      } else if (userExp && userExp !== aiExp) {
        discrepancies.push({
          field: 'driverLicenseExpiryDate',
          docType: 'license',
          step: 1,
          label: "Driver's License Expiry Date",
          scannedValue: aiExp,
          enteredValue: userExp,
          severity: 'warning',
          reason: `Scanned expiry date (${aiExp}) differs from entered date (${userExp}).`
        });
      }
    }

    // 2. OR/CR Expiry Discrepancy
    if (currAi?.orCr?.expiryDate) {
      const aiExp = currAi.orCr.expiryDate;
      const userExp = currForm.orCrExpiryDate || '';
      const wasScannedExpired = aiExp < today;
      const isEnteredValid = userExp >= today;

      if (wasScannedExpired && isEnteredValid) {
        discrepancies.push({
          field: 'orCrExpiryDate',
          docType: 'orCr',
          step: 2,
          label: "LTO OR/CR Registration Expiry Date",
          scannedValue: aiExp,
          enteredValue: userExp,
          severity: 'critical',
          reason: `Scanned LTO OR/CR indicates expired registration date (${aiExp}), but entered date was modified to an unexpired date (${userExp}).`
        });
      } else if (userExp && userExp !== aiExp) {
        discrepancies.push({
          field: 'orCrExpiryDate',
          docType: 'orCr',
          step: 2,
          label: "LTO OR/CR Registration Expiry Date",
          scannedValue: aiExp,
          enteredValue: userExp,
          severity: 'warning',
          reason: `Scanned registration expiry date (${aiExp}) differs from entered date (${userExp}).`
        });
      }
    }

    // 3. Plate No Discrepancy
    if (currAi?.orCr?.plateNo && currForm.plateNo) {
      const cleanAi = currAi.orCr.plateNo.replace(/[^A-Z0-9]/g, '');
      const cleanUser = currForm.plateNo.replace(/[^A-Z0-9]/g, '');
      if (cleanAi && cleanUser && cleanAi !== cleanUser) {
        discrepancies.push({
          field: 'plateNo',
          docType: 'orCr',
          step: 2,
          label: "Vehicle Plate / MV File Number",
          scannedValue: currAi.orCr.plateNo,
          enteredValue: currForm.plateNo,
          severity: 'warning',
          reason: `Scanned plate/MV number (${currAi.orCr.plateNo}) differs from entered value (${currForm.plateNo}).`
        });
      }
    }

    // 4. Chassis No Discrepancy
    if (currAi?.orCr?.chassisNo && currForm.chassisNo) {
      const cleanAi = currAi.orCr.chassisNo.replace(/[^A-Z0-9]/g, '');
      const cleanUser = currForm.chassisNo.replace(/[^A-Z0-9]/g, '');
      if (cleanAi && cleanUser && cleanAi !== cleanUser) {
        discrepancies.push({
          field: 'chassisNo',
          docType: 'orCr',
          step: 2,
          label: "Chassis Serial Number",
          scannedValue: currAi.orCr.chassisNo,
          enteredValue: currForm.chassisNo,
          severity: 'warning',
          reason: `Scanned chassis serial number (${currAi.orCr.chassisNo}) differs from entered value (${currForm.chassisNo}).`
        });
      }
    }

    // 5. Motor No Discrepancy
    if (currAi?.orCr?.motorNo && currForm.motorNo) {
      const cleanAi = currAi.orCr.motorNo.replace(/[^A-Z0-9]/g, '');
      const cleanUser = currForm.motorNo.replace(/[^A-Z0-9]/g, '');
      if (cleanAi && cleanUser && cleanAi !== cleanUser) {
        discrepancies.push({
          field: 'motorNo',
          docType: 'orCr',
          step: 2,
          label: "Motor / Engine Number",
          scannedValue: currAi.orCr.motorNo,
          enteredValue: currForm.motorNo,
          severity: 'warning',
          reason: `Scanned motor number (${currAi.orCr.motorNo}) differs from entered value (${currForm.motorNo}).`
        });
      }
    }

    // 6. Driver License No Discrepancy
    if (currAi?.license?.licenseNo && currForm.driverLicenseNo) {
      const cleanAi = currAi.license.licenseNo.replace(/[^A-Z0-9]/g, '');
      const cleanUser = currForm.driverLicenseNo.replace(/[^A-Z0-9]/g, '');
      if (cleanAi && cleanUser && cleanAi !== cleanUser) {
        discrepancies.push({
          field: 'driverLicenseNo',
          docType: 'license',
          step: 1,
          label: "Driver's License Number",
          scannedValue: currAi.license.licenseNo,
          enteredValue: currForm.driverLicenseNo,
          severity: 'warning',
          reason: `Scanned driver license number (${currAi.license.licenseNo}) differs from entered value (${currForm.driverLicenseNo}).`
        });
      }
    }

    return discrepancies;
  };

  // Submit Handler
  const handleSubmit = async (e, bypassDiscrepancyCheck = false) => {
    if (e?.preventDefault) e.preventDefault();
    if (isSubmitting) return;

    const today = new Date().toISOString().split('T')[0];

    // Cedula validation
    const currentYear = new Date().getFullYear();
    if (!formData.cedulaSerialNo?.trim()) {
      showValidationModal('cedulaSerialNo', 'Cedula Serial Number Required', 'Please enter the Community Tax Certificate (Cedula) Serial Number.');
      return;
    }
    if (!formData.cedulaDate) {
      showValidationModal('cedulaDate', 'Cedula Date Issued Required', 'Please enter the Cedula Date Issued.');
      return;
    }
    const cedulaYear = new Date(formData.cedulaDate).getFullYear();
    if (cedulaYear < currentYear) {
      showValidationModal('cedulaDate', 'Cedula Expired', `Cedula for year ${cedulaYear} is expired. A valid Cedula for ${currentYear} is required.`);
      return;
    }

    if (formMode === 'New') {
      const hasCedula = uploadedDocs.cedulaDoc || uploadedDocs.cedula || filePreviews.cedulaDoc || filePreviews.cedula || formData.cedulaUrl;
      if (!hasCedula) {
        showValidationModal('cedulaDoc', 'Cedula Document Required', 'Community Tax Certificate (Cedula) upload is required.');
        return;
      }
    }

    const discrepancies = getAiDiscrepancies(formData, aiScannedData);
    const criticalDiscrepancies = discrepancies.filter(d => d.severity === 'critical');

    if (!bypassDiscrepancyCheck && criticalDiscrepancies.length > 0) {
      setDiscrepancyModal({
        isOpen: true,
        discrepancies: criticalDiscrepancies
      });
      return;
    }

    setIsSubmitting(true);
    setUploadPhase('Preparing application submission...');

    try {
      const submitData = new FormData();
      submitData.append('applicationType', formMode === 'Renewal' ? 'Renewal' : 'New');
      if (formMode === 'Re-apply') submitData.append('status', 'Pending');

      Object.keys(formData).forEach(key => {
        if (formData[key] !== undefined && formData[key] !== null) {
          submitData.append(key, formData[key]);
        }
      });

      if (!formData.dateApplied) {
        submitData.append('dateApplied', new Date().toISOString().substring(0, 10));
      }

      // Attach raw AI OCR scan data and discrepancy audit log
      submitData.append('aiScannedData', JSON.stringify(aiScannedData || {}));
      submitData.append('aiDiscrepancies', JSON.stringify(discrepancies || []));

      setUploadPhase('Uploading documents and attachments...');

      // Append documents
      if (uploadedDocs.orCrDocument) submitData.append('orCrDocument', uploadedDocs.orCrDocument);
      if (uploadedDocs.license) submitData.append('license', uploadedDocs.license);
      if (uploadedDocs.todaEndorsement) submitData.append('todaEndorsement', uploadedDocs.todaEndorsement);
      if (uploadedDocs.brgyClearance) submitData.append('brgyClearance', uploadedDocs.brgyClearance);
      if (uploadedDocs.cedulaDoc) submitData.append('cedulaDoc', uploadedDocs.cedulaDoc);
      else if (uploadedDocs.cedula) submitData.append('cedulaDoc', uploadedDocs.cedula);

      const url = formMode === 'Re-apply' 
        ? `${import.meta.env.VITE_API_URL}/api/v1/franchises/${selectedId}` 
        : `${import.meta.env.VITE_API_URL}/api/v1/franchises`;

      const response = await fetch(url, {
        method: formMode === 'Re-apply' ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: submitData
      });

      const data = await response.json();

      if (response.ok) {
        try {
          const key = getDraftKey();
          await localforage.removeItem(key);
          await localforage.removeItem('gtrams_apply_draft');
          const uid = getCurrentUserId();
          await localforage.removeItem(`gtrams_apply_draft_${uid}`);
        } catch {}

        localStorage.removeItem('gtrams_apply_draft');
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        localStorage.removeItem('reapply_target');
        setHasDraftRestored(false);

        setFeedbackModal({
          isOpen: true,
          type: 'success',
          title: formMode === 'Re-apply' ? 'Revision Submitted!' : 'Application Submitted!',
          message: 'Your franchise application has been successfully submitted to the Sangguniang Bayan Office for evaluation.',
          confirmText: 'Go to Dashboard',
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
          message: data.message || 'Server error while submitting application. Please try again.',
          confirmText: 'OK',
          onConfirm: () => setFeedbackModal(prev => ({ ...prev, isOpen: false }))
        });
      }
    } catch (err) {
      console.error('Submit error:', err);
      showToast('Network error while connecting to server.', 'error');
    } finally {
      setIsSubmitting(false);
      setUploadPhase('');
    }
  };

  const inputClasses = "w-full px-4 py-3 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] text-[#1F1D1B] dark:text-[#EAE7E1] placeholder-[#6B6761] dark:placeholder-[#A8A29E] text-base min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B] dark:focus:ring-[#D4AF37] focus:border-transparent transition-all shadow-xs font-medium";
  const disabledClasses = "w-full px-4 py-3 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] text-[#6B6761] dark:text-[#A8A29E] text-base min-h-[48px] cursor-not-allowed font-medium";

  const getInputClasses = (fieldName) => {
    if (formErrors[fieldName]) {
      return "w-full px-4 py-3 rounded-lg border-2 border-red-500 ring-2 ring-red-500/20 bg-red-50/10 dark:bg-red-950/20 text-[#1F1D1B] dark:text-[#EAE7E1] placeholder-[#6B6761] dark:placeholder-[#A8A29E] text-base min-h-[48px] focus:outline-none focus:ring-2 focus:ring-red-500 transition-all shadow-xs font-medium";
    }
    return inputClasses;
  };

  const steps = [
    { num: 1, title: 'Operator', fullTitle: 'Operator & Driver' },
    { num: 2, title: 'Vehicle', fullTitle: 'Vehicle & LTO OR/CR' },
    { num: 3, title: 'Clearances', fullTitle: 'Barangay & TODA Clearances' },
    { num: 4, title: 'Review', fullTitle: 'Cedula & Final Review' }
  ];

  const activeOrPendingUnits = myFranchises.filter(f => !['Cancelled', 'Revoked'].includes(f.status));
  if (!isLoading && activeOrPendingUnits.length >= maxAllowedUnits && formMode === 'New') {
    return (
      <MainLayout hideNav={true}>
        <div className="w-full min-h-screen bg-[#F6F5F3] dark:bg-[#14110F] flex flex-col items-center justify-center p-4 sm:p-6 transition-colors">
          <div className="max-w-md w-full bg-white dark:bg-[#1C1917] rounded-lg p-6 sm:p-8 border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs text-center">
            <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-900/60">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1">
              Maximum Fleet Capacity Reached
            </h3>
            <p className="text-xs sm:text-sm text-[#6B6761] dark:text-[#A8A29E] mb-6 leading-relaxed">
              You have already registered the maximum allowed limit of {maxAllowedUnits} tricycle units for your operator account in Gasan, Marinduque.
            </p>
            <button
              type="button"
              onClick={handleBackToDashboard}
              className="w-full inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#9E2A2B] hover:bg-[#7A1B22] text-white font-bold text-sm shadow-xs cursor-pointer active:scale-95 min-h-[44px]"
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout hideNav={true}>
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] shadow-lg rounded-lg px-4 py-3 flex items-center gap-3 max-w-sm">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
              toast.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400'
                : toast.type === 'info'
                ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400'
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

      {/* Full-Screen Immersive Form Layout */}
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
                onClick={handleTopBack}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white text-sm font-bold transition-all border border-white/20 shadow-xs cursor-pointer min-h-[44px]"
                title="Back"
              >
                <ArrowLeft size={18} />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveProgress(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs sm:text-sm font-semibold transition-all border border-white/20 cursor-pointer min-h-[44px]"
                  title="Save draft"
                >
                  <Save size={15} />
                  <span>Save Draft</span>
                </button>
              </div>
            </div>

            {/* Form Title in Banner */}
            <div className="text-center pt-1 pb-3 flex flex-col items-center">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white uppercase">
                {formMode === 'Renewal' ? 'RENEW APPLICATION' : 'NEW APPLICATION'}
              </h1>
              <p className="text-xs sm:text-sm text-white/90 font-medium mt-0.5">
                Municipality of Gasan • Sangguniang Bayan Franchising Office
              </p>
            </div>

            {/* Stepper Navigation - Equal 4-column grid, 100% balanced and aligned */}
            <div className="grid grid-cols-4 w-full px-1 sm:px-4 pt-1 select-none">
              {steps.map((step, idx) => {
                const isCompleted = currentStep > step.num;
                const isCurrent = currentStep === step.num;

                return (
                  <div
                    key={step.num}
                    onClick={() => {
                      if (step.num < currentStep) {
                        setSlideDirection('backward');
                        setCurrentStep(step.num);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        const currentMode = (formMode || 'New').toLowerCase();
                        navigate(`?mode=${currentMode}&step=${step.num}`);
                      }
                    }}
                    className={`relative flex flex-col items-center text-center select-none ${
                      step.num < currentStep ? 'cursor-pointer group' : ''
                    }`}
                  >
                    {/* Seamless Connector Line */}
                    {idx < steps.length - 1 && (
                      <div 
                        className={`absolute top-3.5 sm:top-4 left-1/2 w-full h-[2px] z-0 transition-colors duration-300 ${
                          currentStep > step.num ? 'bg-[#D4AF37]' : 'bg-white/20'
                        }`}
                      />
                    )}

                    {/* Step Circle */}
                    <div 
                      className={`relative z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isCompleted 
                          ? 'bg-[#D4AF37] text-[#14110F] font-bold shadow-xs' 
                          : isCurrent 
                          ? 'bg-white text-[#9E2A2B] font-bold ring-2 ring-white/40 scale-105 shadow-xs' 
                          : 'bg-white/15 text-white/70 border border-white/20'
                      }`}
                    >
                      {isCompleted ? (
                        <Check size={16} className="stroke-[3]" />
                      ) : (
                        <span className="text-xs sm:text-sm font-bold">{step.num}</span>
                      )}
                    </div>
                    
                    <span className={`text-[11px] sm:text-xs font-semibold mt-1.5 text-center tracking-tight transition-colors px-0.5 truncate w-full ${
                      isCurrent ? 'text-white font-bold' : isCompleted ? 'text-[#D4AF37]' : 'text-white/70'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Gold Progress Bar */}
            <div className="w-full bg-black/25 h-1.5 rounded-full overflow-hidden mt-3">
              <div 
                className="bg-[#D4AF37] h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${calculateProgress().percentage}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-xs text-white/90 mt-1.5 font-medium px-1">
              <span>Step {currentStep} of 4: <strong className="font-bold text-white">{steps[currentStep - 1]?.fullTitle || steps[currentStep - 1]?.title}</strong></span>
              <span className="font-bold text-[#D4AF37]">{calculateProgress().percentage}%</span>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-16 flex-1 flex flex-col relative z-10">
          <form onSubmit={currentStep === 4 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }} className="space-y-5 w-full">
            
            {/* STEP 1: OPERATOR & DRIVER INFO */}
            {currentStep === 1 && (
              <div className={`space-y-4 ${slideDirection === 'forward' ? 'animate-slide-right' : 'animate-slide-left'}`}>
                
                {/* Header */}
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                  <div className="w-8 h-8 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/10 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                    <User size={18} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                      Operator & Driver Information
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6B6761] dark:text-[#A8A29E] font-medium">
                      Enter personal identity and driver credentials
                    </p>
                  </div>
                </div>

                {/* Operator Details Card */}
                <div className="p-3.5 sm:p-4 bg-white dark:bg-[#1C1917] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] space-y-3 shadow-xs">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E]">
                      Operator Identity
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                      Verified Account
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div id="field-fullName">
                      <label className="block text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1.5">
                        Operator Full Name
                      </label>
                      <input 
                        type="text" 
                        name="fullName" 
                        value={formData.fullName} 
                        onChange={handleInputChange} 
                        className={getInputClasses('fullName')} 
                        required 
                        placeholder="Juan Dela Cruz" 
                      />
                      {formErrors.fullName && (
                        <p className="mt-1.5 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1 animate-fadeIn">
                          <AlertCircle size={13} className="shrink-0" />
                          <span>{formErrors.fullName}</span>
                        </p>
                      )}
                    </div>

                    <div id="field-address">
                      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                        <label className="block text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#EAE7E1]">
                          Barangay Residency / Address
                        </label>
                        {formData.address && getZoneForBarangay(formData.address) && (
                          <span className="text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E]">
                            Zone: <strong className="text-[#9E2A2B] dark:text-[#D4AF37]">{getZoneForBarangay(formData.address)} Zone</strong>
                          </span>
                        )}
                      </div>
                      <select 
                        name="address" 
                        value={formData.address} 
                        onChange={handleInputChange} 
                        className={`${getInputClasses('address')} cursor-pointer`} 
                        required
                      >
                        <option value="" disabled>-- Select Official Barangay --</option>
                        {GASAN_BARANGAYS.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                      {formErrors.address && (
                        <p className="mt-1.5 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1 animate-fadeIn">
                          <AlertCircle size={13} className="shrink-0" />
                          <span>{formErrors.address}</span>
                        </p>
                      )}
                      <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] mt-1">
                        Zoning is assigned based on Barangay residency. Selecting your barangay automatically pre-fills your designated Route Zone.
                      </p>
                    </div>
                  </div>

                  {/* Driver Designation Choice */}
                  <div className="pt-2 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
                    <label className="block text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] mb-2">
                      Who will drive the tricycle?
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, isOperatorDriver: true }))}
                        className={`p-3.5 rounded-lg border text-left flex items-start gap-3 transition-all cursor-pointer ${
                          formData.isOperatorDriver 
                            ? 'bg-amber-50/70 dark:bg-amber-950/30 border-[#9E2A2B] dark:border-[#D4AF37] ring-1 ring-[#9E2A2B] dark:ring-[#D4AF37]' 
                            : 'bg-[#F6F5F3] dark:bg-[#14110F] border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-neutral-100'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          formData.isOperatorDriver ? 'border-[#9E2A2B] dark:border-[#D4AF37] bg-[#9E2A2B] dark:bg-[#D4AF37]' : 'border-[#6B6761]'
                        }`}>
                          {formData.isOperatorDriver && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div>
                          <p className="text-sm sm:text-base font-bold text-[#1F1D1B] dark:text-[#EAE7E1] leading-tight">
                            I am the Driver (Operator-Driver)
                          </p>
                          <p className="text-xs sm:text-sm text-[#6B6761] dark:text-[#A8A29E] mt-1">
                            You hold the driver's license
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, isOperatorDriver: false }))}
                        className={`p-3.5 rounded-lg border text-left flex items-start gap-3 transition-all cursor-pointer ${
                          !formData.isOperatorDriver 
                            ? 'bg-amber-50/70 dark:bg-amber-950/30 border-[#9E2A2B] dark:border-[#D4AF37] ring-1 ring-[#9E2A2B] dark:ring-[#D4AF37]' 
                            : 'bg-[#F6F5F3] dark:bg-[#14110F] border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-neutral-100'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          !formData.isOperatorDriver ? 'border-[#9E2A2B] dark:border-[#D4AF37] bg-[#9E2A2B] dark:bg-[#D4AF37]' : 'border-[#6B6761]'
                        }`}>
                          {!formData.isOperatorDriver && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div>
                          <p className="text-sm sm:text-base font-bold text-[#1F1D1B] dark:text-[#EAE7E1] leading-tight">
                            Hired Driver
                          </p>
                          <p className="text-xs sm:text-sm text-[#6B6761] dark:text-[#A8A29E] mt-1">
                            A designated driver operates the tricycle
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* If Hired Driver: Inputs */}
                  {!formData.isOperatorDriver && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 bg-[#F6F5F3] dark:bg-[#14110F] p-3 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                      <div id="field-driverName">
                        <label className="block text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1.5">
                          Driver's Full Name
                        </label>
                        <input 
                          type="text" 
                          name="driverName" 
                          value={formData.driverName} 
                          onChange={handleInputChange} 
                          className={getInputClasses('driverName')} 
                          required 
                          placeholder="Full name of driver" 
                        />
                        {formErrors.driverName && (
                          <p className="mt-1.5 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1 animate-fadeIn">
                            <AlertCircle size={13} className="shrink-0" />
                            <span>{formErrors.driverName}</span>
                          </p>
                        )}
                      </div>
                      <div id="field-driverContact">
                        <label className="block text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1.5">
                          Driver Contact No.
                        </label>
                        <input 
                          type="tel" 
                          name="driverContact" 
                          value={formData.driverContact} 
                          onChange={handleInputChange} 
                          className={getInputClasses('driverContact')} 
                          required 
                          placeholder="09123456789" 
                        />
                        {formErrors.driverContact && (
                          <p className="mt-1.5 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1 animate-fadeIn">
                            <AlertCircle size={13} className="shrink-0" />
                            <span>{formErrors.driverContact}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Driver's License Document & Smart AI Scan Card */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#EAE7E1]">
                      Driver's License Photo
                    </label>
                    <span className="text-xs sm:text-sm font-semibold text-[#6B6761] dark:text-[#A8A29E] flex items-center gap-1">
                      <CheckCircle2 size={14} className="text-emerald-600" /> Auto-fill details
                    </span>
                  </div>

                  <DocumentUploadCard
                    id="license"
                    label="Driver's License"
                    file={uploadedDocs.license}
                    previewUrl={filePreviews.license || formData.licenseUrl}
                    onFileSelect={handleFileChange}
                    onFileRemove={handleRemoveFile}
                    onPreviewZoom={setFullPreview}
                    onRescan={handleRescan}
                    required={true}
                    isScanning={aiScanning.license}
                    scanSuccess={aiSuccess.license}
                    error={formErrors.license}
                  />

                  {/* Auto-filled License Details Grid */}
                  <div className="p-3.5 bg-[#F6F5F3] dark:bg-[#14110F] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                        License Details {aiSuccess.license && <span className="text-emerald-600 font-semibold">(Verified from Document)</span>}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div id="field-driverLicenseNo">
                        <label className="block text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1.5">
                          Driver's License Number
                        </label>
                        <input 
                          type="text" 
                          name="driverLicenseNo" 
                          value={formData.driverLicenseNo} 
                          onChange={handleInputChange} 
                          className={getInputClasses('driverLicenseNo')} 
                          required 
                          placeholder="e.g. D01-12-345678" 
                        />
                        {formErrors.driverLicenseNo && (
                          <p className="mt-1.5 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1 animate-fadeIn">
                            <AlertCircle size={13} className="shrink-0" />
                            <span>{formErrors.driverLicenseNo}</span>
                          </p>
                        )}
                      </div>

                      <div id="field-driverLicenseExpiryDate">
                        <SimpleDatePicker
                          name="driverLicenseExpiryDate"
                          value={formData.driverLicenseExpiryDate}
                          onChange={handleInputChange}
                          label="License Expiry Date"
                          mode="expiry"
                          helperText="Driver's license expiration date."
                          error={formErrors.driverLicenseExpiryDate}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 1 Actions */}
                <div className="pt-3 flex flex-col-reverse sm:flex-row justify-between items-center gap-3">
                  <button 
                    type="button" 
                    onClick={handleBackToDashboard}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg font-bold text-sm sm:text-base text-[#1F1D1B] dark:text-[#EAE7E1] bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-[#F6F5F3] dark:hover:bg-[#252220] min-h-[44px] cursor-pointer"
                  >
                    <ArrowLeft size={18} />
                    <span>Back to Dashboard</span>
                  </button>

                  <button 
                    type="button" 
                    onClick={nextStep}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm sm:text-base text-white bg-[#9E2A2B] hover:bg-[#7A1B22] shadow-xs cursor-pointer min-h-[44px] active:scale-95 transition-all"
                  >
                    <span>Next: Vehicle Details</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: VEHICLE DETAILS & LTO OR/CR */}
            {currentStep === 2 && (
              <div className={`space-y-4 ${slideDirection === 'forward' ? 'animate-slide-right' : 'animate-slide-left'}`}>
                
                {/* Header */}
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                  <div className="w-8 h-8 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/10 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                    <TricycleIcon size={20} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                      Vehicle Details & LTO OR/CR
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6B6761] dark:text-[#A8A29E] font-medium">
                      Upload LTO document for instant automated vehicle pre-fill
                    </p>
                  </div>
                </div>

                {/* Document Upload for OR/CR */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#EAE7E1]">
                      LTO Official Receipt / Certificate of Registration (OR / CR)
                    </label>
                    <span className="text-xs sm:text-sm font-semibold text-[#6B6761] dark:text-[#A8A29E] flex items-center gap-1">
                      <CheckCircle2 size={14} className="text-emerald-600" /> Auto-reads Plate & Chassis
                    </span>
                  </div>

                  <DocumentUploadCard
                    id="orCrDocument"
                    label="LTO OR / CR Document"
                    file={uploadedDocs.orCrDocument}
                    previewUrl={filePreviews.orCrDocument || formData.orCrUrl}
                    onFileSelect={handleFileChange}
                    onFileRemove={handleRemoveFile}
                    onPreviewZoom={setFullPreview}
                    onRescan={handleRescan}
                    required={formMode === 'New'}
                    isScanning={aiScanning.orCrDocument}
                    scanSuccess={aiSuccess.orCrDocument}
                    error={formErrors.orCrDocument}
                  />
                </div>

                {/* Document Detection Banner */}
                {aiSuccess.orCrDocument && (
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2.5 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>Document details detected: Plate, Motor, and Chassis numbers were auto-filled. Please verify accuracy.</span>
                  </div>
                )}

                {/* Vehicle Details Form Fields */}
                <div className="p-3.5 sm:p-4 bg-white dark:bg-[#1C1917] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] space-y-3.5 shadow-xs">
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E] block pb-1 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                    Tricycle Specifications
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    
                    {/* Make / Brand */}
                    <div id="field-make">
                      <label className="block text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1.5">
                        Make / Brand
                      </label>
                      <input 
                        type="text" 
                        name="make" 
                        value={formData.make} 
                        onChange={handleInputChange} 
                        className={getInputClasses('make')} 
                        required 
                        placeholder="e.g. Honda TMX 125" 
                      />
                      {formErrors.make && (
                        <p className="mt-1.5 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1 animate-fadeIn">
                          <AlertCircle size={13} className="shrink-0" />
                          <span>{formErrors.make}</span>
                        </p>
                      )}

                      {/* Quick Select Brand Chips */}
                      {formMode === 'New' && (
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {POPULAR_MAKES.map((brand) => (
                            <button
                              key={brand}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, make: brand }))}
                              className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg border transition-all cursor-pointer min-h-[36px] ${
                                formData.make === brand
                                  ? 'bg-[#9E2A2B] text-white border-[#7A1B22]'
                                  : 'bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#EAE7E1] border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-neutral-100'
                              }`}
                            >
                              {brand}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Model Year */}
                    <div id="field-made">
                      <label className="block text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1.5">
                        Model Year
                      </label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        maxLength={4}
                        name="made" 
                        value={formData.made} 
                        onChange={handleInputChange} 
                        className={getInputClasses('made')} 
                        required 
                        placeholder="e.g. 2024" 
                      />
                      {formErrors.made && (
                        <p className="mt-1.5 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1 animate-fadeIn">
                          <AlertCircle size={13} className="shrink-0" />
                          <span>{formErrors.made}</span>
                        </p>
                      )}
                    </div>

                    {/* Route / Zone Selection */}
                    <div id="field-zone" className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label className="block text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#EAE7E1]">
                            Route / Municipal Zone
                          </label>
                          {formData.address && getZoneForBarangay(formData.address) && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-[#9E2A2B] dark:text-[#D4AF37] border border-[#9E2A2B]/20 dark:border-[#D4AF37]/30">
                              Auto-filled from Barangay
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowTodaGuide(true)}
                          className="text-xs sm:text-sm font-bold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Compass size={14} />
                          <span>View Route Guide</span>
                        </button>
                      </div>

                      <select
                        name="zone"
                        value={normalizeZone(formData.zone)}
                        onChange={handleInputChange}
                        className={`${getInputClasses('zone')} cursor-pointer font-medium`}
                        required
                      >
                        <option value="" disabled>-- Select Municipal Route &amp; Zone --</option>
                        {GASAN_ZONES.map(z => (
                          <option key={z.id} value={z.id}>{z.name}</option>
                        ))}
                      </select>
                      {formErrors.zone && (
                        <p className="mt-1.5 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1 animate-fadeIn">
                          <AlertCircle size={13} className="shrink-0" />
                          <span>{formErrors.zone}</span>
                        </p>
                      )}
                      <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] mt-1">
                        Pre-filled based on your Barangay residency, but you can change it if you operate on another authorized zone.
                      </p>

                      {/* Route Coverage Preview Card */}
                      {(() => {
                        const currentZ = normalizeZone(formData.zone);
                        const zInfo = GASAN_ZONES.find(z => z.id === currentZ);
                        if (!zInfo) return null;
                        return (
                          <div className="p-3 bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg text-left space-y-1.5 mt-2.5 shadow-xs">
                            <div className="flex items-center gap-1.5 text-sm font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                              <Compass size={15} className="text-[#9E2A2B] dark:text-[#D4AF37] shrink-0" />
                              <span>{zInfo.name}</span>
                            </div>
                            <p className="text-xs sm:text-sm text-[#6B6761] dark:text-[#A8A29E] leading-relaxed">
                              <strong>Coverage:</strong> {zInfo.coverage}
                            </p>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Plate Number */}
                    <div id="field-plateNo">
                      <label className="block text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1.5">
                        Plate Number
                      </label>
                      <input 
                        type="text" 
                        name="plateNo" 
                        maxLength={8}
                        value={formData.plateNo} 
                        onChange={handleInputChange} 
                        className={`${getInputClasses('plateNo')} ${duplicateStatus.plateNo.duplicate ? 'border-red-500 ring-2 ring-red-500/20' : ''}`} 
                        required 
                        placeholder="e.g. 123-ABC" 
                      />
                      {formErrors.plateNo && (
                        <p className="text-xs font-bold text-red-600 flex items-center gap-1 mt-1.5 animate-fadeIn">
                          <AlertCircle size={13} /> <span>{formErrors.plateNo}</span>
                        </p>
                      )}
                      {duplicateStatus.plateNo.checking && (
                        <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] flex items-center gap-1 mt-1.5">
                          <Loader2 size={13} className="animate-spin" /> Checking plate number...
                        </p>
                      )}
                      {!duplicateStatus.plateNo.checking && duplicateStatus.plateNo.duplicate && !formErrors.plateNo && (
                        <p className="text-xs font-bold text-red-600 flex items-center gap-1 mt-1.5">
                          <AlertCircle size={13} /> {duplicateStatus.plateNo.message}
                        </p>
                      )}
                      {!duplicateStatus.plateNo.checking && !duplicateStatus.plateNo.duplicate && duplicateStatus.plateNo.message && (
                        <p className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-1.5">
                          <CheckCircle2 size={13} /> {duplicateStatus.plateNo.message}
                        </p>
                      )}
                    </div>

                    {/* Engine / Motor Number */}
                    <div id="field-motorNo">
                      <label className="block text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1.5">
                        Engine / Motor No.
                      </label>
                      <input 
                        type="text" 
                        name="motorNo" 
                        maxLength={25}
                        value={formData.motorNo} 
                        onChange={handleInputChange} 
                        className={`${getInputClasses('motorNo')} ${duplicateStatus.motorNo.duplicate ? 'border-red-500 ring-2 ring-red-500/20' : ''}`} 
                        required 
                        placeholder="Motor Serial Number" 
                      />
                      {formErrors.motorNo && (
                        <p className="text-xs font-bold text-red-600 flex items-center gap-1 mt-1.5 animate-fadeIn">
                          <AlertCircle size={13} /> <span>{formErrors.motorNo}</span>
                        </p>
                      )}
                      {duplicateStatus.motorNo.checking && (
                        <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] flex items-center gap-1 mt-1.5">
                          <Loader2 size={13} className="animate-spin" /> Checking motor number...
                        </p>
                      )}
                      {!duplicateStatus.motorNo.checking && duplicateStatus.motorNo.duplicate && !formErrors.motorNo && (
                        <p className="text-xs font-bold text-red-600 flex items-center gap-1 mt-1.5">
                          <AlertCircle size={13} /> {duplicateStatus.motorNo.message}
                        </p>
                      )}
                      {!duplicateStatus.motorNo.checking && !duplicateStatus.motorNo.duplicate && duplicateStatus.motorNo.message && (
                        <p className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-1.5">
                          <CheckCircle2 size={13} /> {duplicateStatus.motorNo.message}
                        </p>
                      )}
                    </div>

                    {/* Chassis Serial Number */}
                    <div id="field-chassisNo" className="sm:col-span-2">
                      <label className="block text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1.5">
                        Chassis Serial No.
                      </label>
                      <input 
                        type="text" 
                        name="chassisNo" 
                        maxLength={25}
                        value={formData.chassisNo} 
                        onChange={handleInputChange} 
                        className={`${getInputClasses('chassisNo')} ${duplicateStatus.chassisNo.duplicate ? 'border-red-500 ring-2 ring-red-500/20' : ''}`} 
                        required 
                        placeholder="17-Digit Vehicle Identification Number (VIN)" 
                      />
                      {formErrors.chassisNo && (
                        <p className="text-xs font-bold text-red-600 flex items-center gap-1 mt-1.5 animate-fadeIn">
                          <AlertCircle size={13} /> <span>{formErrors.chassisNo}</span>
                        </p>
                      )}
                      {duplicateStatus.chassisNo.checking && (
                        <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] flex items-center gap-1 mt-1.5">
                          <Loader2 size={13} className="animate-spin" /> Checking chassis number...
                        </p>
                      )}
                      {!duplicateStatus.chassisNo.checking && duplicateStatus.chassisNo.duplicate && !formErrors.chassisNo && (
                        <p className="text-xs font-bold text-red-600 flex items-center gap-1 mt-1.5">
                          <AlertCircle size={13} /> {duplicateStatus.chassisNo.message}
                        </p>
                      )}
                      {!duplicateStatus.chassisNo.checking && !duplicateStatus.chassisNo.duplicate && duplicateStatus.chassisNo.message && (
                        <p className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-1.5">
                          <CheckCircle2 size={13} /> {duplicateStatus.chassisNo.message}
                        </p>
                      )}
                    </div>

                    {/* LTO Document Metadata */}
                    <div className="sm:col-span-2 pt-2 border-t border-[#E4E1DC] dark:border-[#2E2A27] grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1.5">
                          LTO OR / CR Number
                        </label>
                        <input 
                          type="text" 
                          name="orCrNo" 
                          value={formData.orCrNo} 
                          onChange={handleInputChange} 
                          className={inputClasses} 
                          placeholder="e.g. OR-98765432" 
                        />
                      </div>
                      <div id="field-orCrExpiryDate">
                        <SimpleDatePicker
                          name="orCrExpiryDate"
                          value={formData.orCrExpiryDate}
                          onChange={handleInputChange}
                          label="LTO Expiry / Registration Date"
                          mode="expiry"
                          helperText="LTO registration expiration date."
                          error={formErrors.orCrExpiryDate}
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Step 2 Actions */}
                <div className="pt-3 flex justify-between items-center gap-3">
                  <button 
                    type="button" 
                    onClick={prevStep}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg font-bold text-sm sm:text-base text-[#1F1D1B] dark:text-[#EAE7E1] bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-[#F6F5F3] dark:hover:bg-[#252220] min-h-[44px] cursor-pointer"
                  >
                    <ChevronLeft size={18} />
                    <span>Back</span>
                  </button>

                  <button 
                    type="button" 
                    onClick={nextStep}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm sm:text-base text-white bg-[#9E2A2B] hover:bg-[#7A1B22] shadow-xs cursor-pointer min-h-[44px] active:scale-95 transition-all"
                  >
                    <span>Next: Clearances</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CLEARANCES (TODA & BARANGAY) */}
            {currentStep === 3 && (
              <div className={`space-y-4 ${slideDirection === 'forward' ? 'animate-slide-right' : 'animate-slide-left'}`}>
                
                {/* Header */}
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                  <div className="w-8 h-8 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/10 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                      Barangay & TODA Clearances
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6B6761] dark:text-[#A8A29E] font-medium">
                      Attach membership endorsement and residency clearances
                    </p>
                  </div>
                </div>

                {/* TODA Endorsement Card */}
                <div className="p-3.5 sm:p-4 bg-white dark:bg-[#1C1917] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#EAE7E1]">
                      TODA Endorsement Certificate
                    </label>
                    <span className="text-xs sm:text-sm font-semibold text-[#6B6761] dark:text-[#A8A29E] flex items-center gap-1">
                      <FileCheck size={14} className="text-emerald-600" /> Auto-fill
                    </span>
                  </div>

                  <DocumentUploadCard
                    id="todaEndorsement"
                    label="TODA Endorsement Certificate"
                    file={uploadedDocs.todaEndorsement}
                    previewUrl={filePreviews.todaEndorsement || formData.todaEndorsementUrl}
                    onFileSelect={handleFileChange}
                    onFileRemove={handleRemoveFile}
                    onPreviewZoom={setFullPreview}
                    onRescan={handleRescan}
                    required={formMode === 'New'}
                    isScanning={aiScanning.todaEndorsement}
                    scanSuccess={aiSuccess.todaEndorsement}
                    error={formErrors.todaEndorsement}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1.5">
                        Certificate / Control No.
                      </label>
                      <input 
                        type="text" 
                        name="todaCertNo" 
                        value={formData.todaCertNo} 
                        onChange={handleInputChange} 
                        className={inputClasses} 
                        placeholder="e.g. TODA-2026-089" 
                      />
                    </div>
                    <div>
                      <SimpleDatePicker
                        name="todaCertDate"
                        value={formData.todaCertDate}
                        onChange={handleInputChange}
                        label="Date Issued"
                        mode="issuance"
                        helperText="Date TODA certificate was issued."
                      />
                    </div>
                  </div>
                </div>

                {/* Barangay Clearance Card */}
                <div className="p-3.5 sm:p-4 bg-white dark:bg-[#1C1917] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#EAE7E1]">
                      Barangay Clearance
                    </label>
                    <span className="text-xs sm:text-sm font-semibold text-[#6B6761] dark:text-[#A8A29E] flex items-center gap-1">
                      <FileCheck size={14} className="text-emerald-600" /> Auto-fill
                    </span>
                  </div>

                  <DocumentUploadCard
                    id="brgyClearance"
                    label="Barangay Clearance"
                    file={uploadedDocs.brgyClearance}
                    previewUrl={filePreviews.brgyClearance || formData.brgyClearanceUrl}
                    onFileSelect={handleFileChange}
                    onFileRemove={handleRemoveFile}
                    onPreviewZoom={setFullPreview}
                    onRescan={handleRescan}
                    required={formMode === 'New'}
                    isScanning={aiScanning.brgyClearance}
                    scanSuccess={aiSuccess.brgyClearance}
                    error={formErrors.brgyClearance}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1.5">
                        Barangay Clearance No.
                      </label>
                      <input 
                        type="text" 
                        name="brgyClearanceNo" 
                        value={formData.brgyClearanceNo} 
                        onChange={handleInputChange} 
                        className={inputClasses} 
                        placeholder="e.g. BC-2026-104" 
                      />
                    </div>
                    <div>
                      <SimpleDatePicker
                        name="brgyClearanceDate"
                        value={formData.brgyClearanceDate}
                        onChange={handleInputChange}
                        label="Date Issued"
                        mode="issuance"
                        helperText="Date Barangay clearance was issued."
                      />
                    </div>
                  </div>
                </div>

                {/* Step 3 Actions */}
                <div className="pt-3 flex justify-between items-center gap-3">
                  <button 
                    type="button" 
                    onClick={prevStep}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg font-bold text-sm sm:text-base text-[#1F1D1B] dark:text-[#EAE7E1] bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-[#F6F5F3] dark:hover:bg-[#252220] min-h-[44px] cursor-pointer"
                  >
                    <ChevronLeft size={18} />
                    <span>Back</span>
                  </button>

                  <button 
                    type="button" 
                    onClick={nextStep}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm sm:text-base text-white bg-[#9E2A2B] hover:bg-[#7A1B22] shadow-xs cursor-pointer min-h-[44px] active:scale-95 transition-all"
                  >
                    <span>Next: Cedula &amp; Review</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: CEDULA & FINAL REVIEW */}
            {currentStep === 4 && (
              <div className={`space-y-4 ${slideDirection === 'forward' ? 'animate-slide-right' : 'animate-slide-left'}`}>
                
                {/* Header */}
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                  <div className="w-8 h-8 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/10 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                    <FileCheck size={18} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                      Community Tax Certificate (Cedula) &amp; Review
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6B6761] dark:text-[#A8A29E] font-medium">
                      Upload your current-year CTC and verify application summary
                    </p>
                  </div>
                </div>

                {/* Cedula Upload & Input Card */}
                <div className="p-3.5 sm:p-4 bg-white dark:bg-[#1C1917] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#EAE7E1]">
                      Community Tax Certificate (Cedula / CTC)
                    </label>
                    <span className="text-xs sm:text-sm font-semibold text-[#6B6761] dark:text-[#A8A29E] flex items-center gap-1">
                      <FileCheck size={14} className="text-emerald-600" /> Auto-fill
                    </span>
                  </div>

                  <DocumentUploadCard
                    id="cedulaDoc"
                    label="Cedula (CTC) Document"
                    file={uploadedDocs.cedulaDoc || uploadedDocs.cedula}
                    previewUrl={filePreviews.cedulaDoc || filePreviews.cedula || formData.cedulaUrl}
                    onFileSelect={handleFileChange}
                    onFileRemove={handleRemoveFile}
                    onPreviewZoom={setFullPreview}
                    onRescan={handleRescan}
                    required={formMode === 'New'}
                    isScanning={aiScanning.cedulaDoc}
                    scanSuccess={aiSuccess.cedulaDoc}
                    error={formErrors.cedulaDoc}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div id="field-cedulaSerialNo">
                      <label className="block text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1.5">
                        Cedula Serial Number
                      </label>
                      <input 
                        type="text" 
                        name="cedulaSerialNo" 
                        value={formData.cedulaSerialNo} 
                        onChange={handleInputChange} 
                        className={getInputClasses('cedulaSerialNo')} 
                        required 
                        placeholder="e.g. 08123456" 
                      />
                      {formErrors.cedulaSerialNo && (
                        <p className="mt-1.5 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1 animate-fadeIn">
                          <AlertCircle size={13} className="shrink-0" />
                          <span>{formErrors.cedulaSerialNo}</span>
                        </p>
                      )}
                    </div>
                    <div id="field-cedulaDate">
                      <SimpleDatePicker
                        name="cedulaDate"
                        value={formData.cedulaDate}
                        onChange={handleInputChange}
                        label="Date Issued"
                        required
                        mode="issuance"
                        helperText="Date CTC / Cedula was issued."
                        error={formErrors.cedulaDate}
                      />
                    </div>
                  </div>
                </div>

                {/* Minimized Application Summary Card */}
                <div className="p-4 bg-white dark:bg-[#1C1917] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/10 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1F1D1B] dark:text-[#EAE7E1]">
                        Application Summary
                      </h3>
                      <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5 truncate">
                        {formData.fullName || 'Operator'} &bull; {formData.plateNo || 'Vehicle'} &bull; {formatZoneLabel(formData.zone)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSummaryModalOpen(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#EAE7E1] dark:hover:bg-[#252220] text-xs sm:text-sm font-bold text-[#1F1D1B] dark:text-[#EAE7E1] transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 min-h-[44px]"
                  >
                    <Eye size={16} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                    <span>See Summary</span>
                  </button>
                </div>

                {/* LGU Treasury Fee Notice */}
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2.5 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                  <Receipt size={18} className="shrink-0 text-amber-700 dark:text-amber-400" />
                  <div className="leading-snug">
                    <strong className="font-bold">Franchise Fee:</strong> Standard fee of <strong className="font-bold underline">₱500.00</strong> is payable at the Municipal Cashier window upon application approval.
                  </div>
                </div>

                {/* Step 4 Submission Actions */}
                <div className="pt-3 border-t border-[#E4E1DC] dark:border-[#2E2A27] space-y-3">
                  <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3">
                    <button 
                      type="button" 
                      onClick={prevStep}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg font-bold text-sm sm:text-base text-[#1F1D1B] dark:text-[#EAE7E1] bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-[#F6F5F3] dark:hover:bg-[#252220] min-h-[44px] cursor-pointer"
                    >
                      <ChevronLeft size={18} />
                      <span>Back to Clearances</span>
                    </button>

                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-lg font-bold text-sm sm:text-base text-white transition-all shadow-xs active:scale-95 cursor-pointer min-h-[44px] ${
                        isSubmitting 
                          ? 'bg-[#6B7280] cursor-not-allowed' 
                          : 'bg-[#9E2A2B] hover:bg-[#7A1B22]'
                      }`}
                    >
                      {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                      <span>{isSubmitting ? (uploadPhase || 'Submitting...') : 'Submit Application'}</span>
                    </button>
                  </div>

                  {/* Secondary draft actions */}
                  <div className="flex items-center justify-center gap-4 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSaveProgress(true)}
                      className="text-xs sm:text-sm font-semibold text-[#6B6761] dark:text-[#A8A29E] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save size={14} />
                      <span>Save Draft</span>
                    </button>
                    {hasDraftRestored && (
                      <button
                        type="button"
                        onClick={handleClearDraft}
                        className="text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw size={14} />
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

      {/* Modals */}
      {showTodaGuide && (
        <TodaZoneGuideModal 
          isOpen={showTodaGuide} 
          onClose={() => setShowTodaGuide(false)} 
        />
      )}

      {fullPreview && (
        <DocumentPreviewModal 
          fullPreview={fullPreview}
          fileUrl={fullPreview} 
          isOpen={!!fullPreview} 
          setFullPreview={setFullPreview}
          onClose={() => setFullPreview(null)} 
        />
      )}

      {isSummaryModalOpen && (
        <ApplicationSummaryModal
          isOpen={isSummaryModalOpen}
          onClose={() => setIsSummaryModalOpen(false)}
          application={{
            ...formData,
            status: 'Draft',
            applicationType: formMode === 'Renewal' ? 'Renewal' : 'New',
            createdAt: formData.dateApplied
          }}
        />
      )}

      {feedbackModal.isOpen && (
        <FeedbackModal
          isOpen={feedbackModal.isOpen}
          type={feedbackModal.type}
          title={feedbackModal.title}
          message={feedbackModal.message}
          confirmText={feedbackModal.confirmText}
          onConfirm={feedbackModal.onConfirm}
        />
      )}

      {cancelModal.isOpen && (
        <CancelApplicationModal
          isOpen={cancelModal.isOpen}
          onClose={() => setCancelModal({ isOpen: false, unit: null, reason: CANCEL_REASONS[0], customReason: '', isSubmitting: false })}
          unit={cancelModal.unit}
          reason={cancelModal.reason}
          setReason={(r) => setCancelModal(prev => ({ ...prev, reason: r }))}
          customReason={cancelModal.customReason}
          setCustomReason={(c) => setCancelModal(prev => ({ ...prev, customReason: c }))}
          onConfirm={handleConfirmCancel}
          isSubmitting={cancelModal.isSubmitting}
        />
      )}

      {/* AI OCR Discrepancy Confirmation Modal */}
      {discrepancyModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#1C1917] rounded-xl p-6 sm:p-7 shadow-xl border border-[#E4E1DC] dark:border-[#2E2A27]">
            <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>

            <h3 className="text-lg font-bold text-[#1F1D1B] dark:text-[#EAE7E1] text-center mb-1">
              Document Verification Notice
            </h3>

            <p className="text-xs sm:text-sm text-[#6B6761] dark:text-[#A8A29E] text-center mb-4 leading-relaxed">
              The system detected differences between your uploaded document image and the validity date entered in your application.
            </p>

            {/* Discrepancy comparison cards */}
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-1">
              {discrepancyModal.discrepancies.map((disc, idx) => (
                <div key={idx} className="bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-3 text-xs space-y-1.5">
                  <div className="font-semibold text-[#1F1D1B] dark:text-[#EAE7E1]">
                    {disc.label}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white dark:bg-[#1C1917] p-2 rounded border border-red-200 dark:border-red-900/50">
                      <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold block">Detected from Image:</span>
                      <span className="font-mono font-bold text-red-700 dark:text-red-300">
                        {disc.scannedValue || 'None'} (Expired)
                      </span>
                    </div>
                    <div className="bg-white dark:bg-[#1C1917] p-2 rounded border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">Entered in Application:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {disc.enteredValue || 'None'}
                      </span>
                    </div>
                  </div>
                  {disc.reason && (
                    <p className="text-[10px] text-[#6B6761] dark:text-[#A8A29E] leading-normal pt-0.5">
                      {disc.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Municipal Warning Box */}
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-300 text-xs mb-5 leading-relaxed">
              <span className="font-bold block mb-0.5">Official Sangguniang Bayan Reminder:</span>
              Municipal evaluators personally examine all uploaded document images. Submitting expired or non-matching attachments will result in the immediate rejection of your application.
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const firstDisc = discrepancyModal.discrepancies[0];
                  setDiscrepancyModal({ isOpen: false, discrepancies: [] });
                  if (firstDisc?.step) {
                    setCurrentStep(firstDisc.step);
                    navigate(`?mode=${(formMode || 'New').toLowerCase()}&step=${firstDisc.step}`);
                  }
                  if (firstDisc?.field) {
                    setTimeout(() => scrollToField(firstDisc.field), 150);
                  }
                }}
                className="w-full py-2.5 px-4 rounded-lg bg-[#F6F5F3] hover:bg-[#E4E1DC] dark:bg-[#2E2A27] dark:hover:bg-[#3D3834] text-[#1F1D1B] dark:text-[#EAE7E1] font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                <span>Review &amp; Edit Details</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDiscrepancyModal({ isOpen: false, discrepancies: [] });
                  handleSubmit(null, true);
                }}
                className="w-full py-2.5 px-4 rounded-lg bg-[#9E2A2B] hover:bg-[#7A1B22] text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                <span>Proceed &amp; Submit Anyway</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draft Resume Confirmation Modal */}
      {draftResumeModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-[#1C1917] rounded-lg p-6 sm:p-7 shadow-xl border border-[#E4E1DC] dark:border-[#2E2A27] text-center">
            
            {/* Modal Icon */}
            <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <Clock className="w-6 h-6" />
            </div>

            {/* Modal Title */}
            <h3 className="text-lg sm:text-xl font-bold text-[#1F1D1B] dark:text-[#EAE7E1] mb-2">
              Resume In-Progress Application?
            </h3>

            {/* Modal Description */}
            <p className="text-xs sm:text-sm text-[#6B6761] dark:text-[#A8A29E] mb-5 leading-relaxed">
              You have an in-progress draft saved at <span className="font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">{draftResumeModal.savedTime}</span> (Step {draftResumeModal.step} of 4). Would you like to pick up where you left off?
            </p>

            {/* Draft Details Preview */}
            {draftResumeModal.draftData?.formData && (
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-4 mb-6 text-left text-xs sm:text-sm space-y-2">
                <div className="flex justify-between items-center text-[#6B6761] dark:text-[#A8A29E]">
                  <span>Progress:</span>
                  <span className="font-bold text-[#9E2A2B] dark:text-[#D4AF37]">
                    Step {draftResumeModal.step} of 4
                  </span>
                </div>
                {draftResumeModal.draftData.formData.plateNo && (
                  <div className="flex justify-between items-center text-[#6B6761] dark:text-[#A8A29E]">
                    <span>Plate No:</span>
                    <span className="font-mono font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                      {draftResumeModal.draftData.formData.plateNo}
                    </span>
                  </div>
                )}
                {draftResumeModal.draftData.formData.make && (
                  <div className="flex justify-between items-center text-[#6B6761] dark:text-[#A8A29E]">
                    <span>Model:</span>
                    <span className="font-medium text-[#1F1D1B] dark:text-[#EAE7E1]">
                      {draftResumeModal.draftData.formData.make}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleConfirmResumeDraft}
                className="w-full py-2.5 px-4 rounded-lg bg-[#9E2A2B] hover:bg-[#7A1B22] text-white font-bold text-sm shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Continue Draft</span>
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="w-full py-2.5 px-4 rounded-lg bg-[#F6F5F3] hover:bg-[#E4E1DC] dark:bg-[#2E2A27] dark:hover:bg-[#3D3834] text-[#1F1D1B] dark:text-[#EAE7E1] font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Start Fresh</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </MainLayout>
  );
};

export default ApplyFranchise;
