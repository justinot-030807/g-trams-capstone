import React, { useRef } from 'react';
import { Printer, FileText, CheckSquare, Square } from 'lucide-react';
import { formatZoneLabel } from '../../utils/constants';

/**
 * Official MTOP Application Form
 * Faithful 1:1 digital replica of the Municipality of Gasan official application form
 * pursuant to Municipal Ordinance No. 48 s. 1999 (from APPLICATION (1).xlsx).
 *
 * Features:
 * - Authentic high-resolution Gasan LGU & Sangguniang Bayan letterhead banner
 * - Authentic Sangguniang Bayan watermark
 * - Zero mock data: populated dynamically from live inputs or cleanly blank with underlines
 * - High-fidelity 1-page printable stylesheet for Long Bond Paper (8.5 x 13 in / Folio) & A4
 */
const OfficialApplicationForm = ({
  formData = {},
  isRenewal = false,
  onPrint = null,
  showActions = true,
  className = ''
}) => {
  const formRef = useRef(null);

  // Parse applicant full name into parts
  const fullName = String(formData.fullName || formData.name || formData.operatorName || '').trim();
  const nameParts = fullName ? fullName.split(' ') : [];
  const familyName = nameParts.length > 1 ? nameParts[nameParts.length - 1].toUpperCase() : (fullName.toUpperCase() || '');
  const givenName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ').toUpperCase() : (fullName.toUpperCase() || '');
  const middleName = formData.middleName ? formData.middleName.toUpperCase() : '';

  const zone = formData.zone ? formatZoneLabel(formData.zone).toUpperCase() : '';
  const address = String(formData.address || '').toUpperCase();
  const occupation = String(formData.occupation || (fullName ? 'TRICYCLE OPERATOR' : '')).toUpperCase();
  const make = String(formData.make || '').toUpperCase();
  const model = String(formData.made || formData.model || '').toUpperCase();
  const motorNo = String(formData.motorNo || '').toUpperCase();
  const chassisNo = String(formData.chassisNo || '').toUpperCase();
  const plateNo = String(formData.plateNo || '').toUpperCase();
  const scNo = String(formData.scNo || formData.sidecarNo || '').toUpperCase();
  const cedulaNo = String(formData.cedulaNo || formData.ctcNo || formData.cedulaSerialNo || '');
  const cedulaDate = formData.cedulaDate || formData.cedulaIssueDate || formData.dateIssued || '';
  const ctcPlace = String(formData.ctcPlace || formData.cedulaAddress || formData.placeIssued || (fullName ? 'GASAN, MARINDUQUE' : '')).toUpperCase();
  
  const today = new Date();
  const currentDate = fullName ? today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

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
        <div className="w-full max-w-[780px] bg-[#1F1D1B] dark:bg-[#1C1917] border border-[#E4E1DC]/20 dark:border-[#2E2A27] rounded-xl p-3 mb-4 flex items-center justify-between text-white shadow-md print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#9E2A2B] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              <FileText size={17} />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black tracking-wide text-white uppercase flex items-center gap-2">
                Official MTOP Application Form
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ord. No. 48 s. 1999
                </span>
              </h4>
              <p className="text-[10px] sm:text-xs text-white/60">
                Official document format for Sangguniang Bayan &amp; Municipal Mayor filing
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-[#9E2A2B] hover:bg-[#851e20] active:scale-95 text-white px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
            title="Print or Save Application Form as PDF"
          >
            <Printer size={15} />
            <span className="hidden sm:inline">Print / Save as PDF</span>
            <span className="sm:hidden">Print PDF</span>
          </button>
        </div>
      )}

      {/* Printable Sheet Container */}
      <div className="w-full max-w-[780px] overflow-x-auto pb-4 custom-scrollbar flex justify-start sm:justify-center">
        <div
          ref={formRef}
          id="printable-application-form"
          className="relative bg-white text-slate-900 w-[720px] sm:w-full max-w-[760px] min-h-[960px] flex flex-col justify-between shrink-0 rounded-lg shadow-lg p-6 sm:p-8 md:p-9 border-2 border-slate-300 overflow-hidden print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-full"
          style={{ fontFamily: "'Times New Roman', Times, serif" }}
        >
          {/* Print Stylesheet for exact 1-page fit on Folio/Long Bond Paper */}
          <style>{`
            @media print {
              @page {
                size: 8.5in 13in;
                margin: 8mm 10mm;
              }
              body * {
                visibility: hidden !important;
              }
              #printable-application-form,
              #printable-application-form * {
                visibility: visible !important;
              }
              #printable-application-form {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                min-height: auto !important;
                padding: 0 !important;
                margin: 0 !important;
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
              className="w-[440px] h-[440px] object-contain" 
            />
          </div>

          {/* Form Header */}
          <div className="relative z-10">
            {/* Authentic Municipal Banner */}
            <div className="w-full mb-2">
              <img 
                src="/excel_assets/header_banner.png" 
                alt="Municipality of Gasan - Office of the Municipal Vice Mayor" 
                className="w-full h-auto object-contain"
              />
            </div>

            {/* Document Title */}
            <div className="text-center pt-1 pb-2">
              <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-wide uppercase font-serif">
                APPLICATION FOR MOTORIZED TRICYCLE OPERATOR’S PERMIT
              </h1>
              <p className="text-[10px] italic text-slate-600 font-sans">
                Pursuant to Municipal Ordinance No. 48 s. 1999
              </p>
            </div>

            {/* Applicant Details Grid */}
            <div className="border border-slate-800 text-[11px] sm:text-xs divide-y divide-slate-800 mb-2.5">
              {/* Row 1: Applicant Name */}
              <div className="grid grid-cols-12 divide-x divide-slate-800 p-1.5 bg-slate-50/50">
                <div className="col-span-3 font-bold text-slate-700 font-sans flex items-center">
                  Name of Applicant:
                </div>
                <div className="col-span-9 grid grid-cols-3 divide-x divide-slate-400 pl-2">
                  <div className="pr-2">
                    <span className="text-[9px] uppercase font-sans text-slate-500 block">Family Name:</span>
                    <span className="font-bold text-slate-900">{familyName || '__________________'}</span>
                  </div>
                  <div className="px-2">
                    <span className="text-[9px] uppercase font-sans text-slate-500 block">Given Name:</span>
                    <span className="font-bold text-slate-900">{givenName || '__________________'}</span>
                  </div>
                  <div className="pl-2">
                    <span className="text-[9px] uppercase font-sans text-slate-500 block">Middle Name:</span>
                    <span className="font-bold text-slate-900">{middleName || '__________________'}</span>
                  </div>
                </div>
              </div>

              {/* Row 2: Zone & Type */}
              <div className="grid grid-cols-12 divide-x divide-slate-800 p-1.5">
                <div className="col-span-3 font-bold text-slate-700 font-sans flex items-center">
                  Zone Applied For:
                </div>
                <div className="col-span-4 pl-2 font-black text-slate-900 flex items-center">
                  {zone ? `${zone} ZONE` : '______________________'}
                </div>
                <div className="col-span-5 flex items-center justify-around pl-2 font-sans font-bold">
                  <span className="inline-flex items-center gap-1.5">
                    {!isRenewal && fullName ? <CheckSquare size={13} className="text-slate-900" /> : <Square size={13} className="text-slate-400" />}
                    <span>New</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    {isRenewal ? <CheckSquare size={13} className="text-slate-900" /> : <Square size={13} className="text-slate-400" />}
                    <span>Renewal</span>
                  </span>
                </div>
              </div>

              {/* Row 3: Address */}
              <div className="grid grid-cols-12 divide-x divide-slate-800 p-1.5 bg-slate-50/50">
                <div className="col-span-3 font-bold text-slate-700 font-sans flex items-center">
                  Address:
                </div>
                <div className="col-span-9 pl-2 font-bold text-slate-900">
                  {address || 'Brgy. ________________________, Gasan, Marinduque'}
                </div>
              </div>

              {/* Row 4: Primary Occupation & Ownership */}
              <div className="grid grid-cols-12 divide-x divide-slate-800 p-1.5">
                <div className="col-span-3 font-bold text-slate-700 font-sans flex items-center">
                  Primary Occupation:
                </div>
                <div className="col-span-4 pl-2 font-bold text-slate-900">
                  {occupation || '________________________'}
                </div>
                <div className="col-span-5 pl-2 font-sans">
                  <span className="text-[9px] uppercase text-slate-500 block">Type of Ownership:</span>
                  <div className="flex items-center gap-3 font-bold text-[10.5px] mt-0.5">
                    <span className="inline-flex items-center gap-1">
                      {fullName ? <CheckSquare size={12} /> : <Square size={12} className="text-slate-400" />} Single Proprietor
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-400">
                      <Square size={12} /> Partnership
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-400">
                      <Square size={12} /> Cooperative
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 5: Citizenship & Number of Units */}
              <div className="grid grid-cols-12 divide-x divide-slate-800 p-1.5 bg-slate-50/50">
                <div className="col-span-3 font-bold text-slate-700 font-sans flex items-center">
                  Citizenship:
                </div>
                <div className="col-span-4 pl-2 font-bold text-slate-900">
                  FILIPINO
                </div>
                <div className="col-span-5 pl-2 font-sans font-bold text-slate-900">
                  Number of Units Applied for: <span className="underline ml-1">One (1) Unit</span>
                </div>
              </div>
            </div>

            {/* Tricycle Unit Specifications Table */}
            <div className="mb-2.5">
              <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-700 mb-1">
                Motorized Tricycle Unit Details:
              </p>
              <table className="w-full border-collapse border border-slate-800 text-[11px] text-center">
                <thead>
                  <tr className="bg-slate-200/90 font-sans text-[10px] uppercase font-bold text-slate-800 border-b border-slate-800">
                    <th className="border-r border-slate-800 py-1 px-2">Make</th>
                    <th className="border-r border-slate-800 py-1 px-2">Model (Year)</th>
                    <th className="border-r border-slate-800 py-1 px-2">Motor Number</th>
                    <th className="border-r border-slate-800 py-1 px-2">Chassis Number</th>
                    <th className="border-r border-slate-800 py-1 px-2">Plate No.</th>
                    <th className="py-1 px-2">SC No.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="font-mono font-bold text-slate-900">
                    <td className="border-r border-slate-800 py-1 px-2">{make || '—'}</td>
                    <td className="border-r border-slate-800 py-1 px-2">{model || '—'}</td>
                    <td className="border-r border-slate-800 py-1 px-2 break-all">{motorNo || '—'}</td>
                    <td className="border-r border-slate-800 py-1 px-2 break-all">{chassisNo || '—'}</td>
                    <td className="border-r border-slate-800 py-1 px-2 text-[#9E2A2B] font-black">{plateNo || '—'}</td>
                    <td className="py-1 px-2">{scNo || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Legal Pledge / Certification Statement */}
            <div className="text-[10px] sm:text-[10.5px] leading-snug text-justify text-slate-800 mb-2.5 bg-amber-50/40 p-2.5 border border-amber-200 rounded">
              <p className="indent-6 font-serif">
                I hereby certify that all the Information given above, as well as the information contained in the attachments to this application, are true and correct. I acknowledge also that any false statement given on my part may be ground for the disapproval of this application and/or revocation of the Provisional Authority that may be granted.
              </p>
            </div>

            {/* 7 Statutory Requirements (Municipal Ordinance No. 48 s. 1999) */}
            <div className="border border-slate-700 p-2.5 mb-2.5 bg-slate-50/60 text-[9.5px] sm:text-[10px] leading-tight text-slate-800">
              <p className="font-sans font-bold text-slate-900 uppercase tracking-wide mb-1">
                In compliance with Municipal Ordinance No. 48 s. 1999, I hereby attach the following documents:
              </p>
              <ol className="list-decimal pl-5 space-y-0.5">
                <li>Birth certificate or Voter’s ID or Affidavit of two (2) disinterested persons attesting that applicant is a Filipino Citizen, or Mayor’s / Barangay Captain’s Certification;</li>
                <li>L.T.O. Certificate of Registration (CR) and latest Official Receipt (OR) of Payment of Registration or Affidavit of Ownership;</li>
                <li>Barangay or Police Clearance;</li>
                <li>Medical Certificate and Police Clearance (Driver);</li>
                <li>Driver’s License;</li>
                <li>Certificate of Insurance Coverage – Tricycle; and</li>
                <li>MPDC Certificate – Tricycle is Road Worthy.</li>
              </ol>
            </div>
          </div>

          {/* Bottom Section: Applicant Signature & Notary Block */}
          <div className="relative z-10 pt-1">
            {/* Applicant Signature Line */}
            <div className="flex justify-between items-end mb-3 pt-1">
              <div className="text-[10px] font-sans text-slate-600">
                <p>Municipality of Gasan, Marinduque</p>
                <p>Date Filed: <span className="font-mono font-bold text-slate-900">{currentDate || '___________________'}</span></p>
              </div>
              <div className="text-center min-w-[220px]">
                <div className="border-b border-slate-900 pb-1 mb-0.5">
                  <span className="font-bold text-xs sm:text-sm text-slate-900 uppercase">
                    {fullName || '_________________________________'}
                  </span>
                </div>
                <span className="text-[9px] font-sans font-bold uppercase text-slate-600 block">
                  Signature of Applicant
                </span>
              </div>
            </div>

            {/* Subscribed and Sworn (Jurat Block) */}
            <div className="border-t-2 border-slate-800 pt-2 text-[10px] leading-tight text-slate-800">
              <p className="text-justify mb-2">
                SUBSCRIBED AND SWORN to before me this _____ day of ________________, 202___ at Gasan, Marinduque with Community Tax Certificate No. <strong className="underline font-mono">{cedulaNo || '_________________'}</strong> issued on <strong className="underline font-mono">{cedulaDate || '_____________'}</strong> at <strong className="underline">{ctcPlace || 'Gasan, Marinduque'}</strong>.
              </p>

              <div className="flex justify-end pt-1">
                <div className="text-center min-w-[240px]">
                  <p className="font-serif font-black text-xs sm:text-sm text-slate-900 tracking-wide">
                    HON. JAMES MARTY L. LIM
                  </p>
                  <p className="text-[9px] font-sans uppercase font-bold text-slate-700">
                    MUNICIPAL MAYOR
                  </p>
                  <p className="text-[8.5px] font-sans text-slate-500 italic">
                    Administering Officer / Notary Public
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OfficialApplicationForm;
