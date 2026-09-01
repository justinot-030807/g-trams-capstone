import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout';
import { User, Lock, Camera, Save, Loader2, Phone, AlertTriangle, CheckCircle, Moon, Sun, Globe } from 'lucide-react';

const ManageProfile = () => {
  const [profileData, setProfileData] = useState({ name: '', contact: '', address: '', todaAssociation: 'NON-TODA' });
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  // FIX: App Preferences State (Dark Mode & Language)
  const [preferences, setPreferences] = useState({ theme: 'light', language: 'en' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null });
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // I-load ang saved Preferences (Dark Mode at Language)
    const savedTheme = localStorage.getItem('gtrams_theme') || 'light';
    const savedLang = localStorage.getItem('gtrams_lang') || 'en';
    setPreferences({ theme: savedTheme, language: savedLang });

    const fetchProfileData = async () => {
      setIsLoadingData(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/auth/profile', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const dbUser = await response.json();
          setProfileData({
            name: dbUser.name || dbUser.fullName || '',
            contact: dbUser.contact || '',
            address: dbUser.address || 'Municipality of Gasan',
            todaAssociation: dbUser.todaAssociation || 'NON-TODA'
          });
          
          if (dbUser.profilePic) setProfilePicPreview(dbUser.profilePic);
          
          localStorage.setItem('name', dbUser.name || dbUser.fullName || '');
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

  const executeAction = async () => {
    setIsProcessing(true);

    if (confirmModal.type === 'profile') {
      try {
        const formData = new FormData();
        formData.append('name', profileData.name);
        formData.append('contact', profileData.contact);
        formData.append('address', profileData.address);
        formData.append('todaAssociation', profileData.todaAssociation);
        
        if (profilePicFile) formData.append('profilePic', profilePicFile);

        const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/auth/profile', {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: formData 
        });

        if (response.ok) {
          const updatedUser = await response.json();
          localStorage.setItem('user', JSON.stringify(updatedUser));
          localStorage.setItem('name', updatedUser.name || profileData.name);
          
          setConfirmModal({ isOpen: false, type: null });
          setSuccessMessage('Profile details updated successfully!');
          setTimeout(() => window.location.reload(), 1200);
        } else {
          alert('Failed to save profile.');
          setConfirmModal({ isOpen: false, type: null });
        }
      } catch (error) {
        alert('Network Error.');
        setConfirmModal({ isOpen: false, type: null });
      }
    } else if (confirmModal.type === 'password') {
      try {
        const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/auth/change-password', {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ oldPassword: passwordData.currentPassword, newPassword: passwordData.newPassword })
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

  // I-save ang User System Preferences sa mismong browser
  const savePreferences = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    localStorage.setItem(`gtrams_${key}`, value);

    if (key === 'theme') {
      if (value === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-2 focus:ring-[#7A1B22]/10 transition-all";
  const lockedClasses = "w-full bg-slate-100 border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 outline-none cursor-not-allowed select-none";

  return (
    <MainLayout>
      <header className="mb-6 relative">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Update personal details, credentials, and app preferences.</p>

        {successMessage && (
          <div className="absolute top-0 right-0 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle size={18} />
            <span className="font-bold text-xs sm:text-sm">{successMessage}</span>
          </div>
        )}
      </header>

      {isLoadingData ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-[#7A1B22]" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
          
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <h2 className="flex items-center gap-2 font-black text-slate-900 mb-6 text-base border-b border-slate-100 pb-3">
              <User size={18} className="text-[#7A1B22]" /> Public Information
            </h2>

            <form onSubmit={handleProfileSubmit}>
              <div className="flex flex-col items-center justify-center mb-6 relative">
                <div className="w-24 h-24 rounded-full border-4 border-[#D4AF37]/30 shadow-md overflow-hidden bg-slate-100 flex items-center justify-center relative group">
                  {profilePicPreview ? (
                    <img src={profilePicPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} className="text-slate-300" />
                  )}
                  
                  <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                    <Camera size={20} className="mb-0.5" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Change</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">Click to upload photo (JPG / PNG)</p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Full Name</label>
                  <input type="text" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} className={inputClasses} required />
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Email / Contact Number</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={profileData.contact} onChange={(e) => setProfileData({...profileData, contact: e.target.value})} className={`${inputClasses} pl-10`} required />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">TODA Association</label>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Locked</span>
                  </div>
                  <input type="text" value={profileData.todaAssociation} readOnly title="Registered TODA is permanent. Visit LGU office for TODA transfer." className={lockedClasses} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Registered Address / Barangay</label>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Locked</span>
                  </div>
                  <input type="text" value={profileData.address} readOnly title="Official registered address cannot be self-edited. Contact BPLO for changes." className={lockedClasses} />
                </div>
              </div>

              <button type="submit" className="mt-6 w-full bg-[#7A1B22] text-white hover:bg-[#5A1419] px-4 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]">
                <Save size={16} /> Save Information
              </button>
            </form>
          </div>

          <div className="flex flex-col gap-6">
            
            {/* APP PREFERENCES (Language at Dark Mode) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm h-fit">
              <h2 className="flex items-center gap-2 font-black text-slate-900 mb-6 text-base border-b border-slate-100 pb-3">
                <Globe size={18} className="text-[#D4AF37]" /> App Preferences
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Language</p>
                    <p className="text-[10px] font-medium text-slate-500 mt-0.5">Select preferred system language</p>
                  </div>
                  <select 
                    value={preferences.language}
                    onChange={(e) => savePreferences('language', e.target.value)}
                    className="bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-lg px-3 py-1.5 outline-none cursor-pointer"
                  >
                    <option value="en">English (US)</option>
                    <option value="fil">Filipino</option>
                  </select>
                </div>

                <div className="flex items-center justify-between bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      {preferences.theme === 'dark' ? <Moon size={14} className="text-indigo-600"/> : <Sun size={14} className="text-amber-500"/>} 
                      Theme Display
                    </p>
                    <p className="text-[10px] font-medium text-slate-500 mt-0.5">Toggle light or dark mode styling</p>
                  </div>
                  <div className="flex bg-slate-200 p-1 rounded-lg">
                    <button 
                      onClick={() => savePreferences('theme', 'light')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${preferences.theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Light
                    </button>
                    <button 
                      onClick={() => savePreferences('theme', 'dark')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${preferences.theme === 'dark' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Dark
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECURITY & PASSWORD */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm h-fit">
              <h2 className="flex items-center gap-2 font-black text-slate-900 mb-6 text-base border-b border-slate-100 pb-3">
                <Lock size={18} className="text-[#D4AF37]" /> Change Password
              </h2>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Current Password</label>
                  <input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} placeholder="••••••••" className={inputClasses} required />
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">New Password</label>
                  <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} placeholder="••••••••" className={inputClasses} required minLength="6" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Confirm New Password</label>
                  <input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} placeholder="••••••••" className={inputClasses} required minLength="6" />
                </div>
                
                <button type="submit" className="mt-6 w-full bg-slate-900 text-white hover:bg-slate-800 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]">
                  <Lock size={16} /> Update Password
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setConfirmModal({ isOpen: false, type: null })} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 bg-amber-100 text-amber-600">
              <AlertTriangle size={24} />
            </div>
            
            <h3 className="text-lg font-black text-slate-900 mb-1">Confirm Update?</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Are you sure you want to {confirmModal.type === 'profile' ? 'update your profile details' : 'change your account password'}?
            </p>

            <div className="flex gap-2.5">
              <button 
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, type: null })}
                className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-xs"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={executeAction}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-[#7A1B22] hover:bg-[#5A1419] transition-colors text-xs shadow-sm flex items-center justify-center gap-1.5"
              >
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {isProcessing ? 'Saving...' : 'Yes, Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default ManageProfile;