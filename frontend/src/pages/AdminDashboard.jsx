import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { 
  Users, FileStack, Clock, ShieldCheck, AlertTriangle, 
  BarChart3, History, CheckCircle, ArrowRight, TrendingUp, Sparkles 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ 
    total: 0, active: 0, pending: 0, expired: 0, cancelled: 0, newApps: 0 
  });
  const [recentApps, setRecentApps] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const navigate = useNavigate();
  const loggedInAdminName = localStorage.getItem('name') || 'Administrator';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    fetchDashboardData();
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/franchises', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        const activeCount = data.filter(f => f.status === 'Active').length;
        const pendingCount = data.filter(f => f.status === 'Pending').length;
        const expiredCount = data.filter(f => f.status === 'Expired').length;
        const cancelledCount = data.filter(f => f.status === 'Cancelled').length;
        const newAppsCount = data.filter(f => f.applicationType === 'New').length;
        
        setStats({ 
          total: data.length,
          active: activeCount, 
          pending: pendingCount, 
          expired: expiredCount,
          cancelled: cancelledCount,
          newApps: newAppsCount 
        });
        
        const pendingList = data.filter(f => f.status === 'Pending').slice(0, 5);
        setRecentApps(pendingList);

        const sortedHistory = [...data].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 6);
        setHistoryLogs(sortedHistory);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
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
    if (log.isArchived) return { text: `Archived record of ${name}`, color: 'text-slate-600 bg-slate-100 border-slate-200' };
    if (log.status === 'Active' && log.applicationType === 'Renewal') return { text: `Approved renewal for ${name}`, color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (log.status === 'Active') return { text: `Approved franchise of ${name}`, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (log.status === 'Cancelled') return { text: `Rejected application of ${name}`, color: 'text-red-700 bg-red-50 border-red-200' };
    if (log.status === 'Expired') return { text: `Flagged as expired for ${name}`, color: 'text-orange-700 bg-orange-50 border-orange-200' };
    return { text: `Updated pending record of ${name}`, color: 'text-amber-700 bg-amber-50 border-amber-200' };
  };

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
        className="animate-smooth-card bg-gradient-to-r from-[#7A1B22] via-[#8C2028] to-[#551016] rounded-3xl p-6 sm:p-8 mb-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border-l-8 border-[#D4AF37]"
        style={{ animationDelay: '0.05s' }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none animate-banner-orb" />

        <div className="relative z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase mb-2 border border-white/10 shadow-sm">
            <Sparkles size={12} /> Executive Overview
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">
            Admin Overview, {loggedInAdminName}
          </h1>
          <p className="text-white/80 font-medium text-xs sm:text-sm">Real-time system analytics and franchise monitoring.</p>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3.5 rounded-2xl text-center md:text-right shadow-sm shrink-0">
          <p className="font-black text-sm sm:text-base tracking-wide text-white">
            {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <p className="text-xs font-semibold text-white/80 flex items-center justify-center md:justify-end gap-1.5 mt-0.5">
            <Clock size={14} className="text-[#D4AF37]" />
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {[
          { label: 'Total Franchises', count: stats.total, sub: 'Registered fleet', icon: <Users size={22} />, color: 'from-blue-600 to-indigo-600', iconBg: 'bg-blue-50 text-blue-600' },
          { label: 'Active Franchises', count: stats.active, sub: `${getPercentage(stats.active)}% operational`, icon: <ShieldCheck size={22} />, color: 'from-emerald-500 to-teal-600', iconBg: 'bg-emerald-50 text-emerald-600' },
          { label: 'Pending Approval', count: stats.pending, sub: 'Requires action', icon: <Clock size={22} />, color: 'from-amber-500 to-orange-500', iconBg: 'bg-amber-50 text-amber-600' },
          { label: 'Expired Units', count: stats.expired, sub: 'Renewal overdue', icon: <AlertTriangle size={22} />, color: 'from-red-500 to-rose-600', iconBg: 'bg-red-50 text-red-600' }
        ].map((stat, index) => (
          <div 
            key={index} 
            className="animate-smooth-card bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200/80 hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
            style={{ animationDelay: `${0.1 + (index * 0.08)}s` }}
          >
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color}`} />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{stat.count}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{stat.sub}</p>
              </div>
              <div className={`p-2.5 sm:p-3 rounded-2xl ${stat.iconBg} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. SMOOTH ANALYTICS GRAPH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* BAR CHART */}
        <div 
          className="animate-smooth-card lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col justify-between"
          style={{ animationDelay: '0.45s' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#7A1B22]/10 text-[#7A1B22] rounded-xl">
                <BarChart3 size={18} />
              </div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">Franchise Distribution</h2>
            </div>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full uppercase tracking-wider">
              {stats.total} Total Units
            </span>
          </div>

          <div className="h-56 w-full flex items-end justify-around gap-2 sm:gap-6 border-b border-slate-100 pt-6 pb-2">
            {[
              { label: 'Active', count: stats.active, gradient: 'from-emerald-500 to-teal-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { label: 'Pending', count: stats.pending, gradient: 'from-amber-400 to-orange-400', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
              { label: 'Expired', count: stats.expired, gradient: 'from-red-500 to-rose-500', badge: 'bg-red-50 text-red-700 border-red-200' },
              { label: 'Cancelled', count: stats.cancelled, gradient: 'from-slate-400 to-slate-500', badge: 'bg-slate-50 text-slate-700 border-slate-200' }
            ].map((bar, i) => (
              <div key={i} className="flex flex-col items-center h-full justify-end w-16 sm:w-24 group relative">
                
                <span className={`text-[11px] font-black px-2 py-0.5 rounded-md border shadow-xs mb-2 transition-transform duration-300 group-hover:scale-110 ${bar.badge}`}>
                  {bar.count}
                </span>
                
                <div className="w-full bg-slate-100/80 rounded-2xl h-36 flex items-end p-1 shadow-inner overflow-hidden">
                  <div 
                    className={`w-full rounded-xl bg-gradient-to-t ${bar.gradient} shadow-md smooth-bar-transition group-hover:brightness-110 group-hover:scale-[1.02]`} 
                    style={{ height: getGraphHeight(bar.count) }}
                  />
                </div>

                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-2.5">
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* PROGRESS METRICS */}
        <div 
          className="animate-smooth-card bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80"
          style={{ animationDelay: '0.55s' }}
        >
          <div className="flex items-center gap-2.5 mb-6">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp size={18} />
            </div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">Ratio Breakdown</h2>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Active Compliance', count: stats.active, color: 'bg-emerald-500' },
              { label: 'Pending Queue', count: stats.pending, color: 'bg-amber-400' },
              { label: 'Expired Units', count: stats.expired, color: 'bg-red-500' },
              { label: 'Cancelled', count: stats.cancelled, color: 'bg-slate-400' }
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${item.color}`} />
                    {item.label}
                  </span>
                  <span className="text-slate-900">{getPercentage(item.count)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className={`${item.color} h-full rounded-full transition-all duration-1200 ease-out`} style={{ width: `${getPercentage(item.count)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. ACTIVITY LOGS & PENDING QUEUE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LOGS */}
        <div 
          className="animate-smooth-card bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80"
          style={{ animationDelay: '0.65s' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <History size={18} className="text-[#7A1B22]" />
              <h2 className="text-sm sm:text-base font-black text-slate-900">System Activity History</h2>
            </div>
            <button onClick={() => navigate('/franchise-masterlist')} className="text-xs font-bold text-[#7A1B22] hover:underline flex items-center gap-1">
              Masterlist <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-3">
            {historyLogs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No recent system actions logged.</p>
            ) : (
              historyLogs.map((log) => {
                const actionData = getActionDetails(log);
                return (
                  <div key={log._id} className="p-3 bg-slate-50/70 hover:bg-slate-100/80 rounded-2xl flex items-center justify-between gap-3 transition-all duration-200">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">{actionData.text}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                        {new Date(log.updatedAt).toLocaleDateString()} at {new Date(log.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] uppercase font-bold rounded-md border shrink-0 ${actionData.color}`}>
                      {log.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PENDING APPROVAL LIST */}
        <div 
          className="animate-smooth-card bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80"
          style={{ animationDelay: '0.75s' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <FileStack size={18} className="text-amber-500" />
              <h2 className="text-sm sm:text-base font-black text-slate-900">Pending Approvals Queue</h2>
            </div>
            {stats.pending > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                {stats.pending} New
              </span>
            )}
          </div>

          <div className="space-y-3">
            {recentApps.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs flex flex-col items-center">
                <CheckCircle size={28} className="text-emerald-500 mb-1" />
                All caught up! No pending applications.
              </div>
            ) : (
              recentApps.map((app) => (
                <div key={app._id} className="p-3 bg-amber-50/40 hover:bg-amber-50/80 rounded-2xl border border-amber-100 flex items-center justify-between gap-3 transition-all duration-200">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 truncate">{app.fullName || 'Applicant'}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{app.todaName} • {app.make || 'Tricycle'}</p>
                  </div>
                  <button 
                    onClick={() => navigate('/franchise-approval')}
                    className="px-3.5 py-1.5 bg-[#7A1B22] text-white text-xs font-bold rounded-xl hover:bg-[#5A1419] transition-all shrink-0 active:scale-95 shadow-sm"
                  >
                    Review
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </MainLayout>
  );
};

export default AdminDashboard;