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

  const isUnitExpiredByDate = (unit) => {
    if (!unit?.expiryDate) return false;
    const exp = new Date(unit.expiryDate);
    return !isNaN(exp.getTime()) && exp.getTime() < Date.now();
  };

  const formatExpiryDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUnitValidity = (unit) => {
    if (!unit) return { isValid: false, label: 'INACTIVE', rawStatus: '', isRenewalPending: false };
    const expiredByDate = isUnitExpiredByDate(unit);
    const hasValidExpiryDate = Boolean(unit?.expiryDate) && !isNaN(new Date(unit.expiryDate).getTime());
    const ownerInactive =
      operator.isActive === false ||
      operator.validityStatus === 'INACTIVE_OWNER' ||
      unit.validityStatus === 'INACTIVE_OWNER';
    const unverifiedExpiry =
      unit.validityStatus === 'UNVERIFIED_EXPIRY' ||
      operator.validityStatus === 'UNVERIFIED_EXPIRY' ||
      (['Active', 'Active - Under Warning'].includes(unit.status) && !hasValidExpiryDate && unit.isCurrentlyValid !== true);

    const rawStatus = expiredByDate ? 'Expired' : (unit.status || '');
    const statusAllowsValid = !unit.validityStatus || unit.validityStatus === 'VALID';
    const isValid =
      !ownerInactive &&
      !unverifiedExpiry &&
      !expiredByDate &&
      statusAllowsValid &&
      operator.isCurrentlyValid !== false &&
      (typeof unit.isCurrentlyValid === 'boolean'
        ? unit.isCurrentlyValid
        : ['Active', 'Active - Under Warning'].includes(unit.status) && hasValidExpiryDate);

    let label = unit.validityStatus;
    if (ownerInactive) {
      label = 'INACTIVE_OWNER';
    } else if (unverifiedExpiry) {
      label = 'UNVERIFIED_EXPIRY';
    } else if (!label) {
      if (isValid) label = 'VALID';
      else if (rawStatus === 'Expired') label = 'EXPIRED';
      else if (['Pending', 'Pending for Approval', 'For Payment', 'For Signing', 'Ready for Pickup', 'Cancellation Requested'].includes(rawStatus)) label = 'PENDING';
      else label = 'INACTIVE';
    } else if (expiredByDate && label === 'VALID') {
      label = 'EXPIRED';
    }

    return { isValid, label, rawStatus, isRenewalPending: Boolean(unit.isRenewalPending) };
  };

  const isOwnerInactive = operator.isActive === false || operator.validityStatus === 'INACTIVE_OWNER';
  const isOverallUnverifiedExpiry = operator.validityStatus === 'UNVERIFIED_EXPIRY';
  const scannedValidity = operator.scannedFranchise ? getUnitValidity(operator.scannedFranchise) : null;
  const hasValidUnit =
    !isOwnerInactive &&
    !isOverallUnverifiedExpiry &&
    operator.isCurrentlyValid !== false &&
    (!operator.validityStatus || operator.validityStatus === 'VALID') &&
    Array.isArray(operator.franchises) &&
    operator.franchises.some(f => getUnitValidity(f).isValid);
  const hasPendingUnit =
    !isOwnerInactive &&
    Array.isArray(operator.franchises) &&
    operator.franchises.some(f => getUnitValidity(f).label === 'PENDING');

  let bannerClasses = 'bg-[#9E2A2B] border-[#7A1B22]';
  let bannerTitle = 'VERIFIED ACTIVE PERMIT';
  if (scannedValidity) {
    if (isOwnerInactive || scannedValidity.label === 'INACTIVE_OWNER') {
      bannerClasses = 'bg-red-800 border-red-950';
      bannerTitle = 'INACTIVE OWNER ACCOUNT — PERMIT NOT VALID';
    } else if (isOverallUnverifiedExpiry || scannedValidity.label === 'UNVERIFIED_EXPIRY') {
      bannerClasses = 'bg-red-800 border-red-950';
      bannerTitle = 'UNVERIFIED PERMIT EXPIRY — NOT VERIFIED';
    } else if (scannedValidity.isValid) {
      bannerClasses = 'bg-[#9E2A2B] border-[#7A1B22]';
      if (scannedValidity.isRenewalPending) {
        bannerTitle = scannedValidity.rawStatus === 'Active - Under Warning'
          ? 'VALID PERMIT (UNDER WARNING • RENEWAL IN PROGRESS)'
          : 'VALID PERMIT (RENEWAL IN PROGRESS)';
      } else {
        bannerTitle = scannedValidity.rawStatus === 'Active - Under Warning'
          ? 'ACTIVE PERMIT (UNDER WARNING)'
          : 'VERIFIED ACTIVE PERMIT';
      }
    } else if (scannedValidity.label === 'PENDING') {
      bannerClasses = 'bg-amber-700 border-amber-900';
      bannerTitle = `PERMIT NOT ACTIVE (${(scannedValidity.rawStatus || 'PENDING').toUpperCase()})`;
    } else {
      bannerClasses = 'bg-red-800 border-red-950';
      bannerTitle = `PERMIT ${(scannedValidity.rawStatus || scannedValidity.label || 'INACTIVE').toUpperCase()}`;
    }
  } else {
    if (isOwnerInactive) {
      bannerClasses = 'bg-red-800 border-red-950';
      bannerTitle = 'INACTIVE OWNER ACCOUNT';
    } else if (isOverallUnverifiedExpiry) {
      bannerClasses = 'bg-red-800 border-red-950';
      bannerTitle = 'UNVERIFIED PERMIT EXPIRY';
    } else if (hasValidUnit) {
      bannerClasses = 'bg-[#9E2A2B] border-[#7A1B22]';
      bannerTitle = 'VERIFIED OPERATOR';
    } else if (hasPendingUnit) {
      bannerClasses = 'bg-amber-700 border-amber-900';
      bannerTitle = 'PENDING APPLICATION (NO ACTIVE PERMIT)';
    } else {
      bannerClasses = 'bg-red-800 border-red-950';
      bannerTitle = 'NO ACTIVE PERMIT ON RECORD';
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#F6F5F3] dark:bg-[#14110F] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className={`${bannerClasses} border-b rounded-t-lg pt-6 pb-16 px-6 text-center relative overflow-hidden`}>
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md p-2">
            <img src="/gasan-logo.png" alt="LGU" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-white font-bold tracking-tight text-lg mb-0.5">
            {bannerTitle}
          </h1>
          <p className="text-[#F5E6B3] text-xs font-bold uppercase tracking-wider">Official LGU Record</p>
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
              {operator.scannedFranchise && scannedValidity && (
                <div className="mb-3 p-2.5 rounded-md bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 border border-[#9E2A2B]/30 dark:border-[#D4AF37]/40 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E2A2B] dark:text-[#D4AF37]">Scanned MTOP Certificate Unit</p>
                    <p className="font-mono font-bold text-xs sm:text-sm text-[#1F1D1B] dark:text-white">Plate: {operator.scannedFranchise.plateNo} &bull; {operator.scannedFranchise.make}</p>
                    {(operator.scannedFranchise.expiryDate || scannedValidity.label === 'UNVERIFIED_EXPIRY' || scannedValidity.label === 'INACTIVE_OWNER') && (
                      <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] font-medium mt-0.5">
                        {scannedValidity.label === 'INACTIVE_OWNER'
                          ? 'Owner account is inactive'
                          : scannedValidity.label === 'UNVERIFIED_EXPIRY'
                          ? 'Permit expiry date is unverified'
                          : scannedValidity.isValid
                          ? `Valid until ${formatExpiryDate(operator.scannedFranchise.expiryDate)}`
                          : scannedValidity.label === 'EXPIRED'
                          ? `Expired on ${formatExpiryDate(operator.scannedFranchise.expiryDate)}`
                          : `Status: ${scannedValidity.rawStatus || scannedValidity.label}`}
                      </p>
                    )}
                    {scannedValidity.isValid && scannedValidity.isRenewalPending && (
                      <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 mt-1">
                        Valid Permit (Renewal In Progress)
                      </p>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white uppercase tracking-wider shrink-0 ${
                    scannedValidity.isValid && scannedValidity.rawStatus !== 'Active - Under Warning' ? 'bg-emerald-600' :
                    scannedValidity.isValid || scannedValidity.label === 'PENDING' ? 'bg-amber-600' :
                    'bg-red-600'
                  }`}>
                    {scannedValidity.label === 'INACTIVE_OWNER'
                      ? 'INACTIVE OWNER'
                      : scannedValidity.label === 'UNVERIFIED_EXPIRY'
                      ? 'UNVERIFIED EXPIRY'
                      : (scannedValidity.rawStatus || scannedValidity.label)}
                  </span>
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
                  {operator.franchises.map((f, i) => {
                    const unitValidity = getUnitValidity(f);
                    const effectiveStatus = unitValidity.label === 'INACTIVE_OWNER'
                      ? 'INACTIVE OWNER'
                      : unitValidity.label === 'UNVERIFIED_EXPIRY'
                      ? 'UNVERIFIED EXPIRY'
                      : (unitValidity.rawStatus || unitValidity.label);
                    const expiryStr = formatExpiryDate(f.expiryDate);
                    const subLabel = unitValidity.label === 'INACTIVE_OWNER'
                      ? ' • Inactive Owner'
                      : unitValidity.label === 'UNVERIFIED_EXPIRY'
                      ? ' • Unverified Expiry'
                      : unitValidity.isValid && expiryStr
                      ? ` • Valid until ${expiryStr}`
                      : unitValidity.label === 'EXPIRED' && expiryStr
                      ? ` • Expired ${expiryStr}`
                      : ` • ${unitValidity.label}`;
                    return (
                      <div key={i} className="bg-white dark:bg-[#1C1917] p-2.5 rounded-md border border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold font-mono text-[#1F1D1B] dark:text-white uppercase tracking-wider">{f.plateNo || 'PENDING'}</p>
                          <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] font-medium truncate max-w-[200px]">
                            {f.make || 'Tricycle Unit'}{subLabel}
                          </p>
                          {unitValidity.isValid && unitValidity.isRenewalPending && (
                            <p className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 mt-0.5">
                              Valid Permit (Renewal In Progress)
                            </p>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${
                          unitValidity.isValid && effectiveStatus !== 'Active - Under Warning' ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-600/30' :
                          unitValidity.isValid || unitValidity.label === 'PENDING' ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-600/30' :
                          ['Revoked', 'Suspended', 'Expired', 'Cancelled', 'Rejected'].includes(effectiveStatus) || ['INACTIVE', 'EXPIRED', 'INACTIVE_OWNER', 'UNVERIFIED_EXPIRY'].includes(unitValidity.label) ? 'bg-red-500/10 text-red-800 dark:text-red-300 border-red-600/30' :
                          'bg-[#F6F5F3] text-[#6B6761] border-[#E4E1DC] dark:bg-[#2E2A27] dark:text-[#A8A29E] dark:border-[#3E3834]'
                        }`}>
                          {effectiveStatus}
                        </span>
                      </div>
                    );
                  })}
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
