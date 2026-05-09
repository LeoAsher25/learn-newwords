interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  // Logic để hiển thị các page numbers thông minh
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 4;
    const halfWindow = Math.floor(maxPagesToShow / 2);

    let startPage = Math.max(1, currentPage - halfWindow);
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // Điều chỉnh startPage nếu endPage không đủ trang
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    // Thêm trang đầu
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push("...");
      }
    }

    // Thêm các trang giữa
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Thêm trang cuối
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push("...");
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-1 py-4">
      {/* Nút Previous */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-50">
        <div className="-mt-[2px] mb-[2px]">←</div>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-2 py-1.5 text-sm text-slate-600">
                …
              </span>
            );
          }

          const pageNum = page as number;
          const isCurrentPage = pageNum === currentPage;

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isCurrentPage
                  ? "bg-slate-900 text-white shadow-sm hover:bg-slate-800"
                  : "border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-200"
              }`}>
              {pageNum}
            </button>
          );
        })}
      </div>

      {/* Nút Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-50">
        <div className="-mt-[2px] mb-[2px]">→</div>
      </button>
    </div>
  );
}
