"use client"

import * as React from "react"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { EmptyState, type EmptyStateProps } from "./empty-state"

type DataTableAlignment = "start" | "center" | "end"
type DataTableSortDirection = "asc" | "desc"

interface DataTableSort {
  id: string
  direction: DataTableSortDirection
}

interface DataTableColumn<T> {
  id: string
  header: React.ReactNode
  cell: (row: T) => React.ReactNode
  align?: DataTableAlignment
  sortable?: boolean
  width?: React.CSSProperties["width"]
  headerClassName?: string
  cellClassName?: string
}

interface DataTableProps<T> {
  rows: T[]
  columns: DataTableColumn<T>[]
  getRowId: (row: T) => string
  caption: string
  density?: "comfortable" | "compact"
  sort?: DataTableSort
  onSortChange?: (sort: DataTableSort) => void
  loading?: boolean
  loadingRowCount?: number
  empty?: EmptyStateProps
  footer?: React.ReactNode
  rowClassName?: (row: T) => string | undefined
  className?: string
}

const alignmentClasses: Record<DataTableAlignment, string> = {
  start: "text-left",
  center: "text-center",
  end: "text-right",
}

function DataTable<T>({
  rows,
  columns,
  getRowId,
  caption,
  density = "comfortable",
  sort,
  onSortChange,
  loading = false,
  loadingRowCount = 5,
  empty = { title: "No results" },
  footer,
  rowClassName,
  className,
}: DataTableProps<T>) {
  const changeSort = (column: DataTableColumn<T>) => {
    if (!column.sortable || !onSortChange) return
    const direction =
      sort?.id === column.id && sort.direction === "asc" ? "desc" : "asc"
    onSortChange({ id: column.id, direction })
  }

  return (
    <div
      data-slot="data-table"
      className={cn(
        "overflow-hidden rounded-[var(--pi-radius-md)] border border-[var(--pi-border-default)] bg-[var(--pi-surface-raised)] shadow-[var(--pi-shadow-card)]",
        className
      )}
      aria-busy={loading || undefined}
    >
      <Table className="min-w-[640px]">
        <caption className="sr-only">{caption}</caption>
        <TableHeader>
          <TableRow className="h-9 bg-[var(--pi-surface-subtle)] hover:bg-[var(--pi-surface-subtle)]">
            {columns.map((column) => {
              const activeSort = sort?.id === column.id ? sort.direction : null
              const alignment = column.align ?? "start"

              return (
                <TableHead
                  key={column.id}
                  scope="col"
                  aria-sort={
                    activeSort
                      ? activeSort === "asc"
                        ? "ascending"
                        : "descending"
                      : column.sortable
                        ? "none"
                        : undefined
                  }
                  style={{ width: column.width }}
                  className={cn(
                    "h-9 px-[var(--pi-space-3)] text-[10px] leading-[14px] font-medium text-[var(--pi-content-secondary)]",
                    alignmentClasses[alignment],
                    column.headerClassName
                  )}
                >
                  {column.sortable && onSortChange ? (
                    <button
                      type="button"
                      onClick={() => changeSort(column)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-[var(--pi-radius-sm)] outline-none hover:text-[var(--pi-content-primary)] focus-visible:shadow-[var(--pi-focus-ring)]",
                        alignment === "end" && "flex-row-reverse"
                      )}
                    >
                      {column.header}
                      {activeSort === "asc" ? (
                        <ArrowUp aria-hidden="true" className="size-3" />
                      ) : activeSort === "desc" ? (
                        <ArrowDown aria-hidden="true" className="size-3" />
                      ) : (
                        <ChevronsUpDown
                          aria-hidden="true"
                          className="size-3 opacity-60"
                        />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from(
                { length: Math.max(1, loadingRowCount) },
                (_, rowIndex) => (
                  <TableRow key={`loading-${rowIndex}`} aria-hidden="true">
                    {columns.map((column, columnIndex) => (
                      <TableCell
                        key={column.id}
                        className={cn(
                          "px-[var(--pi-space-3)]",
                          density === "compact" ? "h-9" : "h-12"
                        )}
                      >
                        <Skeleton
                          className={cn(
                            "h-3 rounded-[var(--pi-radius-sm)]",
                            columnIndex === 0 ? "w-4/5" : "w-3/5"
                          )}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                )
              )
            : rows.map((row) => (
                <TableRow
                  key={getRowId(row)}
                  className={cn(
                    "text-[11px] leading-[14px]",
                    rowClassName?.(row)
                  )}
                >
                  {columns.map((column) => {
                    const alignment = column.align ?? "start"
                    return (
                      <TableCell
                        key={column.id}
                        className={cn(
                          "px-[var(--pi-space-3)] text-[var(--pi-content-primary)]",
                          density === "compact" ? "h-9 py-1.5" : "h-12 py-2",
                          alignmentClasses[alignment],
                          column.cellClassName
                        )}
                      >
                        {column.cell(row)}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
          {!loading && rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={Math.max(1, columns.length)} className="p-0">
                <EmptyState {...empty} />
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
      {footer ? (
        <div className="flex min-h-10 flex-wrap items-center justify-between gap-[var(--pi-space-2)] border-t border-[var(--pi-border-default)] px-[var(--pi-space-3)] py-[var(--pi-space-2)]">
          {footer}
        </div>
      ) : null}
    </div>
  )
}

export {
  DataTable,
  type DataTableAlignment,
  type DataTableColumn,
  type DataTableProps,
  type DataTableSort,
  type DataTableSortDirection,
}
