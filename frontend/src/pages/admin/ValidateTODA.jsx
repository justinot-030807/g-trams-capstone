import React, { useState, useEffect, useMemo } from 'react';
import { TODA_LIST } from '../../utils/constants';
import MainLayout from '../../components/MainLayout';
import { 
  Users, FileText, CheckCircle, CheckCircle2, Search, Eye, FolderTree,
  Building2, ShieldCheck, AlertCircle, AlertTriangle, Clock, ChevronDown,
  X
} from 'lucide-react';
import { AccordionListSkeleton, TableRowsSkeleton } from '../../components/skeleton';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';

const ValidateTODA = () => {
  const [activeTab, setActiveTab] = useState('directory');
  const [isLoading, setIsLoading] = useState(true);
  
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };
  
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
        const records = Array.isArray(data) ? data : (data.data || []);
        
        // Ensure oldest applications are on top (FIFO)
        const queue = records.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        setFranchises(queue);
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
        showToast('TODA member list approved successfully!', 'success');
      } else { 
        showToast('Failed to approve list.', 'error'); 
      }
    } catch (error) { 
      showToast('Cannot connect to server.', 'error'); 
    }
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
    franchises.filter(f => f.status === 'Pending' || f.status === 'For Signing' || f.status === 'Ready for Pickup').length;

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

      const totalCount = allMembersInToda.length;
      const activeCount = allMembersInToda.filter(m => getMemberFranchise(m)?.status === 'Active').length;
      const colorumCount = allMembersInToda.filter(m => {
        const f = getMemberFranchise(m);
        return !f || f.status === 'Expired' || f.status === 'Cancelled' || f.status === 'Revoked';
      }).length;
      const complianceRate = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;

      return {
        name: todaName,
        totalCount,
        activeCount,
        colorumCount,
        complianceRate,
        members: matchingMembers
      };
    }).filter(toda => toda.members.length > 0);
  }, [users, franchises, query, isSearching]);

  const filteredSubmissions = submissions.filter(sub => 
    (sub.presidentName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (sub.fileName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="w-full space-y-6 pb-24">
        {/* Page Header */}
        <PageHeader 
          title="TODA Management"
          subtitle="Manage recognized TODA directories, member rosters, and masterlist submissions."
        />

        {/* TODA Ecosystem Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total TODAs */}
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-3.5 sm:p-4 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 flex items-center justify-center text-[#9E2A2B] dark:text-[#D4AF37] shrink-0 border border-[#9E2A2B]/20 dark:border-[#D4AF37]/30">
              <Building2 size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E]">Recognized TODAs</p>
              <h3 className="text-xl sm:text-2xl font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] font-mono tabular-nums">
                {totalRecognizedTodas} <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 font-sans">Gasan</span>
              </h3>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] truncate">Official Associations</p>
            </div>
          </div>

          {/* Total Members */}
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-3.5 sm:p-4 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#F6F5F3] dark:bg-[#2E2A27] flex items-center justify-center text-[#1F1D1B] dark:text-[#F6F5F3] shrink-0 border border-[#E4E1DC] dark:border-[#3D3834]">
              <Users size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E]">Total Operators</p>
              <h3 className="text-xl sm:text-2xl font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] font-mono tabular-nums">
                {totalOperatorsCount}
              </h3>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] truncate">Registered in Directory</p>
            </div>
          </div>

          {/* Active MTOP & Compliance */}
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-3.5 sm:p-4 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0 border border-emerald-200 dark:border-emerald-800/40">
              <ShieldCheck size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E]">Active & Compliant</p>
              <h3 className="text-xl sm:text-2xl font-semibold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
                {activeMtopCount} <span className="text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] font-sans">({totalOperatorsCount > 0 ? Math.round((activeMtopCount / totalOperatorsCount) * 100) : 0}%)</span>
              </h3>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] truncate">Street-Legal Franchises</p>
            </div>
          </div>

          {/* Pending Validations */}
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-3.5 sm:p-4 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0 border border-amber-200 dark:border-amber-800/40">
              <Clock size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E]">Pending Actions</p>
              <h3 className="text-xl sm:text-2xl font-semibold text-amber-700 dark:text-amber-400 font-mono tabular-nums">
                {pendingValidationCount}
              </h3>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] truncate">Submissions & Reviews</p>
            </div>
          </div>
        </div>

        {/* Content Tabs & Main Card */}
        <div className="bg-white dark:bg-[#1C1917] rounded-lg shadow-xs border border-[#E4E1DC] dark:border-[#2E2A27] overflow-hidden transition-colors">
          {/* Tabs */}
          <div className="flex border-b border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F]">
            <button 
              onClick={() => { setActiveTab('directory'); setSearchQuery(''); }}
              className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'directory' 
                  ? 'text-[#9E2A2B] dark:text-[#D4AF37] border-b-2 border-[#9E2A2B] dark:border-[#D4AF37] bg-white dark:bg-[#1C1917]' 
                  : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
              }`}
            >
              <FolderTree size={16} /> Live Members Directory
            </button>
            <button 
              onClick={() => { setActiveTab('validations'); setSearchQuery(''); }}
              className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'validations' 
                  ? 'text-[#9E2A2B] dark:text-[#D4AF37] border-b-2 border-[#9E2A2B] dark:border-[#D4AF37] bg-white dark:bg-[#1C1917]' 
                  : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
              }`}
            >
              <FileText size={16} /> Document Validations
            </button>
          </div>

          {/* Live directory content */}
          {activeTab === 'directory' && (
            <div className="p-4 sm:p-6">
              {/* Search Bar */}
              <div className="mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1 max-w-xl">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6761] dark:text-[#A8A29E]" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search by driver name, plate no., barangay, motor no., or TODA..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="w-full bg-white dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg pl-9 pr-9 py-2 text-xs sm:text-sm font-medium text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] transition-colors" 
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6761] hover:text-[#1F1D1B] dark:text-[#A8A29E] dark:hover:text-[#F6F5F3] cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Directory Accordion List */}
              {isLoading ? (
                <AccordionListSkeleton count={5} baseDelay={30} stepDelay={45} />
              ) : groupedToda.length === 0 ? (
                <div className="text-center py-16 text-[#6B6761] dark:text-[#A8A29E] bg-[#F6F5F3]/50 dark:bg-[#14110F]/50 rounded-lg border border-dashed border-[#E4E1DC] dark:border-[#2E2A27]">
                  <Users size={32} className="mx-auto mb-2 opacity-40"/>
                  <p className="font-semibold text-xs sm:text-sm text-[#1F1D1B] dark:text-[#F6F5F3]">
                    {isSearching ? `No members or TODAs match "${searchQuery}"` : 'No registered members found yet.'}
                  </p>
                  {isSearching && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="mt-2 text-xs font-semibold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline cursor-pointer"
                    >
                      Reset Search Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {groupedToda.map((toda) => {
                    const isOpen = isSearching || expandedToda === toda.name;

                    return (
                      <div 
                        key={toda.name} 
                        className={`border rounded-lg overflow-hidden transition-colors ${
                          isOpen 
                            ? 'border-[#9E2A2B] dark:border-[#D4AF37]' 
                            : 'border-[#E4E1DC] dark:border-[#2E2A27] hover:border-[#9E2A2B]/40'
                        }`}
                      >
                        <button 
                          onClick={() => setExpandedToda(expandedToda === toda.name ? null : toda.name)}
                          className={`w-full p-3.5 sm:p-4 flex justify-between items-center transition-colors text-left cursor-pointer ${
                            isOpen 
                              ? 'bg-[#F6F5F3] dark:bg-[#2E2A27]/30' 
                              : 'bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3]/60 dark:hover:bg-[#14110F]/60'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 bg-[#9E2A2B] text-white font-semibold rounded-lg flex items-center justify-center text-xs shrink-0">
                              {toda.name.substring(0, 3)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] text-sm sm:text-base truncate">
                                {toda.name}
                              </h3>
                              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
                                {toda.members.length} {toda.members.length === 1 ? 'Driver' : 'Drivers'} 
                                {toda.totalCount !== toda.members.length && ` (filtered from ${toda.totalCount})`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap justify-end">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                              toda.complianceRate >= 80 
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' 
                                : toda.complianceRate >= 50 
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800' 
                                  : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800'
                            }`}>
                              {toda.complianceRate}% Compliant
                            </span>
                            {toda.colorumCount > 0 && (
                              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800/60" title={`${toda.colorumCount} driver(s) without active MTOP`}>
                                <AlertTriangle size={11} /> {toda.colorumCount} At-Risk
                              </span>
                            )}
                            <span className="text-xs font-semibold bg-white dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] px-2.5 py-0.5 rounded-lg text-[#1F1D1B] dark:text-[#F6F5F3] font-mono tabular-nums">
                              {toda.members.length}
                            </span>
                            <div className={`p-1 text-[#6B6761] dark:text-[#A8A29E] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                              <ChevronDown size={16} />
                            </div>
                          </div>
                        </button>
                        
                        {/* Member Roster Table */}
                        {isOpen && (
                          <div className="bg-white dark:bg-[#1C1917] border-t border-[#E4E1DC] dark:border-[#2E2A27] overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[650px]">
                              <thead>
                                <tr className="border-b border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] text-xs uppercase tracking-wider font-semibold bg-[#F6F5F3] dark:bg-[#14110F]">
                                  <th className="py-2.5 px-4">Operator / Driver</th>
                                  <th className="py-2.5 px-4">Barangay Address</th>
                                  <th className="py-2.5 px-4">Role</th>
                                  <th className="py-2.5 px-4">Tricycle & Franchise Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27]">
                                {toda.members.map(member => {
                                  const franchise = getMemberFranchise(member);

                                  return (
                                    <tr key={member._id} className="text-xs text-[#1F1D1B] dark:text-[#F6F5F3] hover:bg-[#F6F5F3]/50 dark:hover:bg-[#14110F]/50 transition-colors">
                                      {/* Name & Contact */}
                                      <td className="py-3 px-4">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-semibold text-sm text-[#1F1D1B] dark:text-[#F6F5F3]">
                                            {member.name}
                                          </span>
                                        </div>
                                        <div className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-mono mt-0.5">
                                          {member.contact || 'No contact'}
                                        </div>
                                      </td>

                                      {/* Barangay */}
                                      <td className="py-3 px-4 text-[#6B6761] dark:text-[#A8A29E]">
                                        {member.address || 'Gasan, Marinduque'}
                                      </td>

                                      {/* Role */}
                                      <td className="py-3 px-4">
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider border ${
                                          member.role === 'toda_president' 
                                            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800' 
                                            : 'bg-[#F6F5F3] dark:bg-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] border-[#E4E1DC] dark:border-[#3D3834]'
                                        }`}>
                                          {member.role === 'toda_president' ? 'TODA President' : 'Operator'}
                                        </span>
                                      </td>

                                      {/* Franchise Status Badge per Member */}
                                      <td className="py-3 px-4">
                                        {franchise ? (
                                          <div className="flex flex-col gap-1 items-start">
                                            <StatusBadge status={franchise.status} />
                                            <span className="text-xs font-mono text-[#6B6761] dark:text-[#A8A29E]">
                                              Plate: {franchise.plateNo || 'PENDING'} &bull; {franchise.make || 'Tricycle'}
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="inline-flex items-center text-xs text-[#6B6761] dark:text-[#A8A29E]">
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
              <div className="p-4 sm:p-5 border-b border-[#E4E1DC] dark:border-[#2E2A27] flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#F6F5F3] dark:bg-[#14110F]">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6761] dark:text-[#A8A29E]" size={15} />
                  <input 
                    type="text" 
                    placeholder="Search by TODA President or filename..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="w-full bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg pl-9 pr-3.5 py-1.5 text-xs sm:text-sm font-medium text-[#1F1D1B] dark:text-[#F6F5F3] placeholder-[#6B6761] dark:placeholder-[#A8A29E] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] transition-colors" 
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] text-xs uppercase tracking-wider font-semibold">
                      <th className="p-3.5 pl-5">Submitted By</th>
                      <th className="p-3.5">Document</th>
                      <th className="p-3.5">Date Submitted</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-center pr-5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27] text-xs">
                    {isLoading ? (
                      <TableRowsSkeleton rows={4} columns={5} baseDelay={30} stepDelay={45} />
                    ) : filteredSubmissions.length === 0 ? (
                      <tr><td colSpan="5" className="p-12 text-center text-xs text-[#6B6761] dark:text-[#A8A29E]">No TODA member lists found.</td></tr>
                    ) : (
                      filteredSubmissions.map((sub) => (
                        <tr 
                          key={sub._id} 
                          className="hover:bg-[#F6F5F3]/50 dark:hover:bg-[#14110F]/50 transition-colors"
                        >
                          <td className="p-3.5 pl-5"><p className="font-semibold text-sm text-[#1F1D1B] dark:text-[#F6F5F3]">{sub.presidentName}</p></td>
                          <td className="p-3.5"><div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#1F1D1B] dark:text-[#F6F5F3]"><FileText size={15} className="text-[#9E2A2B] dark:text-[#D4AF37]" /> {sub.fileName}</div></td>
                          <td className="p-3.5 text-xs text-[#6B6761] dark:text-[#A8A29E] font-mono tabular-nums">{new Date(sub.createdAt).toLocaleDateString()}</td>
                          <td className="p-3.5">
                            <StatusBadge status={sub.status === 'Approved' ? 'Active' : 'Pending'} label={sub.status} />
                          </td>
                          <td className="p-3.5 pr-5 text-center space-x-2 flex justify-center">
                            {(() => {
                              const fileUrl = sub.filePath?.startsWith('http') ? sub.filePath : `${import.meta.env.VITE_API_URL}/${sub.filePath}`;
                              return (
                                <a 
                                  href={fileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] text-xs font-medium rounded-lg transition-colors border border-[#E4E1DC] dark:border-[#2E2A27]"
                                >
                                  <Eye size={13} /> View
                                </a>
                              );
                            })()}
                            <button 
                              onClick={() => handleApprove(sub._id)} 
                              disabled={sub.status === 'Approved'} 
                              className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                                sub.status === 'Approved' 
                                  ? 'bg-[#F6F5F3] dark:bg-[#14110F] text-[#6B6761] dark:text-[#A8A29E] border-[#E4E1DC] dark:border-[#2E2A27] cursor-not-allowed' 
                                  : 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-700 cursor-pointer'
                              }`}
                            >
                              <CheckCircle size={13} /> {sub.status === 'Approved' ? 'Approved' : 'Approve'}
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
      </div>

      {/* Floating Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none">
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xl rounded-lg px-4 py-3 flex items-center gap-3 max-w-sm">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
              toast.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400'
                : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400'
            }`}>
              {toast.type === 'error' ? (
                <AlertCircle size={14} />
              ) : (
                <CheckCircle2 size={14} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] leading-snug">
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default ValidateTODA;
