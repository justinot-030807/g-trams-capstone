import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, MapPin, Award, AlertTriangle } from 'lucide-react';
import { VerifyOperatorSkeleton } from '../../components/skeleton';

const VerifyOperator = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [operator, setOperator] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
        const res = await fetch(`${baseUrl}/api/v1/auth/verify/${encodeURIComponent(id || '')}`);
        if (res.ok) {
          const data = await res.json();
          setOperator({
            ...data,
            name: data.name || data.fullName || 'Registered Operator'
          });
        } else {
          const errData = await res.json().catch(() => ({}));
          setError(errData.message || 'Operator or franchise record not found. This QR code may be invalid, expired, or counterfeit.');
        }
      } catch {
        setError('Unable to reach the official LGU verification server. Please check your internet connection and scan again.');
      } finally {
        setLoading(false);
      }
    };
    fetchVerification();
  }, [id]);

  if (loading) {
    return <VerifyOperatorSkeleton />;
  }

  if (error || !operator) {
    return (
      <div className="min-h-[100dvh] bg-[#F6F5F3] dark:bg-[#14110F] flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-[#1C1917] p-6 sm:p-8 rounded-lg shadow-md max-w-sm w-full text-center border border-red-300 dark:border-red-900/60">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[#B91C1C]">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-lg font-bold text-[#1F1D1B] dark:text-white mb-1.5">Verification Failed</h2>
          <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mb-6">{error || 'Invalid or unregistered QR code.'}</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-[#1C1917] hover:bg-[#2E2A27] dark:bg-[#2E2A27] dark:hover:bg-[#3E3834] text-white py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors min-h-[44px] cursor-pointer"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const scannedStatus = operator.scannedFranchise?.status || '';
  const isScannedUnitInvalid = ['Revoked', 'Suspended', 'Expired', 'Cancelled', 'Rejected'].includes(scannedStatus);

  return (
    <div className="min-h-[100dvh] bg-[#F6F5F3] dark:bg-[#14110F] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className={`${isScannedUnitInvalid ? 'bg-red-800 border-red-950' : 'bg-[#9E2A2B] border-[#7A1B22]'} border-b rounded-t-lg pt-6 pb-16 px-6 text-center relative overflow-hidden`}>
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md p-2">
            <img src="/gasan-logo.png" alt="LGU" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-white font-bold tracking-tight text-lg mb-0.5">
            {isScannedUnitInvalid ? `FRANCHISE ${scannedStatus.toUpperCase()}` : 'VERIFIED OPERATOR'}
          </h1>
          <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-wider">Official LGU Record</p>
        </div>
        
        <div className="bg-white dark:bg-[#1C1917] rounded-b-lg p-5 sm:p-6 shadow-md border-x border-b border-[#E4E1DC] dark:border-[#2E2A27]">
          <div className="flex justify-center -mt-14 mb-4 relative z-10">
            <div className="w-20 h-20 rounded-full border-4 border-white dark:border-[#1C1917] bg-[#F6F5F3] dark:bg-[#14110F] flex items-center justify-center shadow-md overflow-hidden">
              {operator.profilePic ? (
                <img src={operator.profilePic} alt={operator.name} className="w-full h-full object-cover" />
              ) : (
                <User size={36} className="text-[#6B6761] dark:text-[#A8A29E]" />
              )}
            </div>
          </div>

          <div className="text-center mb-5 border-b border-[#E4E1DC] dark:border-[#2E2A27] pb-4">
            <h2 className="text-xl font-bold text-[#1F1D1B] dark:text-white tracking-tight uppercase">
              {operator.name || operator.fullName || 'Registered Operator'}
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3.5 bg-[#F6F5F3] dark:bg-[#14110F] p-3.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
              <div className="w-9 h-9 rounded-md bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 flex items-center justify-center text-[#9E2A2B] dark:text-[#D4AF37] shrink-0">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[#6B6761] dark:text-[#A8A29E] tracking-wider">TODA Association</p>
                <p className="font-bold text-xs sm:text-sm text-[#1F1D1B] dark:text-white">{operator.todaAssociation || 'NON-TODA'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 bg-[#F6F5F3] dark:bg-[#14110F] p-3.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
              <div className="w-9 h-9 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
                <Award size={18} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[#6B6761] dark:text-[#A8A29E] tracking-wider">Account Role</p>
                <p className="font-bold text-xs sm:text-sm text-[#1F1D1B] dark:text-white capitalize">{operator.role}</p>
              </div>
            </div>

            {/* Franchise Info */}
            <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-3.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
              {operator.scannedFranchise && (
                <div className="mb-3 p-2.5 rounded-md bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 border border-[#9E2A2B]/30 dark:border-[#D4AF37]/40 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E2A2B] dark:text-[#D4AF37]">Scanned MTOP Certificate Unit</p>
                    <p className="font-mono font-bold text-xs sm:text-sm text-[#1F1D1B] dark:text-white">Plate: {operator.scannedFranchise.plateNo} &bull; {operator.scannedFranchise.make}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white uppercase tracking-wider ${
                    operator.scannedFranchise.status === 'Active' ? 'bg-emerald-600' :
                    operator.scannedFranchise.status === 'Active - Under Warning' || operator.scannedFranchise.status === 'Pending' ? 'bg-amber-600' :
                    'bg-red-600'
                  }`}>{operator.scannedFranchise.status}</span>
                </div>
              )}
              <div className="flex items-center justify-between mb-2.5 border-b border-[#E4E1DC] dark:border-[#2E2A27] pb-2">
                <p className="text-[10px] uppercase font-bold text-[#6B6761] dark:text-[#A8A29E] tracking-wider">Franchise Status</p>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#E4E1DC] dark:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#EAE7E1]">
                  {operator.franchises?.length || 0} Unit(s)
                </span>
              </div>
              
              {!operator.franchises || operator.franchises.length === 0 ? (
                <p className="text-xs font-medium text-[#6B6761] dark:text-[#A8A29E] text-center py-2">
                  No active franchise records found.
                </p>
              ) : (
                <div className="space-y-2">
                  {operator.franchises.map((f, i) => (
                    <div key={i} className="bg-white dark:bg-[#1C1917] p-2.5 rounded-md border border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold font-mono text-[#1F1D1B] dark:text-white uppercase tracking-wider">{f.plateNo || 'PENDING'}</p>
                        <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] font-medium truncate max-w-[150px]">
                          {f.make} &bull; {f.motorNo}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        f.status === 'Active' ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-600/30' :
                        f.status === 'Pending' || f.status === 'Active - Under Warning' ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-600/30' :
                        ['Revoked', 'Suspended', 'Expired', 'Cancelled', 'Rejected'].includes(f.status) ? 'bg-red-500/10 text-red-800 dark:text-red-300 border-red-600/30' :
                        'bg-[#F6F5F3] text-[#6B6761] border-[#E4E1DC] dark:bg-[#2E2A27] dark:text-[#A8A29E] dark:border-[#3E3834]'
                      }`}>
                        {f.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-[#F6F5F3] hover:bg-[#E4E1DC] dark:bg-[#2E2A27] dark:hover:bg-[#3E3834] text-[#1F1D1B] dark:text-[#EAE7E1] py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors border border-[#E4E1DC] dark:border-[#3E3834] min-h-[44px] cursor-pointer"
            >
              Close Verification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOperator;
