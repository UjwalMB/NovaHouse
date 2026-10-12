import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
}) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 bg-[#FAF8F5] border-t border-[#ECE8E0] text-xs font-mono text-[#77736C]">
      <div>
        Showing <strong className="text-[#111111]">{startItem}</strong> to{' '}
        <strong className="text-[#111111]">{endItem}</strong> of{' '}
        <strong className="text-[#111111]">{totalItems}</strong> entries
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 border border-[#E2DDD5] bg-[#FFFFFF] rounded-xs disabled:opacity-40 hover:bg-[#F4F1EB] transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        <span className="px-3 py-1 font-medium text-[#111111]">
          {currentPage} / {Math.max(1, totalPages)}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 border border-[#E2DDD5] bg-[#FFFFFF] rounded-xs disabled:opacity-40 hover:bg-[#F4F1EB] transition-colors"
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
