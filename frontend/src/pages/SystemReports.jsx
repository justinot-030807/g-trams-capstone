import React, { useState } from 'react';

const SystemReports = () => {
  const [reportType, setReportType] = useState('active_franchises');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [reportData, setReportData] = useState([]);

  // Fetch report data from backend
  const handleGenerateReport = async (e) => {
    e.preventDefault();
    try {
      // Setup query parameters for the API call
      const queryParams = new URLSearchParams({
        type: reportType,
        startDate: dateRange.start,
        endDate: dateRange.end
      });

      const response = await fetch(`http://localhost:3000/api/v1/reports?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      const data = await response.json();
      if (response.ok) {
        setReportData(data.data || []);
      } else {
        alert('Failed to fetch report data.');
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  return (
    // Main Container
    <div className="p-6 bg-background min-h-screen">
      
      // Page Header (Hidden during print)
      <div className="mb-6 flex justify-between items-center print:hidden">
        <h2 className="text-2xl font-bold text-maroon">Generate Reports</h2>
      </div>

      // Filter Section (Hidden during print)
      <div className="bg-white p-6 rounded-lg shadow mb-6 border-t-4 border-maroon print:hidden">
        <form onSubmit={handleGenerateReport} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select 
              value={reportType} 
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-maroon"
            >
              <option value="active_franchises">Active Franchises</option>
              <option value="expired_franchises">Expired Franchises</option>
              <option value="toda_summary">TODA Summary</option>
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-maroon"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-maroon"
            />
          </div>

          <div className="md:col-span-1 flex space-x-2">
            <button 
              type="submit" 
              className="flex-1 bg-maroon text-white font-bold py-2 rounded hover:bg-maroon-dark transition"
            >
              Generate
            </button>
            <button 
              type="button" 
              onClick={handlePrint}
              disabled={reportData.length === 0}
              className={`flex-1 font-bold py-2 rounded transition ${reportData.length > 0 ? 'bg-gold text-maroon hover:bg-yellow-500' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              Print
            </button>
          </div>

        </form>
      </div>

      // Printable Report Area
      <div className="bg-white rounded-lg shadow overflow-hidden p-8 print:shadow-none print:p-0">
        
        // Print Header (Visible on print, hidden on screen)
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-2xl font-bold text-black uppercase">Municipality of Gasan</h1>
          <h2 className="text-lg font-semibold text-gray-800">Office of the Municipal Vice Mayor</h2>
          <h3 className="text-md font-medium text-gray-600 mt-2">
            {reportType.replace('_', ' ').toUpperCase()} REPORT
          </h3>
          <p className="text-sm text-gray-500">
            {dateRange.start && dateRange.end ? `From: ${dateRange.start} To: ${dateRange.end}` : 'As of Today'}
          </p>
        </div>

        // Data Table
        <table className="w-full text-left border-collapse print:border">
          <thead className="bg-gray-50 border-b border-gray-200 print:bg-white print:border-black">
            <tr>
              <th className="p-4 text-sm font-semibold text-gray-600 print:text-black print:border-b print:border-black">ID / Plate No.</th>
              <th className="p-4 text-sm font-semibold text-gray-600 print:text-black print:border-b print:border-black">Operator Name</th>
              <th className="p-4 text-sm font-semibold text-gray-600 print:text-black print:border-b print:border-black">Zone / TODA</th>
              <th className="p-4 text-sm font-semibold text-gray-600 print:text-black print:border-b print:border-black">Status</th>
            </tr>
          </thead>
          
          <tbody>
            {reportData.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-500 font-medium print:hidden">
                  No data generated yet. Click "Generate" to view records.
                </td>
              </tr>
            ) : (
              // Map Actual Report Data
              reportData.map((row, index) => (
                <tr key={index} className="border-b border-gray-100 print:border-gray-300">
                  <td className="p-4 text-gray-800 font-medium print:text-black">{row.plateNo || row._id}</td>
                  <td className="p-4 text-gray-600 print:text-black">{row.operatorName || 'N/A'}</td>
                  <td className="p-4 text-gray-600 print:text-black">{row.zone || 'N/A'}</td>
                  <td className="p-4 font-bold print:text-black uppercase text-xs">
                    {row.status || 'Active'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        // Print Footer Signatures (Only visible on print)
        <div className="hidden print:flex justify-between mt-16 pt-8">
          <div className="text-center w-48">
            <div className="border-b border-black mb-1"></div>
            <p className="text-sm font-bold text-black">Prepared By</p>
            <p className="text-xs text-black">LGU Staff</p>
          </div>
          <div className="text-center w-48">
            <div className="border-b border-black mb-1"></div>
            <p className="text-sm font-bold text-black">Noted By</p>
            <p className="text-xs text-black">Municipal Vice Mayor</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SystemReports;