import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { Save, Clock, CheckCircle, CalendarDays, Wallet } from 'lucide-react';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    newFranchise: 3,
    renewFranchise: 1,
    fiscalYear: new Date().getFullYear().toString(),
    franchiseFee: 500
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Kunin ang naka-save na settings, kung wala, gamitin ang default
    const savedNew = localStorage.getItem('validity_new');
    const savedRenew = localStorage.getItem('validity_renew');
    const savedFiscal = localStorage.getItem('fiscal_year');
    const savedFee = localStorage.getItem('franchise_fee');
    
    setSettings({
      newFranchise: savedNew ? parseInt(savedNew) : 3,
      renewFranchise: savedRenew ? parseInt(savedRenew) : 1,
      fiscalYear: savedFiscal || new Date().getFullYear().toString(),
      franchiseFee: savedFee ? parseFloat(savedFee) : 500
    });
  }, []);

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    // I-save lahat sa local storage
    localStorage.setItem('validity_new', settings.newFranchise);
    localStorage.setItem('validity_renew', settings.renewFranchise);
    localStorage.setItem('fiscal_year', settings.fiscalYear);
    localStorage.setItem('franchise_fee', settings.franchiseFee);
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-2 focus:ring-[#7A1B22]/20 transition-all";

  return (
    <MainLayout>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure franchise rules and system parameters.</p>
      </header>

      <div className="max-w-3xl">
        <form onSubmit={handleSave} className="space-y-6">
          
          {isSaved && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-xl p-4">
              <CheckCircle size={18} />
              System settings successfully updated!
            </div>
          )}

          {/* SECTION 1: Franchise Validity */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2 bg-[#7A1B22]/10 rounded-lg border border-[#7A1B22]/20">
                <Clock className="text-[#7A1B22]" size={20} />
              </div>
              <h2 className="text-base font-bold text-slate-900">Franchise Validity Period</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  New Application (Years)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="newFranchise"
                    min="1"
                    max="10"
                    value={settings.newFranchise}
                    onChange={handleChange}
                    className={inputClasses}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium">yrs</span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">Applies to first-time registrations.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Renewal Validity (Years)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="renewFranchise"
                    min="1"
                    max="10"
                    value={settings.renewFranchise}
                    onChange={handleChange}
                    className={inputClasses}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium">yrs</span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">Applies to franchise renewals.</p>
              </div>
            </div>
          </div>

          {/* SECTION 2: Fiscal & Financial Settings */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                <Wallet className="text-amber-600" size={20} />
              </div>
              <h2 className="text-base font-bold text-slate-900">Fiscal & Financial</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Current Fiscal Year
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <CalendarDays size={18} />
                  </div>
                  <input
                    type="text"
                    name="fiscalYear"
                    value={settings.fiscalYear}
                    onChange={handleChange}
                    className={`${inputClasses} pl-11`}
                    placeholder="e.g. 2026-2027"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5">Active year for records and reports.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Standard Franchise Fee
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">₱</span>
                  <input
                    type="number"
                    name="franchiseFee"
                    min="0"
                    step="0.01"
                    value={settings.franchiseFee}
                    onChange={handleChange}
                    className={`${inputClasses} pl-8`}
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5">Base fee for applications and renewals.</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 bg-[#7A1B22] text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-sm hover:bg-[#5A1419] active:scale-[0.98] transition-all"
            >
              <Save size={18} />
              Save All Settings
            </button>
          </div>

        </form>
      </div>
    </MainLayout>
  );
};

export default SystemSettings;