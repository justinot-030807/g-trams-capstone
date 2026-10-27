import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/MainLayout';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import BarList from '../../components/common/BarList';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import SmsDispatcherLog from '../../components/admin/SmsDispatcherLog';
import { useLanguage } from '../../context/LanguageContext';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { StatsCardsSkeleton, DashboardHealthSkeleton } from '../../components/skeleton';
import TricycleIcon from '../../components/common/TricycleIcon';
import { 
  ArrowRight, Clock, FileCheck, Award, FileText, 
  CheckCircle2, AlertCircle, RefreshCw, Layers 
} from 'lucide-react';

const BploDashboard = () => {
  const {
    stats,
    todaStats,
    recentApps,
    historyLogs,
    isLoading,
    error,
    refetch
  } = useDashboardStats({ pollingInterval: 60000 });

  const navigate = useNavigate();
  const { t } = useLanguage() || { t: (_, def) => def };

  const getPercentage = (count) => (stats.total === 0 ? 0 : Math.round((count / stats.total) * 100));

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return '—';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('common.justNow', 'Just now');
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDaysPending = (dateStr) => {
    if (!dateStr) return 0;
    return Math.floor((new Date() - new Date(dateStr)) / 86400000);
  };

  const getActionDetails = (log) => {
    const name = log.fullName || log.operator?.name || 'an Operator';
    if (log.isArchived) {
      return { name, verb: t('admin.verbArchived', 'Archived record of') };
    }
    if (log.status === 'Active' && log.applicationType === 'Renewal') {
      return { name, verb: t('admin.verbRenewalApproved', 'Approved renewal for') };
    }
    if (log.status === 'Active') {
      return { name, verb: t('admin.verbApproved', 'Approved franchise for') };
    }
    if (log.status === 'Cancelled') {
      return {
        name,
        verb: log.cancelReason
          ? `${t('admin.verbCancelled', 'Cancelled')} (${log.cancelReason}) —`
          : t('admin.verbCancelledApp', 'Cancelled application of'),
      };
    }
    if (log.status === 'Expired') {
      return { name, verb: t('admin.verbExpired', 'Marked expired for') };
    }
    if (log.status === 'For Signing') {
      return { name, verb: t('admin.verbForSigning', 'Routed for signing for') };
    }
    if (log.status === 'Ready for Pickup') {
      return { name, verb: t('admin.verbReadyPickup', 'Ready for pickup by') };
    }
    return { name, verb: t('admin.verbUpdated', 'Updated application for') };
  };

  // Pipeline links for PageHeader (Zero cashier links)
  const pipelineLinks = useMemo(
    () => [
      {
        label: t('admin.pipelineNeedsReview', 'Needs Review'),
        count: stats.pending,
        onClick: () => navigate('/franchise-approval?tab=pending'),
        active: stats.pending > 0,
        title: t('admin.tooltipNeedsReview', 'View applications awaiting decision'),
      },
      {
        label: t('admin.pipelineForSigning', 'For Signing'),
        count: stats.forSigning,
        onClick: () => navigate('/franchise-approval?tab=signing'),
        active: false,
        title: t('admin.tooltipForSigning', 'View applications routed for signing'),
      },
      {
        label: t('admin.pipelineReadyPickup', 'Ready for Pickup'),
        count: stats.readyForPickup,
        onClick: () => navigate('/franchise-approval?tab=ready'),
        active: false,
        title: t('admin.tooltipReadyPickup', 'View franchises ready for pickup'),
      },
    ],
    [stats.pending, stats.forSigning, stats.readyForPickup, navigate, t]
  );

  // Subtitle for PageHeader
  const headerSubtitle = useMemo(() => {
    if (isLoading) {
      return t('admin.loadingSummary', 'Loading franchise overview...');
    }
    if (stats.pending > 0) {
      return `${stats.pending} ${t(
        'admin.subtextPending',
        'application(s) awaiting review in queue'
      )} (${stats.pipeline} ${t('admin.subtextPipeline', 'total units in active municipal pipeline')}).`;
    }
    return `${t(
      'admin.subtextAllCleared',
      'All review queues cleared'
    )} (${stats.pipeline} ${t('admin.subtextPipeline', 'total units in active municipal pipeline')}).`;
  }, [isLoading, stats.pending, stats.pipeline, t]);

  // Columns for Pending Approvals Queue DataTable
  const pendingColumns = useMemo(
    () => [
      {
        key: 'operator',
        header: t('admin.colOperator', 'Operator'),
        render: (app) => (
          <div>
            <p className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] leading-snug">
              {app.fullName || 'Applicant'}
            </p>
            <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
              {app.applicationType || 'New Application'}
            </p>
          </div>
        ),
      },
      {
        key: 'toda',
        header: t('admin.colToda', 'TODA'),
        render: (app) => (
          <span className="text-xs text-[#1F1D1B] dark:text-[#F6F5F3]">
            {app.todaName || '—'}
          </span>
        ),
      },
      {
        key: 'unit',
        header: t('admin.colUnit', 'Unit'),
        render: (app) => (
          <span className="text-xs font-mono text-[#6B6761] dark:text-[#A8A29E]">
            {app.make || 'Tricycle'}
          </span>
        ),
      },
      {
        key: 'daysWaiting',
        header: t('admin.colDaysWaiting', 'Days Waiting'),
        render: (app) => {
          const days = getDaysPending(app.dateApplied || app.createdAt);
          const isUrgent = days >= 7;
          const isWarning = days >= 3 && days < 7;

          return (
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isUrgent
                    ? 'bg-[#B91C1C]'
                    : isWarning
                    ? 'bg-[#B45309]'
                    : 'bg-[#15803D]'
                }`}
              />
              <span
                className={`font-mono text-xs font-semibold tabular-nums ${
                  isUrgent
                    ? 'text-[#B91C1C] dark:text-[#F87171]'
                    : isWarning
                    ? 'text-[#B45309] dark:text-[#FBBF24]'
                    : 'text-[#15803D] dark:text-[#4ADE80]'
                }`}
              >
                {days > 0 ? `${days}d` : t('common.today', 'Today')}
              </span>
            </div>
          );
        },
      },
      {
        key: 'action',
        header: t('admin.colAction', 'Action'),
        align: 'right',
        render: (app) => (
          <button
            type="button"
            onClick={() =>
              navigate(
                app._id
                  ? `/franchise-approval/review/${app._id}?tab=pending`
                  : '/franchise-approval?tab=pending'
              )
            }
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#9E2A2B] dark:text-[#D4AF37] bg-[#FDF2F4] dark:bg-[#9E2A2B]/20 hover:bg-[#9E2A2B] hover:text-white dark:hover:bg-[#9E2A2B] dark:hover:text-white rounded border border-[#9E2A2B]/30 transition-colors cursor-pointer active:scale-95"
          >
            <span>{t('admin.review', 'Review')}</span>
            <ArrowRight size={12} />
          </button>
        ),
      },
    ],
    [navigate, t]
  );

  // Columns for System Activity History DataTable
  const historyColumns = useMemo(
    () => [
      {
        key: 'time',
        header: t('admin.colTime', 'Time'),
        width: '80px',
        render: (log) => (
          <span className="font-mono text-xs text-[#6B6761] dark:text-[#A8A29E] tabular-nums whitespace-nowrap">
            {getRelativeTime(log.updatedAt)}
          </span>
        ),
      },
      {
        key: 'activity',
        header: t('admin.colAction', 'Action'),
        render: (log) => {
          const details = getActionDetails(log);
          return (
            <p className="text-xs text-[#1F1D1B] dark:text-[#F6F5F3] leading-snug">
              <span className="text-[#6B6761] dark:text-[#A8A29E]">{details.verb} </span>
              <span className="font-semibold">{details.name}</span>
            </p>
          );
        },
      },
      {
        key: 'status',
        header: t('admin.colStatus', 'Status'),
        render: (log) => {
          if (log.isArchived) {
            return (
              <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#E4E1DC] text-[#6B6761] dark:bg-[#2E2A27] dark:text-[#A8A29E]">
                {t('common.archived', 'Archived')}
              </span>
            );
          }
          return <StatusBadge status={log.status} />;
        },
      },
      {
        key: 'unit',
        header: t('admin.colUnit', 'Unit'),
        render: (log) => (
          <span className="font-mono text-xs text-[#6B6761] dark:text-[#A8A29E]">
            {log.mtopNumber || log.motorNumber || '—'}
          </span>
        ),
      },
    ],
    [t]
  );

  return (
    <MainLayout>
      {/* 1. PAGE HEADER (with Pipeline Status Pills) */}
      <PageHeader
        title={t('admin.bploDashboardTitle', 'BPLO Operations Dashboard')}
        subtitle={headerSubtitle}
        pipelineLinks={pipelineLinks}
        badge={
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#15803D]/10 text-[#15803D] dark:bg-[#15803D]/20 dark:text-[#4ADE80] border border-[#15803D]/20">
            {t('admin.bploBadge', 'Franchise Office')}
          </span>
        }
      />

      {/* 2. STAT CARDS (4 Compact Metric Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {isLoading ? (
          <StatsCardsSkeleton count={4} />
        ) : (
          <>
            <StatCard
              label={t('admin.statActiveFranchises', 'Active Franchises')}
              value={stats.active}
              subtext={t('admin.statActiveSub', 'Compliant & registered')}
              delta={{
                text: `${getPercentage(stats.active)}% ${t('admin.statOfTotal', 'of total')}`,
                type: 'neutral',
              }}
              onClick={() => navigate('/franchise-masterlist')}
              clickable
            />

            <StatCard
              label={t('admin.statPendingApprovals', 'Pending Approvals')}
              value={stats.pending}
              subtext={
                stats.pending > 0
                  ? t('admin.statActionNeeded', 'Review required')
                  : t('admin.statUpToDate', 'Up to date')
              }
              delta={
                stats.pending > 0
                  ? {
                      text: `${stats.pending} ${t('admin.statNeedsAction', 'needs action')}`,
                      type: 'warning',
                    }
                  : undefined
              }
              alert={stats.pending > 0}
              onClick={() => navigate('/franchise-approval?tab=pending')}
              clickable
            />

            <StatCard
              label={t('admin.statInPipeline', 'In Pipeline')}
              value={stats.pipeline}
              subtext={t('admin.statPipelineSub', 'Review, signing & pickup')}
              delta={{
                text: `${stats.forSigning} ${t('admin.statSigning', 'signing')} · ${stats.readyForPickup} ${t('admin.statPickup', 'pickup')}`,
                type: 'neutral',
              }}
              onClick={() => navigate('/franchise-approval')}
              clickable
            />

            <StatCard
              label={t('admin.statExpiringWarning', 'Expiring & Expired')}
              value={stats.expired}
              subtext={t('admin.statExpiredSub', 'Expired or cancelled')}
              delta={
                stats.expired > 0
                  ? {
                      text: `${stats.expired} ${t('admin.statRequiresRenewal', 'requires renewal')}`,
                      type: 'danger',
                    }
                  : undefined
              }
              alert={stats.expired > 0}
              onClick={() => navigate('/manage-revocations')}
              clickable
            />
          </>
        )}
      </div>

      {/* 3. FLUID MUNICIPAL PIPELINE SUMMARY BANNER */}
      {isLoading ? (
        <DashboardHealthSkeleton />
      ) : (
        <div className="bg-white dark:bg-[#1C1917] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] p-4 sm:p-5 mb-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27] mb-3">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
              <h2 className="text-sm font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                {t('admin.pipelineTitle', 'Active Municipal Franchise Pipeline')}
              </h2>
            </div>
            <span className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-mono">
              {stats.total} {t('admin.registeredUnits', 'total recorded units')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Active & Compliant */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[#1F1D1B] dark:text-[#F6F5F3] font-medium">
                  {t('admin.compliantUnits', 'Compliant Units')}
                </span>
                <span className="font-mono font-semibold text-[#15803D] dark:text-[#4ADE80]">
                  {getPercentage(stats.active)}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#E4E1DC] dark:bg-[#2E2A27] overflow-hidden">
                <div
                  className="h-full bg-[#15803D] rounded-full"
                  style={{ width: `${getPercentage(stats.active)}%` }}
                />
              </div>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-1">
                {stats.active} {t('common.of', 'of')} {stats.total}{' '}
                {t('admin.activeAndCompliant', 'active and compliant')}
              </p>
            </div>

            {/* New Applications */}
            <div className="flex items-center justify-between py-1.5 border-t sm:border-t-0 sm:border-l border-[#E4E1DC]/70 dark:border-[#2E2A27]/70 sm:pl-4">
              <div>
                <p className="text-[#1F1D1B] dark:text-[#F6F5F3] font-medium">
                  {t('admin.newApplications', 'New Applications')}
                </p>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
                  {stats.newAppsThisYear > 0 
                    ? `${stats.newAppsThisYear} ${t('admin.thisYear', 'this year')} (${stats.newApps} ${t('admin.lifetime', 'lifetime total')})`
                    : t('admin.newApplicationsSub', 'First-time franchise filings')}
                </p>
              </div>
              <span className="font-mono text-sm font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] tabular-nums">
                {stats.newAppsThisYear || stats.newApps}
              </span>
            </div>

            {/* Approval Queue */}
            <div className="flex items-center justify-between py-1.5 border-t sm:border-t-0 sm:border-l border-[#E4E1DC]/70 dark:border-[#2E2A27]/70 sm:pl-4">
              <div>
                <p className="text-[#1F1D1B] dark:text-[#F6F5F3] font-medium">
                  {t('admin.approvalQueue', 'Approval Queue')}
                </p>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
                  {stats.pending > 0
                    ? t('admin.actionNeeded', 'Action needed in queue')
                    : t('admin.queuesCleared', 'All queues cleared')}
                </p>
              </div>
              <span
                className={`font-mono text-sm font-semibold tabular-nums ${
                  stats.pending > 0
                    ? 'text-[#B45309] dark:text-[#FBBF24]'
                    : 'text-[#1F1D1B] dark:text-[#F6F5F3]'
                }`}
              >
                {stats.pending}
              </span>
            </div>

            {/* Last System Activity */}
            <div className="flex items-center justify-between py-1.5 border-t sm:border-t-0 sm:border-l border-[#E4E1DC]/70 dark:border-[#2E2A27]/70 sm:pl-4">
              <div>
                <p className="text-[#1F1D1B] dark:text-[#F6F5F3] font-medium">
                  {t('admin.lastActivity', 'Last Pipeline Activity')}
                </p>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
                  {t('admin.mostRecentUpdate', 'Most recent franchise update')}
                </p>
              </div>
              <span className="font-mono text-xs font-medium text-[#9E2A2B] dark:text-[#D4AF37] tabular-nums">
                {historyLogs.length > 0 ? getRelativeTime(historyLogs[0]?.updatedAt) : '—'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. TODA DISTRIBUTION */}
      <div className="mb-6">
        <BarList
          data={todaStats}
          initialLimit={6}
          title={t('admin.todaDistribution', 'TODA Unit Distribution & Share')}
          subtitle={t(
            'admin.todaDistributionSub',
            'Breakdown of active tricycle units per transport association across Gasan'
          )}
        />
      </div>

      {/* 5. QUEUES & ACTIVITY HISTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals Queue */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2 px-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                {t('admin.pendingApprovalsQueue', 'Pending Approvals Queue')}
              </h2>
              {stats.pending > 0 && (
                <span className="bg-[#9E2A2B] text-white text-xs font-mono font-medium px-2 py-0.2 rounded">
                  {stats.pending}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate('/franchise-approval?tab=pending')}
              className="text-xs font-medium text-[#9E2A2B] dark:text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{t('common.viewAll', 'View all')}</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <DataTable
            columns={pendingColumns}
            data={recentApps}
            isLoading={isLoading}
            emptyIcon={<TricycleIcon size={34} />}
            emptyTitle={t('admin.allCaughtUp', 'All caught up! No pending applications.')}
            emptySubtitle={t(
              'admin.queueClean',
              'All applications for review have been processed.'
            )}
            rowKey="_id"
          />
        </div>

        {/* System Activity History */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2 px-0.5">
            <h2 className="text-sm font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
              {t('admin.systemActivityHistory', 'System Activity History')}
            </h2>
            <button
              type="button"
              onClick={() => navigate('/franchise-masterlist')}
              className="text-xs font-medium text-[#9E2A2B] dark:text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{t('admin.masterlist', 'Masterlist')}</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <DataTable
            columns={historyColumns}
            data={historyLogs}
            isLoading={isLoading}
            emptyTitle={t('admin.noActivityLogs', 'No recent system activity logged.')}
            emptySubtitle={t(
              'admin.noRecentActions',
              'No system changes logged in recent days.'
            )}
            rowKey="_id"
          />
        </div>
      </div>

      {/* Automated SMS Dispatcher Audit Log (Full Width) */}
      <div className="mt-8 w-full">
        <SmsDispatcherLog />
      </div>
    </MainLayout>
  );
};

export default BploDashboard;
