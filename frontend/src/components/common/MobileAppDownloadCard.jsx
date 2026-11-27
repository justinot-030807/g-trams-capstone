import React from 'react';
import { Download, Smartphone, ShieldCheck, Users, QrCode } from 'lucide-react';
import { MOBILE_APP_CONFIG } from '../../utils/projectInfo';

const formatReleaseDate = (isoDate) => {
  if (!isoDate) return null;
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const MobileAppDownloadCard = ({ release = MOBILE_APP_CONFIG, className = '' }) => {
  const activeRelease = release || MOBILE_APP_CONFIG;
  const releaseDateLabel = formatReleaseDate(activeRelease.publishedAt);

  return (
    <section
      id="mobile-app"
      aria-label="G-TRAMS Mobile Android App Download"
      className={`w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 relative z-10 ${className}`}
    >
      <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-xl shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left: Role Highlights & Details */}
        <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FDF2F4] dark:bg-[#9E2A2B]/20 text-[#9E2A2B] dark:text-[#F5E6B3] border border-[#9E2A2B]/20 dark:border-[#D4AF37]/30 font-mono text-[11px] font-semibold uppercase tracking-[0.06em]">
                <Smartphone size={13} />
                Official Android App
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#F6F5F3] dark:bg-[#14110F] text-[#6B6761] dark:text-[#A8A29E] border border-[#E4E1DC] dark:border-[#2E2A27] font-mono text-[11px] font-semibold">
                {activeRelease.version} &bull; {activeRelease.fileSizeLabel}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1F1D1B] dark:text-[#F6F5F3] tracking-[-0.025em] leading-tight">
              G-TRAMS Mobile for{' '}
              <span className="text-[#9E2A2B] dark:text-[#D4AF37]">
                Operators &amp; TODA Presidents
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-[#6B6761] dark:text-[#A8A29E] mt-2.5 leading-relaxed max-w-2xl">
              Manage your tricycle franchise records, offline Digital Operator ID, and TODA member roster directly on Android — connected in real time to the Municipality of Gasan portal.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-center text-[#9E2A2B] dark:text-[#D4AF37] shrink-0">
                <QrCode size={17} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">
                  Tricycle Operators
                </h3>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5 leading-relaxed">
                  Offline Digital Operator ID &amp; QR permit, MTOP e-copy, document scanner, and renewal status alerts.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-center text-[#9E2A2B] dark:text-[#D4AF37] shrink-0">
                <Users size={17} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">
                  TODA Presidents
                </h3>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5 leading-relaxed">
                  Member directory &amp; fleet KPIs, AI OCR masterlist scanning, disaffiliation requests, and QR verifier.
                </p>
              </div>
            </div>
          </div>

          <p className="text-[11px] sm:text-xs text-[#6B6761] dark:text-[#A8A29E] flex items-start gap-2 leading-relaxed">
            <ShieldCheck size={15} className="text-[#15803D] dark:text-[#4ADE80] shrink-0 mt-0.5" />
            <span>
              Exclusively for Tricycle Operators and TODA Presidents. Municipal staff (OVM / LLSA I, Cashier, System Admin) continue using this web portal.
            </span>
          </p>
        </div>

        {/* Right: Download Action Panel */}
        <div className="lg:col-span-4 bg-[#F6F5F3] dark:bg-[#14110F] border-t lg:border-t-0 lg:border-l border-[#E4E1DC] dark:border-[#2E2A27] p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-[#9E2A2B] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Smartphone size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1F1D1B] dark:text-[#F6F5F3] leading-tight">
                  {activeRelease.appName}
                </p>
                <p className="font-mono text-[11px] text-[#6B6761] dark:text-[#A8A29E] truncate mt-0.5">
                  {activeRelease.fileName}
                </p>
              </div>
            </div>

            <dl className="space-y-2 pt-3 border-t border-[#E4E1DC] dark:border-[#2E2A27] text-xs">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#6B6761] dark:text-[#A8A29E] font-medium">Latest Release</dt>
                <dd className="font-mono font-bold text-[#1F1D1B] dark:text-[#F6F5F3] tabular-nums">
                  {activeRelease.version}
                </dd>
              </div>
              {releaseDateLabel && (
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[#6B6761] dark:text-[#A8A29E] font-medium">Updated</dt>
                  <dd className="font-mono font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] tabular-nums">
                    {releaseDateLabel}
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#6B6761] dark:text-[#A8A29E] font-medium">Package</dt>
                <dd className="font-mono font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                  {activeRelease.platform}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#6B6761] dark:text-[#A8A29E] font-medium">File Size</dt>
                <dd className="font-mono font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] tabular-nums">
                  {activeRelease.fileSizeLabel}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#6B6761] dark:text-[#A8A29E] font-medium">Supported Roles</dt>
                <dd className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] text-right">
                  Operator &amp; TODA Pres.
                </dd>
              </div>
            </dl>
          </div>

          <div className="space-y-2.5">
            <a
              href={activeRelease.apkDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={activeRelease.fileName}
              className="w-full px-5 py-3 min-h-[48px] bg-[#9E2A2B] hover:bg-[#7A1B22] text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-sm cursor-pointer"
            >
              <Download size={16} />
              <span>Download Android APK</span>
            </a>

            <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] text-center leading-snug">
              Signed release build &bull; Allow &ldquo;Install unknown apps&rdquo; on Android if prompted.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MobileAppDownloadCard;
