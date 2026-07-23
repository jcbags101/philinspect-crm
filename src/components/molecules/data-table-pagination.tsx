"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DataTablePaginationProps extends Omit<
  React.ComponentProps<"nav">,
  "onChange"
> {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  disabled?: boolean
  label?: string
}

function DataTablePagination({
  page,
  pageCount,
  onPageChange,
  disabled = false,
  label = "Table pagination",
  className,
  ...props
}: DataTablePaginationProps) {
  const safePageCount = Math.max(1, pageCount)
  const safePage = Math.min(Math.max(1, page), safePageCount)

  return (
    <nav
      data-slot="data-table-pagination"
      aria-label={label}
      className={cn(
        "flex items-center gap-[var(--pi-space-2)]",
        className
      )}
      {...props}
    >
      <Button
        type="button"
        size="icon-xs"
        variant="outline"
        aria-label="Previous page"
        disabled={disabled || safePage <= 1}
        onClick={() => onPageChange(safePage - 1)}
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <span
        className="min-w-16 text-center text-[10px] leading-[14px] text-[var(--pi-content-secondary)]"
        aria-live="polite"
      >
        Page {safePage} of {safePageCount}
      </span>
      <Button
        type="button"
        size="icon-xs"
        variant="outline"
        aria-label="Next page"
        disabled={disabled || safePage >= safePageCount}
        onClick={() => onPageChange(safePage + 1)}
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </nav>
  )
}

export { DataTablePagination, type DataTablePaginationProps }
