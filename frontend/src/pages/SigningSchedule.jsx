import React, { useState, useEffect } from 'react';

const SigningSchedule = () => {
  // Empty state for database records
  const [schedules, setSchedules] = useState([]);
  const [formData, setFormData] = useState({
    date: '',
    status: 'Available',
    remarks: ''
  });

  // Fetch schedules from backend
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/v1/schedules', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        
        if (response.ok) {
          setSchedules(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch schedules:', error);
      }
    };

    fetchSchedules();
  }, []);

  // Form input handler
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit new schedule
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/v1/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Schedule successfully saved!');
        // Ideally, re-fetch schedules here to update the list
        setFormData({ date: '', status: 'Available', remarks: '' });
      } else {
        alert('Failed to save schedule.');
      }
    } catch (error) {
      console.error('Server error:', error);
    }
  };

  // Delete schedule handler
  const handleDelete = async (id) => {
    // API logic to delete a schedule will go here
    console.log(`Deleting schedule with ID: ${id}`);
  };

  return (
    // Main Container
    <div className="p-6 bg-background min-h-screen">
      
      // Page Header
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-maroon">Office Schedule</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        // Left Column: Create Schedule Form
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow border-t-4 border-maroon">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Create Schedule</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input 
                type="date" 
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-maroon" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select 
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-maroon"
              >
                <option value="Available">Available</option>
                <option value="Unavailable">Unavailable</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Remarks</label>
              <textarea 
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows="3"
                placeholder="Ex. Mayor is out of town"
                className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-maroon"
              ></textarea>
            </div>

            <button type="submit" className="w-full bg-maroon text-white font-bold py-2 rounded hover:bg-maroon-dark transition">
              Save Schedule
            </button>
          </form>
        </div>

        // Right Column: Upcoming Schedules List
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Upcoming Schedules</h3>
          
          <div className="space-y-4">
            {schedules.length === 0 ? (
              // Empty State
              <p className="text-gray-500 italic">No upcoming schedules found.</p>
            ) : (
              // Map Actual Schedules
              schedules.map((schedule, index) => (
                <div key={index} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{schedule.date}</p>
                    <p className={`text-sm font-bold uppercase ${schedule.status === 'Available' ? 'text-success' : 'text-red-500'}`}>
                      {schedule.status}
                    </p>
                    {schedule.remarks && <p className="text-sm text-gray-600 mt-1">{schedule.remarks}</p>}
                  </div>
                  <button 
                    onClick={() => handleDelete(schedule._id)}
                    className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SigningSchedule;