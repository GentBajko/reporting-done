import React from 'react';
import type { Pagination } from '../../types';
import PaginationControls from './PaginationControls';

interface Column<T> {
  header: string;
  accessor?: keyof T | ((item: T) => React.ReactNode);
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

function DataTable<T extends { id: string | number }>({
  columns,
  data,
  pagination,
  onPageChange,
  isLoading,
  emptyMessage = "No data found."
}: DataTableProps<T>) {

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-sm">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className={`px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
               <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-gray-500 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition duration-150">
                  {columns.map((col, idx) => (
                    <td key={idx} className={`px-3 py-2 whitespace-nowrap text-sm text-gray-700 ${col.className || ''}`}>
                      {col.render
                        ? col.render(item)
                        : typeof col.accessor === 'function'
                        ? col.accessor(item)
                        : (col.accessor ? (item[col.accessor] as React.ReactNode) : null)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && onPageChange && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-white">
          <PaginationControls pagination={pagination} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
}

export default DataTable;

