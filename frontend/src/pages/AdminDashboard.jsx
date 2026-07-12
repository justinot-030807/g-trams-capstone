import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { Users, FileStack, Clock, ShieldCheck, AlertTriangle, PieChart, BarChart3, History, CheckCircle, ArrowRight } from 'lucide-react';
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

        // Kukunin ang pinakabagong update sa database at gagawing "Action History"
        const sortedHistory = [...data].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 6);
        setHistoryLogs(sortedHistory);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  };

  const getPercentage = (count) => stats.total === 0 ? 0 : Math.round((count / stats.total) * 100);

  const getGraphHeight = (count) => {
    const maxCount = Math.max(stats.active, stats.pending, stats.expired, stats.cancelled, 1);
    return `${(count / maxCount) * 100}%`;
  };

  // SMART ACTION TRANSLATOR: Ginagawang action log ang status ng franchise
  const getActionDetails = (log) => {
    const name = log.fullName || log.operator?.name || 'an Operator';
    
    if (log.isArchived) return { text: `Archived the record of ${name}`, color: 'text-slate-600 bg-slate-100 border-slate-200' };
    if (log.status === 'Active' && log.applicationType === 'Renewal') return { text: `Approved franchise renewal for ${name}`, color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (log.status === 'Active') return { text: `Approved new franchise of ${name}`, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (log.status === 'Cancelled') return { text: `Rejected/Cancelled application of ${name}`, color: 'text-red-700 bg-red-50 border-red-200' };
    if (log.status === 'Expired') return { text: `System flagged franchise as expired for ${name}`, color: 'text-orange-700 bg-orange-50 border-orange-200' };
    
    return { text: `Updated pending application for ${name}`, color: 'text-amber-700 bg-amber-50 border-amber-200' };
  };

  return (
    <MainLayout>
      {/* CUSTOM CSS ANIMATION */}
      <style>{`
        @keyframes slideFadeUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-fade-up {
          opacity: 0;
          animation: slideFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* 1. PREMIUM MAROON ADMIN BANNER */}
      <div 
        className="animate-slide-fade-up bg-gradient-to-r from-[#7A1B22] to-[#9B2A33] rounded-3xl p-6 md:p-8 mb-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border-l-8 border-[#D4AF37]"
        style={{ animationDelay: '0.1s' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="relative z-10 text-center md:text-left w-full md:w-auto">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1">
            Admin Overview, {loggedInAdminName}
          </h1>
          <p className="text-white/80 font-medium text-sm">Real-time system analytics and franchise monitoring.</p>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-4 rounded-2xl w-full md:w-auto text-center md:text-right shadow-sm">
          <p className="font-bold text-lg tracking-wide text-white">
            {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <p className="text-sm font-medium text-white/80 flex items-center justify-center md:justify-end gap-1.5 mt-1">
            <Clock size={16} />
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* 2. TOP STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Franchises', count: stats.total, color: 'bg-blue-500', icon: <Users size={24} />, bg: 'bg-blue-50', text: 'text-blue-600' },
          { label: 'Active Franchises', count: stats.active, color: 'bg-emerald-500', icon: <ShieldCheck size={24} />, bg: 'bg-emerald-50', text: 'text-emerald-600' },
          { label: 'Pending Approval', count: stats.pending, color: 'bg-amber-500', icon: <Clock size={24} />, bg: 'bg-amber-50', text: 'text-amber-600' },
          { label: 'Expired Units', count: stats.expired, color: 'bg-red-500', icon: <AlertTriangle size={24} />, bg: 'bg-red-50', text: 'text-red-600' }
        ].map((stat, index) => (
          <div 
            key={index} 
            className="animate-slide-fade-up bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all"
            style={{ animationDelay: `${0.2 + (index * 0.1)}s` }}
          >
            <div className={`absolute top-0 left-0 w-full h-1 ${stat.color}`}></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
                <p className="text-4xl font-black text-slate-900">{stat.count}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.text} group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. MIDDLE SECTION: GRAPH & PROGRESS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* VERTICAL BAR GRAPH */}
        <div 
          className="animate-slide-fade-up lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200"
          style={{ animationDelay: '0.5s' }}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <BarChart3 size={20} />
              </div>
              <h2 className="text-base font-bold text-slate-900">Franchise Status Overview</h2>
            </div>
            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full uppercase tracking-wider">Total: {stats.total} Units</span>
          </div>

          <div className="h-48 flex items-end gap-4 sm:gap-8 justify-around px-4 border-b border-slate-100 pb-2 relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-t border-slate-400 w-full"></div>
              <div className="border-t border-slate-400 w-full"></div>
              <div className="border-t border-slate-400 w-full"></div>
            </div>

            {[
              { label: 'Active', count: stats.active, color: 'bg-emerald-500', hover: 'hover:bg-emerald-600' },
              { label: 'Pending', count: stats.pending, color: 'bg-amber-400', hover: 'hover:bg-amber-500' },
              { label: 'Expired', count: stats.expired, color: 'bg-red-500', hover: 'hover:bg-red-600' },
              { label: 'Cancelled', count: stats.cancelled, color: 'bg-slate-500', hover: 'hover:bg-slate-600' }
            ].map((bar, i) => (
              <div key={i} className="flex flex-col items-center w-16 sm:w-20 group relative z-10">
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded transition-opacity">
                  {bar.count}
                </div>
                <div 
                  className={`w-full rounded-t-md transition-all duration-1000 ease-out ${bar.color} ${bar.hover} cursor-pointer shadow-sm`} 
                  style={{ height: getGraphHeight(bar.count) || '5%' }}
                ></div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase mt-3">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* HORIZONTAL PROGRESS BARS */}
        <div 
          className="animate-slide-fade-up bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200"
          style={{ animationDelay: '0.6s' }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <PieChart size={20} />
            </div>
            <h2 className="text-base font-bold text-slate-900">Analytics Ratio</h2>
          </div>

          <div className="space-y-6">
            {[
              { label: 'Active', count: stats.active, color: 'bg-emerald-500' },
              { label: 'Pending', count: stats.pending, color: 'bg-amber-500' },
              { label: 'Expired', count: stats.expired, color: 'bg-red-500' },
              { label: 'Cancelled', count: stats.cancelled, color: 'bg-slate-400' }
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`}></span>
                    {item.label}
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {item.count} <span className="text-slate-400 font-medium">({getPercentage(item.count)}%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className={`${item.color} h-full rounded-full transition-all duration-1000 ease-out`} style={{ width: `${getPercentage(item.count)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. BOTTOM SECTION: HISTORY ACTION LOG & PENDING TASKS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ACTION HISTORY LOG */}
        <div 
          className="animate-slide-fade-up bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200"
          style={{ animationDelay: '0.7s' }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                <History size={20} />
              </div>
              <h2 className="text-base font-bold text-slate-900">System Action History</h2>
            </div>
            <button onClick={() => navigate('/franchise-masterlist')} className="text-xs font-bold text-[#7A1B22] hover:underline flex items-center gap-1">
              View Masterlist <ArrowRight size={12} />
            </button>
          </div>
          
          <div className="space-y-4">
            {historyLogs.length === 0 ? (
              <p className="text-sm text-slate-500 font-medium pb-4 text-center mt-10">No recent system activity.</p>
            ) : (
              historyLogs.map((log) => {
                const actionData = getActionDetails(log);
                return (
                  <div key={log._id} className="flex items-start gap-3 pb-4 border-b border-slate-50 last:border-0 last:pb-0 hover:bg-slate-50 p-2 rounded-lg transition-colors">
                    <div className="w-2 h-2 mt-2 rounded-full bg-slate-300 shrink-0"></div>
                    <div className="flex-1">
                      {/* ACTION TEXT */}
                      <p className="text-sm text-slate-700 leading-tight">
                        <span className="font-bold text-slate-900 mr-1">
                          {actionData.text.split(' for ')[0].split(' of ')[0]}
                        </span>
                        {actionData.text.includes('for') ? 'for ' : actionData.text.includes('of') ? 'of ' : ''}
                        <span className="font-bold text-[#7A1B22]">
                          {log.fullName || log.operator?.name || 'an Operator'}
                        </span>
                      </p>
                      
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {new Date(log.updatedAt).toLocaleDateString()} at {new Date(log.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        <span className={`px-2 py-0.5 text-[9px] uppercase font-bold rounded-full tracking-wider border ${actionData.color}`}>
                          {log.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* PENDING APPLICATIONS */}
        <div 
          className="animate-slide-fade-up bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200"
          style={{ animationDelay: '0.8s' }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <FileStack size={20} />
              </div>
              <h2 className="text-base font-bold text-slate-900">Pending Approvals</h2>
            </div>
            {stats.pending > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                {stats.pending} New
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            {recentApps.length === 0 ? (
              <p className="text-sm text-slate-500 font-medium pb-4 text-center mt-10 flex flex-col items-center">
                <CheckCircle size={32} className="text-emerald-400 mb-2" />
                All caught up! No pending applications.
              </p>
            ) : (
              recentApps.map((app) => (
                <div key={app._id} className="flex justify-between items-center pb-4 border-b border-slate-100 last:border-0 last:pb-0 group">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{app.fullName || app.operator?.name || 'Applicant'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">TODA: <span className="font-semibold text-slate-700">{app.todaName}</span></p>
                  </div>
                  <button 
                    onClick={() => navigate('/franchise-approval')}
                    className="px-4 py-1.5 bg-slate-100 hover:bg-[#7A1B22] hover:text-white text-slate-600 text-xs font-bold rounded-lg transition-colors border border-slate-200"
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