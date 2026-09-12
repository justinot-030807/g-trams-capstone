import React, { useState, useEffect } from 'react';
import { VIOLATIONS_LIST } from '../../utils/constants';
import MainLayout from '../../components/MainLayout';
import { ShieldAlert, Search, AlertTriangle, UploadCloud, X, Loader2, CheckCircle, FileText, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { TableRowsSkeleton } from '../../components/skeleton';



const ManageRevocations = () => {
  const [franchises, setFranchises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises?limit=2000`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const raw = await response.json();
        setFranchises(Array.isArray(raw) ? raw : (raw?.data || []));
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/${selectedFranchise._id}/revoke`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });

      if (response.ok) {
        alert("Franchise successfully revoked.");
        setSelectedFranchise(null);
        setEvidenceFile(null);
        fetchFranchises();
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

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const totalRecords = filteredFranchises.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const paginatedFranchises = filteredFranchises.slice(startIndex, endIndex);

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

      <header className="mb-6 bg-gradient-to-br from-[#681419] via-[#7A1B22] to-[#3a0b0f] dark:from-[#0d121f] dark:via-[#1e0e15] dark:to-[#0a0d16] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between md:items-end gap-6 border border-[#D4AF37]/30 transition-all">
        <div className="absolute top-1/2 -translate-y-1/2 -right-8 pointer-events-none opacity-[0.07] dark:opacity-[0.05] grayscale mix-blend-overlay">
          <img src="/marinduque_logo.png" alt="Watermark" className="w-64 h-64 sm:w-80 sm:h-80 object-contain drop-shadow-2xl" />
        </div>
        <div className="relative z-10 flex flex-col gap-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 bg-white/10 dark:bg-white/5 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase mb-1.5 border border-white/15 shadow-sm w-fit">
            <ShieldAlert size={13} className="text-[#D4AF37]" />
            <span>Disciplinary</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Manage Revocations</h1>
          <p className="text-white/80 dark:text-slate-300 font-medium text-xs sm:text-sm max-w-xl leading-relaxed">
            Process violations and revoke operator franchises securely.
          </p>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        {/* TABS */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80">
          <button 
            onClick={() => { setActiveTab('active'); setSearchQuery(''); }}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'active' ? 'text-[#7A1B22] dark:text-[#D4AF37] border-b-2 border-[#7A1B22] dark:border-[#D4AF37] bg-white dark:bg-slate-900' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldAlert size={18} /> Active Operators
          </button>
          <button 
            onClick={() => { setActiveTab('revoked'); setSearchQuery(''); }}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'revoked' ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-white dark:bg-slate-900' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlertTriangle size={18} /> Revoked Records
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by operator name or plate no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-[#7A1B22] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-[#7A1B22]/20 transition-all"
            />
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">
                <th className="p-4 pl-6">Operator & Vehicle</th>
                {activeTab === 'revoked' && <th className="p-4">Violation Details</th>}
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {isLoading ? (
                <TableRowsSkeleton rows={5} columns={activeTab === 'revoked' ? 4 : 3} baseDelay={30} stepDelay={45} />
              ) : filteredFranchises.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <CheckCircle size={40} className="text-emerald-300 dark:text-emerald-500/50 mb-3"/>
                      <p className="font-bold text-lg text-slate-700 dark:text-slate-200">No records found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedFranchises.map((f, fIdx) => (
                  <tr 
                    key={f._id} 
                    className="stagger-reveal hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    style={{ animationDelay: `${fIdx * 35}ms` }}
                  >
                      <td className="p-4 pl-6">
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{f.fullName}</p>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Plate: <span className="text-slate-800 dark:text-slate-900 bg-yellow-100 px-1 rounded border border-yellow-300">{f.plateNo || 'N/A'}</span> &bull; {f.todaName}</p>
                      </td>
                      
                      {activeTab === 'revoked' && (
                        <td className="p-4">
                          <p className="text-sm font-bold text-red-600 dark:text-red-400">{f.cancelReason}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Revoked on: {new Date(f.updatedAt).toLocaleDateString()}</p>
                        </td>
                      )}

                      <td className="p-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider border ${
                          f.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60' : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/60'
                        }`}>
                          {f.status}
                        </span>
                      </td>
                      
                      <td className="p-4 pr-6 text-center">
                        {activeTab === 'active' ? (
                          <button 
                            onClick={() => setSelectedFranchise(f)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors border bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/60 shadow-sm"
                          >
                            <AlertTriangle size={14} /> Issue Revocation
                          </button>
                        ) : (
                          <button 
                            onClick={() => setPreviewDoc(f.evidenceUrl)}
                            disabled={!f.evidenceUrl}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors border ${
                              f.evidenceUrl ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-sm' : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-800 cursor-not-allowed'
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
        </div>

        {/* Pagination Bar */}
        {!isLoading && filteredFranchises.length > 0 && (
          <div className="px-4 py-3 sm:px-6 bg-slate-50/80 dark:bg-slate-800/60 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium flex-wrap justify-center sm:justify-start">
              <span>Showing</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{startIndex + 1}</span>
              <span>to</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{endIndex}</span>
              <span>of</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{totalRecords}</span>
              <span>records</span>

              <span className="mx-1 text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <span className="text-[11px]">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#7A1B22] dark:focus:border-[#D4AF37] cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={validCurrentPage <= 1}
                className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - validCurrentPage) <= 1) return true;
                    return false;
                  })
                  .reduce((acc, page, idx, arr) => {
                    if (idx > 0 && page - arr[idx - 1] > 1) {
                      acc.push('ellipsis-' + page);
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item) => {
                    if (typeof item === 'string') {
                      return (
                        <span key={item} className="px-1.5 text-slate-400 select-none">
                          ...
                        </span>
                      );
                    }
                    const isCurrent = item === validCurrentPage;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCurrentPage(item)}
                        className={`min-w-[30px] h-[30px] rounded-lg font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-950 shadow-xs'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={validCurrentPage >= totalPages}
                className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
                title="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* REVOCATION MODAL */}
      {selectedFranchise && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => !isSubmitting && setSelectedFranchise(null)}></div>
          
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-red-50 dark:bg-red-950/40 rounded-t-2xl">
              <h2 className="text-lg font-bold text-red-800 dark:text-red-300 flex items-center gap-2"><AlertTriangle size={20}/> Revoke Franchise</h2>
              <button onClick={() => !isSubmitting && setSelectedFranchise(null)} className="text-red-400 hover:text-red-600 dark:hover:text-red-300"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleRevokeSubmit} className="p-6 space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Target Operator</p>
                <p className="font-black text-slate-900 dark:text-white text-lg">{selectedFranchise.fullName}</p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">Plate Number: <span className="font-bold text-slate-900 dark:text-slate-900 bg-yellow-100 px-1.5 border border-yellow-300 rounded">{selectedFranchise.plateNo}</span></p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Select Violation Committed</label>
                <select 
                  value={violation} 
                  onChange={(e) => setViolation(e.target.value)} 
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                >
                  {VIOLATIONS_LIST.map((v, i) => <option key={i} value={v}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Upload Documentary Evidence</label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative">
                  <input 
                    type="file" 
                    accept=".pdf, image/*" 
                    onChange={(e) => setEvidenceFile(e.target.files[0])} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                  <UploadCloud className="mx-auto text-slate-400 dark:text-slate-500 mb-2" size={32} />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{evidenceFile ? evidenceFile.name : 'Tap to upload order or ticket'}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Accepts PDF, JPG, or PNG</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setSelectedFranchise(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm">Cancel</button>
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