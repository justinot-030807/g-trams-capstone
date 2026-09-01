import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout';
import { 
  CheckCircle, XCircle, Eye, FileText, AlertCircle, 
  X, Search, Loader2, ZoomIn, ZoomOut, RotateCw, Printer, ShieldCheck, Download,
  CalendarDays, User, Clock
} from 'lucide-react';

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

  const [selectedApp, setSelectedApp] = useState(null); 
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Custom Toast Notification State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Document Viewer States
  const [previewDoc, setPreviewDoc] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Print Modal State
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
        // Filter and sort by earliest submission date first (First-In, First-Out Queue)
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

  const openDocPreview = (url, title) => {
    setZoomScale(1); 
    setRotation(0);
    setPreviewDoc({ url, title });
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
    (app.motorNo?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-document, #printable-document * { visibility: visible; }
          #printable-document { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      {/* CUSTOM FLOATING TOAST NOTIFICATION */}
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

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="flex justify-between items-center bg-slate-900/80 px-6 py-3 rounded-2xl border border-white/10 text-white">
            <div className="flex items-center gap-3">
              <Eye size={20} className="text-[#D4AF37]" />
              <h3 className="font-bold text-sm tracking-wide">{previewDoc.title || 'Document Preview'}</h3>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setZoomScale(prev => Math.max(prev - 0.25, 0.5))} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80"><ZoomOut size={18} /></button>
              <span className="text-xs font-mono px-2">{Math.round(zoomScale * 100)}%</span>
              <button onClick={() => setZoomScale(prev => Math.min(prev + 0.25, 3))} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80"><ZoomIn size={18} /></button>
              <button onClick={() => setRotation(prev => (prev + 90) % 360)} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80"><RotateCw size={18} /></button>
              <div className="h-4 w-px bg-white/20 mx-1" />
              <button onClick={() => setPreviewDoc(null)} className="p-2 hover:bg-red-500 rounded-xl transition-colors text-white"><X size={20} /></button>
            </div>
          </div>

          <div className="flex-1 my-4 flex items-center justify-center overflow-auto p-4 rounded-3xl bg-slate-900/40 border border-white/5">
            {previewDoc.url.toLowerCase().includes('.pdf') ? (
              <iframe src={previewDoc.url} className="w-full h-full max-w-4xl bg-white rounded-2xl shadow-2xl" title="PDF Previewer" />
            ) : (
              <div className="overflow-auto flex items-center justify-center w-full h-full">
                <img 
                  src={previewDoc.url} 
                  alt="Requirements" 
                  style={{ transform: `scale(${zoomScale}) rotate(${rotation}deg)`, transformOrigin: 'center', transition: 'transform 0.2s ease-out' }}
                  className="max-h-[75vh] max-w-[85vw] object-contain rounded-xl shadow-2xl bg-slate-800" 
                />
              </div>
            )}
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

      {/* SECTION HEADER WITH MODERN VERTICAL LINE ACCENT */}
      <header className="mb-6 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-7 bg-[#7A1B22] rounded-full" />
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pending Approvals</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Review and process franchise applications in queue (Oldest First).</p>
          </div>
        </div>
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search Name or Plate No..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium outline-none focus:border-[#7A1B22] focus:ring-2 focus:ring-[#7A1B22]/15"
          />
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#7A1B22]" size={32} /></div>
      ) : filteredApps.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500">
          <CheckCircle size={48} className="mx-auto mb-4 text-emerald-400 opacity-50" />
          <p className="font-bold text-base text-slate-800">All caught up!</p>
          <p className="text-xs text-slate-500 mt-1">There are no pending applications to review right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app, index) => (
            <div key={app._id} className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-[#7A1B22]/30">
              
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${app.status === 'Ready for Pickup' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                  {app.status === 'Ready for Pickup' ? <Printer size={22} /> : <FileText size={22} />}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                      Queue #{index + 1}
                    </span>
                    <h3 className="font-black text-slate-900 text-lg">
                      {app.fullName}
                    </h3>
                    {app.status === 'Ready for Pickup' && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 uppercase font-black tracking-wider">
                        Awaiting Payment
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1 font-bold text-slate-800">
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
                    <span className="flex items-center gap-1 text-slate-600 font-bold bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                      <CalendarDays size={13} className="text-[#7A1B22]" /> 
                      Submitted: {formatDate(app.dateApplied || app.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => { setSelectedApp(app); setIsRejecting(false); }} 
                className="w-full md:w-auto bg-slate-900 text-white hover:bg-[#7A1B22] px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors active:scale-95 shadow-xs"
              >
                Review Application
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedApp && !isPrintOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedApp(null)} />
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl relative max-h-[90vh] overflow-y-auto z-10 animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-5 sm:p-6 flex justify-between items-center z-20 rounded-t-3xl">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">Application Review</h2>
                <p className="text-xs text-slate-500 font-medium">Submitted on: {formatDate(selectedApp.dateApplied || selectedApp.createdAt)} &bull; ID: {selectedApp._id}</p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><X size={22} /></button>
            </div>
            
            <div className="p-5 sm:p-6 space-y-6">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                <h3 className="text-xs font-black text-[#7A1B22] mb-4 uppercase tracking-wider flex items-center gap-2"><FileText size={16} /> Operator & Vehicle Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 text-xs">
                  <div className="col-span-2"><p className="text-slate-500 text-[10px] font-bold uppercase">Full Name</p><p className="font-bold text-slate-900 text-sm">{selectedApp.fullName}</p></div>
                  <div className="col-span-2"><p className="text-slate-500 text-[10px] font-bold uppercase">Address</p><p className="font-bold text-slate-900">{selectedApp.address}</p></div>
                  <div><p className="text-slate-500 text-[10px] font-bold uppercase">TODA</p><p className="font-bold text-slate-900">{selectedApp.todaName}</p></div>
                  <div><p className="text-slate-500 text-[10px] font-bold uppercase">Zone</p><p className="font-bold text-slate-900">Zone {selectedApp.zone}</p></div>
                  <div><p className="text-slate-500 text-[10px] font-bold uppercase">Make / Brand</p><p className="font-bold text-slate-900">{selectedApp.make}</p></div>
                  <div><p className="text-slate-500 text-[10px] font-bold uppercase">Year Made</p><p className="font-bold text-slate-900">{selectedApp.made}</p></div>
                  <div><p className="text-slate-500 text-[10px] font-bold uppercase">Plate No.</p><p className="font-black text-slate-900">{selectedApp.plateNo || 'PENDING'}</p></div>
                  <div><p className="text-slate-500 text-[10px] font-bold uppercase">Motor No.</p><p className="font-bold text-slate-900 font-mono">{selectedApp.motorNo}</p></div>
                  <div className="col-span-2"><p className="text-slate-500 text-[10px] font-bold uppercase">Chassis No.</p><p className="font-bold text-slate-900 font-mono">{selectedApp.chassisNo}</p></div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black text-slate-900 mb-3 border-b border-slate-100 pb-2 uppercase tracking-wider">Uploaded Requirements (Click to Preview)</h3>
                {selectedApp.applicationType === 'Renewal' ? (
                  <p className="text-xs text-slate-500 italic">No new files required for Renewal application.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "OR/CR Document", url: selectedApp.orCrUrl },
                      { label: "Driver's License", url: selectedApp.licenseUrl },
                      { label: "TODA Endorsement", url: selectedApp.todaEndorsementUrl },
                      { label: "Barangay Clearance", url: selectedApp.brgyClearanceUrl }
                    ].map((doc, idx) => (
                      <div key={idx}>
                        {doc.url ? (
                          <button 
                            onClick={() => openDocPreview(doc.url, doc.label)} 
                            type="button" 
                            className="w-full flex flex-col items-center justify-center p-4 bg-emerald-50 border border-emerald-200 rounded-2xl hover:bg-emerald-100 transition-colors group"
                          >
                            <Eye size={22} className="text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-[11px] font-bold text-emerald-800 text-center">{doc.label}</span>
                          </button>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl opacity-60">
                            <AlertCircle size={22} className="text-slate-400 mb-2" />
                            <span className="text-[11px] font-medium text-slate-500 text-center">Missing File</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isRejecting && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 animate-in fade-in slide-in-from-top-2">
                  <h3 className="text-red-800 font-bold mb-3 text-xs uppercase tracking-wider">Reason for Rejection</h3>
                  <select value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full bg-white border border-red-300 rounded-xl px-4 py-2.5 text-xs font-semibold mb-3 outline-none focus:ring-2 focus:ring-red-200">
                    {REJECT_REASONS.map((r, i) => <option key={i} value={r}>{r}</option>)}
                  </select>
                  {rejectReason === 'Others (Please specify)' && (
                    <textarea placeholder="Type specific reason..." value={customReason} onChange={(e) => setCustomReason(e.target.value)} className="w-full bg-white border border-red-300 rounded-xl px-4 py-3 text-xs font-medium min-h-[80px] outline-none focus:ring-2 focus:ring-red-200" />
                  )}
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => handleUpdateStatus('Cancelled')} disabled={isProcessing} className="bg-red-600 text-white hover:bg-red-700 px-6 py-2 rounded-xl text-xs font-bold flex items-center gap-2 active:scale-95 transition-all">
                      {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />} Confirm Reject
                    </button>
                    <button onClick={() => setIsRejecting(false)} className="bg-white text-slate-600 border border-slate-300 px-6 py-2 rounded-xl text-xs font-bold hover:bg-slate-50">Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            {!isRejecting && (
              <div className="sticky bottom-0 bg-white border-t border-slate-100 p-5 sm:p-6 flex flex-wrap justify-end gap-3 z-20 rounded-b-3xl">
                {selectedApp.status === 'Pending' && (
                  <button 
                    onClick={() => setIsRejecting(true)} 
                    className="px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors active:scale-95"
                  >
                    <XCircle size={16} /> Reject Application
                  </button>
                )}
                
                {selectedApp.status === 'Pending' ? (
                  <button 
                    onClick={() => handleUpdateStatus('Ready for Pickup')} 
                    disabled={isProcessing} 
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors active:scale-95 shadow-sm"
                  >
                    <CheckCircle size={16} /> Approve (Set to Ready for Pickup)
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => setIsPrintOpen(true)} 
                      className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors active:scale-95 shadow-sm"
                    >
                      <Printer size={16} /> Print Official Form
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus('Active')} 
                      disabled={isProcessing} 
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors active:scale-95 shadow-sm"
                    >
                      <CheckCircle size={16} /> Acknowledge Payment & Release
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default FranchiseApproval;