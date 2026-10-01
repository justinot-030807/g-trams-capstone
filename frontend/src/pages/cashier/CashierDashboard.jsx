import React, { useState, useEffect, useCallback, useMemo } from 'react';
import MainLayout from '../../components/MainLayout';
import { 
  Receipt, Search, CheckCircle2, Clock, DollarSign, 
  Printer, ArrowRight, Loader2, AlertCircle, RefreshCw,
  FileText, ShieldCheck, User, Calendar, CreditCard, Banknote, Sparkles, Filter, X
} from 'lucide-react';

const CashierDashboard = () => {
  const [queue, setQueue] = useState([]);
  const [paidList, setPaidList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'completed'
  
  // Payment Modal State
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [payFormData, setPayFormData] = useState({
    officialReceiptNo: '',
    amountPaid: 500,
    paymentMethod: 'Cash',
    remarks: ''
  });

  // Official Receipt Print Modal State
  const [receiptData, setReceiptData] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Toast notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const currentCashierName = localStorage.getItem('name') || 'Municipal Cashier';

  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/cashier-queue`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setQueue(data.filter(f => f.paymentStatus !== 'Paid' && f.status === 'Ready for Pickup'));
          setPaidList(data.filter(f => f.paymentStatus === 'Paid'));
        } else {
          setQueue(data.pendingQueue || []);
          setPaidList(data.recentlyPaid || []);
        }
      } else {
        showToast('Failed to load cashier payment queue.', 'error');
      }
    } catch (err) {
      console.error('Error fetching cashier queue:', err);
      showToast('Cannot connect to server.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    // Auto-refresh queue every 20 seconds
    const interval = setInterval(fetchQueue, 20000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Generate suggested OR number: OR-YYYY-XXXX
  const generateSuggestedOrNo = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(10000 + Math.random() * 90000);
    return `OR-${year}-${rand}`;
  };

  const handleOpenPayment = (franchise) => {
    setSelectedFranchise(franchise);
    setPayFormData({
      officialReceiptNo: generateSuggestedOrNo(),
      amountPaid: franchise.amountPaid || 500,
      paymentMethod: 'Cash',
      remarks: 'Payment settled at Municipal Treasury Window'
    });
    setIsPayModalOpen(true);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedFranchise || isProcessing) return;

    if (!payFormData.officialReceiptNo.trim()) {
      showToast('Please enter the Official Receipt (OR) Number.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/${selectedFranchise._id}/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          officialReceiptNo: payFormData.officialReceiptNo.trim().toUpperCase(),
          amountPaid: Number(payFormData.amountPaid) || 500,
          paymentMethod: payFormData.paymentMethod,
          paymentRemarks: payFormData.remarks
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Official Receipt ${payFormData.officialReceiptNo} issued! Payment marked as Paid.`, 'success');
        setIsPayModalOpen(false);
        
        // Open printable Official Receipt
        setReceiptData({
          ...data.franchise,
          officialReceiptNo: payFormData.officialReceiptNo.trim().toUpperCase(),
          amountPaid: Number(payFormData.amountPaid) || 500,
          paymentMethod: payFormData.paymentMethod,
          paymentDate: new Date(),
          cashierName: currentCashierName
        });
        setIsReceiptOpen(true);

        fetchQueue();
      } else {
        showToast(data.message || 'Payment processing failed.', 'error');
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      showToast('Error processing transaction.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // Filter queue by search term
  const filteredQueue = useMemo(() => {
    const list = activeTab === 'pending' ? queue : paidList;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(item => {
      const ref = (item._id || '').slice(-6).toUpperCase();
      const mtop = (item.mtopNo || '').toLowerCase();
      const plate = (item.plateNo || '').toLowerCase();
      const name = (item.fullName || item.operator?.name || '').toLowerCase();
      const orNo = (item.officialReceiptNo || '').toLowerCase();
      const toda = (item.todaName || '').toLowerCase();
      return ref.includes(q) || mtop.includes(q) || plate.includes(q) || name.includes(q) || orNo.includes(q) || toda.includes(q);
    });
  }, [activeTab, queue, paidList, searchQuery]);

  // Metrics
  const totalTodayCollected = useMemo(() => {
    const today = new Date().toISOString().substring(0, 10);
    return paidList.filter(item => {
      if (!item.paymentDate) return false;
      return new Date(item.paymentDate).toISOString().substring(0, 10) === today;
    }).reduce((sum, item) => sum + (item.amountPaid || 500), 0);
  }, [paidList]);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Toast */}
        {toast.show && (
          <div className="fixed top-6 right-6 z-[300] animate-in fade-in slide-in-from-top-4 duration-200">
            <div className={`rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2.5 border text-xs sm:text-sm font-semibold ${
              toast.type === 'error' 
                ? 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800' 
                : 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
            }`}>
              {toast.type === 'error' ? <AlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0" /> : <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />}
              <span>{toast.message}</span>
            </div>
          </div>
        )}

        {/* Municipal Cashier Header Ribbon */}
        <div className="bg-gradient-to-r from-[#7A1B22] to-[#541116] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                <Receipt size={14} />
                <span>Municipal Treasury &bull; Office of the Vice Mayor Extension</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Cashier & Official Receipt Terminal
              </h1>
              <p className="text-xs sm:text-sm text-white/80 max-w-2xl leading-relaxed">
                Verify operator claim stub vouchers, receive municipal franchise fees, encode official government receipt numbers, and release active tricycle permits.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-white/10 dark:bg-black/20 p-4 rounded-2xl border border-white/15 shrink-0">
              <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-black text-lg border border-[#D4AF37]/30">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">Terminal Cashier</p>
                <p className="text-sm font-black text-white">{currentCashierName}</p>
                <p className="text-[10px] text-white/60">LGU Gasan, Marinduque</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Awaiting Collection</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                <Clock size={16} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
              {queue.length}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ready for pickup & fee settlement</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Collections</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <Banknote size={16} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
              ₱{totalTodayCollected.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Official Municipal Treasury receipts</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Processed</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                <ShieldCheck size={16} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
              {paidList.length}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Permits officially released to date</p>
          </div>
        </div>

        {/* Search Bar & Tabs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Tab Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'pending'
                    ? 'bg-white dark:bg-slate-900 text-[#7A1B22] dark:text-[#D4AF37] shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Clock size={15} />
                <span>Pending Collection ({queue.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'completed'
                    ? 'bg-white dark:bg-slate-900 text-[#7A1B22] dark:text-[#D4AF37] shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 size={15} />
                <span>Issued Receipts ({paidList.length})</span>
              </button>
            </div>

            {/* Fast Search input */}
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Claim Stub Ref, MTOP, Plate, Operator..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#7A1B22] focus:ring-2 focus:ring-[#7A1B22]/20 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={fetchQueue}
              className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Refresh queue"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
            {isLoading && queue.length === 0 ? (
              <div className="py-16 text-center">
                <Loader2 size={32} className="animate-spin text-[#7A1B22] mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-semibold">Loading Treasury Queue...</p>
              </div>
            ) : filteredQueue.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Receipt size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {searchQuery ? 'No matching records found' : activeTab === 'pending' ? 'No pending collection items' : 'No receipts issued yet'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery ? 'Try clearing your search query' : 'Applications will appear here once approved by LGU for payment.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 uppercase text-[10px] sm:text-xs font-bold tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Claim Stub / MTOP</th>
                    <th className="py-3.5 px-4">Operator Details</th>
                    <th className="py-3.5 px-4">Unit &amp; Toda</th>
                    <th className="py-3.5 px-4">{activeTab === 'pending' ? 'Amount Due' : 'Payment Record'}</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                  {filteredQueue.map((item) => {
                    const stubCode = `STUB-${(item._id || '').slice(-6).toUpperCase()}`;
                    return (
                      <tr key={item._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/80">
                              {stubCode}
                            </span>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                              MTOP: <strong className="text-slate-800 dark:text-slate-200">{item.mtopNo || 'Pending'}</strong>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{item.fullName || item.operator?.name}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.contact || item.operator?.contact || 'No Contact'}</p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-mono font-bold text-xs">{item.plateNo || 'PENDING'}</span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.todaName || 'Non-TODA'} &bull; Zone {item.zone || 'N/A'}</p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {activeTab === 'pending' ? (
                            <div>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                ₱{(item.amountPaid || 500).toFixed(2)}
                              </span>
                              <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-tight">Standard LGU Fee</span>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="font-mono font-bold text-xs text-blue-700 dark:text-blue-300">
                                {item.officialReceiptNo || 'OR-PAID'}
                              </span>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                ₱{(item.amountPaid || 500).toFixed(2)} via {item.paymentMethod || 'Cash'}
                              </p>
                              {item.paymentDate && (
                                <p className="text-[10px] text-slate-400">
                                  {new Date(item.paymentDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {activeTab === 'pending' ? (
                            <button
                              onClick={() => handleOpenPayment(item)}
                              className="px-4 py-2 bg-[#7A1B22] hover:bg-[#681419] text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Receipt size={14} />
                              <span>Process Payment</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setReceiptData(item);
                                setIsReceiptOpen(true);
                              }}
                              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <Printer size={13} />
                              <span>View Receipt</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: PROCESS PAYMENT & ENCODE OFFICIAL RECEIPT                         */}
      {/* ========================================================================= */}
      {isPayModalOpen && selectedFranchise && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#7A1B22]/10 text-[#7A1B22] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                  <Receipt size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Process Official Payment</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Issue Municipal Official Receipt (OR)</p>
                </div>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                disabled={isProcessing}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Assessment Summary Box */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Claim Stub Ref:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  STUB-{(selectedFranchise._id || '').slice(-6).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Operator:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedFranchise.fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Tricycle Plate / MTOP:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {selectedFranchise.plateNo} &bull; {selectedFranchise.mtopNo || 'MTOP Pending'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-300">Total Assessment Due:</span>
                <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">₱500.00</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleProcessPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                  Official Receipt (OR) Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={payFormData.officialReceiptNo}
                  onChange={(e) => setPayFormData(prev => ({ ...prev, officialReceiptNo: e.target.value.toUpperCase() }))}
                  placeholder="e.g. OR-2026-004123"
                  className="w-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-[#7A1B22] focus:ring-2 focus:ring-[#7A1B22]/20 transition-all uppercase"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Serial number from physical government receipt stub.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={payFormData.paymentMethod}
                    onChange={(e) => setPayFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-[#7A1B22]"
                  >
                    <option value="Cash">Cash (Over-the-Counter)</option>
                    <option value="GCash">GCash Official LGU</option>
                    <option value="Landbank">Landbank Link.BizPortal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                    Amount Paid (₱)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={payFormData.amountPaid}
                    onChange={(e) => setPayFormData(prev => ({ ...prev, amountPaid: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#7A1B22]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                  Remarks (Optional)
                </label>
                <input
                  type="text"
                  value={payFormData.remarks}
                  onChange={(e) => setPayFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Treasury window remarks..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-[#7A1B22]"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2.5 bg-[#7A1B22] hover:bg-[#681419] active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                  <span>{isProcessing ? 'Recording...' : 'Confirm & Release'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PRINTABLE OFFICIAL ELECTRONIC MUNICIPAL RECEIPT (E-RESIBO)       */}
      {/* ========================================================================= */}
      {isReceiptOpen && receiptData && (
        <div className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            
            {/* Header / Seal */}
            <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Republic of the Philippines</p>
              <p className="text-xs font-bold uppercase text-slate-800">Province of Marinduque &bull; Municipality of Gasan</p>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#7A1B22] mt-1">
                Office of the Municipal Treasurer
              </h2>
              <div className="inline-block px-3 py-0.5 rounded-full bg-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-700 mt-1">
                Official Electronic Receipt (E-Resibo)
              </div>
            </div>

            {/* Receipt Meta Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-500 font-semibold uppercase text-[10px]">Official Receipt No.</p>
                <p className="font-mono font-black text-sm text-[#7A1B22]">
                  {receiptData.officialReceiptNo || 'OR-PENDING'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 font-semibold uppercase text-[10px]">Transaction Date</p>
                <p className="font-bold text-xs">
                  {new Date(receiptData.paymentDate || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Payor Summary */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Received From (Payor):</span>
                <span className="font-bold">{receiptData.fullName || receiptData.operator?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">TODA Association:</span>
                <span className="font-semibold">{receiptData.todaName || 'Non-TODA'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tricycle Plate &amp; MTOP:</span>
                <span className="font-mono font-bold">{receiptData.plateNo} &bull; {receiptData.mtopNo || 'N/A'}</span>
              </div>
            </div>

            {/* Itemized Breakdown Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Nature of Collection</th>
                    <th className="py-2 px-3 text-right">Amount (₱)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="py-2 px-3">Franchise Filing &amp; Inspection Fee</td>
                    <td className="py-2 px-3 text-right">₱300.00</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Mayor's Permit &amp; Supervision Fee</td>
                    <td className="py-2 px-3 text-right">₱150.00</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Official Regulatory Sticker &amp; Seal</td>
                    <td className="py-2 px-3 text-right">₱50.00</td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-900 font-black">
                  <tr>
                    <td className="py-2.5 px-3 uppercase text-slate-900">Total Amount Paid:</td>
                    <td className="py-2.5 px-3 text-right text-sm text-[#7A1B22]">
                      ₱{(receiptData.amountPaid || 500).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Payment Mode & Cashier Stamp */}
            <div className="flex items-center justify-between text-xs pt-2">
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold">Payment Method</p>
                <p className="font-bold">{receiptData.paymentMethod || 'Cash'}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Collecting Officer</p>
                <p className="font-black text-slate-900 border-b border-slate-400 pb-0.5">
                  {receiptData.cashierName || currentCashierName}
                </p>
                <p className="text-[10px] text-slate-500">Municipal Treasury Staff</p>
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsReceiptOpen(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex-1 px-4 py-2.5 bg-[#7A1B22] hover:bg-[#681419] text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer size={15} />
                <span>Print Official Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </MainLayout>
  );
};

export default CashierDashboard;
