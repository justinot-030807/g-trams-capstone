import React, { useState, useEffect } from 'react';
import { VIOLATIONS_LIST } from '../../utils/constants';
import MainLayout from '../../components/MainLayout';
import { ShieldAlert, Search, AlertTriangle, UploadCloud, X, Loader2, CheckCircle, CheckCircle2, AlertCircle, FileText, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { TableRowsSkeleton } from '../../components/skeleton';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';



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
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  const fetchFranchises = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises?status=Active,Revoked&limit=1000`, {
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

  useEffect(() => {
    fetchFranchises();
  }, []);

  const handleRevokeSubmit = async (e) => {
    e.preventDefault();
    if (!evidenceFile) return showToast("Please upload documentary evidence to proceed with revocation.", "error");
    
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
        showToast("Franchise successfully revoked.", "success");
        setSelectedFranchise(null);
        setEvidenceFile(null);
        fetchFranchises();
      } else {
        showToast("Failed to revoke franchise.", "error");
      }
    } catch {
      showToast("Network Error occurred while revoking franchise.", "error");
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

      {/* Header Ribbon */}
      <PageHeader
        title="Manage Revocations"
        subtitle="Process violations and revoke operator franchises securely."
      />

      <div className="bg-white dark:bg-[#1C1917] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] overflow-hidden transition-colors">
        {/* TABS */}
        <div className="flex border-b border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F]">
          <button 
            onClick={() => { setActiveTab('active'); setSearchQuery(''); }}
            className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'active' 
                ? 'text-[#9E2A2B] dark:text-[#F6F5F3] border-b-2 border-[#9E2A2B] bg-white dark:bg-[#1C1917]' 
                : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] hover:bg-[#E4E1DC]/30 dark:hover:bg-[#2E2A27]/30'
            }`}
          >
            <ShieldAlert size={16} /> Active Operators
          </button>
          <button 
            onClick={() => { setActiveTab('revoked'); setSearchQuery(''); }}
            className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'revoked' 
                ? 'text-red-700 dark:text-red-400 border-b-2 border-red-700 dark:border-red-400 bg-white dark:bg-[#1C1917]' 
                : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] hover:bg-[#E4E1DC]/30 dark:hover:bg-[#2E2A27]/30'
            }`}
          >
            <AlertTriangle size={16} /> Revoked Records
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="p-3.5 sm:p-4 border-b border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F]">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6761] dark:text-[#A8A29E]" size={16} />
            <input
              type="text"
              placeholder="Search by operator name or plate no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg text-xs sm:text-sm text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] transition-all"
            />
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] text-xs uppercase tracking-wider font-semibold">
                <th className="p-3.5 pl-5">Operator & Vehicle</th>
                {activeTab === 'revoked' && <th className="p-3.5">Violation Details</th>}
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center pr-5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27] text-xs">
              {isLoading ? (
                <TableRowsSkeleton rows={5} columns={activeTab === 'revoked' ? 4 : 3} baseDelay={30} stepDelay={45} />
              ) : filteredFranchises.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-[#6B6761] dark:text-[#A8A29E]">
                    <div className="flex flex-col items-center justify-center">
                      <CheckCircle size={36} className="text-[#6B6761] dark:text-[#A8A29E] opacity-50 mb-2"/>
                      <p className="font-semibold text-sm text-[#1F1D1B] dark:text-[#F6F5F3]">No records found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedFranchises.map((f) => (
                  <tr 
                    key={f._id} 
                    className="hover:bg-[#F6F5F3]/80 dark:hover:bg-[#14110F]/80 transition-colors"
                  >
                      <td className="p-3.5 pl-5">
                        <p className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] text-sm">{f.fullName}</p>
                        <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5 flex items-center gap-1.5">
                          <span>Plate:</span>
                          <span className="font-mono font-medium px-1.5 py-0.2 rounded bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3]">{f.plateNo || 'N/A'}</span>
                          <span>&bull;</span>
                          <span>{f.todaName}</span>
                        </p>
                      </td>
                      
                      {activeTab === 'revoked' && (
                        <td className="p-3.5">
                          <p className="text-xs font-semibold text-red-700 dark:text-red-400">{f.cancelReason}</p>
                          <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5">Revoked on: {new Date(f.updatedAt).toLocaleDateString()}</p>
                        </td>
                      )}

                      <td className="p-3.5 text-center">
                        <StatusBadge status={f.status} />
                      </td>
                      
                      <td className="p-3.5 pr-5 text-center">
                        {activeTab === 'active' ? (
                          <button 
                            onClick={() => setSelectedFranchise(f)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/60 cursor-pointer shadow-2xs"
                          >
                            <AlertTriangle size={13} /> Issue Revocation
                          </button>
                        ) : (
                          <button 
                            onClick={() => setPreviewDoc(f.evidenceUrl)}
                            disabled={!f.evidenceUrl}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border cursor-pointer ${
                              f.evidenceUrl ? 'bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] border-[#E4E1DC] dark:border-[#2E2A27]' : 'bg-[#F6F5F3] dark:bg-[#14110F] text-[#6B6761] dark:text-[#A8A29E] border-[#E4E1DC] dark:border-[#2E2A27] cursor-not-allowed opacity-50'
                            }`}
                          >
                            <FileText size={13} /> View Evidence
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
          <div className="px-4 py-3 sm:px-5 bg-[#F6F5F3] dark:bg-[#14110F] border-t border-[#E4E1DC] dark:border-[#2E2A27] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs rounded-b-lg">
            <div className="flex items-center gap-2 text-[#6B6761] dark:text-[#A8A29E] font-medium flex-wrap justify-center sm:justify-start">
              <span>Showing</span>
              <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] tabular-nums">{startIndex + 1}</span>
              <span>to</span>
              <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] tabular-nums">{endIndex}</span>
              <span>of</span>
              <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] tabular-nums">{totalRecords}</span>
              <span>records</span>

              <span className="mx-1 text-[#E4E1DC] dark:text-[#2E2A27] hidden sm:inline">|</span>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <span className="text-xs">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-2 py-1 text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] cursor-pointer"
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
                className="inline-flex items-center justify-center p-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] text-[#1F1D1B] dark:text-[#F6F5F3] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
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
                        <span key={item} className="px-1.5 text-[#6B6761] select-none">
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
                        className={`min-w-[30px] h-[30px] rounded-lg font-semibold text-xs tabular-nums flex items-center justify-center transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-[#9E2A2B] text-white shadow-2xs'
                            : 'bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27]'
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
                className="inline-flex items-center justify-center p-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] text-[#1F1D1B] dark:text-[#F6F5F3] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
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
          <div className="absolute inset-0 bg-black/60 transition-opacity" onClick={() => !isSubmitting && setSelectedFranchise(null)}></div>
          
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] w-full max-w-lg rounded-lg shadow-xl relative z-10">
            <div className="p-5 border-b border-[#E4E1DC] dark:border-[#2E2A27] flex justify-between items-center bg-red-50/50 dark:bg-red-950/20 rounded-t-lg">
              <h2 className="text-base font-semibold text-red-800 dark:text-red-300 flex items-center gap-2"><AlertTriangle size={18}/> Revoke Franchise</h2>
              <button onClick={() => !isSubmitting && setSelectedFranchise(null)} className="text-[#6B6761] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] cursor-pointer"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleRevokeSubmit} className="p-5 space-y-4">
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-3.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] font-semibold uppercase tracking-wider mb-0.5">Target Operator</p>
                <p className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] text-base">{selectedFranchise.fullName}</p>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-1">
                  Plate Number: <span className="font-semibold font-mono text-[#1F1D1B] dark:text-[#F6F5F3] px-1.5 py-0.5 border border-[#E4E1DC] dark:border-[#2E2A27] rounded bg-white dark:bg-[#1C1917]">{selectedFranchise.plateNo}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] mb-1.5">Select Violation Committed</label>
                <select 
                  value={violation} 
                  onChange={(e) => setViolation(e.target.value)} 
                  className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] rounded-lg px-3 py-2 text-xs outline-none focus:border-red-500 cursor-pointer"
                >
                  {VIOLATIONS_LIST.map((v, i) => <option key={i} value={v}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] mb-1.5">Upload Documentary Evidence</label>
                <div className="border border-dashed border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] rounded-lg p-5 text-center transition-colors relative cursor-pointer">
                  <input 
                    type="file" 
                    accept=".pdf, image/*" 
                    onChange={(e) => setEvidenceFile(e.target.files[0])} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                  <UploadCloud className="mx-auto text-[#6B6761] dark:text-[#A8A29E] mb-1.5" size={28} />
                  <p className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{evidenceFile ? evidenceFile.name : 'Tap to upload order or ticket'}</p>
                  <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] mt-0.5">Accepts PDF, JPG, or PNG</p>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
                <button type="button" onClick={() => setSelectedFranchise(null)} className="flex-1 py-2 rounded-lg font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#E4E1DC] dark:hover:bg-[#2E2A27] border border-[#E4E1DC] dark:border-[#2E2A27] transition-colors text-xs cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2 rounded-lg font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />} 
                  {isSubmitting ? 'Processing...' : 'Confirm Revocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] shadow-sm rounded-lg px-4 py-3 flex items-center gap-3 max-w-sm">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
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
              <p className="text-xs font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] leading-snug">
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default ManageRevocations;
