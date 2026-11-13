import React, { useRef, useState } from 'react';
import { Printer, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { downloadOriginalLguTemplate } from '../../utils/downloadOriginalLguTemplate';
import { cleanText, formatVehicleMake, formatVehicleModelYear } from '../../utils/vehicleFormatters';

/**
 * Official MTOP Application Form (1:1 Original Gasan LGU Template)
 * Exact cell-by-cell replica of Municipality of Gasan's APPLICATION.xlsx (Sheet FORM)
 * pursuant to Municipal Ordinance No. 48 s. 1999.
 */
const OfficialApplicationForm = ({
  formData = {},
  isRenewal = false,
  onPrint = null,
  showActions = true,
  className = ''
}) => {
  const formRef = useRef(null);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

  // Parse applicant full name into Family Name, Given Name, Middle Name
  const fullName = String(
    formData.fullName ||
    formData.ownerName ||
    formData.name ||
    formData.operatorName ||
    (formData.firstName ? `${formData.firstName} ${formData.middleName || ''} ${formData.lastName || ''}` : '')
  ).replace(/\s+/g, ' ').trim();

  let familyName = String(formData.lastName || formData.familyName || '').toUpperCase().trim();
  let givenName = String(formData.firstName || formData.givenName || '').toUpperCase().trim();
  let middleName = String(formData.middleName || '').toUpperCase().trim();

  if (!familyName && !givenName && fullName) {
    const parts = fullName.toUpperCase().split(' ').filter(Boolean);
    if (parts.length === 1) {
      familyName = parts[0];
    } else if (parts.length === 2) {
      givenName = parts[0];
      familyName = parts[1];
    } else {
      const midCandidate = parts[parts.length - 2];
      givenName = parts.slice(0, -2).join(' ');
      middleName = midCandidate.replace(/\./g, '');
      familyName = parts[parts.length - 1];
    }
  }

  const rawZone = String(formData.zone || formData.todaZone || '').toUpperCase().replace(/\s*ZONE.*$/i, '').trim();
  const rawAddress = String(formData.barangay || formData.address || '')
    .toUpperCase()
    .replace(/^BRGY\.?\s*/i, 'BRGY. ')
    .replace(/,?\s*GASAN.*$/i, '')
    .trim();

  const occupation = cleanText(formData.occupation || (fullName ? 'TRICYCLE OPERATOR' : ''), '').toUpperCase();
  const make = formatVehicleMake(formData, '').toUpperCase();
  const model = formatVehicleModelYear(formData, '').toUpperCase();
  const motorNo = cleanText(formData.motorNo || formData.motorNumber || formData.engineNumber, '').toUpperCase();
  const chassisNo = cleanText(formData.chassisNo || formData.chassisNumber, '').toUpperCase();
  const plateNo = cleanText(formData.plateNo || formData.plateNumber, '').toUpperCase();
  const scNo = cleanText(formData.scNo || formData.sidecarNo || formData.sidecarNumber || formData.bodyNumber, '').toUpperCase();

  const cedulaNo = String(formData.cedulaNo || formData.ctcNo || formData.ctcNumber || formData.cedulaSerialNo || '').trim();
  const rawDateFiled = formData.dateApplied || formData.createdAt || (fullName ? new Date().toISOString() : '');
  const filedDateObj = rawDateFiled ? new Date(rawDateFiled) : null;
  const isValidFiledDate = filedDateObj && !isNaN(filedDateObj.getTime());

  const formatShortDate = (dInput) => {
    if (!dInput) return '';
    const d = new Date(dInput);
    if (isNaN(d.getTime())) return String(dInput);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  };

  const getOrdinalDay = (d) => {
    if (!d || isNaN(d.getTime())) return '';
    const day = d.getDate();
    if (day % 10 === 1 && day !== 11) return `${day}st`;
    if (day % 10 === 2 && day !== 12) return `${day}nd`;
    if (day % 10 === 3 && day !== 13) return `${day}rd`;
    return `${day}th`;
  };

  const dateFiledStr = isValidFiledDate ? formatShortDate(filedDateObj) : '';
  const swornDay = isValidFiledDate ? getOrdinalDay(filedDateObj) : '';
  const swornMonth = isValidFiledDate
    ? filedDateObj.toLocaleDateString('en-US', { month: 'long' }).toUpperCase()
    : '';
  const swornYear = isValidFiledDate ? String(filedDateObj.getFullYear()) : '';

  const ctcDateRaw = formData.cedulaDate || formData.cedulaIssueDate || formData.ctcDateIssued || formData.dateIssued || '';
  const ctcDateStr = ctcDateRaw ? formatShortDate(ctcDateRaw) : (isValidFiledDate ? dateFiledStr : '');

  const effectiveIsRenewal =
    isRenewal || String(formData.applicationType || '').toLowerCase() === 'renewal';

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    window.print();
  };

  const handleDownloadExcel = async () => {
    if (isDownloadingExcel) return;
    setIsDownloadingExcel(true);
    try {
      await downloadOriginalLguTemplate({
        franchise: {
          ...formData,
          _id: formData._id || formData.id,
          ownerName: fullName,
          firstName: givenName,
          middleName,
          lastName: familyName,
          applicationType: effectiveIsRenewal ? 'Renewal' : 'New',
          zone: rawZone,
          barangay: rawAddress,
          occupation,
          make,
          yearModel: model,
          motorNumber: motorNo,
          chassisNumber: chassisNo,
          plateNumber: plateNo,
          sidecarNumber: scNo,
          ctcNumber: cedulaNo,
          ctcDateIssued: ctcDateRaw || rawDateFiled,
          createdAt: rawDateFiled,
        },
        type: 'application',
      });
    } catch (err) {
      console.error('Error downloading original Application Form Excel:', err);
      alert('Could not download Excel file. Please try again.');
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  return (
    <div className={`w-full flex flex-col items-center ${className}`}>
      {/* Top Action Toolbar (Hidden during print) */}
      {showActions && (
        <div className="w-full max-w-[820px] bg-[#1F1D1B] dark:bg-[#1C1917] border border-[#E4E1DC]/20 dark:border-[#2E2A27] rounded-xl p-3 mb-4 flex flex-wrap items-center justify-between gap-2 text-white shadow-md print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#9E2A2B] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              <FileText size={17} />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black tracking-wide text-white uppercase flex items-center gap-2">
                Official MTOP Application Form (1:1 LGU Template)
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ord. No. 48 s. 1999
                </span>
              </h4>
              <p className="text-[10px] sm:text-xs text-white/60">
                Municipality of Gasan • Exact `APPLICATION.xlsx` Layout
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadExcel}
              disabled={isDownloadingExcel}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer shrink-0"
              title="Download populated original Gasan LGU Application Form (.xlsx)"
            >
              {isDownloadingExcel ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
              <span className="hidden sm:inline">Original Excel (.xlsx)</span>
              <span className="sm:hidden">.XLSX</span>
            </button>

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
        </div>
      )}

      {/* Printable Sheet Container */}
      <div className="w-full max-w-[820px] overflow-x-auto pb-4 custom-scrollbar flex justify-start sm:justify-center">
        <div
          ref={formRef}
          id="printable-application-form"
          className="relative bg-white text-black w-[794px] min-h-[1123px] shrink-0 shadow-2xl px-[40px] pt-[16px] pb-[28px] box-border select-text overflow-hidden print:shadow-none print:m-0"
          style={{ fontFamily: "'Arial', 'Helvetica', sans-serif", fontSize: '11.5pt', lineHeight: '1.25' }}
        >
          {/* Print Stylesheet for exact 1-page fit on Folio/Long Bond Paper */}
          <style>{`
            @media print {
              @page {
                size: 8.5in 13in;
                margin: 0;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
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
                width: 210mm !important;
                max-width: 210mm !important;
                min-height: 310mm !important;
                padding: 14px 34px 24px 34px !important;
                margin: 0 auto !important;
                border: none !important;
                box-shadow: none !important;
                background: white !important;
                color: black !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          `}</style>

          {/* Authentic Full-Page Seal Watermark (matching vmlDrawing1.vml in APPLICATION.xlsx) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.14] pointer-events-none select-none z-0">
            <img
              src="/excel_assets/doc_image2.png"
              alt="Sangguniang Bayan Seal Watermark"
              className="w-[540px] h-[540px] object-contain"
            />
          </div>

          <div className="relative z-10">
            {/* Rows 1–7: Official Header Banner Image */}
            <div className="w-full mb-2">
              <img
                src="/excel_assets/header_banner.png"
                alt="Municipality of Gasan - Office of the Sangguniang Bayan"
                className="w-full h-auto object-contain block"
              />
            </div>

            {/* Row 8: Title (Bookman Old Style 12pt Bold, Centered) */}
            <div
              className="text-center font-bold uppercase mb-4"
              style={{ fontFamily: "'Bookman Old Style', 'Georgia', 'Times New Roman', serif", fontSize: '12pt' }}
            >
              APPLICATION FOR MOTORIZED TRICYCLE OPERATOR’S PERMIT
            </div>

            {/* Row 10–11: Name of Applicant: [Family Name] [Given Name] [Middle Name] */}
            <div className="w-full mb-2">
              <div className="flex items-end w-full">
                <div className="w-[148px] shrink-0">Name of Applicant:</div>
                <div className="flex-1 grid grid-cols-3 gap-x-2">
                  <div className="font-bold border-b border-black text-center uppercase pb-[1px] truncate">
                    {familyName || '\u00A0'}
                  </div>
                  <div className="font-bold border-b border-black text-center uppercase pb-[1px] truncate">
                    {givenName || '\u00A0'}
                  </div>
                  <div className="font-bold border-b border-black text-center uppercase pb-[1px] truncate">
                    {middleName || '\u00A0'}
                  </div>
                </div>
              </div>
              <div className="flex w-full text-[11pt] mt-0.5">
                <div className="w-[148px] shrink-0" />
                <div className="flex-1 grid grid-cols-3 gap-x-2 text-center">
                  <div>(Family Name)</div>
                  <div>(Given Name)</div>
                  <div>(Middle Name)</div>
                </div>
              </div>
            </div>

            {/* Row 13: Zone Applied For: [C13:D13] | New [I13] Renewal [K13] */}
            <div className="flex items-end w-full mb-2">
              <div className="w-[148px] shrink-0">Zone Applied For:</div>
              <div className="w-[155px] shrink-0 font-bold border-b border-black text-center uppercase pb-[1px]">
                {rawZone || '\u00A0'}
              </div>
              <div className="flex-1" />
              <div className="w-[46px] shrink-0 text-right pr-1.5">New</div>
              <div className="w-[42px] shrink-0 border-b border-black text-center font-bold pb-[1px]">
                {!effectiveIsRenewal && fullName ? '/' : '\u00A0'}
              </div>
              <div className="w-[74px] shrink-0 text-right pr-1.5">Renewal</div>
              <div className="w-[42px] shrink-0 border-b border-black text-center font-bold pb-[1px]">
                {effectiveIsRenewal ? '/' : '\u00A0'}
              </div>
            </div>

            {/* Row 14–15: Address: [Barangay] [GASAN] [MARINDUQUE] */}
            <div className="w-full mb-2">
              <div className="flex items-end w-full">
                <div className="w-[82px] shrink-0">Address:</div>
                <div className="flex-1 grid grid-cols-[1.35fr_1fr_1fr] gap-x-2">
                  <div className="font-bold border-b border-black text-center uppercase pb-[1px] truncate">
                    {rawAddress || '\u00A0'}
                  </div>
                  <div className="font-bold border-b border-black text-center uppercase pb-[1px]">
                    GASAN
                  </div>
                  <div className="font-bold border-b border-black text-center uppercase pb-[1px]">
                    MARINDUQUE
                  </div>
                </div>
              </div>
              <div className="flex w-full text-[11pt] mt-0.5">
                <div className="w-[82px] shrink-0" />
                <div className="flex-1 grid grid-cols-[1.35fr_1fr_1fr] gap-x-2 text-center">
                  <div>(Barangay)</div>
                  <div>Municipality</div>
                  <div>(Province)</div>
                </div>
              </div>
            </div>

            {/* Row 16–17: Primary Occupation */}
            <div className="w-full mb-2">
              <div className="flex items-end w-full">
                <div className="w-[155px] shrink-0">Primary Occupation:</div>
                <div className="flex-1 font-bold border-b border-black pl-2 pb-[1px] uppercase truncate">
                  {occupation || '\u00A0'}
                </div>
              </div>
              <div className="flex w-full text-[10.5pt] mt-0.5">
                <div className="w-[155px] shrink-0" />
                <div className="flex-1 pl-2">(If employed, state employer's name and address)</div>
              </div>
            </div>

            {/* Rows 18–21: Citizenship & Number of Units (Left) | Type of Ownership (Right) */}
            <div className="w-full mb-3 space-y-0.5">
              {/* Row 18 */}
              <div className="flex items-center justify-between w-full">
                <div>Citizenship: FILIPINO</div>
                <div className="w-[260px] font-bold">Type of Ownership:</div>
              </div>
              {/* Row 19 */}
              <div className="flex items-end justify-between w-full">
                <div />
                <div className="w-[260px] flex items-end">
                  <div className="w-[155px] text-right pr-2">Single Proprietor:</div>
                  <div className="w-[54px] border-b border-black text-center font-bold pb-[1px]">
                    {fullName ? '/' : '\u00A0'}
                  </div>
                </div>
              </div>
              {/* Row 20 */}
              <div className="flex items-end justify-between w-full">
                <div>Number of units</div>
                <div className="w-[260px] flex items-end">
                  <div className="w-[155px] text-right pr-2">Partnership:</div>
                  <div className="w-[54px] border-b border-black text-center pb-[1px]">&nbsp;</div>
                </div>
              </div>
              {/* Row 21 */}
              <div className="flex items-end justify-between w-full">
                <div className="flex items-end">
                  <div className="w-[148px] pl-8">Applied for:</div>
                  <div className="w-[145px] border-b border-black text-center pb-[1px]">
                    One (1) unit
                  </div>
                </div>
                <div className="w-[260px] flex items-end">
                  <div className="w-[155px] text-right pr-2">Cooperative:</div>
                  <div className="w-[54px] border-b border-black text-center pb-[1px]">&nbsp;</div>
                </div>
              </div>
            </div>

            {/* Rows 23–25: 3-Row Bordered Vehicle Specifications Table (A23:K25) */}
            <div className="w-full mb-3">
              <table className="w-full border-collapse border border-black text-[11pt] text-center">
                <thead>
                  <tr className="font-bold">
                    <th className="border border-black py-1 px-1.5 w-[18%]">Make</th>
                    <th className="border border-black py-1 px-1.5 w-[11%]">Model</th>
                    <th className="border border-black py-1 px-1.5 w-[24%]">Motor Number</th>
                    <th className="border border-black py-1 px-1.5 w-[24%]">Chassis Number</th>
                    <th className="border border-black py-1 px-1.5 w-[12%]">Plate No.</th>
                    <th className="border border-black py-1 px-1.5 w-[11%]">SCNo.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="h-[24px]">
                    <td className="border border-black py-0.5 px-1.5 uppercase">{make || '\u00A0'}</td>
                    <td className="border border-black py-0.5 px-1.5 uppercase">{model || '\u00A0'}</td>
                    <td className="border border-black py-0.5 px-1.5 uppercase">{motorNo || '\u00A0'}</td>
                    <td className="border border-black py-0.5 px-1.5 uppercase">{chassisNo || '\u00A0'}</td>
                    <td className="border border-black py-0.5 px-1.5 uppercase">{plateNo || '\u00A0'}</td>
                    <td className="border border-black py-0.5 px-1.5 uppercase">{scNo || '\u00A0'}</td>
                  </tr>
                  <tr className="h-[24px]">
                    <td className="border border-black py-0.5 px-1.5">&nbsp;</td>
                    <td className="border border-black py-0.5 px-1.5">&nbsp;</td>
                    <td className="border border-black py-0.5 px-1.5">&nbsp;</td>
                    <td className="border border-black py-0.5 px-1.5">&nbsp;</td>
                    <td className="border border-black py-0.5 px-1.5">&nbsp;</td>
                    <td className="border border-black py-0.5 px-1.5">&nbsp;</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Row 27: Plain Text Certification & 7 Attached Documents (A27:K27, no background or box) */}
            <div className="text-[11pt] leading-[1.3] text-justify mb-4">
              <p className="indent-14 mb-2.5">
                I hereby certify that all the Information given above, as well as the information contained in the attachments to this application, are true and correct. I acknowledge also that any false statement given on my part may be ground for the disapproval of this application and/or revocation of the Provisional Authority that may be granted.
              </p>
              <p className="indent-14 mb-1.5">
                In compliance with Municipal Ordinance No. 48 s. 1999, I hereby attached the following documents:
              </p>
              <div className="pl-10 space-y-0.5">
                <div className="flex items-start gap-2.5">
                  <span className="shrink-0">1.</span>
                  <p>
                    Birth certificate or Voter’s ID or Affidavit of two (2) disinterested person attesting that applicant is a Filipino Citizen, or Mayor’s /Barangay Captain’s Certification;
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="shrink-0">2.</span>
                  <p>
                    L.T.O. Certificate of Registration and latest Official Receipt of Payment of Registration or Affidavit of Ownership received by an application;
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="shrink-0">3.</span>
                  <p>Barangay or Police Clearance;</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="shrink-0">4.</span>
                  <p>Medical Certificate and Police Clearance (Driver);</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="shrink-0">5.</span>
                  <p>Driver’s License;</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="shrink-0">6.</span>
                  <p>Certificate of Insurance Coverage – Tricycle; and</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="shrink-0">7.</span>
                  <p>MPDC Certificate – Tricycle is Road Worthy.</p>
                </div>
              </div>
            </div>

            {/* Row 29: Gasan, Marinduque (A29:C29) | [Date] (H29:K29) */}
            <div className="flex items-end justify-between w-full mb-4">
              <div className="w-[240px] text-center">Gasan, Marinduque</div>
              <div className="w-[250px] font-bold border-b border-black text-center pb-[1px]">
                {dateFiledStr || '\u00A0'}
              </div>
            </div>

            {/* Rows 31–32: Applicant Signature Block (H31:K32) */}
            <div className="flex justify-end w-full mb-4">
              <div className="w-[250px] text-center">
                <div className="font-bold border-b border-black uppercase pb-[1px] truncate">
                  {fullName ? fullName.toUpperCase() : '\u00A0'}
                </div>
                <div className="text-[11pt] pt-0.5">Signature of Applicant</div>
              </div>
            </div>

            {/* Rows 34–36: Subscribed and Sworn Jurat Block */}
            <div className="w-full space-y-1.5 mb-7 text-[11pt]">
              {/* Row 34 */}
              <div className="flex items-end w-full pl-12">
                <div className="shrink-0 pr-2">SUBSCRIBED AND SWORN to before me this</div>
                <div className="w-[62px] shrink-0 font-bold border-b border-black text-center pb-[1px]">
                  {swornDay || '\u00A0'}
                </div>
                <div className="w-[58px] shrink-0 text-center">day of</div>
                <div className="flex-1 font-bold border-b border-black text-center uppercase pb-[1px]">
                  {swornMonth || '\u00A0'}
                </div>
                <div className="w-[68px] shrink-0 font-bold border-b border-black text-center ml-1 pb-[1px]">
                  {swornYear || '\u00A0'}
                </div>
              </div>

              {/* Row 35 */}
              <div className="flex items-end w-full pl-8">
                <div className="shrink-0 pr-2">at Gasan, Marinduque with Community Tax Certificate No.</div>
                <div className="flex-1 font-bold border-b border-black text-center pb-[1px]">
                  {cedulaNo || '\u00A0'}
                </div>
                <div className="w-[82px] shrink-0 pl-2">issued on</div>
              </div>

              {/* Row 36 */}
              <div className="flex items-end w-full pl-8">
                <div className="w-[220px] shrink-0 font-bold border-b border-black text-center pb-[1px]">
                  {ctcDateStr || '\u00A0'}
                </div>
                <div className="pl-2">at Gasan, Marinduque.</div>
              </div>
            </div>

            {/* Rows 39–41: Mayor / Administering Officer Block (H39:K41) */}
            <div className="flex justify-end w-full">
              <div className="w-[260px] text-center leading-tight">
                <div className="font-bold border-b border-black pb-[1px] uppercase">
                  HON. JAMES MARTY L. LIM
                </div>
                <div className="pt-0.5">MUNICIPAL MAYOR</div>
                <div>Administering Officer/Notary Public</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OfficialApplicationForm;
