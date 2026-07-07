import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { User, Lock, Camera, Save, Loader2, Phone, AlertTriangle, X, CheckCircle } from 'lucide-react';

const GASAN_BARANGAYS = [
  "Antipolo", "Bachao Ibaba", "Bachao Ilaya", "Bacong-Bacong", "Bahi", 
  "Bangbang", "Banot", "Banuyo", "Bognuyan", "Cabugao", "Dawis", "Dili", 
  "Libtangin", "Mahunig", "Mangiliol", "Masiga", "Matandang Gasan", "Pangi", 
  "Pinggan", "Tabionan", "Tiguion", "Tremol", "Tulingon", 
  "Barangay I (Poblacion)", "Barangay II (Poblacion)", "Barangay III (Poblacion)"
];

const TODA_LIST = [
  "NON-TODA", "BATODA", "POB TODA", "NBI TODA", "GT TODA", "TIGUION TODA", 
  "BANGBANG IPIL TODA", "TAB TODA", "LUG TODA", "MASIGA TODA", "4B TODA", 
  "CT TODA", "TG TODA", "GC TODA", "MA TODA", "PG TODA", "MAT TODA", 
  "DPAB TODA", "MGN TODA", "GSTODA", "GS TODA", "TTODA", "TC TODA", 
  "NORTH TODA", "GASAN CENTRAL TODA", "BAHI TODA", "ILAYA TODA", "GTF TODA"
];

