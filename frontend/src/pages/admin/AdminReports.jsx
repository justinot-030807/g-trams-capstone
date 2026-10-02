import React, { useState, useEffect } from 'react';
import { GASAN_BARANGAYS, TODA_LIST } from '../../utils/constants';
import MainLayout from '../../components/MainLayout';
import { Printer, Filter, Download } from 'lucide-react';
import { StatsCardsSkeleton, TableRowsSkeleton } from '../../components/skeleton';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';

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

  const handleExportCSV = () => {
    if (!reports || reports.length === 0) return;

    const headers = [
      'Seq No',
      'Plate No',
      'Operator Full Name',
      'Address / Barangay',
      'TODA Association',
      'Date Applied',
      'Status'
    ];

    const rows = reports.map((r, i) => [
      i + 1,
      `"${(r.plateNo || 'PENDING').replace(/"/g, '""')}"`,
      `"${(r.fullName || '').replace(/"/g, '""')}"`,
      `"${(r.address || 'N/A').replace(/"/g, '""')}"`,
      `"${(r.todaName || 'NON-TODA').replace(/"/g, '""')}"`,
      `"${r.dateApplied ? new Date(r.dateApplied).toLocaleDateString() : 'N/A'}"`,
      `"${(r.status || '').replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `GTRAMS_Report_${filters.status || 'All'}_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const inputClasses = "w-full bg-white dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3 py-1.5 text-xs sm:text-sm text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] transition-colors";

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
      <div className="print:hidden print-hide mb-6">
        <PageHeader 
          title="System Reports"
          subtitle="Filter, inspect, export, and print official municipality franchise records."
          actions={
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button 
                onClick={handleExportCSV}
                className="flex-1 sm:flex-initial bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] border border-[#E4E1DC] dark:border-[#2E2A27] px-3.5 py-1.5 rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                title="Export filtered reports to CSV"
              >
                <Download size={15} />
                <span>Export CSV</span>
              </button>
              <button 
                onClick={handlePrint}
                className="flex-1 sm:flex-initial bg-[#9E2A2B] hover:bg-[#7A1B22] text-white px-3.5 py-1.5 rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Printer size={15} />
                <span>Print Report</span>
              </button>
            </div>
          }
        />
      </div>

      {/* Filter Criteria */}
      <div className="bg-white dark:bg-[#1C1917] p-4 sm:p-5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs mb-6 print:hidden print-hide transition-colors">
        <h2 className="text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider mb-3 flex items-center gap-2">
          <Filter size={14} className="text-[#9E2A2B] dark:text-[#D4AF37]" /> Filter Criteria
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase mb-1">Date From</label>
            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className={inputClasses} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase mb-1">Date To</label>
            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className={inputClasses} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase mb-1">Status</label>
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
            <label className="block text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase mb-1">TODA</label>
            <select name="todaName" value={filters.todaName} onChange={handleFilterChange} className={inputClasses}>
              <option value="">All TODA</option>
              {TODA_LIST.map((toda, i) => <option key={i} value={toda}>{toda}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase mb-1">Barangay</label>
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
              <p className="text-xs uppercase tracking-widest font-serif text-slate-700 font-semibold">Republic of the Philippines</p>
              <p className="text-xs uppercase tracking-wider font-serif text-slate-700">Province of Marinduque</p>
              <p className="text-sm font-bold uppercase tracking-wide text-slate-950">Municipality of Gasan</p>
              <p className="text-xs font-bold text-[#9E2A2B] uppercase tracking-wider mt-0.5">Office of the Municipal Mayor &bull; Licensing Division</p>
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 mt-1">
                Official Franchise System Report
              </h2>
            </div>
            <div className="w-16 h-16 shrink-0 flex items-center justify-center opacity-0" />
          </div>

          {/* Report Metadata Strip */}
          <div className="mt-3 pt-2 border-t border-slate-300 flex flex-wrap justify-between text-xs text-slate-600">
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
            <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] p-3 sm:p-4 rounded-lg text-center shadow-xs transition-colors print:border-slate-300 print:p-2 print:shadow-none">
              <p className="text-xl sm:text-2xl font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] font-mono tabular-nums print:text-lg">{summary.total}</p>
              <p className="text-[11px] font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wide print:text-[8px] print:text-slate-600">Total Records</p>
            </div>
            <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] p-3 sm:p-4 rounded-lg text-center shadow-xs transition-colors print:border-slate-300 print:p-2 print:shadow-none">
              <p className="text-xl sm:text-2xl font-semibold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums print:text-slate-900 print:text-lg">{summary.active}</p>
              <p className="text-[11px] font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wide print:text-[8px] print:text-slate-600">Active</p>
            </div>
            <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] p-3 sm:p-4 rounded-lg text-center shadow-xs transition-colors print:border-slate-300 print:p-2 print:shadow-none">
              <p className="text-xl sm:text-2xl font-semibold text-amber-700 dark:text-amber-400 font-mono tabular-nums print:text-slate-900 print:text-lg">{summary.pending}</p>
              <p className="text-[11px] font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wide print:text-[8px] print:text-slate-600">Pending</p>
            </div>
            <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] p-3 sm:p-4 rounded-lg text-center shadow-xs transition-colors print:border-slate-300 print:p-2 print:shadow-none">
              <p className="text-xl sm:text-2xl font-semibold text-red-700 dark:text-red-400 font-mono tabular-nums print:text-slate-900 print:text-lg">{summary.expired}</p>
              <p className="text-[11px] font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wide print:text-[8px] print:text-slate-600">Expired</p>
            </div>
            <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] p-3 sm:p-4 rounded-lg text-center shadow-xs transition-colors print:border-slate-300 print:p-2 print:shadow-none">
              <p className="text-xl sm:text-2xl font-semibold text-[#6B6761] dark:text-[#A8A29E] font-mono tabular-nums print:text-slate-900 print:text-lg">{summary.cancelled}</p>
              <p className="text-[11px] font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wide print:text-[8px] print:text-slate-600">Cancelled</p>
            </div>
            <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] p-3 sm:p-4 rounded-lg text-center shadow-xs transition-colors print:border-slate-300 print:p-2 print:shadow-none">
              <p className="text-xl sm:text-2xl font-semibold text-red-700 dark:text-red-400 font-mono tabular-nums print:text-slate-900 print:text-lg">{summary.revoked}</p>
              <p className="text-[11px] font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wide print:text-[8px] print:text-slate-600">Revoked</p>
            </div>
          </div>
        )}

        {/* Responsive Data Table */}
        <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg shadow-xs overflow-hidden transition-colors print:border-none print:shadow-none print:rounded-none">
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left text-xs sm:text-sm print:text-xs print:table">
              <thead className="bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] font-semibold uppercase text-xs tracking-wider whitespace-nowrap print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-400">
                <tr>
                  <th className="p-3 sm:p-3.5 print:p-1.5 w-10 text-center font-mono">#</th>
                  <th className="p-3 sm:p-3.5 print:p-1.5">Plate No.</th>
                  <th className="p-3 sm:p-3.5 print:p-1.5">Operator Name</th>
                  <th className="p-3 sm:p-3.5 print:p-1.5">Address / Barangay</th>
                  <th className="p-3 sm:p-3.5 print:p-1.5">TODA</th>
                  <th className="p-3 sm:p-3.5 print:p-1.5">Date Applied</th>
                  <th className="p-3 sm:p-3.5 print:p-1.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27] whitespace-nowrap text-xs print:divide-slate-200">
                {isLoading ? (
                  <TableRowsSkeleton rows={6} columns={7} baseDelay={140} stepDelay={40} />
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-[#6B6761] dark:text-[#A8A29E] text-xs sm:text-sm print:p-4">
                      No records found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  reports.map((report, rIdx) => (
                    <tr 
                      key={report._id} 
                      className="hover:bg-[#F6F5F3]/60 dark:hover:bg-[#14110F]/60 transition-colors print:hover:bg-transparent"
                    >
                      <td className="p-3 sm:p-3.5 print:p-1.5 text-center font-mono text-[#6B6761] dark:text-[#A8A29E] print:text-slate-600 text-xs print:text-[9px] tabular-nums">
                        {rIdx + 1}
                      </td>
                      <td className="p-3 sm:p-3.5 print:p-1.5 font-mono font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] print:text-black">
                        {report.plateNo || 'PENDING'}
                      </td>
                      <td className="p-3 sm:p-3.5 print:p-1.5 text-[#1F1D1B] dark:text-[#F6F5F3] print:text-black font-medium">
                        {report.fullName}
                      </td>
                      <td className="p-3 sm:p-3.5 print:p-1.5 text-[#6B6761] dark:text-[#A8A29E] print:text-slate-800">
                        {report.address || 'N/A'}
                      </td>
                      <td className="p-3 sm:p-3.5 print:p-1.5 text-[#6B6761] dark:text-[#A8A29E] print:text-slate-800">
                        {report.todaName || 'NON-TODA'}
                      </td>
                      <td className="p-3 sm:p-3.5 print:p-1.5 text-[#6B6761] dark:text-[#A8A29E] print:text-slate-700 font-mono tabular-nums">
                        {report.dateApplied ? new Date(report.dateApplied).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="p-3 sm:p-3.5 print:p-1.5">
                        <StatusBadge status={report.status} />
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
              <p className="text-xs uppercase font-bold text-slate-500 mb-8">Prepared By:</p>
              <div className="border-b border-slate-900 w-4/5 mx-auto mb-1"></div>
              <p className="font-bold text-slate-900 uppercase text-xs">{localStorage.getItem('name') || 'ADMINISTRATOR'}</p>
              <p className="text-xs text-slate-600">G-TRAMS System Administrator</p>
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-slate-500 mb-8">Verified & Certified Correct:</p>
              <div className="border-b border-slate-900 w-4/5 mx-auto mb-1"></div>
              <p className="font-bold text-slate-900 uppercase text-xs">LICENSING OFFICER</p>
              <p className="text-xs text-slate-600">Municipality of Gasan</p>
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-slate-500 mb-8">Approved By:</p>
              <div className="border-b border-slate-900 w-4/5 mx-auto mb-1"></div>
              <p className="font-bold text-slate-900 uppercase text-xs">MUNICIPAL MAYOR</p>
              <p className="text-xs text-slate-600">Municipality of Gasan</p>
            </div>
          </div>
          <p className="text-[9px] text-slate-600 dark:text-slate-400 text-center mt-6">
            G-TRAMS &bull; Gasan Tricycle Record and Management System &bull; Official Document
          </p>
        </div>

      </div>
    </MainLayout>
  );
};

export default AdminReports;
