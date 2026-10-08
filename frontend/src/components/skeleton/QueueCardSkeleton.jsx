import React from 'react';
import SkeletonElement from './SkeletonElement';

/**
 * Skeleton loader matching Franchise Approval queue items.
 * Exactly reflects the modern warm-neutral card layout:
 * - Checkbox square & queue sequence number
 * - Applicant full name & metadata tags (Plate, TODA, Application Type)
 * - Semantic status badge
 * - Action buttons / review button
 */
export const QueueCardSkeleton = ({ delay = 40 }) => {
  return (
    <div
      className="stagger-reveal bg-white dark:bg-[#1C1917] rounded-lg p-3.5 sm:p-4 border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Checkbox Placeholder */}
        <SkeletonElement
          rounded="rounded-md"
          className="w-4 h-4 shrink-0"
          delay={delay}
        />

        {/* Queue Position Number */}
        <SkeletonElement
          height="12px"
          className="w-4 shrink-0"
          rounded="rounded-xs"
          delay={delay + 10}
        />

        {/* Applicant & Unit Details */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <SkeletonElement
              height="15px"
              className="w-40 sm:w-52"
              rounded="rounded-md"
              delay={delay + 15}
            />
            <SkeletonElement
              height="14px"
              className="w-16"
              rounded="rounded-xs"
              delay={delay + 25}
            />
          </div>

          {/* Subtitle / Plate & TODA line */}
          <div className="flex items-center gap-2">
            <SkeletonElement
              height="11px"
              className="w-20"
              rounded="rounded-xs"
              delay={delay + 30}
            />
            <SkeletonElement
              height="11px"
              className="w-24"
              rounded="rounded-xs"
              delay={delay + 40}
            />
            <SkeletonElement
              height="11px"
              className="w-16 hidden sm:block"
              rounded="rounded-xs"
              delay={delay + 50}
            />
          </div>
        </div>
      </div>

      {/* Right Controls: Status Badge + Action Buttons */}
      <div className="flex items-center justify-end gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#E4E1DC]/70 dark:border-[#2E2A27]/70">
        <SkeletonElement
          height="24px"
          className="w-24 sm:w-28"
          rounded="rounded-md"
          delay={delay + 55}
        />
        <SkeletonElement
          height="32px"
          className="w-20 sm:w-24"
          rounded="rounded-lg"
          delay={delay + 65}
        />
        <SkeletonElement
          height="32px"
          className="w-8"
          rounded="rounded-lg"
          delay={delay + 75}
        />
      </div>
    </div>
  );
};

export const QueueListSkeleton = ({ count = 4, baseDelay = 40, stepDelay = 50 }) => {
  return (
    <div className="space-y-2 pb-6">
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