const ManageProfile = () => {
  const [profileData, setProfileData] = useState({ name: '', contact: '', address: '', todaAssociation: 'NON-TODA' });
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  
  const [hasExistingAddress, setHasExistingAddress] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  // Custom Modal at Notifications State
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null }); // type = 'profile' or 'password'
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoadingData(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch('http://localhost:3000/api/v1/auth/profile', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const dbUser = await response.json();
          setProfileData({
            name: dbUser.name || '',
            contact: dbUser.contact || '',
            address: dbUser.address || '',
            todaAssociation: dbUser.todaAssociation || 'NON-TODA'
          });
          
          if (dbUser.address && dbUser.address.trim() !== '') {
            setHasExistingAddress(true);
          }
          if (dbUser.profilePic) {
            setProfilePicPreview(dbUser.profilePic);
          }
          
          localStorage.setItem('name', dbUser.name || '');
          localStorage.setItem('user', JSON.stringify(dbUser));
        }
      } catch (error) {
        console.error("Fetch profile error", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchProfileData();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicFile(file);
      setProfilePicPreview(URL.createObjectURL(file)); 
    }
  };

  // Papalabasin lang ang Modal kapag pinindot ang Submit
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setConfirmModal({ isOpen: true, type: 'profile' });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return alert("New passwords do not match!");
    }
    setConfirmModal({ isOpen: true, type: 'password' });
  };

  // Ito na ang pinaka-action kapag pinindot ang "Yes" sa Modal
  const executeAction = async () => {
    setIsProcessing(true);

    if (confirmModal.type === 'profile') {
      try {
        const formData = new FormData();
        formData.append('name', profileData.name);
        formData.append('contact', profileData.contact);
        formData.append('address', profileData.address);
        formData.append('todaAssociation', profileData.todaAssociation || 'NON-TODA');
        
        if (profilePicFile) formData.append('profilePic', profilePicFile);

        const response = await fetch('http://localhost:3000/api/v1/auth/profile', {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: formData 
        });

        if (response.ok) {
          const updatedUser = await response.json();
          localStorage.setItem('user', JSON.stringify(updatedUser));
          localStorage.setItem('name', updatedUser.name || profileData.name);
          
          setConfirmModal({ isOpen: false, type: null });
          setSuccessMessage('Profile saved successfully!');
          
          // Magre-reload ang page para mag-reflect sa Sidebar
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          alert('Failed to save profile.');
          setConfirmModal({ isOpen: false, type: null });
        }
      } catch (error) {
        alert('Network Error.');
        setConfirmModal({ isOpen: false, type: null });
      }
    } 
    
    else if (confirmModal.type === 'password') {
      try {
        const response = await fetch('http://localhost:3000/api/v1/auth/change-password', {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            oldPassword: passwordData.currentPassword, 
            newPassword: passwordData.newPassword
          })
        });

        if (response.ok) {
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setConfirmModal({ isOpen: false, type: null });
          setSuccessMessage('Password changed successfully!');
          setTimeout(() => setSuccessMessage(''), 3000);
        } else {
          const data = await response.json();
          alert(data.message || 'Failed to change password.');
          setConfirmModal({ isOpen: false, type: null });
        }
      } catch (error) {
        alert('Network Error.');
        setConfirmModal({ isOpen: false, type: null });
      }
    }

    setIsProcessing(false);
  };

  const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-2 focus:ring-[#7A1B22]/20 transition-all";
  const disabledClasses = "w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 outline-none cursor-not-allowed";

  return (
    <MainLayout>
      <header className="mb-6 relative">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Update your personal information and security settings.</p>

        {/* FLOATING SUCCESS NOTIFICATION */}
        {successMessage && (
          <div className="absolute top-0 right-0 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2">
            <CheckCircle size={20} />
            <span className="font-bold text-sm">{successMessage}</span>
          </div>
        )}
      </header>

      {isLoadingData ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-[#7A1B22]" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
          
          {/* PUBLIC PROFILE CARD */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
            <h2 className="flex items-center gap-2 font-bold text-slate-800 mb-6 text-lg border-b border-slate-100 pb-3">
              <User size={20} className="text-[#7A1B22]" /> Public Profile
            </h2>

            <form onSubmit={handleProfileSubmit}>
              <div className="flex flex-col items-center justify-center mb-8 relative">
                <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100 flex items-center justify-center relative group">
                  {profilePicPreview ? (
                    <img src={profilePicPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={48} className="text-slate-300" />
                  )}
                  
                  <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                    <Camera size={24} className="mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Change Pic</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
                <p className="text-xs text-slate-400 mt-3">Allowed: JPG, PNG. Max 5MB.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={profileData.name} 
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})} 
                    className={inputClasses} 
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email / Contact Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      value={profileData.contact} 
                      onChange={(e) => setProfileData({...profileData, contact: e.target.value})} 
                      className={`${inputClasses} pl-10`} 
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">TODA Association</label>
                  <select 
                    name="todaAssociation" 
                    value={profileData.todaAssociation} 
                    onChange={(e) => setProfileData({...profileData, todaAssociation: e.target.value})} 
                    className={inputClasses}
                  >
                    {TODA_LIST.map((toda) => <option key={toda} value={toda}>{toda}</option>)}
                  </select>
                </div>

                {hasExistingAddress ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Home Address <span className="text-[10px] text-red-500 ml-1">(Locked)</span></label>
                    <input type="text" value={profileData.address} readOnly title="Please contact the LGU office to update your registered address." className={disabledClasses} />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Home Address <span className="text-[10px] text-emerald-500 ml-1">(Action Required)</span></label>
                    <select name="address" value={profileData.address} onChange={(e) => setProfileData({...profileData, address: e.target.value})} className={inputClasses} required>
                      <option value="">Select Barangay...</option>
                      {GASAN_BARANGAYS.map((brgy, i) => <option key={i} value={`${brgy}, Gasan`}>{brgy}, Gasan</option>)}
                    </select>
                  </div>
                )}
              </div>

              <button type="submit" className="mt-8 w-full bg-slate-900 text-white hover:bg-slate-800 px-4 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                <Save size={18} /> Save Profile Details
              </button>
            </form>
          </div>

          {/* SECURITY CARD */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm h-fit">
            <h2 className="flex items-center gap-2 font-bold text-slate-800 mb-6 text-lg border-b border-slate-100 pb-3">
              <Lock size={20} className="text-[#D4AF37]" /> Security
            </h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current Password</label>
                <input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} placeholder="Enter current password" className={inputClasses} required />
              </div>
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 mt-2">New Password</label>
                <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} placeholder="Create new password" className={inputClasses} required minLength="6" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirm New Password</label>
                <input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} placeholder="Confirm new password" className={inputClasses} required minLength="6" />
              </div>
              
              <button type="submit" className="mt-6 w-full bg-[#7A1B22] text-white hover:bg-[#5A1419] px-4 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                <Lock size={18} /> Change Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- CUSTOM CONFIRMATION MODAL --- */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setConfirmModal({ isOpen: false, type: null })}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setConfirmModal({ isOpen: false, type: null })} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
            
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border-4 border-white bg-amber-100 text-amber-600">
              <AlertTriangle size={28} />
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-2">Save Changes?</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to {confirmModal.type === 'profile' ? 'update your profile details' : 'change your account password'}?
            </p>

            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, type: null })}
                className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={executeAction}
                disabled={isProcessing}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-[#7A1B22] hover:bg-[#5A1419] transition-colors text-sm shadow-sm flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isProcessing ? 'Saving...' : 'Yes, Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default ManageProfile;