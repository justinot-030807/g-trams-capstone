import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { UploadCloud, FileText, CheckCircle, Clock } from 'lucide-react';

const SubmitMembers = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [submissions, setSubmissions] = useState([]); 

  // ITO YUNG BAGONG DAGDAG: Kukunin ang history pag-load ng page!
  useEffect(() => {
    fetchMySubmissions();
  }, []);

  const fetchMySubmissions = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/toda/my-submissions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data); // Ilalagay na sa screen ang mga galing database
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
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
        // Idadagdag ang bagong upload sa itaas ng listahan nang hindi nag-rerefresh
        setSubmissions([data.submission, ...submissions]);
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
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Submit TODA Members</h1>
        <p className="text-sm text-slate-500 mt-1">Upload the official list of your tricycle operators and drivers.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Upload Document</h2>
            
            <form onSubmit={handleUpload}>
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:bg-slate-50 transition-colors">
                <UploadCloud className="mx-auto text-slate-400 mb-4" size={48} />
                <p className="text-sm font-medium text-slate-700 mb-1">Drag and drop your file here, or click to browse</p>
                <p className="text-xs text-slate-500 mb-6">Supported formats: PDF, Excel (.xlsx, .csv)</p>
                
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  accept=".pdf, .xlsx, .csv"
                  onChange={handleFileChange}
                />
                <label 
                  htmlFor="file-upload"
                  className="inline-flex items-center justify-center bg-slate-100 text-slate-700 hover:bg-slate-200 px-6 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-colors shadow-sm"
                >
                  Browse Files
                </label>

                {file && (
                  <div className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-[#7A1B22] bg-[#7A1B22]/10 py-2 px-4 rounded-lg inline-flex">
                    <FileText size={16} />
                    {file.name}
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={!file || isUploading}
                className={`w-full mt-6 py-3.5 rounded-xl font-bold text-white transition-all shadow-sm flex items-center justify-center gap-2 ${
                  !file || isUploading 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-[#7A1B22] hover:bg-[#5A1419] active:scale-[0.99]'
                }`}
              >
                {isUploading ? 'Uploading to Database...' : 'Submit Member List'}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Submissions</h2>
            
            <div className="space-y-3">
              {submissions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm font-medium bg-slate-50 rounded-xl border border-slate-100">
                  No submissions yet.
                </div>
              ) : (
                submissions.map((sub) => (
                  <div key={sub._id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                        <FileText size={16} className="text-[#7A1B22]" />
                        <span className="truncate w-32">{sub.fileName}</span>
                      </div>
                      
                      {/* Dynamic Badge Status */}
                      <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase flex items-center gap-1 ${
                        sub.status === 'Approved' 
                        ? 'text-emerald-700 bg-emerald-100' 
                        : 'text-amber-700 bg-amber-100'
                      }`}>
                        {sub.status === 'Approved' ? <CheckCircle size={10} /> : <Clock size={10} />}
                        {sub.status}
                      </span>

                    </div>
                    <p className="text-xs font-semibold text-slate-500">
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