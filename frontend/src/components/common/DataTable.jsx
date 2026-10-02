import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * Standard DataTable Component for G-TRAMS Administration
 * Clean, compact, accessible, and consistent table layout.
 *
 * @param {Array} columns - Array of { key, header, render, align, width, className }
 * @param {Array} data - Array of row objects
 * @param {boolean} isLoading - Loading skeleton state
 * @param {string} emptyTitle - Text title when data is empty
 * @param {string} emptySubtitle - Description when data is empty
 * @param {string} rowKey - Property key or function to derive React key
 * @param {Function} onRowClick - Optional row click handler
 */
const DataTable = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyTitle = 'Walang talaan',
  emptySubtitle = 'Kasalukuyang walang laman ang listahang ito.',
  rowKey = '_id',
  onRowClick = null,
  className = '',
}) => {
  const getRowId = (row, idx) => {
    if (typeof rowKey === 'function') return rowKey(row, idx);
    return row[rowKey] || idx;
  };

  return (
    <div className={`w-full overflow-hidden rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] ${className}`}>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3]/70 dark:bg-[#14110F]/70 text-[#6B6761] dark:text-[#A8A29E]">
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  className={`py-2.5 px-3 font-semibold uppercase tracking-wider text-xs select-none ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  } ${col.headerClassName || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E4E1DC]/70 dark:divide-[#2E2A27]/70 text-[#1F1D1B] dark:text-[#F6F5F3]">
            {isLoading ? (
              // Clean Skeleton rows
              Array.from({ length: 4 }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                  {columns.map((col, cIdx) => (
                    <td key={`skel-cell-${cIdx}`} className="py-3 px-3">
                      <div className="h-3.5 bg-[#E4E1DC]/60 dark:bg-[#2E2A27]/60 rounded-sm w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data && data.length > 0 ? (
              data.map((row, rIdx) => {
                const id = getRowId(row, rIdx);
                const isClickable = Boolean(onRowClick);

                return (
                  <tr
                    key={id}
                    onClick={isClickable ? () => onRowClick(row) : undefined}
                    className={`transition-colors ${
                      isClickable
                        ? 'hover:bg-[#F6F5F3]/70 dark:hover:bg-[#2E2A27]/40 cursor-pointer'
                        : 'hover:bg-[#F6F5F3]/40 dark:hover:bg-[#2E2A27]/20'
                    }`}
                  >
                    {columns.map((col, cIdx) => (
                      <td
                        key={col.key || cIdx}
                        className={`py-2.5 px-3 align-middle text-xs ${
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                        } ${col.className || ''}`}
                      >
                        {col.render ? col.render(row, rIdx) : row[col.key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-10 px-4 text-center">
                  <div className="flex flex-col items-center justify-center text-[#6B6761] dark:text-[#A8A29E]">
                    <Inbox size={26} className="mb-2 stroke-1 opacity-70" aria-hidden="true" />
                    <p className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{emptyTitle}</p>
                    <p className="text-xs mt-0.5 max-w-sm">{emptySubtitle}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
