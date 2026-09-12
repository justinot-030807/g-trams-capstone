import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout';
import { 
  Users, Search, Info, MapPin, Phone, Calendar, ShieldCheck, X, 
  AlertTriangle, User, UserMinus, UserCheck, ShieldAlert,
  Clock, Activity, RefreshCw, Radio, Building2, CheckCircle2,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { TableRowsSkeleton } from '../../components/skeleton';

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

      // Fetch users and masterlist franchises in parallel
      const [usersRes, franchisesRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/auth?_t=${Date.now()}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          cache: 'no-store'
        }),
        fetch(`${baseUrl}/api/v1/franchises?limit=2000&archived=false`, {
          headers: { 'Authorization': `Bearer ${token}` },
          cache: 'no-store'
        }).catch(() => null)
      ]);

      const data = await usersRes.json();
      let franchisesList = [];
      if (franchisesRes && franchisesRes.ok) {
        try {
          const fData = await franchisesRes.json();
          franchisesList = Array.isArray(fData) ? fData : (fData.data || []);
        } catch {}
      }

      if (usersRes.ok && Array.isArray(data)) {
        // Cross-reference masterlist franchises with users to guarantee 100% accurate units count
        const enhancedUsers = data.map(user => {
          const uId = String(user._id || '');
          const uName = String(user.name || '').trim().toLowerCase();
          const uContact = String(user.contact || '').trim().toLowerCase();

          const matchedFranchises = franchisesList.filter(f => {
            const opId = f.operator?._id ? String(f.operator._id) : (f.operator ? String(f.operator) : '');
            if (opId && opId === uId) return true;
            if (f.fullName && uName && f.fullName.trim().toLowerCase() === uName) return true;
            const opContact = f.operator?.contact ? String(f.operator.contact).trim().toLowerCase() : '';
            if (opContact && uContact && opContact === uContact) return true;
            return false;
          });

          // Format unit objects consistently
          const formattedMatched = matchedFranchises.map(f => ({
            _id: f._id,
            plateNo: f.plateNo,
            make: f.make,
            made: f.made,
            motorNo: f.motorNo,
            chassisNo: f.chassisNo,
            status: f.status,
            zone: f.zone,
            todaName: f.todaName
          }));

          const userUnits = (user.units && user.units.length > 0) ? user.units : formattedMatched;
          const unitsCount = userUnits.length;
          const activeUnitsCount = userUnits.filter(u => u.status === 'Active').length;
          const pendingUnitsCount = userUnits.filter(u => u.status === 'Pending' || u.status === 'Ready for Pickup').length;
          const expiredUnitsCount = userUnits.filter(u => u.status === 'Expired').length;
          const cancelledUnitsCount = userUnits.filter(u => u.status === 'Cancelled' || u.status === 'Revoked').length;

          return {
            ...user,
            units: userUnits,
            unitsCount,
            activeUnitsCount,
            pendingUnitsCount,
            expiredUnitsCount,
            cancelledUnitsCount
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
  const onlineUsersCount = users.filter(u => getActivityStatus(u).isOnline).length;

  const filteredUsers = users.filter(user => {
    // Role filter
    const r = (user.role || '').toLowerCase();
    if (roleFilter === 'operator' && r !== 'operator' && r !== '') return false;
    if (roleFilter === 'toda_president' && r !== 'toda_president' && r !== 'toda president') return false;
    if (roleFilter === 'admin' && r !== 'admin' && r !== 'administrator') return false;
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
      <header className="mb-6 bg-gradient-to-br from-[#681419] via-[#7A1B22] to-[#3a0b0f] dark:from-[#0d121f] dark:via-[#1e0e15] dark:to-[#0a0d16] rounded-2xl p-4 sm:px-6 sm:py-5 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-4 border border-[#D4AF37]/30 transition-all">
        <div className="relative z-10 flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/15 flex items-center justify-center shrink-0 shadow-sm">
             <User size={20} className="text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">User Management</h1>
            <p className="text-white/75 dark:text-slate-400 font-medium text-[11px] sm:text-xs max-w-xl">
              Manage operators, roles, fleet capacities, and live account activity.
            </p>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col md:flex-row justify-end items-center gap-2.5 flex-wrap">
          {/* Live Online Counter */}
          <button
            onClick={() => setRoleFilter(roleFilter === 'online' ? 'all' : 'online')}
            title="Click to filter online users"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs border transition-all cursor-pointer shadow-2xs ${
              roleFilter === 'online'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-950/70'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{onlineUsersCount} Online Now</span>
          </button>

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
            className="p-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#7A1B22] dark:hover:text-[#D4AF37] rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin text-[#7A1B22] dark:text-[#D4AF37]" : ""} />
          </button>
        </div>

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setRoleFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
            roleFilter === 'all'
              ? 'bg-[#7A1B22] text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#7A1B22]'
          }`}
        >
          All Users ({allCount})
        </button>
        <button
          onClick={() => setRoleFilter('operator')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
            roleFilter === 'operator'
              ? 'bg-[#7A1B22] text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#7A1B22]'
          }`}
        >
          Operators ({operatorCount})
        </button>
        <button
          onClick={() => setRoleFilter('toda_president')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
            roleFilter === 'toda_president'
              ? 'bg-[#7A1B22] text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#7A1B22]'
          }`}
        >
          TODA Presidents ({todaPresidentCount})
        </button>
        <button
          onClick={() => setRoleFilter('admin')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
            roleFilter === 'admin'
              ? 'bg-[#7A1B22] text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#7A1B22]'
          }`}
        >
          Administrators ({adminCount})
        </button>
        <button
          onClick={() => setRoleFilter('online')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            roleFilter === 'online'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Online ({onlineUsersCount})
        </button>
      </div>

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
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
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
              ) : sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
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

                      {/* Units / Fleet (Compact Badge - No Logo) */}
                      <td className="py-3 px-3 text-center">
                        {isAdminUser ? (
                          <span className="text-slate-400 dark:text-slate-500 font-bold">—</span>
                        ) : (
                          <button 
                            onClick={() => openDetailsModal(user)}
                            title="Click to view registered units"
                            className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold border shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                              isMaxUnits 
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 hover:bg-amber-100'
                                : unitsCount === 1
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60 hover:bg-blue-100'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <span>{unitsCount}/2</span>
                            {isMaxUnits && <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 ml-1">MAX</span>}
                          </button>
                        )}
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
                        {isAdminUser ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#7A1B22]/10 dark:bg-[#7A1B22]/25 text-[#7A1B22] dark:text-[#D4AF37] border border-[#7A1B22]/20 dark:border-[#7A1B22]/40">
                            Administrator
                          </span>
                        ) : (
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
                        )}
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

                        {isAdminUser ? (
                          <span className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                            Protected
                          </span>
                        ) : (
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
          <div className="px-4 py-3 sm:px-6 bg-slate-50/80 dark:bg-slate-800/60 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium flex-wrap justify-center sm:justify-start">
              <span>Showing</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{startIndex + 1}</span>
              <span>to</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{endIndex}</span>
              <span>of</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{totalUsers}</span>
              <span>users</span>

              <span className="mx-1 text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <span className="text-[11px]">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#7A1B22] dark:focus:border-[#D4AF37] cursor-pointer"
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
                className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
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
                        <span key={item} className="px-1.5 text-slate-400 select-none">
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
                        className={`min-w-[30px] h-[30px] rounded-lg font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-950 shadow-xs'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
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
                className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
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
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Are you sure you want to {statusModal.user.isActive === false ? 'restore access for ' : 'revoke system access from '} 
              <strong className="text-slate-800 dark:text-slate-200">{statusModal.user.name}</strong>?
              {statusModal.user.isActive !== false && <span className="block mt-2 text-xs text-red-500 font-medium">This will prevent the user from logging in.</span>}
            </p>

            {statusModal.user.isActive !== false && (
              <div className="mb-6 text-left">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Reason for Deactivation
                </label>
                <textarea
                  value={deactivateReason}
                  onChange={(e) => setDeactivateReason(e.target.value)}
                  placeholder="Enter reason..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-4 focus:ring-[#7A1B22]/10 transition-all min-h-[80px] resize-none"
                  required
                />
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => { setStatusModal({ isOpen: false, user: null }); setDeactivateReason(''); }}
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

              {selectedUser.isActive === false && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50">
                  <ShieldAlert className="text-red-500 mt-0.5" size={20} />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-1">Deactivation Reason</p>
                    <p className="text-sm font-medium text-red-900 dark:text-red-200 bg-white/50 dark:bg-black/20 p-2.5 rounded-lg border border-red-100 dark:border-red-900/30">
                      {selectedUser.deactivationReason || 'No reason provided.'}
                    </p>

                    {selectedUser.appealStatus === 'pending' && selectedUser.appealMessage && (
                      <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-900/50">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Appeal Pending Review</p>
                        </div>
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/50 italic">
                          "{selectedUser.appealMessage}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Assigned Tricycle Units / Fleet Section */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#7A1B22] dark:bg-[#D4AF37]"></span>
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