import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { Users, Search, Info, MapPin, Phone, Calendar, ShieldCheck, X, AlertTriangle, User, UserMinus, UserCheck, ShieldAlert } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals State
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState(null);
  
  // Deactivation Modal State
  const [statusModal, setStatusModal] = useState({ isOpen: false, user: null });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/v1/auth', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok) {
        const nonAdminUsers = data.filter(user => user.role !== 'admin');
        setUsers(nonAdminUsers);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  // --- ROLE MANAGEMENT LOGIC ---
  const initiateRoleChange = (user, newRole) => {
    if (user.role === newRole) return; 
    setPendingRoleChange({ userId: user._id, userName: user.name, oldRole: user.role, newRole: newRole });
    setIsConfirmOpen(true);
  };

  const confirmAndSaveRole = async () => {
    if (!pendingRoleChange) return;
    const { userId, newRole } = pendingRoleChange;

    try {
      const response = await fetch(`http://localhost:3000/api/v1/auth/${userId}`, {
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

  // --- ACCOUNT ACTIVATION/DEACTIVATION LOGIC ---
  const handleToggleStatus = async () => {
    if (!statusModal.user) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/v1/auth/${statusModal.user._id}/toggle-status`, {
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

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage operators, roles, and account access.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-[#7A1B22]/10 text-[#7A1B22] px-4 py-2 rounded-xl font-bold text-sm border border-[#7A1B22]/20 shadow-sm">
          <Users size={18} />
          Total Users: {users.length}
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search user by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-[#7A1B22] focus:ring-2 focus:ring-[#7A1B22]/20 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="p-4 pl-6">Profile / Full Name</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 text-center">Manage Role</th>
                <th className="p-4 text-center pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-sm font-medium text-slate-500">
                    No users found matching "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className={`hover:bg-slate-50 transition-colors group ${user.isActive === false ? 'opacity-70 bg-red-50/30' : ''}`}>
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border-2 shadow-sm shrink-0 ${user.isActive === false ? 'border-red-300 bg-red-100 text-red-400' : 'border-white bg-slate-200 text-slate-400'}`}>
                          {user.profilePic ? (
                            <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <User size={18} />
                          )}
                        </div>
                        <span className={`font-bold ${user.isActive === false ? 'text-red-900 line-through decoration-red-300' : 'text-slate-900'}`}>{user.name}</span>
                      </div>
                    </td>

<td className="p-4">
                      <p className="text-sm font-bold text-slate-900">{user.contact}</p>
                      <p className="text-[10px] font-bold text-[#7A1B22] uppercase tracking-wider bg-[#7A1B22]/10 inline-block px-1.5 rounded border border-[#7A1B22]/20 mt-0.5">
                        {user.todaAssociation || 'NON-TODA'}
                      </p>
                    </td>
                    

                    
                    
                    <td className="p-4">
                      {user.isActive === false ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider border border-red-200">
                          <ShieldAlert size={12} /> Deactivated
                        </span>
                      ) : user.isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                          <ShieldCheck size={12} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                          Unverified
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <select
                        value={user.role}
                        disabled={user.isActive === false}
                        onChange={(e) => initiateRoleChange(user, e.target.value)}
                        className={`border text-xs font-bold rounded-lg px-3 py-1.5 outline-none shadow-sm transition-colors ${
                          user.isActive === false ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' :
                          user.role === 'toda_president' ? 'bg-[#D4AF37]/10 text-[#7A1B22] border-[#D4AF37] cursor-pointer' : 'bg-white text-slate-700 border-slate-200 hover:border-[#7A1B22] cursor-pointer'
                        }`}
                      >
                        <option value="operator">Operator</option>
                        <option value="toda_president">TODA President</option>
                      </select>
                    </td>

                    <td className="p-4 pr-6 text-center space-x-2">
                      <button 
                        onClick={() => openDetailsModal(user)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-200 shadow-sm"
                        title="View Profile Details"
                      >
                        <Info size={14} />
                      </button>

                      <button 
                        onClick={() => setStatusModal({ isOpen: true, user: user })}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm ${
                          user.isActive === false 
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200' 
                          : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                        }`}
                        title={user.isActive === false ? "Restore Account" : "Deactivate Account"}
                      >
                        {user.isActive === false ? <UserCheck size={14} /> : <UserMinus size={14} />}
                        {user.isActive === false ? 'Activate' : 'Deactivate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- CONFIRMATION MODAL PARA SA ACCOUNT STATUS (DEACTIVATE/ACTIVATE) --- */}
      {statusModal.isOpen && statusModal.user && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setStatusModal({ isOpen: false, user: null })}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm ${
              statusModal.user.isActive === false ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
            }`}>
              {statusModal.user.isActive === false ? <UserCheck size={28} /> : <UserMinus size={28} />}
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {statusModal.user.isActive === false ? 'Reactivate Account?' : 'Deactivate Account?'}
            </h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to {statusModal.user.isActive === false ? 'restore access for ' : 'revoke system access from '} 
              <strong className="text-slate-800">{statusModal.user.name}</strong>?
              {statusModal.user.isActive !== false && <span className="block mt-2 text-xs text-red-500 font-medium">This will prevent the user from logging in.</span>}
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setStatusModal({ isOpen: false, user: null })}
                className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-sm"
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

      {/* --- CONFIRMATION MODAL PARA SA ROLE CHANGE --- */}
      {isConfirmOpen && pendingRoleChange && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsConfirmOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
              <AlertTriangle size={28} strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Change User Role?</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to change <strong>{pendingRoleChange.userName}</strong>'s role from <br/>
              <span className="inline-block mt-2 px-2 py-1 bg-slate-100 text-slate-600 font-bold text-[10px] rounded uppercase tracking-wider">{pendingRoleChange.oldRole}</span> 
              <span className="mx-2 text-slate-300">➔</span> 
              <span className="inline-block px-2 py-1 bg-[#D4AF37]/20 text-[#7A1B22] font-bold text-[10px] rounded uppercase tracking-wider">{pendingRoleChange.newRole}</span> ?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setIsConfirmOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-sm">Cancel</button>
              <button onClick={confirmAndSaveRole} className="flex-1 py-3 rounded-xl font-bold text-white bg-[#7A1B22] hover:bg-[#5A1419] transition-colors text-sm shadow-sm">Yes, Change It</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MORE DETAILS MODAL --- */}
      {isDetailsModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDetailsModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#7A1B22] p-6 text-center relative">
              <button onClick={() => setIsDetailsModalOpen(false)} className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 p-1.5 rounded-lg transition-colors"><X size={18} /></button>
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md border-2 border-[#D4AF37] overflow-hidden">
                {selectedUser.profilePic ? <img src={selectedUser.profilePic} alt={selectedUser.name} className="w-full h-full object-cover" /> : <User className="text-slate-400" size={36} />}
              </div>
              <h2 className="text-xl font-bold text-white">{selectedUser.name}</h2>
              <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mt-1">{selectedUser.role.replace('_', ' ')}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <MapPin className="text-slate-400 mt-0.5" size={18} />
                <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Barangay Address</p><p className="text-sm font-bold text-slate-900">{selectedUser.address}</p></div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Phone className="text-slate-400 mt-0.5" size={18} />
                <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Details</p><p className="text-sm font-bold text-slate-900">{selectedUser.contact}</p></div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Calendar className="text-slate-400 mt-0.5" size={18} />
                <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date Registered</p><p className="text-sm font-bold text-slate-900">{new Date(selectedUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
              <button onClick={() => setIsDetailsModalOpen(false)} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 rounded-xl transition-colors text-sm">Close Details</button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default UserManagement;