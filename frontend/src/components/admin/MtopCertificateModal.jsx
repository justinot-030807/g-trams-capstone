import React, { useEffect } from 'react';
import { Printer, X, Award, ShieldCheck, Calendar, CheckCircle2, Car, User, MapPin, Download } from 'lucide-react';

const MtopCertificateModal = ({ isOpen, onClose, unit }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('printing-mtop');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('printing-mtop');
      document.body.style.overflow = '';
    }
    return () => {
      document.body.classList.remove('printing-mtop');
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !unit) return null;

  const handlePrint = () => {
    document.body.classList.add('printing-mtop');
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

  const issueDate = unit.dateApplied ? formatDate(unit.dateApplied) : formatDate(new Date());
  const expiryDate = unit.dateApplied ? getExpirationDate(unit.dateApplied) : getExpirationDate(new Date());
  const mtopNumber = `MTOP-GASAN-${unit.plateNo || String(unit._id).slice(-6).toUpperCase()}`;

  return (
    <div 
      id="printable-mtop-modal-root" 
      className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md overflow-y-auto overscroll-contain flex flex-col items-center p-2 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto print:overflow-visible"
    >
      <div className="w-full max-w-[780px] my-auto sm:my-4 flex flex-col items-center shrink-0 pb-16 print:pb-0 print:max-w-full print:m-0">
        
        {/* Action Toolbar (Hidden during print) */}
        <div className="w-full bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-3 sm:p-3.5 mb-4 flex items-center justify-between text-white shadow-xl print:hidden sticky top-2 z-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
              <Award size={18} />
            </div>
            <div>
              <h3 className="font-black text-xs sm:text-sm tracking-wide flex items-center gap-2">
                Official MTOP Certificate Preview
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  unit.status === 'Active' 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                    : unit.status === 'Ready for Pickup'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {unit.status || 'Active Franchise'}
                </span>
              </h3>
              <p className="text-[10px] text-white/60">Municipality of Gasan &bull; Appendix C Format</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
              title="Save as PDF or print"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Save PDF /</span> Print
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-[#7A1B22] hover:bg-[#922029] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Printer size={14} />
              <span>Print MTOP</span>
            </button>

            <button
              onClick={onClose}
              className="text-white/60 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
              title="Close Preview (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Official Certificate Container */}
        <div 
          id="printable-mtop-certificate" 
          className="relative bg-[#FFFDF9] text-slate-900 w-full rounded-2xl shadow-2xl p-6 sm:p-10 md:p-12 border-4 sm:border-8 border-double border-[#7A1B22] overflow-hidden print:border-[4px] print:border-double print:border-[#7A1B22] print:shadow-none print:m-0 print:max-w-full print:p-6"
          style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
        >
          {/* Print Stylesheet */}
          <style>{`
            @media print {
              body.printing-mtop {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
              }
              body.printing-mtop * {
                visibility: hidden !important;
              }
              body.printing-mtop #printable-mtop-modal-root {
                position: static !important;
                display: block !important;
                background: transparent !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: visible !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
              }
              body.printing-mtop #printable-mtop-certificate,
              body.printing-mtop #printable-mtop-certificate * {
                visibility: visible !important;
              }
              body.printing-mtop #printable-mtop-certificate {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 24px 32px !important;
                box-shadow: none !important;
                background: #FFFDF9 !important;
                border: 4px double #7A1B22 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body.printing-mtop .print-hide,
              body.printing-mtop #printable-masterlist,
              body.printing-mtop #printable-document,
              body.printing-mtop header,
              body.printing-mtop nav {
                display: none !important;
                visibility: hidden !important;
              }
            }
          `}</style>

        {/* Municipal Seal Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
          <img src="/gasan-logo.png" alt="Watermark" className="w-[420px] h-[420px] object-contain grayscale" />
        </div>

        {/* Certificate Header */}
        <div className="text-center relative z-10 border-b-2 border-[#7A1B22]/30 pb-4 mb-5">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border border-[#D4AF37]">
              <img src="/gasan-logo.png" alt="Gasan Seal" className="w-full h-full object-cover" />
            </div>
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-widest text-slate-600 font-sans font-semibold">Republic of the Philippines</p>
              <p className="text-[11px] uppercase tracking-widest text-slate-600 font-sans font-semibold">Province of Marinduque</p>
              <h2 className="text-lg sm:text-xl font-black text-[#7A1B22] tracking-wider uppercase font-serif">MUNICIPALITY OF GASAN</h2>
              <p className="text-[10px] uppercase tracking-widest text-slate-700 font-sans font-bold">Office of the Municipal Vice Mayor / Sangguniang Bayan</p>
            </div>
            <div className="w-16 h-16 shrink-0 hidden sm:block">
              <img src="/gasan-logo.png" alt="Gasan Seal Right" className="w-full h-full object-cover opacity-80" />
            </div>
          </div>

          <div className="mt-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wide uppercase font-serif">
              MOTORIZED TRICYCLE OPERATOR'S PERMIT
            </h1>
            <p className="text-xs font-bold tracking-widest text-[#7A1B22] uppercase font-sans mt-0.5">
              MUNICIPAL (TRICYCLE) FRANCHISE
            </p>
            <div className="inline-block mt-2 px-3 py-1 bg-amber-50 border border-amber-300 rounded-lg text-xs font-mono font-bold text-[#7A1B22]">
              PERMIT NO: {mtopNumber}
            </div>
          </div>
        </div>

        {/* Grant Preamble */}
        <div className="relative z-10 text-xs sm:text-[13px] leading-relaxed text-slate-800 mb-4 text-justify">
          <p className="font-bold text-sm text-[#7A1B22] mb-1 font-serif">TO WHOM IT MAY CONCERN:</p>
          <p>
            Pursuant to the provisions of Section 447 (a)(3)(vi) of <strong>Republic Act No. 7160</strong> (Local Government Code of 1991), 
            and existing Municipal Ordinances and Franchising Regulations of the Municipality of Gasan, Marinduque, authority and permission is hereby granted to:
          </p>
        </div>

        {/* Grantee & Authorization Box */}
        <div className="relative z-10 bg-amber-50/40 border border-[#D4AF37]/50 rounded-xl p-3.5 mb-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <span className="text-[10px] font-sans font-bold text-slate-500 uppercase block">Name of Operator:</span>
              <span className="font-bold text-slate-900 text-sm">{unit.fullName?.toUpperCase()}</span>
            </div>
            <div>
              <span className="text-[10px] font-sans font-bold text-slate-500 uppercase block">Residential Address:</span>
              <span className="font-bold text-slate-800">{unit.address || 'Gasan, Marinduque'}</span>
            </div>
            <div>
              <span className="text-[10px] font-sans font-bold text-slate-500 uppercase block">Classification:</span>
              <span className="font-bold text-[#7A1B22]">{unit.applicationType === 'Renewal' ? 'RENEWAL' : 'NEW APPLICATION'}</span>
            </div>
            <div>
              <span className="text-[10px] font-sans font-bold text-slate-500 uppercase block">Authorized Route &amp; Zone:</span>
              <span className="font-bold text-slate-800">Zone {unit.zone} &bull; {unit.todaName || 'NON-TODA'}</span>
            </div>
          </div>
        </div>

        {/* Tricycle Technical Specifications */}
        <div className="relative z-10 mb-4">
          <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            AUTHORIZED MOTORIZED TRICYCLE UNIT SPECIFICATIONS:
          </p>
          <table className="w-full border-collapse border border-slate-300 text-xs text-left">
            <thead>
              <tr className="bg-slate-100/80 font-sans text-[10px] uppercase font-bold text-slate-700">
                <th className="border border-slate-300 p-2 text-center">Make / Brand</th>
                <th className="border border-slate-300 p-2 text-center">Year / Model</th>
                <th className="border border-slate-300 p-2 text-center">Motor Number</th>
                <th className="border border-slate-300 p-2 text-center">Chassis Number</th>
                <th className="border border-slate-300 p-2 text-center">Plate Number</th>
              </tr>
            </thead>
            <tbody>
              <tr className="font-mono text-center font-bold text-slate-800">
                <td className="border border-slate-300 p-2">{unit.make || 'N/A'}</td>
                <td className="border border-slate-300 p-2">{unit.made || 'N/A'}</td>
                <td className="border border-slate-300 p-2">{unit.motorNo || 'N/A'}</td>
                <td className="border border-slate-300 p-2">{unit.chassisNo || 'N/A'}</td>
                <td className="border border-slate-300 p-2 text-[#7A1B22] font-black">{unit.plateNo || 'PENDING'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Standard 7 Legal Terms and Conditions (Appendix C) */}
        <div className="relative z-10 mb-4 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
          <p className="text-[10px] font-sans font-black uppercase tracking-wider text-[#7A1B22] mb-1.5">
            TERMS AND CONDITIONS (APPENDIX C - MUNICIPAL FRANCHISE):
          </p>
          <ol className="list-decimal list-outside pl-4 space-y-1 text-[10px] sm:text-[11px] text-slate-700 leading-snug">
            <li>The operator and driver shall strictly comply with all national traffic laws, municipal ordinances, and road safety regulations promulgated by the Municipality of Gasan.</li>
            <li>This permit is strictly <strong>non-transferable</strong> and valid exclusively for the motorized tricycle unit specifically described herein.</li>
            <li>The unit shall operate strictly within its assigned <strong>authorized route and zone</strong> approved by the Sangguniang Bayan.</li>
            <li>The operator and designated driver shall charge only the authorized fare matrix prescribed by municipal ordinance and shall conspicuously display the fare schedule inside the passenger sidecar.</li>
            <li>The unit must maintain roadworthiness, safety equipment, functioning headlights, taillights, signal lights, and clean passenger accommodation at all times.</li>
            <li>Operation along national highways is strictly subject to the Tricycle Route Plan (TRP) and DOTr-DILG Joint Memorandum Circular 2020-036; travel is limited to authorized municipal intersection crossing points.</li>
            <li>Violation of any of the foregoing conditions, municipal ordinances, or terms of this franchise shall constitute sufficient grounds for the immediate suspension, fine, or revocation of this permit.</li>
          </ol>
        </div>

        {/* Validity and Grant Statement */}
        <div className="relative z-10 text-xs leading-relaxed text-slate-800 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-b border-slate-200 py-3">
          <div>
            <span className="text-[10px] font-sans font-bold text-slate-500 uppercase block">Effective Date:</span>
            <span className="font-bold text-slate-900">{issueDate}</span>
          </div>
          <div>
            <span className="text-[10px] font-sans font-bold text-slate-500 uppercase block">Validity Period:</span>
            <span className="font-bold text-emerald-800">One (1) Year Validity</span>
          </div>
          <div>
            <span className="text-[10px] font-sans font-bold text-slate-500 uppercase block">Expiration Date:</span>
            <span className="font-black text-[#7A1B22]">{expiryDate}</span>
          </div>
        </div>

        {/* Official Signatory Section */}
        <div className="relative z-10 pt-2 flex flex-col sm:flex-row items-end justify-between gap-6">
          <div className="text-left font-sans text-[10px] text-slate-500 space-y-1">
            <p>Certified Official Copy</p>
            <p>G-TRAMS Electronic Authentication</p>
            <p className="font-mono text-[9px]">DOC-ID: {String(unit._id).toUpperCase()}</p>
          </div>

          <div className="text-center sm:text-right">
            <p className="text-[10px] font-sans uppercase font-bold text-slate-600 mb-6">
              For and by Authority of the Sangguniang Bayan:
            </p>
            <div className="inline-block text-center border-t-2 border-slate-800 pt-1 min-w-[220px]">
              <p className="font-serif font-black text-sm text-slate-900 tracking-wide">
                HON. LIDANY A. LAO-BALDO
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
);
};

export default MtopCertificateModal;
