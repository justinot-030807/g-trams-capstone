import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { 
  RefreshCw, AlertCircle, CheckCircle, Clock, Loader2, 
  CalendarDays, PlusCircle, Activity, MapPin, Hash, Printer, X, ShieldCheck, Sparkles, FileText 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OperatorDashboard = () => {
  const [franchises, setFranchises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  const loggedInUserName = localStorage.getItem('name') || 'Operator';
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  useEffect(() => {
    fetchMyFranchises();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchMyFranchises = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/franchises/my-franchises', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFranchises(data);
      }
    } catch (error) {
      console.error('Error loading dashboard units:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getExpirationDate = (dateApplied) => {
    if (!dateApplied) return 'N/A';
    const date = new Date(dateApplied);
    date.setFullYear(date.getFullYear() + 1); 
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <MainLayout>
      {/* 1. HERO BANNER */}
      <div className="bg-gradient-to-r from-[#7A1B22] via-[#8C2028] to-[#551016] rounded-3xl p-6 sm:p-8 mb-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border-l-8 border-[#D4AF37]">
        <div className="relative z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase mb-2 border border-white/10">
            <Sparkles size={12} /> Operator Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">
            Welcome, {loggedInUserName}!
          </h1>
          <p className="text-white/80 font-medium text-xs sm:text-sm">Manage your active, pending, and digital E-Permits securely.</p>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3.5 rounded-2xl text-center md:text-right shadow-sm shrink-0">
          <p className="font-black text-sm sm:text-base tracking-wide text-white">
            {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <p className="text-xs font-semibold text-white/80 flex items-center justify-center md:justify-end gap-1.5 mt-0.5">
            <Clock size={14} className="text-[#D4AF37]" />
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* 2. FLEET OVERVIEW HEADER */}
      <header className="mb-6 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="text-[#7A1B22]" size={22} /> My Franchise Garage
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Assigned tricycle units under your account</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Unit Capacity</span>
          <div className="flex gap-1.5">
            <div className={`w-6 h-2 rounded-full transition-all ${franchises.length >= 1 ? 'bg-[#7A1B22]' : 'bg-slate-200'}`} />
            <div className={`w-6 h-2 rounded-full transition-all ${franchises.length >= 2 ? 'bg-[#7A1B22]' : 'bg-slate-200'}`} />
          </div>
          <span className="text-xs font-black text-[#7A1B22]">{franchises.length}/2</span>
        </div>
      </header>

      {/* 3. UNITS GRID */}
      {isLoading ? (
        <div className="flex justify-center items-center h-48 animate-pulse">
          <Loader2 className="animate-spin text-[#7A1B22]" size={36} />
        </div>
      ) : franchises.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-500 flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-[#7A1B22]">
            <PlusCircle size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No Franchise Units Found</h3>
          <p className="text-xs text-slate-500 mb-6 max-w-sm">Your garage is currently empty. Register your tricycle unit for a franchise.</p>
          <button onClick={() => navigate('/apply-franchise')} className="bg-[#7A1B22] hover:bg-[#5A1419] text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95">
            Apply New Franchise
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {franchises.map((unit) => (
            <div key={unit._id} className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
              <div className={`absolute top-0 left-0 w-full h-1.5 ${
                unit.status === 'Active' ? 'bg-emerald-500' :
                unit.status === 'Ready for Pickup' ? 'bg-blue-500' :
                unit.status === 'Expired' ? 'bg-orange-500' :
                unit.status === 'Cancelled' ? 'bg-red-500' : 'bg-amber-400'
              }`} />

              <div>
                <div className="flex justify-between items-start mb-6 mt-1">
                  <div>
                    <h3 className="font-black text-2xl text-slate-900 tracking-wider mb-0.5">
                      {unit.plateNo || 'PENDING PLATE'}
                    </h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{unit.todaName} &bull; {unit.make} ({unit.made})</p>
                  </div>
                  
                  <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1.5 border shadow-sm ${
                    unit.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    unit.status === 'Ready for Pickup' ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' :
                    unit.status === 'Expired' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    unit.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {unit.status === 'Active' && <CheckCircle size={13}/>}
                    {unit.status === 'Ready for Pickup' && <Printer size={13}/>}
                    {unit.status === 'Pending' && <Clock size={13} className="animate-pulse"/>}
                    {(unit.status === 'Cancelled' || unit.status === 'Expired') && <AlertCircle size={13}/>}
                    {unit.status === 'Ready for Pickup' ? 'Ready for Pickup' : unit.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <MapPin className="text-[#7A1B22] shrink-0" size={16} />
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Route Zone</p>
                      <p className="text-xs font-bold text-slate-800">{unit.zone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <Hash className="text-[#7A1B22] shrink-0" size={16} />
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Motor Number</p>
                      <p className="text-xs font-bold text-slate-800">{unit.motorNo}</p>
                    </div>
                  </div>
                </div>

                {unit.status === 'Ready for Pickup' && (
                  <div className="mb-6 bg-blue-50 border border-blue-200 p-4 rounded-2xl">
                    <p className="text-xs font-bold text-blue-900 mb-1">Official Permit Signed & Ready!</p>
                    <p className="text-[11px] text-blue-700 leading-snug">Please visit the Gasan Municipal Hall (OVM) with your franchise fee payment to claim your official signed hardcopy.</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 mt-auto pt-4 border-t border-slate-100">
                <button onClick={() => { setSelectedUnit(unit); setIsDetailsOpen(true); }} className="flex-1 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors">
                  View Details
                </button>

                {/* E-PERMIT DIGITAL DOWNLOAD / PRINT BUTTON */}
                {(unit.status === 'Active' || unit.status === 'Ready for Pickup') && (
                  <button onClick={() => { setSelectedUnit(unit); setIsPrintOpen(true); }} className="flex-1 bg-slate-900 text-white hover:bg-slate-800 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm">
                    <FileText size={14} /> View E-Permit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PRINTABLE DIGITAL E-PERMIT MODAL */}
      {isPrintOpen && selectedUnit && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex flex-col">
          <div className="bg-slate-900 p-4 flex justify-between items-center text-white print:hidden">
            <h2 className="font-bold text-sm">G-TRAMS Digital E-Permit (Temporary & Tracking Copy)</h2>
            <div className="flex gap-2">
              <button onClick={() => setIsPrintOpen(false)} className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <X size={14} /> Close
              </button>
              <button onClick={() => window.print()} className="px-4 py-1.5 bg-[#7A1B22] hover:bg-[#5A1419] text-white rounded-xl text-xs font-bold flex items-center gap-1.5">
                <Printer size={14} /> Print E-Permit
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 print:p-0 print:bg-white flex justify-center">
            <div className="bg-white w-full max-w-[800px] border border-slate-200 shadow-xl p-12 print:border-none print:shadow-none relative">
              
              {/* E-PERMIT WATERMARK */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
                <span className="text-8xl font-black rotate-45 uppercase text-black">DIGITAL E-PERMIT</span>
              </div>

              <div className="text-center mb-8 border-b-2 border-black pb-6">
                <p className="text-xs font-bold uppercase tracking-wider">Republic of the Philippines</p>
                <p className="text-xs font-bold uppercase tracking-wider">Province of Marinduque</p>
                <p className="text-lg font-black uppercase mt-1">Municipality of Gasan</p>
                <div className="mt-4 inline-block bg-[#7A1B22] text-white px-8 py-2 border-2 border-black">
                  <h1 className="text-xl font-black uppercase tracking-widest">Digital MTOP E-Permit</h1>
                </div>
                <p className="text-[11px] font-bold tracking-widest mt-1 text-slate-500">(TEMPORARY OPERATIONAL / TRACKING PROOF)</p>
              </div>

              <div className="space-y-6 relative z-10 text-sm">
                <p className="text-justify leading-relaxed">
                  This system-generated Electronic Permit certifies that the motorized tricycle listed below is registered and approved in the G-TRAMS Portal. This serves as temporary digital proof while the physical signed copy with the municipal dry seal is being processed.
                </p>

                <div className="border border-black p-5 bg-slate-50 print:bg-white">
                  <table className="w-full text-xs">
                    <tbody>
                      <tr><td className="py-1.5 font-bold w-1/3">Operator Name:</td><td className="py-1.5 border-b border-black/20">{selectedUnit.fullName}</td></tr>
                      <tr><td className="py-1.5 font-bold">Registered Address:</td><td className="py-1.5 border-b border-black/20">{selectedUnit.address}</td></tr>
                      <tr><td className="py-1.5 font-bold">TODA Association:</td><td className="py-1.5 border-b border-black/20">{selectedUnit.todaName}</td></tr>
                      <tr><td className="py-1.5 font-bold">Authorized Zone:</td><td className="py-1.5 border-b border-black/20">{selectedUnit.zone}</td></tr>
                      <tr><td className="py-1.5 font-bold">Plate Number:</td><td className="py-1.5 font-black text-black">{selectedUnit.plateNo || 'PENDING'}</td></tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 pt-4 border-t border-black text-center text-xs text-slate-500 print:text-black">
                  <p>System Tracking ID: {selectedUnit._id}</p>
                  <p className="font-bold mt-1">Visit the Municipal Office to claim your official signed hardcopy with Municipal Dry Seal.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default OperatorDashboard;