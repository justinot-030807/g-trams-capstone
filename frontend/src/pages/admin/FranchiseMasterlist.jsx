import React, { useState, useEffect, useCallback, useRef } from 'react';
import MainLayout from '../../components/MainLayout';
import { 
  FileText, Search, Filter, Archive, ArchiveRestore, CheckCircle, CheckCircle2,
  Clock, AlertCircle, Loader2, X, CalendarDays, Printer,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Tag,
  ChevronDown, Check, CheckSquare, Square, RotateCcw, Eye,
  User, ShieldCheck, Shield, FileCheck, Phone, MapPin, Hash, ExternalLink
} from 'lucide-react';
import { TableRowsSkeleton } from '../../components/skeleton';
import MtopCertificateModal from '../../components/admin/MtopCertificateModal';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import TricycleIcon from '../../components/common/TricycleIcon';

const STATUS_OPTIONS = [
  { label: 'Active', value: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' },
  { label: 'Pending', value: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' },
  { label: 'For Signing', value: 'For Signing', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' },
  { label: 'Ready for Pickup', value: 'Ready for Pickup', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' },
  { label: 'Expired', value: 'Expired', color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800' },
  { label: 'Cancelled', value: 'Cancelled', color: 'bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB] dark:bg-[#1F2937] dark:text-[#9CA3AF] dark:border-[#374151]' },
  { label: 'Revoked', value: 'Revoked', color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800' },
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

  // Printable MTOP Certificate State
  const [printMtopUnit, setPrintMtopUnit] = useState(null);

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
          body:not(.printing-mtop) * { visibility: hidden; }
          body:not(.printing-mtop) #printable-masterlist,
          body:not(.printing-mtop) #printable-masterlist * { visibility: visible; }
          body:not(.printing-mtop) #printable-masterlist { position: absolute; left: 0; top: 0; width: 100%; }
          .print-hide { display: none !important; }
        }
      `}</style>

      {/* Minimalist Floating Toast Notification */}
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

      {/* DOCUMENT PREVIEW MODAL */}
      {docPreviewUrl && (
        <div className="fixed inset-0 z-[150] bg-black/75 flex flex-col items-center justify-center p-4 animate-in fade-in">
          <div className="flex justify-between items-center w-full max-w-4xl mb-3">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <FileCheck size={18} className="text-[#D4AF37]" /> Document Attachment
            </h3>
            <button onClick={() => setDocPreviewUrl(null)} className="text-white hover:text-red-400 bg-white/10 p-2 rounded-lg transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>
          {docPreviewUrl.toLowerCase().includes('.pdf') ? (
            <iframe src={docPreviewUrl} className="w-full max-w-4xl h-[75vh] bg-white rounded-lg shadow-sm border border-[#E4E1DC] dark:border-[#2E2A27]" title="PDF Preview" />
          ) : (
            <img src={docPreviewUrl} alt="Requirement Preview" className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-sm bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27]" />
          )}
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {selectedFranchise && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 transition-opacity"
            onClick={() => setSelectedFranchise(null)}
          />
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] w-full max-w-3xl rounded-lg shadow-xl relative z-10 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-[#1C1917] border-b border-[#E4E1DC] dark:border-[#2E2A27] p-5 flex justify-between items-center z-20 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#9E2A2B]/20 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center font-semibold">
                  <TricycleIcon size={22} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] flex items-center gap-2">
                    <span className="font-mono">{selectedFranchise.plateNo || 'PENDING PLATE'}</span>
                    <StatusBadge status={selectedFranchise.status} />
                  </h2>
                  <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-mono">System ID: {selectedFranchise._id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedFranchise(null)} 
                className="p-1.5 text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 text-xs text-[#1F1D1B] dark:text-[#F6F5F3]">

              {/* TIMELINE & DATES CARD */}
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-4">
                <h3 className="text-xs font-semibold text-[#9E2A2B] dark:text-[#D4AF37] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CalendarDays size={14} /> Registration Timeline & Validity
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] font-medium block text-xs uppercase">Date Applied</span>
                    <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{formatDate(selectedFranchise.dateApplied || selectedFranchise.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] font-medium block text-xs uppercase">Expiration Date</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">{getExpirationDate(selectedFranchise.dateApplied)}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] font-medium block text-xs uppercase">Application Type</span>
                    <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{selectedFranchise.applicationType || 'New'}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] font-medium block text-xs uppercase">Fiscal Year</span>
                    <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">FY {new Date(selectedFranchise.dateApplied || selectedFranchise.createdAt).getFullYear()}</span>
                  </div>
                </div>
              </div>

              {/* OPERATOR DETAILS */}
              <div className="border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-4">
                <h3 className="text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <User size={14} /> Operator Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] font-medium block text-xs uppercase">Full Name</span>
                    <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] text-sm">{selectedFranchise.fullName || (selectedFranchise.operator?.name) || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] font-medium block text-xs uppercase">Registered Barangay / Address</span>
                    <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{selectedFranchise.address || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] font-medium block text-xs uppercase">TODA Association</span>
                    <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{selectedFranchise.todaName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] font-medium block text-xs uppercase">Authorized Route Zone</span>
                    <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">Zone {selectedFranchise.zone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* VEHICLE SPECIFICATIONS */}
              <div className="border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-4">
                <h3 className="text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <TricycleIcon size={15} className="text-[#6B6761] dark:text-[#A8A29E]" /> Tricycle Specifications
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] font-medium block text-xs uppercase">Make / Brand</span>
                    <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{selectedFranchise.make || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] font-medium block text-xs uppercase">Year Made</span>
                    <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{selectedFranchise.made || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] font-medium block text-xs uppercase">Motor Number</span>
                    <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] font-mono">{selectedFranchise.motorNo || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] font-medium block text-xs uppercase">Chassis Number</span>
                    <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] font-mono">{selectedFranchise.chassisNo || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* CEDULA & TAX INFO */}
              <div className="border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-4">
                <h3 className="text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FileText size={14} /> Community Tax Certificate (Cedula)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] font-medium block text-xs uppercase">Serial Number</span>
                    <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{selectedFranchise.cedulaSerialNo || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] font-medium block text-xs uppercase">Date Issued</span>
                    <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{formatDate(selectedFranchise.cedulaDate)}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] font-medium block text-xs uppercase">Place Issued</span>
                    <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{selectedFranchise.cedulaAddress || 'Gasan, Marinduque'}</span>
                  </div>
                </div>
              </div>

              {/* UPLOADED ATTACHMENTS */}
              <div>
                <h3 className="text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider mb-3">
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
                          className="w-full flex items-center justify-between p-2.5 bg-[#F6F5F3] hover:bg-[#E4E1DC] dark:bg-[#14110F] dark:hover:bg-[#2E2A27] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg transition-colors text-left cursor-pointer"
                        >
                          <span className="text-xs font-medium text-[#1F1D1B] dark:text-[#F6F5F3] truncate">{doc.label}</span>
                          <Eye size={14} className="text-[#9E2A2B] dark:text-[#D4AF37] shrink-0" />
                        </button>
                      ) : (
                        <div className="p-2.5 bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg text-[#6B6761] dark:text-[#A8A29E] text-xs font-medium text-center">
                          {doc.label} (None)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cancellation or revocation reason */}
              {selectedFranchise.cancelReason && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-4">
                  <span className="text-xs font-semibold uppercase text-red-600 dark:text-red-400 block mb-1">
                    {selectedFranchise.status === 'Cancelled' ? 'Reason for Cancellation / Rejection:' : 'Reason for Revocation:'}
                  </span>
                  <p className="text-xs text-red-900 dark:text-red-200 font-medium">{selectedFranchise.cancelReason}</p>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-[#E4E1DC] dark:border-[#2E2A27] flex justify-end gap-2 bg-[#F6F5F3] dark:bg-[#14110F] rounded-b-lg">
              {selectedFranchise.status === 'Active' && (
                <button
                  type="button"
                  onClick={() => setPrintMtopUnit(selectedFranchise)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  <Printer size={14} /> Print Official MTOP
                </button>
              )}
              <button 
                type="button"
                onClick={() => setSelectedFranchise(null)} 
                className="px-4 py-2 bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] border border-[#E4E1DC] dark:border-[#2E2A27] font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER RIBBON */}
      <PageHeader
        title="Franchise Masterlist"
        subtitle={`Manage, query, multi-filter, review, and paginate official tricycle records (FY ${currentFiscalYear}).`}
        actions={
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg font-semibold text-xs transition-colors cursor-pointer"
          >
            <Printer size={14} />
            <span>Print / Save as PDF</span>
          </button>
        }
      />

      {/* MAIN TABLE CONTAINER */}
      <div id="printable-masterlist" className="bg-white dark:bg-[#1C1917] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] overflow-hidden print:border-none print:shadow-none transition-colors">
        
        {/* PRINT HEADER */}
        <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-4 pt-4">
          <p className="text-xs font-bold uppercase tracking-wider">Municipality of Gasan</p>
          <p className="text-lg font-bold uppercase mt-0.5 text-[#9E2A2B]">Franchise Masterlist Report</p>
          <p className="text-xs text-[#6B6761] font-medium mt-1">Fiscal Year {currentFiscalYear} | Tab: {activeTab.toUpperCase()}</p>
        </div>

        {/* TABS */}
        <div className="flex border-b border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] print-hide">
          <button 
            onClick={() => handleTabChange('active')}
            className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'active' 
                ? 'text-[#9E2A2B] dark:text-[#F6F5F3] border-b-2 border-[#9E2A2B] bg-white dark:bg-[#1C1917]' 
                : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] hover:bg-[#E4E1DC]/30 dark:hover:bg-[#2E2A27]/30'
            }`}
          >
            <FileText size={16} /> Master Records
          </button>
          <button 
            onClick={() => handleTabChange('archived')}
            className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'archived' 
                ? 'text-[#9E2A2B] dark:text-[#F6F5F3] border-b-2 border-[#9E2A2B] bg-white dark:bg-[#1C1917]' 
                : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] hover:bg-[#E4E1DC]/30 dark:hover:bg-[#2E2A27]/30'
            }`}
          >
            <Archive size={16} /> Historical Archives
          </button>
        </div>

        {/* SEARCH AND CUSTOM FILTER CONTROLS */}
        <div className="p-3.5 sm:p-4 border-b border-[#E4E1DC] dark:border-[#2E2A27] flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center bg-white dark:bg-[#1C1917] print-hide">
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6761] dark:text-[#A8A29E]" size={16} />
            <input
              type="text"
              placeholder="Search Name, Plate, Motor, Chassis..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-3.5 py-2 bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg text-xs sm:text-sm font-normal text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:bg-white dark:focus:bg-[#1C1917] focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2 shrink-0 justify-between md:justify-end">
            
            {/* MULTI-SELECT STATUS FILTER POPOVER */}
            <div className="relative flex-1 sm:flex-initial" ref={filterDropdownRef}>
              <button
                type="button"
                onClick={() => setIsFilterDropdownOpen(prev => !prev)}
                className={`w-full sm:w-auto px-3.5 py-2 rounded-lg text-xs font-semibold border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                  selectedStatuses.length > 0 
                    ? 'bg-[#9E2A2B] text-white border-[#9E2A2B]' 
                    : 'bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-[#E4E1DC] dark:hover:bg-[#2E2A27]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Filter size={14} className={selectedStatuses.length > 0 ? 'text-white' : 'text-[#6B6761] dark:text-[#A8A29E]'} />
                  <span>Status Filter</span>
                  {selectedStatuses.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-white text-[#9E2A2B] text-[10px] font-bold flex items-center justify-center">
                      {selectedStatuses.length}
                    </span>
                  )}
                </div>
                <ChevronDown size={14} className={`transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFilterDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white dark:bg-[#1C1917] rounded-lg shadow-lg border border-[#E4E1DC] dark:border-[#2E2A27] p-2 z-50">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#E4E1DC] dark:border-[#2E2A27] px-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E]">Select Statuses</span>
                    {selectedStatuses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => { setSelectedStatuses([]); setCurrentPage(1); }}
                        className="text-xs font-semibold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="space-y-0.5 max-h-60 overflow-y-auto">
                    {STATUS_OPTIONS.map((opt) => {
                      const isSelected = selectedStatuses.includes(opt.value);
                      return (
                        <div
                          key={opt.value}
                          onClick={() => toggleStatusFilter(opt.value)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-[#F6F5F3] dark:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3]' 
                              : 'text-[#6B6761] dark:text-[#A8A29E] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27]/60'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isSelected ? (
                              <CheckSquare size={15} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                            ) : (
                              <Square size={15} className="text-[#E4E1DC] dark:text-[#2E2A27]" />
                            )}
                            <span>{opt.label}</span>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded border ${opt.color}`}>
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
                className="px-3 py-2 bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#E4E1DC] dark:hover:bg-[#2E2A27] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="text-[#6B6761] dark:text-[#A8A29E] text-xs font-normal hidden sm:inline">Rows:</span>
                <span>{pageSize}</span>
                <ChevronDown size={13} className="text-[#6B6761] dark:text-[#A8A29E]" />
              </button>

              {isPageSizeDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-24 bg-white dark:bg-[#1C1917] rounded-lg shadow-lg border border-[#E4E1DC] dark:border-[#2E2A27] p-1 z-50">
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setPageSize(size);
                        setCurrentPage(1);
                        setIsPageSizeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        pageSize === size 
                          ? 'bg-[#9E2A2B] text-white' 
                          : 'text-[#1F1D1B] dark:text-[#F6F5F3] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27]'
                      }`}
                    >
                      <span>{size}</span>
                      {pageSize === size && <Check size={12} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ACTIVE FILTER PILLS */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] print-hide">
            <span className="text-[11px] font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider flex items-center gap-1 mr-1">
              <Tag size={12} /> Active Filters:
            </span>

            {searchQuery.trim() !== '' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] text-xs font-medium">
                <span>Search: <strong>"{searchQuery}"</strong></span>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                  className="p-0.5 hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] rounded text-[#6B6761] hover:text-[#9E2A2B] transition-colors cursor-pointer"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {selectedStatuses.map((statusVal) => {
              const matchedOption = STATUS_OPTIONS.find(o => o.value === statusVal);
              return (
                <span
                  key={statusVal}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#9E2A2B]/10 dark:bg-[#9E2A2B]/20 border border-[#9E2A2B]/20 dark:border-[#9E2A2B]/30 text-[#9E2A2B] dark:text-[#D4AF37] text-xs font-medium"
                >
                  <span>Status: <strong>{matchedOption ? matchedOption.label : statusVal}</strong></span>
                  <button
                    type="button"
                    onClick={() => removeSingleStatus(statusVal)}
                    className="p-0.5 hover:bg-[#9E2A2B]/20 rounded text-[#9E2A2B] dark:text-[#D4AF37] hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}

            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-medium text-[#6B6761] dark:text-[#A8A29E] hover:text-[#9E2A2B] dark:hover:text-[#D4AF37] flex items-center gap-1 ml-1 cursor-pointer transition-colors"
            >
              <RotateCcw size={12} /> Clear all
            </button>
          </div>
        )}

        {/* TABLE CONTENT */}
        <div className="overflow-x-auto min-h-[320px]">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] text-xs uppercase tracking-wider font-semibold">
                <th className="p-3.5 pl-5">Operator Details</th>
                <th className="p-3.5">Tricycle Info</th>
                <th className="p-3.5">TODA / Zone</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center pr-5 print-hide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27] text-xs">
              {isLoading ? (
                <TableRowsSkeleton rows={Math.min(pageSize, 10)} columns={5} baseDelay={30} stepDelay={45} />
              ) : franchises.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-[#6B6761] dark:text-[#A8A29E] print-hide">
                    <div className="flex flex-col items-center justify-center">
                      {activeTab === 'archived' ? <Archive size={36} className="text-[#6B6761] dark:text-[#A8A29E] mb-2 opacity-50"/> : <FileText size={36} className="text-[#6B6761] dark:text-[#A8A29E] mb-2 opacity-50"/>}
                      <p className="font-semibold text-sm text-[#1F1D1B] dark:text-[#F6F5F3]">No records found</p>
                      <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5">Try changing search keywords or remove some filter tags.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                franchises.map((f, fIdx) => {
                  const displayName = f.fullName || (f.operator ? f.operator.name : 'Unknown Operator');
                  
                  return (
                    <tr 
                      key={f._id} 
                      className="hover:bg-[#F6F5F3]/80 dark:hover:bg-[#14110F]/80 transition-colors"
                    >
                        <td className="p-3.5 pl-5">
                          <p className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                            {displayName}
                          </p>
                          <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5 flex items-center gap-1">
                            <MapPin size={11} className="text-[#6B6761] dark:text-[#A8A29E] shrink-0" />
                            <span className="truncate max-w-[200px]">{f.address ? `${f.address}, Gasan` : 'Gasan, Marinduque'}</span>
                          </p>
                        </td>
                        <td className="p-3.5">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] font-mono font-medium text-xs text-[#1F1D1B] dark:text-[#F6F5F3]">
                            <TricycleIcon size={13} className="text-[#6B6761] dark:text-[#A8A29E]" />
                            <span>{f.plateNo || 'PENDING'}</span>
                          </div>
                          <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] mt-1 font-normal truncate max-w-[190px]">
                            {f.make ? `${f.make} ${f.made || ''}`.trim() : (f.motorNo ? `Motor: ${f.motorNo}` : 'Motorcycle Unit')}
                          </p>
                        </td>
                        <td className="p-3.5">
                          <p className="font-medium text-[#1F1D1B] dark:text-[#F6F5F3]">{f.todaName || 'Non-TODA'}</p>
                          <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">Zone {f.zone || 1}</p>
                        </td>
                        <td className="p-3.5 text-center">
                          <StatusBadge status={f.status} />
                        </td>
                        <td className="p-3.5 pr-5 text-center print-hide">
                          <div className="flex items-center justify-center gap-1.5">
                            
                            {/* VIEW DETAILS BUTTON */}
                            <button
                              type="button"
                              onClick={() => setSelectedFranchise(f)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] text-[#1F1D1B] dark:text-[#F6F5F3] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] transition-all cursor-pointer"
                              title="Tingnan ang kumpletong detalye"
                            >
                              <Eye size={13} className="text-[#9E2A2B] dark:text-[#D4AF37]" /> Details
                            </button>

                            {/* PRINT MTOP BUTTON (For Active, For Signing, or Ready for Pickup) */}
                            {(f.status === 'Active' || f.status === 'For Signing' || f.status === 'Ready for Pickup') && (
                              <button
                                type="button"
                                onClick={() => setPrintMtopUnit(f)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-amber-200 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-all cursor-pointer"
                                title="Print Official MTOP Certificate"
                              >
                                <Printer size={13} className="text-[#9E2A2B] dark:text-[#D4AF37]" /> MTOP
                              </button>
                            )}

                            {/* ARCHIVE / RESTORE LOGIC */}
                            {activeTab === 'archived' ? (
                              <button 
                                type="button"
                                onClick={() => initiateToggleArchive(f._id, displayName, true)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all border bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] border-[#E4E1DC] dark:border-[#2E2A27] cursor-pointer"
                                title="Ibalik sa Masterlist"
                              >
                                <ArchiveRestore size={13} /> Restore
                              </button>
                            ) : (
                              // In Master Records: ONLY terminal/inactive statuses can be archived!
                              ['Expired', 'Cancelled', 'Revoked'].includes(f.status) && (
                                <button 
                                  type="button"
                                  onClick={() => initiateToggleArchive(f._id, displayName, false)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all border bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] border-[#E4E1DC] dark:border-[#2E2A27] cursor-pointer"
                                  title="Ilipat sa Archives ang lumang record"
                                >
                                  <Archive size={13} /> Archive
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
        </div>

        {/* PAGINATION CONTROLS */}
        <div className="p-3.5 border-t border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] flex flex-col sm:flex-row justify-between items-center gap-3 print-hide">
          <p className="text-xs font-medium text-[#6B6761] dark:text-[#A8A29E]">
            Showing <span className="text-[#1F1D1B] dark:text-[#F6F5F3] font-semibold tabular-nums">{startRecordIndex}</span> to <span className="text-[#1F1D1B] dark:text-[#F6F5F3] font-semibold tabular-nums">{endRecordIndex}</span> of <span className="text-[#1F1D1B] dark:text-[#F6F5F3] font-semibold tabular-nums">{paginationMeta.totalRecords}</span> entries
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1 || isLoading}
              className="p-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] text-[#1F1D1B] dark:text-[#F6F5F3] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="First Page"
            >
              <ChevronsLeft size={15} />
            </button>

            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={!paginationMeta.hasPrevPage || isLoading}
              className="px-2.5 py-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all cursor-pointer"
            >
              <ChevronLeft size={14} /> Prev
            </button>

            <span className="px-2.5 py-1 text-xs font-semibold tabular-nums text-[#9E2A2B] dark:text-[#F6F5F3] bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg">
              Page {paginationMeta.currentPage} of {paginationMeta.totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, paginationMeta.totalPages))}
              disabled={!paginationMeta.hasNextPage || isLoading}
              className="px-2.5 py-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all cursor-pointer"
            >
              Next <ChevronRight size={14} />
            </button>

            <button
              onClick={() => setCurrentPage(paginationMeta.totalPages)}
              disabled={currentPage === paginationMeta.totalPages || isLoading}
              className="p-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] text-[#1F1D1B] dark:text-[#F6F5F3] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Last Page"
            >
              <ChevronsRight size={15} />
            </button>
          </div>
        </div>

      </div>

      {/* ARCHIVE / RESTORE CONFIRMATION MODAL */}
      {confirmModal.isOpen && confirmModal.data && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 transition-opacity"
            onClick={() => !isProcessing && setConfirmModal({ isOpen: false, data: null })}
          />
          
          <div className="relative bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg shadow-xl w-full max-w-sm p-6 text-center">
            <button 
              disabled={isProcessing}
              onClick={() => setConfirmModal({ isOpen: false, data: null })}
              className="absolute top-3 right-3 text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 border ${
              confirmModal.data.action === 'Archive' 
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' 
                : 'bg-[#F6F5F3] dark:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] border-[#E4E1DC] dark:border-[#2E2A27]'
            }`}>
              {confirmModal.data.action === 'Archive' ? <Archive size={22} /> : <ArchiveRestore size={22} />}
            </div>
            
            <h3 className="text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] mb-1">
              {confirmModal.data.action} Record?
            </h3>
            
            <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mb-5 leading-relaxed">
              Are you sure you want to {confirmModal.data.action.toLowerCase()} the franchise record of <strong className="text-[#1F1D1B] dark:text-[#F6F5F3] font-semibold">{confirmModal.data.name}</strong>?
            </p>

            <div className="flex gap-2">
              <button 
                disabled={isProcessing}
                onClick={() => setConfirmModal({ isOpen: false, data: null })}
                className="flex-1 py-2 rounded-lg font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] bg-[#F6F5F3] dark:bg-[#2E2A27] hover:bg-[#E4E1DC] dark:hover:bg-[#3E3834] transition-colors text-xs disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                disabled={isProcessing}
                onClick={confirmAction}
                className="flex-1 py-2 rounded-lg font-semibold text-white transition-all text-xs shadow-xs flex justify-center items-center gap-2 bg-[#9E2A2B] hover:bg-[#7A1B22] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isProcessing && <Loader2 size={13} className="animate-spin" />}
                {isProcessing ? 'Processing...' : `Yes, ${confirmModal.data.action}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Printable MTOP Certificate Modal */}
      <MtopCertificateModal 
        isOpen={!!printMtopUnit} 
        onClose={() => setPrintMtopUnit(null)} 
        unit={printMtopUnit} 
      />
    </MainLayout>
  );
};

export default FranchiseMasterlist;
