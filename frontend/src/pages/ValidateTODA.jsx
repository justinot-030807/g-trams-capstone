import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { Users, FileText, CheckCircle, Search, Eye, FolderTree } from 'lucide-react';

const TODA_LIST = [
  "BATODA", "POB TODA", "NBI TODA", "GT TODA", "TIGUION TODA", "BANGBANG IPIL TODA", "TAB TODA", "LUG TODA", "MASIGA TODA", "4B TODA", "CT TODA", "TG TODA", "GC TODA", "MA TODA", "PG TODA", "MAT TODA", "DPAB TODA", "MGN TODA", "GSTODA", "GS TODA", "TTODA", "TC TODA", "NORTH TODA", "GASAN CENTRAL TODA", "BAHI TODA", "ILAYA TODA", "GTF TODA", "NON-TODA"
];

const ValidateTODA = () => {
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' o 'validations'
  
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Accordion State para sa Directory
  const [expandedToda, setExpandedToda] = useState(null);

  useEffect(() => {
    if (activeTab === 'validations') {
      fetchSubmissions();
    } else {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/toda/submissions', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (response.ok) setSubmissions(await response.json());
    } catch (error) { console.error(error); }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/auth', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (response.ok) {
        const allUsers = await response.json();
        // Kunin lang ang mga operators at toda presidents
        setUsers(allUsers.filter(u => u.role !== 'admin'));
      }
    } catch (error) { console.error(error); }
  };

  const handleApprove = async (id) => {
    try {
      const response = await fetch(`import.meta.env.VITE_API_URL'/api/v1/toda/approve/${id}`, {
        method: 'PUT', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        setSubmissions(submissions.map(sub => sub._id === id ? { ...sub, status: 'Approved' } : sub));
      } else { alert('Failed to approve list.'); }
    } catch (error) { alert('Cannot connect to server.'); }
  };

  // Logic para ma-group ang mga users per TODA
  const groupedToda = TODA_LIST.map(todaName => {
    return {
      name: todaName,
      members: users.filter(u => (u.todaAssociation || 'NON-TODA') === todaName)
    };
  }).filter(toda => toda.members.length > 0); // Ipakita lang yung mga TODA na may laman

  const filteredSubmissions = submissions.filter(sub => 
    sub.presidentName.toLowerCase().includes(searchQuery.toLowerCase()) || sub.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">TODA Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage TODA directories and validate masterlist submissions.</p>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* TABS */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button 
            onClick={() => { setActiveTab('directory'); setSearchQuery(''); }}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'directory' ? 'text-[#7A1B22] border-b-2 border-[#7A1B22] bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FolderTree size={18} /> Live Members Directory
          </button>
          <button 
            onClick={() => { setActiveTab('validations'); setSearchQuery(''); }}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'validations' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileText size={18} /> Document Validations
          </button>
        </div>

        {/* CONTENT PARA SA LIVE DIRECTORY */}
        {activeTab === 'directory' && (
          <div className="p-6">
            {groupedToda.length === 0 ? (
               <div className="text-center py-12 text-slate-500">
                 <Users size={32} className="mx-auto mb-3 opacity-30"/>
                 <p className="font-bold">No registered members yet.</p>
               </div>
            ) : (
              <div className="space-y-4">
                {groupedToda.map((toda) => (
                  <div key={toda.name} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <button 
                      onClick={() => setExpandedToda(expandedToda === toda.name ? null : toda.name)}
                      className="w-full bg-slate-50 hover:bg-slate-100 p-4 flex justify-between items-center transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#7A1B22] text-white font-bold rounded-lg flex items-center justify-center text-xs">
                          {toda.name.substring(0,3)}
                        </div>
                        <h3 className="font-bold text-slate-900 text-left">{toda.name}</h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold bg-white border border-slate-200 px-3 py-1 rounded-full text-slate-600">
                          {toda.members.length} Member{toda.members.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    </button>
                    
                    {/* EXPANDED TABLE */}
                    {expandedToda === toda.name && (
                      <div className="bg-white border-t border-slate-200 p-4">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                              <th className="py-2 px-3">Name</th>
                              <th className="py-2 px-3">Barangay</th>
                              <th className="py-2 px-3">Contact</th>
                              <th className="py-2 px-3">Role</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {toda.members.map(member => (
                              <tr key={member._id} className="text-sm text-slate-700 hover:bg-slate-50">
                                <td className="py-3 px-3 font-bold text-slate-900">{member.name}</td>
                                <td className="py-3 px-3">{member.address}</td>
                                <td className="py-3 px-3">{member.contact}</td>
                                <td className="py-3 px-3">
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${member.role === 'toda_president' ? 'bg-[#D4AF37]/20 text-[#7A1B22]' : 'bg-slate-100 text-slate-500'}`}>
                                    {member.role.replace('_', ' ')}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CONTENT PARA SA DOCUMENT VALIDATIONS (Yung luma mong file) */}
        {activeTab === 'validations' && (
          <>
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Search by TODA President or filename..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-[#7A1B22] focus:ring-2 focus:ring-[#7A1B22]/20 transition-all shadow-sm" />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="p-4 pl-6">Submitted By</th>
                    <th className="p-4">Document</th>
                    <th className="p-4">Date Submitted</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center pr-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.length === 0 ? (
                    <tr><td colSpan="5" className="p-12 text-center text-sm font-medium text-slate-500">No TODA member lists found.</td></tr>
                  ) : (
                    filteredSubmissions.map((sub) => (
                      <tr key={sub._id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4 pl-6"><p className="font-bold text-slate-900">{sub.presidentName}</p></td>
                        <td className="p-4"><div className="flex items-center gap-2 text-sm font-bold text-[#7A1B22]"><FileText size={16} /> {sub.fileName}</div></td>
                        <td className="p-4 text-sm font-semibold text-slate-600">{new Date(sub.createdAt).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${sub.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-center space-x-2 flex justify-center">
                          <a href={`import.meta.env.VITE_API_URL'/${sub.filePath}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-200">
                            <Eye size={14} /> View
                          </a>
                          <button onClick={() => handleApprove(sub._id)} disabled={sub.status === 'Approved'} className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${sub.status === 'Approved' ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
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