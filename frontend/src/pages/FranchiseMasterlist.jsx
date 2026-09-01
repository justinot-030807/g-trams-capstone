import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../components/MainLayout';
import { 
  FileText, Search, Filter, Archive, ArchiveRestore, CheckCircle, 
  Clock, AlertCircle, Loader2, X, CalendarDays, Printer,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';

const FranchiseMasterlist = () => {
  const [franchises, setFranchises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('active'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Server-Side Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paginationMeta, setPaginationMeta] = useState({
    totalRecords: 0,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false
  });

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, data: null });
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const currentFiscalYear = localStorage.getItem('fiscal_year') || new Date().getFullYear().toString();

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  const fetchFranchises = useCallback(async () => {
    setIsLoading(true);
    try {
      const isArchived = activeTab === 'archived';
      const queryParams = new URLSearchParams({
        archived: isArchived ? 'true' : 'false',
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: searchQuery.trim(),
        status: statusFilter
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/franchises?${queryParams.toString()}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.data && result.pagination) {
          setFranchises(result.data);
          setPaginationMeta(result.pagination);
        } else if (Array.isArray(result)) {
          setFranchises(result);
        }
      } else {
        showToast('Failed to retrieve franchise list.', 'error');
      }
    } catch (error) {
      console.error('Error fetching masterlist:', error);
      showToast('Network error loading franchise masterlist.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, currentPage, pageSize, searchQuery, statusFilter]);

  // Debounced search query handler
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchFranchises();
    }, 300);

    return () => clearTimeout(handler);
  }, [fetchFranchises]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  const initiateToggleArchive = (id, currentName, isArchived) => {
    const actionType = isArchived ? 'Restore' : 'Archive';
    setConfirmModal({
      isOpen: true,
      data: { id, name: currentName, action: actionType, targetState: !isArchived }
    });
  };

  const confirmAction = async () => {
    if (!confirmModal.data) return;
    setIsProcessing(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/${confirmModal.data.id}/archive`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isArchived: confirmModal.data.targetState })
      });

      if (response.ok) {
        showToast(`Record successfully ${confirmModal.data.action.toLowerCase()}d!`);
        setConfirmModal({ isOpen: false, data: null });
        fetchFranchises(); 
      } else {
        const errorData = await response.json();
        showToast(`Failed: ${errorData.message || 'Route not found.'}`, 'error');
        setConfirmModal({ isOpen: false, data: null });
      }
    } catch (error) {
      showToast('Network Error. Please check your connection.', 'error');
      setConfirmModal({ isOpen: false, data: null });
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecordIndex = paginationMeta.totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecordIndex = Math.min(currentPage * pageSize, paginationMeta.totalRecords);

  return (
    <MainLayout>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-masterlist, #printable-masterlist * { visibility: visible; }
          #printable-masterlist { position: absolute; left: 0; top: 0; width: 100%; }
          .print-hide { display: none !important; }
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

      <header className="mb-8 flex flex-col sm:flex-row justify-between sm:items-end gap-4 relative print-hide">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Franchise Masterlist</h1>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-1 border border-blue-200 shadow-xs">
              <CalendarDays size={12} /> FY {currentFiscalYear}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage, query, search, and paginate official tricycle records.</p>
        </div>

        <button 
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7A1B22] text-white hover:bg-[#5A1419] rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs active:scale-95"
        >
          <Printer size={16} /> Print / Save as PDF
        </button>
      </header>

      {/* MAIN CONTAINER */}
      <div id="printable-masterlist" className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
        
        {/* PRINT HEADER */}
        <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-4 pt-4">
          <p className="text-xs font-bold uppercase tracking-wider">Municipality of Gasan</p>
          <p className="text-lg font-black uppercase mt-0.5 text-[#7A1B22]">Franchise Masterlist Report</p>
          <p className="text-[10px] text-slate-500 font-medium mt-1">Fiscal Year {currentFiscalYear} | Tab: {activeTab.toUpperCase()}</p>
        </div>

        {/* TABS[cite: 33] */}
        <div className="flex border-b border-slate-200 bg-slate-50 print-hide">
          <button 
            onClick={() => handleTabChange('active')}
            className={`flex-1 py-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'active' ? 'text-[#7A1B22] border-b-2 border-[#7A1B22] bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileText size={18} /> Active Records
          </button>
          <button 
            onClick={() => handleTabChange('archived')}
            className={`flex-1 py-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'archived' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Archive size={18} /> Archives
          </button>
        </div>

        {/* SEARCH AND FILTER CONTROLS */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-white print-hide">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Server search (Name, Plate, Motor, Chassis)..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-[#7A1B22] focus:ring-2 focus:ring-[#7A1B22]/20 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="text-slate-400 shrink-0" size={18} />
              <select 
                value={statusFilter}
                onChange={handleStatusChange}
                className="w-full md:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-700 outline-none cursor-pointer focus:border-[#7A1B22]"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Ready for Pickup">Ready for Pickup</option>
                <option value="Expired">Expired</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Revoked">Revoked</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-bold text-slate-400 hidden sm:inline">Rows:</span>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer focus:border-[#7A1B22]"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLE CONTENT */}
        <div className="overflow-x-auto min-h-[320px]">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-24 print-hide">
              <Loader2 className="animate-spin text-[#7A1B22]" size={36} />
              <p className="text-xs font-bold text-slate-400 mt-2">Loading paginated records...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                  <th className="p-4 pl-6">Operator Details</th>
                  <th className="p-4">Tricycle Info</th>
                  <th className="p-4">TODA / Zone</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center pr-6 print-hide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {franchises.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-slate-500 print-hide">
                      <div className="flex flex-col items-center justify-center">
                        {activeTab === 'archived' ? <Archive size={40} className="text-slate-300 mb-3"/> : <FileText size={40} className="text-slate-300 mb-3"/>}
                        <p className="font-bold text-base text-slate-700">No records found</p>
                        <p className="text-xs text-slate-400 mt-0.5">Try searching with different terms or reset your filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  franchises.map((f) => {
                    const displayName = f.fullName || (f.operator ? f.operator.name : 'Unknown Operator');
                    const recordYear = new Date(f.dateApplied || f.createdAt).getFullYear().toString();
                    
                    return (
                      <tr key={f._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 pl-6">
                          <p className="font-bold text-slate-900 flex items-center gap-2">
                            {displayName}
                            {recordYear !== currentFiscalYear && (
                               <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[9px] rounded uppercase tracking-wider font-black">
                                 FY {recordYear}
                               </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{f.address}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-black text-slate-800 tracking-wider bg-yellow-100 inline-block px-2 py-0.5 border border-yellow-300 rounded mb-1 text-[11px] shadow-xs">
                            {f.plateNo || 'N/A'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium">Motor: {f.motorNo}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{f.todaName}</p>
                          <p className="text-[11px] text-slate-500">Zone {f.zone}</p>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider border shadow-xs ${
                            f.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            f.status === 'Ready for Pickup' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            f.status === 'Expired' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            (f.status === 'Cancelled' || f.status === 'Revoked') ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {f.status === 'Active' && <CheckCircle size={12}/>}
                            {f.status === 'Pending' && <Clock size={12}/>}
                            {(f.status === 'Cancelled' || f.status === 'Expired' || f.status === 'Revoked') && <AlertCircle size={12}/>}
                            {f.status}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-center print-hide">
                          {!f.isArchived ? (
                            f.status === 'Active' ? (
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                                Protected
                              </span>
                            ) : (
                              <button 
                                onClick={() => initiateToggleArchive(f._id, displayName, f.isArchived)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all border shadow-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 active:scale-95"
                              >
                                <Archive size={14} /> Archive
                              </button>
                            )
                          ) : (
                            <button 
                              onClick={() => initiateToggleArchive(f._id, displayName, f.isArchived)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all border shadow-xs bg-white hover:bg-blue-50 text-blue-600 border-blue-200 active:scale-95"
                            >
                              <ArchiveRestore size={14} /> Restore
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION CONTROLS */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row justify-between items-center gap-4 print-hide">
          <p className="text-xs font-bold text-slate-500">
            Showing <span className="text-slate-900 font-black">{startRecordIndex}</span> to <span className="text-slate-900 font-black">{endRecordIndex}</span> of <span className="text-[#7A1B22] font-black">{paginationMeta.totalRecords}</span> entries
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1 || isLoading}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="First Page"
            >
              <ChevronsLeft size={16} />
            </button>

            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={!paginationMeta.hasPrevPage || isLoading}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
            >
              <ChevronLeft size={14} /> Prev
            </button>

            <span className="px-3 py-1 text-xs font-black text-[#7A1B22] bg-white border border-[#7A1B22]/20 rounded-xl shadow-xs">
              Page {paginationMeta.currentPage} of {paginationMeta.totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, paginationMeta.totalPages))}
              disabled={!paginationMeta.hasNextPage || isLoading}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
            >
              Next <ChevronRight size={14} />
            </button>

            <button
              onClick={() => setCurrentPage(paginationMeta.totalPages)}
              disabled={currentPage === paginationMeta.totalPages || isLoading}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Last Page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* CONFIRMATION MODAL[cite: 33] */}
      {confirmModal.isOpen && confirmModal.data && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !isProcessing && setConfirmModal({ isOpen: false, data: null })}
          />
          
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200">
            <button 
              disabled={isProcessing}
              onClick={() => setConfirmModal({ isOpen: false, data: null })}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>

            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border-4 border-white ${
              confirmModal.data.action === 'Archive' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {confirmModal.data.action === 'Archive' ? <Archive size={28} /> : <ArchiveRestore size={28} />}
            </div>
            
            <h3 className="text-xl font-black text-slate-900 mb-1">
              {confirmModal.data.action} Record?
            </h3>
            
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to {confirmModal.data.action.toLowerCase()} the franchise record of <strong className="text-slate-800">{confirmModal.data.name}</strong>?
            </p>

            <div className="flex gap-3">
              <button 
                disabled={isProcessing}
                onClick={() => setConfirmModal({ isOpen: false, data: null })}
                className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-xs disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                disabled={isProcessing}
                onClick={confirmAction}
                className={`flex-1 py-3 rounded-xl font-bold text-white transition-all text-xs shadow-sm flex justify-center items-center gap-2 ${
                  confirmModal.data.action === 'Archive' ? 'bg-[#7A1B22] hover:bg-[#5A1419]' : 'bg-blue-600 hover:bg-blue-700'
                } disabled:opacity-80 disabled:cursor-not-allowed`}
              >
                {isProcessing && <Loader2 size={15} className="animate-spin" />}
                {isProcessing ? 'Processing...' : `Yes, ${confirmModal.data.action}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default FranchiseMasterlist;