import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { 
  UploadCloud, CheckCircle, FileCheck, Info, RefreshCw, 
  PlusCircle, ArrowLeft, AlertCircle, Loader2, X, CalendarDays, Eye, ZoomIn, ZoomOut 
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
  
  const [formData, setFormData] = useState({
    fullName: '', address: '', zone: '', made: '', make: '', motorNo: '', chassisNo: '', plateNo: '', todaName: '',
    dateApplied: '', cedulaDate: '', cedulaAddress: 'Gasan, Marinduque', 
    cedulaSerialNo: ''
  });
  
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [filePreviews, setFilePreviews] = useState({});
  
  // MODAL PREVIEW STATE PARA SA OPERATOR
  const [activePreview, setActivePreview] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
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

        const url = formMode === 'Re-apply' ? `${import.meta.env.VITE_API_URL}/api/v1/franchises/${selectedId}` : import.meta.env.VITE_API_URL + '/api/v1/franchises';
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
        alert(`Franchise ${formMode} Application Submitted Successfully!`);
        setFormMode(null);
        fetchMyFranchises(); 
        setUploadedDocs({});
        setFilePreviews({});
      } else {
        alert(data.message || data.error || 'Failed to submit application.');
      }
    } catch (error) {
      alert('Network error. Cannot connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-2 focus:ring-[#7A1B22]/20 transition-all";
  const disabledClasses = "w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 outline-none cursor-not-allowed";

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

  return (
    <MainLayout>
      {/* OPERATOR DOCUMENT FULL PREVIEW MODAL */}
      {activePreview && (
        <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Eye size={18} className="text-[#7A1B22]" /> {activePreview.label} Preview
              </h3>
              <button 
                onClick={() => setActivePreview(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto my-4 flex items-center justify-center bg-slate-50 rounded-2xl p-2 border border-slate-100">
              {activePreview.url.toLowerCase().includes('.pdf') ? (
                <iframe src={activePreview.url} className="w-full h-96 rounded-xl" title="PDF Preview" />
              ) : (
                <img src={activePreview.url} alt="Document Preview" className="max-h-[60vh] object-contain rounded-xl shadow-xs" />
              )}
            </div>

            <button 
              onClick={() => setActivePreview(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Done Previewing
            </button>
          </div>
        </div>
      )}

      {formMode === null ? (
        <div>
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Franchises</h1>
            <p className="text-sm text-slate-500 mt-1">Manage your active units and pending applications.</p>
          </header>

          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="animate-spin text-[#7A1B22]" size={32} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
              {myFranchises.map((unit, index) => (
                <div key={unit._id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="absolute top-0 right-0 w-2 h-full bg-[#7A1B22]" />
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Unit {index + 1}</h3>
                    <div className="text-2xl font-bold text-slate-900 mb-2">{unit.plateNo || 'PENDING PLATE'}</div>
                    <p className="text-sm font-medium text-slate-600 mb-4">{unit.todaName} - {unit.make}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                      <span className={`px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-wide flex items-center gap-1 ${
                        unit.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                        unit.status === 'Ready for Pickup' ? 'bg-blue-100 text-blue-700 font-black' :
                        unit.status === 'Approved' ? 'bg-indigo-100 text-indigo-700' :
                        unit.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        unit.status === 'Expired' ? 'bg-orange-100 text-orange-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {(unit.status === 'Cancelled' || unit.status === 'Expired') && <AlertCircle size={12}/>}
                        {unit.status === 'Ready for Pickup' ? 'Ready for Pickup at OVM' : `Status: ${unit.status}`}
                      </span>
                      
                      {unit.status === 'Expired' && (
                        <button 
                          onClick={() => handleRenewClick(unit)}
                          className="text-xs font-bold bg-[#7A1B22] text-white px-4 py-2 rounded-lg hover:bg-[#5A1419] transition-colors flex items-center gap-2"
                        >
                          <RefreshCw size={14} /> Renew Now
                        </button>
                      )}

                      {unit.status === 'Cancelled' && (
                        <button 
                          onClick={() => handleReapplyClick(unit)}
                          className="text-xs font-bold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                        >
                          <RefreshCw size={14} /> Fix Issue
                        </button>
                      )}
                    </div>

                    {unit.status === 'Active' && (
                      <div className="mt-4 bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CalendarDays size={16} className="text-emerald-600" />
                          <div>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Validity</p>
                            <p className="text-xs font-bold text-emerald-900">1 Year</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Expires On</p>
                          <p className="text-xs font-bold text-emerald-900">{getExpirationDate(unit.dateApplied)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {myFranchises.length < 2 ? (
                <button 
                  onClick={() => {
                    setFormMode('New');
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
                  className="bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-500 hover:text-[#7A1B22] hover:border-[#7A1B22]/50 transition-all min-h-[180px]"
                >
                  <PlusCircle size={36} className="mb-3" />
                  <span className="font-bold">Apply New Franchise</span>
                  <span className="text-xs mt-1">Slot Available ({2 - myFranchises.length} left)</span>
                </button>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col items-center justify-center text-red-700 min-h-[180px] text-center">
                  <AlertCircle size={36} className="mb-3 opacity-50" />
                  <span className="font-bold">Limit Reached</span>
                  <span className="text-xs mt-1 px-4">You have reached the maximum limit of 2 tricycle units per operator.</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div>
          <header className="mb-6">
            <button 
              onClick={() => setFormMode(null)} 
              className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors mb-4"
            >
              <ArrowLeft size={16} /> Back to My Units
            </button>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {formMode === 'New' ? 'Apply New Franchise' : formMode === 'Renewal' ? 'Renew Franchise' : 'Fix Application Issue'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {formMode === 'Renewal' ? 'Your details are auto-filled. Please update your Cedula information.' : 'Complete the form and click on uploaded thumbnails to preview files before submitting.'}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">Vehicle & Operator Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                  <input 
                    type="text" 
                    name="fullName" 
                    value={formData.fullName} 
                    onChange={handleInputChange} 
                    className={formMode === 'Renewal' || formMode === 'Re-apply' ? disabledClasses : inputClasses} 
                    required 
                    readOnly={formMode === 'Renewal' || formMode === 'Re-apply'} 
                  />
                </div>
                
                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address (Barangay)</label>
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
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Zone</label>
                  <input type="text" name="zone" value={formData.zone} onChange={handleInputChange} className={formMode === 'Renewal' || formMode === 'Re-apply' ? disabledClasses : inputClasses} required readOnly={formMode === 'Renewal' || formMode === 'Re-apply'} placeholder="e.g. Zone 1" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Made (Year)</label>
                  <input type="text" name="made" value={formData.made} onChange={handleInputChange} className={formMode === 'Renewal' || formMode === 'Re-apply' ? disabledClasses : inputClasses} required readOnly={formMode === 'Renewal' || formMode === 'Re-apply'} placeholder="e.g. 2021" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Make / Brand</label>
                  <input type="text" name="make" value={formData.make} onChange={handleInputChange} className={formMode === 'Renewal' || formMode === 'Re-apply' ? disabledClasses : inputClasses} required readOnly={formMode === 'Renewal' || formMode === 'Re-apply'} placeholder="e.g. Honda" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">TODA Name</label>
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
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Motor No.</label>
                  <input type="text" name="motorNo" value={formData.motorNo} onChange={handleInputChange} className={formMode === 'Renewal' || formMode === 'Re-apply' ? disabledClasses : inputClasses} required readOnly={formMode === 'Renewal' || formMode === 'Re-apply'} />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Chassis No.</label>
                  <input type="text" name="chassisNo" value={formData.chassisNo} onChange={handleInputChange} className={formMode === 'Renewal' || formMode === 'Re-apply' ? disabledClasses : inputClasses} required readOnly={formMode === 'Renewal' || formMode === 'Re-apply'} />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Plate No.</label>
                  <input type="text" name="plateNo" value={formData.plateNo} onChange={handleInputChange} className={formMode === 'Renewal' || formMode === 'Re-apply' ? disabledClasses : inputClasses} required readOnly={formMode === 'Renewal' || formMode === 'Re-apply'} />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">Tax Identification / Cedula</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date Applied</label>
                  <input type="date" name="dateApplied" value={formData.dateApplied} onChange={handleInputChange} className={inputClasses} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date Kinuha (Cedula)</label>
                  <input type="date" name="cedulaDate" value={formData.cedulaDate} onChange={handleInputChange} className={inputClasses} required />
                </div>
                <div className="lg:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Serial No.</label>
                  <input type="text" name="cedulaSerialNo" value={formData.cedulaSerialNo} onChange={handleInputChange} className={inputClasses} placeholder="e.g. 12345678" required />
                </div>
                <div className="lg:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cedula Address</label>
                  <input type="text" name="cedulaAddress" value={formData.cedulaAddress} onChange={handleInputChange} className={inputClasses} required />
                </div>
              </div>
            </div>

            {formMode !== 'Renewal' && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-900 mb-1">Upload Requirements</h2>
                <p className="text-xs text-slate-500 mb-4">Click anywhere on uploaded thumbnails to view a high-resolution preview.</p>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {REQUIREMENTS_LIST.map((req) => {
                    const hasFile = !!filePreviews[req.id];
                    const isPdf = filePreviews[req.id]?.toLowerCase().includes('.pdf');

                    return (
                      <div 
                        key={req.id} 
                        className={`relative border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all min-h-[140px] overflow-hidden group ${
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
                          <div 
                            onClick={() => setActivePreview({ url: filePreviews[req.id], label: req.label })}
                            className="w-full h-full flex flex-col items-center justify-center z-10 cursor-pointer"
                            title="Click to preview full file"
                          >
                            {isPdf ? (
                              <div className="flex flex-col items-center p-2">
                                <FileCheck size={32} className="text-emerald-600 mb-1" />
                                <p className="text-[11px] font-bold text-emerald-800 tracking-tight text-center line-clamp-1">{req.label}</p>
                                <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded mt-1 flex items-center gap-1">
                                  <Eye size={10} /> Preview PDF
                                </span>
                              </div>
                            ) : (
                              <div className="relative w-full h-24 flex items-center justify-center rounded-lg overflow-hidden bg-white border border-emerald-100 shadow-inner group">
                                <img 
                                  src={filePreviews[req.id]} 
                                  alt={req.label} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                                  <Eye size={12} /> Click Preview
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full sm:w-auto px-8 py-3.5 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 ${
                isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#7A1B22] hover:bg-[#5A1419]'
              }`}
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <FileCheck size={18} />}
              {isSubmitting ? 'Submitting...' : formMode === 'Re-apply' ? 'Submit Updated Application' : `Submit ${formMode} Application`}
            </button>
          </form>
        </div>
      )}
    </MainLayout>
  );
};

export default ApplyFranchise;