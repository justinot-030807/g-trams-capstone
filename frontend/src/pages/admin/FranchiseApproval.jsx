import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout';
import { 
  CheckCircle, CheckCircle2, XCircle, Eye, FileText, AlertCircle, 
  X, Search, Loader2, ZoomIn, ZoomOut, RotateCw, Printer, ShieldCheck, Download,
  CalendarDays, User, Clock, ExternalLink, RefreshCw, CheckSquare, Square, 
  ChevronRight
} from 'lucide-react';
import { QueueListSkeleton } from '../../components/skeleton';

const REJECT_REASONS = [
  "Incomplete Requirements",
  "Expired or Invalid Driver's License",
  "Mismatch in Vehicle Details (Motor/Chassis No.)",
  "Invalid TODA Endorsement",
  "Fake or Tampered Documents",
  "Others (Please specify)"
];

const FranchiseApproval = () => {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Workstation state
  const [selectedApp, setSelectedApp] = useState(null); 
  const [activeDocKey, setActiveDocKey] = useState('orCr');
  const [checklist, setChecklist] = useState({
    orCr: false,
    license: false,
    toda: false,
    brgy: false
  });
  const [mobilePane, setMobilePane] = useState('details'); // 'details' | 'document'

  // Rejection & processing state
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Document viewer state
  const [zoomScale, setZoomScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Print modal state
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/franchises', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Sort by earliest submission date (FIFO queue)
        const queue = (Array.isArray(data) ? data : (data.data || []))
          .filter(app => app.status === 'Pending' || app.status === 'Ready for Pickup')
          .sort((a, b) => new Date(a.dateApplied || a.createdAt) - new Date(b.dateApplied || b.createdAt));
        
        setApplications(queue);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  const handleUpdateStatus = async (status) => {
    setIsProcessing(true);
    const finalReason = status === 'Cancelled' ? (rejectReason === 'Others (Please specify)' ? customReason : rejectReason) : '';

    if (status === 'Cancelled' && !finalReason.trim()) {
      showToast("Please provide a reason for rejection.", "error");
      setIsProcessing(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/${selectedApp._id}/status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: status, cancelReason: finalReason })
      });

      if (response.ok) {
        showToast(`Application status updated to ${status}!`, "success");
        setSelectedApp(null); 
        setIsRejecting(false);
        fetchApplications(); 
      } else {
        showToast('Failed to update status. Please try again.', 'error');
      }
    } catch (error) {
      showToast('Network error. Cannot connect to server.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset document controls & checklist when an application is opened
  const handleOpenWorkstation = (app) => {
    setSelectedApp(app);
    setIsRejecting(false);
    setZoomScale(1);
    setRotation(0);
    setMobilePane('details');

    // Default active doc to the first one available
    if (app.orCrUrl) setActiveDocKey('orCr');
    else if (app.licenseUrl) setActiveDocKey('license');
    else if (app.todaEndorsementUrl) setActiveDocKey('toda');
    else if (app.brgyClearanceUrl) setActiveDocKey('brgy');
    else setActiveDocKey('orCr');

    // Initialize checklist based on whether app is renewal or new
    setChecklist({
      orCr: app.applicationType === 'Renewal',
      license: app.applicationType === 'Renewal',
      toda: app.applicationType === 'Renewal',
      brgy: app.applicationType === 'Renewal'
    });
  };

  const toggleChecklistItem = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllChecklist = () => {
    const allChecked = Object.values(checklist).every(Boolean);
    setChecklist({
      orCr: !allChecked,
      license: !allChecked,
      toda: !allChecked,
      brgy: !allChecked
    });
  };

  const getExpirationDate = (dateApplied) => {
    if (!dateApplied) return 'N/A';
    const date = new Date(dateApplied);
    date.setFullYear(date.getFullYear() + 1); 
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const filteredApps = applications.filter(app => 
    (app.fullName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (app.plateNo?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (app.motorNo?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (app.todaName?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  // Documents list for workstation
  const docTabs = selectedApp ? [
    { key: 'orCr', label: 'OR / CR Document', url: selectedApp.orCrUrl, short: 'OR/CR' },
    { key: 'license', label: "Driver's License", url: selectedApp.licenseUrl, short: 'License' },
    { key: 'toda', label: 'TODA Endorsement', url: selectedApp.todaEndorsementUrl, short: 'TODA' },
    { key: 'brgy', label: 'Barangay Clearance', url: selectedApp.brgyClearanceUrl, short: 'Barangay' }
  ] : [];

  const currentDoc = docTabs.find(d => d.key === activeDocKey) || docTabs[0];
  const verifiedCount = Object.values(checklist).filter(Boolean).length;
  const isAllVerified = verifiedCount === 4;

  return (
    <MainLayout>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-document, #printable-document * { visibility: visible; }
          #printable-document { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

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


      {/* PRINT OFFICIAL PERMIT MODAL */}
      {isPrintOpen && selectedApp && (
        <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col">
          <div className="bg-slate-900 p-4 flex justify-between items-center text-white print:hidden">
            <h2 className="font-bold text-sm">Official MTOP Permit</h2>
            <div className="flex gap-2">
              <button onClick={() => setIsPrintOpen(false)} className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"><X size={14} /> Close</button>
              <button onClick={() => window.print()} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm">
                <Download size={14} /> Download / Save PDF
              </button>
              <button onClick={() => window.print()} className="px-4 py-1.5 bg-[#7A1B22] hover:bg-[#5A1419] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm">
                <Printer size={14} /> Print Document
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-8 print:p-0 print:bg-white flex justify-center items-start">
            <div id="printable-document" className="bg-white w-full max-w-[800px] border border-slate-200 shadow-xl p-12 print:border-none print:shadow-none relative">
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <ShieldCheck size={400} />
              </div>

              <div className="text-center mb-8 border-b-2 border-black pb-6">
                <p className="text-sm font-bold uppercase">Republic of the Philippines</p>
                <p className="text-sm font-bold uppercase">Province of Marinduque</p>
                <p className="text-lg font-black uppercase mt-1">Municipality of Gasan</p>
                <div className="mt-6 inline-block bg-black text-white px-8 py-2 border-4 border-black">
                  <h1 className="text-2xl font-black uppercase tracking-widest">Motorized Tricycle Operator's Permit</h1>
                </div>
                <p className="text-xs font-bold tracking-widest mt-2 text-[#7A1B22]">(OFFICIAL COPY)</p>
              </div>

              <div className="space-y-6 relative z-10">
                <p className="text-justify text-sm leading-relaxed">
                  This certifies that the person named below has been granted the franchise to operate a Motorized Tricycle-For-Hire within the authorized zones of the Municipality of Gasan, subject to existing local ordinances and national laws.
                </p>

                <div className="border border-black p-6 bg-slate-50/50 print:bg-white">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr><td className="py-2 font-bold w-1/3">Operator Name:</td><td className="py-2 border-b border-black/20 font-black">{selectedApp.fullName}</td></tr>
                      <tr><td className="py-2 font-bold">Address:</td><td className="py-2 border-b border-black/20">{selectedApp.address}</td></tr>
                      <tr><td className="py-2 font-bold">TODA Association:</td><td className="py-2 border-b border-black/20">{selectedApp.todaName}</td></tr>
                      <tr><td className="py-2 font-bold">Route / Zone:</td><td className="py-2 border-b border-black/20">{selectedApp.zone}</td></tr>
                    </tbody>
                  </table>
                </div>

                <div className="border border-black p-6 bg-slate-50/50 print:bg-white mt-4">
                  <h3 className="font-bold text-sm uppercase mb-3 border-b border-black pb-1">Vehicle Specifications</h3>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div><span className="font-bold">Make/Brand:</span> {selectedApp.make}</div>
                    <div><span className="font-bold">Year Model:</span> {selectedApp.made}</div>
                    <div><span className="font-bold">Motor Number:</span> {selectedApp.motorNo}</div>
                    <div><span className="font-bold">Chassis Number:</span> {selectedApp.chassisNo}</div>
                    <div className="col-span-2 mt-2">
                      <span className="font-bold mr-2">Assigned Plate Number:</span>
                      <span className="font-black border-2 border-black px-3 py-1 bg-slate-100 print:bg-white tracking-widest">{selectedApp.plateNo || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-between items-end text-sm">
                  <div>
                    <p className="font-bold">Approved On:</p>
                    <p className="font-black">{new Date(selectedApp.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-black">Valid Until:</p>
                    <p className="font-black underline decoration-2">{getExpirationDate(selectedApp.dateApplied)}</p>
                  </div>
                </div>

                <div className="mt-16 flex justify-end">
                  <div className="text-center w-64">
                    <div className="border-b-2 border-black mb-2"></div>
                    <p className="font-black text-sm uppercase">Municipal Mayor</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Authorized Signature</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t-2 border-black text-center">
                <p className="text-[10px] italic text-slate-500 print:text-black font-bold uppercase tracking-wider">This document serves as proof of franchise registration via the G-TRAMS Portal.</p>
                <p className="text-[9px] font-mono mt-1">System ID: {selectedApp._id}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="mb-6 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-[#7A1B22] rounded-full" />
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Pending Approvals</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Review and process franchise applications in queue (Oldest First).</p>
          </div>
        </div>
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search Name or Plate No..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-[#7A1B22] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-[#7A1B22]/15"
          />
        </div>
      </header>

      {isLoading ? (
        <QueueListSkeleton count={4} baseDelay={50} stepDelay={70} />
      ) : filteredApps.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400 transition-colors">
          <CheckCircle size={48} className="mx-auto mb-4 text-emerald-400 opacity-50" />
          <p className="font-bold text-base text-slate-800 dark:text-slate-200">All caught up!</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">There are no pending applications to review right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app, index) => (
            <div 
              key={app._id} 
              className="stagger-reveal bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-[#7A1B22]/30 dark:hover:border-[#D4AF37]/30"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${app.status === 'Ready for Pickup' ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400' : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'}`}>
                  {app.status === 'Ready for Pickup' ? <Printer size={22} /> : <FileText size={22} />}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Queue #{index + 1}
                    </span>
                    <h3 className="font-black text-slate-900 dark:text-white text-lg">
                      {app.fullName}
                    </h3>
                    {app.status === 'Ready for Pickup' && (
                      <span className="text-[10px] bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 uppercase font-black tracking-wider">
                        Awaiting Payment
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> 
                      Plate: {app.plateNo || 'PENDING'}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 
                      TODA: {app.todaName}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> 
                      Type: {app.applicationType || 'New'}
                    </span>
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-700">
                      <CalendarDays size={13} className="text-[#7A1B22] dark:text-[#D4AF37]" /> 
                      Submitted: {formatDate(app.dateApplied || app.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => handleOpenWorkstation(app)} 
                className="w-full md:w-auto bg-slate-900 dark:bg-slate-800 text-white hover:bg-[#7A1B22] dark:hover:bg-[#7A1B22] px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors active:scale-95 shadow-xs flex items-center justify-center gap-2"
              >
                Inspect Application <ChevronRight size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🖥️ SPLIT-SCREEN INSPECTION WORKSTATION (FULL MODAL WORKBENCH) */}
      {/* ========================================================================= */}
      {selectedApp && !isPrintOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
            onClick={() => setSelectedApp(null)} 
          />
          
          <div className="relative w-full h-[96vh] max-w-[1500px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10">
            
            {/* WORKSTATION TOP BAR */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#7A1B22] flex items-center justify-center text-[#D4AF37] font-black text-xs shrink-0 shadow-sm border border-[#D4AF37]/30">
                  <ShieldCheck size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-black text-base text-white tracking-tight truncate">
                      {selectedApp.fullName}
                    </h2>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/15">
                      {selectedApp.applicationType || 'New'} Application
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                      Plate: {selectedApp.plateNo || 'PENDING'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {selectedApp.todaName} &bull; Zone {selectedApp.zone} &bull; Submitted: {formatDate(selectedApp.dateApplied || selectedApp.createdAt)}
                  </p>
                </div>
              </div>

              {/* Mobile Pane Switcher (Tabs on < lg screens) */}
              <div className="flex lg:hidden items-center bg-slate-800 p-1 rounded-xl border border-white/10 text-xs font-bold">
                <button
                  onClick={() => setMobilePane('details')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${mobilePane === 'details' ? 'bg-[#7A1B22] text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
                >
                  Applicant Data
                </button>
                <button
                  onClick={() => setMobilePane('document')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${mobilePane === 'document' ? 'bg-[#7A1B22] text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
                >
                  Live Document
                </button>
              </div>

              {/* Top Bar Actions */}
              <div className="flex items-center gap-2">
                {selectedApp.status === 'Ready for Pickup' && (
                  <button
                    onClick={() => setIsPrintOpen(true)}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-white/15"
                  >
                    <Printer size={14} className="text-[#D4AF37]" /> Print MTOP
                  </button>
                )}
                <button 
                  onClick={() => setSelectedApp(null)} 
                  className="p-1.5 bg-white/10 hover:bg-red-500 text-white rounded-xl transition-colors"
                  title="Close Workstation (Esc)"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* WORKSTATION BODY: SPLIT VIEW */}
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
              
              {/* LEFT PANE: APPLICANT DATA & INSPECTION CHECKLIST (42% on desktop) */}
              <div className={`w-full lg:w-[42%] flex flex-col border-r border-slate-200 dark:border-slate-800 overflow-y-auto bg-white dark:bg-slate-900 ${
                mobilePane === 'details' ? 'flex' : 'hidden lg:flex'
              }`}>
                <div className="p-5 sm:p-6 space-y-5 flex-1">
                  
                  {/* Operator & Vehicle Spec Strip */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4.5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-[#7A1B22] dark:text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                        <User size={15} /> Operator & Vehicle Specs
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                        ID: {selectedApp._id.slice(-6)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">Full Name</p>
                        <p className="font-black text-slate-900 dark:text-white mt-0.5">{selectedApp.fullName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">TODA & Zone</p>
                        <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedApp.todaName} (Zone {selectedApp.zone})</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Barangay Address</p>
                        <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{selectedApp.address}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">Make / Brand</p>
                        <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedApp.make} ({selectedApp.made || 'N/A'})</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">Plate Number</p>
                        <p className="font-black text-slate-900 dark:text-white mt-0.5">{selectedApp.plateNo || 'PENDING ASSIGNMENT'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">Motor Number</p>
                        <p className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded mt-0.5 border border-slate-200 dark:border-slate-700 select-all">
                          {selectedApp.motorNo}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">Chassis Number</p>
                        <p className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded mt-0.5 border border-slate-200 dark:border-slate-700 select-all">
                          {selectedApp.chassisNo}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* INTERACTIVE INSPECTION AUDITOR CHECKLIST */}
                  <div className="bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                          <CheckSquare size={15} className="text-[#7A1B22] dark:text-[#D4AF37]" /> Inspection Checklist
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Cross-check vehicle info against uploaded attachments.
                        </p>
                      </div>
                      <button
                        onClick={toggleAllChecklist}
                        className="text-[11px] font-bold text-[#7A1B22] dark:text-[#D4AF37] hover:underline"
                      >
                        {isAllVerified ? 'Uncheck All' : 'Verify All'}
                      </button>
                    </div>

                    {/* Progress indicator */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${isAllVerified ? 'bg-emerald-500' : 'bg-[#D4AF37]'}`}
                        style={{ width: `${(verifiedCount / 4) * 100}%` }}
                      />
                    </div>

                    <div className="space-y-2 pt-1">
                      {[
                        { key: 'orCr', label: 'OR/CR matches Make, Motor & Chassis No.', url: selectedApp.orCrUrl },
                        { key: 'license', label: "Driver's License is Valid & Non-Expired", url: selectedApp.licenseUrl },
                        { key: 'toda', label: `Endorsed by official ${selectedApp.todaName} Officer`, url: selectedApp.todaEndorsementUrl },
                        { key: 'brgy', label: 'Barangay Clearance issued within Gasan', url: selectedApp.brgyClearanceUrl }
                      ].map((item) => (
                        <div 
                          key={item.key}
                          onClick={() => toggleChecklistItem(item.key)}
                          className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                            checklist[item.key] 
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200' 
                              : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {checklist[item.key] ? (
                              <CheckSquare size={16} className="text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Square size={16} className="text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold leading-snug">{item.label}</p>
                            {!item.url && selectedApp.applicationType !== 'Renewal' && (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">⚠️ No file uploaded</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDocKey(item.key);
                              setMobilePane('document');
                            }}
                            className="text-[11px] text-[#7A1B22] dark:text-[#D4AF37] hover:underline font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0"
                          >
                            Inspect &rarr;
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* REJECTION REASON EXPANDABLE ACCORDION */}
                  {isRejecting && (
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-4.5 animate-in fade-in slide-in-from-top-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-red-800 dark:text-red-300 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <XCircle size={15} /> Specify Rejection Reason
                        </h4>
                        <button 
                          onClick={() => setIsRejecting(false)} 
                          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                        >
                          Cancel
                        </button>
                      </div>

                      <select 
                        value={rejectReason} 
                        onChange={(e) => setRejectReason(e.target.value)} 
                        className="w-full bg-white dark:bg-slate-800 border border-red-300 dark:border-red-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-200"
                      >
                        {REJECT_REASONS.map((r, i) => <option key={i} value={r}>{r}</option>)}
                      </select>

                      {rejectReason === 'Others (Please specify)' && (
                        <textarea 
                          placeholder="Type specific inspection defect or reason for the operator..." 
                          value={customReason} 
                          onChange={(e) => setCustomReason(e.target.value)} 
                          className="w-full bg-white dark:bg-slate-800 border border-red-300 dark:border-red-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-white min-h-[70px] outline-none focus:ring-2 focus:ring-red-200" 
                        />
                      )}

                      <div className="flex gap-2 pt-1">
                        <button 
                          onClick={() => handleUpdateStatus('Cancelled')} 
                          disabled={isProcessing} 
                          className="flex-1 bg-red-600 text-white hover:bg-red-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
                        >
                          {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />} 
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* BOTTOM ACTION DOCK (LEFT PANE) */}
                <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
                  {!isRejecting && (
                    <>
                      {selectedApp.status === 'Pending' ? (
                        <button 
                          onClick={() => setIsRejecting(true)} 
                          className="px-4 py-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/60 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors border border-red-200 dark:border-red-800/40"
                        >
                          <XCircle size={15} /> Reject
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                          <Clock size={15} /> Awaiting Release
                        </span>
                      )}

                      <div className="flex items-center gap-2 ml-auto">
                        {selectedApp.status === 'Pending' ? (
                          <button 
                            onClick={() => handleUpdateStatus('Ready for Pickup')} 
                            disabled={isProcessing} 
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-md"
                          >
                            {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                            Approve (Set to Ready for Pickup)
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleUpdateStatus('Active')} 
                            disabled={isProcessing} 
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-md"
                          >
                            {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                            Acknowledge Payment & Release
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* RIGHT PANE: DEDICATED LIVE DOCUMENT VIEWER CANVAS (58% on desktop) */}
              <div className={`w-full lg:w-[58%] flex flex-col bg-slate-950 text-white overflow-hidden ${
                mobilePane === 'document' ? 'flex' : 'hidden lg:flex'
              }`}>
                
                {/* DOCUMENT SELECTOR TABS & TOOLBAR */}
                <div className="px-4 py-2.5 bg-slate-900 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
                  
                  {/* Doc Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                    {docTabs.map((tab) => {
                      const isActive = tab.key === activeDocKey;
                      const hasDoc = Boolean(tab.url);
                      return (
                        <button
                          key={tab.key}
                          onClick={() => {
                            setActiveDocKey(tab.key);
                            setZoomScale(1);
                            setRotation(0);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                            isActive
                              ? 'bg-[#7A1B22] text-white shadow-sm border border-[#D4AF37]/40'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                          }`}
                        >
                          <FileText size={13} className={isActive ? 'text-[#D4AF37]' : 'text-slate-400'} />
                          <span>{tab.label}</span>
                          {!hasDoc && selectedApp.applicationType !== 'Renewal' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Missing attachment" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Interactive Controls (Zoom / Rotate / Reset / External) */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button 
                      onClick={() => setZoomScale(prev => Math.max(prev - 0.25, 0.5))} 
                      className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
                      title="Zoom Out"
                    >
                      <ZoomOut size={16} />
                    </button>
                    <span className="text-[11px] font-mono font-bold px-1 text-slate-400 min-w-[40px] text-center">
                      {Math.round(zoomScale * 100)}%
                    </span>
                    <button 
                      onClick={() => setZoomScale(prev => Math.min(prev + 0.25, 3))} 
                      className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
                      title="Zoom In"
                    >
                      <ZoomIn size={16} />
                    </button>
                    <button 
                      onClick={() => setRotation(prev => (prev + 90) % 360)} 
                      className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
                      title="Rotate 90° Clockwise"
                    >
                      <RotateCw size={16} />
                    </button>
                    <button 
                      onClick={() => { setZoomScale(1); setRotation(0); }} 
                      className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
                      title="Reset View"
                    >
                      <RefreshCw size={14} />
                    </button>

                    {currentDoc?.url && (
                      <>
                        <div className="h-4 w-px bg-white/20 mx-1" />
                        <a
                          href={currentDoc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-white/10 text-[#D4AF37] rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                          title="Open Original in New Tab"
                        >
                          <ExternalLink size={15} />
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {/* WORKSPACE CANVAS / VIEWER */}
                <div className="flex-1 relative flex items-center justify-center p-4 overflow-auto bg-slate-950/90 select-none">
                  {selectedApp.applicationType === 'Renewal' && !currentDoc?.url ? (
                    <div className="text-center p-8 max-w-md bg-slate-900/60 border border-white/10 rounded-2xl">
                      <ShieldCheck size={36} className="mx-auto text-[#D4AF37] mb-3 opacity-70" />
                      <h4 className="font-bold text-sm text-white">Renewal Application</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        This is a franchise renewal application. Historical vehicle records and original requirements are archived on file.
                      </p>
                    </div>
                  ) : !currentDoc?.url ? (
                    <div className="text-center p-8 max-w-md bg-slate-900/60 border border-white/10 rounded-2xl">
                      <AlertCircle size={36} className="mx-auto text-amber-400 mb-3 opacity-70" />
                      <h4 className="font-bold text-sm text-white">No Document Uploaded</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        The applicant has not uploaded an attachment for <strong className="text-amber-300">{currentDoc?.label}</strong>.
                      </p>
                    </div>
                  ) : currentDoc.url.toLowerCase().includes('.pdf') ? (
                    <iframe 
                      src={currentDoc.url} 
                      className="w-full h-full bg-white rounded-2xl shadow-2xl border border-white/10" 
                      title="Inspection Document PDF" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                      <img 
                        src={currentDoc.url} 
                        alt={currentDoc.label}
                        style={{ 
                          transform: `scale(${zoomScale}) rotate(${rotation}deg)`, 
                          transformOrigin: 'center', 
                          transition: 'transform 0.15s ease-out' 
                        }}
                        className="max-h-[82vh] max-w-[90%] object-contain rounded-xl shadow-2xl bg-slate-900 border border-white/10" 
                      />
                    </div>
                  )}
                </div>

                {/* CANVAS BOTTOM INFO BAR */}
                <div className="px-4 py-2 bg-slate-900/90 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Eye size={13} className="text-[#D4AF37]" /> Inspecting: <strong className="text-slate-200">{currentDoc?.label}</strong>
                  </span>
                  <span className="font-mono text-slate-500">
                    Use controls in toolbar to inspect fine details
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default FranchiseApproval;