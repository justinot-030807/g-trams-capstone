import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/MainLayout';
import { useLanguage } from '../../context/LanguageContext';
import { CheckSquare, Square, UploadCloud, ChevronLeft, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import FeedbackModal from '../../components/common/FeedbackModal';
import DocumentUploadCard from '../../components/operator/DocumentUploadCard';

const BatchRenewal = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [eligibleUnits, setEligibleUnits] = useState([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Shared CTC
  const [ctcData, setCtcData] = useState({
    cedulaSerialNo: '',
    cedulaDate: '',
    cedulaAddress: ''
  });

  // Per-unit ORCR files
  const [unitFiles, setUnitFiles] = useState({}); // { franchiseId: File }

  const [feedback, setFeedback] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  useEffect(() => {
    fetchEligibleUnits();
  }, []);

  const fetchEligibleUnits = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/my-franchises`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Only allow Expired or Active units for renewal
        const eligible = data.filter(u => u.status === 'Expired' || u.status === 'Active');
        setEligibleUnits(eligible);
        setSelectedUnitIds(eligible.map(u => u._id)); // Select all by default
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUnitSelection = (id) => {
    setSelectedUnitIds(prev => 
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  const handleFileChange = (unitId, file) => {
    setUnitFiles(prev => ({ ...prev, [unitId]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedUnitIds.length === 0) {
      setFeedback({ isOpen: true, type: 'error', title: 'Error', message: 'Please select at least one unit to renew.' });
      return;
    }
    if (!ctcData.cedulaSerialNo || !ctcData.cedulaDate || !ctcData.cedulaAddress) {
      setFeedback({ isOpen: true, type: 'error', title: 'Error', message: 'Please complete the shared Community Tax Certificate (Cedula) details.' });
      return;
    }

    // Check if all selected units have an OR/CR file uploaded
    const missingFiles = selectedUnitIds.filter(id => !unitFiles[id]);
    if (missingFiles.length > 0) {
      setFeedback({ isOpen: true, type: 'error', title: 'Error', message: 'Please upload the OR/CR for all selected units.' });
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('franchiseIds', JSON.stringify(selectedUnitIds));
    formData.append('cedulaSerialNo', ctcData.cedulaSerialNo);
    formData.append('cedulaDate', ctcData.cedulaDate);
    formData.append('cedulaAddress', ctcData.cedulaAddress);
    
    // Set date applied to now
    formData.append('dateApplied', new Date().toISOString());

    selectedUnitIds.forEach(id => {
      if (unitFiles[id]) {
        formData.append(`orcrFile_${id}`, unitFiles[id]);
      }
    });

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/batch-renew`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });

      if (res.ok) {
        setFeedback({
          isOpen: true,
          type: 'success',
          title: 'Batch Renewal Submitted',
          message: 'Your applications have been submitted for review.',
          onConfirm: () => navigate('/operator-dashboard')
        });
      } else {
        const d = await res.json();
        setFeedback({ isOpen: true, type: 'error', title: 'Submission Failed', message: d.message || 'An error occurred during submission.' });
      }
    } catch (err) {
      setFeedback({ isOpen: true, type: 'error', title: 'Network Error', message: 'Could not connect to the server.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto pb-10">
        <button 
          onClick={() => navigate('/operator-dashboard')}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 mb-6 transition-colors text-sm font-medium"
        >
          <ChevronLeft size={16} /> Back to Dashboard
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <RefreshCw size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Batch Renewal</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Renew multiple tricycle units at once using a shared Cedula.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin text-slate-400" size={32} /></div>
        ) : eligibleUnits.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center">
            <AlertCircle size={40} className="mx-auto text-slate-400 mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Eligible Units</h3>
            <p className="text-slate-500 mt-1">You don't have any expired or expiring units to renew.</p>
            <button onClick={() => navigate('/operator-dashboard')} className="mt-4 px-6 py-2 bg-[#7A1B22] text-white rounded-xl font-bold">Go Back</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Step 1: Select Units */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">1. Select Units to Renew</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {eligibleUnits.map(unit => {
                  const isSelected = selectedUnitIds.includes(unit._id);
                  return (
                    <div 
                      key={unit._id}
                      onClick={() => toggleUnitSelection(unit._id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                        isSelected 
                          ? 'border-[#7A1B22] dark:border-[#D4AF37] bg-[#7A1B22]/5 dark:bg-[#D4AF37]/10' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className={`mt-0.5 ${isSelected ? 'text-[#7A1B22] dark:text-[#D4AF37]' : 'text-slate-300 dark:text-slate-600'}`}>
                        {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">{unit.plateNo || 'PENDING PLATE'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{unit.make} ({unit.made})</p>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Status: {unit.status}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Shared CTC Data */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">2. Shared Community Tax Certificate</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Cedula Number *</label>
                  <input
                    type="text"
                    required
                    value={ctcData.cedulaSerialNo}
                    onChange={e => setCtcData({...ctcData, cedulaSerialNo: e.target.value})}
                    className="w-full min-h-[42px] px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7A1B22] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Date Issued *</label>
                  <input
                    type="date"
                    required
                    value={ctcData.cedulaDate}
                    onChange={e => setCtcData({...ctcData, cedulaDate: e.target.value})}
                    className="w-full min-h-[42px] px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7A1B22] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Place Issued *</label>
                  <input
                    type="text"
                    required
                    value={ctcData.cedulaAddress}
                    onChange={e => setCtcData({...ctcData, cedulaAddress: e.target.value})}
                    className="w-full min-h-[42px] px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7A1B22] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Per-Unit OR/CR Uploads */}
            {selectedUnitIds.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">3. Upload Official Receipts / Certificates of Registration</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedUnitIds.map(id => {
                    const unit = eligibleUnits.find(u => u._id === id);
                    return (
                      <div key={id} className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl">
                        <p className="font-bold text-sm mb-2">{unit?.plateNo || 'PENDING PLATE'}</p>
                        <DocumentUploadCard
                          title="OR/CR Document"
                          description="Current Official Receipt & Cert. of Registration"
                          icon={<UploadCloud size={16} />}
                          onFileSelect={(file) => handleFileChange(id, file)}
                          error={!unitFiles[id] ? "Required" : null}
                          showCameraOption={true}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => navigate('/operator-dashboard')}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || selectedUnitIds.length === 0}
                className="px-8 py-2.5 rounded-xl font-bold text-sm text-white bg-[#7A1B22] hover:bg-[#5A1419] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] dark:text-slate-950 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                Submit Batch Renewal
              </button>
            </div>
          </form>
        )}
      </div>

      <FeedbackModal
        isOpen={feedback.isOpen}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        onClose={() => {
          setFeedback(prev => ({ ...prev, isOpen: false }));
          if (feedback.onConfirm) feedback.onConfirm();
        }}
        onConfirm={() => {
          setFeedback(prev => ({ ...prev, isOpen: false }));
          if (feedback.onConfirm) feedback.onConfirm();
        }}
      />
    </MainLayout>
  );
};

export default BatchRenewal;
