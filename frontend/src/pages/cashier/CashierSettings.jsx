import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/MainLayout';
import { 
  User, Settings as SettingsIcon, Archive, ArrowLeft, 
  Check, Save, RefreshCw, Search, Printer, 
  CheckCircle2, Clock, DollarSign, ShieldCheck, 
  FileText, Sun, Moon, Laptop, Volume2, VolumeX,
  CreditCard, Banknote, Sparkles, Filter, X, Eye, Hash
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const CashierSettings = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();
  const { language, changeLanguage, t } = useLanguage();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'preferences' | 'archive'

  // Profile state
  const [profileData, setProfileData] = useState({
    name: localStorage.getItem('name') || 'Municipal Cashier',
    email: '',
    contact: '',
    station: 'Window 1 - Cashier Terminal'
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Preferences state
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(() => {
    return localStorage.getItem('cashier_auto_print') !== 'false';
  });
  const [soundAlert, setSoundAlert] = useState(() => {
    return localStorage.getItem('cashier_sound_alert') !== 'false';
  });
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState(() => {
    return localStorage.getItem('cashier_default_payment') || 'Cash';
  });

  // Archive state
  const [archiveList, setArchiveList] = useState([]);
  const [isLoadingArchive, setIsLoadingArchive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'week'

  // Reprint Receipt Modal State
  const [receiptData, setReceiptData] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Toast notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Fetch cashier profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProfileData(prev => ({
            ...prev,
            name: data.name || prev.name,
            email: data.email || '',
            contact: data.contact || ''
          }));
          if (data.name) {
            localStorage.setItem('name', data.name);
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };
    fetchProfile();
  }, []);

  // Fetch paid transactions for archive
  const fetchArchive = useCallback(async () => {
    setIsLoadingArchive(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/cashier-queue`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        let list = [];
        if (Array.isArray(data)) {
          list = data.filter(f => f.paymentStatus === 'Paid');
        } else if (data.recentlyPaid) {
          list = data.recentlyPaid;
        }
        setArchiveList(list);
      }
    } catch (err) {
      console.error('Failed to fetch archive:', err);
    } finally {
      setIsLoadingArchive(false);
    }
  }, []);

  useEffect(() => {
    fetchArchive();
  }, [fetchArchive]);

  // Handle Profile Update
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (isSavingProfile) return;

    if (!profileData.name.trim()) {
      showToast('Name cannot be empty.', 'error');
      return;
    }

    setIsSavingProfile(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', profileData.name.trim());
      if (profileData.contact) {
        formData.append('contact', profileData.contact.trim());
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        localStorage.setItem('name', profileData.name.trim());
        showToast('Cashier profile updated successfully!', 'success');
      } else {
        const errData = await res.json();
        showToast(errData.message || 'Failed to update profile.', 'error');
      }
    } catch (err) {
      console.error('Save profile error:', err);
      showToast('Network error while saving profile.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Preferences Changes
  const handleToggleAutoPrint = () => {
    const next = !autoPrintReceipt;
    setAutoPrintReceipt(next);
    localStorage.setItem('cashier_auto_print', String(next));
    showToast(`Receipt auto-print ${next ? 'enabled' : 'disabled'}.`, 'info');
  };

  const handleToggleSound = () => {
    const next = !soundAlert;
    setSoundAlert(next);
    localStorage.setItem('cashier_sound_alert', String(next));
    showToast(`Queue sound alert ${next ? 'enabled' : 'disabled'}.`, 'info');
  };

  const handleChangePaymentMethod = (method) => {
    setDefaultPaymentMethod(method);
    localStorage.setItem('cashier_default_payment', method);
    showToast(`Default payment method set to ${method}.`, 'info');
  };

  // Filtered Archive List
  const filteredArchive = useMemo(() => {
    let result = [...archiveList];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item => 
        (item.officialReceiptNo && item.officialReceiptNo.toLowerCase().includes(q)) ||
        (item.plateNo && item.plateNo.toLowerCase().includes(q)) ||
        (item.fullName && item.fullName.toLowerCase().includes(q)) ||
        (item.mtopNo && item.mtopNo.toLowerCase().includes(q)) ||
        (item.todaName && item.todaName.toLowerCase().includes(q))
      );
    }

    // Date range filter
    if (dateFilter !== 'all') {
      const now = new Date();
      result = result.filter(item => {
        const itemDate = item.paymentDate ? new Date(item.paymentDate) : (item.updatedAt ? new Date(item.updatedAt) : null);
        if (!itemDate) return true;
        if (dateFilter === 'today') {
          return itemDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'week') {
          const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
          return diffDays <= 7;
        }
        return true;
      });
    }

    return result;
  }, [archiveList, searchQuery, dateFilter]);

  // Total collected calculation
  const totalAmountCollected = useMemo(() => {
    return filteredArchive.reduce((acc, curr) => acc + (parseFloat(curr.amountPaid) || 500), 0);
  }, [filteredArchive]);

  // Open Receipt Modal for Reprinting
  const handleOpenReceipt = (item) => {
    const d = item.paymentDate ? new Date(item.paymentDate) : new Date(item.updatedAt || Date.now());
    setReceiptData({
      officialReceiptNo: item.officialReceiptNo || 'OR-PREVIEW',
      amountPaid: item.amountPaid || 500,
      paymentMethod: item.paymentMethod || 'Cash',
      remarks: item.paymentRemarks || 'Settled at Municipal Treasury Window',
      dateFormatted: d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      timeFormatted: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      franchise: item,
      cashierName: profileData.name || 'Municipal Cashier'
    });
    setIsReceiptOpen(true);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <MainLayout>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #official-receipt-print-area, #official-receipt-print-area * { visibility: visible !important; }
          #official-receipt-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2.5 text-xs sm:text-sm font-semibold transition-all ${
          toast.type === 'error' 
            ? 'bg-red-600 text-white' 
            : toast.type === 'info'
            ? 'bg-blue-600 text-white'
            : 'bg-emerald-700 text-white'
        }`}>
          {toast.type === 'error' ? <X size={16} /> : <CheckCircle2 size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-white dark:bg-[#1C1917] rounded-lg p-5 sm:p-6 mb-6 text-[#1F1D1B] dark:text-[#F6F5F3] shadow-xs border border-[#E4E1DC] dark:border-[#2E2A27] border-l-4 border-l-[#9E2A2B]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/10 text-[#9E2A2B] dark:text-[#D4AF37] border border-[#9E2A2B]/20 dark:border-[#D4AF37]/20 flex items-center justify-center shrink-0">
              <ShieldCheck size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight uppercase">
                  Cashier Settings &amp; Archive
                </h1>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#9E2A2B] text-white">
                  Treasury
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
                Manage cashier account details, workstation preferences, and view settled receipts archive.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/cashier-dashboard')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#EAE7E1] dark:hover:bg-[#252220] border border-[#E4E1DC] dark:border-[#2E2A27] text-xs sm:text-sm font-bold text-[#1F1D1B] dark:text-[#EAE7E1] transition-all cursor-pointer min-h-[44px] shadow-xs shrink-0 self-start sm:self-auto"
          >
            <ArrowLeft size={16} />
            <span>Back to Terminal</span>
          </button>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-[#E4E1DC] dark:border-[#2E2A27] overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
              activeTab === 'profile'
                ? 'bg-[#9E2A2B] text-white shadow-xs'
                : 'text-[#6B6761] dark:text-[#A8A29E] hover:bg-[#F6F5F3] dark:hover:bg-[#252220]'
            }`}
          >
            <User size={15} />
            <span>Profile &amp; Account</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
              activeTab === 'preferences'
                ? 'bg-[#9E2A2B] text-white shadow-xs'
                : 'text-[#6B6761] dark:text-[#A8A29E] hover:bg-[#F6F5F3] dark:hover:bg-[#252220]'
            }`}
          >
            <SettingsIcon size={15} />
            <span>Preferences</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('archive')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
              activeTab === 'archive'
                ? 'bg-[#9E2A2B] text-white shadow-xs'
                : 'text-[#6B6761] dark:text-[#A8A29E] hover:bg-[#F6F5F3] dark:hover:bg-[#252220]'
            }`}
          >
            <Archive size={15} />
            <span>Payment Archive</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 dark:bg-white/10">
              {archiveList.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: PROFILE & ACCOUNT */}
      {activeTab === 'profile' && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-white dark:bg-[#1C1917] rounded-lg p-5 sm:p-6 border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
              <div className="w-14 h-14 rounded-full bg-[#9E2A2B] text-white border-2 border-[#D4AF37] flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                {profileData.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">
                  {profileData.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] uppercase tracking-wider">
                    Municipal Cashier
                  </span>
                  <span className="text-[#6B6761] dark:text-[#A8A29E] text-xs">&bull;</span>
                  <span className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
                    Municipal Treasury Office
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1.5">
                    Cashier Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3.5 py-2.5 text-sm font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] focus:outline-hidden focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] dark:focus:ring-[#D4AF37] min-h-[44px]"
                    placeholder="Enter cashier name"
                  />
                  <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] mt-1">
                    This name appears as Authorized Collector on official printed receipts.
                  </p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1.5">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileData.contact}
                    onChange={(e) => setProfileData(prev => ({ ...prev, contact: e.target.value }))}
                    className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3.5 py-2.5 text-sm font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] focus:outline-hidden focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] dark:focus:ring-[#D4AF37] min-h-[44px]"
                    placeholder="e.g. 09123456789"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1.5">
                    Account Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full bg-[#F6F5F3]/60 dark:bg-[#14110F]/60 border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3.5 py-2.5 text-sm font-semibold text-[#6B6761] dark:text-[#A8A29E] opacity-75 min-h-[44px]"
                    placeholder="cashier@gasan.gov.ph"
                  />
                  <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] mt-1">
                    LGU credentials managed by Municipal Administrator.
                  </p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1.5">
                    Assigned Workstation
                  </label>
                  <input
                    type="text"
                    value={profileData.station}
                    disabled
                    className="w-full bg-[#F6F5F3]/60 dark:bg-[#14110F]/60 border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3.5 py-2.5 text-sm font-semibold text-[#6B6761] dark:text-[#A8A29E] opacity-75 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E4E1DC] dark:border-[#2E2A27] flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#9E2A2B] hover:bg-[#7A1B22] text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer min-h-[44px] active:scale-95 disabled:opacity-50"
                >
                  {isSavingProfile ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
                  <span>{isSavingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: PREFERENCES */}
      {activeTab === 'preferences' && (
        <div className="space-y-6 max-w-3xl">
          {/* Appearance & Language Card */}
          <div className="bg-white dark:bg-[#1C1917] rounded-lg p-5 sm:p-6 border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs space-y-5">
            <h3 className="text-sm sm:text-base font-bold text-[#1F1D1B] dark:text-[#F6F5F3] border-b border-[#E4E1DC] dark:border-[#2E2A27] pb-3">
              Display &amp; Language
            </h3>

            {/* Theme Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                  Interface Theme
                </p>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
                  Select your visual appearance preference for the cashier terminal.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleTheme()}
                  className="px-4 py-2 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#EAE7E1] text-xs font-bold flex items-center gap-2 text-[#1F1D1B] dark:text-[#EAE7E1] cursor-pointer min-h-[40px]"
                >
                  {isDark ? <Moon size={15} className="text-amber-300" /> : <Sun size={15} className="text-amber-500" />}
                  <span>{isDark ? 'Dark Mode (Active)' : 'Light Mode (Active)'}</span>
                </button>
              </div>
            </div>

            {/* Language Selection */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
              <div>
                <p className="text-sm font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                  System Language
                </p>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
                  Select preferred language for labels and messages.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => changeLanguage('en')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all min-h-[38px] ${
                    language === 'en'
                      ? 'bg-[#9E2A2B] text-white shadow-xs'
                      : 'bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#EAE7E1] border border-[#E4E1DC] dark:border-[#2E2A27]'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => changeLanguage('fil')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all min-h-[38px] ${
                    language === 'fil'
                      ? 'bg-[#9E2A2B] text-white shadow-xs'
                      : 'bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#EAE7E1] border border-[#E4E1DC] dark:border-[#2E2A27]'
                  }`}
                >
                  Filipino
                </button>
              </div>
            </div>
          </div>

          {/* Workstation & Terminal Workflow Preferences */}
          <div className="bg-white dark:bg-[#1C1917] rounded-lg p-5 sm:p-6 border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs space-y-5">
            <h3 className="text-sm sm:text-base font-bold text-[#1F1D1B] dark:text-[#F6F5F3] border-b border-[#E4E1DC] dark:border-[#2E2A27] pb-3">
              Payment Terminal Workflow
            </h3>

            {/* Auto Print Receipt Toggle */}
            <div className="flex items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                  Auto-Prompt Receipt Print
                </p>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
                  Automatically open the Official Receipt print modal right after confirming payment.
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleAutoPrint}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  autoPrintReceipt ? 'bg-[#9E2A2B]' : 'bg-[#E4E1DC] dark:bg-[#2E2A27]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    autoPrintReceipt ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Sound Alert Toggle */}
            <div className="flex items-start sm:items-center justify-between gap-4 pt-4 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
              <div>
                <p className="text-sm font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                  Queue Arrival Sound Alert
                </p>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
                  Play an audio chime whenever a new operator is approved and enters the payment queue.
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleSound}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  soundAlert ? 'bg-[#9E2A2B]' : 'bg-[#E4E1DC] dark:border-[#2E2A27] bg-[#E4E1DC] dark:bg-[#2E2A27]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    soundAlert ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Default Payment Mode Selection */}
            <div className="pt-4 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
              <p className="text-sm font-bold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1">
                Default Payment Method
              </p>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mb-3">
                Pre-selected payment method on the payment modal.
              </p>

              <div className="grid grid-cols-3 gap-2.5 max-w-md">
                {['Cash', 'GCash / Maya', 'Treasury Check'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => handleChangePaymentMethod(method)}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer text-center ${
                      defaultPaymentMethod === method
                        ? 'bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 border-[#9E2A2B] dark:border-[#D4AF37] text-[#9E2A2B] dark:text-[#D4AF37]'
                        : 'bg-[#F6F5F3] dark:bg-[#14110F] border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E]'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENT ARCHIVE */}
      {activeTab === 'archive' && (
        <div className="space-y-4">
          {/* Summary Metric Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white dark:bg-[#1C1917] p-4 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">
                  Settled Records
                </p>
                <p className="text-lg sm:text-xl font-bold font-mono text-[#1F1D1B] dark:text-[#F6F5F3]">
                  {filteredArchive.length}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1C1917] p-4 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0">
                <DollarSign size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">
                  Total Collected
                </p>
                <p className="text-lg sm:text-xl font-bold font-mono text-[#9E2A2B] dark:text-[#D4AF37]">
                  ₱{totalAmountCollected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1C1917] p-4 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">
                  Fixed Rate
                </p>
                <p className="text-lg sm:text-xl font-bold font-mono text-[#1F1D1B] dark:text-[#F6F5F3]">
                  ₱500.00 / MTOP
                </p>
              </div>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="bg-white dark:bg-[#1C1917] p-3.5 sm:p-4 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6761] dark:text-[#A8A29E]" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by OR No., Plate No., Operator Name..."
                className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg pl-9 pr-3.5 py-2 text-xs sm:text-sm font-medium text-[#1F1D1B] dark:text-[#EAE7E1] focus:outline-hidden focus:border-[#9E2A2B] dark:focus:border-[#D4AF37]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6761] hover:text-[#1F1D1B] cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#6B6761] dark:text-[#A8A29E] shrink-0">Period:</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#EAE7E1] text-xs font-bold rounded-lg px-2.5 py-2 outline-none cursor-pointer"
              >
                <option value="all">All Transactions</option>
                <option value="today">Today Only</option>
                <option value="week">Past 7 Days</option>
              </select>

              <button
                type="button"
                onClick={fetchArchive}
                className="w-9 h-9 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#EAE7E1] dark:hover:bg-[#252220] text-[#1F1D1B] dark:text-[#EAE7E1] flex items-center justify-center cursor-pointer transition-colors shrink-0"
                title="Refresh archive"
              >
                <RefreshCw size={15} className={isLoadingArchive ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Archive Records Table */}
          <div className="bg-white dark:bg-[#1C1917] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs overflow-hidden">
            {isLoadingArchive ? (
              <div className="p-12 text-center text-[#6B6761] dark:text-[#A8A29E]">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[#9E2A2B] dark:text-[#D4AF37]" />
                <p className="text-xs font-semibold">Loading payment archive...</p>
              </div>
            ) : filteredArchive.length === 0 ? (
              <div className="p-12 text-center text-[#6B6761] dark:text-[#A8A29E]">
                <Archive size={32} className="mx-auto mb-2 opacity-50" />
                <h4 className="text-sm font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">No payment records found</h4>
                <p className="text-xs mt-0.5">
                  {searchQuery ? 'Try adjusting your search query.' : 'Settled receipts will be archived and shown here.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[#F6F5F3] dark:bg-[#14110F] text-[#6B6761] dark:text-[#A8A29E] font-bold uppercase text-[10px] tracking-wider border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                      <th className="py-3 px-4">OR Number</th>
                      <th className="py-3 px-4">Operator / Payor</th>
                      <th className="py-3 px-4">Plate No.</th>
                      <th className="py-3 px-4">TODA / Zone</th>
                      <th className="py-3 px-4">Amount Paid</th>
                      <th className="py-3 px-4">Date Settled</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27]">
                    {filteredArchive.map((item) => {
                      const payDate = item.paymentDate ? new Date(item.paymentDate) : new Date(item.updatedAt || Date.now());
                      const dateStr = payDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      const timeStr = payDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

                      return (
                        <tr key={item._id} className="hover:bg-[#F6F5F3]/50 dark:hover:bg-[#14110F]/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#9E2A2B] dark:text-[#D4AF37]">
                            {item.officialReceiptNo || '—'}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                            {item.fullName || (item.operator && item.operator.name) || 'Unknown Operator'}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-[#1F1D1B] dark:text-[#EAE7E1]">
                            {item.plateNo || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-[#6B6761] dark:text-[#A8A29E]">
                            {item.todaName || 'NON-TODA'} {item.zone ? `• Zone ${item.zone}` : ''}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            ₱{parseFloat(item.amountPaid || 500).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-[#6B6761] dark:text-[#A8A29E]">
                            <div>{dateStr}</div>
                            <div className="text-[10px]">{timeStr}</div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenReceipt(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#9E2A2B] hover:text-white dark:hover:bg-[#D4AF37] dark:hover:text-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] transition-all cursor-pointer shadow-2xs"
                              title="Reprint Official Receipt"
                            >
                              <Printer size={13} />
                              <span>Reprint</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Official Receipt Print Modal */}
      {isReceiptOpen && receiptData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-[#1C1917] rounded-lg shadow-2xl border border-[#E4E1DC] dark:border-[#2E2A27] p-6 text-[#1F1D1B] dark:text-[#F6F5F3] animate-in zoom-in-95 duration-150">
            {/* Header controls (hidden on print) */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E4E1DC] dark:border-[#2E2A27] print:hidden">
              <span className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                <Printer size={15} />
                <span>Official Receipt Voucher</span>
              </span>
              <button
                type="button"
                onClick={() => setIsReceiptOpen(false)}
                className="w-7 h-7 rounded-md hover:bg-[#F6F5F3] dark:hover:bg-[#252220] text-[#6B6761] dark:text-[#A8A29E] flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Printable Receipt Body */}
            <div id="official-receipt-print-area" className="space-y-4">
              {/* LGU Gasan Official Header */}
              <div className="text-center pb-3 border-b-2 border-dashed border-[#E4E1DC] dark:border-[#2E2A27]">
                <div className="w-12 h-12 mx-auto mb-1">
                  <img src="/gasan-logo.png" alt="Seal of Gasan" className="w-full h-full object-contain" />
                </div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-[#6B6761] dark:text-[#A8A29E]">Republic of the Philippines</p>
                <p className="text-xs font-bold uppercase text-[#1F1D1B] dark:text-[#F6F5F3]">Municipality of Gasan</p>
                <p className="text-[11px] font-semibold text-[#9E2A2B] dark:text-[#D4AF37]">Office of the Municipal Treasurer</p>
                <p className="text-xs font-mono font-bold tracking-widest mt-1 text-[#1F1D1B] dark:text-[#F6F5F3]">
                  OFFICIAL RECEIPT
                </p>
              </div>

              {/* Receipt Metadata */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-[#6B6761] dark:text-[#A8A29E] uppercase font-bold block">OR Number</span>
                  <span className="font-mono font-bold text-sm text-[#9E2A2B] dark:text-[#D4AF37]">{receiptData.officialReceiptNo}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#6B6761] dark:text-[#A8A29E] uppercase font-bold block">Date &amp; Time</span>
                  <span className="font-semibold text-xs">{receiptData.dateFormatted}</span>
                  <span className="block text-[10px] text-[#6B6761] dark:text-[#A8A29E]">{receiptData.timeFormatted}</span>
                </div>
              </div>

              {/* Payor & MTOP Breakdown */}
              <div className="p-3 bg-[#F6F5F3] dark:bg-[#14110F] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#6B6761] dark:text-[#A8A29E]">Payor / Operator:</span>
                  <span className="font-bold">{receiptData.franchise?.fullName || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6761] dark:text-[#A8A29E]">Tricycle Plate:</span>
                  <span className="font-mono font-bold">{receiptData.franchise?.plateNo || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6761] dark:text-[#A8A29E]">TODA / Route:</span>
                  <span className="font-medium">{receiptData.franchise?.todaName || 'NON-TODA'}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
                  <span className="text-[#6B6761] dark:text-[#A8A29E]">Payment Method:</span>
                  <span className="font-semibold">{receiptData.paymentMethod}</span>
                </div>
              </div>

              {/* Particulars & Amount */}
              <div className="border-t border-b border-[#E4E1DC] dark:border-[#2E2A27] py-2.5 text-xs space-y-1">
                <div className="flex justify-between font-bold">
                  <span>MTOP Franchise Regulatory Fee</span>
                  <span className="font-mono">₱{parseFloat(receiptData.amountPaid || 500).toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-[#6B6761] dark:text-[#A8A29E]">Annual motor tricycle regulatory &amp; inspection fee</p>
              </div>

              <div className="flex justify-between items-center text-sm font-bold pt-1">
                <span>TOTAL AMOUNT PAID:</span>
                <span className="text-base font-mono text-[#9E2A2B] dark:text-[#D4AF37]">
                  ₱{parseFloat(receiptData.amountPaid || 500).toFixed(2)}
                </span>
              </div>

              {/* Cashier Signatory */}
              <div className="pt-4 text-center border-t border-dashed border-[#E4E1DC] dark:border-[#2E2A27]">
                <p className="text-xs font-bold uppercase">{receiptData.cashierName}</p>
                <p className="text-[10px] text-[#6B6761] dark:text-[#A8A29E]">Municipal Cashier / Authorized Collector</p>
                <p className="text-[9px] text-[#6B6761] dark:text-[#A8A29E] mt-1 font-mono">G-TRAMS Electronic Official Receipt</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-5 pt-3 border-t border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-end gap-2 print:hidden">
              <button
                type="button"
                onClick={() => setIsReceiptOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] hover:bg-[#F6F5F3] dark:hover:bg-[#252220] cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#9E2A2B] hover:bg-[#7A1B22] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Printer size={14} />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default CashierSettings;
