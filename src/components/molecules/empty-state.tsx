import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  primaryAction?: React.ReactNode
  secondaryAction?: React.ReactNode
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "min-h-32 px-[var(--pi-space-3)] py-[var(--pi-space-4)]",
  md: "min-h-52 px-[var(--pi-space-4)] py-[var(--pi-space-8)]",
  lg: "min-h-72 px-[var(--pi-space-6)] py-[var(--pi-space-12)]",
}

function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  size = "md",
  className,
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "grid place-items-center rounded-[var(--pi-radius-md)] text-center",
        sizeClasses[size],
        className
      )}
    >
      <div className="max-w-72">
        {Icon ? (
          <div className="mx-auto mb-[var(--pi-space-3)] grid size-8 place-items-center rounded-[var(--pi-radius-md)] bg-[var(--pi-surface-subtle)] text-[var(--pi-content-secondary)]">
            <Icon aria-hidden="true" className="size-4" />
          </div>
        ) : null}
        <h2 className="text-xs leading-4 font-semibold text-[var(--pi-content-primary)]">
          {title}
        </h2>
        {description ? (
          <p className="mt-[var(--pi-space-1)] text-[11px] leading-[14px] text-[var(--pi-content-secondary)]">
            {description}
          </p>
        ) : null}
        {primaryAction || secondaryAction ? (
          <div className="mt-[var(--pi-space-4)] flex flex-wrap items-center justify-center gap-[var(--pi-space-2)]">
            {primaryAction}
            {secondaryAction}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export { EmptyState, type EmptyStateProps }
