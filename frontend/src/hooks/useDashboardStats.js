import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useDashboardStats Hook
 * Centralized, standardized state management for G-TRAMS Admin Dashboard statistics.
 *
 * Provides:
 * - Single source of truth for all municipal transport KPIs
 * - Strictly separated Cancelled vs Revoked counts
 * - Consistent Pending (Needs Review) calculation
 * - Normalized TODA distribution sorted descending
 * - Auto-refresh with configurable polling interval
 * - Clean error handling and manual refetch capabilities
 */
export const useDashboardStats = (options = {}) => {
  const { pollingInterval = 60000 } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    forSigning: 0,
    readyForPickup: 0,
    pipeline: 0,
    expired: 0,
    cancelled: 0,
    revoked: 0,
    newApps: 0,
    newAppsThisYear: 0,
    renewalsDue30: 0,
    renewalsDue60: 0,
    renewalsDue90: 0,
    receivedToday: 0,
    processedToday: 0,
    oldestWaiting: null,
  });

  const [todaStats, setTodaStats] = useState([]);
  const [recentApps, setRecentApps] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);

  const isMountedRef = useRef(true);

  const fetchStats = useCallback(async () => {
    const token = localStorage.getItem('token');
    const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

    if (!baseUrl) {
      if (isMountedRef.current) {
        setIsLoading(false);
        setError('API URL is not configured');
      }
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/api/v1/franchises/reports`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const raw = await response.json();
      const sum = raw.summary || {};

      if (isMountedRef.current) {
        const total = Number(sum.total) || 0;
        const active = Number(sum.active) || 0;
        const pending = Number(sum.pending) || 0;
        const forSigning = Number(sum.forSigning) || 0;
        const readyForPickup = Number(sum.readyForPickup) || 0;
        const pipeline = pending + forSigning + readyForPickup;
        const expired = Number(sum.expired) || 0;
        const cancelled = Number(sum.cancelled) || 0;
        const revoked = Number(sum.revoked) || 0;
        const newApps = Number(sum.newApps) || 0;
        const newAppsThisYear = Number(sum.newAppsThisYear) || newApps;
        const renewalsDue30 = Number(sum.renewalsDue30) || 0;
        const renewalsDue60 = Number(sum.renewalsDue60) || 0;
        const renewalsDue90 = Number(sum.renewalsDue90) || 0;
        const receivedToday = Number(sum.receivedToday) || 0;
        const processedToday = Number(sum.processedToday) || 0;
        const oldestWaiting = sum.oldestWaiting || null;

        setStats({
          total,
          active,
          pending,
          forSigning,
          readyForPickup,
          pipeline,
          expired,
          cancelled,
          revoked,
          newApps,
          newAppsThisYear,
          renewalsDue30,
          renewalsDue60,
          renewalsDue90,
          receivedToday,
          processedToday,
          oldestWaiting,
        });

        // Compute normalized TODA distribution
        const todaMap = sum.todaMap || {};
        const totalRecords = total > 0 ? total : 1;

        const todaList = Object.entries(todaMap)
          .map(([name, count]) => {
            const val = Number(count) || 0;
            return {
              name: String(name).trim() || 'NON-TODA',
              value: val,
              percentage: Math.round((val / totalRecords) * 100),
            };
          })
          .sort((a, b) => b.value - a.value);

        setTodaStats(todaList);
        setRecentApps(Array.isArray(sum.recentApps) ? sum.recentApps : []);
        setHistoryLogs(Array.isArray(sum.historyLogs) ? sum.historyLogs : []);
        setError(null);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Failed to fetch dashboard statistics:', err);
        setError(err.message || 'Error loading dashboard data');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchStats();

    let intervalId = null;
    if (pollingInterval > 0) {
      intervalId = setInterval(() => {
        // Only poll if tab is active
        if (!document.hidden) {
          fetchStats();
        }
      }, pollingInterval);
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchStats();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      isMountedRef.current = false;
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [fetchStats, pollingInterval]);

  return {
    stats,
    todaStats,
    recentApps,
    historyLogs,
    isLoading,
    error,
    refetch: fetchStats,
    lastUpdated,
  };
};

export default useDashboardStats;
