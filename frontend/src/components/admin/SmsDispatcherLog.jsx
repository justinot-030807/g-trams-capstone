import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, Smartphone, Send, RefreshCw, 
  CheckCircle2, Clock, Search, Zap, AlertCircle, X, Shield 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const SmsDispatcherLog = () => {
  const { t } = useLanguage() || { t: (_, def) => def };

  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ totalRecords: 0, totalPages: 1, currentPage: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Simulation form data
  const [simForm, setSimForm] = useState({
    operatorName: 'Juan Dela Cruz',
    phone: '09178923401',
    plateNo: '4528-TC',
    bodyNumber: '042',
    daysRemaining: 30
  });

  const showFeedback = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const fetchLogs = useCallback(async (showSpin = false) => {
    if (showSpin) setIsRefreshing(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: String(page),
        limit: '6',
        search: searchQuery
      });

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/notifications/sms-logs?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.logs)) {
          setLogs(json.logs);
          if (json.pagination) setPagination(json.pagination);
        }
      }
    } catch (err) {
      console.warn('Failed to load SMS dispatch logs:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Listen for real-time socket events for new SMS dispatches
  useEffect(() => {
    const handleSmsDispatched = (newLog) => {
      if (newLog) {
        setLogs(prev => [newLog, ...prev.filter(l => l._id !== newLog._id)].slice(0, 10));
        setPagination(prev => ({ ...prev, totalRecords: prev.totalRecords + 1 }));
      }
    };

    window.addEventListener('gtrams_sms_dispatched', (e) => handleSmsDispatched(e.detail));
    return () => {
      window.removeEventListener('gtrams_sms_dispatched', (e) => handleSmsDispatched(e.detail));
    };
  }, []);

  const handleTriggerSimulate = async (e) => {
    e.preventDefault();
    setIsSimulating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/notifications/simulate-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(simForm)
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setShowSimulateModal(false);
          showFeedback('Automated 30-day expiration SMS alert simulated and logged successfully!');
          fetchLogs(true);
        } else {
          showFeedback(json.message || 'Simulation failed', 'error');
        }
      } else {
        showFeedback('Server responded with error', 'error');
      }
    } catch (err) {
      showFeedback('Network error during simulation', 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', {
        timeZone: 'Asia/Manila',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white dark:bg-[#1C1917] p-5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs">
      {/* Toast Alert */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xl rounded-lg px-4 py-3 flex items-center gap-2.5 max-w-sm">
            {toast.type === 'error' ? (
              <AlertCircle size={16} className="text-red-600 dark:text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
            <p className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] leading-snug">
              {toast.message}
            </p>
          </div>
        </div>
      )}

      {/* Header Container */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-[#E4E1DC] dark:border-[#2E2A27] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/10 text-[#9E2A2B] dark:text-[#D4AF37]">
              <Smartphone size={16} />
            </div>
            <h2 className="text-sm font-bold text-[#1F1D1B] dark:text-[#F6F5F3] flex items-center gap-2">
              <span>Automated SMS Dispatcher &amp; Expiration Logs</span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                PST (UTC+8) Active
              </span>
            </h2>
          </div>
          <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-1">
            Real-time audit log of automated 30-day renewal warnings and notifications sent to operators' registered phones.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => fetchLogs(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1F1D1B] dark:text-[#F6F5F3] bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#EAE7E1] dark:hover:bg-[#252220] rounded-md border border-[#E4E1DC] dark:border-[#2E2A27] transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh SMS logs"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-[#9E2A2B]' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSimulateModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#9E2A2B] hover:bg-[#7A1B22] rounded-md transition-colors shadow-xs active:scale-95 cursor-pointer"
            title="Trigger simulated 30-day expiration SMS for defense demonstration"
          >
            <Zap size={13} className="text-[#D4AF37]" />
            <span>Simulate 30-Day Alert</span>
          </button>
        </div>
      </div>

      {/* Filter and Counter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B6761] dark:text-[#A8A29E]" />
          <input
            type="text"
            placeholder="Search phone, plate, or operator..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] focus:outline-hidden focus:ring-1 focus:ring-[#9E2A2B]"
          />
        </div>

        <div className="text-xs text-[#6B6761] dark:text-[#A8A29E] flex items-center gap-1.5">
          <Clock size={13} />
          <span>{pagination.totalRecords} total dispatch message{pagination.totalRecords === 1 ? '' : 's'} recorded</span>
        </div>
      </div>

      {/* Log Table */}
      <div className="overflow-x-auto border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider font-semibold text-[10px]">
              <th className="py-2.5 px-3 whitespace-nowrap">Timestamp (PST)</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Recipient Phone</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Operator &amp; Unit</th>
              <th className="py-2.5 px-3">Message Content</th>
              <th className="py-2.5 px-3 whitespace-nowrap text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27]">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#6B6761] dark:text-[#A8A29E]">
                  <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-[#9E2A2B]" />
                  <span>Loading SMS logs...</span>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#6B6761] dark:text-[#A8A29E]">
                  <MessageSquare size={24} className="mx-auto mb-1.5 opacity-40" />
                  <p className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">No SMS dispatch logs found</p>
                  <p className="text-[11px] mt-0.5">Click "Simulate 30-Day Alert" to trigger an automated expiration SMS test.</p>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id || Math.random()} className="hover:bg-[#F6F5F3]/50 dark:hover:bg-[#2E2A27]/30 transition-colors">
                  <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
                    {formatTimestamp(log.dispatchedAt || log.createdAt)}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap font-mono font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                    <div className="flex items-center gap-1.5">
                      <Smartphone size={12} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                      <span>{log.recipientPhone}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <p className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{log.recipientName}</p>
                    <p className="font-mono text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
                      {log.plateNo} {log.bodyNumber ? `• Body #${log.bodyNumber}` : ''}
                    </p>
                  </td>
                  <td className="py-2.5 px-3 min-w-[260px] text-[#1F1D1B] dark:text-[#EAE7E1] leading-relaxed">
                    <div className="p-2 rounded bg-neutral-50 dark:bg-[#14110F] border border-[#E4E1DC]/60 dark:border-[#2E2A27]/60 text-[11px]">
                      {log.message}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border ${
                      log.status === 'DELIVERED'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'DELIVERED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span>{log.status === 'DELIVERED' ? 'Delivered' : 'Simulated'}</span>
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
          <span className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-2.5 py-1 text-xs rounded border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              className="px-2.5 py-1 text-xs rounded border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Live Simulation Modal for Defense Presentation */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1C1917] w-full max-w-md rounded-xl border border-[#E4E1DC] dark:border-[#2E2A27] shadow-2xl p-5 relative">
            <button
              type="button"
              onClick={() => setShowSimulateModal(false)}
              className="absolute right-4 top-4 text-[#6B6761] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-2 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/10 text-[#9E2A2B] dark:text-[#D4AF37]">
                <Zap size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">
                  Demonstrate 30-Day Expiration SMS
                </h3>
                <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
                  Trigger an automated expiration dispatch test for defense presentation.
                </p>
              </div>
            </div>

            <form onSubmit={handleTriggerSimulate} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1">
                  Recipient Operator Name
                </label>
                <input
                  type="text"
                  required
                  value={simForm.operatorName}
                  onChange={(e) => setSimForm({ ...simForm, operatorName: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-md bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1">
                  Recipient Mobile Phone (+63)
                </label>
                <input
                  type="text"
                  required
                  value={simForm.phone}
                  onChange={(e) => setSimForm({ ...simForm, phone: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-md bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1">
                    Plate Number
                  </label>
                  <input
                    type="text"
                    required
                    value={simForm.plateNo}
                    onChange={(e) => setSimForm({ ...simForm, plateNo: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-mono uppercase rounded-md bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1">
                    Body Number
                  </label>
                  <input
                    type="text"
                    value={simForm.bodyNumber}
                    onChange={(e) => setSimForm({ ...simForm, bodyNumber: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-mono uppercase rounded-md bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3]"
                  />
                </div>
              </div>

              <div className="p-3 bg-neutral-50 dark:bg-[#14110F] rounded-lg border border-[#E4E1DC]/80 dark:border-[#2E2A27]/80">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E] block mb-1">
                  Live Dispatch Preview
                </span>
                <p className="text-[11px] font-mono text-[#1F1D1B] dark:text-[#EAE7E1] leading-relaxed">
                  [G-TRAMS LGU] Paalala: Ang inyong MTOP prangkisa para sa unit {simForm.plateNo || '4528-TC'} {simForm.bodyNumber ? `(Body #${simForm.bodyNumber})` : ''} ay mag-e-expire sa loob ng {simForm.daysRemaining} araw. Mangyaring mag-renew sa BPLO Gasan upang maiwasan ang multa at pagkahuli.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#EAE7E1] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSimulating}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#9E2A2B] hover:bg-[#7A1B22] rounded-md transition-colors shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSimulating ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                  <span>{isSimulating ? 'Dispatching...' : 'Dispatch Simulated SMS'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmsDispatcherLog;
