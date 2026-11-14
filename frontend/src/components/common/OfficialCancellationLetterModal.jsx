import React, { useRef, useEffect, useState } from 'react';
import { X, Printer, FileText, Loader2, Download } from 'lucide-react';
import { downloadOriginalLguTemplate } from '../../utils/downloadOriginalLguTemplate';
import { cleanText, formatVehicleMake, formatVehicleModelYear } from '../../utils/vehicleFormatters';

const OfficialCancellationLetterModal = ({
  isOpen,
  onClose,
  cancellationData = {},
  franchise = {}
}) => {
  const printRef = useRef(null);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);

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
  const rawName = String(
    data.fullName ||
    data.ownerName ||
    data.operatorName ||
    data.name ||
    (data.operator?.firstName
      ? `${data.operator.firstName} ${data.operator.middleName ? data.operator.middleName.charAt(0) + '. ' : ''}${data.operator.lastName || ''}`
      : '') ||
    '—'
  ).toUpperCase().trim();

  const recipientLine = /^(MR\.|MS\.|MRS\.)/i.test(rawName) ? rawName : `MR./MS. ${rawName}`;
  const nameWords = rawName.replace(/^(MR\.\/MS\.|MR\.|MS\.|MRS\.)\s*/i, '').split(/\s+/).filter(Boolean);
  const lastWord = nameWords[nameWords.length - 1] || 'Operator';
  const salutationName = `Mr./Ms. ${lastWord.charAt(0).toUpperCase()}${lastWord.slice(1).toLowerCase()}`;

  const rawBarangay = String(data.barangay || data.address || '')
    .replace(/^Brgy\.?\s*/i, '')
    .replace(/,?\s*Gasan.*$/i, '')
    .trim() || '—';

  const plateNo = cleanText(data.plateNo || data.plateNumber || data.mvFileNo, '—').toUpperCase();
  const rawFranchiseNo = cleanText(data.franchiseNo || data.mtopNo || data.mtopNumber || data.franchiseNumber, '—')
    .replace(/^MTOP-GASAN-/i, '')
    .toUpperCase();

  const make = formatVehicleMake(data, 'KAWASAKI').toUpperCase();
  const chassisNo = cleanText(data.chassisNo || data.chassisNumber, 'N/A').toUpperCase();
  const motorNo = cleanText(data.motorNo || data.motorNumber || data.engineNumber, 'N/A').toUpperCase();
  const model = formatVehicleModelYear(data, String(new Date().getFullYear())).toUpperCase();

  const cancelDateRaw = data.cancelledAt || data.cancellationRequestedAt || data.updatedAt || new Date();
  const cancelDateObj = new Date(cancelDateRaw);
  const validDate = isNaN(cancelDateObj.getTime()) ? new Date() : cancelDateObj;

  const dayNum = validDate.getDate();
  const getOrdinalSuffix = (n) => {
    if (n % 10 === 1 && n !== 11) return 'st';
    if (n % 10 === 2 && n !== 12) return 'nd';
    if (n % 10 === 3 && n !== 13) return 'rd';
    return 'th';
  };
  const ordinalSuffix = getOrdinalSuffix(dayNum);
  const monthStr = validDate.toLocaleDateString('en-US', { month: 'long' });
  const yearStr = String(validDate.getFullYear());
  const fullDateStr = validDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const requestDateStr = data.cancellationRequestedAt
    ? new Date(data.cancellationRequestedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : fullDateStr;

  const orNo = data.cancellationOrNo || data.cancellationOrNumber || data.paymentOrNumber || '';
  const orDate = data.cancellationOrDate
    ? new Date(data.cancellationOrDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : fullDateStr;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadDocx = async () => {
    if (isDownloadingDocx) return;
    setIsDownloadingDocx(true);
    try {
      await downloadOriginalLguTemplate({
        franchise: {
          ...data,
          _id: data._id || data.id,
          ownerName: rawName,
          barangay: rawBarangay,
          plateNumber: plateNo,
          mtopNumber: rawFranchiseNo,
          make,
          chassisNumber: chassisNo,
          motorNumber: motorNo,
          yearModel: model,
          cancelledAt: validDate.toISOString(),
          cancellationRequestedAt: data.cancellationRequestedAt || validDate.toISOString(),
          cancellationOrNumber: orNo,
          cancellationOrDate: orDate,
        },
        type: 'cancellation',
      });
    } catch (err) {
      console.error('Error downloading original Cancellation Word (.docx):', err);
      alert('Could not download Word (.docx) file. Please try again.');
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  return (
    <div
      id="printable-cancellation-modal-root"
      className="fixed inset-0 z-[130] bg-black/75 overflow-y-auto flex items-start justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[820px] flex flex-col items-center shrink-0 print:max-w-full print:m-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="w-full bg-[#1F1D1B] dark:bg-[#1C1917] border border-[#E4E1DC]/20 dark:border-[#2E2A27] rounded-xl p-3 mb-3 flex flex-wrap items-center justify-between gap-2 text-white shadow-md print:hidden sticky top-2 z-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
              <FileText size={17} />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black tracking-wide text-white uppercase flex items-center gap-2">
                Official Franchise Cancellation Letter (1:1 LGU Template)
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                  OVM Certified
                </span>
              </h4>
              <p className="text-[10px] sm:text-xs text-white/60">
                Municipality of Gasan • Office of the Vice Mayor (`CANCELLATION OF FRANCHISE.docx`)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadDocx}
              disabled={isDownloadingDocx}
              className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 active:scale-95 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer shrink-0"
              title="Download populated original Gasan LGU Word (.docx) file"
            >
              {isDownloadingDocx ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span className="hidden sm:inline">Original Word (.docx)</span>
              <span className="sm:hidden">.DOCX</span>
            </button>

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

        {/* Printable Letter Sheet (1:1 replica of CANCELLATION OF FRANCHISE.docx Page 1) */}
        <div className="w-full max-w-[820px] overflow-x-auto pb-4 custom-scrollbar flex justify-start sm:justify-center">
          <div
            ref={printRef}
            id="printable-cancellation-letter"
            className="relative bg-white text-black w-[794px] min-h-[1123px] shrink-0 shadow-2xl px-[72px] pt-[56px] pb-[56px] box-border select-text overflow-hidden print:shadow-none print:m-0"
            style={{ fontFamily: "'Cambria', 'Georgia', 'Times New Roman', serif", fontSize: '13pt', lineHeight: '1.35' }}
          >
            {/* Print Style */}
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
                  width: 210mm !important;
                  max-width: 210mm !important;
                  min-height: 310mm !important;
                  padding: 18mm 20mm !important;
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

            {/* Authentic Word Header Watermark (matching header1.xml image3.jpeg) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.14] pointer-events-none select-none z-0">
              <img
                src="/extracted_logos/image3.jpeg"
                alt="Gasan Seal Watermark"
                className="w-[460px] h-[460px] object-contain"
              />
            </div>

            <div className="relative z-10">
              {/* Paragraphs [0]–[5]: Official Office of the Vice Mayor Letterhead */}
              <div className="relative flex items-start justify-between mb-12">
                <img
                  src="/extracted_logos/image2.jpeg"
                  alt="Municipality of Gasan Official Seal"
                  className="w-[88px] h-[88px] object-contain shrink-0"
                />
                <div className="flex-1 text-center leading-tight px-2">
                  <div className="text-[11pt]">Republic of the Philippines</div>
                  <div className="text-[11pt]">Province of Marinduque</div>
                  <div className="text-[12pt]">MUNICIPALITY OF GASAN</div>
                  <div
                    className="font-bold text-[19pt] my-0.5"
                    style={{ fontFamily: "'Old English Text MT', 'UnifrakturMaguntia', 'Bookman Old Style', Georgia, serif" }}
                  >
                    Office of the Vice Mayor
                  </div>
                  <div className="text-[11pt]">E-mail: sbgasan7@gmail.com</div>
                  <div className="text-[11pt] italic">Tel. No.: (042) 704-0208</div>
                </div>
                <img
                  src="/extracted_logos/image1.jpeg"
                  alt="Sangguniang Bayan Official Logo"
                  className="w-[88px] h-[88px] object-contain shrink-0 rounded-full"
                />
              </div>

              {/* Paragraphs [9]–[10]: Recipient Block */}
              <div className="mb-6 leading-snug">
                <div className="font-bold underline">{recipientLine}</div>
                <div className="underline">Brgy. {rawBarangay}, Gasan, Marinduque</div>
              </div>

              {/* Paragraph [12]: Salutation */}
              <div className="mb-6">
                Dear <span className="underline">{salutationName}</span>:
              </div>

              {/* Paragraphs [14]–[25]: Letter Body */}
              <div className="space-y-5 text-justify">
                {/* [14] */}
                <p className="indent-12">
                  This has reference to your letter dated{' '}
                  <strong className="underline text-[14pt]">{requestDateStr}</strong>{' '}
                  requesting this office to cancel the franchise of your motorized tricycle with{' '}
                  <strong className="underline text-[14pt]">Plate No. {plateNo}</strong>.
                </p>

                {/* [16] */}
                <p>
                  Having submitted all the necessary documents for{' '}
                  <strong className="underline">cancellation</strong>, your request is hereby granted.
                </p>

                {/* [18] */}
                <p className="indent-12">
                  <strong className="underline text-[14pt]">Franchise No. {rawFranchiseNo}</strong>{' '}
                  cancelled this <span className="underline">{dayNum}</span>
                  <sup className="underline">{ordinalSuffix}</sup> day of{' '}
                  <span className="underline">{monthStr}</span>, {yearStr}.
                </p>

                {/* [20]–[23]: Vehicle Specs Block (Plain Indented Lines with Tabbed Colons, No Vertical Border) */}
                <div className="pl-12 py-1 space-y-1 text-left">
                  <div className="grid grid-cols-[170px_1fr]">
                    <span>MAKE</span>
                    <span>
                      : <strong className="underline">{make}</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-[170px_1fr]">
                    <span>CHASSIS NO.</span>
                    <span>
                      : <strong className="underline">{chassisNo}</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-[170px_1fr]">
                    <span>MOTOR NO.</span>
                    <span>
                      : <strong className="underline">{motorNo}</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-[170px_1fr]">
                    <span>MODEL</span>
                    <span>
                      : <strong className="underline">{model}</strong>
                    </span>
                  </div>
                </div>

                {/* [25] */}
                <p className="indent-12">
                  Issued this{' '}
                  <strong className="underline text-[14pt]">
                    {dayNum}
                    <sup>{ordinalSuffix}</sup> day of {monthStr}, {yearStr}
                  </strong>{' '}
                  upon request of the interested party for whatever legal purpose it may serve.
                </p>
              </div>

              {/* Paragraphs [29]–[30]: Signatory Block */}
              <div className="mt-16 flex justify-end pr-6">
                <div className="relative text-center">
                  <img
                    src="/excel_assets/franchise_image2.png"
                    alt="Signature of Municipal Vice Mayor"
                    className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-16 object-contain pointer-events-none"
                  />
                  <div className="font-bold underline text-[14pt] tracking-wide">
                    LIDANY A. LAO-BALDO
                  </div>
                  <div className="font-bold text-[12pt]">
                    Municipal Vice Mayor
                  </div>
                </div>
              </div>

              {/* Paragraphs [38]–[40]: Official Receipt Block (Bookman Old Style 8pt Bold, #7030A0, bottom-left) */}
              <div
                className="mt-24 font-bold leading-snug"
                style={{
                  fontFamily: "'Bookman Old Style', 'Georgia', serif",
                  fontSize: '8.5pt',
                  color: '#7030A0',
                }}
              >
                <div>Amount: P50.00</div>
                <div>O.R. No.: {orNo}</div>
                <div>Date: {orDate}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficialCancellationLetterModal;
