import React from 'react';
import SkeletonElement from './SkeletonElement';

/**
 * Full-screen workbench skeleton loader for FranchiseReviewPage.
 * Exactly reproduces the municipal evaluator workstation layout:
 * - Top header with applicant info, queue navigator, and action triggers
 * - Left pane: Applicant summary, background check badge, and document checklist items
 * - Right studio pane: Canvas toolbar and central document paper sheet
 */
export const FranchiseReviewSkeleton = ({ baseDelay = 30 }) => {
  return (
    <div className="fixed inset-0 w-full h-full flex flex-col bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#EAE7E1] overflow-hidden select-none z-50">
      
      {/* 1. TOP HEADER: WORKBENCH TOOLBAR */}
      <header className="h-14 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 shadow-xs">
        {/* Left: Back & Applicant Title */}
        <div className="flex items-center gap-3 min-w-0">
          <SkeletonElement height="32px" className="w-18" rounded="rounded-lg" delay={baseDelay} />
          <div className="h-5 w-px bg-white/20 hidden sm:block" />
          <div className="flex items-center gap-2">
            <SkeletonElement height="16px" className="w-36 sm:w-48" rounded="rounded-md" delay={baseDelay + 10} />
            <SkeletonElement height="22px" className="w-24" rounded="rounded-md" delay={baseDelay + 20} />
          </div>
        </div>

        {/* Center: Queue Navigator */}
        <div className="hidden sm:flex items-center gap-2 bg-black/30 p-1.5 rounded-lg border border-white/10">
          <SkeletonElement height="18px" className="w-28" rounded="rounded-md" delay={baseDelay + 25} />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <SkeletonElement height="34px" className="w-24 hidden md:block" rounded="rounded-lg" delay={baseDelay + 30} />
          <SkeletonElement height="34px" className="w-24 sm:w-32" rounded="rounded-lg" delay={baseDelay + 40} />
        </div>
      </header>

      {/* 2. MAIN WORKBENCH 2-COLUMN VIEW */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        
        {/* LEFT COLUMN: INSPECTION & DOCUMENTS CHECKLIST */}
        <aside className="w-full md:w-[340px] lg:w-[380px] bg-white dark:bg-[#1C1917] border-r border-[#E4E1DC] dark:border-[#2E2A27] flex flex-col shrink-0 h-full overflow-y-auto p-3.5 space-y-3 shadow-xs">
          {/* Applicant Summary Box */}
          <div className="bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <SkeletonElement height="13px" className="w-28" rounded="rounded-xs" delay={baseDelay + 50} />
              <SkeletonElement height="13px" className="w-16" rounded="rounded-xs" delay={baseDelay + 55} />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="space-y-1">
                <SkeletonElement height="9px" className="w-12" rounded="rounded-xs" delay={baseDelay + 60} />
                <SkeletonElement height="13px" className="w-28" rounded="rounded-xs" delay={baseDelay + 65} />
              </div>
              <div className="space-y-1">
                <SkeletonElement height="9px" className="w-12" rounded="rounded-xs" delay={baseDelay + 70} />
                <SkeletonElement height="13px" className="w-24" rounded="rounded-xs" delay={baseDelay + 75} />
              </div>
              <div className="space-y-1">
                <SkeletonElement height="9px" className="w-16" rounded="rounded-xs" delay={baseDelay + 80} />
                <SkeletonElement height="13px" className="w-24" rounded="rounded-xs" delay={baseDelay + 85} />
              </div>
              <div className="space-y-1">
                <SkeletonElement height="9px" className="w-14" rounded="rounded-xs" delay={baseDelay + 90} />
                <SkeletonElement height="13px" className="w-20" rounded="rounded-xs" delay={baseDelay + 95} />
              </div>
            </div>
          </div>

          {/* Record Check Box */}
          <div className="bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-3 flex items-center justify-between">
            <div className="space-y-1">
              <SkeletonElement height="13px" className="w-36" rounded="rounded-xs" delay={baseDelay + 100} />
              <SkeletonElement height="10px" className="w-28" rounded="rounded-xs" delay={baseDelay + 105} />
            </div>
            <SkeletonElement height="22px" className="w-20" rounded="rounded-md" delay={baseDelay + 110} />
          </div>

          {/* Document Checklist Items */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between pb-1">
              <SkeletonElement height="12px" className="w-32" rounded="rounded-xs" delay={baseDelay + 115} />
              <SkeletonElement height="12px" className="w-12" rounded="rounded-xs" delay={baseDelay + 120} />
            </div>

            {[
              'Official Receipt (LTO OR)',
              'Certificate of Reg (LTO CR)',
              "Driver's License (Front)",
              'Barangay Clearance',
              'TODA Endorsement Cert',
              'Cedula (CTC)'
            ].map((_, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3]/60 dark:bg-[#14110F]/60 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <SkeletonElement rounded="rounded-md" className="w-7 h-7 shrink-0" delay={baseDelay + 125 + idx * 15} />
                  <SkeletonElement height="13px" className="w-36 sm:w-44" rounded="rounded-xs" delay={baseDelay + 130 + idx * 15} />
                </div>
                <SkeletonElement height="18px" className="w-14" rounded="rounded-xs" delay={baseDelay + 135 + idx * 15} />
              </div>
            ))}
          </div>
        </aside>

        {/* RIGHT COLUMN: CANVAS STUDIO & DOCUMENT VIEWER */}
        <main className="flex-1 flex flex-col bg-[#EAE7E1] dark:bg-[#0D0B0A] relative overflow-hidden">
          {/* Canvas Studio Toolbar */}
          <div className="h-11 px-4 bg-white/80 dark:bg-[#1C1917]/80 backdrop-blur-sm border-b border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <SkeletonElement height="14px" className="w-36" rounded="rounded-xs" delay={baseDelay + 200} />
              <SkeletonElement height="18px" className="w-20" rounded="rounded-md" delay={baseDelay + 210} />
            </div>
            <div className="flex items-center gap-1.5">
              <SkeletonElement height="28px" className="w-24" rounded="rounded-lg" delay={baseDelay + 220} />
              <SkeletonElement height="28px" className="w-8" rounded="rounded-lg" delay={baseDelay + 230} />
              <SkeletonElement height="28px" className="w-8" rounded="rounded-lg" delay={baseDelay + 240} />
            </div>
          </div>

          {/* Central Document Paper Placeholder */}
          <div className="flex-1 flex items-center justify-center p-6 sm:p-10 overflow-hidden">
            <div className="w-full max-w-lg aspect-[3/4] bg-white dark:bg-[#1C1917] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-lg p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                <SkeletonElement rounded="rounded-lg" className="w-12 h-12" delay={baseDelay + 250} />
                <div className="space-y-1.5 text-right flex flex-col items-end">
                  <SkeletonElement height="12px" className="w-32" rounded="rounded-xs" delay={baseDelay + 260} />
                  <SkeletonElement height="10px" className="w-24" rounded="rounded-xs" delay={baseDelay + 270} />
                </div>
              </div>
              <div className="space-y-3 flex-1 flex flex-col justify-center">
                <SkeletonElement height="14px" className="w-3/4" rounded="rounded-xs" delay={baseDelay + 280} />
                <SkeletonElement height="14px" className="w-full" rounded="rounded-xs" delay={baseDelay + 290} />
                <SkeletonElement height="14px" className="w-5/6" rounded="rounded-xs" delay={baseDelay + 300} />
                <SkeletonElement height="14px" className="w-2/3" rounded="rounded-xs" delay={baseDelay + 310} />
              </div>
              <div className="pt-4 border-t border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-between">
                <SkeletonElement height="12px" className="w-24" rounded="rounded-xs" delay={baseDelay + 320} />
                <SkeletonElement height="24px" className="w-28" rounded="rounded-md" delay={baseDelay + 330} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FranchiseReviewSkeleton;
