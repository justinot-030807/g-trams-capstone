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
      const response = await fetch(`http://localhost:3000/api/v1/franchises/${id}/renew`, {
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
    // Main Container
    <div className="min-h-screen bg-background p-6 flex justify-center items-start pt-12">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow p-8 border-t-4 border-maroon">
        
        // Header
        <div className="mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-maroon">Renew Franchise</h2>
          <p className="text-sm text-gray-500">Submit your updated requirements for renewal.</p>
        </div>

        // Form
        <form onSubmit={handleSubmit} className="space-y-6">
          
          // Renewal Requirements Section
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Renewal Requirements</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New CTC No.</label>
                <input 
                  type="text" 
                  name="ctcNo" 
                  value={formData.ctcNo}
                  onChange={handleChange} 
                  required 
                  className="w-full border p-2 rounded focus:border-maroon focus:outline-none" 
                  placeholder="Enter new CTC Number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Issued</label>
                <input 
                  type="date" 
                  name="dateIssued" 
                  value={formData.dateIssued}
                  onChange={handleChange} 
                  required 
                  className="w-full border p-2 rounded focus:border-maroon text-gray-700 focus:outline-none" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Place Issued</label>
                <input 
                  type="text" 
                  name="placeIssued" 
                  value={formData.placeIssued}
                  onChange={handleChange} 
                  required 
                  className="w-full border p-2 rounded focus:border-maroon focus:outline-none" 
                  placeholder="Enter place of issue"
                />
              </div>
            </div>
          </div>

          // Document Upload Section
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-6 border-t pt-4">Vehicle Document</h3>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Updated OR/CR (Image or PDF)</label>
            <input 
              type="file" 
              accept=".pdf, image/*" 
              onChange={handleFileChange} 
              required 
              className="w-full border p-2 rounded bg-gray-50 focus:outline-none" 
            />
          </div>

          // Submit Actions
          <div className="flex space-x-4 mt-8 pt-4 border-t">
            <button 
              type="button" 
              onClick={() => navigate('/operator-dashboard')} 
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded font-semibold hover:bg-gray-300 transition"
            >
              Back
            </button>
            <button 
              type="submit" 
              className="flex-1 bg-maroon text-white py-3 rounded font-bold hover:bg-maroon-dark transition"
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