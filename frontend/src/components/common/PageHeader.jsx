import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Standard PageHeader Component for Government Administrative Pages
 * Minimalist and functional:
 * - Title: 20px font-semibold
 * - Accent: Thin 4px maroon left border
 * - Date: Philippine Standard Time (Asia/Manila)
 * - Single-line summary
 * - Pipeline links as clean, accessible text chips (no heavy gradients or emoji)
 */
const PageHeader = ({
  title = 'Dashboard',
  subtitle = '',
  pipelineLinks = [], // Array of { label, count, onClick, active }
  actions = null,
  className = '',
}) => {
  const { language } = useLanguage() || { language: 'en' };

  // Format date in Philippine Timezone
  const today = new Date();
  const locale = language === 'fil' ? 'fil-PH' : 'en-PH';
  const formattedDate = today.toLocaleDateString(locale, {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className={`bg-white dark:bg-[#1C1917] p-5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${className}`}
    >
      {/* Title & Subtitle with 4px Maroon Left Border Accent */}
      <div className="border-l-4 border-[#9E2A2B] pl-3.5 py-0.5 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] tracking-normal">
            {title}
          </h1>
          <span className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-normal border-l border-[#E4E1DC] dark:border-[#2E2A27] pl-3 hidden sm:inline">
            {formattedDate}
          </span>
        </div>

        {subtitle && (
          <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-1 leading-normal line-clamp-1">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right Side: Simple Pipeline Links / Action Links */}
      <div className="flex flex-wrap items-center gap-2 pt-1 md:pt-0">
        {pipelineLinks && pipelineLinks.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5" role="navigation" aria-label="Quick Pipeline Navigation">
            {pipelineLinks.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={item.onClick}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer active:scale-[0.98] ${
                  item.active
                    ? 'bg-[#FDF2F4] text-[#9E2A2B] border-[#9E2A2B]/40 dark:bg-[#9E2A2B]/20 dark:text-[#D4AF37] dark:border-[#D4AF37]/40'
                    : 'bg-transparent text-[#1F1D1B] dark:text-[#F6F5F3] border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27]'
                }`}
                title={item.title || item.label}
              >
                <span>{item.label}:</span>
                <span className="font-mono tabular-nums font-semibold text-[#9E2A2B] dark:text-[#D4AF37]">
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
