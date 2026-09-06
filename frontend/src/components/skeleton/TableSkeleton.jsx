import React from 'react';
import SkeletonElement from './SkeletonElement';

/**
 * Renders staggered table rows for data tables.
 * Can be used directly inside <tbody> or as full TableSkeleton.
 */
export const TableRowsSkeleton = ({
  rows = 6,
  columns = 5,
  baseDelay = 50,
  stepDelay = 60
}) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => {
        const rowDelay = baseDelay + rowIndex * stepDelay;
        return (
          <tr
            key={rowIndex}
            className="stagger-reveal hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
            style={{ animationDelay: `${rowDelay}ms` }}
          >
            {/* Column 1: Operator / User / Primary Identifier */}
            <td className="p-4 pl-6">
              <div className="flex items-center gap-3">
                <SkeletonElement
                  rounded="rounded-full"
                  className="w-10 h-10 shrink-0"
                  delay={rowDelay}
                />
                <div className="space-y-1.5 flex-1">
                  <SkeletonElement
                    height="14px"
                    className="w-3/4 max-w-[160px]"
                    rounded="rounded-md"
                    delay={rowDelay + 10}
                  />
                  <SkeletonElement
                    height="10px"
                    className="w-1/2 max-w-[110px]"
                    rounded="rounded-sm"
                    delay={rowDelay + 20}
                  />
                </div>
              </div>
            </td>

            {/* Column 2: Vehicle Info / Contact */}
            <td className="p-4">
              <div className="space-y-1.5">
                <SkeletonElement
                  height="18px"
                  className="w-20"
                  rounded="rounded-md"
                  delay={rowDelay + 15}
                />
                <SkeletonElement
                  height="10px"
                  className="w-28"
                  rounded="rounded-sm"
                  delay={rowDelay + 25}
                />
              </div>
            </td>

            {/* Column 3: Association / Location / Details */}
            {columns >= 3 && (
              <td className="p-4">
                <div className="space-y-1.5">
                  <SkeletonElement
                    height="13px"
                    className="w-24"
                    rounded="rounded-md"
                    delay={rowDelay + 20}
                  />
                  <SkeletonElement
                    height="10px"
                    className="w-16"
                    rounded="rounded-sm"
                    delay={rowDelay + 30}
                  />
                </div>
              </td>
            )}

            {/* Column 4: Status Badge */}
            {columns >= 4 && (
              <td className="p-4 text-center">
                <div className="flex justify-center">
                  <SkeletonElement
                    height="22px"
                    className="w-20"
                    rounded="rounded-full"
                    delay={rowDelay + 25}
                  />
                </div>
              </td>
            )}

            {/* Column 5: Actions */}
            {columns >= 5 && (
              <td className="p-4 pr-6 text-center">
                <div className="flex justify-center items-center gap-2">
                  <SkeletonElement
                    height="28px"
                    className="w-20"
                    rounded="rounded-xl"
                    delay={rowDelay + 30}
                  />
                </div>
              </td>
            )}
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
  baseDelay = 40
}) => {
  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="overflow-x-auto min-h-[320px]">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[11px] uppercase tracking-wider font-bold">
              <th className="p-4 pl-6">
                <SkeletonElement height="12px" className="w-28" rounded="rounded-sm" delay={baseDelay} />
              </th>
              <th className="p-4">
                <SkeletonElement height="12px" className="w-24" rounded="rounded-sm" delay={baseDelay + 20} />
              </th>
              {columns >= 3 && (
                <th className="p-4">
                  <SkeletonElement height="12px" className="w-24" rounded="rounded-sm" delay={baseDelay + 40} />
                </th>
              )}
              {columns >= 4 && (
                <th className="p-4 text-center">
                  <div className="flex justify-center">
                    <SkeletonElement height="12px" className="w-16" rounded="rounded-sm" delay={baseDelay + 60} />
                  </div>
                </th>
              )}
              {columns >= 5 && (
                <th className="p-4 text-center pr-6">
                  <div className="flex justify-center">
                    <SkeletonElement height="12px" className="w-16" rounded="rounded-sm" delay={baseDelay + 80} />
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            <TableRowsSkeleton rows={rows} columns={columns} baseDelay={baseDelay + 100} />
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableSkeleton;
