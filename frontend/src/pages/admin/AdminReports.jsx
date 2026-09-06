import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout';
import { Printer, Filter, CheckCircle, Clock, AlertTriangle, XCircle, FileText, Ban, Loader2 } from 'lucide-react';
import { StatsCardsSkeleton, TableRowsSkeleton } from '../../components/skeleton';

const TODA_LIST = [
  "BATODA", "POB TODA", "NBI TODA", "GT TODA", "TIGUION TODA", 
  "BANGBANG–IPIL TODA", "TAB TODA", "LUG TODA (incl. LUGTODA)", 
  "MASIGA TODA", "4B TODA", "CT TODA", "TG TODA", "GC TODA", 
  "MA TODA", "PG TODA", "MAT TODA (incl. MATODA / MAT. GASAN TODA)", 
  "DPAB TODA", "MGN TODA", "GSTODA", "GS TODA", "TTODA", 
  "TC TODA", "NORTH TODA", "GASAN CENTRAL TODA", "BAHI TODA", 
  "ILAYA TODA", "GTF TODA", "NON-TODA"
];

const GASAN_BARANGAYS = [
  "Antipolo", "Bachao Ibaba", "Bachao Ilaya", "Bacong-Bacong", "Bahi", 
  "Bangbang", "Banot", "Banuyo", "Bognuyan", "Cabugao", "Dawis", "Dili", 
  "Libtangin", "Mahunig", "Mangiliol", "Masiga", "Matandang Gasan", "Pangi", 
  "Pinggan", "Tabionan", "Tiguion", "Tremol", "Tulingon", 
  "Barangay I (Poblacion)", "Barangay II (Poblacion)", "Barangay III (Poblacion)"
];

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState({ total: 0, active: 0, pending: 0, revoked: 0, cancelled: 0, expired: 0 });
  const [isLoading, setIsLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    todaName: '',
    barangay: ''
  });

  useEffect(() => {
    fetchReports();
  }, [filters]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.todaName) queryParams.append('todaName', filters.todaName);
      if (filters.barangay) queryParams.append('barangay', filters.barangay);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/reports?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.data || []);
        setSummary(data.summary || { total: 0, active: 0, pending: 0, revoked: 0, cancelled: 0, expired: 0 });
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handlePrint = () => {
    window.print();
  };

  const inputClasses = "w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#7A1B22] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-[#7A1B22]/10 transition-all";

  return (
    <MainLayout>
      {/* Header */}
      <header className="mb-6 flex flex-col sm:flex-row justify-between sm:items-end gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-[#7A1B22] rounded-full" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">System Reports</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Filter, view, and print franchise records.</p>
          </div>
        </div>
        <button 
          onClick={handlePrint}
          className="w-full sm:w-auto bg-[#7A1B22] hover:bg-[#5A1419] text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
        >
          <Printer size={16} /> Print Report
        </button>
      </header>

      {/* Filter Criteria */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 print:hidden transition-colors">
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Filter size={14} className="text-[#7A1B22] dark:text-[#D4AF37]" /> Filter Criteria
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Date From</label>
            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className={inputClasses} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Date To</label>
            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className={inputClasses} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange} className={inputClasses}>
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Expired">Expired</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Revoked">Revoked</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">TODA</label>
            <select name="todaName" value={filters.todaName} onChange={handleFilterChange} className={inputClasses}>
              <option value="">All TODA</option>
              {TODA_LIST.map((toda, i) => <option key={i} value={toda}>{toda}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Barangay</label>
            <select name="barangay" value={filters.barangay} onChange={handleFilterChange} className={inputClasses}>
              <option value="">All Barangays</option>
              {GASAN_BARANGAYS.map((brgy, i) => <option key={i} value={brgy}>{brgy}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <StatsCardsSkeleton count={6} gridClassName="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6" baseDelay={40} stepDelay={40} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="stagger-reveal bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 rounded-2xl text-center shadow-sm transition-colors" style={{ animationDelay: '0.04s' }}>
            <FileText size={18} className="mx-auto text-slate-500 dark:text-slate-400 mb-1" />
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{summary.total}</p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Total Records</p>
          </div>
          <div className="stagger-reveal bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3 sm:p-4 rounded-2xl text-center shadow-sm transition-colors" style={{ animationDelay: '0.08s' }}>
            <CheckCircle size={18} className="mx-auto text-emerald-600 dark:text-emerald-400 mb-1" />
            <p className="text-xl sm:text-2xl font-black text-emerald-900 dark:text-emerald-300">{summary.active}</p>
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Active</p>
          </div>
          <div className="stagger-reveal bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3 sm:p-4 rounded-2xl text-center shadow-sm transition-colors" style={{ animationDelay: '0.12s' }}>
            <Clock size={18} className="mx-auto text-amber-600 dark:text-amber-400 mb-1" />
            <p className="text-xl sm:text-2xl font-black text-amber-900 dark:text-amber-300">{summary.pending}</p>
            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Pending</p>
          </div>
          <div className="stagger-reveal bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 p-3 sm:p-4 rounded-2xl text-center shadow-sm transition-colors" style={{ animationDelay: '0.16s' }}>
            <AlertTriangle size={18} className="mx-auto text-orange-600 dark:text-orange-400 mb-1" />
            <p className="text-xl sm:text-2xl font-black text-orange-900 dark:text-orange-300">{summary.expired}</p>
            <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide">Expired</p>
          </div>
          <div className="stagger-reveal bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 p-3 sm:p-4 rounded-2xl text-center shadow-sm transition-colors" style={{ animationDelay: '0.2s' }}>
            <XCircle size={18} className="mx-auto text-red-600 dark:text-red-400 mb-1" />
            <p className="text-xl sm:text-2xl font-black text-red-900 dark:text-red-300">{summary.cancelled}</p>
            <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">Cancelled</p>
          </div>
          <div className="stagger-reveal bg-slate-800 dark:bg-slate-800/90 border border-slate-900 dark:border-slate-700 p-3 sm:p-4 rounded-2xl text-center shadow-sm transition-colors" style={{ animationDelay: '0.24s' }}>
            <Ban size={18} className="mx-auto text-slate-300 mb-1" />
            <p className="text-xl sm:text-2xl font-black text-white">{summary.revoked}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Revoked</p>
          </div>
        </div>
      )}

      {/* Responsive Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">
              <tr>
                <th className="p-3.5 sm:p-4">Plate No.</th>
                <th className="p-3.5 sm:p-4">Operator Name</th>
                <th className="p-3.5 sm:p-4">Address</th>
                <th className="p-3.5 sm:p-4">TODA</th>
                <th className="p-3.5 sm:p-4">Date Applied</th>
                <th className="p-3.5 sm:p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 whitespace-nowrap text-xs">
              {isLoading ? (
                <TableRowsSkeleton rows={6} columns={5} baseDelay={140} stepDelay={40} />
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs sm:text-sm">
                    No records found for the selected filters.
                  </td>
                </tr>
              ) : (
                reports.map((report, rIdx) => (
                  <tr 
                    key={report._id} 
                    className="stagger-reveal hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors"
                    style={{ animationDelay: `${rIdx * 30}ms` }}
                  >
                    <td className="p-3.5 sm:p-4 font-black text-slate-900 dark:text-white">{report.plateNo}</td>
                    <td className="p-3.5 sm:p-4 text-slate-700 dark:text-slate-200 font-medium">{report.fullName}</td>
                    <td className="p-3.5 sm:p-4 text-slate-600 dark:text-slate-300">{report.address}</td>
                    <td className="p-3.5 sm:p-4 text-slate-600 dark:text-slate-300">{report.todaName}</td>
                    <td className="p-3.5 sm:p-4 text-slate-500 dark:text-slate-400">
                      {new Date(report.dateApplied).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                        report.status === 'Active' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' :
                        report.status === 'Cancelled' || report.status === 'Revoked' ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400' :
                        report.status === 'Expired' ? 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400' :
                        'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminReports;