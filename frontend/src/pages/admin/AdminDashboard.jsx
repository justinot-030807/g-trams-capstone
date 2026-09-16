import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout';
import { 
  Users, FileStack, Clock, ShieldCheck, AlertTriangle, 
  BarChart3, History, CheckCircle, ArrowRight, TrendingUp, Sparkles,
  PieChart as PieChartIcon, Sun, Moon, SunMedium
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { StatsCardsSkeleton, SkeletonElement } from '../../components/skeleton';

const TODA_COLORS = [
  '#7A1B22', // Maroon (Municipal Core)
  '#D4AF37', // Gold (Accent)
  '#2563EB', // Blue (BATODA)
  '#059669', // Emerald (POB TODA)
  '#D97706', // Amber (GT TODA)
  '#7C3AED', // Purple (NBI TODA)
  '#0D9488', // Teal (TAB TODA)
  '#E11D48', // Rose (BANGBANG IPIL)
  '#0284C7', // Sky (BAHI TODA)
  '#4F46E5', // Indigo (GASAN CENTRAL)
  '#64748B'  // Slate (NON-TODA / Others)
];

const CustomTodaTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 text-xs z-50 relative pointer-events-none select-none">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-3 h-3 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: data.color }} />
          <span className="font-black text-slate-900 dark:text-white">{data.name}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-500 dark:text-slate-400 font-medium">
          <span>Units: <strong className="text-slate-900 dark:text-white font-bold">{data.value}</strong></span>
          <span className="font-black text-[#7A1B22] dark:text-[#D4AF37]">{data.percentage}% share</span>
        </div>
      </div>
    );
  }
  return null;
};

