import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout';
import { UploadCloud, FileText, CheckCircle2, Clock3, ArrowLeft, X, Loader2, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SubmissionCardsSkeleton } from '../../components/skeleton';

const SubmitMembers = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [submissions, setSubmissions] = useState([]); 
  const navigate = useNavigate();

  // Load submission history on mount
  useEffect(() => {
    fetchMySubmissions();
  }, []);

  const fetchMySubmissions = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/toda/my-submissions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSubmissions(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/toda/upload', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Prepend new submission to state
        setSubmissions(prev => [data.submission, ...prev]);
        setFile(null);
        alert('File successfully submitted to the Administrator!');
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Cannot connect to the server.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <MainLayout>
      {/* Header with back navigation */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-spring-in">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/operator-dashboard')}
            className="w-9 h-9 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-2xs touch-bounce active:scale-90"
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Submit TODA Members</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Upload official member roster of tricycle operators & drivers.</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Upload Card */}
        <div className="lg:col-span-2">
          <div className="animate-spring-in bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/90 dark:border-slate-800 p-5 sm:p-7 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-slate-900 dark:text-white">Upload Member Roster</h2>
              <span className="text-[10px] font-bold text-[#7A1B22] dark:text-[#D4AF37] uppercase tracking-wider bg-[#7A1B22]/10 dark:bg-[#D4AF37]/15 px-2.5 py-0.5 rounded-full">
                PDF &bull; Excel &bull; CSV
              </span>
            </div>
            
            <form onSubmit={handleUpload}>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 sm:p-8 text-center hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors relative group">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mx-auto mb-3 text-[#7A1B22] dark:text-[#D4AF37] shadow-2xs group-hover:scale-105 transition-transform">
                  <UploadCloud size={28} />
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Drag and drop your file here, or tap below</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">Supported formats: PDF, Excel (.xlsx, .csv)</p>
                
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  accept=".pdf, .xlsx, .csv"
                  onChange={handleFileChange}
                />
                <label 
                  htmlFor="file-upload"
                  className="inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 px-5 py-2 rounded-xl font-bold text-xs cursor-pointer transition-colors shadow-2xs touch-bounce active:scale-95"
                >
                  Browse Files
                </label>

                {file && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-[#7A1B22] dark:text-[#D4AF37] bg-[#7A1B22]/10 dark:bg-[#D4AF37]/15 py-2 px-3 rounded-xl inline-flex animate-spring-in border border-[#7A1B22]/20 dark:border-[#D4AF37]/20">
                    <FileSpreadsheet size={15} />
                    <span className="truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
                    <button 
                      type="button" 
                      onClick={() => setFile(null)} 
                      className="text-slate-400 hover:text-red-500 ml-1 p-0.5"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={!file || isUploading}
                className={`w-full mt-5 py-3 rounded-xl font-bold text-xs text-white transition-all shadow-sm flex items-center justify-center gap-2 touch-bounce active:scale-98 ${
                  !file || isUploading 
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-600 cursor-not-allowed' 
                  : 'bg-[#7A1B22] hover:bg-[#5A1419] cursor-pointer'
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Uploading to Database...</span>
                  </>
                ) : (
                  <span>Submit Member List</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* History Card */}
        <div className="lg:col-span-1">
          <div className="animate-spring-in bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 transition-colors">
            <h2 className="text-base font-black text-slate-900 dark:text-white mb-3.5">Recent Submissions</h2>
            
            <div className="space-y-2.5">
              {isLoadingHistory ? (
                <SubmissionCardsSkeleton count={3} baseDelay={30} stepDelay={45} />
              ) : submissions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-medium bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                  No submissions yet.
                </div>
              ) : (
                submissions.map((sub, sIdx) => (
                  <div 
                    key={sub._id || sIdx} 
                    className="stagger-reveal p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-800/40 flex flex-col gap-1.5"
                    style={{ animationDelay: `${sIdx * 35}ms` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 min-w-0">
                        <FileText size={15} className="text-[#7A1B22] dark:text-[#D4AF37] shrink-0" />
                        <span className="truncate">{sub.fileName}</span>
                      </div>
                      
                      {/* Dynamic Badge Status */}
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase flex items-center gap-1 shrink-0 ${
                        sub.status === 'Approved' 
                        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60' 
                        : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60'
                      }`}>
                        {sub.status === 'Approved' ? <CheckCircle2 size={10} /> : <Clock3 size={10} />}
                        {sub.status}
                      </span>
                    </div>
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 pl-6">
                      Submitted on {new Date(sub.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SubmitMembers;