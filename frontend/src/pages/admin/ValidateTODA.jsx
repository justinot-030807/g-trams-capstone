import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '../../components/MainLayout';
import { 
  Users, FileText, CheckCircle, CheckCircle2, Search, Eye, FolderTree,
  Building2, ShieldCheck, AlertCircle, Clock, ChevronDown, ChevronRight,
  Car, Sparkles, X, Check
} from 'lucide-react';
import { AccordionListSkeleton, TableRowsSkeleton } from '../../components/skeleton';

const TODA_LIST = [
  "BATODA", "POB TODA", "NBI TODA", "GT TODA", "TIGUION TODA", "BANGBANG IPIL TODA", "TAB TODA", "LUG TODA", "MASIGA TODA", "4B TODA", "CT TODA", "TG TODA", "GC TODA", "MA TODA", "PG TODA", "MAT TODA", "DPAB TODA", "MGN TODA", "GSTODA", "GS TODA", "TTODA", "TC TODA", "NORTH TODA", "GASAN CENTRAL TODA", "BAHI TODA", "ILAYA TODA", "GTF TODA", "NON-TODA"
];

const ValidateTODA = () => {
  const [activeTab, setActiveTab] = useState('directory');
  const [isLoading, setIsLoading] = useState(true);
  
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [franchises, setFranchises] = useState([]);
  
  // Accordion state for directory
  const [expandedToda, setExpandedToda] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.allSettled([
        fetchSubmissions(),
        fetchUsers(),
        fetchFranchises()
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/toda/submissions', { 
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } 
      });
      if (response.ok) setSubmissions(await response.json());
    } catch (error) { 
      console.error('Error fetching TODA submissions:', error); 
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/auth', { 
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } 
      });
      if (response.ok) {
        const allUsers = await response.json();
        // Filter out admin users
        setUsers(allUsers.filter(u => u.role !== 'admin'));
      }
    } catch (error) { 
      console.error('Error fetching users:', error); 
    }
  };

  const fetchFranchises = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises?limit=2000`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFranchises(data.data || (Array.isArray(data) ? data : []));
      }
    } catch (error) {
      console.error('Error fetching franchises:', error);
    }
  };

  const handleApprove = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/toda/approve/${id}`, {
        method: 'PUT', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        setSubmissions(submissions.map(sub => sub._id === id ? { ...sub, status: 'Approved' } : sub));
      } else { alert('Failed to approve list.'); }
    } catch (error) { alert('Cannot connect to server.'); }
  };

  // Helper to find a member's corresponding franchise record
  const getMemberFranchise = (member) => {
    if (!member || !franchises.length) return null;
    const mId = String(member._id || '');
    const mName = (member.name || '').trim().toLowerCase();
    return franchises.find(f => {
      const opId = f.operator?._id ? String(f.operator._id) : (f.operator ? String(f.operator) : '');
      if (opId && opId === mId) return true;
      if (f.fullName && f.fullName.trim().toLowerCase() === mName) return true;
      return false;
    });
  };

  // KPI Stats Strip calculations
  const totalRecognizedTodas = TODA_LIST.filter(t => t !== 'NON-TODA').length;
  const totalOperatorsCount = users.length;
  const activeMtopCount = franchises.filter(f => f.status === 'Active').length;
  const pendingValidationCount = submissions.filter(s => s.status !== 'Approved').length + 
    franchises.filter(f => f.status === 'Pending' || f.status === 'Ready for Pickup').length;

  // Unified Smart Search & TODA Grouping
  const query = searchQuery.trim().toLowerCase();
  const isSearching = query.length > 0;

  const groupedToda = useMemo(() => {
    return TODA_LIST.map(todaName => {
      const todaMatchesQuery = isSearching && todaName.toLowerCase().includes(query);
      
      const allMembersInToda = users.filter(u => (u.todaAssociation || 'NON-TODA') === todaName);
      
      const matchingMembers = allMembersInToda.filter(member => {
        if (!isSearching) return true;
        if (todaMatchesQuery) return true;
        
        const nameMatch = (member.name || '').toLowerCase().includes(query);
        const addressMatch = (member.address || '').toLowerCase().includes(query);
        const contactMatch = (member.contact || '').toLowerCase().includes(query);
        
        const franchise = getMemberFranchise(member);
        const plateMatch = franchise?.plateNo?.toLowerCase().includes(query);
        const motorMatch = franchise?.motorNo?.toLowerCase().includes(query);
        
        return nameMatch || addressMatch || contactMatch || plateMatch || motorMatch;
      });

      return {
        name: todaName,
        totalCount: allMembersInToda.length,
        members: matchingMembers
      };
    }).filter(toda => toda.members.length > 0);
  }, [users, franchises, query, isSearching]);

  // Total matching members count across all TODAs
  const totalMatchingMembers = groupedToda.reduce((acc, toda) => acc + toda.members.length, 0);

  const filteredSubmissions = submissions.filter(sub => 
    (sub.presidentName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (sub.fileName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      {/* PAGE HEADER */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-[#7A1B22] rounded-full" />
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">TODA Management</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage recognized TODA directories, member rosters, and masterlist submissions.</p>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 📊 ITEM 1: TODA ECOSYSTEM STATS STRIP */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        
        {/* Total TODAs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-3.5 transition-all hover:border-[#7A1B22]/30 dark:hover:border-[#D4AF37]/30">
          <div className="w-11 h-11 rounded-2xl bg-[#7A1B22]/10 dark:bg-[#7A1B22]/20 flex items-center justify-center text-[#7A1B22] dark:text-[#D4AF37] shrink-0 border border-[#7A1B22]/20">
            <Building2 size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Recognized TODAs</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalRecognizedTodas} <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-sans">100% Gasan</span>
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Official Associations</p>
          </div>
        </div>

        {/* Total Members */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-3.5 transition-all hover:border-[#7A1B22]/30 dark:hover:border-[#D4AF37]/30">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 border border-blue-200 dark:border-blue-800/40">
            <Users size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Operators</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalOperatorsCount}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Registered in Directory</p>
          </div>
        </div>

        {/* Active MTOP */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-3.5 transition-all hover:border-emerald-500/30">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-200 dark:border-emerald-800/40">
            <ShieldCheck size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active MTOPs</p>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {activeMtopCount}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Street-Legal Franchises</p>
          </div>
        </div>

        {/* Pending Validations */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-3.5 transition-all hover:border-amber-500/30">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 border border-amber-200 dark:border-amber-800/40">
            <Clock size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Actions</p>
            <h3 className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {pendingValidationCount}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Submissions & Reviews</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        {/* TABS */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80">
          <button 
            onClick={() => { setActiveTab('directory'); setSearchQuery(''); }}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'directory' ? 'text-[#7A1B22] dark:text-[#D4AF37] border-b-2 border-[#7A1B22] dark:border-[#D4AF37] bg-white dark:bg-slate-900' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FolderTree size={18} /> Live Members Directory
          </button>
          <button 
            onClick={() => { setActiveTab('validations'); setSearchQuery(''); }}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'validations' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] bg-white dark:bg-slate-900' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText size={18} /> Document Validations
          </button>
        </div>

        {/* Live directory content */}
        {activeTab === 'directory' && (
          <div className="p-5 sm:p-6">
            
            {/* ========================================================================= */}
            {/* 🔍 ITEM 2: UNIFIED SMART SEARCH BAR & ACCORDION CONTROLS */}
            {/* ========================================================================= */}
            <div className="mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by driver name, plate no., barangay, motor no., or TODA..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-[#7A1B22] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-[#7A1B22]/15 transition-all shadow-xs" 
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
                    title="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Match Feedback Badge */}
              {isSearching && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7A1B22]/10 text-[#7A1B22] dark:bg-[#D4AF37]/15 dark:text-[#D4AF37] border border-[#7A1B22]/20 dark:border-[#D4AF37]/30 text-xs font-bold animate-in fade-in">
                  <Sparkles size={14} />
                  <span>
                    Found {totalMatchingMembers} driver{totalMatchingMembers === 1 ? '' : 's'} across {groupedToda.length} TODA{groupedToda.length === 1 ? '' : 's'}
                  </span>
                </div>
              )}
            </div>

            {isLoading ? (
              <AccordionListSkeleton count={5} baseDelay={30} stepDelay={45} />
            ) : groupedToda.length === 0 ? (
               <div className="text-center py-16 text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                 <Users size={36} className="mx-auto mb-3 opacity-30"/>
                 <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                   {isSearching ? `No members or TODAs match "${searchQuery}"` : 'No registered members found yet.'}
                 </p>
                 {isSearching && (
                   <button 
                     onClick={() => setSearchQuery('')}
                     className="mt-3 text-xs font-bold text-[#7A1B22] dark:text-[#D4AF37] hover:underline"
                   >
                     Reset Search Filters
                   </button>
                 )}
               </div>
            ) : (
              <div className="space-y-3.5">
                {groupedToda.map((toda, tIdx) => {
                  const isOpen = isSearching || expandedToda === toda.name;

                  return (
                    <div 
                      key={toda.name} 
                      className={`border rounded-2xl overflow-hidden shadow-xs transition-all ${
                        isOpen 
                          ? 'border-[#7A1B22]/40 dark:border-[#D4AF37]/40 ring-1 ring-[#7A1B22]/10 dark:ring-[#D4AF37]/10' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                      style={{ animationDelay: `${tIdx * 30}ms` }}
                    >
                      <button 
                        onClick={() => setExpandedToda(expandedToda === toda.name ? null : toda.name)}
                        className={`w-full p-4 flex justify-between items-center transition-colors text-left ${
                          isOpen 
                            ? 'bg-slate-100/70 dark:bg-slate-800' 
                            : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100/60 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#7A1B22] to-[#5A1419] text-white font-black rounded-xl flex items-center justify-center text-xs shadow-xs shrink-0 border border-[#D4AF37]/30">
                            {toda.name.substring(0, 3)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base truncate">
                              {toda.name}
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {toda.members.length} {toda.members.length === 1 ? 'Driver' : 'Drivers'} 
                              {toda.totalCount !== toda.members.length && ` (filtered from ${toda.totalCount})`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full text-slate-700 dark:text-slate-300 shadow-2xs">
                            {toda.members.length} Member{toda.members.length > 1 ? 's' : ''}
                          </span>
                          <div className={`p-1 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-slate-600 dark:text-slate-200' : ''}`}>
                            <ChevronDown size={18} />
                          </div>
                        </div>
                      </button>
                      
                      {/* ========================================================================= */}
                      {/* 🛵 ITEM 4: MEMBER ROSTER WITH LIVE FRANCHISE STATUS BADGES */}
                      {/* ========================================================================= */}
                      {isOpen && (
                        <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[650px]">
                            <thead>
                              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-bold bg-slate-50/50 dark:bg-slate-800/40">
                                <th className="py-2.5 px-4">Operator / Driver</th>
                                <th className="py-2.5 px-4">Barangay Address</th>
                                <th className="py-2.5 px-4">Role</th>
                                <th className="py-2.5 px-4">Tricycle & Franchise MTOP Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                              {toda.members.map(member => {
                                const franchise = getMemberFranchise(member);

                                return (
                                  <tr key={member._id} className="text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                    {/* Name & Contact */}
                                    <td className="py-3 px-4">
                                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                                        {member.name}
                                      </div>
                                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                        {member.contact || 'No contact'}
                                      </div>
                                    </td>

                                    {/* Barangay */}
                                    <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-300">
                                      {member.address || 'Gasan, Marinduque'}
                                    </td>

                                    {/* Role */}
                                    <td className="py-3 px-4">
                                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                        member.role === 'toda_president' 
                                          ? 'bg-[#D4AF37]/20 dark:bg-[#D4AF37]/30 text-[#7A1B22] dark:text-[#D4AF37] border border-[#D4AF37]/40' 
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                      }`}>
                                        {member.role === 'toda_president' ? 'TODA President' : 'Operator'}
                                      </span>
                                    </td>

                                    {/* Franchise Status Badge per Member */}
                                    <td className="py-3 px-4">
                                      {franchise ? (
                                        franchise.status === 'Active' ? (
                                          <div className="flex flex-col gap-0.5">
                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 w-fit">
                                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                              Active MTOP
                                            </span>
                                            <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200">
                                              Plate: {franchise.plateNo || 'N/A'} &bull; <span className="font-sans font-medium text-slate-500 dark:text-slate-400">{franchise.make || 'Tricycle'}</span>
                                            </span>
                                          </div>
                                        ) : franchise.status === 'Pending' || franchise.status === 'Ready for Pickup' ? (
                                          <div className="flex flex-col gap-0.5">
                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 w-fit">
                                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                              {franchise.status === 'Ready for Pickup' ? 'Awaiting Release' : 'Pending MTOP'}
                                            </span>
                                            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                              Plate: {franchise.plateNo || 'PENDING'}
                                            </span>
                                          </div>
                                        ) : franchise.status === 'Expired' ? (
                                          <div className="flex flex-col gap-0.5">
                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60 w-fit">
                                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                              Expired MTOP
                                            </span>
                                            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                              Plate: {franchise.plateNo || 'N/A'}
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 w-fit">
                                            {franchise.status}
                                          </span>
                                        )
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 w-fit">
                                          No Franchise Record
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Document validations content */}
        {activeTab === 'validations' && (
          <>
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-800/60">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Search by TODA President or filename..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-[#7A1B22] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-[#7A1B22]/20 transition-all shadow-sm" />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">
                    <th className="p-4 pl-6">Submitted By</th>
                    <th className="p-4">Document</th>
                    <th className="p-4">Date Submitted</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center pr-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {isLoading ? (
                    <TableRowsSkeleton rows={4} columns={5} baseDelay={30} stepDelay={45} />
                  ) : filteredSubmissions.length === 0 ? (
                    <tr><td colSpan="5" className="p-12 text-center text-sm font-medium text-slate-500 dark:text-slate-400">No TODA member lists found.</td></tr>
                  ) : (
                    filteredSubmissions.map((sub, sIdx) => (
                      <tr 
                        key={sub._id} 
                        className="stagger-reveal hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                        style={{ animationDelay: `${sIdx * 35}ms` }}
                      >
                        <td className="p-4 pl-6"><p className="font-bold text-slate-900 dark:text-white">{sub.presidentName}</p></td>
                        <td className="p-4"><div className="flex items-center gap-2 text-sm font-bold text-[#7A1B22] dark:text-[#D4AF37]"><FileText size={16} /> {sub.fileName}</div></td>
                        <td className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">{new Date(sub.createdAt).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${sub.status === 'Approved' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-center space-x-2 flex justify-center">
                         <a href={`${import.meta.env.VITE_API_URL}/${sub.filePath}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
                            <Eye size={14} /> View
                          </a>
                          <button onClick={() => handleApprove(sub._id)} disabled={sub.status === 'Approved'} className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${sub.status === 'Approved' ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed' : 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'}`}>
                            <CheckCircle size={14} /> {sub.status === 'Approved' ? 'Approved' : 'Approve'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default ValidateTODA;