const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ 
    total: 0, active: 0, pending: 0, expired: 0, cancelled: 0, newApps: 0 
  });
  const [todaStats, setTodaStats] = useState([]);
  const [hoveredTodaIndex, setHoveredTodaIndex] = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isGraphAnimated, setIsGraphAnimated] = useState(false);
  
  const navigate = useNavigate();
  const loggedInAdminName = localStorage.getItem('name') || 'Administrator';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    fetchDashboardData();
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setIsGraphAnimated(false);
      const timer = setTimeout(() => setIsGraphAnimated(true), 80);
      return () => clearTimeout(timer);
    } else {
      setIsGraphAnimated(false);
    }
  }, [isLoading]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises?limit=5000`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const raw = await response.json();
      
      if (response.ok) {
        const data = Array.isArray(raw) ? raw : (raw?.data || []);
        const activeCount = data.filter(f => f.status === 'Active').length;
        const pendingCount = data.filter(f => f.status === 'Pending' || f.status === 'Ready for Pickup').length;
        const expiredCount = data.filter(f => f.status === 'Expired').length;
        const cancelledCount = data.filter(f => f.status === 'Cancelled' || f.status === 'Revoked').length;
        const newAppsCount = data.filter(f => f.applicationType === 'New').length;
        
        setStats({ 
          total: data.length,
          active: activeCount, 
          pending: pendingCount, 
          expired: expiredCount,
          cancelled: cancelledCount,
          newApps: newAppsCount 
        });

        // Compute TODA distribution
        const todaMap = {};
        data.forEach(item => {
          let name = item.todaName ? item.todaName.trim() : 'NON-TODA';
          if (!name) name = 'NON-TODA';
          todaMap[name] = (todaMap[name] || 0) + 1;
        });

        const todaList = Object.entries(todaMap)
          .map(([name, count]) => ({
            name,
            value: count,
            percentage: data.length > 0 ? Math.round((count / data.length) * 100) : 0
          }))
          .sort((a, b) => b.value - a.value);

        const formattedTodaStats = todaList.map((item, idx) => ({
          ...item,
          color: TODA_COLORS[idx % TODA_COLORS.length]
        }));

        setTodaStats(formattedTodaStats);
        
        const pendingList = data.filter(f => f.status === 'Pending' || f.status === 'Ready for Pickup').slice(0, 5);
        setRecentApps(pendingList);

        const sortedHistory = [...data].sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.dateApplied || 0).getTime();
          const timeB = new Date(b.updatedAt || b.dateApplied || 0).getTime();
          return timeB - timeA;
        }).slice(0, 6);
        setHistoryLogs(sortedHistory);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPercentage = (count) => stats.total === 0 ? 0 : Math.round((count / stats.total) * 100);

  const getGraphHeight = (count) => {
    if (!count || count === 0) return '0%';
    const maxCount = Math.max(stats.active, stats.pending, stats.expired, stats.cancelled, 1);
    const calculated = (count / maxCount) * 100;
    return `${Math.max(calculated, 16)}%`;
  };

  const getActionDetails = (log) => {
    const name = log.fullName || log.operator?.name || 'an Operator';
    if (log.isArchived) return { name, verb: 'Archived record of', icon: FileStack, color: 'text-slate-600 bg-slate-100 border-slate-200', dotColor: 'bg-slate-400', badgeColor: 'text-slate-600 bg-slate-100 border-slate-200' };
    if (log.status === 'Active' && log.applicationType === 'Renewal') return { name, verb: 'Approved renewal for', icon: CheckCircle, color: 'text-blue-700 bg-blue-50 border-blue-200', dotColor: 'bg-blue-500', badgeColor: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (log.status === 'Active') return { name, verb: 'Approved franchise of', icon: CheckCircle, color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dotColor: 'bg-emerald-500', badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (log.status === 'Cancelled') return { name, verb: log.cancelReason ? `Cancelled (${log.cancelReason}) —` : 'Cancelled application of', icon: AlertTriangle, color: 'text-red-700 bg-red-50 border-red-200', dotColor: 'bg-red-500', badgeColor: 'text-red-700 bg-red-50 border-red-200' };
    if (log.status === 'Expired') return { name, verb: 'Flagged as expired for', icon: Clock, color: 'text-orange-700 bg-orange-50 border-orange-200', dotColor: 'bg-orange-500', badgeColor: 'text-orange-700 bg-orange-50 border-orange-200' };
    if (log.status === 'Ready for Pickup') return { name, verb: 'Updated pending record of', icon: Sparkles, color: 'text-amber-700 bg-amber-50 border-amber-200', dotColor: 'bg-amber-500', badgeColor: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { name, verb: 'Updated pending record of', icon: Clock, color: 'text-amber-700 bg-amber-50 border-amber-200', dotColor: 'bg-amber-500', badgeColor: 'text-amber-700 bg-amber-50 border-amber-200' };
  };

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDaysPending = (dateStr) => {
    if (!dateStr) return 0;
    return Math.floor((new Date() - new Date(dateStr)) / 86400000);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) {
      return { 
        text: 'Good morning', 
        tag: 'Morning Briefing', 
        icon: Sun, 
        badgeColor: 'text-amber-300' 
      };
    } else if (hour >= 12 && hour < 18) {
      return { 
        text: 'Good afternoon', 
        tag: 'Afternoon Overview', 
        icon: SunMedium, 
        badgeColor: 'text-orange-300' 
      };
    } else {
      return { 
        text: 'Good evening', 
        tag: 'Evening Summary', 
        icon: Moon, 
        badgeColor: 'text-indigo-200' 
      };
    }
  };

  const getGreetingSubtext = () => {
    if (isLoading) {
      return 'Loading system overview and franchise status...';
    }
    if (stats.pending > 0) {
      return `Welcome back! You have ${stats.pending} application${stats.pending > 1 ? 's' : ''} awaiting review in the approval queue.`;
    }
    return `Welcome back! All franchise queues and operations are up-to-date.`;
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  return (
    <MainLayout>
      {/* BUTTERY-SMOOTH CUSTOM ANIMATIONS */}
      <style>{`
        @keyframes smoothSlideUp {
          0% { opacity: 0; transform: translateY(24px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -20px) scale(1.12); }
        }
        .animate-smooth-card {
          opacity: 0;
          animation: smoothSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: transform, opacity;
        }
        .animate-banner-orb {
          animation: floatOrb 10s ease-in-out infinite alternate;
          will-change: transform;
        }
        .smooth-bar-transition {
          transition: height 1.2s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      {/* 1. HERO BANNER */}
      <div 
        className="animate-smooth-card bg-gradient-to-br from-[#681419] via-[#7A1B22] to-[#3a0b0f] dark:from-[#0d121f] dark:via-[#1e0e15] dark:to-[#0a0d16] rounded-3xl p-6 sm:p-8 mb-8 text-white shadow-xl dark:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.85)] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-[#D4AF37]/30 transition-colors duration-300"
        style={{ animationDelay: '0.05s' }}
      >
        <div className="relative z-10 text-center md:text-left min-w-0">
          <div className="inline-flex items-center gap-1.5 bg-white/10 dark:bg-white/5 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-widest text-[#D4AF37] uppercase mb-2.5 border border-white/15 dark:border-white/10 shadow-sm">
            <GreetingIcon size={13} className={greeting.badgeColor} />
            <span>{greeting.tag}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">
            {greeting.text}, {loggedInAdminName}!
          </h1>
          <p className="text-white/80 dark:text-slate-300 font-medium text-xs sm:text-sm max-w-xl leading-relaxed">
            {getGreetingSubtext()}
          </p>
        </div>

        {/* Right Side: Interactive Action Badge & Compact Date (Replacing bulky clock) */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
          {isLoading ? (
            <div className="h-10 w-36 rounded-2xl bg-white/10 dark:bg-white/5 animate-pulse border border-white/10" />
          ) : stats.pending > 0 ? (
            <button
              onClick={() => navigate('/franchise-approval')}
              className="group flex items-center gap-3 bg-white/15 hover:bg-white/25 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 border border-white/20 dark:border-amber-400/30 px-4 py-2.5 rounded-2xl transition-all shadow-sm cursor-pointer active:scale-95 text-left"
              title="Open Approvals Queue"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-400/25 border border-amber-400/40 text-[#D4AF37] flex items-center justify-center shrink-0">
                <Clock size={16} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Needs Action</p>
                <p className="text-xs font-black text-white">{stats.pending} Pending Review</p>
              </div>
              <ArrowRight size={15} className="text-[#D4AF37] group-hover:translate-x-1 transition-transform ml-0.5" />
            </button>
          ) : (
            <div className="flex items-center gap-2.5 bg-white/10 dark:bg-emerald-950/40 border border-white/15 dark:border-emerald-800/50 px-4 py-2.5 rounded-2xl text-xs font-bold text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Queues Cleared</span>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-2 bg-white/10 dark:bg-white/5 border border-white/15 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-white/90">
            <GreetingIcon size={14} className={greeting.badgeColor} />
            <span>{currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      {isLoading ? (
        <div className="mb-8">
          <StatsCardsSkeleton count={4} baseDelay={60} stepDelay={70} />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {[
            { label: 'Total Franchises', count: stats.total, sub: 'Registered units', icon: <Users size={22} />, color: 'from-[#7A1B22] to-[#5A1419]', iconBg: 'bg-[#7A1B22]/10 dark:bg-[#7A1B22]/30 text-[#7A1B22] dark:text-[#D4AF37]' },
            { label: 'Active Franchises', count: stats.active, sub: `${getPercentage(stats.active)}% operational`, icon: <ShieldCheck size={22} />, color: 'from-emerald-500 to-teal-600', iconBg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' },
            { label: 'Pending Approval', count: stats.pending, sub: 'Requires action', icon: <Clock size={22} />, color: 'from-[#D4AF37] to-[#B89628]', iconBg: 'bg-amber-50 dark:bg-amber-950/50 text-[#D4AF37] dark:text-[#D4AF37]' },
            { label: 'Expired Units', count: stats.expired, sub: 'Renewal overdue', icon: <AlertTriangle size={22} />, color: 'from-rose-400 to-red-500', iconBg: 'bg-red-50 dark:bg-red-950/50 text-red-500 dark:text-red-400' }
          ].map((stat, index) => (
            <div 
              key={index} 
              className="animate-smooth-card bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
              style={{ animationDelay: `${0.06 + (index * 0.06)}s` }}
            >
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color}`} />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">{stat.count}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{stat.sub}</p>
                </div>
                <div className={`p-2.5 sm:p-3 rounded-2xl ${stat.iconBg} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. SMOOTH ANALYTICS GRAPH */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* SKELETON: FRANCHISE HEALTH OVERVIEW (Matches horizontal stacked bar + 4 status cards) */}
          <div 
            className="stagger-reveal lg:col-span-2 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800" 
            style={{ animationDelay: '200ms' }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <SkeletonElement rounded="rounded-xl" className="w-9 h-9" delay={210} />
                <div>
                  <SkeletonElement height="16px" className="w-48 mb-1.5" rounded="rounded-md" delay={220} />
                  <SkeletonElement height="11px" className="w-64" rounded="rounded-sm" delay={230} />
                </div>
              </div>
              <SkeletonElement height="24px" className="w-20" rounded="rounded-full" delay={240} />
            </div>

            {/* Horizontal Stacked Bar Placeholder */}
            <div className="mb-6">
              <SkeletonElement height="20px" className="w-full" rounded="rounded-full" delay={250} />
            </div>

            {/* Status Breakdown Grid (4 cards matching Active, Pending, Expired, Cancelled) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i} 
                  className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <SkeletonElement rounded="rounded-full" className="w-2.5 h-2.5 shrink-0" delay={260 + i * 20} />
                    <SkeletonElement height="10px" className="w-14" rounded="rounded-sm" delay={270 + i * 20} />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <SkeletonElement height="22px" className="w-10" rounded="rounded-md" delay={280 + i * 20} />
                    <SkeletonElement height="11px" className="w-7" rounded="rounded-sm" delay={290 + i * 20} />
                  </div>
                  <SkeletonElement height="9px" className="w-16" rounded="rounded-sm" delay={300 + i * 20} />
                </div>
              ))}
            </div>
          </div>

          {/* SKELETON: QUICK INSIGHTS (Matches 4 insights cards) */}
          <div 
            className="stagger-reveal bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col" 
            style={{ animationDelay: '280ms' }}
          >
            <div className="flex items-center gap-2.5 mb-5">
              <SkeletonElement rounded="rounded-xl" className="w-9 h-9" delay={290} />
              <SkeletonElement height="16px" className="w-32" rounded="rounded-md" delay={300} />
            </div>

            <div className="space-y-3 flex-1">
              {/* Compliance Rate Card */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100/60 dark:border-emerald-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <SkeletonElement height="11px" className="w-24" rounded="rounded-sm" delay={310} />
                  <SkeletonElement height="18px" className="w-10" rounded="rounded-md" delay={320} />
                </div>
                <SkeletonElement height="6px" className="w-full" rounded="rounded-full" delay={330} />
                <SkeletonElement height="9px" className="w-40" rounded="rounded-sm" delay={340} />
              </div>

              {/* New Applications Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <SkeletonElement height="11px" className="w-24 mb-1.5" rounded="rounded-sm" delay={350} />
                  <SkeletonElement height="9px" className="w-32" rounded="rounded-sm" delay={360} />
                </div>
                <SkeletonElement height="22px" className="w-8" rounded="rounded-md" delay={370} />
              </div>

              {/* Approval Queue Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <SkeletonElement height="11px" className="w-24 mb-1.5" rounded="rounded-sm" delay={380} />
                  <SkeletonElement height="9px" className="w-28" rounded="rounded-sm" delay={390} />
                </div>
                <SkeletonElement height="22px" className="w-8" rounded="rounded-md" delay={400} />
              </div>

              {/* Last Activity Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <SkeletonElement height="11px" className="w-28 mb-1.5" rounded="rounded-sm" delay={410} />
                  <SkeletonElement height="9px" className="w-36" rounded="rounded-sm" delay={420} />
                </div>
                <SkeletonElement height="14px" className="w-14" rounded="rounded-md" delay={430} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* FRANCHISE HEALTH OVERVIEW — Horizontal stacked bar + status breakdown */}
          <div 
            className="animate-smooth-card lg:col-span-2 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#7A1B22]/10 dark:bg-[#7A1B22]/30 text-[#7A1B22] dark:text-[#D4AF37] rounded-xl">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Franchise Health Overview</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status distribution across all registered units</p>
                </div>
              </div>
              <span className="text-xs font-bold bg-[#7A1B22]/10 dark:bg-[#7A1B22]/30 text-[#7A1B22] dark:text-[#D4AF37] px-3 py-1 rounded-full uppercase tracking-wider border border-[#7A1B22]/20">
                {stats.total} Units
              </span>
            </div>

            {/* Horizontal Stacked Bar */}
            <div className="mb-6">
              <div className="w-full h-5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
                {[
                  { count: stats.active, color: 'bg-emerald-500' },
                  { count: stats.pending, color: 'bg-[#D4AF37]' },
                  { count: stats.expired, color: 'bg-rose-400' },
                  { count: stats.cancelled, color: 'bg-slate-400' }
                ].map((seg, i) => (
                  <div 
                    key={i}
                    className={`${seg.color} h-full transition-all duration-1000 ease-out first:rounded-l-full last:rounded-r-full`}
                    style={{ 
                      width: isGraphAnimated ? `${getPercentage(seg.count)}%` : '0%',
                      transitionDelay: `${i * 120}ms`
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Status Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Active', count: stats.active, dotColor: 'bg-emerald-500', pct: getPercentage(stats.active), desc: 'Operational' },
                { label: 'Pending', count: stats.pending, dotColor: 'bg-[#D4AF37]', pct: getPercentage(stats.pending), desc: 'Awaiting review' },
                { label: 'Expired', count: stats.expired, dotColor: 'bg-rose-400', pct: getPercentage(stats.expired), desc: 'Renewal overdue' },
                { label: 'Cancelled', count: stats.cancelled, dotColor: 'bg-slate-400', pct: getPercentage(stats.cancelled), desc: 'Revoked/Cancelled' }
              ].map((item, i) => (
                <div 
                  key={i} 
                  className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.dotColor} shrink-0 shadow-xs group-hover:scale-125 transition-transform`} />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{item.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-slate-900 dark:text-white">{item.count}</span>
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{item.pct}%</span>
                  </div>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* QUICK INSIGHTS — Transport-contextual snapshot */}
          <div 
            className="animate-smooth-card bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col"
            style={{ animationDelay: '0.28s' }}
          >
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2 bg-[#D4AF37]/15 dark:bg-[#D4AF37]/20 text-[#D4AF37] rounded-xl">
                <Sparkles size={18} />
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Quick Insights</h2>
            </div>

            <div className="space-y-3 flex-1">
              {/* Compliance Health */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Compliance Rate</span>
                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">{getPercentage(stats.active)}%</span>
                </div>
                <div className="w-full bg-emerald-200/50 dark:bg-emerald-900/50 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: isGraphAnimated ? `${getPercentage(stats.active)}%` : '0%', transitionDelay: '200ms' }}
                  />
                </div>
                <p className="text-[9px] text-emerald-600/80 dark:text-emerald-400/70 font-medium mt-1.5">{stats.active} of {stats.total} franchises are active and compliant</p>
              </div>

              {/* New Applications */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">New Applications</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">First-time franchise filings</p>
                </div>
                <span className="text-xl font-black text-slate-900 dark:text-white">{stats.newApps}</span>
              </div>

              {/* Pending Queue Urgency */}
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                stats.pending > 0 
                  ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40'
                  : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
              }`}>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider ${stats.pending > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    Approval Queue
                  </p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                    {stats.pending > 0 ? 'Action needed from BPLO' : 'All queues cleared'}
                  </p>
                </div>
                <span className={`text-xl font-black ${stats.pending > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>{stats.pending}</span>
              </div>

              {/* Last Activity */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last System Activity</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">Most recent franchise update</p>
                </div>
                <span className="text-xs font-bold text-[#7A1B22] dark:text-[#D4AF37]">
                  {historyLogs.length > 0 ? getRelativeTime(historyLogs[0]?.updatedAt) : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TODA DISTRIBUTION DONUT CHART */}
      {isLoading ? (
        <div 
          className="stagger-reveal bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 mb-8"
          style={{ animationDelay: '320ms' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <SkeletonElement rounded="rounded-xl" className="w-9 h-9" delay={330} />
              <div>
                <SkeletonElement height="16px" className="w-48 sm:w-60 mb-1.5" rounded="rounded-md" delay={340} />
                <SkeletonElement height="11px" className="w-64 sm:w-80" rounded="rounded-sm" delay={350} />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <SkeletonElement height="30px" className="w-36" rounded="rounded-xl" delay={360} />
              <SkeletonElement height="30px" className="w-24" rounded="rounded-xl" delay={370} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
            {/* Donut Chart Skeleton */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
              <div className="w-64 h-64 relative flex items-center justify-center">
                <div className="w-48 h-48 rounded-full border-[18px] border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center">
                  <SkeletonElement height="10px" className="w-16 mb-1" rounded="rounded-sm" delay={380} />
                  <SkeletonElement height="28px" className="w-12 mb-1" rounded="rounded-md" delay={390} />
                  <SkeletonElement height="10px" className="w-20" rounded="rounded-sm" delay={400} />
                </div>
              </div>
            </div>

            {/* Top TODAs Legend Grid Skeleton */}
            <div className="lg:col-span-7 space-y-2.5 max-h-72 overflow-hidden pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div 
                    key={i} 
                    className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <SkeletonElement rounded="rounded-full" className="w-2.5 h-2.5 shrink-0" delay={400 + i * 20} />
                        <SkeletonElement height="12px" className="w-24" rounded="rounded-sm" delay={410 + i * 20} />
                      </div>
                      <SkeletonElement height="12px" className="w-12" rounded="rounded-sm" delay={420 + i * 20} />
                    </div>
                    <SkeletonElement height="6px" className="w-full" rounded="rounded-full" delay={430 + i * 20} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : todaStats.length > 0 ? (
        <div 
          className="animate-smooth-card bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 mb-8"
          style={{ animationDelay: '0.32s' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#7A1B22]/10 dark:bg-[#7A1B22]/30 text-[#7A1B22] dark:text-[#D4AF37] rounded-xl">
                <PieChartIcon size={18} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                  TODA Unit Distribution &amp; Share
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Breakdown of active tricycle units per transport association across Gasan
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl border border-slate-200/70 dark:border-slate-700">
                {todaStats.length} Transport Associations
              </span>
              <span className="text-xs sm:text-xs font-black bg-[#7A1B22]/10 text-[#7A1B22] dark:text-[#D4AF37] px-3 py-1.5 rounded-xl border border-[#7A1B22]/20">
                {stats.total} Total Units
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
            {/* Donut Chart with Center Metric */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
              <div className="w-full h-64 relative flex items-center justify-center">
                {/* Center Badge in Donut Hole - Placed behind chart layer with smooth hover fade */}
                <div 
                  className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 transition-all duration-200 ${
                    hoveredTodaIndex !== null ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  }`}
                >
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Unit Share
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    {stats.total}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    100% Tracked
                  </span>
                </div>

                <div className="w-full h-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={todaStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={68}
                        outerRadius={96}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={2}
                        stroke="transparent"
                        onMouseEnter={(_, index) => setHoveredTodaIndex(index)}
                        onMouseLeave={() => setHoveredTodaIndex(null)}
                      >
                        {todaStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={<CustomTodaTooltip />} 
                        wrapperStyle={{ zIndex: 50, pointerEvents: 'none' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top TODAs Legend with Percentage Bars */}
            <div className="lg:col-span-7 space-y-2.5 max-h-72 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {todaStats.map((toda, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" 
                          style={{ backgroundColor: toda.color }} 
                        />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={toda.name}>
                          {toda.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {toda.value}
                        </span>
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                          ({toda.percentage}%)
                        </span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-slate-200/80 dark:bg-slate-700/80 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-700 ease-out" 
                        style={{ 
                          width: isGraphAnimated ? `${toda.percentage}%` : '0%', 
                          transitionDelay: `${200 + idx * 50}ms`,
                          backgroundColor: toda.color 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* 5. ACTIVITY LOGS & PENDING QUEUE */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ACTIVITY HISTORY SKELETON */}
          <div className="stagger-reveal bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800" style={{ animationDelay: '460ms' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <SkeletonElement rounded="rounded-lg" className="w-6 h-6" delay={470} />
                <SkeletonElement height="16px" className="w-44" rounded="rounded-md" delay={480} />
              </div>
              <SkeletonElement height="14px" className="w-16" rounded="rounded-md" delay={490} />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-3 bg-slate-50/70 dark:bg-slate-800/70 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <SkeletonElement rounded="rounded-xl" className="w-8 h-8 shrink-0" delay={495 + i * 25} />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <SkeletonElement height="12px" className="w-3/4" rounded="rounded-md" delay={500 + i * 25} />
                      <SkeletonElement height="10px" className="w-1/3" rounded="rounded-sm" delay={510 + i * 25} />
                    </div>
                  </div>
                  <SkeletonElement height="18px" className="w-14 shrink-0" rounded="rounded-md" delay={520 + i * 25} />
                </div>
              ))}
            </div>
          </div>

          {/* PENDING APPROVAL QUEUE SKELETON */}
          <div className="stagger-reveal bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800" style={{ animationDelay: '520ms' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <SkeletonElement rounded="rounded-lg" className="w-6 h-6" delay={530} />
                <SkeletonElement height="16px" className="w-48" rounded="rounded-md" delay={540} />
              </div>
              <SkeletonElement height="18px" className="w-14" rounded="rounded-full" delay={545} />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <div className="flex flex-col items-center shrink-0 gap-1">
                    <SkeletonElement rounded="rounded-full" className="w-2 h-2" delay={540 + i * 25} />
                    <SkeletonElement height="8px" className="w-4" rounded="rounded-xs" delay={545 + i * 25} />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <SkeletonElement height="13px" className="w-1/2" rounded="rounded-md" delay={550 + i * 25} />
                    <SkeletonElement height="10px" className="w-1/3" rounded="rounded-sm" delay={560 + i * 25} />
                  </div>
                  <SkeletonElement height="32px" className="w-20 shrink-0" rounded="rounded-xl" delay={570 + i * 25} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ACTIVITY HISTORY — Upgraded with icons, relative time, bold names */}
          <div 
            className="animate-smooth-card bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800"
            style={{ animationDelay: '0.34s' }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <History size={18} className="text-[#7A1B22] dark:text-[#D4AF37]" />
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">System Activity History</h2>
              </div>
              <button onClick={() => navigate('/franchise-masterlist')} className="text-xs font-bold text-[#7A1B22] dark:text-[#D4AF37] hover:underline flex items-center gap-1">
                Masterlist <ArrowRight size={12} />
              </button>
            </div>

            <div className="space-y-2.5">
              {historyLogs.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-8">No recent system actions logged.</p>
              ) : (
                historyLogs.map((log) => {
                  const actionData = getActionDetails(log);
                  const ActionIcon = actionData.icon;
                  return (
                    <div key={log._id} className="group p-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 rounded-2xl flex items-start gap-3 transition-all duration-200 border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                      {/* Action Icon + Colored Dot */}
                      <div className="relative shrink-0 mt-0.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${actionData.color} border`}>
                          <ActionIcon size={14} />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                          {actionData.verb} <span className="font-black text-slate-900 dark:text-white">{actionData.name}</span>
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                          {getRelativeTime(log.updatedAt)}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-2 py-0.5 text-[9px] uppercase font-bold rounded-md border shrink-0 mt-0.5 ${actionData.badgeColor}`}>
                        {log.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* PENDING APPROVAL QUEUE — Upgraded with urgency indicators */}
          <div 
            className="animate-smooth-card bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800"
            style={{ animationDelay: '0.4s' }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <FileStack size={18} className="text-[#D4AF37]" />
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">Pending Approvals Queue</h2>
              </div>
              {stats.pending > 0 && (
                <span className="bg-[#7A1B22] text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                  {stats.pending} New
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {recentApps.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center">
                  <CheckCircle size={28} className="text-emerald-500 mb-1" />
                  All caught up! No pending applications.
                </div>
              ) : (
                recentApps.map((app) => {
                  const daysPending = getDaysPending(app.dateApplied || app.createdAt);
                  const urgencyColor = daysPending >= 7 ? 'text-red-500' : daysPending >= 3 ? 'text-amber-500' : 'text-emerald-500';
                  const urgencyDot = daysPending >= 7 ? 'bg-red-500' : daysPending >= 3 ? 'bg-amber-400' : 'bg-emerald-500';
                  return (
                    <div key={app._id} className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 transition-all duration-200">
                      {/* Urgency Indicator */}
                      <div className="flex flex-col items-center shrink-0 gap-0.5">
                        <span className={`w-2 h-2 rounded-full ${urgencyDot} shadow-xs`} />
                        <span className={`text-[8px] font-bold ${urgencyColor}`}>
                          {daysPending > 0 ? `${daysPending}d` : 'New'}
                        </span>
                      </div>

                      {/* Applicant Info */}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-900 dark:text-white truncate">{app.fullName || 'Applicant'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{app.todaName} • {app.make || 'Tricycle'}</p>
                      </div>

                      {/* Review CTA */}
                      <button 
                        onClick={() => navigate('/franchise-approval')}
                        className="px-4 py-2 bg-[#7A1B22] hover:bg-[#5A1419] text-white text-xs font-bold rounded-xl transition-all shrink-0 active:scale-95 shadow-sm flex items-center gap-1.5"
                      >
                        <ArrowRight size={13} />
                        Review
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

    </MainLayout>
  );
};

export default AdminDashboard;
