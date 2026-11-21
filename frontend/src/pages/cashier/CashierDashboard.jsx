import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/MainLayout';
import { 
  Receipt, Search, Download, CheckCircle2, Clock, DollarSign, 
  Printer, ArrowRight, Loader2, AlertCircle, RefreshCw,
  FileText, ShieldCheck, User, Calendar, CreditCard, Banknote, Sparkles, Filter, X, Settings
} from 'lucide-react';
import { formatZoneLabel } from '../../utils/constants';
import { StatsCardsSkeleton, TableRowsSkeleton } from '../../components/skeleton';
import { useSocket } from '../../context/SocketContext';

const isAutoPrintEnabled = () => localStorage.getItem('cashier_auto_print') !== 'false';

const isQueueSoundEnabled = () => {
  const pref = localStorage.getItem('cashier_sound_enabled') ?? localStorage.getItem('cashier_sound_alert');
  return pref !== 'false';
};

const resolveCollectorName = (receipt) => {
  if (!receipt) return 'Municipal Cashier';
  const candidate =
    receipt.processedByName ||
    receipt.cashierName ||
    (typeof receipt.paidByCashier === 'object' ? receipt.paidByCashier?.name : receipt.paidByCashier);
  const clean = typeof candidate === 'string' ? candidate.trim() : '';
  if (!clean || /^[a-f0-9]{24}$/i.test(clean)) {
    return 'Municipal Cashier';
  }
  return clean;
};

