import React, { useRef, useEffect, useState } from 'react';
import { MUNICIPAL_SIGNATORY } from '../../utils/constants';
import { Printer, X, Award, Download, Loader2, CheckCircle2, FileSpreadsheet, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { downloadOriginalLguTemplate } from '../../utils/downloadOriginalLguTemplate';
import { cleanText, formatVehicleMake, formatVehicleModelYear } from '../../utils/vehicleFormatters';

const MtopCertificateModal = ({ isOpen, onClose, unit, isECopy = false }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const [showQrStamp, setShowQrStamp] = useState(true);
  const certRef = useRef(null);

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

  const handleDownloadExcel = async () => {
    if (isDownloadingExcel) return;
    setIsDownloadingExcel(true);
    try {
      await downloadOriginalLguTemplate({
        franchise: {
          ...unit,
          _id: unit._id || unit.id,
          ownerName: unit.fullName || unit.ownerName || unit.operator?.name,
          mtopNumber: unit.mtopNumber || unit.franchiseNumber || unit.plateNo,
          plateNumber: unit.plateNo || unit.plateNumber,
          motorNumber: unit.motorNo || unit.motorNumber,
          chassisNumber: unit.chassisNo || unit.chassisNumber,
          yearModel: unit.made || unit.yearModel || unit.model,
          sidecarNumber: unit.sidecarNo || unit.sidecarNumber || unit.bodyNumber || unit.todaBodyNumber,
          issuedAt: unit.approvalDate || unit.issuedAt || unit.dateApplied,
          validUntil: unit.expiryDate || unit.validUntil,
        },
        type: 'mtop',
      });
    } catch (err) {
      console.error('Error downloading original MTOP Excel:', err);
      alert('Could not download Excel file. Please try again.');
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!certRef.current || isDownloading) return;
    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      await new Promise(r => setTimeout(r, 120));
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
        logging: false
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `MTOP_Certificate_${unit.plateNo || unit.plateNumber || unit._id}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Error downloading MTOP image:', err);
      alert('Could not download image. Please use "Print / Save PDF" instead.');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatShortDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-US', {
      timeZone: 'Asia/Manila',
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const baseDateRaw = unit.approvalDate || unit.issuedAt || unit.dateApplied || new Date().toISOString();
  const baseDateObj = new Date(baseDateRaw);
  const validYear = !isNaN(baseDateObj.getTime()) ? baseDateObj.getFullYear() : new Date().getFullYear();

  const issueDate = formatShortDate(baseDateRaw);
  let expiryDate = unit.expiryDate || unit.validUntil ? formatShortDate(unit.expiryDate || unit.validUntil) : '';
  if (!expiryDate && !isNaN(baseDateObj.getTime())) {
    const exp = new Date(baseDateObj);
    exp.setFullYear(exp.getFullYear() + 3);
    expiryDate = formatShortDate(exp);
  }

  // Parse MTOP Number into Year Prefix ("2026 - ") and Sequence No ("186") matching FRANCHISE.xlsx I11 & J11
  const rawMtop = String(unit.mtopNumber || unit.franchiseNumber || '').trim();
  const yearSeqMatch = rawMtop.match(/(20\d{2})\D+(\d+)/);
  const mtopYearPrefix = yearSeqMatch ? `${yearSeqMatch[1]} - ` : `${validYear} - `;
  const mtopSeqNo = yearSeqMatch
    ? yearSeqMatch[2]
    : (rawMtop.replace(/^MTOP-GASAN-/i, '') || String(unit.plateNo || unit.plateNumber || unit._id || '186').slice(-4).toUpperCase());

  const applicantName = (
    unit.fullName ||
    unit.ownerName ||
    (unit.operator?.firstName
      ? `${unit.operator.firstName} ${unit.operator.middleName ? unit.operator.middleName.charAt(0) + '. ' : ''}${unit.operator.lastName || ''}`
      : unit.operator?.name) ||
    'CHRISTIAN S. SADICON'
  ).toUpperCase().trim();

  const rawAddress = (unit.address || unit.barangay || unit.operator?.barangay || 'BAHI, GASAN, MARINDUQUE').toUpperCase().trim();
  const formattedAddress = rawAddress.includes('GASAN') ? rawAddress : `${rawAddress}, GASAN, MARINDUQUE`;

  const isRenewal = String(unit.applicationType || '').toLowerCase() === 'renewal';
  const cleanZone = String(unit.zone || unit.todaZone || 'NORTH')
    .toUpperCase()
    .replace(/\s*ZONE.*$/i, '')
    .trim() || 'NORTH';

  const makeVal = formatVehicleMake(unit, 'KAWASAKI').toUpperCase();
  const modelVal = formatVehicleModelYear(unit, '2024').toUpperCase();
  const motorVal = cleanText(unit.motorNo || unit.motorNumber || unit.engineNumber, 'N/A').toUpperCase();
  const chassisVal = cleanText(unit.chassisNo || unit.chassisNumber, 'N/A').toUpperCase();
  const plateVal = cleanText(unit.plateNo || unit.plateNumber, 'PENDING').toUpperCase();
  const scNoVal = cleanText(unit.sidecarNo || unit.sidecarNumber || unit.bodyNumber || unit.todaBodyNumber, '').toUpperCase();

  return (
    <div
      id="printable-mtop-modal-root"
      className="fixed inset-0 z-[120] bg-black/75 overflow-y-auto overscroll-contain print:p-0 print:bg-white print:static print:inset-auto print:overflow-hidden"
    >
      <div className="min-h-full w-full flex flex-col items-center justify-start p-2 sm:p-6 pb-28 pt-2 print:p-0 print:m-0">
        <div className="w-full max-w-[820px] flex flex-col items-center shrink-0 print:max-w-full print:m-0">

          {/* Action Toolbar (Hidden during print) */}
          <div className="w-full bg-[#1F1D1B] dark:bg-[#1C1917] border border-[#E4E1DC]/20 dark:border-[#2E2A27] rounded-lg p-2.5 sm:p-3.5 mb-3 flex flex-wrap items-center justify-between gap-2 text-white shadow-sm print:hidden sticky top-2 z-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
                <Award size={18} />
              </div>
              <div>
                <h3 className="font-black text-xs sm:text-sm tracking-wide flex items-center gap-2">
                  {isECopy ? 'Electronic Copy (Approved MTOP)' : 'Official MTOP Certificate (1:1 LGU Template)'}
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                    {isECopy ? 'Approved E-Copy' : (unit.status || 'Active Franchise')}
                  </span>
                </h3>
                <p className="text-xs text-white/60">
                  Municipality of Gasan • Sangguniang Bayan Official Form (`FRANCHISE.xlsx`)
                </p>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
              {/* Toggle QR Stamp */}
              <button
                onClick={() => setShowQrStamp(prev => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                  showQrStamp
                    ? 'bg-white/10 text-white border-white/25'
                    : 'bg-transparent text-white/50 border-white/10 hover:text-white'
                }`}
                title="Show or hide Digital QR Verification Stamp on print"
              >
                <QrCode size={14} />
                <span className="hidden md:inline">{showQrStamp ? 'QR: ON' : 'QR: OFF'}</span>
              </button>

              {/* Download Original Excel (.xlsx) Button */}
              <button
                onClick={handleDownloadExcel}
                disabled={isDownloadingExcel}
                className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer shrink-0"
                title="Download populated original Gasan LGU Excel (.xlsx) file"
              >
                {isDownloadingExcel ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                <span className="hidden sm:inline">Original Excel (.xlsx)</span>
                <span className="sm:hidden">.XLSX</span>
              </button>

              {/* Download as Image Button */}
              <button
                onClick={handleDownloadImage}
                disabled={isDownloading}
                className="flex items-center gap-1.5 bg-[#D4AF37] hover:bg-[#c29e2f] active:scale-95 text-slate-950 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-black transition-all shadow-md disabled:opacity-50 cursor-pointer shrink-0"
                title="Download high-resolution PNG image"
              >
                {isDownloading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span className="hidden sm:inline">Saving...</span>
                  </>
                ) : downloadSuccess ? (
                  <>
                    <CheckCircle2 size={14} className="text-emerald-900" />
                    <span className="hidden sm:inline">Saved!</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span className="hidden sm:inline">Image</span>
                  </>
                )}
              </button>

              {/* Print MTOP Button */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-[#9E2A2B] hover:bg-[#922029] active:scale-95 text-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
                title="Print or Save as PDF (1 Page)"
              >
                <Printer size={14} />
                <span className="hidden sm:inline">Print / Save PDF</span>
                <span className="sm:hidden">Print</span>
              </button>

              <button
                onClick={onClose}
                className="text-white/60 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                title="Close Preview (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Scrollable Container preserving Exact LGU Bond Paper Geometry */}
          <div className="w-full max-w-[820px] overflow-x-auto pb-4 custom-scrollbar flex justify-start sm:justify-center">
            <div
              ref={certRef}
              id="printable-mtop-certificate"
              className="relative bg-white text-black w-[794px] min-h-[1123px] shrink-0 shadow-2xl px-[42px] pt-[18px] pb-[32px] box-border select-text overflow-hidden print:shadow-none print:m-0"
              style={{ fontFamily: "'Arial', 'Helvetica', sans-serif", fontSize: '12pt', lineHeight: '1.28' }}
            >
              {/* Print Stylesheet - Precision 1-Page Fit on Long Bond Paper (8.5 x 13 in) */}
              <style>{`
                @media print {
                  @page {
                    size: 8.5in 13in;
                    margin: 0;
                  }
                  html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    background: white !important;
                    overflow: hidden !important;
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
                    width: 100% !important;
                    overflow: visible !important;
                  }
                  body.printing-mtop #printable-mtop-certificate,
                  body.printing-mtop #printable-mtop-certificate * {
                    visibility: visible !important;
                  }
                  body.printing-mtop #printable-mtop-certificate {
                    position: relative !important;
                    width: 210mm !important;
                    max-width: 210mm !important;
                    min-height: 310mm !important;
                    margin: 0 auto !important;
                    padding: 14px 36px 24px 36px !important;
                    box-shadow: none !important;
                    background: #FFFFFF !important;
                    border: none !important;
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                }
              `}</style>

              {/* Authentic Full-Page Seal Watermark (matching vmlDrawing1.vml in FRANCHISE.xlsx) */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.14] pointer-events-none select-none z-0">
                <img
                  src="/excel_assets/doc_image2.png"
                  alt="Sangguniang Bayan Seal Watermark"
                  className="w-[540px] h-[540px] object-contain"
                />
              </div>

              {/* Approved E-Copy Watermark Stamp */}
              {isECopy && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-30 overflow-hidden">
                  <div className="transform -rotate-25 border-4 sm:border-8 border-emerald-600/30 rounded-2xl px-12 py-5 text-center bg-emerald-500/[0.03]">
                    <span className="text-5xl sm:text-6xl font-black font-sans tracking-widest text-emerald-600/35 uppercase block">
                      APPROVED
                    </span>
                    <span className="text-xs sm:text-sm font-bold font-sans tracking-widest text-emerald-700/40 uppercase mt-1 block">
                      ELECTRONIC COPY &bull; VALID ISSUANCE
                    </span>
                  </div>
                </div>
              )}

              <div className="relative z-10">
                {/* Rows 1–7: Official Header Banner Image (A1:K7) */}
                <div className="w-full mb-2">
                  <img
                    src="/excel_assets/header_banner.png"
                    alt="Municipality of Gasan - Office of the Sangguniang Bayan"
                    className="w-full h-auto object-contain block"
                  />
                </div>

                {/* Rows 8–9: Main Document Titles (Bookman Old Style 12pt Bold, Centered) */}
                <div
                  className="text-center font-bold uppercase tracking-normal mb-5"
                  style={{ fontFamily: "'Bookman Old Style', 'Georgia', 'Times New Roman', serif", fontSize: '12.5pt', lineHeight: '1.25' }}
                >
                  <div>MOTORIZED TRICYCLE OPERATOR’S PERMIT</div>
                  <div>MUNICIPAL (TRICYCLE) FRANCHISE</div>
                </div>

                {/* Row 11: Applicant : [C11:G11] | No [I11] [J11] */}
                <div className="flex items-end w-full mb-3 text-[12pt]">
                  <div className="w-[82px] shrink-0">Applicant</div>
                  <div className="w-[16px] shrink-0 text-center">:</div>
                  <div className="flex-1 font-bold border-b border-black px-2 pb-[1px] uppercase truncate">
                    {applicantName}
                  </div>
                  <div className="w-[46px] shrink-0 text-right pr-2">No</div>
                  <div className="w-[62px] shrink-0 font-bold border-b border-black text-right pb-[1px]">
                    {mtopYearPrefix}
                  </div>
                  <div className="w-[88px] shrink-0 font-bold border-b border-black pl-1 pb-[1px]">
                    {mtopSeqNo}
                  </div>
                </div>

                {/* Row 13: Address : [C13:G13] | New [I13] Renewal [K13] */}
                <div className="flex items-end w-full mb-5 text-[12pt]">
                  <div className="w-[82px] shrink-0">Address</div>
                  <div className="w-[16px] shrink-0 text-center">:</div>
                  <div className="flex-1 font-bold border-b border-black px-2 pb-[1px] uppercase truncate">
                    {formattedAddress}
                  </div>
                  <div className="w-[48px] shrink-0 text-right pr-1.5">New</div>
                  <div className="w-[38px] shrink-0 border-b border-black text-center font-bold pb-[1px]">
                    {!isRenewal ? '/' : '\u00A0'}
                  </div>
                  <div className="w-[74px] shrink-0 text-right pr-1.5">Renewal</div>
                  <div className="w-[38px] shrink-0 border-b border-black text-center font-bold pb-[1px]">
                    {isRenewal ? '/' : '\u00A0'}
                  </div>
                </div>

                {/* Row 15: Authorization Line 1 */}
                <div className="text-center text-[12pt] mb-1.5">
                  Applicant is hereby authorized to operate a motorized tricycle service for hire on the zone
                </div>

                {/* Row 16: [A16:B16 ZONE] of this Municipality using [F16:G16 ONE (1) UNIT] tricycle/s. */}
                <div className="flex items-end w-full mb-5 text-[12pt]">
                  <div className="w-[140px] shrink-0 font-bold border-b border-black text-center uppercase pb-[1px]">
                    {cleanZone}
                  </div>
                  <div className="px-3 shrink-0">of this Municipality using</div>
                  <div className="w-[145px] shrink-0 font-bold border-b border-black text-center uppercase pb-[1px]">
                    ONE (1) UNIT
                  </div>
                  <div className="pl-3 flex-1">tricycle/s.</div>
                </div>

                {/* Rows 18–20: Vehicle Specifications (6 columns with individual horizontal connector underlines on Row 19 & Row 20, matching drawing1.xml) */}
                <div className="w-full mb-4 text-[11.5pt]">
                  {/* Row 18: Headers */}
                  <div className="grid grid-cols-[1.5fr_0.85fr_2fr_2fr_1fr_0.9fr] gap-x-2.5 font-bold text-center mb-1">
                    <div>Make</div>
                    <div>Model</div>
                    <div>Motor Number</div>
                    <div>Chassis Number</div>
                    <div>Plate No.</div>
                    <div>SCNo.</div>
                  </div>
                  {/* Row 19: Unit 1 Values with individual bottom underlines */}
                  <div className="grid grid-cols-[1.5fr_0.85fr_2fr_2fr_1fr_0.9fr] gap-x-2.5 text-center items-end h-[26px]">
                    <div className="border-b border-black pb-[1px] truncate">{makeVal}</div>
                    <div className="border-b border-black pb-[1px] truncate">{modelVal}</div>
                    <div className="border-b border-black pb-[1px] truncate">{motorVal}</div>
                    <div className="border-b border-black pb-[1px] truncate">{chassisVal}</div>
                    <div className="border-b border-black pb-[1px] truncate">{plateVal}</div>
                    <div className="border-b border-black pb-[1px] truncate">{scNoVal || '\u00A0'}</div>
                  </div>
                  {/* Row 20: Second Unit Blank Underlines (Straight Connectors 2, 4, 6, 8, 10, 12 in FRANCHISE.xlsx) */}
                  <div className="grid grid-cols-[1.5fr_0.85fr_2fr_2fr_1fr_0.9fr] gap-x-2.5 text-center items-end h-[26px]">
                    <div className="border-b border-black pb-[1px]">&nbsp;</div>
                    <div className="border-b border-black pb-[1px]">&nbsp;</div>
                    <div className="border-b border-black pb-[1px]">&nbsp;</div>
                    <div className="border-b border-black pb-[1px]">&nbsp;</div>
                    <div className="border-b border-black pb-[1px]">&nbsp;</div>
                    <div className="border-b border-black pb-[1px]">&nbsp;</div>
                  </div>
                </div>

                {/* Row 21: Subject to the following conditions (A21:K21, Arial 12pt plain text, no background or box) */}
                <div className="text-[11.5pt] leading-[1.32] text-justify mb-5">
                  <p className="mb-3">Subject to the following conditions:</p>
                  <div className="pl-10 space-y-1">
                    <div className="flex items-start gap-3">
                      <span className="shrink-0">1.</span>
                      <p>
                        The Applicant/Operator shall comply with the rules and regulations prescribed by the Municipality. Failure to comply with any of the conditions set forth herein shall be sufficient cause for the suspension or cancellation of the authority herein granted;
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="shrink-0">2.</span>
                      <p>
                        The unit/s shall be registered as “FOR HIRE” with the Land Transportation Office of Marinduque, in accordance with its prescribed rules and guidelines;
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="shrink-0">3.</span>
                      <p>
                        Within the authorized zone, the Applicant/Operator shall charge rate/s in accordance with the prescribed and approved rate of the Sangguniang Bayan;
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="shrink-0">4.</span>
                      <p>
                        This franchise shall be valid for three (3) years from the date hereof and shall grant the Applicant/Operator the privilege to operate the unit/s herein described for hire and/or substitute compensation;
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="shrink-0">5.</span>
                      <p>
                        Without prior authority from the Sangguniang Bayan, the Applicant/Operator shall not increase, transfer, drop or substitute unit/s nor suspend or abandon the service herein authorized. Otherwise, the authority granted shall be declared forfeited or cancelled;
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="shrink-0">6.</span>
                      <p>
                        The Applicant/Operator shall pay to the Municipality within the prescribed period, all required fees annually. Late payments shall be subject to penalties and surcharges.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="shrink-0">7.</span>
                      <p>
                        Protection of this document is advised. Its loss or destruction may affect legal rights to operate the service. Any addition, alteration or deletion not otherwise authorized shall invalidate this document.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Row 23: Gasan, Marinduque | Valid from (underlined bold) | [DATE] (underlined bold) | until (underlined bold) | [DATE] (underlined bold) */}
                <div className="flex items-end w-full mb-6 text-[12pt]">
                  <div className="w-[155px] shrink-0">Gasan, Marinduque</div>
                  <div className="flex-1 flex items-end font-bold border-b border-black pb-[1px]">
                    <div className="w-[125px] text-center">Valid from</div>
                    <div className="flex-1 text-center">{issueDate}</div>
                    <div className="w-[65px] text-center">until</div>
                    <div className="flex-1 text-center">{expiryDate}</div>
                  </div>
                </div>

                {/* Rows 25–34: Centered Signatory Block + Optional Bottom-Left QR Verification Stamp */}
                <div className="relative w-full pt-1">
                  <div className="text-center text-[12pt] leading-snug">
                    <div>For and by Authority of the</div>
                    <div className="mb-14">Sangguniang Bayan</div>

                    {/* E-signature & Underlined D31:H31 */}
                    <div className="relative w-[300px] mx-auto border-b border-black mb-1">
                      <img
                        src="/excel_assets/franchise_image2.png"
                        alt="Signature of Municipal Vice Mayor"
                        className="absolute -top-14 left-1/2 -translate-x-1/2 w-52 h-16 object-contain pointer-events-none"
                      />
                    </div>
                    <div className="font-bold uppercase tracking-wide">
                      {MUNICIPAL_SIGNATORY || 'LIDANY A. LAO-BALDO'}
                    </div>
                    <div>Municipal Vice Mayor/</div>
                    <div>Presiding Officer</div>
                  </div>

                  {/* Optional Digital QR Verification Stamp (Bottom-Left, does not alter centered LGU signatory layout) */}
                  {showQrStamp && (
                    <div className="absolute bottom-0 left-0 flex items-center gap-2 bg-white/90 border border-slate-300 rounded p-1.5">
                      <QRCodeSVG
                        value={`${window.location.origin}/verify/${unit._id || unit.id || ''}`}
                        size={48}
                        level="M"
                      />
                      <div className="text-left text-[7.5pt] leading-tight text-slate-700 font-sans">
                        <div className="font-bold text-black">G-TRAMS VERIFIED</div>
                        <div>MTOP No: {mtopYearPrefix}{mtopSeqNo}</div>
                        <div>Plate: {plateVal}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MtopCertificateModal;
