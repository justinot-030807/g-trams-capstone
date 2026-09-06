import React from 'react';
import SkeletonElement from './SkeletonElement';

/**
 * Renders staggered metric / KPI stat cards.
 * Useful for dashboards and reports overviews.
 */
const StatsCardsSkeleton = ({
  count = 4,
  gridClassName = 'grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6',
  baseDelay = 40,
  stepDelay = 50
}) => {
  return (
    <div className={gridClassName}>
      {Array.from({ length: count }).map((_, index) => {
        const cardDelay = baseDelay + index * stepDelay;
        return (
          <div
            key={index}
            className="stagger-reveal bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs relative overflow-hidden"
            style={{ animationDelay: `${cardDelay}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <SkeletonElement
                rounded="rounded-2xl"
                className="w-10 h-10 sm:w-12 sm:h-12"
                delay={cardDelay}
              />
              <SkeletonElement
                height="16px"
                className="w-14"
                rounded="rounded-full"
                delay={cardDelay + 15}
              />
            </div>

            <div className="space-y-2">
              <SkeletonElement
                height="28px"
                className="w-20 sm:w-24"
                rounded="rounded-lg"
                delay={cardDelay + 25}
              />
              <SkeletonElement
                height="12px"
                className="w-32 max-w-full"
                rounded="rounded-sm"
                delay={cardDelay + 35}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCardsSkeleton;
