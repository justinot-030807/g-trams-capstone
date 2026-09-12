import React, { useRef, useEffect } from 'react';
import { MUNICIPAL_SIGNATORY } from '../../utils/constants';
import { Printer, X, Award, Layers } from 'lucide-react';

const BatchMtopModal = ({ isOpen, onClose, units = [] }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('printing-batch-mtop');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('printing-batch-mtop');
      document.body.style.overflow = '';
    }
    return () => {
      document.body.classList.remove('printing-batch-mtop');
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !units || units.length === 0) return null;

  const handlePrint = () => {
    document.body.classList.add('printing-batch-mtop');
    window.print();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) 
      ? 'N/A' 
      : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getExpirationDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    d.setFullYear(d.getFullYear() + 1);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div 
      id="printable-batch-mtop-root" 
      className="fixed inset-0 z-[220] bg-slate-950/85 backdrop-blur-md overflow-y-auto overscroll-contain print:p-0 print:bg-white print:static print:inset-auto print:overflow-visible"
    >
      <div className="min-h-full w-full flex flex-col items-center justify-start p-2 sm:p-6 pb-28 pt-2 print:p-0 print:m-0">
        <div className="w-full max-w-[800px] flex flex-col items-center shrink-0 print:max-w-full print:m-0">

          {/* Action Toolbar (Hidden during print) */}
          <div className="w-full bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-3 sm:p-3.5 mb-3 flex items-center justify-between text-white shadow-xl print:hidden sticky top-2 z-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
                <Layers size={18} />
              </div>
              <div>
                <h3 className="font-black text-xs sm:text-sm tracking-wide flex items-center gap-2">
                  Batch MTOP Certificate Print Job
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {units.length} Certificates
                  </span>
                </h3>
                <p className="text-[10px] text-white/60">Continuous Print &bull; 1 Certificate per Page on Long Bond Paper</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-[#7A1B22] hover:bg-[#922029] active:scale-95 text-white px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
                title="Print All Certificates"
              >
                <Printer size={14} />
                <span>Print All ({units.length})</span>
              </button>

              <button
                onClick={onClose}
                className="text-white/60 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                title="Close Batch Preview"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Mobile Swipe Hint */}
          <div className="sm:hidden w-full flex items-center justify-center gap-1.5 text-[11px] text-amber-300 font-sans font-medium mb-2 bg-amber-950/60 border border-amber-500/30 px-3 py-1 rounded-full shadow-sm print:hidden">
            <span>&larr;</span>
            <span>I-swipe pakaliwa o pakanan para makita ang buong Certificate</span>
            <span>&rarr;</span>
          </div>

          {/* Certificates Container */}
          <div className="w-full flex flex-col gap-8 print:gap-0 print:block">
            {/* Scoped Print Styles */}
            <style>{`
              @media print {
                @page {
                  size: 8.5in 13in; /* Philippine Long Bond Paper */
                  margin: 0;
                }
                html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 100% !important;
                  background: white !important;
                  overflow: visible !important;
                }
                body.printing-batch-mtop {
                  background: white !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 100% !important;
                  overflow: visible !important;
                }
                body.printing-batch-mtop * {
                  visibility: hidden !important;
                }
                body.printing-batch-mtop #printable-batch-mtop-root {
                  position: static !important;
                  display: block !important;
                  background: transparent !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  width: 100% !important;
                  overflow: visible !important;
                  backdrop-filter: none !important;
                }
                body.printing-batch-mtop .batch-mtop-page-wrapper,
                body.printing-batch-mtop .batch-mtop-page-wrapper * {
                  visibility: visible !important;
                }
                body.printing-batch-mtop .batch-mtop-page-wrapper {
                  display: block !important;
                  position: relative !important;
                  page-break-after: always !important;
                  break-after: page !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                  width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                body.printing-batch-mtop .batch-mtop-page-wrapper:last-child {
                  page-break-after: auto !important;
                  break-after: auto !important;
                }
                body.printing-batch-mtop .batch-mtop-cert-card {
                  position: relative !important;
                  width: 198mm !important;
                  max-width: 198mm !important;
                  height: 312mm !important;
                  min-height: 312mm !important;
                  max-height: 312mm !important;
                  margin: 8mm auto !important;
                  box-sizing: border-box !important;
                  padding: 22px 26px !important;
                  box-shadow: none !important;
                  background: #FFFDF9 !important;
                  border: 4px double #7A1B22 !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                  overflow: hidden !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: space-between !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
                body.printing-batch-mtop .print-hide,
                body.printing-batch-mtop header,
                body.printing-batch-mtop nav {
                  display: none !important;
                  visibility: hidden !important;
                }
              }
            `}</style>

            {units.map((unit, index) => {
              const issueDate = unit.dateApplied ? formatDate(unit.dateApplied) : formatDate(new Date());
              const expiryDate = unit.dateApplied ? getExpirationDate(unit.dateApplied) : getExpirationDate(new Date());
              const mtopNumber = `MTOP-GASAN-${unit.plateNo || String(unit._id).slice(-6).toUpperCase()}`;

              return (
                <div key={unit._id || index} className="batch-mtop-page-wrapper w-full flex flex-col items-center">
                  {/* Page Indicator Tag for Preview Mode */}
                  <div className="w-full max-w-[740px] flex items-center justify-between mb-1.5 px-2 text-xs text-white/70 font-sans font-bold print:hidden">
                    <span className="flex items-center gap-1.5 text-amber-300">
                      <Award size={13} /> Certificate #{index + 1} of {units.length}
                    </span>
                    <span>{unit.fullName} &bull; Plate: {unit.plateNo || 'PENDING'}</span>
                  </div>

                  {/* Scrollable Container preserving Desktop Certificate Geometry on Mobile */}
                  <div className="w-full max-w-[780px] overflow-x-auto pb-2 custom-scrollbar flex justify-start sm:justify-center">
                    <div 
                      className="batch-mtop-cert-card relative bg-[#FFFDF9] text-slate-900 w-[720px] sm:w-full max-w-[740px] min-h-[880px] flex flex-col justify-between shrink-0 rounded-2xl shadow-2xl p-7 sm:p-9 md:p-10 border-4 sm:border-8 border-double border-[#7A1B22] overflow-hidden print:border-[4px] print:border-double print:border-[#7A1B22] print:shadow-none print:m-0 print:max-w-full"
                      style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                    >
                      {/* Municipal Seal Watermark */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none">
                        <img src="/gasan-logo.png" alt="Watermark" className="w-[360px] h-[360px] object-contain grayscale" />
                      </div>

                      {/* TOP SECTION: Header, Preamble, Grantee Box */}
                      <div>
                        {/* Certificate Header */}
                        <div className="text-center relative z-10 border-b-2 border-[#7A1B22]/40 pb-3 mb-3">
                          <div className="flex items-center justify-center gap-4 mb-2">
                            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden shrink-0 border-2 border-[#D4AF37] shadow-xs">
                              <img src="/gasan-logo.png" alt="Gasan Seal" className="w-full h-full object-cover" />
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] uppercase tracking-widest text-slate-600 font-sans font-semibold">Republic of the Philippines</p>
                              <p className="text-[10px] uppercase tracking-widest text-slate-600 font-sans font-semibold">Province of Marinduque</p>
                              <h2 className="text-lg sm:text-xl font-black text-[#7A1B22] tracking-wider uppercase font-serif">MUNICIPALITY OF GASAN</h2>
                              <p className="text-[9.5px] uppercase tracking-widest text-slate-700 font-sans font-bold">Office of the Municipal Vice Mayor / Sangguniang Bayan</p>
                            </div>
                            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden shrink-0 border-2 border-[#D4AF37] shadow-xs">
                              <img src="/gasan-logo.png" alt="Gasan Seal Right" className="w-full h-full object-cover" />
                            </div>
                          </div>

                          <div className="mt-1.5">
                            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-wide uppercase font-serif">
                              MOTORIZED TRICYCLE OPERATOR'S PERMIT
                            </h1>
                            <p className="text-[11px] font-bold tracking-widest text-[#7A1B22] uppercase font-sans mt-0.5">
                              MUNICIPAL (TRICYCLE) FRANCHISE
                            </p>
                            <div className="inline-block mt-1.5 px-4 py-1 bg-amber-50 border border-amber-300 rounded text-xs sm:text-sm font-mono font-bold text-[#7A1B22] shadow-2xs">
                              PERMIT NO: {mtopNumber}
                            </div>
                          </div>
                        </div>

                        {/* Grant Preamble */}
                        <div className="relative z-10 text-xs leading-relaxed text-slate-800 mb-3 text-justify font-serif">
                          <p className="font-bold text-xs sm:text-sm text-[#7A1B22] mb-1">TO WHOM IT MAY CONCERN:</p>
                          <p>
                            Pursuant to the provisions of Section 447 (a)(3)(vi) of <strong>Republic Act No. 7160</strong> (Local Government Code of 1991), 
                            and existing Municipal Ordinances and Franchising Regulations of the Municipality of Gasan, Marinduque, authority and permission is hereby granted to:
                          </p>
                        </div>

                        {/* Grantee & Authorization Box */}
                        <div className="relative z-10 bg-amber-50/50 border border-[#D4AF37]/60 rounded-xl p-3.5 mb-3 text-xs sm:text-sm">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <span className="text-[10px] font-sans font-bold text-slate-500 uppercase block">Name of Operator:</span>
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">{unit.fullName?.toUpperCase()}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-sans font-bold text-slate-500 uppercase block">Residential Address:</span>
                              <span className="font-bold text-slate-800 text-xs sm:text-sm">{unit.address || 'Gasan, Marinduque'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-sans font-bold text-slate-500 uppercase block">Classification:</span>
                              <span className="font-bold text-[#7A1B22] text-xs sm:text-sm">{unit.applicationType === 'Renewal' ? 'RENEWAL' : 'NEW APPLICATION'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-sans font-bold text-slate-500 uppercase block">Authorized Route &amp; Zone:</span>
                              <span className="font-bold text-slate-800 text-xs sm:text-sm">Zone {unit.zone} &bull; {unit.todaName || 'NON-TODA'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* MIDDLE SECTION: Specifications & Terms and Conditions */}
                      <div>
                        {/* Tricycle Technical Specifications */}
                        <div className="relative z-10 mb-3">
                          <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                            AUTHORIZED MOTORIZED TRICYCLE UNIT SPECIFICATIONS:
                          </p>
                          <table className="w-full border-collapse border border-slate-300 text-xs text-left">
                            <thead>
                              <tr className="bg-slate-100/90 font-sans text-[10px] uppercase font-bold text-slate-700">
                                <th className="border border-slate-300 py-2 px-3 text-center">Make / Brand</th>
                                <th className="border border-slate-300 py-2 px-3 text-center">Year / Model</th>
                                <th className="border border-slate-300 py-2 px-3 text-center">Motor Number</th>
                                <th className="border border-slate-300 py-2 px-3 text-center">Chassis Number</th>
                                <th className="border border-slate-300 py-2 px-3 text-center">Plate Number</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="font-mono text-center font-bold text-slate-800 text-xs sm:text-sm">
                                <td className="border border-slate-300 py-2 px-3">{unit.make || 'N/A'}</td>
                                <td className="border border-slate-300 py-2 px-3">{unit.made || 'N/A'}</td>
                                <td className="border border-slate-300 py-2 px-3">{unit.motorNo || 'N/A'}</td>
                                <td className="border border-slate-300 py-2 px-3">{unit.chassisNo || 'N/A'}</td>
                                <td className="border border-slate-300 py-2 px-3 text-[#7A1B22] font-black">{unit.plateNo || 'PENDING'}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Standard 7 Legal Terms and Conditions (Appendix C) */}
                        <div className="relative z-10 mb-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                          <p className="text-[10px] font-sans font-black uppercase tracking-wider text-[#7A1B22] mb-1.5">
                            TERMS AND CONDITIONS (APPENDIX C - MUNICIPAL FRANCHISE):
                          </p>
                          <ol className="list-decimal list-outside pl-4 space-y-1 text-[9.5px] sm:text-[10px] text-slate-700 leading-snug">
                            <li>The operator and driver shall strictly comply with all national traffic laws, municipal ordinances, and road safety regulations promulgated by the Municipality of Gasan.</li>
                            <li>This permit is strictly <strong>non-transferable</strong> and valid exclusively for the motorized tricycle unit specifically described herein.</li>
                            <li>The unit shall operate strictly within its assigned <strong>authorized route and zone</strong> approved by the Sangguniang Bayan.</li>
                            <li>The operator and designated driver shall charge only the authorized fare matrix prescribed by municipal ordinance and shall conspicuously display the fare schedule inside the passenger sidecar.</li>
                            <li>The unit must maintain roadworthiness, safety equipment, functioning headlights, taillights, signal lights, and clean passenger accommodation at all times.</li>
                            <li>Operation along national highways is strictly subject to the Tricycle Route Plan (TRP) and DOTr-DILG Joint Memorandum Circular 2020-036; travel is limited to authorized municipal intersection crossing points.</li>
                            <li>Violation of any of the foregoing conditions, municipal ordinances, or terms of this franchise shall constitute sufficient grounds for the immediate suspension, fine, or revocation of this permit.</li>
                          </ol>
                        </div>
                      </div>

                      {/* BOTTOM SECTION: Validity & Official Signatory Block */}
                      <div>
                        {/* Validity and Grant Statement */}
                        <div className="relative z-10 text-xs sm:text-sm leading-relaxed text-slate-800 mb-4 flex items-center justify-between gap-2 border-t border-b border-slate-200 py-2">
                          <div>
                            <span className="text-[9.5px] font-sans font-bold text-slate-500 uppercase block">Effective Date:</span>
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">{issueDate}</span>
                          </div>
                          <div>
                            <span className="text-[9.5px] font-sans font-bold text-slate-500 uppercase block">Validity Period:</span>
                            <span className="font-bold text-emerald-800 text-xs sm:text-sm">One (1) Year Validity</span>
                          </div>
                          <div>
                            <span className="text-[9.5px] font-sans font-bold text-slate-500 uppercase block">Expiration Date:</span>
                            <span className="font-black text-[#7A1B22] text-xs sm:text-sm">{expiryDate}</span>
                          </div>
                        </div>

                        {/* Official Signatory Section */}
                        <div className="relative z-10 pt-2 flex items-end justify-between gap-4">
                          <div className="text-left font-sans text-[9px] text-slate-500 space-y-1">
                            <p className="font-semibold text-slate-600">Certified Official Copy</p>
                            <p>G-TRAMS Electronic Authentication</p>
                            <p className="font-mono text-[8.5px]">DOC-ID: {String(unit._id).toUpperCase()}</p>
                          </div>

                          <div className="text-right">
                            <p className="text-[10px] font-sans uppercase font-bold text-slate-600 mb-6 sm:mb-8 print:mb-8">
                              For and by Authority of the Sangguniang Bayan:
                            </p>
                            <div className="inline-block text-center border-t-2 border-slate-800 pt-1.5 min-w-[220px]">
                              <p className="font-serif font-black text-sm sm:text-base text-slate-900 tracking-wide">
                                {MUNICIPAL_SIGNATORY}
                              </p>
                              <p className="text-[10px] font-sans uppercase font-bold text-slate-600">
                                Municipal Vice Mayor &amp; Presiding Officer
                              </p>
                              <p className="text-[9px] font-sans text-slate-500 italic">
                                Municipality of Gasan, Marinduque
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
};

export default BatchMtopModal;
