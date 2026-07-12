import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { FileText, Search, Filter, Archive, ArchiveRestore, CheckCircle, Clock, AlertCircle, Loader2, X } from 'lucide-react';

const FranchiseMasterlist = () => {
  const [franchises, setFranchises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('active'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, data: null });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchFranchises();
  }, [activeTab]);

  const fetchFranchises = async () => {
    setIsLoading(true);
    try {
     const url = `${import.meta.env.VITE_API_URL}/api/v1/franchises?archived=${activeTab === 'archived'}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFranchises(data);
      }
    } catch (error) {
      console.error('Error fetching masterlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initiateToggleArchive = (id, currentName) => {
    const actionType = activeTab === 'active' ? 'Archive' : 'Restore';
    setConfirmModal({
      isOpen: true,
      data: { id, name: currentName, action: actionType }
    });
  };

  const confirmAction = async () => {
    if (!confirmModal.data) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/${confirmModal.data.id}/archive`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        setConfirmModal({ isOpen: false, data: null });
        setSuccessMessage(`Successfully ${confirmModal.data.action}d!`);
        fetchFranchises(); 
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        alert(`Failed: ${errorData.message || 'Route not found. Make sure backend is running.'}`);
        setConfirmModal({ isOpen: false, data: null });
      }
    } catch (error) {
      alert('Network Error. Please check your connection.');
      setConfirmModal({ isOpen: false, data: null });
    }
  };

  // SMART FILTER (hinahanap din yung pangalan ng operator kung blangko yung fullName)
  const filteredFranchises = franchises.filter(f => {
    const nameToMatch = f.fullName || (f.operator ? f.operator.name : '');
    const matchesSearch = 
      (nameToMatch.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (f.plateNo?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (f.motorNo?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <MainLayout>
      <header className="mb-8 flex flex-col sm:flex-row justify-between sm:items-end gap-4 relative">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Franchise Masterlist</h1>
          <p className="text-sm text-slate-500 mt-1">Manage, search, and archive operator records.</p>
        </div>

        {successMessage && (
          <div className="absolute top-0 right-0 bg-emerald-500 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2">
            <CheckCircle size={18} />
            <span className="font-bold text-sm">{successMessage}</span>
          </div>
        )}
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* TABS */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button 
            onClick={() => { setActiveTab('active'); setSearchQuery(''); setStatusFilter('All'); }}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'active' ? 'text-[#7A1B22] border-b-2 border-[#7A1B22] bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileText size={18} /> Active Records
          </button>
          <button 
            onClick={() => { setActiveTab('archived'); setSearchQuery(''); setStatusFilter('All'); }}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'archived' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Archive size={18} /> Archives
          </button>
        </div>

        {/* SEARCH AND FILTER */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-white">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, plate, or motor no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#7A1B22] focus:ring-2 focus:ring-[#7A1B22]/20 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="text-slate-400" size={18} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none cursor-pointer focus:border-[#7A1B22]"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Expired">Expired</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="animate-spin text-[#7A1B22]" size={32} />
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                  <th className="p-4 pl-6">Operator Details</th>
                  <th className="p-4">Tricycle Info</th>
                  <th className="p-4">TODA / Zone</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFranchises.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        {activeTab === 'archived' ? <Archive size={40} className="text-slate-300 mb-3"/> : <FileText size={40} className="text-slate-300 mb-3"/>}
                        <p className="font-bold text-lg text-slate-700">No records found</p>
                        <p className="text-sm mt-1">Try adjusting your search or filter settings.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredFranchises.map((f) => {
                    // FIX: Kukunin ang Operator name kung sakaling walang laman ang fullName
                    const displayName = f.fullName || (f.operator ? f.operator.name : 'Unknown Operator');
                    
                    return (
                      <tr key={f._id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 pl-6">
                          <p className="font-bold text-slate-900">{displayName}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{f.address}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-black text-slate-800 tracking-wider bg-yellow-100 inline-block px-2 py-0.5 border border-yellow-300 rounded mb-1 text-xs">
                            {f.plateNo || 'N/A'}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium">Motor: {f.motorNo}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800 text-sm">{f.todaName}</p>
                          <p className="text-xs text-slate-500">Zone {f.zone}</p>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider border ${
                            f.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            f.status === 'Expired' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            f.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {f.status === 'Active' && <CheckCircle size={12}/>}
                            {f.status === 'Pending' && <Clock size={12}/>}
                            {(f.status === 'Cancelled' || f.status === 'Expired') && <AlertCircle size={12}/>}
                            {f.status}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-center">
                          <button 
                            onClick={() => initiateToggleArchive(f._id, displayName)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${
                              activeTab === 'active' 
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
                              : 'bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#7A1B22] border-[#D4AF37]/30'
                            }`}
                          >
                            {activeTab === 'active' ? (
                              <><Archive size={14} /> Archive</>
                            ) : (
                              <><ArchiveRestore size={14} /> Restore</>
                            )}
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* --- CUSTOM CONFIRMATION MODAL --- */}
      {confirmModal.isOpen && confirmModal.data && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setConfirmModal({ isOpen: false, data: null })}
          ></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setConfirmModal({ isOpen: false, data: null })}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border-4 border-white ${
              confirmModal.data.action === 'Archive' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {confirmModal.data.action === 'Archive' ? <Archive size={28} /> : <ArchiveRestore size={28} />}
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {confirmModal.data.action} Record?
            </h3>
            
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to {confirmModal.data.action.toLowerCase()} the franchise record of <strong className="text-slate-800">{confirmModal.data.name}</strong>?
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmModal({ isOpen: false, data: null })}
                className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={confirmAction}
                className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors text-sm shadow-sm ${
                  confirmModal.data.action === 'Archive' ? 'bg-[#7A1B22] hover:bg-[#5A1419]' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Yes, {confirmModal.data.action}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default FranchiseMasterlist;