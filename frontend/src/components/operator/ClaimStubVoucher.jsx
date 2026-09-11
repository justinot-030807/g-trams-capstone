import React, { useRef, useState, useEffect } from 'react';
import { 
  FileText, Download, X, Printer, CheckCircle2, ShieldCheck, 
  User, AlertCircle, Loader2, Scissors 
} from 'lucide-react';
import html2canvas from 'html2canvas';

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

      const canvas = await html2canvas(voucherRef.current, {
        scale: 2, // 2x high-resolution crisp image
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('printable-document');
          if (el) {
            el.style.boxShadow = 'none';
            el.style.transform = 'none';
            el.style.borderRadius = '16px';
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
      className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md overflow-y-auto overscroll-contain"
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
            border: 2px dashed #7A1B22 !important;
            border-radius: 12px !important;
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
        <div className="w-full max-w-[500px] bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-3 mb-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-white shadow-xl print:hidden sticky top-2 z-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
              <FileText size={16} />
            </div>
            <div>
              <h3 className="font-black text-xs sm:text-sm tracking-wide">Franchise Claim Stub</h3>
              <p className="text-[10px] text-white/60">Official Payment Slip &bull; 1-Page Cutout</p>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            {/* Download as Image */}
            <button
              onClick={handleDownloadImage}
              disabled={isDownloading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#D4AF37] hover:bg-[#c29e2f] active:scale-95 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-sm disabled:opacity-50 cursor-pointer"
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
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#7A1B22] hover:bg-[#922029] active:scale-95 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Print (1 Page Cutout)"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="text-white/60 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {downloadError && (
          <div className="w-full max-w-[500px] mb-3 print:hidden bg-red-50 text-red-600 px-3 py-2 rounded-xl text-xs font-bold border border-red-200 flex items-center gap-2">
            <AlertCircle size={14} />
            <span>Could not download image. Please try "Print / Save PDF" instead.</span>
          </div>
        )}

        {/* Scissors Cutout Indicator for Paper Printing */}
        <div className="w-full max-w-[500px] mb-1.5 hidden print:flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-dashed border-slate-400 pb-1">
          <span className="flex items-center gap-1"><Scissors size={12} /> Cut along line</span>
          <span>Official Voucher Slip</span>
        </div>

        {/* Compact Official Claim Stub Container */}
        <div 
          ref={voucherRef}
          id="printable-document" 
          className="relative bg-white text-slate-900 w-full max-w-[500px] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden print:border-2 print:border-dashed print:border-[#7A1B22] print:shadow-none print:m-0 print:max-w-full"
        >
          {/* Top Header Banner */}
          <div className="bg-gradient-to-r from-[#7A1B22] via-[#8E2028] to-[#5A1419] p-3.5 sm:p-4 text-white text-center relative border-b-3 border-[#D4AF37]">
            <div className="flex items-center justify-center gap-2.5 mb-1.5">
              <div className="w-10 h-10 bg-white rounded-full p-0.5 shadow-md flex items-center justify-center overflow-hidden shrink-0">
                <img src="/gasan-logo.png" alt="Gasan Official Seal" className="w-full h-full object-cover scale-105" />
              </div>
              <div className="text-left">
                <p className="text-[9px] font-black tracking-widest text-[#D4AF37] uppercase">MUNICIPALITY OF GASAN &bull; MARINDUQUE</p>
                <h1 className="text-xs sm:text-sm font-black tracking-wider uppercase">BPLO &amp; FRANCHISING BOARD</h1>
                <p className="text-[8.5px] text-white/80 uppercase font-semibold">Tricycle Regulation &amp; Management System (G-TRAMS)</p>
              </div>
            </div>

            <div className="inline-block bg-white/10 backdrop-blur-md px-3 py-0.5 rounded-full border border-white/20 text-[9px] font-black tracking-widest text-white uppercase">
              Official Franchise Claim Voucher
            </div>
          </div>

          {/* Voucher Top Body: Amount & Reference */}
          <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Voucher Reference No.</p>
                <p className="text-xs sm:text-sm font-black font-mono text-[#7A1B22] tracking-wider">{refNumber}</p>
                <p className="text-[9.5px] text-slate-500 mt-0.5">Approved: <strong>{formattedDateApproved}</strong></p>
              </div>

              <div className="text-right border-l border-slate-100 pl-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Amount Payable</p>
                <p className="text-xl sm:text-2xl font-black text-slate-900">₱{parseFloat(systemFranchiseFee).toFixed(2)}</p>
                <span className="inline-block text-[8.5px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full mt-0.5">
                  Pay at Cashier
                </span>
              </div>
            </div>
          </div>

          {/* Perforated Ticket Divider */}
          <div className="relative h-4 bg-slate-50 flex items-center overflow-hidden">
            <div className="w-full border-t-2 border-dashed border-slate-300 mx-3" />
          </div>

          {/* Voucher Lower Body: Two-Column Metadata */}
          <div className="p-3.5 sm:p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2.5 text-[11px]">
              
              {/* Operator Information */}
              <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/80 space-y-1.5">
                <p className="text-[9.5px] font-black text-[#7A1B22] uppercase tracking-wider flex items-center gap-1 pb-1 border-b border-slate-200">
                  <User size={11} /> Operator Details
                </p>

                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Name</span>
                  <span className="font-bold text-slate-900 uppercase text-xs truncate block">{unit?.fullName}</span>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Address</span>
                  <span className="font-medium text-slate-800 text-[10px] truncate block">{unit?.address || 'Gasan, Marinduque'}</span>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">TODA</span>
                  <span className="font-black text-[#7A1B22] bg-[#7A1B22]/10 px-1.5 py-0.5 rounded text-[10px] inline-block mt-0.5">
                    {unit?.todaName || 'NON-TODA'}
                  </span>
                </div>
              </div>

              {/* Vehicle & Permit Specifications */}
              <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/80 space-y-1.5">
                <p className="text-[9.5px] font-black text-[#7A1B22] uppercase tracking-wider flex items-center gap-1 pb-1 border-b border-slate-200">
                  <ShieldCheck size={11} /> Unit Details
                </p>

                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Plate / Temp No.</span>
                  <span className="font-black text-slate-900 text-xs tracking-wider">{unit?.plateNo || 'PENDING'}</span>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Make &amp; Route</span>
                  <span className="font-medium text-slate-800 text-[10px] block">{unit?.make} &bull; {unit?.zone || 'Zone 1'}</span>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Motor No.</span>
                  <span className="font-mono text-[9.5px] font-bold text-slate-700 block truncate">{unit?.motorNo}</span>
                </div>
              </div>

            </div>

            {/* Checklist: What to Bring to the Municipal Hall */}
            <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-2.5">
              <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <AlertCircle size={12} className="text-amber-600" />
                What to Bring to the Municipal Hall (Checklist)
              </h4>

              <ul className="space-y-1 text-[10px] text-amber-950 font-medium">
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
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
              <span>LGU GASAN &bull; BPLO</span>
              <span>NO BARCODE NEEDED &bull; VALID DIGITAL STUB</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default ClaimStubVoucher;
