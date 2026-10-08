import React from 'react';
import SkeletonElement from './SkeletonElement';

/**
 * Renders staggered table rows for data tables.
 * Can be used directly inside <tbody> or as full TableSkeleton.
 * Supports any number of columns (3 to 10+) dynamically without column-count mismatches.
 */
export const TableRowsSkeleton = ({
  rows = 6,
  columns = 5,
  baseDelay = 40,
  stepDelay = 45
}) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => {
        const rowDelay = baseDelay + rowIndex * stepDelay;
        return (
          <tr
            key={rowIndex}
            className="stagger-reveal hover:bg-[#F6F5F3]/50 dark:hover:bg-[#14110F]/50 transition-colors"
            style={{ animationDelay: `${rowDelay}ms` }}
          >
            {/* Column 1: Operator / User / Primary Identifier */}
            <td className="p-3.5 pl-5">
              <div className="flex items-center gap-3">
                <SkeletonElement
                  rounded="rounded-lg"
                  className="w-9 h-9 shrink-0"
                  delay={rowDelay}
                />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <SkeletonElement
                    height="13px"
                    className="w-3/4 max-w-[150px]"
                    rounded="rounded-md"
                    delay={rowDelay + 10}
                  />
                  <SkeletonElement
                    height="10px"
                    className="w-1/2 max-w-[100px]"
                    rounded="rounded-sm"
                    delay={rowDelay + 20}
                  />
                </div>
              </div>
            </td>

            {/* Column 2: Vehicle Info / Contact / Detail */}
            <td className="p-3.5">
              <div className="space-y-1.5">
                <SkeletonElement
                  height="14px"
                  className="w-20"
                  rounded="rounded-md"
                  delay={rowDelay + 15}
                />
                <SkeletonElement
                  height="10px"
                  className="w-24"
                  rounded="rounded-sm"
                  delay={rowDelay + 25}
                />
              </div>
            </td>

            {/* Column 3: Association / Location / Role */}
            {columns >= 3 && (
              <td className="p-3.5">
                <div className="space-y-1.5">
                  <SkeletonElement
                    height="12px"
                    className="w-24"
                    rounded="rounded-md"
                    delay={rowDelay + 20}
                  />
                  <SkeletonElement
                    height="9px"
                    className="w-16"
                    rounded="rounded-sm"
                    delay={rowDelay + 30}
                  />
                </div>
              </td>
            )}

            {/* Column 4: Status Badge or Metric */}
            {columns >= 4 && (
              <td className="p-3.5 text-center">
                <div className="flex justify-center">
                  <SkeletonElement
                    height="20px"
                    className="w-18"
                    rounded="rounded-full"
                    delay={rowDelay + 25}
                  />
                </div>
              </td>
            )}

            {/* Column 5: Action Button or Date */}
            {columns >= 5 && (
              <td className={`p-3.5 ${columns === 5 ? 'pr-5 text-center' : ''}`}>
                <div className={`flex ${columns === 5 ? 'justify-center' : 'items-center'} gap-2`}>
                  <SkeletonElement
                    height="28px"
                    className={columns === 5 ? 'w-20' : 'w-24'}
                    rounded="rounded-lg"
                    delay={rowDelay + 30}
                  />
                </div>
              </td>
            )}

            {/* Dynamic Additional Columns (for 6, 7, 8+ columns tables) */}
            {columns > 5 &&
              Array.from({ length: columns - 5 }).map((_, extraIdx) => {
                const colNumber = 6 + extraIdx;
                const isLast = colNumber === columns;
                return (
                  <td
                    key={extraIdx}
                    className={`p-3.5 ${isLast ? 'pr-5 text-right' : ''}`}
                  >
                    <div className={`flex ${isLast ? 'justify-end' : 'items-center'} gap-2`}>
                      <SkeletonElement
                        height={isLast ? '28px' : '12px'}
                        className={isLast ? 'w-20' : 'w-24'}
                        rounded={isLast ? 'rounded-lg' : 'rounded-md'}
                        delay={rowDelay + 35 + extraIdx * 10}
                      />
                    </div>
                  </td>
                );
              })}
          </tr>
        );
      })}
    </>
  );
};

export const TableSkeleton = ({
  rows = 6,
  columns = 5,
  headerTitle = '',
  baseDelay = 30
}) => {
  return (
    <div className="w-full bg-white dark:bg-[#1C1917] rounded-lg shadow-xs border border-[#E4E1DC] dark:border-[#2E2A27] overflow-hidden">
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27] text-xs uppercase tracking-wider font-semibold">
              <th className="p-3.5 pl-5">
                <SkeletonElement height="11px" className="w-24" rounded="rounded-sm" delay={baseDelay} />
              </th>
              <th className="p-3.5">
                <SkeletonElement height="11px" className="w-20" rounded="rounded-sm" delay={baseDelay + 15} />
              </th>
              {columns >= 3 && (
                <th className="p-3.5">
                  <SkeletonElement height="11px" className="w-20" rounded="rounded-sm" delay={baseDelay + 30} />
                </th>
              )}
              {columns >= 4 && (
                <th className="p-3.5 text-center">
                  <div className="flex justify-center">
                    <SkeletonElement height="11px" className="w-16" rounded="rounded-sm" delay={baseDelay + 45} />
                  </div>
                </th>
              )}
              {columns >= 5 && (
                <th className={`p-3.5 ${columns === 5 ? 'text-center pr-5' : ''}`}>
                  <div className={`flex ${columns === 5 ? 'justify-center' : 'items-center'}`}>
                    <SkeletonElement height="11px" className="w-16" rounded="rounded-sm" delay={baseDelay + 60} />
                  </div>
                </th>
              )}
              {columns > 5 &&
                Array.from({ length: columns - 5 }).map((_, extraIdx) => {
                  const isLast = 6 + extraIdx === columns;
                  return (
                    <th key={extraIdx} className={`p-3.5 ${isLast ? 'text-right pr-5' : ''}`}>
                      <div className={`flex ${isLast ? 'justify-end' : 'items-center'}`}>
                        <SkeletonElement
                          height="11px"
                          className="w-16"
                          rounded="rounded-sm"
                          delay={baseDelay + 70 + extraIdx * 15}
                        />
                      </div>
                    </th>
                  );
                })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27]">
            <TableRowsSkeleton rows={rows} columns={columns} baseDelay={baseDelay + 60} />
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableSkeleton;
