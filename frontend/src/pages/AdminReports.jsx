import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { Printer, Filter, CheckCircle, Clock, AlertTriangle, XCircle, FileText, Ban } from 'lucide-react';

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
  
  // State para sa Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    todaName: '',
    barangay: ''
  });

  useEffect(() => {
    fetchReports();
  }, [filters]); // Mag-a-auto refresh kapag may binago sa filters!

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      // Buuin ang query string mula sa filters state
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.todaName) queryParams.append('todaName', filters.todaName);
      if (filters.barangay) queryParams.append('barangay', filters.barangay);

      const response = await fetch('${import.meta.env.VITE_API_URL}/api/v1/franchises/reports?${queryParams.toString()}', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.data);
        setSummary(data.summary);
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
    window.print(); // Simple at epektibong print function ng browser!
  };

  const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#7A1B22]";

  return (
    <SidebarLayout>
      {/* HEADER - Ginamitan natin ng "print:hidden" para hindi masama ang buttons pag na-print */}
      <header className="mb-6 flex justify-between items-end print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Filter, view, and print franchise records.</p>
        </div>
        <button 
          onClick={handlePrint}
          className="bg-[#7A1B22] hover:bg-[#5A1419] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-sm"
        >
          <Printer size={18} /> Print Report
        </button>
      </header>

      {/* FILTER SECTION */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 print:hidden">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Filter size={14} /> Filter Criteria
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date From</label>
            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className={inputClasses} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date To</label>
            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className={inputClasses} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
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
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">TODA</label>
            <select name="todaName" value={filters.todaName} onChange={handleFilterChange} className={inputClasses}>
              <option value="">All TODA</option>
              {TODA_LIST.map((toda, i) => <option key={i} value={toda}>{toda}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Barangay</label>
            <select name="barangay" value={filters.barangay} onChange={handleFilterChange} className={inputClasses}>
              <option value="">All Barangays</option>
              {GASAN_BARANGAYS.map((brgy, i) => <option key={i} value={brgy}>{brgy}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* PRINT HEADER - Makikita lang kapag na-print as PDF/Paper */}
      <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
        <h1 className="text-xl font-bold uppercase">Gasan Tricycle Franchising & Regulatory Board</h1>
        <h2 className="text-lg font-bold mt-1">Franchise System Report</h2>
        <p className="text-sm mt-2">
          Filtered By: {filters.status || 'All Status'} | {filters.todaName || 'All TODA'} | {filters.barangay || 'All Barangays'}
        </p>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center shadow-sm">
          <FileText size={20} className="mx-auto text-slate-500 mb-2" />
          <p className="text-2xl font-bold text-slate-900">{summary.total}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Records</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center shadow-sm">
          <CheckCircle size={20} className="mx-auto text-emerald-600 mb-2" />
          <p className="text-2xl font-bold text-emerald-900">{summary.active}</p>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Active</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-center shadow-sm">
          <Clock size={20} className="mx-auto text-amber-600 mb-2" />
          <p className="text-2xl font-bold text-amber-900">{summary.pending}</p>
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">Pending</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl text-center shadow-sm">
          <AlertTriangle size={20} className="mx-auto text-orange-600 mb-2" />
          <p className="text-2xl font-bold text-orange-900">{summary.expired}</p>
          <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wide">Expired</p>
        </div>
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-center shadow-sm">
          <XCircle size={20} className="mx-auto text-red-600 mb-2" />
          <p className="text-2xl font-bold text-red-900">{summary.cancelled}</p>
          <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide">Cancelled</p>
        </div>
        <div className="bg-slate-800 border border-slate-900 p-4 rounded-2xl text-center shadow-sm">
          <Ban size={20} className="mx-auto text-slate-300 mb-2" />
          <p className="text-2xl font-bold text-white">{summary.revoked}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Revoked</p>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Plate No.</th>
                <th className="p-4">Operator Name</th>
                <th className="p-4">Address</th>
                <th className="p-4">TODA</th>
                <th className="p-4">Date Applied</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">Loading reports...</td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">No records found for the selected filters.</td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{report.plateNo}</td>
                    <td className="p-4 text-slate-600">{report.fullName}</td>
                    <td className="p-4 text-slate-600">{report.address}</td>
                    <td className="p-4 text-slate-600">{report.todaName}</td>
                    <td className="p-4 text-slate-500">
                      {new Date(report.dateApplied).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-wide ${
                        report.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                        report.status === 'Cancelled' || report.status === 'Revoked' ? 'bg-red-100 text-red-700' :
                        report.status === 'Expired' ? 'bg-orange-100 text-orange-700' :
                        'bg-amber-100 text-amber-700'
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
    </SidebarLayout>
  );
};

export default AdminReports;