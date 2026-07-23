"use client"

import * as React from "react"
import { LoaderCircle, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type SearchFieldProps = Omit<
  React.ComponentProps<typeof Input>,
  "onChange" | "type" | "value"
> & {
  value: string
  onValueChange: (value: string) => void
  label: string
  loading?: boolean
  onClear?: () => void
  resultCount?: number
  resultLabel?: string
  inputClassName?: string
}

function SearchField({
  className,
  value,
  onValueChange,
  label,
  loading = false,
  onClear,
  resultCount,
  resultLabel = "results",
  inputClassName,
  disabled,
  ...props
}: SearchFieldProps) {
  const clear = () => {
    onValueChange("")
    onClear?.()
  }

  return (
    <div className={cn("relative min-w-0", className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[var(--pi-content-secondary)]"
      />
      <Input
        {...props}
        type="search"
        value={value}
        disabled={disabled}
        aria-label={label}
        aria-busy={loading || undefined}
        onChange={(event) => onValueChange(event.target.value)}
        className={cn(
          "h-8 rounded-[var(--pi-radius-md)] pr-8 pl-8 text-xs",
          inputClassName
        )}
      />
      <span className="absolute top-1/2 right-1 -translate-y-1/2">
        {loading ? (
          <LoaderCircle
            aria-hidden="true"
            className="mr-1 size-3.5 animate-spin text-[var(--pi-content-secondary)]"
          />
        ) : value ? (
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            disabled={disabled}
            onClick={clear}
            aria-label={`Clear ${label.toLowerCase()}`}
          >
            <X aria-hidden="true" />
          </Button>
        ) : null}
      </span>
      {loading ? (
        <span className="sr-only" role="status">
          Searching
        </span>
      ) : null}
      {typeof resultCount === "number" ? (
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {resultCount} {resultLabel}
        </span>
      ) : null}
    </div>
  )
}

export { SearchField, type SearchFieldProps }
