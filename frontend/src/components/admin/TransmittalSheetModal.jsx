import React, { useEffect } from 'react';
import { MUNICIPAL_SIGNATORY } from '../../utils/constants';
import { Printer, X, FileSpreadsheet, ShieldCheck } from 'lucide-react';

const TransmittalSheetModal = ({ isOpen, onClose, units = [], batchDate = new Date() }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('printing-transmittal');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('printing-transmittal');
      document.body.style.overflow = '';
    }
    return () => {
      document.body.classList.remove('printing-transmittal');
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !units || units.length === 0) return null;

  const handlePrint = () => {
    document.body.classList.add('printing-transmittal');
    window.print();
  };

  const formattedDate = new Date(batchDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const batchRef = `TRANS-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(units.length).padStart(3, '0')}`;

  return (
    <div 
      id="printable-transmittal-root" 
      className="fixed inset-0 z-[220] bg-slate-950/85 backdrop-blur-md overflow-y-auto overscroll-contain print:p-0 print:bg-white print:static print:inset-auto print:overflow-visible"
    >
      <div className="min-h-full w-full flex flex-col items-center justify-start p-2 sm:p-6 pb-28 pt-2 print:p-0 print:m-0">
        <div className="w-full max-w-[860px] flex flex-col items-center shrink-0 print:max-w-full print:m-0">

          {/* Action Toolbar (Hidden during print) */}
          <div className="w-full bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-3 sm:p-3.5 mb-3 flex items-center justify-between text-white shadow-xl print:hidden sticky top-2 z-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#7A1B22] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <h3 className="font-black text-xs sm:text-sm tracking-wide flex items-center gap-2">
                  Official Transmittal Summary Sheet
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {units.length} Units Listed
                  </span>
                </h3>
                <p className="text-[10px] text-white/60">LGU Gasan BPLO &bull; Sangguniang Bayan Endorsement Record</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-[#7A1B22] hover:bg-[#922029] active:scale-95 text-white px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
                title="Print Transmittal Sheet"
              >
                <Printer size={14} />
                <span>Print Transmittal</span>
              </button>

              <button
                onClick={onClose}
                className="text-white/60 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Printable Transmittal Sheet */}
          <div className="w-full overflow-x-auto pb-4 custom-scrollbar flex justify-start sm:justify-center">
            <div 
              id="printable-transmittal-document"
              className="relative bg-white text-slate-900 w-[780px] sm:w-full max-w-[820px] shrink-0 rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-300 print:border-none print:shadow-none print:m-0 print:max-w-full"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            >
              {/* Print Styles */}
              <style>{`
                @media print {
                  @page {
                    size: 8.5in 13in; /* Long Bond Paper */
                    margin: 0;
                  }
                  html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    background: white !important;
                    overflow: visible !important;
                  }
                  body.printing-transmittal {
                    background: white !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    overflow: visible !important;
                  }
                  body.printing-transmittal * {
                    visibility: hidden !important;
                  }
                  body.printing-transmittal #printable-transmittal-root {
                    position: static !important;
                    display: block !important;
                    background: transparent !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    width: 100% !important;
                    overflow: visible !important;
                    backdrop-filter: none !important;
                  }
                  body.printing-transmittal #printable-transmittal-document,
                  body.printing-transmittal #printable-transmittal-document * {
                    visibility: visible !important;
                  }
                  body.printing-transmittal #printable-transmittal-document {
                    position: relative !important;
                    left: 0 !important;
                    right: 0 !important;
                    top: 0 !important;
                    transform: none !important;
                    width: 200mm !important;
                    max-width: 200mm !important;
                    margin: 8mm auto !important;
                    box-sizing: border-box !important;
                    padding: 16px 20px !important;
                    box-shadow: none !important;
                    border: none !important;
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                  }
                  body.printing-transmittal .print-hide,
                  body.printing-transmittal header,
                  body.printing-transmittal nav {
                    display: none !important;
                    visibility: hidden !important;
                  }
                }
              `}</style>

              {/* Header */}
              <div className="text-center border-b-2 border-[#7A1B22] pb-3 mb-3">
                <div className="flex items-center justify-center gap-3.5 mb-1">
                  <div className="w-13 h-13 rounded-full overflow-hidden shrink-0 border border-[#D4AF37]">
                    <img src="/gasan-logo.png" alt="Gasan Seal" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-center">
                    <p className="text-[9.5px] uppercase tracking-widest text-slate-600 font-sans font-semibold">Republic of the Philippines</p>
                    <p className="text-[9.5px] uppercase tracking-widest text-slate-600 font-sans font-semibold">Province of Marinduque</p>
                    <h2 className="text-base font-black text-[#7A1B22] tracking-wider uppercase font-serif">MUNICIPALITY OF GASAN</h2>
                    <p className="text-[9px] uppercase tracking-widest text-slate-700 font-sans font-bold">Office of the Sangguniang Bayan / BPLO Franchising Unit</p>
                  </div>
                  <div className="w-13 h-13 rounded-full overflow-hidden shrink-0 border border-[#D4AF37]">
                    <img src="/gasan-logo.png" alt="Gasan Seal Right" className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="mt-2">
                  <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-wide uppercase font-serif">
                    BATCH FRANCHISE TRANSMITTAL &amp; ENDORSEMENT SUMMARY
                  </h1>
                  <p className="text-[9.5px] font-bold tracking-widest text-[#7A1B22] uppercase font-sans mt-0.5">
                    MOTORIZED TRICYCLE OPERATOR'S PERMIT (MTOP) APPROVAL QUEUE
                  </p>
                </div>
              </div>

              {/* Transmittal Metadata Strip */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 mb-3 text-xs flex items-center justify-between font-sans">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Transmittal Ref:</span>
                  <span className="font-mono font-bold text-[#7A1B22] text-xs">{batchRef}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Date Processed:</span>
                  <span className="font-bold text-slate-800 text-xs">{formattedDate}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Units:</span>
                  <span className="font-bold text-slate-900 text-xs">{units.length} Unit(s)</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Action Type:</span>
                  <span className="font-bold text-emerald-700 text-xs">Ready for Pickup / Release</span>
                </div>
              </div>

              {/* Units Table */}
              <div className="mb-4">
                <table className="w-full border-collapse border border-slate-300 text-xs text-left font-sans">
                  <thead>
                    <tr className="bg-slate-100 text-[9px] uppercase font-bold text-slate-700">
                      <th className="border border-slate-300 py-1.5 px-2 text-center w-8">#</th>
                      <th className="border border-slate-300 py-1.5 px-2">Operator Name</th>
                      <th className="border border-slate-300 py-1.5 px-2 text-center">TODA / Route</th>
                      <th className="border border-slate-300 py-1.5 px-2 text-center">Plate No.</th>
                      <th className="border border-slate-300 py-1.5 px-2 text-center">Make / Year</th>
                      <th className="border border-slate-300 py-1.5 px-2 text-center">Motor No.</th>
                      <th className="border border-slate-300 py-1.5 px-2 text-center">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((unit, i) => (
                      <tr key={unit._id || i} className="text-[10px] text-slate-800 hover:bg-slate-50">
                        <td className="border border-slate-300 py-1 px-2 text-center font-bold">{i + 1}</td>
                        <td className="border border-slate-300 py-1 px-2 font-bold uppercase">{unit.fullName}</td>
                        <td className="border border-slate-300 py-1 px-2 text-center font-semibold">{unit.todaName || 'NON-TODA'} (Z{unit.zone || 1})</td>
                        <td className="border border-slate-300 py-1 px-2 text-center font-mono font-black text-[#7A1B22]">{unit.plateNo || 'PENDING'}</td>
                        <td className="border border-slate-300 py-1 px-2 text-center">{unit.make} {unit.made ? `(${unit.made})` : ''}</td>
                        <td className="border border-slate-300 py-1 px-2 text-center font-mono">{unit.motorNo}</td>
                        <td className="border border-slate-300 py-1 px-2 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${unit.applicationType === 'Renewal' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                            {unit.applicationType || 'New'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Endorsement Statement */}
              <div className="text-[10.5px] leading-snug text-slate-700 mb-6 text-justify">
                <p>
                  I hereby certify that the above-listed motorized tricycle franchise applications have undergone thorough administrative inspection, 
                  verification of required statutory clearances (OR/CR, LTO Driver's License, TODA Endorsement, Barangay Clearance), and compliance 
                  with the Tricycle Franchising Guidelines of the Municipality of Gasan. Accordingly, these units are hereby endorsed for fee payment, 
                  issuance of MTOP Certificate, and physical release of municipal number plates/stickers.
                </p>
              </div>

              {/* Signatures */}
              <div className="pt-2 grid grid-cols-2 gap-8 font-sans">
                <div className="text-center">
                  <p className="text-[9px] uppercase font-bold text-slate-500 mb-8">
                    Prepared &amp; Inspected by:
                  </p>
                  <div className="border-t border-slate-800 pt-1 inline-block min-w-[200px]">
                    <p className="font-bold text-xs text-slate-900 uppercase">
                      BPLO FRANCHISING IN-CHARGE
                    </p>
                    <p className="text-[8.5px] text-slate-500">
                      Business Permits &amp; Licensing Office
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-[9px] uppercase font-bold text-slate-500 mb-8">
                    Approved &amp; Endorsed by:
                  </p>
                  <div className="border-t border-slate-800 pt-1 inline-block min-w-[200px]">
                    <p className="font-black text-xs text-slate-900 uppercase font-serif">
                      {MUNICIPAL_SIGNATORY}
                    </p>
                    <p className="text-[8.5px] uppercase font-bold text-slate-600">
                      Municipal Vice Mayor &amp; Presiding Officer
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TransmittalSheetModal;
