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

  useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove('printing-reports');
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
      document.body.classList.remove('printing-reports');
    };
  }, []);

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
    document.body.classList.add('printing-reports');
    window.print();
  };

  const inputClasses = "w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#7A1B22] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-[#7A1B22]/10 transition-all";

  return (
    <MainLayout>
      {/* Precision Print Stylesheet */}
      <style>{`
        @media print {
          @page {
            size: portrait;
            margin: 10mm 12mm;
          }
          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          /* Completely hide sidebar, header navbar, filters, and buttons */
          aside,
          header.sticky,
          nav,
          .print-hide,
          .print\\:hidden {
            display: none !important;
            visibility: hidden !important;
          }
          body.printing-reports * {
            visibility: hidden;
          }
          body.printing-reports #printable-report,
          body.printing-reports #printable-report * {
            visibility: visible;
          }
          body.printing-reports #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            display: block !important;
          }
          /* Fallback if printed via Ctrl+P */
          body:not(.printing-mtop):not(.printing-batch-mtop) #printable-report,
          body:not(.printing-mtop):not(.printing-batch-mtop) #printable-report * {
            visibility: visible;
          }
          body:not(.printing-mtop):not(.printing-batch-mtop) #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
          }
          /* Clean table styling for print */
          #printable-report table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          #printable-report th,
          #printable-report td {
            border: 1px solid #cbd5e1 !important;
            padding: 5px 7px !important;
          }
          #printable-report th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            font-weight: 800 !important;
          }
          #printable-report tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          #printable-report thead {
            display: table-header-group !important;
          }
        }
      `}</style>

      {/* Header */}
      <header className="mb-6 flex flex-col sm:flex-row justify-between sm:items-end gap-4 print:hidden print-hide">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-[#7A1B22] rounded-full" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">System Reports</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Filter, view, and print franchise records.</p>
          </div>
        </div>
        <button 
          onClick={handlePrint}
          className="w-full sm:w-auto bg-[#7A1B22] hover:bg-[#5A1419] text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          <Printer size={16} /> Print Report
        </button>
      </header>

      {/* Filter Criteria */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 print:hidden print-hide transition-colors">
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

      {/* ========================================================================= */}
      {/* 📄 PRINTABLE REPORT CONTAINER (Isolates and styles cleanly for printing) */}
      {/* ========================================================================= */}
      <div id="printable-report">
        
        {/* OFFICIAL LGU PRINT LETTERHEAD (Visible only on print) */}
        <div className="hidden print:block mb-5 border-b-2 border-slate-900 pb-3">
          <div className="flex items-center justify-between gap-4">
            <img src="/gasan-logo.png" alt="Gasan Official Seal" className="w-16 h-16 object-contain shrink-0" />
            <div className="text-center flex-1">
              <p className="text-[11px] uppercase tracking-widest font-serif text-slate-700 font-semibold">Republic of the Philippines</p>
              <p className="text-[11px] uppercase tracking-wider font-serif text-slate-700">Province of Marinduque</p>
              <p className="text-sm font-black uppercase tracking-wide text-slate-950">Municipality of Gasan</p>
              <p className="text-[11px] font-bold text-[#7A1B22] uppercase tracking-wider mt-0.5">Office of the Municipal Mayor &bull; BPLO / Licensing Division</p>
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900 mt-1">
                Official Franchise System Report
              </h2>
            </div>
            <div className="w-16 h-16 shrink-0 flex items-center justify-center opacity-0" />
          </div>

          {/* Report Metadata Strip */}
          <div className="mt-3 pt-2 border-t border-slate-300 flex flex-wrap justify-between text-[10px] text-slate-600">
            <div>
              <span className="font-bold text-slate-900">Date Generated: </span>
              {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
            <div>
              <span className="font-bold text-slate-900">Generated By: </span>
              {localStorage.getItem('name') || 'G-TRAMS Administrator'}
            </div>
            <div>
              <span className="font-bold text-slate-900">Filter Scope: </span>
              {[
                filters.status ? `Status: ${filters.status}` : 'All Statuses',
                filters.todaName ? `TODA: ${filters.todaName}` : 'All TODAs',
                filters.barangay ? `Brgy: ${filters.barangay}` : 'All Barangays',
                (filters.startDate || filters.endDate) ? `Period: ${filters.startDate || 'Start'} to ${filters.endDate || 'Present'}` : 'All Records'
              ].join(' | ')}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {isLoading ? (
          <StatsCardsSkeleton count={6} gridClassName="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 print-hide" baseDelay={40} stepDelay={40} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 print:grid-cols-6 print:gap-2 print:mb-4">
            <div className="stagger-reveal bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 rounded-2xl text-center shadow-sm transition-colors print:border-slate-300 print:p-2 print:shadow-none" style={{ animationDelay: '0.04s' }}>
              <FileText size={18} className="mx-auto text-slate-500 dark:text-slate-400 mb-1 print:hidden" />
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white print:text-lg">{summary.total}</p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide print:text-[8px] print:text-slate-600">Total Records</p>
            </div>
            <div className="stagger-reveal bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3 sm:p-4 rounded-2xl text-center shadow-sm transition-colors print:bg-white print:border-slate-300 print:p-2 print:shadow-none" style={{ animationDelay: '0.08s' }}>
              <CheckCircle size={18} className="mx-auto text-emerald-600 dark:text-emerald-400 mb-1 print:hidden" />
              <p className="text-xl sm:text-2xl font-black text-emerald-900 dark:text-emerald-300 print:text-slate-900 print:text-lg">{summary.active}</p>
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide print:text-[8px] print:text-slate-600">Active</p>
            </div>
            <div className="stagger-reveal bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3 sm:p-4 rounded-2xl text-center shadow-sm transition-colors print:bg-white print:border-slate-300 print:p-2 print:shadow-none" style={{ animationDelay: '0.12s' }}>
              <Clock size={18} className="mx-auto text-amber-600 dark:text-amber-400 mb-1 print:hidden" />
              <p className="text-xl sm:text-2xl font-black text-amber-900 dark:text-amber-300 print:text-slate-900 print:text-lg">{summary.pending}</p>
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide print:text-[8px] print:text-slate-600">Pending</p>
            </div>
            <div className="stagger-reveal bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 p-3 sm:p-4 rounded-2xl text-center shadow-sm transition-colors print:bg-white print:border-slate-300 print:p-2 print:shadow-none" style={{ animationDelay: '0.16s' }}>
              <AlertTriangle size={18} className="mx-auto text-orange-600 dark:text-orange-400 mb-1 print:hidden" />
              <p className="text-xl sm:text-2xl font-black text-orange-900 dark:text-orange-300 print:text-slate-900 print:text-lg">{summary.expired}</p>
              <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide print:text-[8px] print:text-slate-600">Expired</p>
            </div>
            <div className="stagger-reveal bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 p-3 sm:p-4 rounded-2xl text-center shadow-sm transition-colors print:bg-white print:border-slate-300 print:p-2 print:shadow-none" style={{ animationDelay: '0.2s' }}>
              <XCircle size={18} className="mx-auto text-red-600 dark:text-red-400 mb-1 print:hidden" />
              <p className="text-xl sm:text-2xl font-black text-red-900 dark:text-red-300 print:text-slate-900 print:text-lg">{summary.cancelled}</p>
              <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wide print:text-[8px] print:text-slate-600">Cancelled</p>
            </div>
            <div className="stagger-reveal bg-slate-800 dark:bg-slate-800/90 border border-slate-900 dark:border-slate-700 p-3 sm:p-4 rounded-2xl text-center shadow-sm transition-colors print:bg-white print:border-slate-300 print:p-2 print:shadow-none" style={{ animationDelay: '0.24s' }}>
              <Ban size={18} className="mx-auto text-slate-300 mb-1 print:hidden" />
              <p className="text-xl sm:text-2xl font-black text-white print:text-slate-900 print:text-lg">{summary.revoked}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide print:text-[8px] print:text-slate-600">Revoked</p>
            </div>
          </div>
        )}

        {/* Responsive Data Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors print:border-none print:shadow-none print:rounded-none">
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left text-xs sm:text-sm print:text-[10px] print:table">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-400">
                <tr>
                  <th className="p-3.5 sm:p-4 print:p-1.5 w-10 text-center">#</th>
                  <th className="p-3.5 sm:p-4 print:p-1.5">Plate No.</th>
                  <th className="p-3.5 sm:p-4 print:p-1.5">Operator Name</th>
                  <th className="p-3.5 sm:p-4 print:p-1.5">Address / Barangay</th>
                  <th className="p-3.5 sm:p-4 print:p-1.5">TODA</th>
                  <th className="p-3.5 sm:p-4 print:p-1.5">Date Applied</th>
                  <th className="p-3.5 sm:p-4 print:p-1.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 whitespace-nowrap text-xs print:divide-slate-200">
                {isLoading ? (
                  <TableRowsSkeleton rows={6} columns={7} baseDelay={140} stepDelay={40} />
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs sm:text-sm print:p-4">
                      No records found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  reports.map((report, rIdx) => (
                    <tr 
                      key={report._id} 
                      className="stagger-reveal hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors print:hover:bg-transparent"
                      style={{ animationDelay: `${rIdx * 30}ms` }}
                    >
                      <td className="p-3.5 sm:p-4 print:p-1.5 text-center font-mono text-slate-400 print:text-slate-600 text-[11px] print:text-[9px]">
                        {rIdx + 1}
                      </td>
                      <td className="p-3.5 sm:p-4 print:p-1.5 font-black text-slate-900 dark:text-white print:text-black">
                        {report.plateNo || 'PENDING'}
                      </td>
                      <td className="p-3.5 sm:p-4 print:p-1.5 text-slate-700 dark:text-slate-200 print:text-black font-medium">
                        {report.fullName}
                      </td>
                      <td className="p-3.5 sm:p-4 print:p-1.5 text-slate-600 dark:text-slate-300 print:text-slate-800">
                        {report.address || 'N/A'}
                      </td>
                      <td className="p-3.5 sm:p-4 print:p-1.5 text-slate-600 dark:text-slate-300 print:text-slate-800">
                        {report.todaName || 'NON-TODA'}
                      </td>
                      <td className="p-3.5 sm:p-4 print:p-1.5 text-slate-500 dark:text-slate-400 print:text-slate-700 font-mono">
                        {report.dateApplied ? new Date(report.dateApplied).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="p-3.5 sm:p-4 print:p-1.5">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider print:px-1.5 print:py-0.5 print:text-[8px] print:border print:border-slate-400 print:bg-transparent print:text-black ${
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

        {/* OFFICIAL PRINT FOOTER & SIGN-OFFS (Visible only on print) */}
        <div className="hidden print:block mt-8 pt-4 border-t border-slate-300 page-break-inside-avoid">
          <div className="grid grid-cols-3 gap-6 text-center text-xs">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-8">Prepared By:</p>
              <div className="border-b border-slate-900 w-4/5 mx-auto mb-1"></div>
              <p className="font-black text-slate-900 uppercase text-[11px]">{localStorage.getItem('name') || 'ADMINISTRATOR'}</p>
              <p className="text-[10px] text-slate-600">G-TRAMS System Administrator</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-8">Verified & Certified Correct:</p>
              <div className="border-b border-slate-900 w-4/5 mx-auto mb-1"></div>
              <p className="font-black text-slate-900 uppercase text-[11px]">BPLO / LICENSING OFFICER</p>
              <p className="text-[10px] text-slate-600">Municipality of Gasan</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-8">Approved By:</p>
              <div className="border-b border-slate-900 w-4/5 mx-auto mb-1"></div>
              <p className="font-black text-slate-900 uppercase text-[11px]">MUNICIPAL MAYOR</p>
              <p className="text-[10px] text-slate-600">Municipality of Gasan</p>
            </div>
          </div>
          <p className="text-[9px] text-slate-400 text-center mt-6">
            G-TRAMS &bull; Gasan Tricycle Record and Management System &bull; Official Document
          </p>
        </div>

      </div>
    </MainLayout>
  );
};

export default AdminReports;