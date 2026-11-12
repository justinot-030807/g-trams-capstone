import React, { useRef, useEffect } from 'react';
import { X, Printer, FileText } from 'lucide-react';

const OfficialCancellationLetterModal = ({
  isOpen,
  onClose,
  cancellationData = {},
  franchise = {}
}) => {
  const printRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('printing-cancellation');
    } else {
      document.body.classList.remove('printing-cancellation');
    }
    return () => {
      document.body.classList.remove('printing-cancellation');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const data = { ...franchise, ...cancellationData };
  const operatorName = String(data.fullName || data.operatorName || data.name || 'OPERATOR').toUpperCase();
  const address = String(data.address || 'Gasan, Marinduque');
  const plateNo = String(data.plateNo || data.mvFileNo || 'PENDING').toUpperCase();
  const franchiseNo = String(data.franchiseNo || data.mtopNo || '2026-000').toUpperCase();
  const make = String(data.make || 'KAWASAKI').toUpperCase();
  const chassisNo = String(data.chassisNo || '—').toUpperCase();
  const motorNo = String(data.motorNo || '—').toUpperCase();
  const model = String(data.made || data.model || new Date().getFullYear()).toUpperCase();
  
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const dayStr = today.getDate();
  const monthYearStr = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const orNo = data.cancellationOrNo || data.orNo || '7368238';
  const orDate = data.cancellationOrDate || dateStr;
  const amount = '₱50.00';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      id="printable-cancellation-modal-root" 
      className="fixed inset-0 z-[130] bg-black/75 overflow-y-auto flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[760px] flex flex-col items-center shrink-0 print:max-w-full print:m-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="w-full bg-[#1F1D1B] dark:bg-[#1C1917] border border-[#E4E1DC]/20 dark:border-[#2E2A27] rounded-xl p-3 mb-3 flex items-center justify-between text-white shadow-md print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
              <FileText size={17} />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black tracking-wide text-white uppercase flex items-center gap-2">
                Official Franchise Cancellation Letter
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                  OVM Certified
                </span>
              </h4>
              <p className="text-[10px] sm:text-xs text-white/60">
                Official Sangguniang Bayan / Office of the Vice Mayor clearance format
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-[#9E2A2B] hover:bg-[#851e20] active:scale-95 text-white px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print / Save PDF</span>
              <span className="sm:hidden">Print</span>
            </button>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Letter Sheet */}
        <div 
          ref={printRef}
          id="printable-cancellation-letter"
          className="relative bg-white text-slate-900 w-full max-w-[720px] min-h-[820px] rounded-lg shadow-xl p-8 sm:p-12 border border-slate-300 print:border-none print:shadow-none print:p-0 print:m-0 overflow-hidden"
          style={{ fontFamily: "'Times New Roman', Times, serif" }}
        >
          {/* Print Style */}
          <style>{`
            @media print {
              @page {
                size: 8.5in 13in;
                margin: 12mm 15mm;
              }
              body.printing-cancellation * {
                visibility: hidden !important;
              }
              body.printing-cancellation #printable-cancellation-letter,
              body.printing-cancellation #printable-cancellation-letter * {
                visibility: visible !important;
              }
              body.printing-cancellation #printable-cancellation-letter {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                border: none !important;
                box-shadow: none !important;
                background: white !important;
                color: black !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          `}</style>

          {/* Authentic Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none select-none z-0">
            <img 
              src="/excel_assets/doc_image2.png" 
              alt="Sangguniang Bayan Seal Watermark" 
              className="w-[420px] h-[420px] object-contain" 
            />
          </div>

          {/* Letterhead */}
          <div className="relative z-10 w-full mb-6 border-b-2 border-slate-900 pb-2">
            <img 
              src="/excel_assets/header_banner.png" 
              alt="Municipality of Gasan - Office of the Municipal Vice Mayor" 
              className="w-full h-auto object-contain"
            />
          </div>

          {/* Recipient Block */}
          <div className="relative z-10 text-xs sm:text-sm text-slate-900 mb-6 space-y-1">
            <p className="font-bold">{operatorName}</p>
            <p>{address}</p>
          </div>

          <div className="relative z-10 text-xs sm:text-sm text-slate-900 mb-6">
            <p className="font-bold">Dear Mr./Ms. {operatorName.split(' ')[0]}:</p>
          </div>

          {/* Body Content */}
          <div className="relative z-10 text-xs sm:text-sm text-slate-900 leading-relaxed space-y-4 text-justify">
            <p className="indent-8">
              This has reference to your letter requesting this office to cancel the franchise of your motorized tricycle with Plate / File No. <strong className="font-mono">{plateNo}</strong>.
            </p>
            <p className="indent-8">
              Having submitted all the necessary documents for cancellation, your request is hereby granted.
            </p>
            <p className="indent-8">
              Franchise No. <strong className="font-mono">{franchiseNo}</strong> cancelled this <strong>{dayStr}th day of {monthYearStr}</strong>.
            </p>

            {/* Specifications Box */}
            <div className="my-6 pl-8 font-mono text-xs sm:text-sm space-y-1.5 border-l-2 border-slate-400">
              <div className="grid grid-cols-12">
                <span className="col-span-4 font-bold font-sans">MAKE</span>
                <span className="col-span-8">: {make}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-4 font-bold font-sans">CHASSIS NO.</span>
                <span className="col-span-8">: {chassisNo}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-4 font-bold font-sans">MOTOR NO.</span>
                <span className="col-span-8">: {motorNo}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-4 font-bold font-sans">MODEL</span>
                <span className="col-span-8">: {model}</span>
              </div>
            </div>

            <p className="indent-8">
              Issued this <strong>{dayStr}th day of {monthYearStr}</strong> upon request of the interested party for whatever legal purpose it may serve.
            </p>
          </div>

          {/* Signatory */}
          <div className="relative z-10 mt-12 flex justify-end">
            <div className="relative inline-block text-center min-w-[240px]">
              <img 
                src="/excel_assets/franchise_image2.png" 
                alt="Signature of Vice Mayor" 
                className="absolute -top-10 left-1/2 -translate-x-1/2 w-44 h-16 object-contain pointer-events-none" 
              />
              <p className="font-serif font-black text-sm sm:text-base text-slate-900 tracking-wide border-t border-slate-800 pt-1">
                LIDANY A. LAO-BALDO
              </p>
              <p className="text-xs font-sans uppercase font-bold text-slate-700">
                Municipal Vice Mayor
              </p>
              <p className="text-[9px] font-sans text-slate-500 italic">
                Presiding Officer &bull; Sangguniang Bayan
              </p>
            </div>
          </div>

          {/* Official Receipt Footer */}
          <div className="relative z-10 mt-14 pt-4 border-t border-slate-300 text-[10px] font-sans text-slate-600 flex items-center justify-between">
            <div className="space-y-0.5">
              <p>Amount: <strong className="text-slate-900 font-mono">{amount}</strong></p>
              <p>O.R. No.: <strong className="text-slate-900 font-mono">{orNo}</strong></p>
              <p>Date: <strong className="text-slate-900">{orDate}</strong></p>
            </div>
            <div className="text-right italic text-slate-400 text-[9px]">
              G-TRAMS Electronic Document System &bull; Municipality of Gasan
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OfficialCancellationLetterModal;
