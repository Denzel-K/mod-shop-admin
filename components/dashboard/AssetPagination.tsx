"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface AssetPaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  className?: string;
}

export function AssetPagination({ pagination, onPageChange, onPageSizeChange, className }: AssetPaginationProps) {
  const { page, pageSize, totalCount, totalPages, hasNextPage, hasPrevPage } = pagination;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page > 4) {
        pages.push('ellipsis');
      }

      // Show pages around current page
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 3) {
        pages.push('ellipsis');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4", className)}>
      {/* Results info and page size selector */}
      <div className="flex items-center gap-4 text-sm text-slate-400">
        <span>
          Showing {startItem}-{endItem} of {totalCount} results
        </span>
        <div className="flex items-center gap-2">
          <span>Show:</span>
          <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger className="w-16 h-8 bg-slate-800 border-slate-700 text-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="10" className="text-slate-200 hover:bg-slate-700">10</SelectItem>
              <SelectItem value="15" className="text-slate-200 hover:bg-slate-700">15</SelectItem>
              <SelectItem value="20" className="text-slate-200 hover:bg-slate-700">20</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className="h-8 w-8 p-0 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pageNumbers.map((pageNum, index) => (
          pageNum === 'ellipsis' ? (
            <div key={`ellipsis-${index}`} className="flex h-8 w-8 items-center justify-center">
              <MoreHorizontal className="h-4 w-4 text-slate-500" />
            </div>
          ) : (
            <Button
              key={pageNum}
              variant={pageNum === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              className={cn(
                "h-8 w-8 p-0",
                pageNum === page
                  ? "bg-cyan-600 text-white border-cyan-600 hover:bg-cyan-500"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              )}
            >
              {pageNum}
            </Button>
          )
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="h-8 w-8 p-0 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
