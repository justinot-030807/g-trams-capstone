import React, { useRef, useEffect, useState } from 'react';
import { 
  Printer, X, FileText, CheckCircle2, AlertTriangle, ShieldCheck, 
  User, ExternalLink
} from 'lucide-react';
import { formatZoneLabel } from '../../utils/constants';
import { getServerNow } from '../../utils/serverTime';
import TricycleIcon from '../common/TricycleIcon';
import { cleanText, formatVehicleMake, formatVehicleModelYear } from '../../utils/vehicleFormatters';

const ApplicationDossierModal = ({
  isOpen,
  onClose,
  franchise,
  franchiseFee: franchiseFeeProp,
  onApprove,
  onReject,
  isProcessing = false
}) => {
  const dossierRef = useRef(null);
  const [fetchedFee, setFetchedFee] = useState(() => {
    const cached = Number(localStorage.getItem('franchise_fee'));
    return Number.isFinite(cached) && cached > 0 ? cached : 500;
  });

  useEffect(() => {
    if (!isOpen || (franchiseFeeProp != null && Number(franchiseFeeProp) > 0)) return;
    let active = true;
    const token = localStorage.getItem('token');
    fetch(`${import.meta.env.VITE_API_URL}/api/v1/settings`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const fee = json?.data?.franchiseFee ?? json?.franchiseFee;
        if (active && fee != null && Number.isFinite(Number(fee)) && Number(fee) > 0) {
          setFetchedFee(Number(fee));
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [isOpen, franchiseFeeProp]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('printing-dossier');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('printing-dossier');
      document.body.style.overflow = '';
    }
    return () => {
      document.body.classList.remove('printing-dossier');
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !franchise) return null;

  const effectiveFee =
    franchiseFeeProp != null && Number.isFinite(Number(franchiseFeeProp)) && Number(franchiseFeeProp) > 0
      ? Number(franchiseFeeProp)
      : fetchedFee;
  const assessedAmount =
    franchise?.paymentStatus === 'Paid' && Number(franchise?.amountPaid) > 0
      ? Number(franchise.amountPaid)
      : effectiveFee;
  const isPendingStatus = franchise.status === 'Pending' || franchise.status === 'Pending for Approval';
  const canonicalMtopNo = String(franchise.mtopNo || '').trim();

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) 
      ? 'N/A' 
      : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const isDateExpired = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const today = getServerNow();
    today.setHours(0, 0, 0, 0);
    return d < today;
  };

  const isOperatorDriver = franchise.isOperatorDriver !== false;

  return (
    <div 
      id="printable-dossier-modal-root"
      role="dialog"
      aria-modal="true"
      aria-label="Application Dossier and Evaluation Sheet"
      className="fixed inset-0 z-[120] bg-black/75 overflow-y-auto overscroll-contain print:p-0 print:bg-white print:static print:inset-auto print:overflow-hidden flex flex-col items-center justify-start p-2 sm:p-6 pb-28 pt-2 print:m-0"
    >
      <div className="w-full max-w-[840px] flex flex-col items-center shrink-0 print:max-w-full print:m-0">
        
        {/* Floating Action Bar (Hidden during print) */}
        <div className="w-full bg-[#1F1D1B] dark:bg-[#1C1917] border border-[#E4E1DC]/20 dark:border-[#2E2A27] rounded-lg p-3 sm:p-4 mb-3 flex items-center justify-between text-white shadow-sm print:hidden sticky top-2 z-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#9E2A2B]/30 border border-[#9E2A2B]/60 flex items-center justify-center text-[#D4AF37] shrink-0">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                <span>Application Dossier &amp; Evaluation Sheet</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  isPendingStatus 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : franchise.status === 'Active'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                }`}>
                  {franchise.status}
                </span>
              </h2>
              <p className="text-[11px] text-[#A8A29E]">
                Pre-Approval Official Municipal Dossier{canonicalMtopNo ? ` • MTOP ${canonicalMtopNo}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#14110F] hover:bg-[#2E2A27] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-[#2E2A27] transition-colors cursor-pointer"
            >
              <Printer size={14} className="text-[#D4AF37]" />
              <span className="hidden sm:inline">Print Dossier</span>
            </button>

            {isPendingStatus && onApprove && (
              <button
                type="button"
                onClick={onApprove}
                disabled={isProcessing}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                <span>Send to Cashier</span>
              </button>
            )}

            {isPendingStatus && onReject && (
              <button
                type="button"
                onClick={onReject}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <span>Reject</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close dossier preview"
              className="p-1.5 rounded-lg hover:bg-white/10 text-[#A8A29E] hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Official Municipal Dossier Sheet */}
        <div 
          ref={dossierRef}
          id="printable-dossier-content"
          className="w-full bg-[#FFFDF9] text-[#1F1D1B] border border-[#E4E1DC] rounded-lg p-6 sm:p-10 shadow-sm print:border-none print:shadow-none print:p-6 print:m-0 print:w-full print:rounded-none relative overflow-hidden"
          style={{ fontFamily: "'Manrope', system-ui, -apple-system, sans-serif" }}
        >
          {/* Print Styles */}
          <style>{`
            @media print {
              @page {
                size: 8.5in 11in;
                margin: 8mm;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                background: white !important;
                overflow: visible !important;
              }
              body.printing-dossier {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                overflow: visible !important;
              }
              body.printing-dossier * {
                visibility: hidden !important;
              }
              body.printing-dossier #printable-dossier-modal-root {
                position: static !important;
                display: block !important;
                background: transparent !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
                overflow: visible !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
              }
              body.printing-dossier #printable-dossier-content,
              body.printing-dossier #printable-dossier-content * {
                visibility: visible !important;
              }
              body.printing-dossier #printable-dossier-content {
                position: relative !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 10px !important;
                box-shadow: none !important;
                border: none !important;
                background: #FFFDF9 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body.printing-dossier .print-hide {
                display: none !important;
                visibility: hidden !important;
              }
            }
          `}</style>

          {/* Municipal Header */}
          <div className="flex items-center justify-between border-b-2 border-[#7A1B22] pb-4 mb-5">
            <div className="flex items-center gap-3">
              <img 
                src="/gasan-logo.png" 
                alt="Gasan Seal" 
                className="w-16 h-16 object-contain shrink-0"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div>
                <p className="text-[11px] uppercase tracking-widest font-semibold text-[#6B6761]">
                  Republic of the Philippines &bull; Province of Marinduque
                </p>
                <h1 className="text-base sm:text-lg font-extrabold text-[#7A1B22] tracking-tight leading-tight">
                  MUNICIPALITY OF GASAN
                </h1>
                <p className="text-xs font-bold text-[#1F1D1B]">
                  OFFICE OF THE SANGGUNIANG BAYAN / VICE MAYOR EXTENSION
                </p>
                <p className="text-[10px] text-[#6B6761] font-medium">
                  Motorized Tricycle Regulatory Board (MTRB)
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-[#7A1B22]/10 border border-[#7A1B22]/30 text-[#7A1B22] font-extrabold text-xs uppercase tracking-wider rounded-lg mb-1">
                Evaluation Dossier
              </span>
              {canonicalMtopNo && (
                <p className="text-[11px] font-mono tabular-nums font-bold text-[#9E2A2B]">
                  MTOP NO: {canonicalMtopNo}
                </p>
              )}
              <p className="text-[10px] font-mono tabular-nums text-[#6B6761]">
                APP ID: {String(franchise._id).slice(-8).toUpperCase()}
              </p>
              <p className="text-[10px] text-[#6B6761] font-semibold">
                Date: {formatDate(franchise.dateApplied || franchise.createdAt)}
              </p>
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-[#1F1D1B] border-b border-[#E4E1DC] pb-1 inline-block">
              MTOP APPLICATION DOSSIER &amp; DOCUMENT VERACITY REPORT
            </h2>
            <p className="text-xs text-[#6B6761] font-medium mt-1">
              Official evaluation of applicant credentials, designated driver status, and vehicle registration veracity.
            </p>
          </div>

          {/* Dossier Grid */}
          <div className="space-y-5 text-xs">

            {/* AI Document Discrepancy & Modification Notice */}
            {Array.isArray(franchise?.aiDiscrepancies) && franchise.aiDiscrepancies.length > 0 && (
              <div className="border border-amber-300 bg-amber-50/80 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-amber-800">
                    <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                    <span>AI Flagged Document Modifications ({franchise.aiDiscrepancies.length})</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200/80 text-amber-900">
                    Audit Alert
                  </span>
                </div>
                <p className="text-[11px] text-amber-800/90">
                  The applicant modified the following field(s) differing from the values detected on uploaded document images:
                </p>
                <div className="space-y-1.5">
                  {(franchise.aiDiscrepancies || []).map((d, i) => (
                    <div key={i} className="bg-white p-2.5 rounded-lg border border-amber-200 space-y-1 text-xs">
                      <div className="font-bold text-[#1F1D1B] text-[11px]">{d.label || d.field}</div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-1.5 rounded bg-red-50 border border-red-200/80">
                          <span className="text-[10px] text-red-600 font-bold block uppercase">Detected from Image</span>
                          <span className="font-mono font-bold text-red-700 truncate block">
                            {d.scannedValue || '—'} {d.severity === 'critical' ? '(Expired)' : ''}
                          </span>
                        </div>
                        <div className="p-1.5 rounded bg-[#F6F5F3] border border-[#E4E1DC]">
                          <span className="text-[10px] text-[#6B6761] font-bold block uppercase">Entered by Applicant</span>
                          <span className="font-mono font-bold text-[#1F1D1B] truncate block">
                            {d.enteredValue || '—'}
                          </span>
                        </div>
                      </div>
                      {d.reason && (
                        <p className="text-[10px] text-[#6B6761] leading-snug pt-0.5">
                          {d.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 1: APPLICANT OPERATOR PROFILE */}
            <div className="border border-[#E4E1DC] rounded-xl overflow-hidden">
              <div className="bg-[#7A1B22] text-white px-3.5 py-1.5 flex items-center justify-between font-bold text-xs uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <User size={14} className="text-[#D4AF37]" />
                  Section 1: Franchise Operator Profile
                </span>
                <span className="text-[10px] font-normal text-[#F5E6B3]">Owner &bull; Registered Grantee</span>
              </div>
              <div className="p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white">
                <div>
                  <span className="text-[10px] font-bold text-[#6B6761] uppercase tracking-wider block">Full Name of Operator</span>
                  <span className="text-xs font-bold text-[#1F1D1B]">{franchise.fullName || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#6B6761] uppercase tracking-wider block">Barangay Address</span>
                  <span className="text-xs font-semibold text-[#1F1D1B]">{franchise.address || '—'}, Gasan, Marinduque</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#6B6761] uppercase tracking-wider block">Contact Mobile No.</span>
                  <span className="text-xs font-semibold text-[#1F1D1B]">{franchise.contact || franchise.operator?.contact || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#6B6761] uppercase tracking-wider block">Assigned Route &amp; Zone</span>
                  <span className="text-xs font-bold text-[#7A1B22]">
                    {formatZoneLabel(franchise.zone)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#6B6761] uppercase tracking-wider block">TODA Association</span>
                  <span className="text-xs font-bold text-[#1F1D1B]">{franchise.todaName || 'Non-TODA'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#6B6761] uppercase tracking-wider block">Application Type</span>
                  <span className="text-xs font-bold text-[#1F1D1B]">{franchise.applicationType || 'New'}</span>
                </div>
              </div>
            </div>

            {/* SECTION 2: AUTHORIZED DRIVER (OPERATOR VS DESIGNATED DRIVER) */}
            <div className="border border-[#E4E1DC] rounded-xl overflow-hidden">
              <div className="bg-[#1F1D1B] text-white px-3.5 py-1.5 flex items-center justify-between font-bold text-xs uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <User size={14} className="text-[#D4AF37]" />
                  Section 2: Authorized Driver Designation
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  isOperatorDriver ? 'bg-emerald-900/80 text-emerald-200' : 'bg-amber-900/80 text-amber-200'
                }`}>
                  {isOperatorDriver ? 'Operator is Driver (Self-Operated)' : 'Designated Driver (Boundary System)'}
                </span>
              </div>
              <div className="p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white">
                <div>
                  <span className="text-[10px] font-bold text-[#6B6761] uppercase tracking-wider block">Driver Status</span>
                  <span className="text-xs font-bold text-[#1F1D1B]">
                    {isOperatorDriver ? 'Applicant / Operator (Self)' : 'Designated Hired Driver'}
                  </span>
                </div>
                {!isOperatorDriver && (
                  <>
                    <div>
                      <span className="text-[10px] font-bold text-[#6B6761] uppercase tracking-wider block">Designated Driver Name</span>
                      <span className="text-xs font-bold text-[#1F1D1B]">{franchise.driverName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#6B6761] uppercase tracking-wider block">Driver Contact Number</span>
                      <span className="text-xs font-semibold text-[#1F1D1B]">{franchise.driverContact || '—'}</span>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-[10px] font-bold text-[#6B6761] uppercase tracking-wider block">Driver's License No.</span>
                  <span className="text-xs font-mono font-bold text-[#1F1D1B]">{franchise.driverLicenseNo || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#6B6761] uppercase tracking-wider block">License Validity / Expiry</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-semibold text-[#1F1D1B]">{formatDate(franchise.driverLicenseExpiryDate)}</span>
                    {franchise.driverLicenseExpiryDate && (
                      isDateExpired(franchise.driverLicenseExpiryDate) ? (
                        <span className="text-[10px] font-bold text-red-600 bg-red-100 border border-red-300 px-1.5 py-0.5 rounded">
                          EXPIRED
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded">
                          VALID
                        </span>
                      )
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#6B6761] uppercase tracking-wider block">License Document Scan</span>
                  {franchise.licenseUrl ? (
                    <a 
                      href={franchise.licenseUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs font-bold text-[#7A1B22] underline inline-flex items-center gap-1"
                    >
                      <span>View License Image</span>
                      <ExternalLink size={11} />
                    </a>
                  ) : (
                    <span className="text-xs text-amber-700 font-semibold">Not attached</span>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3: TRICYCLE UNIT & OR/CR SPECIFICATIONS */}
            <div className="border border-[#E4E1DC] rounded-xl overflow-hidden">
              <div className="bg-[#1F1D1B] text-white px-3.5 py-1.5 flex items-center justify-between font-bold text-xs uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <TricycleIcon size={14} className="text-[#D4AF37]" />
                  Section 3: Tricycle Unit &amp; LTO OR/CR Specifications
                </span>
                <span className="text-[10px] font-normal text-[#A8A29E]">Mechanical Verification</span>
              </div>
              <div className="p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white">
                <div>
                  <span className="text-[10px] font-bold text-[#6B6761] uppercase tracking-wider block">Make / Brand</span>
                  <span className="text-xs font-bold text-[#1F1D1B]">{formatVehicleMake(franchise, '—')}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#6B6761] uppercase tracking-wider block">Model Year</span>
                  <span className="text-xs font-bold text-[#1F1D1B]">{formatVehicleModelYear(franchise, '—')}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#6B6761] uppercase tracking-wider block">Plate Number</span>
                  <span className="text-xs font-mono font-bold text-[#1F1D1B]">{cleanText(franchise.plateNo, '—')}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#6B6761] uppercase tracking-wider block">Engine / Motor No.</span>
                  <span className="text-xs font-mono font-bold text-[#1F1D1B] truncate block">{cleanText(franchise.motorNo, '—')}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] font-bold text-[#6B6761] uppercase tracking-wider block">Chassis Frame Serial No.</span>
                  <span className="text-xs font-mono font-bold text-[#7A1B22] truncate block">{franchise.chassisNo || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#6B6761] uppercase tracking-wider block">LTO OR/CR No.</span>
                  <span className="text-xs font-mono font-bold text-[#1F1D1B]">{franchise.orCrNo || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#6B6761] uppercase tracking-wider block">LTO Registration Validity</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-semibold text-[#1F1D1B]">{formatDate(franchise.orCrExpiryDate)}</span>
                    {franchise.orCrExpiryDate && (
                      isDateExpired(franchise.orCrExpiryDate) ? (
                        <span className="text-[10px] font-bold text-red-600 bg-red-100 border border-red-300 px-1.5 py-0.5 rounded">
                          EXPIRED
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded">
                          VALID
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4: CLEARANCES & STATUTORY REQUIREMENTS */}
            <div className="border border-[#E4E1DC] rounded-xl overflow-hidden">
              <div className="bg-[#1F1D1B] text-white px-3.5 py-1.5 flex items-center justify-between font-bold text-xs uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#D4AF37]" />
                  Section 4: Clearances, TODA &amp; Cedula Statutory Details
                </span>
                <span className="text-[10px] font-normal text-[#A8A29E]">Municipal Verification</span>
              </div>
              <div className="p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white">
                {/* Cedula */}
                <div className="p-2.5 rounded-lg border border-[#E4E1DC] bg-[#FAF9F7]">
                  <span className="text-[10px] font-extrabold uppercase text-[#7A1B22] block mb-1">
                    1. CTC / Cedula
                  </span>
                  <p className="text-[11px] text-[#6B6761]">
                    <strong className="text-[#1F1D1B]">Serial No:</strong> {franchise.cedulaSerialNo || '—'}
                  </p>
                  <p className="text-[11px] text-[#6B6761]">
                    <strong className="text-[#1F1D1B]">Date Issued:</strong> {formatDate(franchise.cedulaDate)}
                  </p>
                  <p className="text-[11px] text-[#6B6761] truncate">
                    <strong className="text-[#1F1D1B]">Place:</strong> {franchise.cedulaAddress || 'Gasan, Marinduque'}
                  </p>
                  {franchise.cedulaUrl && (
                    <a href={franchise.cedulaUrl} target="_blank" rel="noopener noreferrer" className="text-[10.5px] font-bold text-[#7A1B22] underline mt-1 inline-block">
                      View Attached Photo
                    </a>
                  )}
                </div>

                {/* TODA Certificate */}
                <div className="p-2.5 rounded-lg border border-[#E4E1DC] bg-[#FAF9F7]">
                  <span className="text-[10px] font-extrabold uppercase text-[#7A1B22] block mb-1">
                    2. TODA Endorsement
                  </span>
                  <p className="text-[11px] text-[#6B6761]">
                    <strong className="text-[#1F1D1B]">Certificate No:</strong> {franchise.todaCertNo || '—'}
                  </p>
                  <p className="text-[11px] text-[#6B6761]">
                    <strong className="text-[#1F1D1B]">Date Issued:</strong> {formatDate(franchise.todaCertDate)}
                  </p>
                  <p className="text-[11px] text-[#6B6761] truncate">
                    <strong className="text-[#1F1D1B]">Signatory:</strong> {franchise.todaSignatory || 'TODA President'}
                  </p>
                  {franchise.todaEndorsementUrl && (
                    <a href={franchise.todaEndorsementUrl} target="_blank" rel="noopener noreferrer" className="text-[10.5px] font-bold text-[#7A1B22] underline mt-1 inline-block">
                      View Endorsement
                    </a>
                  )}
                </div>

                {/* Barangay Clearance */}
                <div className="p-2.5 rounded-lg border border-[#E4E1DC] bg-[#FAF9F7]">
                  <span className="text-[10px] font-extrabold uppercase text-[#7A1B22] block mb-1">
                    3. Barangay Clearance
                  </span>
                  <p className="text-[11px] text-[#6B6761]">
                    <strong className="text-[#1F1D1B]">Clearance No:</strong> {franchise.brgyClearanceNo || '—'}
                  </p>
                  <p className="text-[11px] text-[#6B6761]">
                    <strong className="text-[#1F1D1B]">Date Issued:</strong> {formatDate(franchise.brgyClearanceDate)}
                  </p>
                  <p className="text-[11px] text-[#6B6761] truncate">
                    <strong className="text-[#1F1D1B]">Issuer:</strong> {franchise.brgyIssuer || 'Punong Barangay'}
                  </p>
                  {franchise.brgyClearanceUrl && (
                    <a href={franchise.brgyClearanceUrl} target="_blank" rel="noopener noreferrer" className="text-[10.5px] font-bold text-[#7A1B22] underline mt-1 inline-block">
                      View Clearance
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 5: MUNICIPAL TREASURY & PAYMENT ASSESSMENT */}
            <div className="border border-[#E4E1DC] rounded-xl overflow-hidden">
              <div className="bg-[#1F1D1B] text-white px-3.5 py-1.5 flex items-center justify-between font-bold text-xs uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <FileText size={14} className="text-[#D4AF37]" />
                  Section 5: Municipal Treasury &amp; Cashier Payment Status
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  franchise.paymentStatus === 'Paid' ? 'bg-emerald-900/80 text-emerald-200' : 'bg-amber-900/80 text-amber-200'
                }`}>
                  {franchise.paymentStatus === 'Paid' ? 'PAID / CLEARED' : 'PENDING PAYMENT'}
                </span>
              </div>
              <div className="p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white">
                <div>
                  <span className="text-[10px] font-bold text-[#6B6761] uppercase tracking-wider block">Official Receipt (O.R.) No.</span>
                  <span className="text-xs font-mono font-bold text-[#1F1D1B]">{franchise.officialReceiptNo || 'Awaiting Payment'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#6B6761] uppercase tracking-wider block">Amount Assessed / Paid</span>
                  <span className="text-xs font-mono tabular-nums font-bold text-[#1F1D1B]">
                    ₱{assessedAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#6B6761] uppercase tracking-wider block">Cashier In-Charge</span>
                  <span className="text-xs font-semibold text-[#1F1D1B]">{franchise?.processedByName || franchise?.cashierName || 'Treasury Staff'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#6B6761] uppercase tracking-wider block">Payment Date</span>
                  <span className="text-xs font-semibold text-[#1F1D1B]">{formatDate(franchise?.paymentDate)}</span>
                </div>
              </div>
            </div>

            {/* SIGNATURE BLOCK */}
            <div className="pt-6 mt-4 border-t border-[#E4E1DC] grid grid-cols-2 sm:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-[10px] font-bold uppercase text-[#6B6761] mb-8">Evaluated &amp; Verified By:</p>
                <div className="border-t border-[#1F1D1B] pt-1">
                  <p className="text-xs font-bold text-[#1F1D1B] uppercase">MTRB Evaluation Staff</p>
                  <p className="text-[10px] text-[#6B6761]">Office of the Vice Mayor Extension</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase text-[#6B6761] mb-8">Noted &amp; Reviewed By:</p>
                <div className="border-t border-[#1F1D1B] pt-1">
                  <p className="text-xs font-bold text-[#1F1D1B] uppercase">FRANCHISE ADMINISTRATOR</p>
                  <p className="text-[10px] text-[#6B6761]">Municipality of Gasan</p>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <p className="text-[10px] font-bold uppercase text-[#6B6761] mb-8">Official Recommendation:</p>
                <div className="border-t border-[#1F1D1B] pt-1 flex flex-col items-center">
                  <span className="text-xs font-extrabold uppercase text-[#7A1B22]">
                    {isPendingStatus ? 'RECOMMENDED FOR APPROVAL' : (franchise?.status || '').toUpperCase()}
                  </span>
                  <p className="text-[10px] text-[#6B6761]">Subject to Final Executive Signing</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default ApplicationDossierModal;
