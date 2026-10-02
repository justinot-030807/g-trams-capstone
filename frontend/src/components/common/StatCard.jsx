import React from 'react';

/**
 * Standard StatCard Component for Government Dashboards
 * Minimalist, functional, and consistent:
 * - Label: muted uppercase tracking-wider
 * - Count: 24px/30px font-semibold tabular-nums
 * - Subtext: 12px secondary copy
 * - No decorative icon tiles; consistent height and border
 */
const StatCard = ({
  label = '',
  count = 0,
  subtext = '',
  onClick = null,
  title = '',
  className = '',
  actionLabel = null,
  onAction = null,
}) => {
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick || undefined}
      title={title || label}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`bg-white dark:bg-[#1C1917] p-4 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs flex flex-col justify-between transition-colors ${
        isClickable
          ? 'hover:border-[#9E2A2B]/50 dark:hover:border-[#D4AF37]/50 cursor-pointer active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-[#9E2A2B]'
          : ''
      } ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider truncate">
            {label}
          </p>
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAction();
              }}
              className="text-xs font-medium text-[#9E2A2B] dark:text-[#D4AF37] hover:underline cursor-pointer"
            >
              {actionLabel}
            </button>
          )}
        </div>
        <div className="mt-1.5 flex items-baseline gap-2">
          <p className="text-2xl font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] tabular-nums font-mono">
            {typeof count === 'number' ? count.toLocaleString() : count}
          </p>
        </div>
      </div>

      {subtext && (
        <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-1.5 line-clamp-1">
          {subtext}
        </p>
      )}
    </div>
  );
};

export default StatCard;
