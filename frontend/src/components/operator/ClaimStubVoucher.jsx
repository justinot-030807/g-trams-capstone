import React, { useRef, useState, useEffect } from 'react';
import { 
  FileText, Download, X, Printer, CheckCircle2, ShieldCheck, 
  User, AlertCircle, Loader2, Scissors 
} from 'lucide-react';
import { formatZoneLabel } from '../../utils/constants';

const ClaimStubVoucher = ({ isOpen, onClose, unit, systemFranchiseFee = '500' }) => {
  const voucherRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('printing-claim-stub');
    } else {
      document.body.classList.remove('printing-claim-stub');
    }
    return () => {
      document.body.classList.remove('printing-claim-stub');
    };
  }, [isOpen]);

  if (!isOpen || !unit) return null;

  const handlePrint = () => {
    document.body.classList.add('printing-claim-stub');
    window.print();
  };

  const formattedDateApproved = unit?.updatedAt 
    ? new Date(unit.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const refNumber = `GTRAMS-${String(unit?._id || '').slice(-8).toUpperCase()}`;

  const handleDownloadImage = async () => {
    if (!voucherRef.current || isDownloading) return;
    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      await new Promise(r => setTimeout(r, 120));

      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(voucherRef.current, {
        scale: 2, // 2x high-resolution crisp image
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        windowWidth: 500,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('printable-document');
          if (el) {
            el.style.boxShadow = 'none';
            el.style.transform = 'none';
            el.style.borderRadius = '16px';
            el.style.width = '500px'; // Force fixed width to prevent text squishing on mobile
            el.style.maxWidth = '500px';
          }
        }
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `GTRAMS_Claim_Stub_${refNumber}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Error exporting voucher as image:', err);
      setDownloadError(true);
      setTimeout(() => setDownloadError(false), 4000);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div 
      id="claim-stub-modal-root" 
      className="fixed inset-0 z-[100] bg-black/60 overflow-y-auto overscroll-contain"
    >
      {/* Scoped print & color preservation styles */}
      <style>{`
        @media print {
          @page {
            size: auto;
            margin: 0; /* Suppresses browser headers (URL, G-TRAMS, timestamp, page counter) */
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            height: auto !important;
            overflow: visible !important;
          }
          body.printing-claim-stub {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          body.printing-claim-stub * {
            visibility: hidden !important;
          }
          body.printing-claim-stub #claim-stub-modal-root {
            position: static !important;
            display: block !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }
          body.printing-claim-stub #printable-document,
          body.printing-claim-stub #printable-document * {
            visibility: visible !important;
          }
          body.printing-claim-stub #printable-document {
            position: relative !important;
            left: 0 !important;
            right: 0 !important;
            top: 0 !important;
            transform: none !important;
            margin: 8mm auto !important;
            width: 140mm !important;
            max-width: 140mm !important;
            box-sizing: border-box !important;
            border: 2px dashed #9E2A2B !important;
            border-radius: 8px !important;
            box-shadow: none !important;
            background: #ffffff !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-before: avoid !important;
            break-before: avoid !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .print-hide {
            display: none !important;
          }
        }
      `}</style>

      {/* Inner Scrolling Wrapper with safe bottom padding for touch scrolling */}
      <div className="min-h-full w-full flex flex-col items-center justify-start p-3 sm:p-6 pb-36 pt-2">
        
        {/* Action Toolbar (Hidden during print) */}
        <div className="w-full max-w-[500px] bg-[#1C1917] border border-[#2E2A27] rounded-lg p-3 mb-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-white shadow-xl print:hidden sticky top-2 z-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
              <FileText size={16} />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm tracking-wide">Franchise Claim Stub</h3>
              <p className="text-xs text-white/60">Official Payment Slip &bull; 1-Page Cutout</p>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            {/* Download as Image */}
            <button
              onClick={handleDownloadImage}
              disabled={isDownloading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#D4AF37] hover:bg-[#c29e2f] active:scale-95 text-[#14110F] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer min-h-[38px]"
              title="Download claim stub directly to device gallery"
            >
              {isDownloading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 size={14} className="text-emerald-900" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>Image</span>
                </>
              )}
            </button>

            {/* Print / Save PDF */}
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#9E2A2B] hover:bg-[#7A1B22] active:scale-95 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer min-h-[38px]"
              title="Print (1 Page Cutout)"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {downloadError && (
          <div className="w-full max-w-[500px] mb-3 print:hidden bg-red-50 text-[#B91C1C] px-3 py-2 rounded-lg text-xs font-bold border border-red-200 flex items-center gap-2">
            <AlertCircle size={14} />
            <span>Could not download image. Please try "Print / Save PDF" instead.</span>
          </div>
        )}

        {/* Scissors Cutout Indicator for Paper Printing */}
        <div className="w-full max-w-[500px] mb-1.5 hidden print:flex items-center justify-between text-xs text-[#6B6761] font-bold uppercase tracking-widest border-b border-dashed border-[#E4E1DC] pb-1">
          <span className="flex items-center gap-1"><Scissors size={12} /> Cut along line</span>
          <span>Official Voucher Slip</span>
        </div>

        {/* Compact Official Claim Stub Container */}
        <div 
          ref={voucherRef}
          id="printable-document" 
          className="relative bg-white text-[#1F1D1B] w-full max-w-[500px] rounded-lg shadow-xl border border-[#E4E1DC] overflow-hidden print:border-2 print:border-dashed print:border-[#9E2A2B] print:shadow-none print:m-0 print:max-w-full"
        >
          {/* Top Header Banner */}
          <div className="bg-[#9E2A2B] p-3.5 sm:p-4 text-white text-center relative border-b-2 border-[#D4AF37]">
            <div className="flex items-center justify-center gap-2.5 mb-1.5">
              <div className="w-10 h-10 bg-white rounded-full p-0.5 shadow-md flex items-center justify-center overflow-hidden shrink-0">
                <img src="/gasan-logo.png" alt="Gasan Official Seal" className="w-full h-full object-cover scale-105" />
              </div>
              <div className="text-left">
                <p className="text-[9px] font-bold tracking-widest text-[#D4AF37] uppercase">MUNICIPALITY OF GASAN &bull; MARINDUQUE</p>
                <h1 className="text-xs sm:text-sm font-bold tracking-wider uppercase">Office of the Vice Mayor Extension &amp; FRANCHISING BOARD</h1>
                <p className="text-[8.5px] text-white/80 uppercase font-semibold">Tricycle Regulation &amp; Management System (G-TRAMS)</p>
              </div>
            </div>

            <div className="inline-block bg-white/15 px-3 py-0.5 rounded text-[9px] font-bold tracking-widest text-white uppercase">
              Official Franchise Claim Voucher
            </div>
          </div>

          {/* Voucher Top Body: Amount & Reference */}
          <div className="p-3 sm:p-4 bg-[#F6F5F3] border-b border-[#E4E1DC]">
            <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E4E1DC] shadow-2xs">
              <div>
                <p className="text-[9px] font-bold text-[#6B6761] uppercase tracking-wider">Voucher Reference No.</p>
                <p className="text-xs sm:text-sm font-bold font-mono text-[#9E2A2B] tracking-wider">{refNumber}</p>
                <p className="text-[9.5px] text-[#6B6761] mt-0.5">Approved: <strong>{formattedDateApproved}</strong></p>
              </div>

              <div className="text-right border-l border-[#E4E1DC] pl-3">
                <p className="text-[9px] font-bold text-[#6B6761] uppercase tracking-wider">Amount Payable</p>
                <p className="text-xl sm:text-2xl font-bold text-[#1F1D1B]">₱{parseFloat(systemFranchiseFee).toFixed(2)}</p>
                <span className="inline-block text-[8.5px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded mt-0.5">
                  Pay at Cashier
                </span>
              </div>
            </div>
          </div>

          {/* Perforated Ticket Divider */}
          <div className="relative h-4 bg-[#F6F5F3] flex items-center overflow-hidden">
            <div className="w-full border-t-2 border-dashed border-[#E4E1DC] mx-3" />
          </div>

          {/* Voucher Lower Body: Two-Column Metadata */}
          <div className="p-3.5 sm:p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              
              {/* Operator Information */}
              <div className="bg-[#F6F5F3] rounded-lg p-2.5 border border-[#E4E1DC] space-y-1.5">
                <p className="text-[9.5px] font-bold text-[#9E2A2B] uppercase tracking-wider flex items-center gap-1 pb-1 border-b border-[#E4E1DC]">
                  <User size={11} /> Operator Details
                </p>

                <div>
                  <span className="text-[9px] font-bold text-[#6B6761] uppercase block">Name</span>
                  <span className="font-bold text-[#1F1D1B] uppercase text-xs truncate block">{unit?.fullName}</span>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-[#6B6761] uppercase block">Address</span>
                  <span className="font-medium text-[#1F1D1B] text-xs truncate block">{unit?.address || 'Gasan, Marinduque'}</span>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-[#6B6761] uppercase block">TODA</span>
                  <span className="font-bold text-[#9E2A2B] bg-[#9E2A2B]/10 px-1.5 py-0.5 rounded text-xs inline-block mt-0.5 max-w-full break-words whitespace-normal leading-tight">
                    {unit?.todaName || 'NON-TODA'}
                  </span>
                </div>
              </div>

              {/* Vehicle & Permit Specifications */}
              <div className="bg-[#F6F5F3] rounded-lg p-2.5 border border-[#E4E1DC] space-y-1.5">
                <p className="text-[9.5px] font-bold text-[#9E2A2B] uppercase tracking-wider flex items-center gap-1 pb-1 border-b border-[#E4E1DC]">
                  <ShieldCheck size={11} /> Unit Details
                </p>

                <div>
                  <span className="text-[9px] font-bold text-[#6B6761] uppercase block">Plate / Temp No.</span>
                  <span className="font-bold text-[#1F1D1B] text-xs tracking-wider">{unit?.plateNo || 'PENDING'}</span>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-[#6B6761] uppercase block">Make &amp; Route</span>
                  <span className="font-medium text-[#1F1D1B] text-xs block">{unit?.make} &bull; {formatZoneLabel(unit?.zone)}</span>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-[#6B6761] uppercase block">Motor No.</span>
                  <span className="font-mono text-[9.5px] font-bold text-[#1F1D1B] block truncate">{unit?.motorNo}</span>
                </div>
              </div>

            </div>

            {/* Checklist: What to Bring to the Municipal Hall */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <AlertCircle size={12} className="text-amber-600" />
                What to Bring to the Municipal Hall (Checklist)
              </h4>

              <ul className="space-y-1 text-xs text-amber-950 font-medium">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={11} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>1. Claim Stub Voucher:</strong> Digital on mobile or printed slip.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={11} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>2. Valid Government ID / Driver's License</strong></span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={11} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>3. Exact Fee Payment (₱{parseFloat(systemFranchiseFee).toFixed(2)})</strong> for Cashier.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={11} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>4. Tricycle Unit</strong> for stenciling and MTOP inspection.</span>
                </li>
              </ul>
            </div>

            {/* Official Authorization Seal Footer */}
            <div className="pt-2 border-t border-[#E4E1DC] flex items-center justify-between text-[9px] text-[#6B6761] font-semibold uppercase tracking-wider">
              <span>LGU GASAN &bull; Office of the Vice Mayor Extension</span>
              <span>NO BARCODE NEEDED &bull; VALID DIGITAL STUB</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default ClaimStubVoucher;

