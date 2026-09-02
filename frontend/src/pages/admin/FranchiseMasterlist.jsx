import React, { useState, useEffect, useCallback, useRef } from 'react';
import MainLayout from '../../components/MainLayout';
import { 
  FileText, Search, Filter, Archive, ArchiveRestore, CheckCircle, 
  Clock, AlertCircle, Loader2, X, CalendarDays, Printer,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Tag,
  ChevronDown, Check, CheckSquare, Square, RotateCcw, Eye,
  Car, User, ShieldCheck, FileCheck, Phone, MapPin, Hash, ExternalLink
} from 'lucide-react';

const STATUS_OPTIONS = [
  { label: 'Active', value: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { label: 'Pending', value: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { label: 'Ready for Pickup', value: 'Ready for Pickup', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { label: 'Expired', value: 'Expired', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { label: 'Cancelled', value: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-200' },
  { label: 'Revoked', value: 'Revoked', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

const FranchiseMasterlist = () => {
  const [franchises, setFranchises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('active'); 
  const [searchQuery, setSearchQuery] = useState('');
  
  // Multi-Select Status Filter
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isPageSizeDropdownOpen, setIsPageSizeDropdownOpen] = useState(false);
  
  const filterDropdownRef = useRef(null);
  const pageSizeDropdownRef = useRef(null);

  // View Details Modal State
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [docPreviewUrl, setDocPreviewUrl] = useState(null);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setIsFilterDropdownOpen(false);
      }
      if (pageSizeDropdownRef.current && !pageSizeDropdownRef.current.contains(event.target)) {
        setIsPageSizeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchFranchises = useCallback(async () => {
    setIsLoading(true);
    try {
      const isArchived = activeTab === 'archived';
      const statusParam = selectedStatuses.length > 0 ? selectedStatuses.join(',') : 'All';
      
      const queryParams = new URLSearchParams({
        archived: isArchived ? 'true' : 'false',
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: searchQuery.trim(),
        status: statusParam
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
  }, [activeTab, currentPage, pageSize, searchQuery, selectedStatuses]);

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

  const toggleStatusFilter = (statusVal) => {
    setCurrentPage(1);
    setSelectedStatuses(prev => 
      prev.includes(statusVal)
        ? prev.filter(s => s !== statusVal)
        : [...prev, statusVal]
    );
  };

  const removeSingleStatus = (statusVal) => {
    setCurrentPage(1);
    setSelectedStatuses(prev => prev.filter(s => s !== statusVal));
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedStatuses([]);
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

  const getExpirationDate = (dateApplied) => {
    if (!dateApplied) return 'N/A';
    const date = new Date(dateApplied);
    date.setFullYear(date.getFullYear() + 1); 
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const startRecordIndex = paginationMeta.totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecordIndex = Math.min(currentPage * pageSize, paginationMeta.totalRecords);
  const hasActiveFilters = searchQuery.trim() !== '' || selectedStatuses.length > 0;

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

      {/* DOCUMENT PREVIEW MODAL */}
      {docPreviewUrl && (
        <div className="fixed inset-0 z-[150] bg-slate-900/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="flex justify-between items-center w-full max-w-4xl mb-3">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <FileCheck size={18} className="text-[#D4AF37]" /> Document Attachment
            </h3>
            <button onClick={() => setDocPreviewUrl(null)} className="text-white hover:text-red-400 bg-white/10 p-2 rounded-xl transition-colors">
              <X size={18} />
            </button>
          </div>
          {docPreviewUrl.toLowerCase().includes('.pdf') ? (
            <iframe src={docPreviewUrl} className="w-full max-w-4xl h-[75vh] bg-white rounded-2xl shadow-2xl" title="PDF Preview" />
          ) : (
            <img src={docPreviewUrl} alt="Requirement Preview" className="max-h-[80vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl bg-slate-800" />
          )}
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {selectedFranchise && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedFranchise(null)}
          />
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-5 sm:p-6 flex justify-between items-center z-20 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#7A1B22]/10 dark:bg-[#7A1B22]/25 text-[#7A1B22] dark:text-[#D4AF37] flex items-center justify-center font-bold">
                  <Car size={20} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    {selectedFranchise.plateNo || 'PENDING PLATE'}
                    <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-lg uppercase tracking-wider border ${
                      selectedFranchise.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60' :
                      selectedFranchise.status === 'Ready for Pickup' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60' :
                      selectedFranchise.status === 'Expired' ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/60' :
                      (selectedFranchise.status === 'Cancelled' || selectedFranchise.status === 'Revoked') ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/60' :
                      'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                    }`}>
                      {selectedFranchise.status}
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">System ID: {selectedFranchise._id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedFranchise(null)} 
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-6 text-xs text-slate-700 dark:text-slate-300">

              {/* TIMELINE & DATES CARD */}
              <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5">
                <h3 className="text-[10px] font-black text-[#7A1B22] dark:text-[#D4AF37] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CalendarDays size={14} /> Registration Timeline & Validity
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-bold block text-[10px] uppercase">Date Applied</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatDate(selectedFranchise.dateApplied || selectedFranchise.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-bold block text-[10px] uppercase">Expiration Date</span>
                    <span className="font-black text-emerald-800 dark:text-emerald-400">{getExpirationDate(selectedFranchise.dateApplied)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-bold block text-[10px] uppercase">Application Type</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedFranchise.applicationType || 'New'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-bold block text-[10px] uppercase">Fiscal Year</span>
                    <span className="font-bold text-slate-900 dark:text-white">FY {new Date(selectedFranchise.dateApplied || selectedFranchise.createdAt).getFullYear()}</span>
                  </div>
                </div>
              </div>

              {/* OPERATOR DETAILS */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <User size={14} /> Operator Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-bold block text-[10px] uppercase">Full Name</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{selectedFranchise.fullName || (selectedFranchise.operator?.name) || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-bold block text-[10px] uppercase">Registered Barangay / Address</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedFranchise.address || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-bold block text-[10px] uppercase">TODA Association</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedFranchise.todaName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-bold block text-[10px] uppercase">Authorized Route Zone</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Zone {selectedFranchise.zone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* VEHICLE SPECIFICATIONS */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Car size={14} /> Tricycle Specifications
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-bold block text-[10px] uppercase">Make / Brand</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedFranchise.make || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-bold block text-[10px] uppercase">Year Made</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedFranchise.made || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-bold block text-[10px] uppercase">Motor Number</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{selectedFranchise.motorNo || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-bold block text-[10px] uppercase">Chassis Number</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{selectedFranchise.chassisNo || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* CEDULA & TAX INFO */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FileText size={14} /> Community Tax Certificate (Cedula)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-bold block text-[10px] uppercase">Serial Number</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedFranchise.cedulaSerialNo || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-bold block text-[10px] uppercase">Date Issued</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatDate(selectedFranchise.cedulaDate)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-bold block text-[10px] uppercase">Place Issued</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedFranchise.cedulaAddress || 'Gasan, Marinduque'}</span>
                  </div>
                </div>
              </div>

              {/* UPLOADED ATTACHMENTS */}
              <div>
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                  Document Attachments
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { label: 'OR/CR Motor', url: selectedFranchise.orCrUrl },
                    { label: "Driver's License", url: selectedFranchise.licenseUrl },
                    { label: 'TODA Endorsement', url: selectedFranchise.todaEndorsementUrl },
                    { label: 'Barangay Clearance', url: selectedFranchise.brgyClearanceUrl }
                  ].map((doc, i) => (
                    <div key={i}>
                      {doc.url ? (
                        <button
                          type="button"
                          onClick={() => setDocPreviewUrl(doc.url)}
                          className="w-full flex items-center justify-between p-2.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-colors text-left group"
                        >
                          <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 truncate">{doc.label}</span>
                          <Eye size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                        </button>
                      ) : (
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 dark:text-slate-500 text-[11px] font-medium text-center">
                          {doc.label} (None)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* CANCELLATION / REVOCATION REASON (Kung meron) */}
              {selectedFranchise.cancelReason && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-4">
                  <span className="text-[10px] font-bold uppercase text-red-600 dark:text-red-400 block mb-1">Reason for Rejection / Revocation:</span>
                  <p className="text-xs text-red-900 dark:text-red-200 font-medium">{selectedFranchise.cancelReason}</p>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-3xl">
              <button 
                type="button"
                onClick={() => setSelectedFranchise(null)} 
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <header className="mb-6 flex flex-col sm:flex-row justify-between sm:items-end gap-4 relative print-hide">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-[#7A1B22] rounded-full" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Franchise Masterlist</h1>
              <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-1 border border-blue-200 dark:border-blue-800/80 shadow-xs">
                <CalendarDays size={12} /> FY {currentFiscalYear}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Manage, query, multi-filter, inspect, and paginate official tricycle records.</p>
          </div>
        </div>

        <button 
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7A1B22] text-white hover:bg-[#5A1419] rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs active:scale-95"
        >
          <Printer size={16} /> Print / Save as PDF
        </button>
      </header>

      {/* MAIN TABLE CONTAINER */}
      <div id="printable-masterlist" className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden print:border-none print:shadow-none transition-colors">
        
        {/* PRINT HEADER */}
        <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-4 pt-4">
          <p className="text-xs font-bold uppercase tracking-wider">Municipality of Gasan</p>
          <p className="text-lg font-black uppercase mt-0.5 text-[#7A1B22]">Franchise Masterlist Report</p>
          <p className="text-[10px] text-slate-500 font-medium mt-1">Fiscal Year {currentFiscalYear} | Tab: {activeTab.toUpperCase()}</p>
        </div>

        {/* TABS */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 print-hide">
          <button 
            onClick={() => handleTabChange('active')}
            className={`flex-1 py-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'active' ? 'text-[#7A1B22] dark:text-[#D4AF37] border-b-2 border-[#7A1B22] dark:border-[#D4AF37] bg-white dark:bg-slate-900' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText size={18} /> Active Records
          </button>
          <button 
            onClick={() => handleTabChange('archived')}
            className={`flex-1 py-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'archived' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] bg-white dark:bg-slate-900' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Archive size={18} /> Archives
          </button>
        </div>

        {/* SEARCH AND CUSTOM FILTER CONTROLS */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-3 sm:gap-4 justify-between items-stretch md:items-center bg-white dark:bg-slate-900 print-hide">
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search Name, Plate, Motor, Chassis..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#7A1B22] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-[#7A1B22]/15 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2.5 shrink-0 justify-between md:justify-end">
            
            {/* MULTI-SELECT STATUS FILTER POPOVER */}
            <div className="relative flex-1 sm:flex-initial" ref={filterDropdownRef}>
              <button
                type="button"
                onClick={() => setIsFilterDropdownOpen(prev => !prev)}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border flex items-center justify-between gap-2.5 transition-all shadow-xs ${
                  selectedStatuses.length > 0 
                    ? 'bg-[#7A1B22] text-white border-[#7A1B22]' 
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Filter size={15} className={selectedStatuses.length > 0 ? 'text-white' : 'text-slate-400'} />
                  <span>Status Filter</span>
                  {selectedStatuses.length > 0 && (
                    <span className="w-5 h-5 rounded-full bg-white text-[#7A1B22] text-[10px] font-black flex items-center justify-center">
                      {selectedStatuses.length}
                    </span>
                  )}
                </div>
                <ChevronDown size={15} className={`transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFilterDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 px-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Select Statuses</span>
                    {selectedStatuses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => { setSelectedStatuses([]); setCurrentPage(1); }}
                        className="text-[10px] font-bold text-[#7A1B22] dark:text-[#D4AF37] hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {STATUS_OPTIONS.map((opt) => {
                      const isSelected = selectedStatuses.includes(opt.value);
                      return (
                        <div
                          key={opt.value}
                          onClick={() => toggleStatusFilter(opt.value)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {isSelected ? (
                              <CheckSquare size={16} className="text-[#7A1B22] dark:text-[#D4AF37]" />
                            ) : (
                              <Square size={16} className="text-slate-300 dark:text-slate-600" />
                            )}
                            <span>{opt.label}</span>
                          </div>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full border ${opt.color}`}>
                            {opt.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ROWS PER PAGE DROPDOWN */}
            <div className="relative shrink-0" ref={pageSizeDropdownRef}>
              <button
                type="button"
                onClick={() => setIsPageSizeDropdownOpen(prev => !prev)}
                className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <span className="text-slate-400 dark:text-slate-500 text-[11px] font-medium hidden sm:inline">Rows:</span>
                <span>{pageSize}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {isPageSizeDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-28 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setPageSize(size);
                        setCurrentPage(1);
                        setIsPageSizeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        pageSize === size 
                          ? 'bg-[#7A1B22] text-white' 
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{size} rows</span>
                      {pageSize === size && <Check size={13} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ACTIVE FILTER PILLS */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 px-4 sm:px-6 py-3 bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 print-hide animate-in fade-in duration-150">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1 mr-1">
              <Tag size={12} /> Active Filters:
            </span>

            {searchQuery.trim() !== '' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs">
                <span>Search: <strong className="text-slate-900 dark:text-white font-black">"{searchQuery}"</strong></span>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                  className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X size={13} />
                </button>
              </span>
            )}

            {selectedStatuses.map((statusVal) => {
              const matchedOption = STATUS_OPTIONS.find(o => o.value === statusVal);
              return (
                <span
                  key={statusVal}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#7A1B22]/10 dark:bg-[#7A1B22]/25 border border-[#7A1B22]/20 dark:border-[#7A1B22]/40 text-[#7A1B22] dark:text-[#D4AF37] text-xs font-bold shadow-xs"
                >
                  <span>Status: <strong className="font-black">{matchedOption ? matchedOption.label : statusVal}</strong></span>
                  <button
                    type="button"
                    onClick={() => removeSingleStatus(statusVal)}
                    className="p-0.5 hover:bg-[#7A1B22]/20 rounded-md text-[#7A1B22] dark:text-[#D4AF37] hover:text-red-600 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </span>
              );
            })}

            <button
              type="button"
              onClick={clearAllFilters}
              className="text-[11px] font-bold text-slate-400 dark:text-slate-500 hover:text-[#7A1B22] dark:hover:text-[#D4AF37] flex items-center gap-1 ml-1 cursor-pointer transition-colors"
            >
              <RotateCcw size={12} /> Clear all
            </button>
          </div>
        )}

        {/* TABLE CONTENT */}
        <div className="overflow-x-auto min-h-[320px]">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-24 print-hide">
              <Loader2 className="animate-spin text-[#7A1B22] dark:text-[#D4AF37]" size={36} />
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-2">Loading paginated records...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                  <th className="p-4 pl-6">Operator Details</th>
                  <th className="p-4">Tricycle Info</th>
                  <th className="p-4">TODA / Zone</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center pr-6 print-hide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {franchises.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-slate-500 dark:text-slate-400 print-hide">
                      <div className="flex flex-col items-center justify-center">
                        {activeTab === 'archived' ? <Archive size={40} className="text-slate-300 dark:text-slate-600 mb-3"/> : <FileText size={40} className="text-slate-300 dark:text-slate-600 mb-3"/>}
                        <p className="font-bold text-base text-slate-700 dark:text-slate-200">No records found</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Try changing search keywords or remove some filter tags.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  franchises.map((f) => {
                    const displayName = f.fullName || (f.operator ? f.operator.name : 'Unknown Operator');
                    const recordYear = new Date(f.dateApplied || f.createdAt).getFullYear().toString();
                    
                    return (
                      <tr key={f._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="p-4 pl-6">
                          <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {displayName}
                            {recordYear !== currentFiscalYear && (
                               <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] rounded uppercase tracking-wider font-black border border-slate-300 dark:border-slate-700">
                                 FY {recordYear}
                               </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{f.address}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-black text-slate-800 dark:text-slate-900 tracking-wider bg-yellow-100 inline-block px-2 py-0.5 border border-yellow-300 rounded mb-1 text-[11px] shadow-xs">
                            {f.plateNo || 'N/A'}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Motor: {f.motorNo}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800 dark:text-slate-200">{f.todaName}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Zone {f.zone}</p>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider border shadow-xs ${
                            f.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60' :
                            f.status === 'Ready for Pickup' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60' :
                            f.status === 'Expired' ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/60' :
                            (f.status === 'Cancelled' || f.status === 'Revoked') ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/60' :
                            'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                          }`}>
                            {f.status === 'Active' && <CheckCircle size={12}/>}
                            {f.status === 'Pending' && <Clock size={12}/>}
                            {(f.status === 'Cancelled' || f.status === 'Expired' || f.status === 'Revoked') && <AlertCircle size={12}/>}
                            {f.status}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-center print-hide">
                          <div className="flex items-center justify-center gap-1.5">
                            
                            {/* VIEW DETAILS BUTTON */}
                            <button
                              type="button"
                              onClick={() => setSelectedFranchise(f)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-xs active:scale-95"
                              title="View Full Specifications"
                            >
                              <Eye size={13} className="text-[#7A1B22] dark:text-[#D4AF37]" /> Details
                            </button>

                            {/* ARCHIVE / RESTORE BUTTON */}
                            {!f.isArchived ? (
                              f.status === 'Active' ? (
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                                  Protected
                                </span>
                              ) : (
                                <button 
                                  onClick={() => initiateToggleArchive(f._id, displayName, f.isArchived)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl transition-all border shadow-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 active:scale-95"
                                  title="Archive Record"
                                >
                                  <Archive size={13} /> Archive
                                </button>
                              )
                            ) : (
                              <button 
                                onClick={() => initiateToggleArchive(f._id, displayName, f.isArchived)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl transition-all border shadow-xs bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 active:scale-95"
                                title="Restore Record"
                              >
                                <ArchiveRestore size={13} /> Restore
                              </button>
                            )}
                          </div>
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
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 flex flex-col sm:flex-row justify-between items-center gap-4 print-hide">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Showing <span className="text-slate-900 dark:text-white font-black">{startRecordIndex}</span> to <span className="text-slate-900 dark:text-white font-black">{endRecordIndex}</span> of <span className="text-[#7A1B22] dark:text-[#D4AF37] font-black">{paginationMeta.totalRecords}</span> entries
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1 || isLoading}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="First Page"
            >
              <ChevronsLeft size={16} />
            </button>

            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={!paginationMeta.hasPrevPage || isLoading}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
            >
              <ChevronLeft size={14} /> Prev
            </button>

            <span className="px-3 py-1 text-xs font-black text-[#7A1B22] dark:text-[#D4AF37] bg-white dark:bg-slate-800 border border-[#7A1B22]/20 dark:border-[#7A1B22]/40 rounded-xl shadow-xs">
              Page {paginationMeta.currentPage} of {paginationMeta.totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, paginationMeta.totalPages))}
              disabled={!paginationMeta.hasNextPage || isLoading}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
            >
              Next <ChevronRight size={14} />
            </button>

            <button
              onClick={() => setCurrentPage(paginationMeta.totalPages)}
              disabled={currentPage === paginationMeta.totalPages || isLoading}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Last Page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* ARCHIVE / RESTORE CONFIRMATION MODAL */}
      {confirmModal.isOpen && confirmModal.data && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !isProcessing && setConfirmModal({ isOpen: false, data: null })}
          />
          
          <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200">
            <button 
              disabled={isProcessing}
              onClick={() => setConfirmModal({ isOpen: false, data: null })}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>

            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border-4 border-white dark:border-slate-800 ${
              confirmModal.data.action === 'Archive' ? 'bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400' : 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
            }`}>
              {confirmModal.data.action === 'Archive' ? <Archive size={28} /> : <ArchiveRestore size={28} />}
            </div>
            
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">
              {confirmModal.data.action} Record?
            </h3>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to {confirmModal.data.action.toLowerCase()} the franchise record of <strong className="text-slate-800 dark:text-slate-200">{confirmModal.data.name}</strong>?
            </p>

            <div className="flex gap-3">
              <button 
                disabled={isProcessing}
                onClick={() => setConfirmModal({ isOpen: false, data: null })}
                className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs disabled:opacity-50"
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