const CashierDashboard = () => {
  const navigate = useNavigate();
  const { socket } = useSocket() || {};
  const [queue, setQueue] = useState([]);
  const [paidList, setPaidList] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'completed'
  const prevPendingIdsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const queueAbortRef = useRef(null);
  const queueSeqRef = useRef(0);
  const autoPrintTimerRef = useRef(null);

  const [standardFranchiseFee, setStandardFranchiseFee] = useState(() => {
    const val = Number(localStorage.getItem('franchise_fee'));
    return Number.isFinite(val) && val > 0 ? val : 500;
  });

  const syncFranchiseFee = useCallback((rawFee) => {
    const parsed = Number(rawFee);
    if (Number.isFinite(parsed) && parsed > 0) {
      setStandardFranchiseFee(parsed);
      localStorage.setItem('franchise_fee', String(parsed));
    }
  }, []);

  // Payment Modal State
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [payFormData, setPayFormData] = useState({
    officialReceiptNo: '',
    payerName: '',
    amountPaid: Number(localStorage.getItem('franchise_fee')) || 500,
    paymentMethod: 'Cash',
    remarks: ''
  });

  // Unlock/reuse a shared AudioContext on first Cashier interaction so background polls chime reliably (M9)
  const unlockAudioContext = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const handleUnlock = () => {
      unlockAudioContext();
    };
    window.addEventListener('pointerdown', handleUnlock, { passive: true });
    window.addEventListener('keydown', handleUnlock, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', handleUnlock);
      window.removeEventListener('keydown', handleUnlock);
      if (autoPrintTimerRef.current) {
        clearTimeout(autoPrintTimerRef.current);
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [unlockAudioContext]);

  // Gentle, crisp 2-tone Web Audio API chime when a new unpaid item arrives
  const playQueueArrivalChime = useCallback(() => {
    try {
      const ctx = unlockAudioContext();
      if (!ctx || ctx.state !== 'running') return;
      const now = ctx.currentTime;

      const scheduleTone = (freq, startOffset, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + startOffset);
        gain.gain.setValueAtTime(0.0001, now + startOffset);
        gain.gain.exponentialRampToValueAtTime(0.14, now + startOffset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + startOffset);
        osc.stop(now + startOffset + duration + 0.02);
      };

      scheduleTone(1046.5, 0, 0.16);
      scheduleTone(1318.5, 0.14, 0.24);
    } catch {
      // Browser autoplay restriction or unsupported AudioContext
    }
  }, [unlockAudioContext]);

  // Daily Treasury Remittance Modal State
  const [isRemittanceModalOpen, setIsRemittanceModalOpen] = useState(false);

  const sanitizeCsvCell = (value) => {
    const str = String(value ?? '');
    let start = 0;
    while (start < str.length && (str.charCodeAt(start) <= 32 || str.charCodeAt(start) === 0x00A0)) {
      start += 1;
    }
    const trimmedLeading = str.slice(start);
    const isFormula =
      /^[=+\-@\t\r\n\uFF1D\uFF0B\uFF0D\uFF20]/.test(str) ||
      /^[=+\-@\uFF1D\uFF0B\uFF0D\uFF20]/.test(trimmedLeading);
    const neutralized = isFormula ? `'${str}` : str;
    return `"${neutralized.replace(/"/g, '""')}"`;
  };

  const hasValidAmount = (val) =>
    val !== undefined && val !== null && val !== '' && Number.isFinite(Number(val)) && Number(val) > 0;

  const formatAmountDisplay = (val) =>
    hasValidAmount(val) ? `₱${Number(val).toFixed(2)}` : 'N/A';

  const todayPaidRecords = useMemo(() => {
    const manilaDateFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' });
    const today = manilaDateFmt.format(new Date());
    const toManilaDate = (val) => {
      if (!val) return null;
      const d = new Date(val);
      if (isNaN(d.getTime())) return null;
      return manilaDateFmt.format(d);
    };

    const seenIds = new Set();
    const seenOrs = new Set();
    const records = [];
    // Prefer durable PaymentLedger (paidList) so renewed/archived franchises never vanish from Daily Remittance
    const sourceList = paidList.length > 0 ? paidList : (allRecords.length > 0 ? allRecords : queue);

    for (const item of sourceList) {
      if (!item) continue;
      const orKey = (item.officialReceiptNo || '').trim().toUpperCase();
      if (orKey && seenOrs.has(orKey)) continue;
      if (!orKey && item._id && seenIds.has(String(item._id))) continue;

      if (item.paymentStatus === 'Paid' && toManilaDate(item.paymentDate) === today) {
        if (orKey) seenOrs.add(orKey);
        if (item._id) seenIds.add(String(item._id));
        records.push(item);
      }

      if (Array.isArray(item.paymentHistory)) {
        for (let idx = 0; idx < item.paymentHistory.length; idx++) {
          const hist = item.paymentHistory[idx];
          if (!hist || toManilaDate(hist.paymentDate) !== today) continue;
          const histOr = (hist.officialReceiptNo || '').trim().toUpperCase();
          if (histOr && seenOrs.has(histOr)) continue;
          if (histOr) seenOrs.add(histOr);
          const recordedCollector = resolveCollectorName(hist);
          records.push({
            ...item,
            _id: `${item._id || 'hist'}_term_${idx}_${histOr || hist.paymentDate}`,
            officialReceiptNo: hist.officialReceiptNo || '',
            payerName: hist.payerName || item.payerName || '',
            amountPaid: hist.amountPaid,
            paymentMethod: hist.paymentMethod || item.paymentMethod || '',
            paymentDate: hist.paymentDate,
            processedByName: hist.processedByName || recordedCollector,
            cashierName: recordedCollector,
            paymentRemarks: hist.paymentRemarks || '',
            mtopNo: hist.mtopNo || item.mtopNo || '',
            isHistoricalTerm: true
          });
        }
      }
    }

    return records;
  }, [allRecords, paidList, queue]);

  const handleExportRemittanceCSV = () => {
    if (todayPaidRecords.length === 0) {
      showToast('No paid records found to export.', 'info');
      return;
    }

    const headers = ['Official Receipt No', 'Payer Full Name', 'Plate Number', 'TODA Association', 'Amount Paid (PHP)', 'Payment Method', 'Payment Timestamp', 'Collecting Cashier'];
    const rows = todayPaidRecords.map(item => [
      sanitizeCsvCell(item.officialReceiptNo || 'PENDING'),
      sanitizeCsvCell(item.payerName || item.fullName || item.applicantName || ''),
      sanitizeCsvCell(item.plateNo || 'PENDING'),
      sanitizeCsvCell(item.todaName || item.todaAssociation || 'NON-TODA'),
      hasValidAmount(item.amountPaid) ? Number(item.amountPaid) : sanitizeCsvCell(''),
      sanitizeCsvCell(item.paymentMethod || 'N/A'),
      sanitizeCsvCell(item.paymentDate ? new Date(item.paymentDate).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }) : 'N/A'),
      sanitizeCsvCell(resolveCollectorName(item))
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GTRAMS_Treasury_Daily_Remittance_${new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date())}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported ${todayPaidRecords.length} collection records to CSV!`, 'success');
  };

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

  const fetchLiveSettingsFee = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/settings`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        const liveFee = json?.data?.franchiseFee ?? json?.franchiseFee;
        if (liveFee != null) {
          syncFranchiseFee(liveFee);
        }
      }
    } catch {
      // Fallback to cashier-queue franchiseFee or cached fee
    }
  }, [syncFranchiseFee]);

  const fetchQueue = useCallback(async ({ silent = false, scope = '' } = {}) => {
    if (queueAbortRef.current) {
      queueAbortRef.current.abort();
    }
    const controller = new AbortController();
    queueAbortRef.current = controller;
    const reqSeq = ++queueSeqRef.current;

    if (!silent) {
      setIsLoading(true);
    }
    try {
      const token = localStorage.getItem('token');
      const query = scope ? `?scope=${encodeURIComponent(scope)}` : '';
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/cashier-queue${query}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: controller.signal
      });
      if (reqSeq !== queueSeqRef.current) return;
      if (res.ok) {
        const data = await res.json();
        if (reqSeq !== queueSeqRef.current) return;
        const isPayable = (f) => f && f.status === 'For Payment' && f.paymentStatus !== 'Paid' && !f.isArchived;

        if (Array.isArray(data)) {
          const payableItems = data.filter(isPayable);
          const ledgerItems = data.filter(f => f.paymentStatus === 'Paid');
          const nextPendingIds = new Set(payableItems.map((item) => String(item._id)));
          if (prevPendingIdsRef.current !== null) {
            for (const pendingId of nextPendingIds) {
              if (!prevPendingIdsRef.current.has(pendingId) && isQueueSoundEnabled()) {
                playQueueArrivalChime();
                break;
              }
            }
          }
          prevPendingIdsRef.current = nextPendingIds;
          setQueue(payableItems);
          setPaidList(ledgerItems);
          setAllRecords(data);
        } else {
          if (data?.franchiseFee != null) {
            syncFranchiseFee(data.franchiseFee);
          }

          if (Array.isArray(data.pendingQueue) || Array.isArray(data.pendingPayment)) {
            const pendingSource = Array.isArray(data.pendingQueue) ? data.pendingQueue : data.pendingPayment;
            const payableItems = pendingSource.filter(isPayable);
            const nextPendingIds = new Set(payableItems.map((item) => String(item._id)));
            if (prevPendingIdsRef.current !== null) {
              let hasNewPending = false;
              for (const pendingId of nextPendingIds) {
                if (!prevPendingIdsRef.current.has(pendingId)) {
                  hasNewPending = true;
                  break;
                }
              }
              if (hasNewPending && isQueueSoundEnabled()) {
                playQueueArrivalChime();
              }
            }
            prevPendingIdsRef.current = nextPendingIds;
            setQueue(payableItems);
          }

          if (Array.isArray(data.paymentLedger) || Array.isArray(data.recentlyPaid)) {
            const ledgerItems = Array.isArray(data.paymentLedger) ? data.paymentLedger : data.recentlyPaid;
            setPaidList(ledgerItems);
          }

          if (Array.isArray(data.all)) {
            setAllRecords(data.all);
          }
        }
      } else if (!silent) {
        showToast('Failed to load cashier payment queue.', 'error');
      }
    } catch (err) {
      if (err?.name === 'AbortError' || reqSeq !== queueSeqRef.current) return;
      console.error('Error fetching cashier queue:', err);
      if (!silent) {
        showToast('Cannot connect to server.', 'error');
      }
    } finally {
      if (!silent && reqSeq === queueSeqRef.current) {
        setIsLoading(false);
      }
    }
  }, [playQueueArrivalChime, syncFranchiseFee]);

  useEffect(() => {
    fetchQueue();
    fetchLiveSettingsFee();
    // Auto-refresh lightweight live queue every 20 seconds without fetching full payment archive
    const interval = setInterval(() => fetchQueue({ silent: true, scope: 'queue' }), 20000);
    window.addEventListener('gtrams_settings_updated', fetchLiveSettingsFee);
    return () => {
      clearInterval(interval);
      if (queueAbortRef.current) queueAbortRef.current.abort();
      window.removeEventListener('gtrams_settings_updated', fetchLiveSettingsFee);
    };
  }, [fetchQueue, fetchLiveSettingsFee]);

  // Real-time refresh when socket events arrive for the cashier terminal
  useEffect(() => {
    if (!socket) return;
    const handleRealtimeRefresh = () => {
      fetchQueue({ silent: true });
    };
    socket.on('notification', handleRealtimeRefresh);
    socket.on('franchise:updated', handleRealtimeRefresh);
    return () => {
      socket.off('notification', handleRealtimeRefresh);
      socket.off('franchise:updated', handleRealtimeRefresh);
    };
  }, [socket, fetchQueue]);

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
      amountPaid: standardFranchiseFee,
      paymentMethod: 'Cash',
      remarks: 'Payment settled over the counter at Municipal Treasury Window'
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
          amountPaid: Number(payFormData.amountPaid) || standardFranchiseFee,
          paymentMethod: 'Cash',
          paymentRemarks: payFormData.remarks
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Official Receipt ${payFormData.officialReceiptNo} issued! Payment marked as Paid.`, 'success');
        setIsPayModalOpen(false);
        
        // Open printable Official Receipt preserving the recorded collector from server
        const recordedCollector = resolveCollectorName(data.ledgerEntry || data.franchise) || currentCashierName;
        setReceiptData({
          ...data.franchise,
          ...(data.ledgerEntry || {}),
          officialReceiptNo: data.ledgerEntry?.officialReceiptNo || data.franchise?.officialReceiptNo || (payFormData.officialReceiptNo || '').trim().toUpperCase(),
          payerName: data.ledgerEntry?.payerName || data.franchise?.payerName || (payFormData.payerName || '').trim() || selectedFranchise.fullName,
          amountPaid: data.ledgerEntry?.amountPaid ?? data.franchise?.amountPaid ?? (Number(payFormData.amountPaid) || standardFranchiseFee),
          paymentMethod: data.ledgerEntry?.paymentMethod || data.franchise?.paymentMethod || 'Cash',
          paymentDate: data.ledgerEntry?.paymentDate || data.franchise?.paymentDate || new Date(),
          processedByName: data.ledgerEntry?.processedByName || data.franchise?.cashierName || recordedCollector,
          cashierName: recordedCollector
        });
        setIsReceiptOpen(true);
        if (autoPrintTimerRef.current) {
          clearTimeout(autoPrintTimerRef.current);
          autoPrintTimerRef.current = null;
        }
        if (isAutoPrintEnabled()) {
          autoPrintTimerRef.current = setTimeout(() => {
            autoPrintTimerRef.current = null;
            window.print();
          }, 300);
        }

        fetchQueue({ silent: true, scope: activeTab === 'completed' ? '' : 'queue' });
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
      const name = (item.fullName || item.applicantName || item.payerName || item.operator?.name || '').toLowerCase();
      const orNo = (item.officialReceiptNo || '').toLowerCase();
      const toda = (item.todaName || item.todaAssociation || '').toLowerCase();
      const collector = resolveCollectorName(item).toLowerCase();
      return ref.includes(q) || mtop.includes(q) || plate.includes(q) || name.includes(q) || orNo.includes(q) || toda.includes(q) || collector.includes(q);
    });
  }, [activeTab, queue, paidList, searchQuery]);

  // Metrics
  const totalTodayCollected = useMemo(() => {
    return todayPaidRecords.reduce((sum, item) => sum + (hasValidAmount(item.amountPaid) ? Number(item.amountPaid) : 0), 0);
  }, [todayPaidRecords]);

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
        <div className="bg-[#9E2A2B] border-b border-[#7A1B22] text-white rounded-xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-black/25 border border-white/20 text-xs font-semibold uppercase tracking-wider text-[#F5E6B3]">
                <Receipt size={14} />
                <span>Municipal Treasury &bull; Cashier Collection Terminal</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-[-0.02em]">
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
                className="inline-flex items-center gap-1.5 px-3.5 py-3 rounded-lg bg-black/25 hover:bg-black/40 text-white text-xs font-bold transition-all border border-white/20 cursor-pointer shadow-sm active:scale-95"
                title="Open Cashier Settings & Archive"
              >
                <Settings size={15} />
                <span>Settings &amp; Archive</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        {isLoading && queue.length === 0 ? (
          <StatsCardsSkeleton count={3} gridClassName="grid grid-cols-1 sm:grid-cols-3 gap-4" baseDelay={30} stepDelay={40} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">Awaiting Collection</span>
                <div className="w-8 h-8 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  <Clock size={16} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#1F1D1B] dark:text-[#F6F5F3] mt-2">
                {queue.length}
              </p>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-1">Applications queued for fee settlement</p>
            </div>

            <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">Today's Collections</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsRemittanceModalOpen(true)}
                    className="text-[11px] font-bold text-[#9E2A2B] dark:text-[#F5E6B3] hover:underline cursor-pointer"
                    title="View Remittance Sheet"
                  >
                    Sheet
                  </button>
                  <span className="text-[#E4E1DC] dark:text-[#2E2A27]">&bull;</span>
                  <button
                    type="button"
                    onClick={handleExportRemittanceCSV}
                    className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer inline-flex items-center gap-0.5"
                    title="Export CSV"
                  >
                    <Download size={11} />
                    <span>CSV</span>
                  </button>
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-400 mt-2 font-mono tabular-nums">
                ₱{Number(totalTodayCollected || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-1">Official Municipal Treasury receipts</p>
            </div>

            <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">Total Processed</span>
                <div className="w-8 h-8 rounded-md bg-[#9E2A2B]/10 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center">
                  <ShieldCheck size={16} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#1F1D1B] dark:text-[#F6F5F3] mt-2">
                {paidList.length}
              </p>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-1">Permits officially released to date</p>
            </div>
          </div>
        )}

        {/* Search Bar & Tabs */}
        <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Tab Switcher */}
            <div className="flex items-center bg-[#F6F5F3] dark:bg-[#14110F] p-1 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className={`px-3.5 py-2 rounded-md text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 min-h-[44px] ${
                  activeTab === 'pending'
                    ? 'bg-white dark:bg-[#1C1917] text-[#9E2A2B] dark:text-[#D4AF37] shadow-sm'
                    : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
                }`}
              >
                <Clock size={15} />
                <span className="tabular-nums">Payment Queue ({queue.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('completed')}
                className={`px-3.5 py-2 rounded-md text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 min-h-[44px] ${
                  activeTab === 'completed'
                    ? 'bg-white dark:bg-[#1C1917] text-[#9E2A2B] dark:text-[#D4AF37] shadow-sm'
                    : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
                }`}
              >
                <Receipt size={15} />
                <span className="tabular-nums">Payment History ({paidList.length})</span>
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
                className="w-full pl-10 pr-4 py-2.5 bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg text-xs sm:text-sm text-[#1F1D1B] dark:text-[#F6F5F3] placeholder-[#6B6761] dark:placeholder-[#A8A29E] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] dark:focus:ring-[#D4AF37] transition-all font-medium min-h-[44px]"
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
              onClick={() => fetchQueue()}
              className="px-4 py-2.5 bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#E4E1DC] dark:hover:bg-[#2E2A27] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 min-h-[44px]"
              title="Refresh queue"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Table / Mobile Cards Container */}
          <div className="rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] overflow-hidden">
            {isLoading && queue.length === 0 ? (
              <div className="overflow-x-auto">
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
                  <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27]">
                    <TableRowsSkeleton rows={5} columns={activeTab === 'pending' ? 5 : 6} baseDelay={30} stepDelay={40} />
                  </tbody>
                </table>
              </div>
            ) : filteredQueue.length === 0 ? (
              <div className="py-16 text-center space-y-2 px-4">
                <Receipt size={36} className="mx-auto text-[#6B6761] dark:text-[#A8A29E]" />
                <h4 className="text-sm font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                  {searchQuery ? 'No matching records found' : activeTab === 'pending' ? 'No applications awaiting payment' : 'No payment history records found'}
                </h4>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] max-w-sm mx-auto">
                  {searchQuery ? 'Try clearing your search query' : 'Applications ready for fee collection will appear in this queue.'}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Stacked Cards (Zero horizontal table overflow) */}
                <div className="md:hidden divide-y divide-[#E4E1DC] dark:divide-[#2E2A27]">
                  {filteredQueue.map((item) => {
                    if (activeTab === 'pending') {
                      return (
                        <div key={item._id} className="p-4 space-y-3 bg-white dark:bg-[#1C1917]">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className="font-mono tabular-nums font-bold text-xs px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-600/30 inline-block">
                                {item.plateNo || 'PENDING'}
                              </span>
                              <p className="font-bold text-sm text-[#1F1D1B] dark:text-[#F6F5F3] mt-1.5 truncate">
                                {item.fullName || item.operator?.name}
                              </p>
                              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
                                MTOP: <strong className="font-mono tabular-nums">{item.mtopNo || 'Pending'}</strong> &bull; {item.todaName || 'Non-TODA'}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm font-mono tabular-nums">
                                ₱{Number(standardFranchiseFee).toFixed(2)}
                              </span>
                              <span className="block text-[10px] text-[#6B6761] dark:text-[#A8A29E] uppercase font-bold">Cash OTC</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleOpenPayment(item)}
                            className="w-full px-3.5 py-2.5 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
                          >
                            <Receipt size={14} />
                            <span>Process Over-the-Counter Payment</span>
                          </button>
                        </div>
                      );
                    }
                    const dt = formatExactDateTime(item.paymentDate);
                    return (
                      <div key={item._id} className="p-4 space-y-2.5 bg-white dark:bg-[#1C1917]">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="font-mono tabular-nums font-bold text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-600/30 inline-block">
                              {item.officialReceiptNo || 'OR-PAID'}
                            </span>
                            <p className="font-bold text-sm text-[#1F1D1B] dark:text-[#F6F5F3] mt-1.5 truncate">
                              {item.fullName || item.applicantName || item.operator?.name}
                            </p>
                            <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-mono tabular-nums">
                              {item.plateNo || 'PENDING'} &bull; {item.todaName || item.todaAssociation || 'Non-TODA'}
                            </p>
                            <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
                              Collector: <span className="font-semibold text-[#1F1D1B] dark:text-[#EAE7E1]">{resolveCollectorName(item)}</span>
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-sm font-mono tabular-nums text-[#1F1D1B] dark:text-[#F6F5F3]">
                              {formatAmountDisplay(item.amountPaid)}
                            </span>
                            <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] tabular-nums">{dt.dateFormatted}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setReceiptData(item);
                            setIsReceiptOpen(true);
                            if (isAutoPrintEnabled()) {
                              setTimeout(() => window.print(), 300);
                            }
                          }}
                          className="w-full px-3.5 py-2.5 bg-[#F6F5F3] hover:bg-[#E4E1DC] dark:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#EAE7E1] rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px] border border-[#E4E1DC] dark:border-[#3E3834]"
                        >
                          <Printer size={13} />
                          <span>Print E-Resibo</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
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
                            <tr key={item._id} className="hover:bg-[#FAF9F7] dark:hover:bg-[#14110F]/50 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="space-y-0.5">
                                  <span className="font-mono tabular-nums font-bold text-sm px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-600/30 inline-block">
                                    {item.plateNo || 'PENDING'}
                                  </span>
                                  <div className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] font-mono tabular-nums mt-0.5">
                                    MTOP: <strong className="text-[#1F1D1B] dark:text-[#F6F5F3]">{item.mtopNo || 'Pending'}</strong>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div>
                                  <p className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{item.fullName || item.operator?.name}</p>
                                  <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">{item.contact || item.operator?.contact || item.address || 'Gasan, Marinduque'}</p>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div>
                                  <p className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{item.todaName || 'Non-TODA'}</p>
                                  <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] font-medium">{item.zone ? formatZoneLabel(item.zone) : 'N/A'}</p>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div>
                                  <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm font-mono tabular-nums">
                                    ₱{Number(standardFranchiseFee).toFixed(2)}
                                  </span>
                                  <span className="block text-[10px] text-[#6B6761] dark:text-[#A8A29E] uppercase font-bold tracking-tight">Standard LGU Fee</span>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={() => handleOpenPayment(item)}
                                  className="px-3.5 py-2 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer inline-flex items-center gap-1.5 min-h-[44px]"
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
                          <tr key={item._id} className="hover:bg-[#FAF9F7] dark:hover:bg-[#14110F]/50 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="space-y-0.5">
                                <span className="font-mono tabular-nums font-bold text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-600/30 inline-block">
                                  {item.officialReceiptNo || 'OR-PAID'}
                                </span>
                                <div className="text-[10px] text-[#6B6761] dark:text-[#A8A29E] uppercase font-semibold">
                                  Cashier: {resolveCollectorName(item)}
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div>
                                <p className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{item.fullName || item.applicantName || item.operator?.name}</p>
                                <p className="font-mono tabular-nums text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E]">
                                  Plate: <span className="font-bold text-amber-700 dark:text-amber-400">{item.plateNo || 'PENDING'}</span>
                                </p>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div>
                                <p className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{item.todaName || item.todaAssociation || 'Non-TODA'}</p>
                                <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] font-medium">{item.zone ? formatZoneLabel(item.zone) : 'N/A'}</p>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div>
                                <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3] text-sm font-mono tabular-nums">
                                  {formatAmountDisplay(item.amountPaid)}
                                </span>
                                <span className="block text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-tight">
                                  Paid via {item.paymentMethod || 'N/A'}
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 font-bold text-[#1F1D1B] dark:text-[#F6F5F3] text-xs tabular-nums">
                                  <Calendar size={13} className="text-[#6B6761] dark:text-[#A8A29E] shrink-0" />
                                  <span>{dt.dateFormatted}</span>
                                </div>
                                <div className="flex items-center gap-1.5 font-mono tabular-nums text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
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
                                  if (isAutoPrintEnabled()) {
                                    setTimeout(() => window.print(), 300);
                                  }
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
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: PROCESS PAYMENT & ENCODE OFFICIAL RECEIPT                         */}
      {/* ========================================================================= */}
      {isPayModalOpen && selectedFranchise && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-xl p-5 sm:p-6 max-w-lg w-full shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#9E2A2B]/10 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                  <Receipt size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">Process Official Payment</h3>
                  <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">Issue Municipal Official Receipt (OR)</p>
                </div>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                disabled={isProcessing}
                className="text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] p-1.5 cursor-pointer rounded-lg hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close payment modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Assessment Summary Box */}
            <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-3.5 sm:p-4 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#6B6761] dark:text-[#A8A29E] font-medium">Tricycle Plate:</span>
                <span className="font-mono tabular-nums font-bold text-amber-700 dark:text-amber-400 text-sm">
                  {selectedFranchise.plateNo}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6B6761] dark:text-[#A8A29E] font-medium">Operator Name:</span>
                <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{selectedFranchise.fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6B6761] dark:text-[#A8A29E] font-medium">MTOP / TODA:</span>
                <span className="font-semibold text-[#1F1D1B] dark:text-[#EAE7E1]">
                  {selectedFranchise.mtopNo || 'Pending'} &bull; {selectedFranchise.todaName || 'Non-TODA'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
                <span className="font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">Total Amount Payable:</span>
                <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
                  ₱{Number(standardFranchiseFee || 500).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
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
                    className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3.5 py-2.5 text-sm font-mono tabular-nums font-bold text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] dark:focus:ring-[#D4AF37] transition-all uppercase min-h-[44px]"
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
                    className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3.5 py-2.5 text-sm font-bold text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] dark:focus:ring-[#D4AF37] transition-all min-h-[44px]"
                  />
                  <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] mt-1">Name of the person who presented payment at the counter.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] uppercase tracking-wider mb-1.5">
                    Payment Method
                  </label>
                  <div className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] min-h-[44px] flex items-center justify-between gap-2">
                    <span>Cash (Over-the-Counter)</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                      OTC Only
                    </span>
                  </div>
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
                    className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3 py-2 text-xs sm:text-sm font-bold text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] min-h-[44px] font-mono tabular-nums"
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
                  className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3.5 py-2 text-xs text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] min-h-[44px]"
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
                  className="flex-1 px-4 py-2.5 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white font-bold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
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
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              #official-receipt-print-area, #official-receipt-print-area * { visibility: visible !important; }
              #official-receipt-print-area {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                max-height: none !important;
                overflow: visible !important;
                box-shadow: none !important;
                border: 1px solid #000 !important;
                padding: 24px !important;
                background: #fff !important;
              }
              .no-print { display: none !important; }
            }
          `}</style>
          <div id="official-receipt-print-area" className="bg-white text-[#1F1D1B] rounded-xl p-6 sm:p-8 max-w-lg w-full shadow-xl space-y-6 relative max-h-[90vh] overflow-y-auto border border-[#E4E1DC]">
            
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
                <p className="font-mono tabular-nums font-bold text-sm text-[#9E2A2B]">
                  {receiptData.officialReceiptNo || 'OR-PENDING'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[#6B6761] font-semibold uppercase text-[10px]">Date &amp; Exact Time Paid</p>
                <p className="font-bold text-xs font-mono tabular-nums">
                  {formatExactDateTime(receiptData.paymentDate || Date.now()).full}
                </p>
              </div>
            </div>

            {/* Payor Summary */}
            <div className="bg-[#F6F5F3] p-3.5 rounded-lg border border-[#E4E1DC] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#6B6761]">Received From (Payor):</span>
                <span className="font-bold text-[#1F1D1B]">{receiptData.payerName || receiptData.fullName || receiptData.applicantName || receiptData.operator?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6761]">TODA Association:</span>
                <span className="font-semibold text-[#1F1D1B]">{receiptData.todaName || receiptData.todaAssociation || 'Non-TODA'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6761]">Tricycle Plate &amp; MTOP:</span>
                <span className="font-mono tabular-nums font-bold text-[#1F1D1B]">{receiptData.plateNo} &bull; {receiptData.mtopNo || 'N/A'}</span>
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
                    <td className="py-2 px-3">
                      <span className="block font-semibold">Tricycle Franchise &amp; Regulatory Assessment (MTOP)</span>
                      {receiptData.paymentRemarks && (
                        <span className="block text-[10px] text-[#6B6761] mt-0.5">{receiptData.paymentRemarks}</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums">
                      {formatAmountDisplay(receiptData.amountPaid)}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-[#F6F5F3] border-t-2 border-[#1F1D1B] font-bold">
                  <tr>
                    <td className="py-2.5 px-3 uppercase text-[#1F1D1B]">Total Amount Paid:</td>
                    <td className="py-2.5 px-3 text-right text-sm text-[#9E2A2B] font-mono tabular-nums">
                      {formatAmountDisplay(receiptData.amountPaid)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Payment Mode & Cashier Stamp */}
            <div className="flex items-center justify-between text-xs pt-2">
              <div>
                <p className="text-[#6B6761] text-[10px] uppercase font-bold">Payment Method</p>
                <p className="font-bold text-[#1F1D1B]">
                  {receiptData.paymentMethod === 'Cash'
                    ? 'Cash (Over-the-Counter)'
                    : (receiptData.paymentMethod || 'N/A')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[#6B6761] text-[10px] uppercase font-bold">Collecting Officer</p>
                <p className="font-bold text-[#1F1D1B] border-b border-[#6B6761] pb-0.5">
                  {resolveCollectorName(receiptData)}
                </p>
                <p className="text-[10px] text-[#6B6761]">Municipal Treasury Staff</p>
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="no-print flex items-center gap-2 pt-2 border-t border-[#E4E1DC]">
              <button
                type="button"
                onClick={() => {
                  if (autoPrintTimerRef.current) {
                    clearTimeout(autoPrintTimerRef.current);
                    autoPrintTimerRef.current = null;
                  }
                  setIsReceiptOpen(false);
                }}
                className="flex-1 px-4 py-2.5 bg-[#F6F5F3] hover:bg-[#E4E1DC] text-[#1F1D1B] font-bold text-xs rounded-lg transition-colors cursor-pointer border border-[#E4E1DC] min-h-[44px]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex-1 px-4 py-2.5 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white font-bold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                <Printer size={15} />
                <span>Print Official Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* TREASURY DAILY REMITTANCE REPORT MODAL */}
      {isRemittanceModalOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 print:bg-white print:p-0 print:static">
          <div className="bg-white dark:bg-[#1C1917] rounded-xl border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 print:border-none print:shadow-none print:max-h-none print:p-0">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#E4E1DC] dark:border-[#2E2A27] pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 flex items-center justify-center text-[#9E2A2B] dark:text-[#D4AF37] shrink-0 print:hidden">
                  <Receipt size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1F1D1B] dark:text-[#F6F5F3] uppercase tracking-tight">
                    Daily Treasury Collection &amp; Remittance Sheet
                  </h3>
                  <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
                    Municipal Treasury Office &bull; Municipality of Gasan, Marinduque
                  </p>
                  <p className="text-[11px] font-semibold text-[#9E2A2B] dark:text-[#D4AF37] mt-0.5">
                    Date: {new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })} &bull; Terminal: {currentCashierName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRemittanceModalOpen(false)}
                className="p-1 rounded-lg text-[#6B6761] hover:text-[#1F1D1B] dark:text-[#A8A29E] dark:hover:text-[#F6F5F3] print:hidden cursor-pointer"
                aria-label="Close remittance sheet"
              >
                <X size={18} />
              </button>
            </div>

            {/* Summary KPI Strip */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27]">
                <p className="text-[10px] font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">Total Collection Remitted</p>
                <p className="text-lg font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                  ₱{todayPaidRecords.reduce((sum, r) => sum + (hasValidAmount(r.amountPaid) ? Number(r.amountPaid) : 0), 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27]">
                <p className="text-[10px] font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">Total Official Receipts Issued</p>
                <p className="text-lg font-mono tabular-nums font-bold text-[#1F1D1B] dark:text-[#F6F5F3] mt-0.5">
                  {todayPaidRecords.length} Transactions
                </p>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg overflow-x-auto mb-5">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F6F5F3] dark:bg-[#14110F] text-[#6B6761] dark:text-[#A8A29E] uppercase font-bold text-[10px] tracking-wider border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                    <th className="p-2.5 pl-3">OR Number</th>
                    <th className="p-2.5">Payer Name</th>
                    <th className="p-2.5">Plate No.</th>
                    <th className="p-2.5">Time</th>
                    <th className="p-2.5 pr-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27]">
                  {todayPaidRecords.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#FAF9F7] dark:hover:bg-[#14110F]/50">
                      <td className="p-2.5 pl-3 font-mono tabular-nums font-bold text-[#9E2A2B] dark:text-[#D4AF37]">{item.officialReceiptNo || 'N/A'}</td>
                      <td className="p-2.5 font-medium text-[#1F1D1B] dark:text-[#F6F5F3]">{item.payerName || item.fullName || 'Operator'}</td>
                      <td className="p-2.5 font-mono tabular-nums text-[#6B6761] dark:text-[#A8A29E]">{item.plateNo || '—'}</td>
                      <td className="p-2.5 text-[#6B6761] dark:text-[#A8A29E] tabular-nums">
                        {item.paymentDate ? new Date(item.paymentDate).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="p-2.5 pr-3 text-right font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                        {formatAmountDisplay(item.amountPaid)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Official Signatures for Remittance */}
            <div className="grid grid-cols-2 gap-8 pt-4 pb-2 text-xs border-t border-[#E4E1DC] dark:border-[#2E2A27]">
              <div>
                <p className="text-[10px] text-[#6B6761] dark:text-[#A8A29E] uppercase font-bold mb-6">Prepared &amp; Remitted By:</p>
                <p className="font-bold border-b border-[#1F1D1B] dark:border-[#F6F5F3] pb-1 text-[#1F1D1B] dark:text-[#F6F5F3]">{currentCashierName}</p>
                <p className="text-[10px] text-[#6B6761] dark:text-[#A8A29E]">Collecting Officer / Cashier</p>
              </div>
              <div>
                <p className="text-[10px] text-[#6B6761] dark:text-[#A8A29E] uppercase font-bold mb-6">Received By:</p>
                <p className="font-bold border-b border-[#1F1D1B] dark:border-[#F6F5F3] pb-1 text-[#1F1D1B] dark:text-[#F6F5F3]">Municipal Treasurer</p>
                <p className="text-[10px] text-[#6B6761] dark:text-[#A8A29E]">Municipal Treasury Office, Gasan</p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center gap-2 pt-4 border-t border-[#E4E1DC] dark:border-[#2E2A27] mt-3 print:hidden">
              <button
                type="button"
                onClick={() => setIsRemittanceModalOpen(false)}
                className="flex-1 py-2 rounded-lg font-bold text-xs bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] border border-[#E4E1DC] dark:border-[#2E2A27] cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExportRemittanceCSV}
                className="flex-1 py-2 rounded-lg font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download size={14} />
                <span>Export to CSV</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-lg font-bold text-xs bg-[#9E2A2B] hover:bg-[#7A1B22] text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer size={14} />
                <span>Print Remittance</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default CashierDashboard;
