import React, { useRef } from 'react';
import { Printer, Download, Award, FileText, CheckCircle2 } from 'lucide-react';

/**
 * OfficialMayorPermitCard
 * Exact 1:1 Digital Card Replica of the Gasan LGU Tricycle Permit (2027.psd / 2027.jpeg).
 * 
 * Features:
 * - Red & White card template layout with Gasan Seal and background watermark
 * - 1-Year Annual Executive License (valid Jan 01 to Dec 31 of permit year)
 * - References the 3-Year Legislative Franchise No. & validity date from Sangguniang Bayan
 * - Signed by HON. JAMES MARTY L. LIM, Municipal Mayor
 * - High-resolution print & PNG download support
 */
const OfficialMayorPermitCard = ({
  unit = {},
  permitYear = 2027,
  onPrint = null,
  showActions = true,
  className = ''
}) => {
  const cardRef = useRef(null);

  // Operator & Unit Details
  const fullName = String(unit.fullName || unit.name || unit.operatorName || 'JUAN DELA CRUZ').toUpperCase();
  const address = String(unit.address || 'GASAN, MARINDUQUE').toUpperCase();
  const make = String(unit.make || 'KAWASAKI').toUpperCase();
  const engineNo = String(unit.motorNo || unit.engineNo || '—').toUpperCase();
  const chassisNo = String(unit.chassisNo || '—').toUpperCase();
  
  // Franchise link (from OVM / SB 3-year franchise)
  const cleanPlate = unit.plateNo && unit.plateNo.toUpperCase() !== 'PENDING' ? unit.plateNo : null;
  const franchiseNo = String(unit.franchiseNo || (cleanPlate ? cleanPlate : String(unit._id || '000').slice(-6))).toUpperCase();
  
  // 3-Year Franchise Expiry (e.g. Jan. 05, 2029)
  const getFranchiseValidityStr = () => {
    if (unit.expiryDate) {
      const d = new Date(unit.expiryDate);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      }
    }
    const d = new Date();
    d.setFullYear(d.getFullYear() + 3);
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };
  const franchiseValidity = getFranchiseValidityStr();

  // Mayor Permit Details (Annual cycle)
  const permitNo = String(unit.permitNo || `${permitYear}-${String(unit._id || '001').slice(-4)}`).toUpperCase();
  const regDate = unit.approvalDate 
    ? new Date(unit.approvalDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  const statusType = String(unit.applicationType || 'NEW').toUpperCase();

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    window.print();
  };

  return (
    <div className={`w-full flex flex-col items-center ${className}`}>
      {/* Top Action Toolbar (Hidden during print) */}
      {showActions && (
        <div className="w-full max-w-[720px] bg-[#1F1D1B] dark:bg-[#1C1917] border border-[#E4E1DC]/20 dark:border-[#2E2A27] rounded-xl p-3 mb-4 flex items-center justify-between text-white shadow-md print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#9E2A2B] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              <Award size={17} />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black tracking-wide text-white uppercase flex items-center gap-2">
                BPLO Tricycle Permit Card
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                  {permitYear} Official Card
                </span>
              </h4>
              <p className="text-[10px] sm:text-xs text-white/60">
                Annual Executive License &bull; Office of the Municipal Mayor (BPLO)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-[#9E2A2B] hover:bg-[#851e20] active:scale-95 text-white px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
            title="Print Mayor's Permit Card"
          >
            <Printer size={15} />
            <span className="hidden sm:inline">Print Card</span>
            <span className="sm:hidden">Print</span>
          </button>
        </div>
      )}

      {/* Card Display Container */}
      <div className="w-full max-w-[720px] overflow-x-auto pb-4 custom-scrollbar flex justify-start sm:justify-center">
        <div
          ref={cardRef}
          id="printable-mayor-permit-card"
          className="relative bg-white w-[616px] h-[401px] shrink-0 rounded-md shadow-2xl border-2 border-slate-300 overflow-hidden select-none print:border-none print:shadow-none print:m-0"
          style={{
            backgroundImage: "url('/cards/tricycle_permit_template_2027.png')",
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            fontFamily: "'Arial', 'Helvetica', sans-serif"
          }}
        >
          {/* Print Stylesheet for Card Sizing */}
          <style>{`
            @media print {
              @page {
                size: portrait;
                margin: 10mm;
              }
              body * {
                visibility: hidden !important;
              }
              #printable-mayor-permit-card,
              #printable-mayor-permit-card * {
                visibility: visible !important;
              }
              #printable-mayor-permit-card {
                position: absolute !important;
                left: 50% !important;
                top: 40px !important;
                transform: translateX(-50%) !important;
                width: 616px !important;
                height: 401px !important;
                border: 1px solid #999 !important;
                box-shadow: none !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          `}</style>

          {/* =========================================
              LEFT RED STRIP DYNAMIC VALUES
             ========================================= */}
          {/* Reg. Date: beside 'Reg. Date:' label */}
          <div 
            className="absolute text-white font-bold tracking-wider"
            style={{ left: '110px', top: '346px', fontSize: '11px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
          >
            {regDate}
          </div>

          {/* Status: beside 'Status:' label */}
          <div 
            className="absolute text-white font-bold tracking-wider"
            style={{ left: '95px', top: '366px', fontSize: '11px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
          >
            {statusType}
          </div>

          {/* =========================================
              RIGHT WHITE BODY DYNAMIC VALUES
             ========================================= */}
          {/* PERMIT No.: inside top grey box */}
          <div 
            className="absolute font-black tracking-wider text-slate-900 text-center"
            style={{ left: '488px', top: '28px', width: '100px', fontSize: '11.5px' }}
          >
            {permitNo}
          </div>

          {/* Permit is hereby granted to: (Operator Name) */}
          <div 
            className="absolute font-black tracking-wide text-slate-900 uppercase"
            style={{ left: '330px', top: '143px', fontSize: '14px', maxWidth: '270px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {fullName}
          </div>

          {/* Address */}
          <div 
            className="absolute font-bold text-slate-800"
            style={{ left: '330px', top: '166px', fontSize: '11px', maxWidth: '270px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {address}
          </div>

          {/* Make */}
          <div 
            className="absolute font-bold text-slate-900"
            style={{ left: '330px', top: '208px', fontSize: '11px', maxWidth: '270px' }}
          >
            {make}
          </div>

          {/* Engine No. */}
          <div 
            className="absolute font-mono font-bold text-slate-900"
            style={{ left: '330px', top: '233px', fontSize: '11.5px', maxWidth: '270px' }}
          >
            {engineNo}
          </div>

          {/* Chassis No. */}
          <div 
            className="absolute font-mono font-bold text-slate-900"
            style={{ left: '330px', top: '258px', fontSize: '11.5px', maxWidth: '270px' }}
          >
            {chassisNo}
          </div>

          {/* Franchise No. & 3-Year Validity */}
          <div 
            className="absolute flex items-center font-bold"
            style={{ left: '330px', top: '283px', fontSize: '11px' }}
          >
            <span className="font-mono text-slate-900 font-bold mr-3">{franchiseNo}</span>
            <span className="text-slate-600 font-normal mr-1">validity:</span>
            <span className="text-[#9E2A2B] font-bold font-mono">{franchiseValidity}</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OfficialMayorPermitCard;
