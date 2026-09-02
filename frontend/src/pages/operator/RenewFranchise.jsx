import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const RenewFranchise = () => {
  const navigate = useNavigate();
  // Assume we get the franchise ID from the URL params
  const { id } = useParams(); 

  // Empty state for actual database integration
  const [formData, setFormData] = useState({
    ctcNo: '',
    dateIssued: '',
    placeIssued: '',
    orcrFile: null
  });

  // Text input handler
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // File input handler
  const handleFileChange = (e) => {
    setFormData({ ...formData, orcrFile: e.target.files[0] });
  };

  // Submit to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Using FormData for file uploads
    const data = new FormData();
    data.append('ctcNo', formData.ctcNo);
    data.append('dateIssued', formData.dateIssued);
    data.append('placeIssued', formData.placeIssued);
    if (formData.orcrFile) {
      data.append('orcrFile', formData.orcrFile);
    }

    try {
      // Assuming your API endpoint for renewal includes the franchise ID
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/${id}/renew`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: data
      });

      if (response.ok) {
        alert('Franchise renewal submitted successfully!');
        navigate('/operator-dashboard');
      } else {
        alert('Failed to submit renewal application.');
      }
    } catch (error) {
      console.error('Server error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] p-4 sm:p-6 flex justify-center items-start pt-8 sm:pt-12 transition-colors">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-sm p-6 sm:p-8 border border-slate-200 dark:border-slate-800 border-t-4 border-t-[#7A1B22] transition-colors">
        
        {/* Header */}
        <header className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-1 h-6 bg-[#7A1B22] rounded-full" />
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Renew Franchise</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Submit your updated requirements for renewal.</p>
          </div>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Renewal Requirements Section */}
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Renewal Requirements</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">New CTC No.</label>
                <input 
                  type="text" 
                  name="ctcNo" 
                  value={formData.ctcNo}
                  onChange={handleChange} 
                  required 
                  className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#7A1B22] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-[#7A1B22]/15 transition-all" 
                  placeholder="Enter new CTC Number"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Date Issued</label>
                <input 
                  type="date" 
                  name="dateIssued" 
                  value={formData.dateIssued}
                  onChange={handleChange} 
                  required 
                  className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#7A1B22] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-[#7A1B22]/15 transition-all" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Place Issued</label>
                <input 
                  type="text" 
                  name="placeIssued" 
                  value={formData.placeIssued}
                  onChange={handleChange} 
                  required 
                  className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#7A1B22] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-[#7A1B22]/15 transition-all" 
                  placeholder="Enter place of issue"
                />
              </div>
            </div>
          </div>

          {/* Document Upload Section */}
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">Vehicle Document</h3>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Upload Updated OR/CR (Image or PDF)</label>
            <input 
              type="file" 
              accept=".pdf, image/*" 
              onChange={handleFileChange} 
              required 
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 focus:outline-none" 
            />
          </div>

          {/* Submit Actions */}
          <div className="flex space-x-3 sm:space-x-4 mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button 
              type="button" 
              onClick={() => navigate('/operator-dashboard')} 
              className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-colors"
            >
              Back
            </button>
            <button 
              type="submit" 
              className="flex-1 bg-[#7A1B22] hover:bg-[#5A1419] text-white py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-colors shadow-xs active:scale-98"
            >
              Submit
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default RenewFranchise;