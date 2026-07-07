import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { ShieldAlert, Search, AlertTriangle, UploadCloud, X, Loader2, CheckCircle, FileText, Eye } from 'lucide-react';

const VIOLATIONS_LIST = [
  "Operating outside authorized routes",
  "Overcharging",
  "Driving without a valid license",
  "Unauthorized use of franchise",
  "Reckless driving",
  "Failure to comply with safety mandates",
  "Non-payment of fees"
];

const ManageRevocations = () => {
  const [franchises, setFranchises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' o 'revoked'

  // Modal States
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [violation, setViolation] = useState(VIOLATIONS_LIST[0]);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    fetchFranchises();
  }, []);

  const fetchFranchises = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/v1/franchises', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFranchises(data);
      }
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSubmit = async (e) => {
    e.preventDefault();
    if (!evidenceFile) return alert("Please upload documentary evidence to proceed with revocation.");
    
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('cancelReason', violation);
    formData.append('evidence', evidenceFile);

    try {
      const response = await fetch(`http://localhost:3000/api/v1/franchises/${selectedFranchise._id}/revoke`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });

      if (response.ok) {
        alert("Franchise successfully revoked.");
        setSelectedFranchise(null);
        setEvidenceFile(null);
        fetchFranchises(); // Refresh list
      } else {
        alert("Failed to revoke franchise.");
      }
    } catch (error) {
      alert("Network Error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredFranchises = franchises.filter(f => {
    const isMatch = (f.fullName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                    (f.plateNo?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const isStatusMatch = activeTab === 'active' ? f.status === 'Active' : f.status === 'Revoked';
    return isMatch && isStatusMatch;
  });

  return (
    <MainLayout>
      {/* FULL SCREEN DOCUMENT PREVIEWER */}
      {previewDoc && (
        <div className="fixed inset-0 z-[200] bg-slate-900/95 flex flex-col items-center justify-center p-4 md:p-8 backdrop-blur-sm animate-in fade-in">
          <div className="flex justify-between items-center w-full max-w-5xl mb-4">
            <h3 className="text-white font-bold text-lg flex items-center gap-2"><Eye size={20}/> Evidence Viewer</h3>
            <button onClick={() => setPreviewDoc(null)} className="text-white hover:text-red-400 transition-colors bg-white/10 p-2 rounded-lg">
              <X size={24} />
            </button>
          </div>
          <iframe src={previewDoc} className="w-full max-w-5xl h-[75vh] md:h-[85vh] bg-white rounded-xl shadow-2xl" title="Evidence Document" />
        </div>
      )}

      <header className="mb-8 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Revocations</h1>
          <p className="text-sm text-slate-500 mt-1">Process violations and revoke operator franchises securely.</p>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* TABS */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button 
            onClick={() => { setActiveTab('active'); setSearchQuery(''); }}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'active' ? 'text-[#7A1B22] border-b-2 border-[#7A1B22] bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert size={18} /> Active Operators
          </button>
          <button 
            onClick={() => { setActiveTab('revoked'); setSearchQuery(''); }}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'revoked' ? 'text-red-600 border-b-2 border-red-600 bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle size={18} /> Revoked Records
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="p-4 sm:p-6 border-b border-slate-100 bg-white">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by operator name or plate no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#7A1B22] focus:ring-2 focus:ring-[#7A1B22]/20 transition-all"
            />
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="animate-spin text-[#7A1B22]" size={32} />
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                  <th className="p-4 pl-6">Operator & Vehicle</th>
                  {activeTab === 'revoked' && <th className="p-4">Violation Details</th>}
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFranchises.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <CheckCircle size={40} className="text-emerald-300 mb-3"/>
                        <p className="font-bold text-lg text-slate-700">No records found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredFranchises.map((f) => (
                    <tr key={f._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 pl-6">
                        <p className="font-bold text-slate-900">{f.fullName}</p>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">Plate: <span className="text-slate-800 bg-yellow-100 px-1 rounded border border-yellow-300">{f.plateNo || 'N/A'}</span> &bull; {f.todaName}</p>
                      </td>
                      
                      {activeTab === 'revoked' && (
                        <td className="p-4">
                          <p className="text-sm font-bold text-red-600">{f.cancelReason}</p>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Revoked on: {new Date(f.updatedAt).toLocaleDateString()}</p>
                        </td>
                      )}

                      <td className="p-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider border ${
                          f.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {f.status}
                        </span>
                      </td>
                      
                      <td className="p-4 pr-6 text-center">
                        {activeTab === 'active' ? (
                          <button 
                            onClick={() => setSelectedFranchise(f)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors border bg-red-50 hover:bg-red-100 text-red-700 border-red-200 shadow-sm"
                          >
                            <AlertTriangle size={14} /> Issue Revocation
                          </button>
                        ) : (
                          <button 
                            onClick={() => setPreviewDoc(f.evidenceUrl)}
                            disabled={!f.evidenceUrl}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors border ${
                              f.evidenceUrl ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'
                            }`}
                          >
                            <FileText size={14} /> View Evidence
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* REVOCATION MODAL */}
      {selectedFranchise && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSubmitting && setSelectedFranchise(null)}></div>
          
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-red-50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-red-800 flex items-center gap-2"><AlertTriangle size={20}/> Revoke Franchise</h2>
              <button onClick={() => !isSubmitting && setSelectedFranchise(null)} className="text-red-400 hover:text-red-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleRevokeSubmit} className="p-6 space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Target Operator</p>
                <p className="font-black text-slate-900 text-lg">{selectedFranchise.fullName}</p>
                <p className="text-sm font-medium text-slate-600 mt-1">Plate Number: <span className="font-bold text-slate-900 bg-yellow-100 px-1.5 border border-yellow-300 rounded">{selectedFranchise.plateNo}</span></p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Select Violation Committed</label>
                <select 
                  value={violation} 
                  onChange={(e) => setViolation(e.target.value)} 
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                >
                  {VIOLATIONS_LIST.map((v, i) => <option key={i} value={v}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Upload Documentary Evidence</label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors relative">
                  <input 
                    type="file" 
                    accept=".pdf, image/*" 
                    onChange={(e) => setEvidenceFile(e.target.files[0])} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                  <UploadCloud className="mx-auto text-slate-400 mb-2" size={32} />
                  <p className="text-sm font-bold text-slate-700">{evidenceFile ? evidenceFile.name : 'Tap to upload order or ticket'}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Accepts PDF, JPG, or PNG</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setSelectedFranchise(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors text-sm shadow-sm flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />} 
                  {isSubmitting ? 'Processing...' : 'Confirm Revocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default ManageRevocations;