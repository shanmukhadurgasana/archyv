import React from "react";
import clsx from "clsx";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  label?: string;
}

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  totalItems,
  itemsPerPage,
  label = "files"
}: PaginationProps) {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    // Show first, last, and pages around current page
    if (
      i === 1 || 
      i === totalPages || 
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (
      (i === currentPage - 2 && i > 1) ||
      (i === currentPage + 2 && i < totalPages)
    ) {
      pages.push("...");
    }
  }

  // Remove duplicate ellipses
  const displayPages = pages.filter((page, index, arr) => {
    if (page === "..." && arr[index - 1] === "...") return false;
    return true;
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
      <div className="text-sm text-gray-500">
        Showing {startItem} to {endItem} of {totalItems} {label}
      </div>
      
      <div className="flex items-center gap-1">
        <button 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          &lt;
        </button>
        
        {displayPages.map((page, index) => (
          page === "..." ? (
            <span key={`ellipsis-${index}`} className="w-8 h-8 flex items-center justify-center text-gray-400">...</span>
          ) : (
            <button
              key={`page-${page}`}
              onClick={() => onPageChange(page as number)}
              className={clsx(
                "w-8 h-8 flex items-center justify-center rounded font-medium transition-colors",
                currentPage === page 
                  ? "bg-[var(--archyv-accent)]/20 text-foreground border border-[var(--archyv-accent)]/50" 
                  : "text-gray-600 hover:bg-gray-50 border border-transparent"
              )}
            >
              {page}
            </button>
          )
        ))}
        
        <button 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          &gt;
        </button>
      </div>

      <div className="hidden sm:flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 bg-white">
        <select className="text-sm font-medium text-gray-600 bg-transparent border-none focus:outline-none appearance-none pr-4 cursor-pointer outline-none">
          <option>{itemsPerPage} per page</option>
        </select>
      </div>
    </div>
  );
}
