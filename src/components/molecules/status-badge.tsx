import type { LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type StatusTone = "neutral" | "info" | "success" | "warning" | "danger"

interface StatusBadgeProps {
  label: string
  tone?: StatusTone
  dot?: boolean
  icon?: LucideIcon
  className?: string
}

const toneClasses: Record<StatusTone, string> = {
  neutral:
    "border-[var(--pi-border-default)] bg-[var(--pi-surface-subtle)] text-[var(--pi-content-secondary)]",
  info:
    "border-[color-mix(in_srgb,var(--pi-brand-primary)_24%,transparent)] bg-[color-mix(in_srgb,var(--pi-brand-primary)_9%,transparent)] text-[var(--pi-brand-primary)]",
  success:
    "border-[color-mix(in_srgb,var(--pi-status-success)_24%,transparent)] bg-[color-mix(in_srgb,var(--pi-status-success)_9%,transparent)] text-[var(--pi-status-success)]",
  warning:
    "border-[color-mix(in_srgb,var(--pi-badge-warning)_24%,transparent)] bg-[color-mix(in_srgb,var(--pi-badge-warning)_12%,transparent)] text-[var(--pi-badge-warning)]",
  danger:
    "border-[color-mix(in_srgb,var(--pi-status-danger)_24%,transparent)] bg-[color-mix(in_srgb,var(--pi-status-danger)_9%,transparent)] text-[var(--pi-status-danger)]",
}

function StatusBadge({
  label,
  tone = "neutral",
  dot = false,
  icon: Icon,
  className,
}: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      data-tone={tone}
      className={cn(
        "h-5 gap-1 rounded-full px-2 text-[10px] leading-[14px] font-medium",
        toneClasses[tone],
        className
      )}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-current"
        />
      ) : null}
      {Icon ? <Icon aria-hidden="true" className="size-3" /> : null}
      {label}
    </Badge>
  )
}

export { StatusBadge, type StatusBadgeProps, type StatusTone }
