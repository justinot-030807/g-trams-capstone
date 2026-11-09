import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../components/MainLayout';
import PageHeader from '../../components/common/PageHeader';
import { TableRowsSkeleton } from '../../components/skeleton';
import {
  Shield,
  ShieldCheck,
  Search,
  RefreshCw,
  User,
  ChevronLeft,
  ChevronRight,
  Download,
  Activity,
  Database,
  Lock,
  AlertCircle
} from 'lucide-react';

const AdminAuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const [auditPagination, setAuditPagination] = useState({
    totalRecords: 0,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [auditActionFilter, setAuditActionFilter] = useState('All');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');

  const fetchAuditLogs = useCallback(async (page = 1, action = auditActionFilter, search = auditSearchQuery) => {
    setAuditLoading(true);
    setAuditError('');
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
        action: action || 'All',
        search: search || ''
      });
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(Array.isArray(data.data) ? data.data : []);
        setAuditPagination(
          data.pagination || {
            totalRecords: Array.isArray(data.data) ? data.data.length : 0,
            totalPages: 1,
            currentPage: page,
            hasNextPage: false,
            hasPrevPage: false
          }
        );
        setAuditPage(page);
      } else {
        const errData = await res.json().catch(() => ({}));
        setAuditError(errData.message || 'Unable to load audit trail logs right now.');
      }
    } catch {
      setAuditError('Network connection issue while loading audit logs. Please click Refresh.');
    } finally {
      setAuditLoading(false);
    }
  }, [auditActionFilter, auditSearchQuery]);

  useEffect(() => {
    fetchAuditLogs(1, 'All', '');
  }, []);

  const handleExportCsv = () => {
    if (!auditLogs.length) return;
    const headers = ['Timestamp', 'IP Address', 'Actor Name', 'Actor Role', 'Action', 'Target Type', 'Target / Details'];
    const rows = auditLogs.map((log) => {
      const dateStr = log.createdAt ? new Date(log.createdAt).toLocaleString('en-PH') : '';
      const targetDetail =
        log.details?.filename ||
        log.details?.plateNo ||
        log.details?.name ||
        log.details?.note ||
        log.targetId ||
        'General';
      return [
        dateStr,
        log.ipAddress || '127.0.0.1',
        log.actorName || 'System',
        log.actorRole || 'admin',
        log.action || '',
        log.targetType || 'General',
        targetDetail
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gtrams_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const inputClasses =
    'w-full bg-white dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] transition-colors';

  return (
    <MainLayout>
      <div className="mb-6">
        <PageHeader
          title="Audit Trail & Security Logs"
          subtitle="Immutable chronological record of administrative operations, security events, and database backups."
        />
      </div>

      <div className="space-y-6 w-full">
        {/* KPI SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white dark:bg-[#1C1917] p-4 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 flex items-center justify-center text-[#9E2A2B] dark:text-[#D4AF37] shrink-0">
              <Shield size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">Total Recorded Events</p>
              <p className="text-lg font-black text-[#1F1D1B] dark:text-[#F6F5F3] mt-0.5 font-mono tabular-nums">
                {Number(auditPagination?.totalRecords || 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1C1917] p-4 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">Ledger Status</p>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 truncate">
                Immutable &amp; Active
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1C1917] p-4 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Activity size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">Active Filter</p>
              <p className="text-xs font-bold text-[#1F1D1B] dark:text-[#F6F5F3] mt-0.5 truncate">
                {auditActionFilter === 'All' ? 'All Event Types' : auditActionFilter.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1C1917] p-4 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Lock size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">Access Scope</p>
              <p className="text-xs font-bold text-[#1F1D1B] dark:text-[#F6F5F3] mt-0.5 truncate">
                IT System Admin Only
              </p>
            </div>
          </div>
        </div>

        {/* MAIN AUDIT LEDGER PANEL */}
        <div className="bg-white dark:bg-[#1C1917] p-5 sm:p-6 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 rounded-lg border border-[#9E2A2B]/20 text-[#9E2A2B] dark:text-[#D4AF37]">
                <Shield size={18} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] flex items-center gap-2 flex-wrap">
                  <span>System Audit Trail &amp; Security Logs</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                    Immutable Ledger
                  </span>
                </h2>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
                  Real-time log of user management, franchise decisions, authentication, and database snapshots.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={auditLoading || auditLogs.length === 0}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#E4E1DC] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] text-xs font-medium rounded-lg transition-colors border border-[#E4E1DC] dark:border-[#2E2A27] disabled:opacity-40 cursor-pointer"
              >
                <Download size={13} />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={() => fetchAuditLogs(auditPage, auditActionFilter, auditSearchQuery)}
                disabled={auditLoading}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white text-xs font-semibold rounded-lg transition-colors active:scale-95 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={13} className={auditLoading ? 'animate-spin' : ''} />
                <span>Refresh Logs</span>
              </button>
            </div>
          </div>

          {auditError && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs font-medium flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{auditError}</span>
              </div>
              <button
                type="button"
                onClick={() => fetchAuditLogs(auditPage, auditActionFilter, auditSearchQuery)}
                className="font-bold underline cursor-pointer shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {/* Filter and Search Bar */}
          <div className="pt-5 grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6761] dark:text-[#A8A29E]" size={15} />
              <input
                type="text"
                placeholder="Search by Actor Name, Action Event, or Target ID..."
                value={auditSearchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setAuditSearchQuery(val);
                  fetchAuditLogs(1, auditActionFilter, val);
                }}
                className={`${inputClasses} pl-9`}
              />
            </div>

            <div className="sm:col-span-4">
              <select
                value={auditActionFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setAuditActionFilter(val);
                  fetchAuditLogs(1, val, auditSearchQuery);
                }}
                className={inputClasses}
              >
                <option value="All">All Event Types</option>
                <option value="MANUAL_BACKUP_CREATED">Manual Database Backups</option>
                <option value="AUTOMATED_WEEKLY_BACKUP_COMPLETED">Automated Backups</option>
                <option value="DATABASE_RESTORE_COMPLETED">Database Restorations</option>
                <option value="USER_UPDATED">User Profile Updates</option>
                <option value="USER_REGISTERED_GOOGLE">Google Account Registrations</option>
                <option value="USER_DEACTIVATED">User Deactivations</option>
                <option value="USER_ACTIVATED">User Activations</option>
                <option value="PASSWORD_CHANGED">Password Changes</option>
                <option value="PASSWORD_RESET">Password Resets</option>
                <option value="FRANCHISE_STATUS_UPDATE">Franchise Status Updates</option>
                <option value="FRANCHISE_REVOKED">Franchise Revocations</option>
                <option value="FRANCHISE_ARCHIVED">Franchise Archives</option>
                <option value="FRANCHISE_DELETED">Franchise Deletions</option>
              </select>
            </div>
          </div>

          {/* Logs Table */}
          <div className="mt-5 overflow-x-auto border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg">
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead>
                <tr className="bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] text-xs uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-4">Timestamp &amp; IP</th>
                  <th className="py-2.5 px-4">Administrator / Actor</th>
                  <th className="py-2.5 px-4">Action Event</th>
                  <th className="py-2.5 px-4">Target &amp; Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27] text-xs">
                {auditLoading ? (
                  <TableRowsSkeleton rows={6} columns={4} baseDelay={30} stepDelay={40} />
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-[#6B6761] dark:text-[#A8A29E]">
                      <ShieldCheck size={28} className="mx-auto mb-2 opacity-30" />
                      <p className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">No matching audit log entries found.</p>
                      <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
                        Administrative and security operations will automatically appear here in real time.
                      </p>
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => {
                    const actionStr = String(log.action || '');
                    const isDeleteOrRevoke =
                      actionStr.includes('REVOKE') ||
                      actionStr.includes('DELETE') ||
                      actionStr.includes('DEACTIVATE');
                    const isSuccess =
                      actionStr.includes('APPROVE') ||
                      actionStr.includes('ACTIVATE') ||
                      actionStr.includes('BACKUP') ||
                      actionStr.includes('RESTORE') ||
                      actionStr.includes('INITIALIZED');

                    const primaryDetail =
                      log.details?.filename ||
                      log.details?.plateNo ||
                      log.details?.name ||
                      log.details?.email ||
                      log.targetId ||
                      log.details?.note ||
                      'System Operation';

                    return (
                      <tr key={log._id} className="hover:bg-[#F6F5F3]/50 dark:hover:bg-[#14110F]/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-[#6B6761] dark:text-[#A8A29E] tabular-nums">
                          <div className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                            {log.createdAt
                              ? new Date(log.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : '—'}
                          </div>
                          <div className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
                            {log.createdAt
                              ? new Date(log.createdAt).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : ''}{' '}
                            &bull; IP: {log.ipAddress || '127.0.0.1'}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] flex items-center gap-1.5">
                            {actionStr.includes('BACKUP') ? (
                              <Database size={13} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                            ) : (
                              <User size={13} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                            )}
                            <span>{log.actorName || log.details?.triggeredBy || 'System Administrator'}</span>
                          </div>
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6761] dark:text-[#A8A29E]">
                            {(log.actorRole || 'system_admin').replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${
                              isDeleteOrRevoke
                                ? 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-300 dark:border-red-800'
                                : isSuccess
                                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            }`}
                          >
                            {actionStr.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-[#1F1D1B] dark:text-[#F6F5F3]">
                            {log.targetType || 'General'}: {primaryDetail}
                          </div>
                          {log.details?.totalDocuments !== undefined && (
                            <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] font-mono">
                              Records archived: {Number(log.details.totalDocuments || 0).toLocaleString()} docs
                            </p>
                          )}
                          {log.details?.reason && (
                            <p className="text-xs text-red-700 dark:text-red-400 font-medium truncate max-w-xs">
                              Reason: {log.details.reason}
                            </p>
                          )}
                          {log.details?.previousStatus && log.details?.newStatus && (
                            <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-mono">
                              {log.details.previousStatus} ➜ {log.details.newStatus}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {auditPagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-[#E4E1DC] dark:border-[#2E2A27] mt-4 text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E]">
              <div className="font-mono tabular-nums">
                Page {auditPagination.currentPage} of {auditPagination.totalPages} ({auditPagination.totalRecords} records)
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fetchAuditLogs(auditPage - 1, auditActionFilter, auditSearchQuery)}
                  disabled={!auditPagination.hasPrevPage || auditLoading}
                  className="p-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] disabled:opacity-30 hover:bg-[#F6F5F3] dark:hover:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] transition-colors cursor-pointer"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => fetchAuditLogs(auditPage + 1, auditActionFilter, auditSearchQuery)}
                  disabled={!auditPagination.hasNextPage || auditLoading}
                  className="p-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] disabled:opacity-30 hover:bg-[#F6F5F3] dark:hover:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] transition-colors cursor-pointer"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminAuditLogs;
