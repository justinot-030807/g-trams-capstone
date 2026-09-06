import React from 'react';
import SkeletonElement from './SkeletonElement';

/**
 * Skeleton loader matching Franchise Approval queue items.
 */
export const QueueCardSkeleton = ({ delay = 60 }) => {
  return (
    <div
      className="stagger-reveal bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-4 flex-1">
        {/* Left Icon Square */}
        <SkeletonElement
          rounded="rounded-2xl"
          className="w-12 h-12 shrink-0"
          delay={delay}
        />

        <div className="space-y-2.5 flex-1">
          {/* Queue Tag & Applicant Name */}
          <div className="flex flex-wrap items-center gap-2">
            <SkeletonElement
              height="20px"
              className="w-16"
              rounded="rounded-md"
              delay={delay + 10}
            />
            <SkeletonElement
              height="22px"
              className="w-48 max-w-[240px]"
              rounded="rounded-lg"
              delay={delay + 20}
            />
          </div>

          {/* Metadata tags */}
          <div className="flex flex-wrap gap-2">
            <SkeletonElement
              height="16px"
              className="w-24"
              rounded="rounded-md"
              delay={delay + 30}
            />
            <SkeletonElement
              height="16px"
              className="w-28"
              rounded="rounded-md"
              delay={delay + 40}
            />
            <SkeletonElement
              height="16px"
              className="w-20"
              rounded="rounded-md"
              delay={delay + 50}
            />
            <SkeletonElement
              height="16px"
              className="w-32"
              rounded="rounded-md"
              delay={delay + 60}
            />
          </div>
        </div>
      </div>

      {/* Review Button Placeholder */}
      <SkeletonElement
        height="38px"
        className="w-full md:w-36 shrink-0"
        rounded="rounded-xl"
        delay={delay + 70}
      />
    </div>
  );
};

export const QueueListSkeleton = ({ count = 4, baseDelay = 50, stepDelay = 65 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <QueueCardSkeleton
          key={index}
          delay={baseDelay + index * stepDelay}
        />
      ))}
    </div>
  );
};

export default QueueCardSkeleton;
