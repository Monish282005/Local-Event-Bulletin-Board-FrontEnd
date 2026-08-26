import React from 'react';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 6,
  onPageChange,
}) {
  if (totalItems === 0) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-4 border-t border-[#E8E7EF]/60">
      <div className="text-xs text-[#68677A] font-medium">
        Showing <span className="font-bold text-[#11112A]">{startItem}</span> to{' '}
        <span className="font-bold text-[#11112A]">{endItem}</span> of{' '}
        <span className="font-bold text-[#11112A]">{totalItems}</span> events
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-1.5 rounded-lg border border-[#E8E7EF] bg-white text-xs font-semibold text-[#11112A] hover:bg-[#F4F3F8] hover:border-[#D5D3E5] disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          ← Prev
        </button>

        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center ${
              page === currentPage
                ? 'bg-[#5B4BFF] text-white shadow-sm shadow-[#5B4BFF]/30'
                : 'bg-white border border-[#E8E7EF] text-[#68677A] hover:bg-[#F4F3F8] hover:text-[#11112A]'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-1.5 rounded-lg border border-[#E8E7EF] bg-white text-xs font-semibold text-[#11112A] hover:bg-[#F4F3F8] hover:border-[#D5D3E5] disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
