import React from 'react';
import SkeletonElement from './SkeletonElement';

/**
 * Skeleton loader for the Document Vault modal in OperatorSettings.
 */
export const DocumentVaultSkeleton = ({ count = 4, baseDelay = 30 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, idx) => {
        const delay = baseDelay + idx * 45;
        return (
          <div
            key={idx}
            className="stagger-reveal bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-3.5 shadow-xs space-y-3 flex flex-col justify-between"
            style={{ animationDelay: `${delay}ms` }}
          >
            {/* Header: Label & Status */}
            <div className="flex items-center justify-between gap-2">
              <SkeletonElement height="14px" className="w-32" rounded="rounded-xs" delay={delay} />
              <SkeletonElement height="20px" className="w-18" rounded="rounded-full" delay={delay + 10} />
            </div>

            {/* Thumbnail Box */}
            <div className="w-full h-32 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-center p-3">
              <SkeletonElement rounded="rounded-lg" className="w-12 h-12" delay={delay + 20} />
            </div>

            {/* Metadata and Actions */}
            <div className="space-y-2 pt-1 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
              <div className="flex justify-between items-center text-xs">
                <SkeletonElement height="10px" className="w-20" rounded="rounded-xs" delay={delay + 30} />
                <SkeletonElement height="10px" className="w-24" rounded="rounded-xs" delay={delay + 40} />
              </div>
              <SkeletonElement height="32px" className="w-full" rounded="rounded-lg" delay={delay + 50} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DocumentVaultSkeleton;
