import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { 
  UploadCloud, CheckCircle, FileCheck, Info, RefreshCw, PlusCircle, 
  ArrowLeft, AlertCircle, Loader2, X, CalendarDays, ZoomIn, 
  User, FileText, ChevronRight, ChevronLeft, ShieldCheck, Car
} from 'lucide-react';

const TODA_LIST = [
  "BATODA", "POB TODA", "NBI TODA", "GT TODA", "TIGUION TODA", 
  "BANGBANG–IPIL TODA", "TAB TODA", "LUG TODA (incl. LUGTODA)", 
  "MASIGA TODA", "4B TODA", "CT TODA", "TG TODA", "GC TODA", 
  "MA TODA", "PG TODA", "MAT TODA (incl. MATODA / MAT. GASAN TODA)", 
  "DPAB TODA", "MGN TODA", "GSTODA", "GS TODA", "TTODA", 
  "TC TODA", "NORTH TODA", "GASAN CENTRAL TODA", "BAHI TODA", 
  "ILAYA TODA", "GTF TODA", 
  "NON-TODA"
];

const GASAN_BARANGAYS = [
  "Antipolo", "Bachao Ibaba", "Bachao Ilaya", "Bacong-Bacong", "Bahi", 
  "Bangbang", "Banot", "Banuyo", "Bognuyan", "Cabugao", "Dawis", "Dili", 
  "Libtangin", "Mahunig", "Mangiliol", "Masiga", "Matandang Gasan", "Pangi", 
  "Pinggan", "Tabionan", "Tiguion", "Tremol", "Tulingon", 
  "Barangay I (Poblacion)", "Barangay II (Poblacion)", "Barangay III (Poblacion)"
];

