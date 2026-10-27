import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/MainLayout';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import SmsDispatcherLog from '../../components/admin/SmsDispatcherLog';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Users, Server, Shield, Activity, RefreshCw, 
  Settings, Clock, ArrowRight, UserCheck, CheckCircle2,
  AlertTriangle, Database, HardDrive, Wifi, ShieldCheck,
  Cpu, Layers, FileText
} from 'lucide-react';

const SystemAdminDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage() || { t: (_, def) => def };

  const [healthData, setHealthData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchDiagnostics = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch both health telemetry and recent audit logs in parallel
      const [healthRes, auditRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/settings/health`, { headers }).catch(() => null),
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/audit-logs?limit=8`, { headers }).catch(() => null)
      ]);

      if (healthRes && healthRes.ok) {
        const json = await healthRes.json();
        if (json.data) setHealthData(json.data);
      }

      if (auditRes && auditRes.ok) {
        const auditJson = await auditRes.json();
        const logs = auditJson.data?.logs || auditJson.logs || auditJson.data || [];
        setAuditLogs(Array.isArray(logs) ? logs.slice(0, 8) : []);
      }
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load system diagnostics:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDiagnostics();
    const interval = setInterval(() => fetchDiagnostics(false), 30000);
    return () => clearInterval(interval);
  }, [fetchDiagnostics]);

  const formatUptime = (seconds) => {
    if (!seconds && seconds !== 0) return '—';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${seconds % 60}s`;
  };

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return '—';
    const diffMs = new Date() - new Date(dateStr);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('common.justNow', 'Just now');
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const auditColumns = [
    {
      key: 'time',
      header: 'Time',
      width: '100px',
      render: (log) => (
        <span className="font-mono text-xs text-[#6B6761] dark:text-[#A8A29E] whitespace-nowrap">
          {getRelativeTime(log.createdAt || log.timestamp)}
        </span>
      )
    },
    {
      key: 'action',
      header: 'Event / Action',
      render: (log) => {
        const action = log.action || 'SYSTEM_EVENT';
        let badgeColor = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
        if (action.includes('USER_') || action.includes('AUTH')) {
          badgeColor = 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200';
        } else if (action.includes('SETTINGS') || action.includes('CONFIG')) {
          badgeColor = 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200';
        } else if (action.includes('DEACTIVAT') || action.includes('REVOK')) {
          badgeColor = 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200';
        }
        return (
          <div className="flex flex-col">
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border w-fit ${badgeColor}`}>
              {action.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-[#1F1D1B] dark:text-[#F6F5F3] font-medium mt-0.5 truncate max-w-xs">
              {log.performedByName ? `By ${log.performedByName}` : log.details?.name ? `Target: ${log.details.name}` : 'Administrative Operation'}
            </span>
          </div>
        );
      }
    },
    {
      key: 'ip',
      header: 'IP / Origin',
      align: 'right',
      render: (log) => (
        <span className="font-mono text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
          {log.ipAddress || log.ip || '127.0.0.1'}
        </span>
      )
    }
  ];

  const totalUsers = healthData?.users?.total ?? 0;
  const activeUsers = healthData?.users?.active ?? 0;
  const roles = healthData?.users?.roles || {};
  const dbHealth = healthData?.database || { status: 'Checking...', connected: false, pingMs: -1 };
  const sysInfo = healthData?.system || {};

  return (
    <MainLayout>
      {/* 1. Page Header for IT Maintenance Persona */}
      <PageHeader
        title="IT System Administration & Maintenance"
        subtitle="Infrastructure health, database telemetry, user directory governance, and system security logs."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchDiagnostics(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1F1D1B] dark:text-[#F6F5F3] bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] rounded-md border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              title="Refresh telemetry"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-[#9E2A2B]' : ''} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/user-management')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#9E2A2B] hover:bg-[#7A1B22] rounded-md transition-colors shadow-xs active:scale-95 cursor-pointer"
            >
              <Users size={13} />
              <span>Manage Accounts</span>
            </button>
          </div>
        }
      />

      {/* 2. Primary Telemetry Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Registered Users"
          count={totalUsers}
          subtext={`${activeUsers} active account(s)`}
          onClick={() => navigate('/user-management')}
          title="Open User Accounts Directory"
        />
        <StatCard
          label="Database Status"
          count={dbHealth.connected ? 'Operational' : 'Disconnected'}
          subtext={`MongoDB Atlas • ${dbHealth.pingMs >= 0 ? `${dbHealth.pingMs}ms latency` : 'Checking'}`}
          title="MongoDB cluster connectivity"
        />
        <StatCard
          label="System Uptime"
          count={formatUptime(sysInfo.uptimeSeconds)}
          subtext={`Node ${sysInfo.nodeVersion || 'v20'} • ${sysInfo.memoryMb || 0} MB RAM`}
          title="Node.js server operational uptime"
        />
        <StatCard
          label="Maintenance Mode"
          count={sysInfo.maintenanceMode ? 'Active (Locked)' : 'Normal Operations'}
          subtext={`Fiscal Year ${sysInfo.fiscalYear || '2026'}`}
          onClick={() => navigate('/admin/settings')}
          title="Configure maintenance mode in System Settings"
        />
      </div>

      {/* 3. Account Roles Distribution & Infrastructure Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* User Role Governance Breakdown */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1C1917] p-5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
              <div>
                <h2 className="text-sm font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                  <span>Account Governance & Role Separation</span>
                </h2>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
                  Decoupled authority: System Admins manage IT systems; BPLO Staff manage franchises; Cashiers manage revenue.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                {totalUsers} Total Accounts
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Operators', count: roles.operator || 0, color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' },
                { label: 'TODA Presidents', count: roles.toda_president || 0, color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' },
                { label: 'BPLO Staff', count: roles.bplo_staff || 0, color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' },
                { label: 'Municipal Cashiers', count: roles.cashier || 0, color: 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800' },
                { label: 'System Admins', count: roles.system_admin || 0, color: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800' },
                { label: 'Drivers', count: roles.driver || 0, color: 'text-slate-700 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800' },
              ].map((item, idx) => (
                <div key={idx} className={`p-3 rounded-lg border flex flex-col justify-between ${item.color}`}>
                  <span className="text-[11px] font-semibold uppercase tracking-wider">{item.label}</span>
                  <span className="text-xl font-mono font-bold mt-1 tabular-nums">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-between">
            <span className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
              Role modifications and account deactivations require IT administrative authority.
            </span>
            <button
              type="button"
              onClick={() => navigate('/user-management')}
              className="text-xs font-semibold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>User Directory</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* IT Infrastructure & Database Health */}
        <div className="bg-white dark:bg-[#1C1917] p-5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
              <h2 className="text-sm font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] flex items-center gap-2">
                <Database size={16} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                <span>Database & Health</span>
              </h2>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                dbHealth.connected ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-red-50 text-red-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dbHealth.connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <span>{dbHealth.connected ? 'Connected' : 'Offline'}</span>
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-[#E4E1DC]/60 dark:border-[#2E2A27]/60">
                <span className="text-[#6B6761] dark:text-[#A8A29E]">Cluster Round-Trip Latency</span>
                <span className="font-mono font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                  {dbHealth.pingMs >= 0 ? `${dbHealth.pingMs} ms` : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#E4E1DC]/60 dark:border-[#2E2A27]/60">
                <span className="text-[#6B6761] dark:text-[#A8A29E]">Total Franchises Records</span>
                <span className="font-mono font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                  {healthData?.counts?.franchises ?? '—'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#E4E1DC]/60 dark:border-[#2E2A27]/60">
                <span className="text-[#6B6761] dark:text-[#A8A29E]">Audit Log Entries</span>
                <span className="font-mono font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                  {healthData?.counts?.auditLogs ?? '—'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[#6B6761] dark:text-[#A8A29E]">Support Inquiries / Tickets</span>
                <span className="font-mono font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                  {healthData?.counts?.tickets ?? '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E4E1DC] dark:border-[#2E2A27] mt-3">
            <button
              type="button"
              onClick={() => navigate('/admin/settings')}
              className="w-full py-2 bg-[#F6F5F3] hover:bg-[#EAE7E1] dark:bg-[#14110F] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] rounded-md font-semibold text-xs border border-[#E4E1DC] dark:border-[#2E2A27] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Settings size={14} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
              <span>System Settings & Audit Log Explorer</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Real-Time Audit Logs & IT Fast Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-2 px-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] flex items-center gap-1.5">
                <Activity size={15} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                <span>Recent System Audit Logs</span>
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/settings')}
              className="text-xs font-medium text-[#9E2A2B] dark:text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Audit Log</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <DataTable
            columns={auditColumns}
            data={auditLogs}
            isLoading={isLoading}
            emptyTitle="No audit logs recorded yet."
            emptySubtitle="Administrative and security actions will be recorded here automatically."
            rowKey="_id"
          />
        </div>

        {/* Quick Management Shortcuts */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
            IT Administrative Quick Actions
          </h2>

          <div
            onClick={() => navigate('/user-management')}
            className="p-4 bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27]/60 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-[#9E2A2B]/10 dark:bg-[#9E2A2B]/20 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                <Users size={18} />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] group-hover:text-[#9E2A2B] dark:group-hover:text-[#D4AF37] transition-colors">
                  User Accounts Directory
                </h3>
                <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
                  Create, verify, deactivate, and assign staff roles
                </p>
              </div>
            </div>
            <ArrowRight size={14} className="text-[#6B6761] group-hover:translate-x-0.5 transition-transform" />
          </div>

          <div
            onClick={() => navigate('/admin/settings')}
            className="p-4 bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27]/60 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Settings size={18} />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] group-hover:text-[#9E2A2B] dark:group-hover:text-[#D4AF37] transition-colors">
                  System Settings & Policy
                </h3>
                <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
                  Fiscal fees, validity duration, maintenance mode
                </p>
              </div>
            </div>
            <ArrowRight size={14} className="text-[#6B6761] group-hover:translate-x-0.5 transition-transform" />
          </div>

          <div
            onClick={() => navigate('/admin/tickets')}
            className="p-4 bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27]/60 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] group-hover:text-[#9E2A2B] dark:group-hover:text-[#D4AF37] transition-colors">
                  Technical & Citizen Tickets
                </h3>
                <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
                  Review technical issues and inquiry tickets
                </p>
              </div>
            </div>
            <ArrowRight size={14} className="text-[#6B6761] group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Automated SMS Dispatcher Audit Log */}
        <div className="mt-8">
          <SmsDispatcherLog />
        </div>
      </div>
    </MainLayout>
  );
};

export default SystemAdminDashboard;
