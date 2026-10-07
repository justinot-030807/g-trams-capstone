import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/MainLayout';
import { 
  Receipt, Search, CheckCircle2, Clock, DollarSign, 
  Printer, ArrowRight, Loader2, AlertCircle, RefreshCw,
  FileText, ShieldCheck, User, Calendar, CreditCard, Banknote, Sparkles, Filter, X, Settings
} from 'lucide-react';
import { formatZoneLabel } from '../../utils/constants';

const CashierDashboard = () => {
  const navigate = useNavigate();
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
    payerName: '',
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
          setQueue(data.filter(f => f.paymentStatus !== 'Paid' && (f.status === 'For Payment' || f.status === 'Ready for Pickup')));
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

  // Format exact date and exact time (HH:MM:SS AM/PM)
  const formatExactDateTime = (dateStr) => {
    if (!dateStr) return { dateFormatted: '—', timeFormatted: '—', full: '—' };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { dateFormatted: dateStr, timeFormatted: '', full: dateStr };
    
    const dateFormatted = d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    const timeFormatted = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    
    return { dateFormatted, timeFormatted, full: `${dateFormatted} • ${timeFormatted}` };
  };

  const handleOpenPayment = (franchise) => {
    setSelectedFranchise(franchise);
    setPayFormData({
      officialReceiptNo: '',
      payerName: franchise.fullName || '',
      amountPaid: franchise.amountPaid || 500,
      paymentMethod: 'Cash',
      remarks: 'Payment settled at Municipal Treasury Window'
    });
    setIsPayModalOpen(true);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedFranchise || isProcessing) return;

    if (!(payFormData.officialReceiptNo || '').trim()) {
      showToast('Please enter the Official Receipt (OR) Number from the receipt booklet.', 'error');
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
          officialReceiptNo: (payFormData.officialReceiptNo || '').trim().toUpperCase(),
          payerName: (payFormData.payerName || '').trim() || selectedFranchise.fullName,
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
          officialReceiptNo: (payFormData.officialReceiptNo || '').trim().toUpperCase(),
          payerName: (payFormData.payerName || '').trim() || selectedFranchise.fullName,
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
            <div className={`rounded-lg px-4 py-3 shadow-md flex items-center gap-2.5 border text-xs sm:text-sm font-semibold ${
              toast.type === 'error' 
                ? 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950/80 dark:text-red-200 dark:border-red-800' 
                : 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800'
            }`}>
              {toast.type === 'error' ? <AlertCircle size={18} className="text-[#B91C1C] shrink-0" /> : <CheckCircle2 size={18} className="text-[#15803D] shrink-0" />}
              <span>{toast.message}</span>
            </div>
          </div>
        )}

        {/* Municipal Cashier Header Ribbon */}
        <div className="bg-[#9E2A2B] border-b border-[#7A1B22] text-white rounded-lg p-5 sm:p-6 shadow-xs relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-black/20 border border-white/20 text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                <Receipt size={14} />
                <span>Municipal Treasury &bull; Cashier Collection Terminal</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Cashier &amp; Payment Terminal
              </h1>
              <p className="text-xs sm:text-sm text-white/80 max-w-2xl leading-relaxed">
                Accept and process MTOP franchise fee payments, issue Official Receipts (OR), and view exact transaction payment logs with precise date and time.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <div className="flex items-center gap-3.5 bg-black/20 p-3 rounded-lg border border-white/15">
                <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-bold text-base border border-[#D4AF37]/30">
                  <DollarSign size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Terminal Cashier</p>
                  <p className="text-sm font-bold text-white">{currentCashierName}</p>
                  <p className="text-[10px] text-white/60">LGU Gasan, Marinduque</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/cashier-settings')}
                className="inline-flex items-center gap-1.5 px-3.5 py-3 rounded-lg bg-black/25 hover:bg-black/40 text-white text-xs font-bold transition-all border border-white/20 cursor-pointer shadow-xs active:scale-95"
                title="Open Cashier Settings & Archive"
              >
                <Settings size={15} />
                <span>Settings &amp; Archive</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">Awaiting Collection</span>
              <div className="w-8 h-8 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                <Clock size={16} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[#1F1D1B] dark:text-white mt-2">
              {queue.length}
            </p>
            <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-1">Ready for pickup & fee settlement</p>
          </div>

          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">Today's Collections</span>
              <div className="w-8 h-8 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <Banknote size={16} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-400 mt-2 font-mono">
              ₱{totalTodayCollected.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-1">Official Municipal Treasury receipts</p>
          </div>

          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">Total Processed</span>
              <div className="w-8 h-8 rounded-md bg-[#9E2A2B]/10 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center">
                <ShieldCheck size={16} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[#1F1D1B] dark:text-white mt-2">
              {paidList.length}
            </p>
            <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-1">Permits officially released to date</p>
          </div>
        </div>

        {/* Search Bar & Tabs */}
        <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Tab Switcher */}
            <div className="flex items-center bg-[#F6F5F3] dark:bg-[#14110F] p-1 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className={`px-3.5 py-2 rounded-md text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 min-h-[44px] ${
                  activeTab === 'pending'
                    ? 'bg-white dark:bg-[#1C1917] text-[#9E2A2B] dark:text-[#D4AF37] shadow-xs'
                    : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-white'
                }`}
              >
                <Clock size={15} />
                <span>Payment Queue ({queue.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('completed')}
                className={`px-3.5 py-2 rounded-md text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 min-h-[44px] ${
                  activeTab === 'completed'
                    ? 'bg-white dark:bg-[#1C1917] text-[#9E2A2B] dark:text-[#D4AF37] shadow-xs'
                    : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-white'
                }`}
              >
                <Receipt size={15} />
                <span>Payment History ({paidList.length})</span>
              </button>
            </div>

            {/* Fast Search input */}
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6761] dark:text-[#A8A29E]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Plate No., Operator, OR No., MTOP..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg text-xs sm:text-sm text-[#1F1D1B] dark:text-white placeholder-[#6B6761] dark:placeholder-[#A8A29E] outline-none focus:border-[#9E2A2B] focus:ring-1 focus:ring-[#9E2A2B] transition-all font-medium min-h-[44px]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] p-1 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={fetchQueue}
              className="px-4 py-2.5 bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#E4E1DC] dark:hover:bg-[#2E2A27] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 min-h-[44px]"
              title="Refresh queue"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
            {isLoading && queue.length === 0 ? (
              <div className="py-16 text-center">
                <Loader2 size={32} className="animate-spin text-[#9E2A2B] dark:text-[#D4AF37] mx-auto mb-2" />
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-semibold">Loading Treasury Queue...</p>
              </div>
            ) : filteredQueue.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Receipt size={36} className="mx-auto text-[#6B6761] dark:text-[#A8A29E]" />
                <h4 className="text-sm font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                  {searchQuery ? 'No matching records found' : activeTab === 'pending' ? 'No applications awaiting payment' : 'No payment history records found'}
                </h4>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] max-w-sm mx-auto">
                  {searchQuery ? 'Try clearing your search query' : 'Applications ready for fee collection will appear in this queue.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] uppercase text-[10px] sm:text-xs font-bold tracking-wider">
                  {activeTab === 'pending' ? (
                    <tr>
                      <th className="py-3 px-4">Plate No. &amp; MTOP</th>
                      <th className="py-3 px-4">Operator Details</th>
                      <th className="py-3 px-4">TODA &amp; Zone</th>
                      <th className="py-3 px-4">Amount Due</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="py-3 px-4">Official Receipt (OR#)</th>
                      <th className="py-3 px-4">Operator &amp; Plate</th>
                      <th className="py-3 px-4">TODA &amp; Zone</th>
                      <th className="py-3 px-4">Amount Paid</th>
                      <th className="py-3 px-4">Exact Date &amp; Time Paid</th>
                      <th className="py-3 px-4 text-right">Receipt</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27] text-[#1F1D1B] dark:text-[#EAE7E1] font-medium">
                  {filteredQueue.map((item) => {
                    if (activeTab === 'pending') {
                      return (
                        <tr key={item._id} className="hover:bg-[#F6F5F3]/50 dark:hover:bg-[#14110F]/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <span className="font-mono font-bold text-sm px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-600/30 inline-block">
                                {item.plateNo || 'PENDING'}
                              </span>
                              <div className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] font-mono mt-0.5">
                                MTOP: <strong className="text-[#1F1D1B] dark:text-white">{item.mtopNo || 'Pending'}</strong>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div>
                              <p className="font-bold text-[#1F1D1B] dark:text-white">{item.fullName || item.operator?.name}</p>
                              <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">{item.contact || item.operator?.contact || item.address || 'Gasan, Marinduque'}</p>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div>
                              <p className="font-semibold text-[#1F1D1B] dark:text-white">{item.todaName || 'Non-TODA'}</p>
                              <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] font-medium">{item.zone ? formatZoneLabel(item.zone) : 'N/A'}</p>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div>
                              <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm font-mono">
                                ₱{(item.amountPaid || 500).toFixed(2)}
                              </span>
                              <span className="block text-[10px] text-[#6B6761] dark:text-[#A8A29E] uppercase font-bold tracking-tight">Standard LGU Fee</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleOpenPayment(item)}
                              className="px-3.5 py-2 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5 min-h-[44px]"
                            >
                              <Receipt size={14} />
                              <span>Process Payment</span>
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    // Completed Tab: Payment History with EXACT Date and EXACT Time
                    const dt = formatExactDateTime(item.paymentDate);
                    return (
                      <tr key={item._id} className="hover:bg-[#F6F5F3]/50 dark:hover:bg-[#14110F]/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-600/30 inline-block">
                              {item.officialReceiptNo || 'OR-PAID'}
                            </span>
                            <div className="text-[10px] text-[#6B6761] dark:text-[#A8A29E] uppercase font-semibold">
                              Cashier: {item.cashierName || 'Municipal Treasury'}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-bold text-[#1F1D1B] dark:text-white">{item.fullName || item.operator?.name}</p>
                            <p className="font-mono text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E]">
                              Plate: <span className="font-bold text-amber-700 dark:text-amber-400">{item.plateNo || 'PENDING'}</span>
                            </p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-semibold text-[#1F1D1B] dark:text-white">{item.todaName || 'Non-TODA'}</p>
                            <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] font-medium">{item.zone ? formatZoneLabel(item.zone) : 'N/A'}</p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-bold text-[#1F1D1B] dark:text-white text-sm font-mono">
                              ₱{(item.amountPaid || 500).toFixed(2)}
                            </span>
                            <span className="block text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-tight">
                              Paid via {item.paymentMethod || 'Cash'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-bold text-[#1F1D1B] dark:text-white text-xs">
                              <Calendar size={13} className="text-[#6B6761] dark:text-[#A8A29E] shrink-0" />
                              <span>{dt.dateFormatted}</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                              <Clock size={12} className="shrink-0" />
                              <span>{dt.timeFormatted}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setReceiptData(item);
                              setIsReceiptOpen(true);
                            }}
                            className="px-3.5 py-2 bg-[#F6F5F3] hover:bg-[#E4E1DC] dark:bg-[#2E2A27] dark:hover:bg-[#3E3834] text-[#1F1D1B] dark:text-[#EAE7E1] rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 min-h-[44px] border border-[#E4E1DC] dark:border-[#3E3834]"
                          >
                            <Printer size={13} />
                            <span>Print Receipt</span>
                          </button>
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
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-5 sm:p-6 max-w-lg w-full shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#9E2A2B]/10 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                  <Receipt size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1F1D1B] dark:text-white">Process Official Payment</h3>
                  <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">Issue Municipal Official Receipt (OR)</p>
                </div>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                disabled={isProcessing}
                className="text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] p-1.5 cursor-pointer rounded-lg hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            {/* Assessment Summary Box */}
            <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-3.5 sm:p-4 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#6B6761] dark:text-[#A8A29E] font-medium">Tricycle Plate:</span>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400 text-sm">
                  {selectedFranchise.plateNo}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6B6761] dark:text-[#A8A29E] font-medium">Operator Name:</span>
                <span className="font-bold text-[#1F1D1B] dark:text-white">{selectedFranchise.fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6B6761] dark:text-[#A8A29E] font-medium">MTOP / TODA:</span>
                <span className="font-semibold text-[#1F1D1B] dark:text-[#EAE7E1]">
                  {selectedFranchise.mtopNo || 'Pending'} &bull; {selectedFranchise.todaName || 'Non-TODA'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
                <span className="font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">Total Amount Payable:</span>
                <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400 font-mono">₱500.00</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleProcessPayment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] uppercase tracking-wider mb-1.5">
                    Official Receipt (OR) Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={payFormData.officialReceiptNo}
                    onChange={(e) => setPayFormData(prev => ({ ...prev, officialReceiptNo: e.target.value.toUpperCase() }))}
                    placeholder="Enter Official O.R. Number"
                    className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3.5 py-2.5 text-sm font-mono font-bold text-[#1F1D1B] dark:text-white outline-none focus:border-[#9E2A2B] focus:ring-1 focus:ring-[#9E2A2B] transition-all uppercase min-h-[44px]"
                  />
                  <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] mt-1">Serial number from physical government receipt stub.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] uppercase tracking-wider mb-1.5">
                    Payer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={payFormData.payerName}
                    onChange={(e) => setPayFormData(prev => ({ ...prev, payerName: e.target.value }))}
                    placeholder="Operator or Representative Name"
                    className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3.5 py-2.5 text-sm font-bold text-[#1F1D1B] dark:text-white outline-none focus:border-[#9E2A2B] focus:ring-1 focus:ring-[#9E2A2B] transition-all min-h-[44px]"
                  />
                  <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] mt-1">Name of the person who presented payment at the counter.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] uppercase tracking-wider mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={payFormData.paymentMethod}
                    disabled
                    className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-[#1F1D1B] dark:text-white outline-none cursor-not-allowed opacity-90 min-h-[44px]"
                  >
                    <option value="Cash">Cash (Over-the-Counter)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] uppercase tracking-wider mb-1.5">
                    Amount Paid (₱)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={payFormData.amountPaid}
                    onChange={(e) => setPayFormData(prev => ({ ...prev, amountPaid: e.target.value }))}
                    className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3 py-2 text-xs sm:text-sm font-bold text-[#1F1D1B] dark:text-white outline-none focus:border-[#9E2A2B] min-h-[44px] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] uppercase tracking-wider mb-1.5">
                  Remarks (Optional)
                </label>
                <input
                  type="text"
                  value={payFormData.remarks}
                  onChange={(e) => setPayFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Treasury window remarks..."
                  className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3.5 py-2 text-xs text-[#1F1D1B] dark:text-white outline-none focus:border-[#9E2A2B] min-h-[44px]"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2.5 bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#E4E1DC] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#EAE7E1] font-bold text-xs rounded-lg transition-colors cursor-pointer border border-[#E4E1DC] dark:border-[#2E2A27] min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2.5 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
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
        <div className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
          <div className="bg-white text-[#1F1D1B] rounded-lg p-6 sm:p-8 max-w-lg w-full shadow-xl space-y-6 relative max-h-[90vh] overflow-y-auto border border-[#E4E1DC]">
            
            {/* Header / Seal */}
            <div className="text-center space-y-1 border-b-2 border-[#1F1D1B] pb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B6761]">Republic of the Philippines</p>
              <p className="text-xs font-bold uppercase text-[#1F1D1B]">Province of Marinduque &bull; Municipality of Gasan</p>
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight text-[#9E2A2B] mt-1">
                Office of the Municipal Treasurer
              </h2>
              <div className="inline-block px-3 py-0.5 rounded-md bg-[#F6F5F3] text-[10px] font-bold uppercase tracking-wider text-[#1F1D1B] border border-[#E4E1DC] mt-1">
                Official Electronic Receipt (E-Resibo)
              </div>
            </div>

            {/* Receipt Meta Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[#6B6761] font-semibold uppercase text-[10px]">Official Receipt No.</p>
                <p className="font-mono font-bold text-sm text-[#9E2A2B]">
                  {receiptData.officialReceiptNo || 'OR-PENDING'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[#6B6761] font-semibold uppercase text-[10px]">Date &amp; Exact Time Paid</p>
                <p className="font-bold text-xs font-mono">
                  {formatExactDateTime(receiptData.paymentDate || Date.now()).full}
                </p>
              </div>
            </div>

            {/* Payor Summary */}
            <div className="bg-[#F6F5F3] p-3.5 rounded-lg border border-[#E4E1DC] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#6B6761]">Received From (Payor):</span>
                <span className="font-bold text-[#1F1D1B]">{receiptData.fullName || receiptData.operator?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6761]">TODA Association:</span>
                <span className="font-semibold text-[#1F1D1B]">{receiptData.todaName || 'Non-TODA'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6761]">Tricycle Plate &amp; MTOP:</span>
                <span className="font-mono font-bold text-[#1F1D1B]">{receiptData.plateNo} &bull; {receiptData.mtopNo || 'N/A'}</span>
              </div>
            </div>

            {/* Itemized Breakdown Table */}
            <div className="border border-[#E4E1DC] rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#F6F5F3] border-b border-[#E4E1DC] text-[#6B6761] font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Nature of Collection</th>
                    <th className="py-2 px-3 text-right">Amount (₱)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E1DC] font-medium text-[#1F1D1B]">
                  <tr>
                    <td className="py-2 px-3">Franchise Filing &amp; Inspection Fee</td>
                    <td className="py-2 px-3 text-right font-mono">₱300.00</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Mayor's Permit &amp; Supervision Fee</td>
                    <td className="py-2 px-3 text-right font-mono">₱150.00</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Official Regulatory Sticker &amp; Seal</td>
                    <td className="py-2 px-3 text-right font-mono">₱50.00</td>
                  </tr>
                </tbody>
                <tfoot className="bg-[#F6F5F3] border-t-2 border-[#1F1D1B] font-bold">
                  <tr>
                    <td className="py-2.5 px-3 uppercase text-[#1F1D1B]">Total Amount Paid:</td>
                    <td className="py-2.5 px-3 text-right text-sm text-[#9E2A2B] font-mono">
                      ₱{(receiptData.amountPaid || 500).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Payment Mode & Cashier Stamp */}
            <div className="flex items-center justify-between text-xs pt-2">
              <div>
                <p className="text-[#6B6761] text-[10px] uppercase font-bold">Payment Method</p>
                <p className="font-bold text-[#1F1D1B]">{receiptData.paymentMethod || 'Cash'}</p>
              </div>
              <div className="text-right">
                <p className="text-[#6B6761] text-[10px] uppercase font-bold">Collecting Officer</p>
                <p className="font-bold text-[#1F1D1B] border-b border-[#6B6761] pb-0.5">
                  {receiptData.cashierName || currentCashierName}
                </p>
                <p className="text-[10px] text-[#6B6761]">Municipal Treasury Staff</p>
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#E4E1DC]">
              <button
                type="button"
                onClick={() => setIsReceiptOpen(false)}
                className="flex-1 px-4 py-2.5 bg-[#F6F5F3] hover:bg-[#E4E1DC] text-[#1F1D1B] font-bold text-xs rounded-lg transition-colors cursor-pointer border border-[#E4E1DC] min-h-[44px]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex-1 px-4 py-2.5 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
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
