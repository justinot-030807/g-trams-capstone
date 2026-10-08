import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/MainLayout';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import BarList from '../../components/common/BarList';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { useLanguage } from '../../context/LanguageContext';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { StatsCardsSkeleton, DashboardHealthSkeleton } from '../../components/skeleton';
import TricycleIcon from '../../components/common/TricycleIcon';
import { ArrowRight, Clock } from 'lucide-react';

const AdminDashboard = () => {
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

  // Pipeline links for PageHeader
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
        align: 'right',
        render: (log) => <StatusBadge status={log.status} />,
      },
    ],
    [t]
  );

  return (
    <MainLayout>
      {/* 1. MINIMALIST PAGE HEADER (Replaces old hero banner) */}
      <PageHeader
        title={t('admin.dashboardTitle', 'Dashboard')}
        subtitle={headerSubtitle}
        pipelineLinks={pipelineLinks}
        actions={
          stats.pending > 0 ? (
            <button
              type="button"
              onClick={() => navigate('/franchise-approval?tab=pending')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#9E2A2B] hover:bg-[#7A1B22] rounded-md transition-colors shadow-xs active:scale-95 cursor-pointer"
            >
              <Clock size={13} />
              <span>
                {t('admin.reviewQueue', 'Open Queue')} ({stats.pending})
              </span>
            </button>
          ) : null
        }
      />

      {/* 2. PRIMARY STATS CARDS (Flat, no icon tiles, tabular-nums) */}
      {isLoading ? (
        <div className="mb-6">
          <StatsCardsSkeleton count={4} />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label={t('admin.totalFranchises', 'Total Franchises')}
            count={stats.total}
            subtext={t('admin.totalFranchisesSub', 'Registered units in database')}
            onClick={() => navigate('/franchise-masterlist')}
            title="View complete record in Masterlist"
          />
          <StatCard
            label={t('admin.activeFranchises', 'Active Franchises')}
            count={stats.active}
            subtext={`${getPercentage(stats.active)}% ${t('admin.operational', 'operational')}`}
            onClick={() => navigate('/franchise-masterlist?status=Active')}
            title="Filter active franchises"
          />
          <StatCard
            label={t('admin.pendingReview', 'Pending Review')}
            count={stats.pending}
            subtext={t('admin.pendingReviewSub', 'Awaiting municipal decision')}
            onClick={() => navigate('/franchise-approval?tab=pending')}
            title="Open review approval queue"
          />
          <StatCard
            label={t('admin.expiredUnits', 'Expired Units')}
            count={stats.expired}
            subtext={t('admin.expiredUnitsSub', 'Renewal overdue')}
            onClick={() => navigate('/franchise-masterlist?status=Expired')}
            title="Filter expired franchises"
          />
        </div>
      )}

      {/* 2.5 PEAK READINESS & REGULATORY THROUGHPUT (January surge metrics) */}
      {isLoading ? (
        <StatsCardsSkeleton count={4} gridClassName="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" baseDelay={100} stepDelay={30} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label={t('admin.renewalsDue30', 'Renewals Due (30d)')}
            count={stats.renewalsDue30}
            subtext={`60d: ${stats.renewalsDue60} • 90d: ${stats.renewalsDue90}`}
            onClick={() => navigate('/franchise-masterlist?status=Active')}
            title="Units expiring in the next 30 days"
          />
          <StatCard
            label={t('admin.receivedToday', 'Received Today')}
            count={stats.receivedToday}
            subtext={t('admin.receivedTodaySub', 'New applications filed today')}
          />
          <StatCard
            label={t('admin.processedToday', 'Processed Today')}
            count={stats.processedToday}
            subtext={t('admin.processedTodaySub', 'Approved, signed, or resolved')}
          />
          <StatCard
            label={t('admin.oldestWaiting', 'Oldest Waiting')}
            count={stats.oldestWaiting ? stats.oldestWaiting.timeWaiting : 0}
            subtext={
              stats.oldestWaiting
                ? `${stats.oldestWaiting.fullName} (${stats.oldestWaiting.todaName || 'Unit'})`
                : t('admin.noBacklog', 'No queue backlog')
            }
            actionLabel={stats.oldestWaiting ? t('admin.review', 'Review') : null}
            onAction={
              stats.oldestWaiting
                ? () =>
                    navigate(
                      `/franchise-approval/review/${stats.oldestWaiting._id}?tab=pending`
                    )
                : null
            }
          />
        </div>
      )}

      {/* 3. FRANCHISE HEALTH OVERVIEW & BUOD (SIDE BY SIDE) */}
      {isLoading ? (
        <DashboardHealthSkeleton baseDelay={160} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Franchise Health Overview (Segmented bar + 4 status breakdown) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1C1917] p-5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
              <div>
                <h2 className="text-sm font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                  {t('admin.franchiseHealth', 'Franchise Health Overview')}
                </h2>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
                  {t('admin.franchiseHealthSub', 'Status distribution across all registered tricycle units')}
                </p>
              </div>
              <span className="text-xs font-mono font-medium text-[#6B6761] dark:text-[#A8A29E] tabular-nums">
                {stats.total} {t('admin.unitsTotal', 'Units')}
              </span>
            </div>

            {/* Segmented Bar (4 semantic colors only) */}
            <div className="mb-4">
              <div
                className="w-full h-3 rounded bg-[#E4E1DC]/60 dark:bg-[#2E2A27]/60 overflow-hidden flex"
                role="progressbar"
                aria-label="Franchise status distribution"
                aria-valuenow={getPercentage(stats.active)}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div
                  className="bg-[#15803D] h-full transition-all duration-500"
                  style={{ width: `${getPercentage(stats.active)}%` }}
                  title={`Active: ${stats.active} (${getPercentage(stats.active)}%)`}
                />
                <div
                  className="bg-[#B45309] h-full transition-all duration-500"
                  style={{ width: `${getPercentage(stats.pending)}%` }}
                  title={`Pending: ${stats.pending} (${getPercentage(stats.pending)}%)`}
                />
                <div
                  className="bg-[#B91C1C] h-full transition-all duration-500"
                  style={{ width: `${getPercentage(stats.expired)}%` }}
                  title={`Expired: ${stats.expired} (${getPercentage(stats.expired)}%)`}
                />
                <div
                  className="bg-[#6B7280] h-full transition-all duration-500"
                  style={{ width: `${getPercentage(stats.cancelled + stats.revoked)}%` }}
                  title={`Cancelled / Revoked: ${stats.cancelled + stats.revoked} (${getPercentage(stats.cancelled + stats.revoked)}%)`}
                />
              </div>
            </div>
          </div>

          {/* 4 Status Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[
              {
                label: t('status.active', 'Active'),
                count: stats.active,
                pct: getPercentage(stats.active),
                dotBg: 'bg-[#15803D]',
                desc: t('admin.operational', 'Operational'),
              },
              {
                label: t('status.pending', 'Pending'),
                count: stats.pending,
                pct: getPercentage(stats.pending),
                dotBg: 'bg-[#B45309]',
                desc: t('admin.awaitingReview', 'Awaiting review'),
              },
              {
                label: t('status.expired', 'Expired'),
                count: stats.expired,
                pct: getPercentage(stats.expired),
                dotBg: 'bg-[#B91C1C]',
                desc: t('admin.overdue', 'Renewal overdue'),
              },
              {
                label: t('admin.revokedCancelled', 'Revoked / Cancelled'),
                count: stats.cancelled + stats.revoked,
                pct: getPercentage(stats.cancelled + stats.revoked),
                dotBg: 'bg-[#6B7280]',
                desc: `${stats.cancelled} cancelled • ${stats.revoked} revoked`,
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3]/50 dark:bg-[#14110F]/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${item.dotBg}`} />
                    <span className="text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider truncate">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-mono font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] tabular-nums">
                      {item.count}
                    </span>
                    <span className="text-xs font-mono text-[#6B6761] dark:text-[#A8A29E] tabular-nums">
                      ({item.pct}%)
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-1 truncate">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Buod (Summary) - Replaces Quick Insights with simple label:value list, no Sparkles */}
        <div className="bg-white dark:bg-[#1C1917] p-5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
            <h2 className="text-sm font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
              {t('admin.summaryTitle', 'Summary')}
            </h2>
            <span className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
              {t('admin.systemSnapshot', 'Snapshot')}
            </span>
          </div>

          <div className="space-y-3.5 flex-1 flex flex-col justify-around text-xs">
            {/* Compliance Rate */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#6B6761] dark:text-[#A8A29E]">
                  {t('admin.complianceRate', 'Compliance Rate')}
                </span>
                <span className="font-mono font-semibold text-[#15803D] dark:text-[#4ADE80] tabular-nums">
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
            <div className="flex items-center justify-between py-1.5 border-t border-[#E4E1DC]/70 dark:border-[#2E2A27]/70">
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
            <div className="flex items-center justify-between py-1.5 border-t border-[#E4E1DC]/70 dark:border-[#2E2A27]/70">
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
            <div className="flex items-center justify-between py-1.5 border-t border-[#E4E1DC]/70 dark:border-[#2E2A27]/70">
              <div>
                <p className="text-[#1F1D1B] dark:text-[#F6F5F3] font-medium">
                  {t('admin.lastActivity', 'Last System Activity')}
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
      </div>
    )}

      {/* 4. TODA DISTRIBUTION (Single-color horizontal BarList replacing 11-color donut) */}
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

      {/* 5. QUEUES & ACTIVITY HISTORY (2 Compact DataTables) */}
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
    </MainLayout>
  );
};

export default AdminDashboard;
