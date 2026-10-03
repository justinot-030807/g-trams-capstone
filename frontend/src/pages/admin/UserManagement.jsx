import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout';
import { 
  Users, Search, Info, MapPin, Phone, Calendar, ShieldCheck, X, 
  AlertTriangle, User, UserMinus, UserCheck, ShieldAlert,
  Clock, Activity, RefreshCw, Radio, Building2, CheckCircle2,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { TableRowsSkeleton } from '../../components/skeleton';
import PageHeader from '../../components/common/PageHeader';
import { formatZoneLabel } from '../../utils/constants';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
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

    // Current logged-in user actively viewing this page is ALWAYS online
    let isCurrentViewer = false;
    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      if (stored._id && String(stored._id) === String(user._id)) isCurrentViewer = true;
      if (stored.contact && user.contact && String(stored.contact).toLowerCase() === String(user.contact).toLowerCase()) isCurrentViewer = true;
      if (stored.email && user.email && String(stored.email).toLowerCase() === String(user.email).toLowerCase()) isCurrentViewer = true;
    } catch {}

    if (isCurrentViewer) {
      return {
        statusText: 'Online (You)',
        timeText: 'Active now',
        isOnline: true,
        isPulsing: true,
        badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 font-black',
        dotClass: 'bg-emerald-500'
      };
    }

    // Determine seconds ago with fallback to client computation
    let diffSec;
    if (typeof lastActiveSecondsAgo === 'number') {
      diffSec = lastActiveSecondsAgo;
    } else {
      const timestamp = lastActive || user.updatedAt;
      if (timestamp) {
        const now = Date.now();
        const activeDate = new Date(timestamp).getTime();
        if (!isNaN(activeDate)) {
          diffSec = Math.max(0, Math.floor((now - activeDate) / 1000));
        }
      }
    }

    // Online: active within last 180 seconds (3 minutes) or server flagged online
    if (serverOnline === true || (typeof diffSec === 'number' && diffSec < 180)) {
      return {
        statusText: 'Online',
        timeText: 'Active now',
        isOnline: true,
        isPulsing: true,
        badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80',
        dotClass: 'bg-emerald-500'
      };
    }

    if (typeof diffSec !== 'number') {
      return {
        statusText: 'Offline',
        timeText: 'No recent activity',
        isOnline: false,
        isPulsing: false,
        badgeClass: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500 border-slate-200 dark:border-slate-700',
        dotClass: 'bg-slate-400'
      };
    }

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
      return {
        statusText: `Active ${diffMin}m ago`,
        timeText: `${diffMin}m ago`,
        isOnline: false,
        isPulsing: false,
        badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        dotClass: 'bg-slate-400'
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
    return {
      statusText: 'Offline',
      timeText: diffDays === 1 ? 'Yesterday' : `${diffDays}d ago`,
      isOnline: false,
      isPulsing: false,
      badgeClass: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500 border-slate-200 dark:border-slate-700',
      dotClass: 'bg-slate-400'
    };
  };

  useEffect(() => {
    fetchUsers(true);
    // Fast real-time polling every 6 seconds
    const interval = setInterval(() => {
      fetchUsers(false);
    }, 6000);

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
      const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
      const token = localStorage.getItem('token');

      // Fetch users (the backend getUsers controller already aggregates franchise counts!)
      const usersRes = await fetch(`${baseUrl}/api/v1/auth?_t=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });

      const data = await usersRes.json();
      if (usersRes.ok && Array.isArray(data)) {
        // Backend already calculates units, unitsCount, activeUnitsCount, etc. 
        // We just need to map it directly and format timestamps.
        const enhancedUsers = data.map(user => {
          return {
            ...user,
            units: user.units || [],
            unitsCount: user.unitsCount || 0,
            activeUnitsCount: user.activeUnitsCount || 0,
            pendingUnitsCount: user.pendingUnitsCount || 0,
            expiredUnitsCount: user.expiredUnitsCount || 0,
            cancelledUnitsCount: user.cancelledUnitsCount || 0,
            createdAtStr: new Date(user.createdAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })
          };
        });

        setUsers(enhancedUsers);
        // Sync selectedUser if details modal is open
        setSelectedUser(prev => {
          if (!prev) return null;
          return enhancedUsers.find(u => u._id === prev._id) || prev;
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
  const [deactivateReason, setDeactivateReason] = useState('');

  const handleToggleStatus = async () => {
    if (!statusModal.user) return;
    
    try {
      const isDeactivating = statusModal.user.isActive !== false;
      if (isDeactivating && !deactivateReason.trim()) {
        alert('Please provide a reason for deactivation.');
        return;
      }
      
      const bodyData = isDeactivating ? { reason: deactivateReason } : {};
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/${statusModal.user._id}/toggle-status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
      });

      if (response.ok) {
        const updatedStatus = statusModal.user.isActive === false ? true : false;
        // reset appeal fields if activated
        const updateFields = { isActive: updatedStatus };
        if (updatedStatus) {
            updateFields.deactivationReason = '';
            updateFields.appealStatus = 'none';
            updateFields.appealMessage = '';
        } else {
            updateFields.deactivationReason = deactivateReason;
        }

        setUsers(users.map(u => u._id === statusModal.user._id ? { ...u, ...updateFields } : u));
        setStatusModal({ isOpen: false, user: null });
        setDeactivateReason('');
      } else {
        const errorData = await response.json();
        alert(`Failed: ${errorData.message}`);
        setStatusModal({ isOpen: false, user: null });
        setDeactivateReason('');
      }
    } catch (error) {
      alert('Network Error.');
      setStatusModal({ isOpen: false, user: null });
      setDeactivateReason('');
    }
  };

  const openDetailsModal = (user) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
  };

  const allCount = users.length;
  const operatorCount = users.filter(u => {
    const r = (u.role || '').toLowerCase();
    return r === 'operator' || !r;
  }).length;
  const todaPresidentCount = users.filter(u => {
    const r = (u.role || '').toLowerCase();
    return r === 'toda_president' || r === 'toda president';
  }).length;
  const adminCount = users.filter(u => {
    const r = (u.role || '').toLowerCase();
    return r === 'admin' || r === 'administrator';
  }).length;
  const cashierCount = users.filter(u => {
    const r = (u.role || '').toLowerCase();
    return r === 'cashier';
  }).length;
  const onlineUsersCount = users.filter(u => getActivityStatus(u).isOnline).length;

  const filteredUsers = users.filter(user => {
    // Role filter
    const r = (user.role || '').toLowerCase();
    if (roleFilter === 'operator' && r !== 'operator' && r !== '') return false;
    if (roleFilter === 'toda_president' && r !== 'toda_president' && r !== 'toda president') return false;
    if (roleFilter === 'admin' && r !== 'admin' && r !== 'administrator') return false;
    if (roleFilter === 'cashier' && r !== 'cashier') return false;
    if (roleFilter === 'online' && !getActivityStatus(user).isOnline) return false;

    // Search query
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = user.name?.toLowerCase().includes(q);
    const contactMatch = user.contact?.toLowerCase().includes(q);
    const todaMatch = user.todaAssociation?.toLowerCase().includes(q);
    const plateMatch = user.units?.some(u => u.plateNo?.toLowerCase().includes(q));
    return nameMatch || contactMatch || todaMatch || plateMatch;
  });

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  // Helper to get precise timestamp for sorting
  const getUserActivityTimestamp = (user) => {
    if (!user) return 0;
    if (typeof user.lastActiveSecondsAgo === 'number') {
      return Date.now() - (user.lastActiveSecondsAgo * 1000);
    }
    const ts = user.lastActive || user.updatedAt || user.createdAt;
    if (ts) {
      const ms = new Date(ts).getTime();
      return isNaN(ms) ? 0 : ms;
    }
    return 0;
  };

  // Sort: Active/Online first -> Recently active (minutes ago) -> Inactive -> Deactivated last
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    // 1. Deactivated accounts at the very end
    if (a.isActive !== false && b.isActive === false) return -1;
    if (a.isActive === false && b.isActive !== false) return 1;

    const statusA = getActivityStatus(a);
    const statusB = getActivityStatus(b);

    // 2. Online users strictly first
    if (statusA.isOnline && !statusB.isOnline) return -1;
    if (!statusA.isOnline && statusB.isOnline) return 1;

    // 3. Sort by most recent activity timestamp (descending)
    const timeA = getUserActivityTimestamp(a);
    const timeB = getUserActivityTimestamp(b);

    if (timeA !== timeB) {
      return timeB - timeA; // Most recently active (e.g. 1 min ago > 5 mins ago > 1 hr ago)
    }

    // 4. Alphabetical tie-breaker
    return (a.name || '').localeCompare(b.name || '');
  });

  // Pagination calculation
  const totalUsers = sortedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalUsers);
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

  const modalActivity = selectedUser ? getActivityStatus(selectedUser) : null;

  return (
    <MainLayout>
      {/* Header Ribbon */}
      <PageHeader
        title="User Management"
        subtitle="Manage operators, roles, fleet capacities, and live account activity."
        actions={
          <div className="flex items-center gap-2">
            {/* Live Online Counter */}
            <button
              onClick={() => setRoleFilter(roleFilter === 'online' ? 'all' : 'online')}
              title="Click to filter online users"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs border transition-all cursor-pointer ${
                roleFilter === 'online'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0] dark:bg-[#052E16]/60 dark:text-[#4ADE80] dark:border-[#166534]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] dark:bg-[#4ADE80]"></span>
              <span>{onlineUsersCount} Online Now</span>
            </button>

            {/* Total Users Count */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-[#1C1917] text-[#1F1D1B] dark:text-[#F6F5F3] px-3 py-1.5 rounded-lg font-semibold text-xs border border-[#E4E1DC] dark:border-[#2E2A27]">
              <Users size={14} />
              <span>Total: {users.length}</span>
            </div>

            {/* Refresh Button */}
            <button 
              onClick={() => fetchUsers(false)} 
              disabled={isRefreshing}
              title="Refresh user list"
              className="p-1.5 bg-white dark:bg-[#1C1917] text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin text-[#9E2A2B]" : ""} />
            </button>
          </div>
        }
      />

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: `All Users (${allCount})` },
          { id: 'operator', label: `Operators (${operatorCount})` },
          { id: 'toda_president', label: `TODA Presidents (${todaPresidentCount})` },
          { id: 'admin', label: `Administrators (${adminCount})` },
          { id: 'cashier', label: `Cashiers (${cashierCount})` },
          { id: 'online', label: `Online (${onlineUsersCount})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setRoleFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
              roleFilter === tab.id
                ? 'bg-[#9E2A2B] text-white'
                : 'bg-white dark:bg-[#1C1917] text-[#6B6761] dark:text-[#A8A29E] border border-[#E4E1DC] dark:border-[#2E2A27] hover:border-[#9E2A2B]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-[#1C1917] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] overflow-hidden transition-colors">
        <div className="p-3.5 sm:p-4 border-b border-[#E4E1DC] dark:border-[#2E2A27] flex flex-col sm:flex-row gap-3 justify-between items-center bg-[#F6F5F3] dark:bg-[#14110F]">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6761] dark:text-[#A8A29E]" size={16} />
            <input
              type="text"
              placeholder="Search user by name, contact, TODA, or plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg pl-9 pr-3.5 py-2 text-xs sm:text-sm font-normal text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] transition-all"
            />
          </div>
          
          <div className="flex items-center gap-1.5 text-xs text-[#6B6761] dark:text-[#A8A29E] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Auto-syncing active presence
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] text-xs uppercase tracking-wider font-semibold">
                <th className="py-3 pl-5 pr-3">Profile / User</th>
                <th className="py-3 px-3">Contact &amp; TODA</th>
                <th className="py-3 px-3 text-center">Units</th>
                <th className="py-3 px-3">Activity Status</th>
                <th className="py-3 px-3">Account Status</th>
                <th className="py-3 px-3 text-center">Manage Role</th>
                <th className="py-3 pr-5 pl-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27] text-xs">
              {isLoading ? (
                <TableRowsSkeleton rows={6} columns={7} baseDelay={30} stepDelay={45} />
              ) : sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-xs font-medium text-[#6B6761] dark:text-[#A8A29E]">
                    No users found matching current filters
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, uIdx) => {
                  const activity = getActivityStatus(user);
                  const unitsCount = user.unitsCount || 0;
                  const isMaxUnits = unitsCount >= 2;
                  const r = (user.role || '').toLowerCase();
                  const isAdminUser = r === 'admin' || r === 'administrator';

                  return (
                    <tr 
                      key={user._id} 
                      className={`hover:bg-[#F6F5F3]/80 dark:hover:bg-[#14110F]/80 transition-colors group ${user.isActive === false ? 'opacity-70 bg-red-50/20 dark:bg-red-950/10' : ''}`}
                    >
                      {/* Profile / User */}
                      <td className="py-3 pl-5 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border ${user.isActive === false ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/50 text-red-500' : 'border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] text-[#6B6761]'}`}>
                              {user.profilePic ? (
                                <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                <User size={15} />
                              )}
                            </div>
                            {/* Live online dot */}
                            {activity.isOnline && (
                              <span className="absolute bottom-0 right-0 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 border border-white dark:border-[#1C1917]"></span>
                              </span>
                            )}
                          </div>
                          <div>
                            <span className={`font-semibold block text-sm ${user.isActive === false ? 'text-red-700 dark:text-red-400 line-through' : 'text-[#1F1D1B] dark:text-[#F6F5F3]'}`}>{user.name}</span>
                            <span className="text-xs text-[#6B6761] dark:text-[#A8A29E] capitalize">{user.role ? user.role.replace('_', ' ') : 'Operator'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Contact & TODA */}
                      <td className="py-3 px-3">
                        <p className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] font-mono">{user.contact}</p>
                        <p className="text-xs font-semibold text-[#9E2A2B] dark:text-[#D4AF37] uppercase tracking-wider bg-[#9E2A2B]/10 dark:bg-[#9E2A2B]/20 inline-block px-1.5 py-0.5 rounded border border-[#9E2A2B]/20 dark:border-[#9E2A2B]/30 mt-0.5">
                          {user.todaAssociation || 'NON-TODA'}
                        </p>
                      </td>

                      {/* Units / Fleet (Compact Badge - No Logo) */}
                      <td className="py-3 px-3 text-center">
                        {isAdminUser ? (
                          <span className="text-[#6B6761] dark:text-[#A8A29E] font-medium">—</span>
                        ) : (
                          <button 
                            onClick={() => openDetailsModal(user)}
                            title="Click to view registered units"
                            className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                              isMaxUnits 
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                                : unitsCount === 1
                                ? 'bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] border-[#E4E1DC] dark:border-[#2E2A27]'
                                : 'bg-[#F6F5F3] dark:bg-[#14110F] text-[#6B6761] dark:text-[#A8A29E] border-[#E4E1DC] dark:border-[#2E2A27]'
                            }`}
                          >
                            <span className="tabular-nums">{unitsCount}/2</span>
                            {isMaxUnits && <span className="text-[9px] font-semibold text-amber-700 dark:text-amber-400 ml-1">MAX</span>}
                          </button>
                        )}
                      </td>

                      {/* Activity Status */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border select-none ${activity.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activity.dotClass}`}></span>
                            <span>{activity.statusText}</span>
                          </span>
                        </div>
                      </td>
                      
                      {/* Account Status */}
                      <td className="py-3 px-3">
                        {user.isActive === false ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs font-medium uppercase tracking-wider border border-red-200 dark:border-red-800/60">
                            <ShieldAlert size={12} /> Deactivated
                          </span>
                        ) : user.isVerified ? (
                          (user.authProvider === 'google' || user.googleId) ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0] dark:bg-[#052E16]/60 dark:text-[#4ADE80] dark:border-[#166534] text-xs font-medium" title={`Google Verified: ${user.email || user.contact}`}>
                              <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                              </svg>
                              Verified (Google)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0] dark:bg-[#052E16]/60 dark:text-[#4ADE80] dark:border-[#166534] text-xs font-medium uppercase tracking-wider">
                              <ShieldCheck size={12} /> Verified (SMS)
                            </span>
                          )
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-md bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB] dark:bg-[#1F2937]/60 dark:text-[#9CA3AF] dark:border-[#374151] text-xs font-medium uppercase tracking-wider">
                            Unverified
                          </span>
                        )}
                      </td>

                      {/* Manage Role */}
                      <td className="py-3 px-3 text-center">
                        {isAdminUser ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-[#9E2A2B]/10 dark:bg-[#9E2A2B]/20 text-[#9E2A2B] dark:text-[#D4AF37] border border-[#9E2A2B]/20 dark:border-[#9E2A2B]/30">
                            Administrator
                          </span>
                        ) : (
                          <select
                            value={user.role}
                            disabled={user.isActive === false}
                            onChange={(e) => initiateRoleChange(user, e.target.value)}
                            className="border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] text-xs font-medium rounded-lg px-2 py-1 outline-none cursor-pointer focus:border-[#9E2A2B] dark:focus:border-[#D4AF37]"
                          >
                            <option value="operator">Operator</option>
                            <option value="toda_president">TODA President</option>
                            <option value="cashier">Cashier</option>
                          </select>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 pr-5 pl-3 text-center space-x-1.5">
                        <button 
                          onClick={() => openDetailsModal(user)}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] text-xs font-semibold rounded-lg transition-colors border border-[#E4E1DC] dark:border-[#2E2A27] cursor-pointer"
                          title="View Profile & Fleet Details"
                        >
                          <Info size={14} />
                        </button>

                        {isAdminUser ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-[#6B6761] dark:text-[#A8A29E]">
                            Protected
                          </span>
                        ) : (
                          <button 
                            onClick={() => setStatusModal({ isOpen: true, user: user })}
                            className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors border cursor-pointer ${
                              user.isActive === false 
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                              : 'bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                            }`}
                            title={user.isActive === false ? "Restore Account" : "Deactivate Account"}
                          >
                            {user.isActive === false ? <UserCheck size={14} /> : <UserMinus size={14} />}
                            <span className="hidden sm:inline">{user.isActive === false ? 'Activate' : 'Deactivate'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {!isLoading && sortedUsers.length > 0 && (
          <div className="px-4 py-3 sm:px-6 bg-[#F6F5F3] dark:bg-[#14110F] border-t border-[#E4E1DC] dark:border-[#2E2A27] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs rounded-b-lg">
            <div className="flex items-center gap-2 text-[#6B6761] dark:text-[#A8A29E] font-medium flex-wrap justify-center sm:justify-start">
              <span>Showing</span>
              <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] tabular-nums">{startIndex + 1}</span>
              <span>to</span>
              <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] tabular-nums">{endIndex}</span>
              <span>of</span>
              <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] tabular-nums">{totalUsers}</span>
              <span>users</span>

              <span className="mx-1 text-[#E4E1DC] dark:text-[#2E2A27] hidden sm:inline">|</span>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <span className="text-xs">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-2 py-1 text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={validCurrentPage <= 1}
                className="inline-flex items-center justify-center p-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] text-[#1F1D1B] dark:text-[#F6F5F3] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - validCurrentPage) <= 1) return true;
                    return false;
                  })
                  .reduce((acc, page, idx, arr) => {
                    if (idx > 0 && page - arr[idx - 1] > 1) {
                      acc.push('ellipsis-' + page);
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item) => {
                    if (typeof item === 'string') {
                      return (
                        <span key={item} className="px-1.5 text-[#6B6761] select-none">
                          ...
                        </span>
                      );
                    }
                    const isCurrent = item === validCurrentPage;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCurrentPage(item)}
                        className={`min-w-[30px] h-[30px] rounded-lg font-semibold text-xs tabular-nums flex items-center justify-center transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-[#9E2A2B] text-white shadow-2xs'
                            : 'bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27]'
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={validCurrentPage >= totalPages}
                className="inline-flex items-center justify-center p-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] text-[#1F1D1B] dark:text-[#F6F5F3] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Account status confirmation modal */}
      {statusModal.isOpen && statusModal.user && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 transition-opacity" onClick={() => setStatusModal({ isOpen: false, user: null })}></div>
          <div className="relative bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg shadow-xl w-full max-w-sm p-6 text-center">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 border ${
              statusModal.user.isActive === false ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
            }`}>
              {statusModal.user.isActive === false ? <UserCheck size={22} /> : <UserMinus size={22} />}
            </div>
            
            <h3 className="text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] mb-1">
              {statusModal.user.isActive === false ? 'Reactivate Account?' : 'Deactivate Account?'}
            </h3>
            <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mb-4 leading-relaxed">
              Are you sure you want to {statusModal.user.isActive === false ? 'restore access for ' : 'revoke system access from '} 
              <strong className="text-[#1F1D1B] dark:text-[#F6F5F3] font-semibold">{statusModal.user.name}</strong>?
              {statusModal.user.isActive !== false && <span className="block mt-1 text-xs text-red-600 dark:text-red-400 font-medium">This will prevent the user from logging in.</span>}
            </p>

            {statusModal.user.isActive !== false && (
              <div className="mb-4 text-left">
                <label className="block text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] uppercase mb-1">
                  Reason for Deactivation
                </label>
                <textarea
                  value={deactivateReason}
                  onChange={(e) => setDeactivateReason(e.target.value)}
                  placeholder="Enter reason..."
                  className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-2.5 text-xs text-[#1F1D1B] dark:text-[#F6F5F3] placeholder-[#6B6761] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] min-h-[70px] resize-none"
                  required
                />
              </div>
            )}

            <div className="flex gap-2">
              <button 
                onClick={() => { setStatusModal({ isOpen: false, user: null }); setDeactivateReason(''); }}
                className="flex-1 py-2 rounded-lg font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] bg-[#F6F5F3] dark:bg-[#2E2A27] hover:bg-[#E4E1DC] dark:hover:bg-[#3E3834] transition-colors text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleToggleStatus}
                className={`flex-1 py-2 rounded-lg font-semibold text-white transition-colors text-xs shadow-xs cursor-pointer ${
                  statusModal.user.isActive === false ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-red-700 hover:bg-red-800'
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
          <div className="absolute inset-0 bg-black/60 transition-opacity" onClick={() => setIsConfirmOpen(false)}></div>
          <div className="relative bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={22} />
            </div>
            <h3 className="text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] mb-1">Change User Role?</h3>
            <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mb-5 leading-relaxed">
              Are you sure you want to change <strong className="text-[#1F1D1B] dark:text-[#F6F5F3] font-semibold">{pendingRoleChange.userName}</strong>'s role from <br/>
              <span className="inline-block mt-1.5 px-2 py-0.5 bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] font-semibold text-xs rounded border border-[#E4E1DC] dark:border-[#2E2A27] uppercase tracking-wider">{pendingRoleChange.oldRole}</span> 
              <span className="mx-2 text-[#6B6761]">➔</span> 
              <span className="inline-block px-2 py-0.5 bg-[#9E2A2B]/10 dark:bg-[#9E2A2B]/20 text-[#9E2A2B] dark:text-[#D4AF37] font-semibold text-xs rounded border border-[#9E2A2B]/20 dark:border-[#9E2A2B]/30 uppercase tracking-wider">{pendingRoleChange.newRole}</span> ?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setIsConfirmOpen(false)} className="flex-1 py-2 rounded-lg font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] bg-[#F6F5F3] dark:bg-[#2E2A27] hover:bg-[#E4E1DC] dark:hover:bg-[#3E3834] transition-colors text-xs cursor-pointer">Cancel</button>
              <button onClick={confirmAndSaveRole} className="flex-1 py-2 rounded-lg font-semibold text-white bg-[#9E2A2B] hover:bg-[#7A1B22] transition-colors text-xs shadow-xs cursor-pointer">Yes, Change It</button>
            </div>
          </div>
        </div>
      )}

      {/* User details modal */}
      {isDetailsModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 transition-opacity" onClick={() => setIsDetailsModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-[#9E2A2B] p-5 text-center relative shrink-0 text-white">
              <button onClick={() => setIsDetailsModalOpen(false)} className="absolute top-3.5 right-3.5 text-white/80 hover:text-white p-1 rounded-md transition-colors cursor-pointer"><X size={18} /></button>
              <div className="relative inline-block mx-auto mb-2">
                <div className="w-16 h-16 bg-[#F6F5F3] rounded-full flex items-center justify-center shadow-xs border-2 border-[#D4AF37] overflow-hidden">
                  {selectedUser.profilePic ? <img src={selectedUser.profilePic} alt={selectedUser.name} className="w-full h-full object-cover" /> : <User className="text-[#6B6761]" size={30} />}
                </div>
                {modalActivity?.isOnline && (
                  <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-[#1C1917]"></span>
                  </span>
                )}
              </div>
              <h2 className="text-base font-semibold text-white">{selectedUser.name}</h2>
              <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[#D4AF37] text-xs font-semibold uppercase tracking-wider bg-black/25 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                  {selectedUser.role.replace('_', ' ')}
                </span>
                {modalActivity && (
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${modalActivity.badgeClass}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${modalActivity.dotClass}`}></span>
                    {modalActivity.statusText}
                  </span>
                )}
              </div>
            </div>

            {/* Scrollable details */}
            <div className="p-5 space-y-3.5 text-xs text-[#1F1D1B] dark:text-[#F6F5F3] overflow-y-auto flex-1">
              {/* Presence & Activity Status Info */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27]">
                <Activity className="text-emerald-600 dark:text-emerald-400 mt-0.5" size={16} />
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">Live Activity Status</p>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${modalActivity?.dotClass || 'bg-[#6B6761]'}`}></span>
                      {modalActivity?.statusText || 'Offline'}
                    </p>
                    <span className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
                      {selectedUser.lastActive ? `Last seen: ${new Date(selectedUser.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'No recent login'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27]">
                <MapPin className="text-[#6B6761] dark:text-[#A8A29E] mt-0.5" size={16} />
                <div>
                  <p className="text-[11px] font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">Barangay Address</p>
                  <p className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{selectedUser.address || 'Gasan, Marinduque'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27]">
                <Phone className="text-[#6B6761] dark:text-[#A8A29E] mt-0.5" size={16} />
                <div>
                  <p className="text-[11px] font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">Contact Details</p>
                  <p className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] font-mono">{selectedUser.contact}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27]">
                <Building2 className="text-[#6B6761] dark:text-[#A8A29E] mt-0.5" size={16} />
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">TODA Association</p>
                  <div className="mt-0.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-[#9E2A2B]/10 dark:bg-[#9E2A2B]/20 text-[#9E2A2B] dark:text-[#D4AF37] border border-[#9E2A2B]/20 dark:border-[#9E2A2B]/30">
                      {selectedUser.todaAssociation || 'NON-TODA'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27]">
                <ShieldCheck className="text-[#6B6761] dark:text-[#A8A29E] mt-0.5" size={16} />
                <div>
                  <p className="text-[11px] font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">Authentication / Verification</p>
                  <div className="mt-0.5">
                    {(selectedUser.authProvider === 'google' || selectedUser.googleId) ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0] dark:bg-[#052E16]/60 dark:text-[#4ADE80] dark:border-[#166534] text-xs font-medium">
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                        Verified using Google Login
                      </span>
                    ) : selectedUser.isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0] dark:bg-[#052E16]/60 dark:text-[#4ADE80] dark:border-[#166534] text-xs font-medium">
                        <ShieldCheck size={13} /> Verified (SMS / Local OTP)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB] dark:bg-[#1F2937]/60 dark:text-[#9CA3AF] dark:border-[#374151] text-xs font-medium">
                        Unverified Account
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27]">
                <Calendar className="text-[#6B6761] dark:text-[#A8A29E] mt-0.5" size={16} />
                <div>
                  <p className="text-[11px] font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">Date Registered</p>
                  <p className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{new Date(selectedUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              {selectedUser.isActive === false && (
                <div className="flex items-start gap-3 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50">
                  <ShieldAlert className="text-red-600 dark:text-red-400 mt-0.5" size={18} />
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider mb-1">Deactivation Reason</p>
                    <p className="text-xs font-medium text-red-900 dark:text-red-200 bg-white/60 dark:bg-black/20 p-2 rounded border border-red-100 dark:border-red-900/30">
                      {selectedUser.deactivationReason || 'No reason provided.'}
                    </p>

                    {selectedUser.appealStatus === 'pending' && selectedUser.appealMessage && (
                      <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-900/50">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Appeal Pending Review</p>
                        </div>
                        <p className="text-xs font-medium text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-900/50 italic">
                          "{selectedUser.appealMessage}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Assigned Tricycle Units / Fleet Section */}
              <div className="border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-3.5 bg-[#F6F5F3] dark:bg-[#14110F]">
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] uppercase tracking-wider">
                    Assigned Tricycle Units
                  </h4>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] text-[#1F1D1B] dark:text-[#F6F5F3]">
                    {selectedUser.unitsCount || 0} / 2 Units {(selectedUser.unitsCount || 0) >= 2 ? '(MAX)' : ''}
                  </span>
                </div>

                {selectedUser.units && selectedUser.units.length > 0 ? (
                  <div className="space-y-2">
                    {selectedUser.units.map((unit, idx) => (
                      <div key={unit._id || idx} className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-xs text-[#1F1D1B] dark:text-[#F6F5F3]">
                            Plate No: <span className="font-mono">{unit.plateNo || 'Pending Plate'}</span>
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] uppercase">
                            {unit.status || 'Active'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-[#6B6761] dark:text-[#A8A29E] pt-1 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
                          <div>
                            <span>Make/Model:</span>{' '}
                            <strong className="text-[#1F1D1B] dark:text-[#F6F5F3] font-semibold">{unit.make || unit.made || 'N/A'}</strong>
                          </div>
                          <div>
                            <span>TODA/Route:</span>{' '}
                            <strong className="text-[#9E2A2B] dark:text-[#D4AF37] font-semibold">{unit.todaName || (unit.zone ? formatZoneLabel(unit.zone) : 'N/A')}</strong>
                          </div>
                          <div>
                            <span>Motor No:</span>{' '}
                            <span className="font-mono text-[#1F1D1B] dark:text-[#F6F5F3]">{unit.motorNo || 'N/A'}</span>
                          </div>
                          <div>
                            <span>Chassis No:</span>{' '}
                            <span className="font-mono text-[#1F1D1B] dark:text-[#F6F5F3]">{unit.chassisNo || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3.5 text-center text-xs text-[#6B6761] dark:text-[#A8A29E] bg-white dark:bg-[#1C1917] rounded-lg border border-dashed border-[#E4E1DC] dark:border-[#2E2A27]">
                    No registered tricycle units under this operator.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] text-center shrink-0 rounded-b-lg">
              <button onClick={() => setIsDetailsModalOpen(false)} className="w-full bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] border border-[#E4E1DC] dark:border-[#2E2A27] font-semibold py-2 rounded-lg transition-colors text-xs cursor-pointer">Close Details</button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default UserManagement;
