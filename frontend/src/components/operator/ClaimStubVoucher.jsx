import React from 'react';
import { FileText, Download, X, Printer, CheckCircle2, ShieldCheck, Calendar, User, MapPin, Hash, AlertCircle } from 'lucide-react';

const ClaimStubVoucher = ({ isOpen, onClose, unit, systemFranchiseFee = '500' }) => {
  if (!isOpen || !unit) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDateApproved = unit?.updatedAt 
    ? new Date(unit.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const refNumber = `GTRAMS-${String(unit?._id || '').slice(-8).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex flex-col justify-start items-center p-2 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      
      {/* Action Toolbar (Hidden during print) */}
      <div className="w-full max-w-[620px] bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 mb-4 flex items-center justify-between text-white shadow-xl print:hidden sticky top-2 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
            <FileText size={16} />
          </div>
          <div>
            <h3 className="font-black text-xs sm:text-sm tracking-wide">Official Franchise Claim Stub</h3>
            <p className="text-[10px] text-white/60">Digital Voucher &bull; Payment Required</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-[#7A1B22] hover:bg-[#922029] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Printer size={14} />
            <span>Print / Save PDF</span>
          </button>

          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Boarding Pass / Voucher Container */}
      <div 
        id="printable-document" 
        className="relative bg-white text-slate-900 w-full max-w-[620px] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:m-0 print:max-w-full"
      >
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#7A1B22] via-[#8E2028] to-[#5A1419] p-6 text-white text-center relative border-b-4 border-[#D4AF37]">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white rounded-full p-0.5 shadow-md flex items-center justify-center overflow-hidden shrink-0">
              <img src="/gasan-logo.png" alt="Gasan Official Seal" className="w-full h-full object-cover scale-105" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black tracking-widest text-[#D4AF37] uppercase">MUNICIPALITY OF GASAN &bull; MARINDUQUE</p>
              <h1 className="text-base sm:text-lg font-black tracking-wider uppercase">BPLO &amp; FRANCHISING REGULATORY BOARD</h1>
              <p className="text-[9px] text-white/80 uppercase font-semibold">Tricycle Regulation &amp; Management System (G-TRAMS)</p>
            </div>
          </div>

          <div className="mt-3 inline-block bg-white/10 backdrop-blur-md px-4 py-1 rounded-full border border-white/20 text-[10px] font-black tracking-widest text-white uppercase">
            Official Franchise Claim Voucher
          </div>
        </div>

        {/* Voucher Top Body: Amount & Reference */}
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Voucher Reference No.</p>
              <p className="text-sm sm:text-base font-black font-mono text-[#7A1B22] tracking-wider">{refNumber}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Approved: <strong>{formattedDateApproved}</strong></p>
            </div>

            <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4 w-full sm:w-auto">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Amount Payable</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">₱{parseFloat(systemFranchiseFee).toFixed(2)}</p>
              <span className="inline-block text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full mt-0.5">
                Payable at Municipal Cashier
              </span>
            </div>
          </div>
        </div>

        {/* Perforated Ticket Divider with Side Semicircular Notches */}
        <div className="relative h-6 bg-slate-50 flex items-center">
          <div className="absolute -left-3 w-6 h-6 bg-slate-950 rounded-full border-r border-slate-200 print:hidden" />
          <div className="w-full border-t-2 border-dashed border-slate-300" />
          <div className="absolute -right-3 w-6 h-6 bg-slate-950 rounded-full border-l border-slate-200 print:hidden" />
        </div>

        {/* Voucher Lower Body: Two-Column Metadata */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            
            {/* Operator Information */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-2.5">
              <p className="text-[10px] font-black text-[#7A1B22] uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-200">
                <User size={12} /> Operator Information
              </p>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Registered Operator</span>
                <span className="font-bold text-slate-900 uppercase text-xs sm:text-sm">{unit?.fullName}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Barangay Address</span>
                <span className="font-semibold text-slate-800">{unit?.address || 'Gasan, Marinduque'}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">TODA Association</span>
                <span className="font-black text-[#7A1B22] bg-[#7A1B22]/10 px-2 py-0.5 rounded-md inline-block mt-0.5">
                  {unit?.todaName || 'NON-TODA'}
                </span>
              </div>
            </div>

            {/* Vehicle & Permit Specifications */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-2.5">
              <p className="text-[10px] font-black text-[#7A1B22] uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-200">
                <ShieldCheck size={12} /> Unit Specifications
              </p>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Plate / Temp Number</span>
                <span className="font-black text-slate-900 text-xs sm:text-sm tracking-wider">{unit?.plateNo || 'PENDING PLATE'}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Make &amp; Model</span>
                  <span className="font-semibold text-slate-800">{unit?.make} ({unit?.made})</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Route Zone</span>
                  <span className="font-semibold text-slate-800">{unit?.zone || 'Zone 1'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Motor Number</span>
                  <span className="font-mono text-[11px] font-bold text-slate-700">{unit?.motorNo}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Application Type</span>
                  <span className="font-bold text-slate-800 uppercase">{unit?.applicationType || 'New'}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Checklist: What to Bring to the Municipal Hall */}
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4">
            <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <AlertCircle size={14} className="text-amber-600" />
              Mga Dadalhin sa Munisipyo ng Gasan (Checklist)
            </h4>

            <ul className="space-y-1.5 text-[11px] text-amber-950 font-medium">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>1. Itong Claim Stub Voucher:</strong> Ipakita sa iyong cellphone o magdala ng naka-print na kopya.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>2. Valid Government ID o Driver's License:</strong> Para sa kumpirmasyon ng pagkakakilanlan.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>3. Eksaktong Bayad (₱{parseFloat(systemFranchiseFee).toFixed(2)}):</strong> Direktang ibabayad sa Municipal Cashier.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>4. Tricycle Unit:</strong> Para sa physical stenciling at pagkakabit ng opisyal na MTOP sticker.</span>
              </li>
            </ul>
          </div>

          {/* Official Authorization Seal Footer */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            <span>OFFICIAL DOCUMENT &bull; LGU GASAN BPLO</span>
            <span>NO BARCODE REQUIRED &bull; DIGITAL COPY VALID</span>
          </div>

        </div>

      </div>

    </div>
  );
};

export default ClaimStubVoucher;
