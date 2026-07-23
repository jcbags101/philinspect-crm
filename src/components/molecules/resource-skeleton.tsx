import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface ResourceSkeletonProps {
  rows?: number
  columns?: number
  showHeader?: boolean
  className?: string
  label?: string
}

function ResourceSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  className,
  label = "Loading content",
}: ResourceSkeletonProps) {
  const safeRows = Math.max(1, rows)
  const safeColumns = Math.max(1, columns)

  return (
    <div
      data-slot="resource-skeleton"
      role="status"
      aria-label={label}
      className={cn(
        "overflow-hidden rounded-[var(--pi-radius-md)] border border-[var(--pi-border-default)] bg-[var(--pi-surface-raised)]",
        className
      )}
    >
      {showHeader ? (
        <div className="flex items-center justify-between gap-[var(--pi-space-4)] border-b border-[var(--pi-border-default)] p-[var(--pi-space-3)]">
          <Skeleton className="h-5 w-40 rounded-[var(--pi-radius-sm)]" />
          <Skeleton className="h-7 w-24 rounded-[var(--pi-radius-md)]" />
        </div>
      ) : null}
      <div className="divide-y divide-[var(--pi-border-default)]">
        {Array.from({ length: safeRows }, (_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid min-h-12 items-center gap-[var(--pi-space-4)] px-[var(--pi-space-3)]"
            style={{
              gridTemplateColumns: `repeat(${safeColumns}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: safeColumns }, (_, columnIndex) => (
              <Skeleton
                key={columnIndex}
                className={cn(
                  "h-3 rounded-[var(--pi-radius-sm)]",
                  columnIndex === 0 ? "w-4/5" : "w-3/5"
                )}
              />
            ))}
          </div>
        ))}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  )
}

export { ResourceSkeleton, type ResourceSkeletonProps }
