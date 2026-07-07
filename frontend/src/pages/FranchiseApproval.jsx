import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { CheckCircle, XCircle, Eye, FileText, AlertCircle, X, Search, Loader2 } from 'lucide-react';

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
  
  // STATE PARA SA IN-APP DOCUMENT PREVIEW
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/v1/franchises', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setApplications(data.filter(app => app.status === 'Pending'));
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    setIsProcessing(true);
    const finalReason = status === 'Cancelled' ? (rejectReason === 'Others (Please specify)' ? customReason : rejectReason) : '';

    if (status === 'Cancelled' && !finalReason.trim()) {
      alert("Please provide a reason for rejection.");
      setIsProcessing(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/v1/franchises/${selectedApp._id}/status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: status, cancelReason: finalReason })
      });

      if (response.ok) {
        alert(`Application successfully ${status === 'Active' ? 'Approved' : 'Rejected'}!`);
        setSelectedApp(null); 
        setIsRejecting(false);
        fetchApplications(); 
      } else {
        alert('Failed to update status.');
      }
    } catch (error) {
      alert('Network error.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredApps = applications.filter(app => 
    (app.fullName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (app.plateNo?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      {/* FULL SCREEN DOCUMENT PREVIEWER */}
      {previewDoc && (
        <div className="fixed inset-0 z-[200] bg-slate-900/95 flex flex-col items-center justify-center p-4 md:p-8 backdrop-blur-sm animate-in fade-in">
          <div className="flex justify-between items-center w-full max-w-5xl mb-4">
            <h3 className="text-white font-bold text-lg flex items-center gap-2"><Eye size={20}/> Document Preview</h3>
            <button onClick={() => setPreviewDoc(null)} className="text-white hover:text-red-400 transition-colors bg-white/10 p-2 rounded-lg">
              <X size={24} />
            </button>
          </div>
          {/* Dito lalabas ang PDF/Image sa loob ng system */}
          <iframe 
            src={previewDoc} 
            className="w-full max-w-5xl h-[75vh] md:h-[85vh] bg-white rounded-xl shadow-2xl" 
            title="Document Viewer"
          />
        </div>
      )}

      <header className="mb-6 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pending Approvals</h1>
          <p className="text-sm text-slate-500 mt-1">Review and validate operator franchise applications.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search Name or Plate No..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:border-[#7A1B22]"/>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#7A1B22]" size={32} /></div>
      ) : filteredApps.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <CheckCircle size={48} className="mx-auto mb-4 text-emerald-400 opacity-50" />
          <p className="font-bold">All caught up!</p>
          <p className="text-sm">There are no pending applications to review right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => (
            <div key={app._id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center shrink-0"><FileText size={24} /></div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{app.fullName}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm font-medium text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Plate: {app.plateNo}</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> TODA: {app.todaName}</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Type: {app.applicationType}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => { setSelectedApp(app); setIsRejecting(false); }} className="w-full md:w-auto bg-slate-900 text-white hover:bg-[#7A1B22] px-6 py-2.5 rounded-xl font-bold text-sm transition-colors">
                Review Details
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedApp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedApp(null)} />
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto z-10">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex justify-between items-center z-20">
              <div><h2 className="text-xl font-bold text-slate-900">Application Review</h2><p className="text-xs text-slate-500 font-medium">ID: {selectedApp._id}</p></div>
              <button onClick={() => setSelectedApp(null)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-8">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                <h3 className="text-sm font-bold text-[#7A1B22] mb-4 uppercase tracking-wider flex items-center gap-2"><FileText size={16} /> Operator & Vehicle Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 text-sm">
                  <div className="col-span-2"><p className="text-slate-500 text-xs">Full Name</p><p className="font-bold text-slate-900">{selectedApp.fullName}</p></div>
                  <div className="col-span-2"><p className="text-slate-500 text-xs">Address</p><p className="font-bold text-slate-900">{selectedApp.address}</p></div>
                  <div><p className="text-slate-500 text-xs">TODA</p><p className="font-bold text-slate-900">{selectedApp.todaName}</p></div>
                  <div><p className="text-slate-500 text-xs">Zone</p><p className="font-bold text-slate-900">{selectedApp.zone}</p></div>
                  <div><p className="text-slate-500 text-xs">Make / Brand</p><p className="font-bold text-slate-900">{selectedApp.make}</p></div>
                  <div><p className="text-slate-500 text-xs">Year Made</p><p className="font-bold text-slate-900">{selectedApp.made}</p></div>
                  <div><p className="text-slate-500 text-xs">Plate No.</p><p className="font-bold text-slate-900">{selectedApp.plateNo}</p></div>
                  <div><p className="text-slate-500 text-xs">Motor No.</p><p className="font-bold text-slate-900">{selectedApp.motorNo}</p></div>
                  <div className="col-span-2"><p className="text-slate-500 text-xs">Chassis No.</p><p className="font-bold text-slate-900">{selectedApp.chassisNo}</p></div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3 border-b pb-2">Uploaded Requirements</h3>
                {selectedApp.applicationType === 'Renewal' ? (
                  <p className="text-sm text-slate-500 italic">No files required for Renewal.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "OR/CR Document", url: selectedApp.orCrUrl },
                      { label: "Driver's License", url: selectedApp.licenseUrl },
                      { label: "TODA Endorsement", url: selectedApp.todaEndorsementUrl },
                      { label: "Barangay Clearance", url: selectedApp.brgyClearanceUrl }
                    ].map((doc, idx) => (
                      <div key={idx}>
                        {doc.url ? (
                          // BINAGO: Pagniclick ito, lilitaw yung fullscreen document preview
                          <button onClick={() => setPreviewDoc(doc.url)} type="button" className="w-full flex flex-col items-center justify-center p-4 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors group">
                            <Eye size={24} className="text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold text-emerald-800 text-center">{doc.label}</span>
                          </button>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl opacity-60">
                            <AlertCircle size={24} className="text-slate-400 mb-2" />
                            <span className="text-xs font-medium text-slate-500 text-center">Missing File</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isRejecting && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                  <h3 className="text-red-800 font-bold mb-3">Reason for Rejection</h3>
                  <select value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full bg-white border border-red-300 rounded-xl px-4 py-2.5 text-sm mb-3">
                    {REJECT_REASONS.map((r, i) => <option key={i} value={r}>{r}</option>)}
                  </select>
                  {rejectReason === 'Others (Please specify)' && (
                    <textarea placeholder="Type specific reason..." value={customReason} onChange={(e) => setCustomReason(e.target.value)} className="w-full bg-white border border-red-300 rounded-xl px-4 py-3 text-sm min-h-[80px]" />
                  )}
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => handleUpdateStatus('Cancelled')} disabled={isProcessing} className="bg-red-600 text-white hover:bg-red-700 px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                      {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} Confirm Reject
                    </button>
                    <button onClick={() => setIsRejecting(false)} className="bg-white text-slate-600 border border-slate-300 px-6 py-2 rounded-lg text-sm font-bold">Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {!isRejecting && (
              <div className="sticky bottom-0 bg-white border-t border-slate-100 p-6 flex justify-end gap-3 z-20 rounded-b-2xl">
                <button onClick={() => setIsRejecting(true)} className="px-6 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-sm flex items-center gap-2"><XCircle size={18} /> Reject Application</button>
                <button onClick={() => handleUpdateStatus('Active')} disabled={isProcessing} className="px-8 py-3 bg-[#7A1B22] text-white hover:bg-[#5A1419] rounded-xl font-bold text-sm flex items-center gap-2"><CheckCircle size={18} /> Approve Franchise</button>
              </div>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default FranchiseApproval;