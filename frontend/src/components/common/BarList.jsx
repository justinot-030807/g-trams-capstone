import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Standard BarList Component for G-TRAMS (TODA Chart replacement)
 * Eliminates rainbow 11-color donut confusion and status-color collisions:
 * - Sorted descending: Highest units at the top
 * - Single-color: Solid Municipal Maroon (#9E2A2B) for accredited TODAs
 * - Gray (#9CA3AF) for "Non-TODA" / "NON-TODA"
 * - Tabular numbers at the end of each bar: Units and percentage
 * - Accessible "Show all / Show less" toggle
 */
const BarList = ({
  data = [], // Array of { name, value, percentage }
  initialLimit = 5,
  title = 'TODA Distribution',
  subtitle = 'Bilang ng rehistradong yunit bawat asosasyon',
  className = '',
}) => {
  const { t } = useLanguage() || { t: (_, def) => def };
  const [showAll, setShowAll] = useState(false);

  // Sort descending by value
  const sortedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    const copy = [...data];
    return copy.sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));
  }, [data]);

  // Determine max value for relative bar width
  const maxValue = useMemo(() => {
    if (sortedData.length === 0) return 1;
    return Math.max(...sortedData.map((d) => Number(d.value) || 0), 1);
  }, [sortedData]);

  const displayedItems = showAll ? sortedData : sortedData.slice(0, initialLimit);
  const hasMore = sortedData.length > initialLimit;

  return (
    <div className={`bg-white dark:bg-[#1C1917] p-5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
        <div>
          <h2 className="text-sm font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        <span className="text-xs font-mono font-medium text-[#6B6761] dark:text-[#A8A29E] tabular-nums">
          {sortedData.length} {t('common.associations', 'asosasyon')}
        </span>
      </div>

      {/* Bar List */}
      {sortedData.length === 0 ? (
        <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] text-center py-6">
          {t('common.noData', 'Walang datos na maipakita.')}
        </p>
      ) : (
        <div className="space-y-3" role="list" aria-label={title}>
          {displayedItems.map((item, idx) => {
            const rawName = String(item.name || '').trim();
            const isNonToda = rawName.toUpperCase().includes('NON-TODA');
            const val = Number(item.value) || 0;
            const pct = item.percentage !== undefined ? item.percentage : Math.round((val / maxValue) * 100);
            const widthPct = Math.max(4, Math.round((val / maxValue) * 100));

            // Single brand maroon color for active TODAs, neutral gray for Non-TODA
            const barBgColor = isNonToda
              ? 'bg-[#9CA3AF] dark:bg-[#6B7280]'
              : 'bg-[#9E2A2B] dark:bg-[#9E2A2B]';

            return (
              <div key={idx} className="group" role="listitem">
                {/* Labels row: TODA Name on left, Units & Pct on right */}
                <div className="flex items-center justify-between gap-3 text-xs mb-1">
                  <span
                    className="font-medium text-[#1F1D1B] dark:text-[#F6F5F3] truncate max-w-[65%]"
                    title={rawName}
                  >
                    {rawName || 'Unassigned'}
                  </span>
                  <span className="font-mono tabular-nums text-[#1F1D1B] dark:text-[#F6F5F3] shrink-0 text-right">
                    <strong className="font-semibold">{val.toLocaleString()}</strong>{' '}
                    <span className="text-[#6B6761] dark:text-[#A8A29E]">({pct}%)</span>
                  </span>
                </div>

                {/* Single-color minimal bar */}
                <div className="w-full bg-[#E4E1DC]/60 dark:bg-[#2E2A27] rounded-sm h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-sm transition-all duration-300 ease-out ${barBgColor}`}
                    style={{ width: `${widthPct}%` }}
                    aria-valuenow={val}
                    aria-valuemin={0}
                    aria-valuemax={maxValue}
                    role="progressbar"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Show all / Show less toggle */}
      {hasMore && (
        <div className="mt-4 pt-3 border-t border-[#E4E1DC]/70 dark:border-[#2E2A27]/70 text-center">
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9E2A2B] dark:text-[#D4AF37] hover:underline cursor-pointer focus-visible:outline-2"
          >
            <span>
              {showAll
                ? t('common.showLess', 'Ipakita nang kaunti')
                : `${t('common.showAll', 'Ipakita lahat')} (${sortedData.length})`}
            </span>
            {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      )}
    </div>
  );
};

export default BarList;
