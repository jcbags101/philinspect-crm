import * as React from "react"

import { cn } from "@/lib/utils"

function DataToolbar({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-toolbar"
      className={cn(
        "flex min-w-0 flex-col gap-[var(--pi-space-2)] border-b border-[var(--pi-border-default)] bg-[var(--pi-surface-raised)] p-[var(--pi-space-3)] sm:flex-row sm:items-center",
        className
      )}
      {...props}
    />
  )
}

function DataToolbarSearch({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-toolbar-search"
      className={cn("min-w-0 flex-1 sm:max-w-80", className)}
      {...props}
    />
  )
}

function DataToolbarFilters({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-toolbar-filters"
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-[var(--pi-space-2)]",
        className
      )}
      {...props}
    />
  )
}

function DataToolbarActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-toolbar-actions"
      className={cn(
        "flex flex-wrap items-center gap-[var(--pi-space-2)] sm:ml-auto",
        className
      )}
      {...props}
    />
  )
}

export {
  DataToolbar,
  DataToolbarActions,
  DataToolbarFilters,
  DataToolbarSearch,
}
