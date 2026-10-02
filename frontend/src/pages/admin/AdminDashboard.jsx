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
import { StatsCardsSkeleton } from '../../components/skeleton';
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

    if (diffMins < 1) return t('common.justNow', 'Kani-kanina lang');
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
      return { name, verb: t('admin.verbArchived', 'Inarchive ang talaan ng') };
    }
    if (log.status === 'Active' && log.applicationType === 'Renewal') {
      return { name, verb: t('admin.verbRenewalApproved', 'Inaprubahan ang renewal ng') };
    }
    if (log.status === 'Active') {
      return { name, verb: t('admin.verbApproved', 'Inaprubahan ang prangkisa ng') };
    }
    if (log.status === 'Cancelled') {
      return {
        name,
        verb: log.cancelReason
          ? `${t('admin.verbCancelled', 'Kinansela')} (${log.cancelReason}) —`
          : t('admin.verbCancelledApp', 'Kinansela ang aplikasyon ng'),
      };
    }
    if (log.status === 'Expired') {
      return { name, verb: t('admin.verbExpired', 'Itinalang expired para kay') };
    }
    if (log.status === 'For Signing') {
      return { name, verb: t('admin.verbForSigning', 'Pinapapirmahan para kay') };
    }
    if (log.status === 'Ready for Pickup') {
      return { name, verb: t('admin.verbReadyPickup', 'Handa nang kunin ni') };
    }
    return { name, verb: t('admin.verbUpdated', 'Inupdate ang aplikasyon ng') };
  };

  // Pipeline links for PageHeader
  const pipelineLinks = useMemo(
    () => [
      {
        label: t('admin.pipelineNeedsReview', 'Needs Review'),
        count: stats.pending,
        onClick: () => navigate('/franchise-approval?tab=pending'),
        active: stats.pending > 0,
        title: 'Tingnan ang mga aplikasyong naghihintay ng desisyon',
      },
      {
        label: t('admin.pipelineForSigning', 'For Signing'),
        count: stats.forSigning,
        onClick: () => navigate('/franchise-approval?tab=signing'),
        active: false,
        title: 'Tingnan ang mga aplikasyong pinapapirmahan',
      },
      {
        label: t('admin.pipelineReadyPickup', 'Ready for Pickup'),
        count: stats.readyForPickup,
        onClick: () => navigate('/franchise-approval?tab=ready'),
        active: false,
        title: 'Tingnan ang mga prangkisang handa nang kunin',
      },
    ],
    [stats.pending, stats.forSigning, stats.readyForPickup, navigate, t]
  );

  // Subtitle for PageHeader
  const headerSubtitle = useMemo(() => {
    if (isLoading) {
      return t('admin.loadingSummary', 'Kinukuha ang pangkalahatang-ideya ng prangkisa...');
    }
    if (stats.pending > 0) {
      return `${stats.pending} ${t(
        'admin.subtextPending',
        'aplikasyon ang naghihintay ng pagsusuri sa queue'
      )} (${stats.pipeline} ${t('admin.subtextPipeline', 'kabuuang yunit sa aktibong pipeline ng munisipyo')}).`;
    }
    return `${t(
      'admin.subtextAllCleared',
      'Lahat ng review queue ay naasikaso na'
    )} (${stats.pipeline} ${t('admin.subtextPipeline', 'kabuuang yunit sa aktibong pipeline ng munisipyo')}).`;
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
        header: t('admin.colDaysWaiting', 'Araw na Naghihintay'),
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
                {days > 0 ? `${days}d` : t('common.today', 'Ngayon')}
              </span>
            </div>
          );
        },
      },
      {
        key: 'action',
        header: t('admin.colAction', 'Aksyon'),
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
            <span>{t('admin.review', 'Suriin')}</span>
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
        header: t('admin.colTime', 'Oras'),
        width: '80px',
        render: (log) => (
          <span className="font-mono text-xs text-[#6B6761] dark:text-[#A8A29E] tabular-nums whitespace-nowrap">
            {getRelativeTime(log.updatedAt)}
          </span>
        ),
      },
      {
        key: 'activity',
        header: t('admin.colAction', 'Aksyon'),
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
        header: t('admin.colStatus', 'Katayuan'),
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
                {t('admin.reviewQueue', 'Buksan ang Pila')} ({stats.pending})
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
            subtext={t('admin.totalFranchisesSub', 'Rehistradong yunit sa database')}
            onClick={() => navigate('/franchise-masterlist')}
            title="Tingnan ang kabuuang talaan sa Masterlist"
          />
          <StatCard
            label={t('admin.activeFranchises', 'Active Franchises')}
            count={stats.active}
            subtext={`${getPercentage(stats.active)}% ${t('admin.operational', 'pumapasada')}`}
            onClick={() => navigate('/franchise-masterlist?status=Active')}
            title="I-filter ang mga aktibong prangkisa"
          />
          <StatCard
            label={t('admin.pendingReview', 'Pending Review')}
            count={stats.pending}
            subtext={t('admin.pendingReviewSub', 'Naghihintay ng desisyon')}
            onClick={() => navigate('/franchise-approval?tab=pending')}
            title="Buksan ang review approval queue"
          />
          <StatCard
            label={t('admin.expiredUnits', 'Expired Units')}
            count={stats.expired}
            subtext={t('admin.expiredUnitsSub', 'Kailangang i-renew')}
            onClick={() => navigate('/franchise-masterlist?status=Expired')}
            title="I-filter ang mga pasong prangkisa"
          />
        </div>
      )}

      {/* 2.5 PEAK READINESS & REGULATORY THROUGHPUT (January surge metrics) */}
      {!isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label={t('admin.renewalsDue30', 'Renewals Due (30d)')}
            count={stats.renewalsDue30}
            subtext={`60d: ${stats.renewalsDue60} • 90d: ${stats.renewalsDue90}`}
            onClick={() => navigate('/franchise-masterlist?status=Active')}
            title="Mga unit na mag-eexpire sa darating na 30 araw"
          />
          <StatCard
            label={t('admin.receivedToday', 'Received Today')}
            count={stats.receivedToday}
            subtext={t('admin.receivedTodaySub', 'Bagong aplikasyong naitala ngayong araw')}
          />
          <StatCard
            label={t('admin.processedToday', 'Processed Today')}
            count={stats.processedToday}
            subtext={t('admin.processedTodaySub', 'Naaprubahan o naresolba')}
          />
          <StatCard
            label={t('admin.oldestWaiting', 'Oldest Waiting')}
            count={stats.oldestWaiting ? stats.oldestWaiting.timeWaiting : 0}
            subtext={
              stats.oldestWaiting
                ? `${stats.oldestWaiting.fullName} (${stats.oldestWaiting.todaName || 'Unit'})`
                : t('admin.noBacklog', 'Walang backlog sa pila')
            }
            actionLabel={stats.oldestWaiting ? t('admin.review', 'Suriin') : null}
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
                  {t('admin.franchiseHealthSub', 'Distribusyon ng estado sa lahat ng rehistradong yunit')}
                </p>
              </div>
              <span className="text-xs font-mono font-medium text-[#6B6761] dark:text-[#A8A29E] tabular-nums">
                {stats.total} {t('admin.unitsTotal', 'Yunit')}
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
                desc: t('admin.operational', 'Pumapasada'),
              },
              {
                label: t('status.pending', 'Pending'),
                count: stats.pending,
                pct: getPercentage(stats.pending),
                dotBg: 'bg-[#B45309]',
                desc: t('admin.awaitingReview', 'Sinusuri'),
              },
              {
                label: t('status.expired', 'Expired'),
                count: stats.expired,
                pct: getPercentage(stats.expired),
                dotBg: 'bg-[#B91C1C]',
                desc: t('admin.overdue', 'Paso na'),
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
              {t('admin.summaryTitle', 'Buod')}
            </h2>
            <span className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
              {t('admin.systemSnapshot', 'Impormasyon')}
            </span>
          </div>

          <div className="space-y-3.5 flex-1 flex flex-col justify-around text-xs">
            {/* Compliance Rate */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#6B6761] dark:text-[#A8A29E]">
                  {t('admin.complianceRate', 'Antas ng Pagsunod')}
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
                {stats.active} {t('common.of', 'sa')} {stats.total}{' '}
                {t('admin.activeAndCompliant', 'aktibo at sumusunod sa regulasyon')}
              </p>
            </div>

            {/* New Applications */}
            <div className="flex items-center justify-between py-1.5 border-t border-[#E4E1DC]/70 dark:border-[#2E2A27]/70">
              <div>
                <p className="text-[#1F1D1B] dark:text-[#F6F5F3] font-medium">
                  {t('admin.newApplications', 'Mga Bagong Aplikasyon')}
                </p>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
                  {stats.newAppsThisYear > 0 
                    ? `${stats.newAppsThisYear} ${t('admin.thisYear', 'ngayong taon')} (${stats.newApps} ${t('admin.lifetime', 'kabuuang bago')})`
                    : t('admin.newApplicationsSub', 'Unang beses na nag-apply')}
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
                  {t('admin.approvalQueue', 'Pila ng Pag-apruba')}
                </p>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
                  {stats.pending > 0
                    ? t('admin.actionNeeded', 'Kailangan ng aksyon sa pila')
                    : t('admin.queuesCleared', 'Lahat ng pila ay naasikaso')}
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
                  {t('admin.lastActivity', 'Huling Aktibidad')}
                </p>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
                  {t('admin.mostRecentUpdate', 'Kamakailang update sa prangkisa')}
                </p>
              </div>
              <span className="font-mono text-xs font-medium text-[#9E2A2B] dark:text-[#D4AF37] tabular-nums">
                {historyLogs.length > 0 ? getRelativeTime(historyLogs[0]?.updatedAt) : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. TODA DISTRIBUTION (Single-color horizontal BarList replacing 11-color donut) */}
      <div className="mb-6">
        <BarList
          data={todaStats}
          initialLimit={6}
          title={t('admin.todaDistribution', 'TODA Unit Distribution & Share')}
          subtitle={t(
            'admin.todaDistributionSub',
            'Bilang ng mga rehistradong yunit ng traysikel bawat samahan sa Gasan'
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
              <span>{t('common.viewAll', 'Tingnan lahat')}</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <DataTable
            columns={pendingColumns}
            data={recentApps}
            isLoading={isLoading}
            emptyTitle={t('admin.allCaughtUp', 'Walang nakabinbing aplikasyon')}
            emptySubtitle={t(
              'admin.queueClean',
              'Lahat ng aplikasyon para sa pagsusuri ay naasikaso na.'
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
            emptyTitle={t('admin.noActivityLogs', 'Walang tala ng aktibidad')}
            emptySubtitle={t(
              'admin.noRecentActions',
              'Walang naitalang pagbabago sa sistema sa nakaraang mga araw.'
            )}
            rowKey="_id"
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
