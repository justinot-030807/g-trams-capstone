import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../components/MainLayout';
import PageHeader from '../../components/common/PageHeader';
import {
  Shield, Search, RefreshCw, ChevronLeft, ChevronRight, ChevronDown,
  Clock, User, FileText, Filter, Eye, X, Copy, Check,
  ArrowRight, Globe, Terminal, Layers
} from 'lucide-react';
import { TableRowsSkeleton } from '../../components/skeleton';
import { formatRoleDisplayName, cleanText } from '../../utils/vehicleFormatters';

const formatAuditActionLabel = (action = 'SYSTEM_EVENT') =>
  String(action || 'SYSTEM_EVENT')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    totalRecords: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [targetType, setTargetType] = useState('All');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedLog, setSelectedLog] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (!selectedLog) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedLog(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLog]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit)
      });
      if (targetType !== 'All') params.append('targetType', targetType);
      if (debouncedSearch.trim() !== '') params.append('search', debouncedSearch.trim());

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const json = await res.json();
        setLogs(json.data || []);
        if (json.pagination) {
          setPagination(json.pagination);
        }
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, targetType, debouncedSearch]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const getActionBadgeColor = (action = '') => {
    const act = action.toUpperCase();
    if (act.includes('DELETE') || act.includes('REVOKE') || act.includes('CANCEL') || act.includes('REJECT') || act.includes('DEACTIVATE') || act.includes('VIOLATION')) {
      return 'bg-[#FEF2F2] text-[#B91C1C] border-[#B91C1C]/20 dark:bg-[#B91C1C]/15 dark:text-[#F87171]';
    }
    if (act.includes('CREATE') || act.includes('APPROVE') || act.includes('ACTIVATE') || act.includes('VERIFY') || act.includes('SETTLE') || act.includes('PAYMENT')) {
      return 'bg-[#F0FDF4] text-[#15803D] border-[#15803D]/20 dark:bg-[#15803D]/15 dark:text-[#4ADE80]';
    }
    if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('ARCHIVE') || act.includes('RESCAN')) {
      return 'bg-[#FFFBEB] text-[#B45309] border-[#B45309]/20 dark:bg-[#B45309]/15 dark:text-[#FBBF24]';
    }
    return 'bg-[#F6F5F3] text-[#1F1D1B] border-[#E4E1DC] dark:bg-[#2E2A27] dark:text-[#F6F5F3] dark:border-[#3F3A36]';
  };

  const getRoleBadgeStyle = (role = '') => {
    const r = String(role || '').toLowerCase();
    if (r.includes('bplo') || r.includes('llsa')) {
      return 'bg-[#9E2A2B]/10 text-[#9E2A2B] border-[#9E2A2B]/25 dark:bg-[#D4AF37]/15 dark:text-[#D4AF37] dark:border-[#D4AF37]/30';
    }
    if (r.includes('admin')) {
      return 'bg-[#1F1D1B] text-[#F6F5F3] border-[#1F1D1B] dark:bg-[#F6F5F3] dark:text-[#1F1D1B]';
    }
    if (r.includes('cashier')) {
      return 'bg-[#15803D]/10 text-[#15803D] border-[#15803D]/25 dark:bg-[#15803D]/20 dark:text-[#4ADE80]';
    }
    if (r.includes('toda')) {
      return 'bg-[#B45309]/10 text-[#B45309] border-[#B45309]/25 dark:bg-[#B45309]/20 dark:text-[#FBBF24]';
    }
    return 'bg-[#F6F5F3] text-[#6B6761] border-[#E4E1DC] dark:bg-[#14110F] dark:text-[#A8A29E] dark:border-[#2E2A27]';
  };

  const extractStructuredDetails = (log) => {
    const d = (log?.details && typeof log.details === 'object') ? log.details : {};
    const operatorName = cleanText(d.operatorName || d.fullName || d.name || d.targetUserName || d.memberName || d.presidentName, '');
    const plateNo = cleanText(d.plateNo || d.plateNumber, '');
    const mtopNo = cleanText(d.mtopNo || d.mtopNumber || d.franchiseNo, '');
    const todaName = cleanText(d.todaName || d.todaAssociation, '');
    const prevStatus = cleanText(d.previousStatus || d.oldStatus, '');
    const newStatus = cleanText(d.newStatus || d.status, '');
    const orNo = cleanText(d.officialReceiptNo || d.orNo, '');
    const amountPaid = d.amountPaid !== undefined && d.amountPaid !== '' ? Number(d.amountPaid) : null;
    const violationType = cleanText(d.violationType, '');
    const sanctionType = cleanText(d.sanctionType || d.sanction?.type, '');
    const reason = cleanText(d.reason || d.cancelReason || d.remarks || d.note || d.message, '');
    const summary = cleanText(d.summary, '') || reason || (log?.targetId ? `Record ID: ${log.targetId}` : 'System operation recorded');

    const extraEntries = Object.entries(d).filter(([key, val]) => {
      if (val === null || val === undefined || val === '') return false;
      return !['actorRoleLabel', 'summary', 'userAgent'].includes(key);
    });

    return {
      operatorName,
      plateNo,
      mtopNo,
      todaName,
      prevStatus,
      newStatus,
      orNo,
      amountPaid,
      violationType,
      sanctionType,
      reason,
      summary,
      httpMethod: cleanText(d.httpMethod, ''),
      endpoint: cleanText(d.endpoint, ''),
      userAgent: cleanText(d.userAgent, ''),
      extraEntries
    };
  };

  const handleCopyAuditJson = (log) => {
    if (!log) return;
    navigator.clipboard?.writeText(JSON.stringify(log, null, 2));
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const startRecord = pagination.totalRecords === 0 ? 0 : (pagination.currentPage - 1) * limit + 1;
  const endRecord = Math.min(pagination.currentPage * limit, pagination.totalRecords);

  return (
    <MainLayout>
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="System Security & Audit Logs"
        subtitle="Detailed immutable record of administrative actions, franchise status transitions, payments, violations, and TODA verifications"
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#9E2A2B]/10 text-[#9E2A2B] dark:bg-[#D4AF37]/15 dark:text-[#D4AF37] border border-[#9E2A2B]/20">
            <Shield size={12} />
            <span>{pagination.totalRecords.toLocaleString()} Logged Events</span>
          </span>
        }
        actions={
          <button
            type="button"
            onClick={fetchAuditLogs}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] text-xs font-medium text-[#1F1D1B] dark:text-[#F6F5F3] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-[#9E2A2B]' : ''} />
            <span>Refresh Ledger</span>
          </button>
        }
      />

      {/* 2. FILTER & SEARCH BAR */}
      <div className="bg-white dark:bg-[#1C1917] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] p-3.5 mb-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6761] dark:text-[#A8A29E]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by actor name, operator, plate no., MTOP no., O.R. no., action, or remarks..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] placeholder-[#6B6761] dark:placeholder-[#A8A29E] focus:outline-none focus:border-[#9E2A2B]"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-[#6B6761] dark:text-[#A8A29E]">
            <Filter size={13} />
            <span className="font-medium">Category:</span>
          </div>
          <div className="relative">
            <select
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value);
                setPage(1);
              }}
              className="appearance-none pl-2.5 pr-8 py-1.5 text-xs font-medium rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] focus:outline-none focus:border-[#9E2A2B] cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Franchise">Franchise</option>
              <option value="User">User Account</option>
              <option value="Violation">Violation &amp; Sanction</option>
              <option value="TODA">TODA Roster &amp; Directory</option>
              <option value="SystemSettings">System Settings</option>
              <option value="Auth">Authentication</option>
              <option value="General">General</option>
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6761] dark:text-[#A8A29E]" />
          </div>
        </div>
      </div>

      {/* 3. AUDIT LOGS (MOBILE CARDS + DESKTOP TABLE) */}
      <div className="bg-white dark:bg-[#1C1917] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] overflow-hidden">
        {/* Mobile Stacked Cards */}
        <div className="md:hidden divide-y divide-[#E4E1DC] dark:divide-[#2E2A27]">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] animate-pulse" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="py-10 px-4 text-center text-[#6B6761] dark:text-[#A8A29E]">
              <Shield size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">No audit logs found</p>
              <p className="text-xs mt-0.5">Try adjusting your search query or category filter.</p>
            </div>
          ) : (
            logs.map((log) => {
              const info = extractStructuredDetails(log);
              const roleLabel = log.actorRoleLabel || log.details?.actorRoleLabel || formatRoleDisplayName(log.actorRole);
              const cleanActorName = log.actorName === 'BPLO Licensing Officer'
                ? 'LLSA I — Local Legislative Staff Assistant I (Madhelyn Pastoral)'
                : cleanText(log.actorName, 'System Administrator');

              return (
                <div
                  key={log._id}
                  onClick={() => setSelectedLog(log)}
                  className="p-4 space-y-2.5 hover:bg-[#F6F5F3]/60 dark:hover:bg-[#14110F]/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${getActionBadgeColor(log.action)}`}>
                        {formatAuditActionLabel(log.action)}
                      </span>
                      <p className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] mt-1.5 truncate">
                        {cleanActorName}
                      </p>
                      <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
                        {roleLabel.includes('LLSA I') ? 'LLSA I (Franchising Staff)' : roleLabel} • {cleanText(log.targetType, 'General')}
                      </p>
                    </div>
                    <span className="font-mono text-[11px] text-[#6B6761] dark:text-[#A8A29E] shrink-0 text-right">
                      {log.createdAt
                        ? new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : '—'}
                    </span>
                  </div>

                  <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] line-clamp-2 leading-relaxed">
                    {info.summary}
                  </p>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="font-mono text-[10px] text-[#6B6761] dark:text-[#A8A29E] truncate">
                      IP: {cleanText(log.ipAddress, '127.0.0.1')}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] text-xs font-semibold cursor-pointer shrink-0"
                    >
                      <Eye size={13} />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3]/60 dark:bg-[#14110F]/60 text-[11px] font-semibold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E]">
                <th className="py-2.5 px-3">Timestamp &amp; IP</th>
                <th className="py-2.5 px-3">Actor &amp; Official Role</th>
                <th className="py-2.5 px-3">Action &amp; Category</th>
                <th className="py-2.5 px-3">Detailed Event Breakdown</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27] text-xs">
              {isLoading ? (
                <TableRowsSkeleton rows={8} columns={5} />
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-[#6B6761] dark:text-[#A8A29E]">
                      <Shield size={28} className="mb-2 opacity-40" />
                      <p className="text-sm font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                        No audit logs found
                      </p>
                      <p className="text-xs mt-0.5">
                        Try adjusting your search query or category filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const info = extractStructuredDetails(log);
                  const roleLabel = log.actorRoleLabel || log.details?.actorRoleLabel || formatRoleDisplayName(log.actorRole);
                  const cleanActorName = log.actorName === 'BPLO Licensing Officer'
                    ? 'LLSA I — Local Legislative Staff Assistant I (Madhelyn Pastoral)'
                    : cleanText(log.actorName, 'System Administrator');

                  return (
                    <tr
                      key={log._id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-[#F6F5F3]/60 dark:hover:bg-[#14110F]/50 transition-colors cursor-pointer group"
                    >
                      {/* Timestamp & IP */}
                      <td className="py-3 px-3 whitespace-nowrap align-top">
                        <div className="flex items-center gap-1.5 text-[#1F1D1B] dark:text-[#F6F5F3] font-mono text-xs font-medium">
                          <Clock size={12} className="text-[#6B6761] dark:text-[#A8A29E] shrink-0" />
                          <span>
                            {log.createdAt
                              ? new Date(log.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : '—'}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-[#6B6761] dark:text-[#A8A29E] pl-4 block">
                          {log.createdAt
                            ? new Date(log.createdAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })
                            : ''}
                        </span>
                        <span 
                          className="text-[10px] font-mono text-[#6B6761] dark:text-[#A8A29E] pl-4 mt-0.5 block max-w-[130px] truncate"
                          title={`IP: ${cleanText(log.ipAddress, '127.0.0.1')}`}
                        >
                          IP: {cleanText(log.ipAddress, '127.0.0.1')}
                        </span>
                      </td>

                      {/* Actor & Official Role */}
                      <td className="py-3 px-3 align-top max-w-[200px]">
                        <div className="flex items-start gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center shrink-0 mt-0.5">
                            <User size={13} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] leading-snug break-words">
                              {cleanActorName}
                            </p>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${getRoleBadgeStyle(log.actorRole)}`}>
                              {roleLabel.includes('LLSA I') ? 'LLSA I (Franchising Staff)' : roleLabel}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Action & Category */}
                      <td className="py-3 px-3 align-top max-w-[200px]">
                        <span
                          title={log.action}
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border leading-snug ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {formatAuditActionLabel(log.action)}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-[#6B6761] dark:text-[#A8A29E] flex-wrap">
                          <Layers size={11} className="shrink-0" />
                          <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                            {cleanText(log.targetType, 'General')}
                          </span>
                          {log.targetId && (
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27]">
                              #{String(log.targetId).slice(-6).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Detailed Event Breakdown */}
                      <td className="py-3 px-3 align-top max-w-[320px]">
                        {/* Primary Chips */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          {info.operatorName && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-[11px] font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                              <span>Operator:</span>
                              <span>{info.operatorName}</span>
                            </span>
                          )}
                          {info.plateNo && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 text-[#9E2A2B] dark:text-[#D4AF37] font-mono text-[11px] font-semibold">
                              <span>Plate: {info.plateNo}</span>
                            </span>
                          )}
                          {info.mtopNo && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] font-mono text-[11px] font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                              <span>MTOP: {info.mtopNo}</span>
                            </span>
                          )}
                          {info.todaName && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-[11px] font-medium text-[#6B6761] dark:text-[#A8A29E]">
                              <span>{info.todaName}</span>
                            </span>
                          )}
                          {(info.prevStatus || info.newStatus) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F0FDF4] dark:bg-[#15803D]/20 border border-[#15803D]/25 text-[#15803D] dark:text-[#4ADE80] text-[11px] font-semibold">
                              {info.prevStatus ? (
                                <>
                                  <span>{info.prevStatus}</span>
                                  <ArrowRight size={10} />
                                  <span>{info.newStatus || 'Updated'}</span>
                                </>
                              ) : (
                                <span>Status: {info.newStatus}</span>
                              )}
                            </span>
                          )}
                          {info.orNo && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FFFBEB] dark:bg-[#B45309]/20 border border-[#B45309]/25 text-[#B45309] dark:text-[#FBBF24] font-mono text-[11px] font-semibold">
                              <span>OR# {info.orNo}</span>
                              {info.amountPaid !== null && <span>(₱{info.amountPaid.toLocaleString()})</span>}
                            </span>
                          )}
                        </div>

                        {/* Narrative Summary */}
                        <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] line-clamp-2 leading-relaxed break-words">
                          {info.summary}
                        </p>
                      </td>

                      {/* Inspect Action */}
                      <td className="py-3 px-3 text-right align-top whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] group-hover:bg-[#9E2A2B] group-hover:text-white group-hover:border-[#9E2A2B] text-[#1F1D1B] dark:text-[#F6F5F3] text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. PAGINATION BAR */}
        <div className="px-4 py-3 border-t border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3]/40 dark:bg-[#14110F]/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B6761] dark:text-[#A8A29E]">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-[#1F1D1B] dark:text-[#F6F5F3]">{startRecord}</strong> to{' '}
              <strong className="text-[#1F1D1B] dark:text-[#F6F5F3]">{endRecord}</strong> of{' '}
              <strong className="text-[#1F1D1B] dark:text-[#F6F5F3]">{pagination.totalRecords}</strong> entries
            </span>
            <span className="text-[#E4E1DC] dark:text-[#2E2A27]">|</span>
            <label className="flex items-center gap-1.5">
              <span>Rows:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 rounded border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] text-[#1F1D1B] dark:text-[#F6F5F3] text-xs focus:outline-none cursor-pointer"
              >
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={!pagination.hasPrevPage || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] text-[#1F1D1B] dark:text-[#F6F5F3] disabled:opacity-40 hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
              <span>Prev</span>
            </button>
            <span className="px-2 font-mono text-xs">
              Page <strong className="text-[#1F1D1B] dark:text-[#F6F5F3]">{pagination.currentPage}</strong> of{' '}
              {pagination.totalPages || 1}
            </span>
            <button
              type="button"
              disabled={!pagination.hasNextPage || isLoading}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] text-[#1F1D1B] dark:text-[#F6F5F3] disabled:opacity-40 hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 5. DETAILED AUDIT EVENT INSPECTION MODAL */}
      {selectedLog && (() => {
        const info = extractStructuredDetails(selectedLog);
        const roleLabel = selectedLog.actorRoleLabel || selectedLog.details?.actorRoleLabel || formatRoleDisplayName(selectedLog.actorRole);
        const cleanActorName = selectedLog.actorName === 'BPLO Licensing Officer'
          ? 'LLSA I — Local Legislative Staff Assistant I (Madhelyn Pastoral)'
          : cleanText(selectedLog.actorName, 'System Administrator');

        return (
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setSelectedLog(null)}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center shrink-0 border border-[#9E2A2B]/20">
                    <Shield size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${getActionBadgeColor(selectedLog.action)}`}>
                        {selectedLog.action}
                      </span>
                      <span className="text-xs font-mono text-[#6B6761] dark:text-[#A8A29E]">
                        ID: {selectedLog._id}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-1">
                      Recorded on{' '}
                      <strong className="text-[#1F1D1B] dark:text-[#F6F5F3]">
                        {selectedLog.createdAt
                          ? new Date(selectedLog.createdAt).toLocaleString('en-US', {
                              dateStyle: 'full',
                              timeStyle: 'medium'
                            })
                          : '—'}
                      </strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="p-1.5 rounded-lg text-[#6B6761] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] hover:bg-[#E4E1DC]/50 dark:hover:bg-[#2E2A27] cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                {/* Summary Banner */}
                <div className="p-3.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E2A2B] dark:text-[#D4AF37] block mb-1">
                    Event Narrative Summary
                  </span>
                  <p className="text-xs font-medium text-[#1F1D1B] dark:text-[#F6F5F3] leading-relaxed">
                    {info.summary}
                  </p>
                </div>

                {/* Actor & Security Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E] flex items-center gap-1.5">
                      <User size={12} /> Actor Identity &amp; Role
                    </span>
                    <p className="text-sm font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                      {cleanActorName}
                    </p>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${getRoleBadgeStyle(selectedLog.actorRole)}`}>
                      {roleLabel}
                    </span>
                    {selectedLog.actorId && (
                      <p className="text-[11px] font-mono text-[#6B6761] dark:text-[#A8A29E] pt-0.5">
                        Actor ID: {selectedLog.actorId}
                      </p>
                    )}
                  </div>

                  <div className="p-3.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E] flex items-center gap-1.5">
                      <Globe size={12} /> Network &amp; Target Context
                    </span>
                    <p className="text-xs text-[#1F1D1B] dark:text-[#F6F5F3]">
                      <span className="text-[#6B6761] dark:text-[#A8A29E]">IP Address:</span>{' '}
                      <strong className="font-mono">{cleanText(selectedLog.ipAddress, '127.0.0.1')}</strong>
                    </p>
                    <p className="text-xs text-[#1F1D1B] dark:text-[#F6F5F3]">
                      <span className="text-[#6B6761] dark:text-[#A8A29E]">Target Category:</span>{' '}
                      <strong>{cleanText(selectedLog.targetType, 'General')}</strong>
                    </p>
                    {selectedLog.targetId && (
                      <p className="text-xs text-[#1F1D1B] dark:text-[#F6F5F3]">
                        <span className="text-[#6B6761] dark:text-[#A8A29E]">Target Record ID:</span>{' '}
                        <span className="font-mono">{selectedLog.targetId}</span>
                      </p>
                    )}
                    {info.endpoint && (
                      <p className="text-[11px] font-mono text-[#6B6761] dark:text-[#A8A29E] truncate">
                        {info.httpMethod ? `${info.httpMethod} ` : ''}{info.endpoint}
                      </p>
                    )}
                  </div>
                </div>

                {/* Key Entity Highlights (if present) */}
                {(info.operatorName || info.plateNo || info.mtopNo || info.todaName || info.prevStatus || info.newStatus || info.orNo) && (
                  <div className="p-3.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3]/60 dark:bg-[#14110F]/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E] block mb-2.5">
                      Affected Franchise / Operator Details
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {info.operatorName && (
                        <div>
                          <span className="text-[10px] text-[#6B6761] dark:text-[#A8A29E] block">Operator / Subject</span>
                          <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{info.operatorName}</span>
                        </div>
                      )}
                      {info.plateNo && (
                        <div>
                          <span className="text-[10px] text-[#6B6761] dark:text-[#A8A29E] block">Plate Number</span>
                          <span className="font-mono font-semibold text-[#9E2A2B] dark:text-[#D4AF37]">{info.plateNo}</span>
                        </div>
                      )}
                      {info.mtopNo && (
                        <div>
                          <span className="text-[10px] text-[#6B6761] dark:text-[#A8A29E] block">MTOP Number</span>
                          <span className="font-mono font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{info.mtopNo}</span>
                        </div>
                      )}
                      {info.todaName && (
                        <div>
                          <span className="text-[10px] text-[#6B6761] dark:text-[#A8A29E] block">TODA Association</span>
                          <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{info.todaName}</span>
                        </div>
                      )}
                      {(info.prevStatus || info.newStatus) && (
                        <div>
                          <span className="text-[10px] text-[#6B6761] dark:text-[#A8A29E] block">State Transition</span>
                          <span className="font-semibold text-[#15803D] dark:text-[#4ADE80]">
                            {info.prevStatus ? `${info.prevStatus} → ${info.newStatus || 'Updated'}` : info.newStatus}
                          </span>
                        </div>
                      )}
                      {info.orNo && (
                        <div>
                          <span className="text-[10px] text-[#6B6761] dark:text-[#A8A29E] block">Official Receipt</span>
                          <span className="font-mono font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                            OR# {info.orNo} {info.amountPaid !== null ? `(₱${info.amountPaid.toLocaleString()})` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Complete Structured Metadata Table */}
                {info.extraEntries.length > 0 && (
                  <div className="border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg overflow-hidden">
                    <div className="px-3.5 py-2 bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E] flex items-center gap-1.5">
                        <Terminal size={12} /> Recorded Audit Metadata Attributes
                      </span>
                      <span className="text-[10px] font-mono text-[#6B6761] dark:text-[#A8A29E]">
                        {info.extraEntries.length} field(s)
                      </span>
                    </div>
                    <div className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27]">
                      {info.extraEntries.map(([key, val]) => (
                        <div key={key} className="px-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-white dark:bg-[#1C1917]">
                          <span className="font-mono text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
                            {key}
                          </span>
                          <span className="font-mono text-xs font-medium text-[#1F1D1B] dark:text-[#F6F5F3] break-all sm:text-right">
                            {typeof val === 'object' ? JSON.stringify(val) : cleanText(val, '—')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {info.userAgent && (
                  <div className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] font-mono bg-[#F6F5F3] dark:bg-[#14110F] p-2.5 rounded border border-[#E4E1DC] dark:border-[#2E2A27] break-all">
                    <strong className="font-sans">Client Device / User-Agent:</strong> {info.userAgent}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-[#F6F5F3] dark:bg-[#14110F] border-t border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleCopyAuditJson(selectedLog)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] hover:bg-[#E4E1DC]/40 cursor-pointer"
                >
                  {copiedId ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{copiedId ? 'Copied Audit JSON' : 'Copy Audit JSON'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-1.5 rounded-lg bg-[#9E2A2B] hover:bg-[#7A1B22] text-white text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </MainLayout>
  );
};

export default AdminAuditLogs;
