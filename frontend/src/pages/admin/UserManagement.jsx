import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout';
import { 
  Users, Search, Info, MapPin, Phone, Calendar, ShieldCheck, X, 
  AlertTriangle, User, UserMinus, UserCheck, ShieldAlert,
  Bike, Clock, Activity, RefreshCw, Radio, Building2
} from 'lucide-react';
import { TableRowsSkeleton } from '../../components/skeleton';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState(null);
  
  // Account status modal state
  const [statusModal, setStatusModal] = useState({ isOpen: false, user: null });

  // Calculate real-time activity status using server presence + fallback
  const getActivityStatus = (user) => {
    if (!user) return { statusText: 'Offline', timeText: '', isOnline: false, isPulsing: false, badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700', dotClass: 'bg-slate-400' };
    
    const { lastActive, isActive, isOnline: serverOnline, lastActiveSecondsAgo } = user;

    if (isActive === false) {
      return {
        statusText: 'Deactivated',
        timeText: 'Account disabled',
        isOnline: false,
        isPulsing: false,
        badgeClass: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800',
        dotClass: 'bg-red-500'
      };
    }

    if (!lastActive) {
      return {
        statusText: 'Offline',
        timeText: 'No recent activity',
        isOnline: false,
        isPulsing: false,
        badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
        dotClass: 'bg-slate-400'
      };
    }

    // Determine seconds ago with fallback to client computation
    let diffSec;
    if (typeof lastActiveSecondsAgo === 'number') {
      diffSec = lastActiveSecondsAgo;
    } else {
      const now = Date.now();
      const activeDate = new Date(lastActive).getTime();
      diffSec = Math.max(0, Math.floor((now - activeDate) / 1000));
    }

    // Active Now: server flagged online or active within 150 seconds (2.5 minutes)
    if (serverOnline || diffSec < 150) {
      return {
        statusText: 'Active Now',
        timeText: 'Online',
        isOnline: true,
        isPulsing: true,
        badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80',
        dotClass: 'bg-emerald-500'
      };
    }

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
      return {
        statusText: `Active ${diffMin}m ago`,
        timeText: `${diffMin}m ago`,
        isOnline: false,
        isPulsing: false,
        badgeClass: 'bg-emerald-50/60 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
        dotClass: 'bg-emerald-400'
      };
    }

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) {
      return {
        statusText: `Active ${diffHours}h ago`,
        timeText: `${diffHours}h ago`,
        isOnline: false,
        isPulsing: false,
        badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        dotClass: 'bg-slate-400'
      };
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      return {
        statusText: 'Active yesterday',
        timeText: 'Yesterday',
        isOnline: false,
        isPulsing: false,
        badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
        dotClass: 'bg-slate-400'
      };
    }

    return {
      statusText: `Active ${diffDays}d ago`,
      timeText: `${diffDays}d ago`,
      isOnline: false,
      isPulsing: false,
      badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
      dotClass: 'bg-slate-400'
    };
  };

  useEffect(() => {
    fetchUsers(true);
    // Real-time polling every 10 seconds
    const interval = setInterval(() => {
      fetchUsers(false);
    }, 10000);

    const onFocus = () => fetchUsers(false);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchUsers(false);
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  const fetchUsers = async (showSkeleton = true) => {
    if (showSkeleton) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/auth', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok) {
        const nonAdminUsers = data.filter(user => {
          const r = String(user.role || '').toLowerCase().trim().replace(/_/g, ' ');
          return r !== 'admin' && r !== 'administrator';
        });
        setUsers(nonAdminUsers);
        // Sync selectedUser if details modal is open
        setSelectedUser(prev => {
          if (!prev) return null;
          return nonAdminUsers.find(u => u._id === prev._id) || prev;
        });
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Role management
  const initiateRoleChange = (user, newRole) => {
    if (user.role === newRole) return; 
    setPendingRoleChange({ userId: user._id, userName: user.name, oldRole: user.role, newRole: newRole });
    setIsConfirmOpen(true);
  };

  const confirmAndSaveRole = async () => {
    if (!pendingRoleChange) return;
    const { userId, newRole } = pendingRoleChange;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
        setIsConfirmOpen(false); setPendingRoleChange(null);
      } else {
        alert('Failed to update role. Try logging in again.');
        setIsConfirmOpen(false);
      }
    } catch (error) {
      alert('Cannot connect to the server.');
      setIsConfirmOpen(false);
    }
  };

  // Account activation and deactivation
  const handleToggleStatus = async () => {
    if (!statusModal.user) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/${statusModal.user._id}/toggle-status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const updatedStatus = statusModal.user.isActive === false ? true : false;
        setUsers(users.map(u => u._id === statusModal.user._id ? { ...u, isActive: updatedStatus } : u));
        setStatusModal({ isOpen: false, user: null });
      } else {
        const errorData = await response.json();
        alert(`Failed: ${errorData.message}`);
        setStatusModal({ isOpen: false, user: null });
      }
    } catch (error) {
      alert('Network Error.');
      setStatusModal({ isOpen: false, user: null });
    }
  };

  const openDetailsModal = (user) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
  };

  const filteredUsers = users.filter(user => {
    const q = searchQuery.toLowerCase();
    const nameMatch = user.name?.toLowerCase().includes(q);
    const contactMatch = user.contact?.toLowerCase().includes(q);
    const todaMatch = user.todaAssociation?.toLowerCase().includes(q);
    const plateMatch = user.units?.some(u => u.plateNo?.toLowerCase().includes(q));
    return nameMatch || contactMatch || todaMatch || plateMatch;
  });

  const onlineUsersCount = users.filter(u => getActivityStatus(u).isOnline).length;
  const modalActivity = selectedUser ? getActivityStatus(selectedUser) : null;

  return (
    <MainLayout>
      <header className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-[#7A1B22] rounded-full" />
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">User Management</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage operators, roles, fleet capacities, and live account activity.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Live Online Counter */}
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-3.5 py-2 rounded-xl font-bold text-xs border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{onlineUsersCount} Online Now</span>
          </div>

          {/* Total Users Count */}
          <div className="flex items-center gap-2 bg-[#7A1B22]/10 dark:bg-[#7A1B22]/25 text-[#7A1B22] dark:text-[#D4AF37] px-4 py-2 rounded-xl font-bold text-sm border border-[#7A1B22]/20 dark:border-[#7A1B22]/40 shadow-sm">
            <Users size={18} />
            Total: {users.length}
          </div>

          {/* Refresh Button */}
          <button 
            onClick={() => fetchUsers(false)} 
            disabled={isRefreshing}
            title="Refresh user list"
            className="p-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#7A1B22] dark:hover:text-[#D4AF37] rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin text-[#7A1B22] dark:text-[#D4AF37]" : ""} />
          </button>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-800/60">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search user by name, contact, TODA, or plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-[#7A1B22] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-[#7A1B22]/20 transition-all shadow-sm"
            />
          </div>
          
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Auto-syncing active presence
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">
                <th className="py-3.5 pl-5 pr-3">Profile / User</th>
                <th className="py-3.5 px-3">Contact &amp; TODA</th>
                <th className="py-3.5 px-3 text-center">Units</th>
                <th className="py-3.5 px-3">Activity Status</th>
                <th className="py-3.5 px-3">Account Status</th>
                <th className="py-3.5 px-3 text-center">Manage Role</th>
                <th className="py-3.5 pr-5 pl-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {isLoading ? (
                <TableRowsSkeleton rows={6} columns={7} baseDelay={30} stepDelay={45} />
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                    No users found matching "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, uIdx) => {
                  const activity = getActivityStatus(user);
                  const unitsCount = user.unitsCount || 0;
                  const isMaxUnits = unitsCount >= 2;

                  return (
                    <tr 
                      key={user._id} 
                      className={`stagger-reveal hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group ${user.isActive === false ? 'opacity-70 bg-red-50/30 dark:bg-red-950/20' : ''}`}
                      style={{ animationDelay: `${uIdx * 35}ms` }}
                    >
                      {/* Profile / User */}
                      <td className="py-3 pl-5 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <div className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center border-2 shadow-sm ${user.isActive === false ? 'border-red-300 dark:border-red-800 bg-red-100 dark:bg-red-950/50 text-red-400' : 'border-white dark:border-slate-700 bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                              {user.profilePic ? (
                                <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                <User size={16} />
                              )}
                            </div>
                            {/* Live online dot */}
                            {activity.isOnline && (
                              <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
                              </span>
                            )}
                          </div>
                          <div>
                            <span className={`font-bold block text-sm ${user.isActive === false ? 'text-red-900 dark:text-red-300 line-through decoration-red-300' : 'text-slate-900 dark:text-white'}`}>{user.name}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">{user.role ? user.role.replace('_', ' ') : 'Operator'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Contact & TODA */}
                      <td className="py-3 px-3">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{user.contact}</p>
                        <p className="text-[10px] font-bold text-[#7A1B22] dark:text-[#D4AF37] uppercase tracking-wider bg-[#7A1B22]/10 dark:bg-[#7A1B22]/25 inline-block px-1.5 py-0.5 rounded border border-[#7A1B22]/20 dark:border-[#7A1B22]/40 mt-0.5">
                          {user.todaAssociation || 'NON-TODA'}
                        </p>
                      </td>

                      {/* Units / Fleet (Compact Badge) */}
                      <td className="py-3 px-3 text-center">
                        <button 
                          onClick={() => openDetailsModal(user)}
                          title="Click to view registered units"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black border shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                            isMaxUnits 
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 hover:bg-amber-100'
                              : unitsCount === 1
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60 hover:bg-blue-100'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <Bike size={13} />
                          <span>{unitsCount}/2</span>
                          {isMaxUnits && <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 ml-0.5">MAX</span>}
                        </button>
                      </td>

                      {/* Activity Status */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-2xs ${activity.badgeClass}`}>
                            <span className="relative flex h-2 w-2">
                              {activity.isPulsing && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              )}
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${activity.dotClass}`}></span>
                            </span>
                            {activity.statusText}
                          </span>
                        </div>
                      </td>
                      
                      {/* Account Status */}
                      <td className="py-3 px-3">
                        {user.isActive === false ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-[10px] font-bold uppercase tracking-wider border border-red-200 dark:border-red-800">
                            <ShieldAlert size={12} /> Deactivated
                          </span>
                        ) : user.isVerified ? (
                          (user.authProvider === 'google' || user.googleId) ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[10px] font-bold tracking-tight border border-blue-200 dark:border-blue-800/70 shadow-2xs" title={`Google Verified: ${user.email || user.contact}`}>
                              <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                              </svg>
                              Verified (Google)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-800/60">
                              <ShieldCheck size={12} /> Verified (SMS)
                            </span>
                          )
                        ) : (
                          <span className="inline-flex px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                            Unverified
                          </span>
                        )}
                      </td>

                      {/* Manage Role */}
                      <td className="py-3 px-3 text-center">
                        <select
                          value={user.role}
                          disabled={user.isActive === false}
                          onChange={(e) => initiateRoleChange(user, e.target.value)}
                          className={`border text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none shadow-sm transition-colors ${
                            user.isActive === false ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed' :
                            (user.role === 'toda_president' || user.role === 'toda president') ? 'bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 text-[#7A1B22] dark:text-[#D4AF37] border-[#D4AF37] cursor-pointer' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#7A1B22] dark:hover:border-[#D4AF37] cursor-pointer'
                          }`}
                        >
                          <option value="operator">Operator</option>
                          <option value="toda_president">TODA President</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 pr-5 pl-3 text-center space-x-2">
                        <button 
                          onClick={() => openDetailsModal(user)}
                          className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer"
                          title="View Profile & Fleet Details"
                        >
                          <Info size={14} />
                        </button>

                        <button 
                          onClick={() => setStatusModal({ isOpen: true, user: user })}
                          className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm cursor-pointer ${
                            user.isActive === false 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                            : 'bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                          }`}
                          title={user.isActive === false ? "Restore Account" : "Deactivate Account"}
                        >
                          {user.isActive === false ? <UserCheck size={14} /> : <UserMinus size={14} />}
                          <span className="hidden sm:inline">{user.isActive === false ? 'Activate' : 'Deactivate'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account status confirmation modal */}
      {statusModal.isOpen && statusModal.user && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => setStatusModal({ isOpen: false, user: null })}></div>
          <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-slate-800 shadow-sm ${
              statusModal.user.isActive === false ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400'
            }`}>
              {statusModal.user.isActive === false ? <UserCheck size={28} /> : <UserMinus size={28} />}
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {statusModal.user.isActive === false ? 'Reactivate Account?' : 'Deactivate Account?'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to {statusModal.user.isActive === false ? 'restore access for ' : 'revoke system access from '} 
              <strong className="text-slate-800 dark:text-slate-200">{statusModal.user.name}</strong>?
              {statusModal.user.isActive !== false && <span className="block mt-2 text-xs text-red-500 font-medium">This will prevent the user from logging in.</span>}
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setStatusModal({ isOpen: false, user: null })}
                className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleToggleStatus}
                className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors text-sm shadow-sm ${
                  statusModal.user.isActive === false ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Yes, {statusModal.user.isActive === false ? 'Activate' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role change confirmation modal */}
      {isConfirmOpen && pendingRoleChange && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsConfirmOpen(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-slate-800 shadow-sm">
              <AlertTriangle size={28} strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Change User Role?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to change <strong className="text-slate-800 dark:text-slate-200">{pendingRoleChange.userName}</strong>'s role from <br/>
              <span className="inline-block mt-2 px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] rounded uppercase tracking-wider border border-slate-200 dark:border-slate-700">{pendingRoleChange.oldRole}</span> 
              <span className="mx-2 text-slate-300 dark:text-slate-600">➔</span> 
              <span className="inline-block px-2 py-1 bg-[#D4AF37]/20 dark:bg-[#D4AF37]/30 text-[#7A1B22] dark:text-[#D4AF37] font-bold text-[10px] rounded uppercase tracking-wider border border-[#D4AF37]/40">{pendingRoleChange.newRole}</span> ?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setIsConfirmOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm">Cancel</button>
              <button onClick={confirmAndSaveRole} className="flex-1 py-3 rounded-xl font-bold text-white bg-[#7A1B22] hover:bg-[#5A1419] transition-colors text-sm shadow-sm">Yes, Change It</button>
            </div>
          </div>
        </div>
      )}

      {/* User details modal */}
      {isDetailsModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsDetailsModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-[#7A1B22] p-6 text-center relative shrink-0">
              <button onClick={() => setIsDetailsModalOpen(false)} className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 p-1.5 rounded-lg transition-colors"><X size={18} /></button>
              <div className="relative inline-block mx-auto mb-3">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center shadow-md border-2 border-[#D4AF37] overflow-hidden">
                  {selectedUser.profilePic ? <img src={selectedUser.profilePic} alt={selectedUser.name} className="w-full h-full object-cover" /> : <User className="text-slate-400" size={36} />}
                </div>
                {modalActivity?.isOnline && (
                  <span className="absolute bottom-0 right-0 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white">{selectedUser.name}</h2>
              <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest bg-black/20 px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30">
                  {selectedUser.role.replace('_', ' ')}
                </span>
                {modalActivity && (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${modalActivity.badgeClass}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${modalActivity.dotClass}`}></span>
                    {modalActivity.statusText}
                  </span>
                )}
              </div>
            </div>

            {/* Scrollable details */}
            <div className="p-6 space-y-4 text-slate-700 dark:text-slate-300 overflow-y-auto custom-scrollbar flex-1">
              {/* Presence & Activity Status Info */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800">
                <Activity className="text-emerald-500 mt-0.5" size={18} />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Live Activity Status</p>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${modalActivity?.dotClass || 'bg-slate-400'}`}></span>
                      {modalActivity?.statusText || 'Offline'}
                    </p>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedUser.lastActive ? `Last seen: ${new Date(selectedUser.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'No recent login'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800">
                <MapPin className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Barangay Address</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedUser.address || 'Gasan, Marinduque'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800">
                <Phone className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact Details</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedUser.contact}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800">
                <Building2 className="text-slate-400 mt-0.5" size={18} />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">TODA Association</p>
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#7A1B22]/10 dark:bg-[#7A1B22]/25 text-[#7A1B22] dark:text-[#D4AF37] border border-[#7A1B22]/20 dark:border-[#7A1B22]/40">
                      <Bike size={14} />
                      {selectedUser.todaAssociation || 'NON-TODA'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800">
                <ShieldCheck className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Authentication / Verification</p>
                  <div className="mt-1">
                    {(selectedUser.authProvider === 'google' || selectedUser.googleId) ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800/60 shadow-2xs">
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                        Verified using Google Login
                      </span>
                    ) : selectedUser.isVerified ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800/60">
                        <ShieldCheck size={14} /> Verified (SMS / Local OTP)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold border border-slate-200 dark:border-slate-700">
                        Unverified Account
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800">
                <Calendar className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date Registered</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{new Date(selectedUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              {/* Assigned Tricycle Units / Fleet Section */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bike size={18} className="text-[#7A1B22] dark:text-[#D4AF37]" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Assigned Tricycle Units
                    </h4>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    (selectedUser.unitsCount || 0) >= 2 
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                      : (selectedUser.unitsCount || 0) === 1
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                    {selectedUser.unitsCount || 0} / 2 Units {(selectedUser.unitsCount || 0) >= 2 ? '(MAX)' : ''}
                  </span>
                </div>

                {selectedUser.units && selectedUser.units.length > 0 ? (
                  <div className="space-y-2.5">
                    {selectedUser.units.map((unit, idx) => (
                      <div key={unit._id || idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 shadow-2xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#7A1B22] dark:bg-[#D4AF37]"></span>
                            Plate No: {unit.plateNo || 'Pending Plate'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            unit.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                            unit.status === 'Pending' || unit.status === 'Ready for Pickup' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' :
                            unit.status === 'Expired' ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}>
                            {unit.status || 'Active'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/50">
                          <div>
                            <span className="font-medium text-slate-400 dark:text-slate-500">Make/Model:</span>{' '}
                            <strong className="text-slate-800 dark:text-slate-200">{unit.make || unit.made || 'N/A'}</strong>
                          </div>
                          <div>
                            <span className="font-medium text-slate-400 dark:text-slate-500">TODA/Route:</span>{' '}
                            <strong className="text-[#7A1B22] dark:text-[#D4AF37]">{unit.todaName || unit.zone || 'N/A'}</strong>
                          </div>
                          <div>
                            <span className="font-medium text-slate-400 dark:text-slate-500">Motor No:</span>{' '}
                            <span className="font-mono text-slate-700 dark:text-slate-300">{unit.motorNo || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-slate-400 dark:text-slate-500">Chassis No:</span>{' '}
                            <span className="font-mono text-slate-700 dark:text-slate-300">{unit.chassisNo || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    No registered tricycle units under this operator.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-center shrink-0">
              <button onClick={() => setIsDetailsModalOpen(false)} className="w-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-2.5 rounded-xl transition-colors text-sm">Close Details</button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default UserManagement;