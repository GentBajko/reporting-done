import React from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import type { Pagination } from '../../types';

interface PaginationControlsProps {
  pagination: Pagination;
  onPageChange: (page: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({ pagination, onPageChange }) => {
  const { page, total_pages, has_next, has_prev, total, per_page } = pagination;

  const startItem = (page - 1) * per_page + 1;
  const endItem = Math.min(page * per_page, total);

  return (
    <div className="flex items-center justify-center bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-center sm:hidden">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!has_prev}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="mx-4 text-sm text-gray-500 self-center">
          {page} / {total_pages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!has_next}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:items-center sm:gap-6">
        <p className="text-sm text-gray-500">
          {startItem}-{endItem} of {total}
        </p>
        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={!has_prev}
            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="sr-only">Previous</span>
            <HiChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          
          {[...Array(total_pages)].map((_, i) => {
              const p = i + 1;
              if (p === 1 || p === total_pages || (p >= page - 1 && p <= page + 1)) {
                 return (
                  <button
                      key={p}
                      onClick={() => onPageChange(p)}
                      aria-current={page === p ? 'page' : undefined}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          page === p
                              ? 'z-10 bg-[#002F41] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#002F41]'
                              : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }`}
                  >
                      {p}
                  </button>
                 );
              } else if (p === page - 2 || p === page + 2) {
                  return <span key={p} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">...</span>
              }
              return null;
          })}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={!has_next}
            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="sr-only">Next</span>
            <HiChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </nav>
      </div>
    </div>
  );
};

export default PaginationControls;