const REQUIREMENTS_LIST = [
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
  
  // MULTI-STEP PROGRESS STATE (Step 1, 2, 3)
  const [currentStep, setCurrentStep] = useState(1);

  // CUSTOM TOAST NOTIFICATION STATE
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // DOCUMENT PREVIEW MODAL STATE
  const [fullPreview, setFullPreview] = useState(null);
  
  const [formData, setFormData] = useState({
    fullName: '', address: '', zone: '', made: '', make: '', motorNo: '', chassisNo: '', plateNo: '', todaName: '',
    dateApplied: '', cedulaDate: '', cedulaAddress: 'Gasan, Marinduque', 
    cedulaSerialNo: ''
  });
  
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [filePreviews, setFilePreviews] = useState({});

  useEffect(() => {
    fetchMyFranchises();
    const reapplyData = localStorage.getItem('reapply_target');
    if (reapplyData) {
      try {
        const parsed = JSON.parse(reapplyData);
        handleReapplyClick(parsed);
        localStorage.removeItem('reapply_target');
      } catch (e) { console.error(e); }
    }
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

  const handleRenewClick = (franchise) => {
    setFormMode('Renewal');
    setSelectedId(franchise._id);
    setCurrentStep(1);
    setFilePreviews({});
    
    setFormData({
      fullName: franchise.fullName || '',
      address: franchise.address || '',
      zone: franchise.zone || '',
      made: franchise.made || '', 
      make: franchise.make || '',
      motorNo: franchise.motorNo || '',
      chassisNo: franchise.chassisNo || '',
      plateNo: franchise.plateNo || '',
      todaName: franchise.todaName || '',
      dateApplied: '', cedulaDate: '', 
      cedulaAddress: 'Gasan, Marinduque', 
      cedulaSerialNo: ''
    });
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
      todaName: franchise.todaName || '',
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (reqId, file) => {
    if (file) {
      setUploadedDocs(prev => ({ ...prev, [reqId]: file }));
      setFilePreviews(prev => ({ ...prev, [reqId]: URL.createObjectURL(file) }));
    }
  };

  const handleRemoveFile = (reqId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
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

  // VALIDATION PER STEP BAGO PUMUNTA SA SUSUNOD
  const validateAndNext = () => {
    if (currentStep === 1) {
      if (!formData.fullName || !formData.address || !formData.zone || !formData.make || !formData.made || !formData.todaName || !formData.motorNo || !formData.chassisNo || !formData.plateNo) {
        showToast("Pakipunan ang lahat ng kinakailangang impormasyon sa Step 1.", "error");
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.dateApplied || !formData.cedulaDate || !formData.cedulaSerialNo || !formData.cedulaAddress) {
        showToast("Pakilagay ang kumpletong detalye ng Cedula sa Step 2.", "error");
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
    
    // Check if requirements are uploaded in Step 3 for New/Re-apply
    if (formMode === 'New') {
      const missing = REQUIREMENTS_LIST.filter(req => !uploadedDocs[req.id]);
      if (missing.length > 0) {
        showToast("Pakisiguradong kumpleto ang 4 na in-upload na requirements.", "error");
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
        
        REQUIREMENTS_LIST.forEach(req => {
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
        showToast(`Franchise ${formMode} Application Submitted Successfully!`, "success");
        setFormMode(null);
        setCurrentStep(1);
        fetchMyFranchises(); 
        setUploadedDocs({});
        setFilePreviews({});
      } else {
        showToast(data.message || data.error || 'Failed to submit application.', 'error');
      }
    } catch (error) {
      showToast('Network error. Cannot connect to server.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-2 focus:ring-[#7A1B22]/20 transition-all";
  const disabledClasses = "w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 outline-none cursor-not-allowed";

  let loggedInUserName = localStorage.getItem('name') || '';
  let loggedInAddress = ''; 
  let loggedInToda = ''; 

  const userObj = localStorage.getItem('user');
  if (userObj) {
    try {
      const parsedUser = JSON.parse(userObj);
      if (!loggedInUserName) loggedInUserName = parsedUser.name || '';
      if (parsedUser.address) loggedInAddress = parsedUser.address; 
      if (parsedUser.todaAssociation) loggedInToda = parsedUser.todaAssociation; 
    } catch (e) { console.error(e); }
  }

  // LIST / DASHBOARD VIEW OF UNITS
  if (formMode === null) {
    return (
      <MainLayout>
        {/* CUSTOM TOAST NOTIFICATION */}
        {toast.show && (
          <div className="fixed top-6 right-6 z-[999] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className={`px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border ${
              toast.type === 'error' ? 'bg-red-600 border-red-500 text-white' : 'bg-emerald-600 border-emerald-500 text-white'
            }`}>
              {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
              <span className="font-bold text-sm tracking-wide">{toast.message}</span>
            </div>
          </div>
        )}

        <header className="mb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Franchises</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage your active tricycle units and pending franchise applications.</p>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="animate-spin text-[#7A1B22]" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
            {myFranchises.map((unit, index) => (
              <div key={unit._id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="absolute top-0 right-0 w-2 h-full bg-[#7A1B22]" />
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Unit {index + 1}</h3>
                  <div className="text-2xl font-black text-slate-900 mb-1">{unit.plateNo || 'PENDING PLATE'}</div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{unit.todaName} &bull; {unit.make} ({unit.made})</p>
                </div>
                
                <div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                    <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1.5 border shadow-xs ${
                      unit.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      unit.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                      unit.status === 'Expired' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      unit.status === 'Ready for Pickup' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {(unit.status === 'Cancelled' || unit.status === 'Expired') && <AlertCircle size={13}/>}
                      {unit.status === 'Active' && <CheckCircle size={13}/>}
                      {unit.status === 'Ready for Pickup' ? 'Awaiting Payment' : unit.status}
                    </span>
                    
                    {unit.status === 'Expired' && (
                      <button 
                        onClick={() => handleRenewClick(unit)}
                        className="text-xs font-bold bg-[#7A1B22] text-white px-4 py-2 rounded-xl hover:bg-[#5A1419] transition-colors flex items-center gap-2 shadow-xs active:scale-95"
                      >
                        <RefreshCw size={14} /> Renew Now
                      </button>
                    )}

                    {unit.status === 'Cancelled' && (
                      <button 
                        onClick={() => handleReapplyClick(unit)}
                        className="text-xs font-bold bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-xs active:scale-95"
                      >
                        <RefreshCw size={14} /> Fix Issues
                      </button>
                    )}
                  </div>

                  {unit.status === 'Active' && (
                    <div className="mt-4 bg-emerald-50/60 border border-emerald-100 p-3.5 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-emerald-600" />
                        <div>
                          <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">Validity</p>
                          <p className="text-xs font-black text-emerald-900">1 Year</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">Expires On</p>
                        <p className="text-xs font-black text-emerald-900">{getExpirationDate(unit.dateApplied)}</p>
                      </div>
                    </div>
                  )}

                  {unit.status === 'Cancelled' && (
                    <div className="mt-4 bg-red-50 border border-red-200 p-4 rounded-2xl">
                      <h4 className="text-red-900 font-black text-[10px] uppercase mb-1 flex items-center gap-1.5">
                        <AlertCircle size={14} className="text-red-600" /> Reason for Rejection
                      </h4>
                      <p className="text-xs font-medium text-red-700 leading-snug">
                        {unit.cancelReason || 'LGU did not provide a specific reason. Please visit the office.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {myFranchises.length < 2 ? (
              <button 
                onClick={() => {
                  setFormMode('New');
                  setCurrentStep(1);
                  setFilePreviews({});
                  setFormData({ 
                    fullName: loggedInUserName, 
                    address: loggedInAddress, 
                    zone: '', made: '', make: '', motorNo: '', chassisNo: '', plateNo: '', 
                    todaName: loggedInToda, 
                    dateApplied: '', cedulaDate: '', 
                    cedulaAddress: 'Gasan, Marinduque', 
                    cedulaSerialNo: '' 
                  });
                }}
                className="bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 rounded-3xl p-6 flex flex-col items-center justify-center text-slate-500 hover:text-[#7A1B22] hover:border-[#7A1B22]/50 transition-all min-h-[200px] group active:scale-98"
              >
                <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:border-[#7A1B22]/30 transition-all">
                  <PlusCircle size={30} className="text-[#7A1B22]" />
                </div>
                <span className="font-black text-sm text-slate-800">Apply New Franchise</span>
                <span className="text-[11px] font-semibold text-slate-400 mt-0.5">Capacity Available ({2 - myFranchises.length} slot left)</span>
              </button>
            ) : (
              <div className="bg-red-50/60 border border-red-200 rounded-3xl p-6 flex flex-col items-center justify-center text-red-700 min-h-[200px] text-center">
                <AlertCircle size={32} className="mb-2.5 opacity-60 text-red-600" />
                <span className="font-black text-sm text-red-900">Maximum Limit Reached</span>
                <span className="text-xs font-medium mt-1 px-4 text-red-600 leading-snug">You have reached the maximum allowed limit of 2 registered tricycle units per operator.</span>
              </div>
            )}
          </div>
        )}
      </MainLayout>
    );
  }

  // MULTI-STEP WIZARD FORM VIEW
  const steps = [
    { num: 1, title: 'Vehicle & Operator', icon: <Car size={16} /> },
    { num: 2, title: 'Cedula & Tax Info', icon: <FileText size={16} /> },
    { num: 3, title: 'Upload & Review', icon: <UploadCloud size={16} /> }
  ];

  const progressPercentage = formMode === 'Renewal' ? (currentStep === 1 ? 50 : 100) : ((currentStep - 1) / 2) * 100;

  return (
    <MainLayout>
      {/* CUSTOM TOAST NOTIFICATION */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-[999] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border ${
            toast.type === 'error' ? 'bg-red-600 border-red-500 text-white' : 'bg-emerald-600 border-emerald-500 text-white'
          }`}>
            {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
            <span className="font-bold text-sm tracking-wide">{toast.message}</span>
          </div>
        </div>
      )}

      {/* OPERATOR FULL-SCREEN DOCUMENT PREVIEW MODAL */}
      {fullPreview && (
        <div className="fixed inset-0 z-[200] bg-slate-900/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="flex justify-between items-center w-full max-w-5xl mb-4">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <ShieldCheck size={20} className="text-[#D4AF37]" /> {fullPreview.title} Preview
            </h3>
            <button onClick={() => setFullPreview(null)} className="text-white hover:text-red-400 bg-white/10 p-2 rounded-xl transition-colors">
              <X size={22} />
            </button>
          </div>
          {fullPreview.url.toLowerCase().includes('.pdf') ? (
            <iframe src={fullPreview.url} className="w-full max-w-5xl h-[75vh] bg-white rounded-2xl shadow-2xl" title="PDF Preview" />
          ) : (
            <img src={fullPreview.url} alt="Preview" className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl bg-slate-800" />
          )}
        </div>
      )}

      <header className="mb-6 max-w-4xl">
        <button 
          onClick={() => { setFormMode(null); setCurrentStep(1); }} 
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-4"
        >
          <ArrowLeft size={16} /> Back to My Units
        </button>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {formMode === 'New' ? 'Franchise Registration Wizard' : formMode === 'Renewal' ? 'Franchise Renewal Wizard' : 'Fix Application Issue'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {formMode === 'Renewal' ? 'Verify your auto-filled records and update your Cedula tax details.' : 'Complete the step-by-step application form and upload your valid requirements.'}
        </p>
      </header>

      {/* MULTI-STEP PROGRESS BAR & STEPPER HEADER */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-4xl mb-6">
        <div className="relative mb-6">
          {/* Background Track Line */}
          <div className="absolute top-1/2 left-0 w-full h-1.5 bg-slate-100 -translate-y-1/2 rounded-full z-0" />
          
          {/* Animated Active Progress Line */}
          <div 
            className="absolute top-1/2 left-0 h-1.5 bg-[#7A1B22] -translate-y-1/2 rounded-full transition-all duration-500 ease-out z-0"
            style={{ width: `${progressPercentage}%` }}
          />

          {/* Stepper Node Icons */}
          <div className="relative z-10 flex justify-between items-center">
            {steps.map((step) => {
              const isCompleted = currentStep > step.num;
              const isCurrent = currentStep === step.num;

              return (
                <div key={step.num} className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs transition-all duration-300 shadow-sm border-2 ${
                      isCompleted 
                        ? 'bg-[#7A1B22] border-[#7A1B22] text-white' 
                        : isCurrent 
                        ? 'bg-white border-[#7A1B22] text-[#7A1B22] ring-4 ring-[#7A1B22]/15 scale-110' 
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle size={18} /> : step.icon}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-bold mt-2 text-center uppercase tracking-wider ${
                    isCurrent ? 'text-[#7A1B22]' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                  }`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FORM CONTAINER */}
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        
        {/* ========================================================================= */}
        {/* STEP 1: OPERATOR & VEHICLE DETAILS */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-left-4 duration-200">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <Car className="text-[#7A1B22]" size={20} />
              <div>
                <h2 className="text-base font-black text-slate-900">Step 1: Vehicle & Operator Information</h2>
                <p className="text-xs text-slate-400 font-medium">Verify your registered unit specifications</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Full Name</label>
                <input 
                  type="text" 
                  name="fullName" 
                  value={formData.fullName} 
                  onChange={handleInputChange} 
                  className={formMode === 'Renewal' || formMode === 'Re-apply' ? disabledClasses : inputClasses} 
                  required 
                  readOnly={formMode === 'Renewal' || formMode === 'Re-apply'} 
                  placeholder="e.g. Juan Dela Cruz"
                />
              </div>
              
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Address (Barangay)</label>
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
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Route Zone</label>
                <input type="text" name="zone" value={formData.zone} onChange={handleInputChange} className={formMode === 'Renewal' || formMode === 'Re-apply' ? disabledClasses : inputClasses} required readOnly={formMode === 'Renewal' || formMode === 'Re-apply'} placeholder="e.g. Zone 1" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Year Made</label>
                <input type="text" name="made" value={formData.made} onChange={handleInputChange} className={formMode === 'Renewal' || formMode === 'Re-apply' ? disabledClasses : inputClasses} required readOnly={formMode === 'Renewal' || formMode === 'Re-apply'} placeholder="e.g. 2024" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Make / Brand</label>
                <input type="text" name="make" value={formData.make} onChange={handleInputChange} className={formMode === 'Renewal' || formMode === 'Re-apply' ? disabledClasses : inputClasses} required readOnly={formMode === 'Renewal' || formMode === 'Re-apply'} placeholder="e.g. Honda / Kawasaki" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">TODA Association</label>
                {formMode === 'Renewal' || formMode === 'Re-apply' ? (
                  <input type="text" value={formData.todaName} className={disabledClasses} readOnly />
                ) : (
                  <select name="todaName" value={formData.todaName} onChange={handleInputChange} className={`${inputClasses} cursor-pointer`} required>
                    <option value="">Select TODA...</option>
                    {TODA_LIST.map((toda, i) => <option key={i} value={toda}>{toda}</option>)}
                  </select>
                )}
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Motor Number</label>
                <input type="text" name="motorNo" value={formData.motorNo} onChange={handleInputChange} className={formMode === 'Renewal' || formMode === 'Re-apply' ? disabledClasses : inputClasses} required readOnly={formMode === 'Renewal' || formMode === 'Re-apply'} placeholder="Motor Serial No." />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Chassis Number</label>
                <input type="text" name="chassisNo" value={formData.chassisNo} onChange={handleInputChange} className={formMode === 'Renewal' || formMode === 'Re-apply' ? disabledClasses : inputClasses} required readOnly={formMode === 'Renewal' || formMode === 'Re-apply'} placeholder="Chassis Serial No." />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assigned Plate No.</label>
                <input type="text" name="plateNo" value={formData.plateNo} onChange={handleInputChange} className={formMode === 'Renewal' || formMode === 'Re-apply' ? disabledClasses : inputClasses} required readOnly={formMode === 'Renewal' || formMode === 'Re-apply'} placeholder="e.g. 123-ABC" />
              </div>
            </div>

            <div className="flex justify-end mt-8 border-t border-slate-100 pt-4">
              <button 
                type="button" 
                onClick={validateAndNext}
                className="flex items-center gap-2 bg-[#7A1B22] text-white px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:bg-[#5A1419] transition-all shadow-sm active:scale-95"
              >
                Next Step <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: TAX IDENTIFICATION & CEDULA */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-left-4 duration-200">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <FileText className="text-[#7A1B22]" size={20} />
              <div>
                <h2 className="text-base font-black text-slate-900">Step 2: Cedula & Tax Identification</h2>
                <p className="text-xs text-slate-400 font-medium">Provide your latest community tax certificate records</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date Applied</label>
                <input type="date" name="dateApplied" value={formData.dateApplied} onChange={handleInputChange} className={inputClasses} required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date Kinuha (Cedula)</label>
                <input type="date" name="cedulaDate" value={formData.cedulaDate} onChange={handleInputChange} className={inputClasses} required />
              </div>
              <div className="lg:col-span-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cedula Serial No.</label>
                <input type="text" name="cedulaSerialNo" value={formData.cedulaSerialNo} onChange={handleInputChange} className={inputClasses} placeholder="e.g. 12345678" required />
              </div>
              <div className="lg:col-span-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cedula Address</label>
                <input type="text" name="cedulaAddress" value={formData.cedulaAddress} onChange={handleInputChange} className={inputClasses} required />
              </div>
            </div>

            <div className="flex justify-between items-center mt-8 border-t border-slate-100 pt-4">
              <button 
                type="button" 
                onClick={prevStep}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <ChevronLeft size={16} /> Previous
              </button>

              <button 
                type="button" 
                onClick={validateAndNext}
                className="flex items-center gap-2 bg-[#7A1B22] text-white px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:bg-[#5A1419] transition-all shadow-sm active:scale-95"
              >
                Next Step <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: UPLOAD REQUIREMENTS & FINAL SUBMIT */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-left-4 duration-200">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <UploadCloud className="text-[#7A1B22]" size={20} />
              <div>
                <h2 className="text-base font-black text-slate-900">Step 3: Document Requirements Verification</h2>
                <p className="text-xs text-slate-400 font-medium">Upload clear photos or PDF documents and verify before submitting</p>
              </div>
            </div>

            {formMode === 'Renewal' ? (
              <div className="p-6 bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl text-xs font-semibold mb-6 flex items-start gap-3">
                <Info size={18} className="shrink-0 mt-0.5" />
                <p>No new physical files are required for simple renewal. Review your vehicle & cedula details before final submission.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {REQUIREMENTS_LIST.map((req) => {
                  const hasFile = !!filePreviews[req.id];
                  const isPdf = filePreviews[req.id]?.toLowerCase().includes('.pdf');

                  return (
                    <div 
                      key={req.id} 
                      className={`relative border-2 border-dashed rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all min-h-[150px] overflow-hidden group ${
                        hasFile ? 'bg-emerald-50/50 border-emerald-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-[#7A1B22]/50'
                      }`}
                    >
                      {hasFile && (
                        <button
                          onClick={(e) => handleRemoveFile(req.id, e)}
                          className="absolute top-2 right-2 z-30 p-1 bg-red-500 text-white rounded-full hover:bg-red-700 shadow-md transition-all scale-100 active:scale-95"
                          title="Remove Document"
                        >
                          <X size={14} />
                        </button>
                      )}

                      {!hasFile ? (
                        <>
                          <input 
                            type="file" 
                            accept=".pdf, image/*"
                            onChange={(e) => handleFileChange(req.id, e.target.files[0])}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                            required={formMode === 'New'} 
                          />
                          <UploadCloud className="text-slate-400 mb-2 group-hover:text-[#7A1B22] transition-colors" size={28} />
                          <p className="text-xs font-bold text-slate-700">{req.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Tap to upload</p>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center z-10">
                          {isPdf ? (
                            <div className="flex flex-col items-center p-2 cursor-pointer" onClick={() => setFullPreview({ url: filePreviews[req.id], title: req.label })}>
                              <FileCheck size={32} className="text-emerald-600 mb-1" />
                              <p className="text-[11px] font-bold text-emerald-800 tracking-tight text-center line-clamp-2">{req.label}</p>
                              <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded mt-1">PDF &bull; Click to View</span>
                            </div>
                          ) : (
                            <div 
                              onClick={() => setFullPreview({ url: filePreviews[req.id], title: req.label })}
                              className="relative w-full h-28 flex items-center justify-center rounded-xl overflow-hidden bg-white border border-emerald-100 shadow-inner cursor-pointer"
                            >
                              <img 
                                src={filePreviews[req.id]} 
                                alt={req.label} 
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <ZoomIn className="text-white" size={22} />
                              </div>
                              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                                <p className="text-[9px] font-bold text-white truncate w-full text-center py-0.5 rounded">{req.label}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* REVIEW SUMMARY SUMMARY CARD */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 sm:p-5 mb-8">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">Application Summary Review</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div><span className="text-slate-400 font-bold block text-[10px]">Operator:</span><span className="font-bold text-slate-800">{formData.fullName}</span></div>
                <div><span className="text-slate-400 font-bold block text-[10px]">Plate No:</span><span className="font-black text-slate-900">{formData.plateNo}</span></div>
                <div><span className="text-slate-400 font-bold block text-[10px]">TODA:</span><span className="font-bold text-slate-800">{formData.todaName}</span></div>
                <div><span className="text-slate-400 font-bold block text-[10px]">Route:</span><span className="font-bold text-slate-800">Zone {formData.zone}</span></div>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-slate-100 pt-4">
              <button 
                type="button" 
                onClick={prevStep}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <ChevronLeft size={16} /> Previous
              </button>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-xs sm:text-sm text-white transition-all shadow-sm active:scale-95 ${
                  isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#7A1B22] hover:bg-[#5A1419]'
                }`}
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <FileCheck size={16} />}
                {isSubmitting ? 'Submitting Application...' : formMode === 'Re-apply' ? 'Submit Updated Application' : `Submit ${formMode} Application`}
              </button>
            </div>
          </div>
        )}

      </form>
    </MainLayout>
  );
};

export default ApplyFranchise;