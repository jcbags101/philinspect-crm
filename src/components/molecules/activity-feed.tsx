import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { StatusTone } from "./status-badge"

interface ActivityFeedItem {
  id: string
  title: React.ReactNode
  description?: React.ReactNode
  actor?: React.ReactNode
  timestamp: React.ReactNode
  dateTime?: string
  icon?: LucideIcon
  tone?: StatusTone
}

interface ActivityFeedProps extends React.ComponentProps<"ol"> {
  items: ActivityFeedItem[]
  empty?: React.ReactNode
}

const toneClasses: Record<StatusTone, string> = {
  neutral:
    "bg-[var(--pi-surface-subtle)] text-[var(--pi-content-secondary)]",
  info:
    "bg-[color-mix(in_srgb,var(--pi-brand-primary)_9%,transparent)] text-[var(--pi-brand-primary)]",
  success:
    "bg-[color-mix(in_srgb,var(--pi-status-success)_9%,transparent)] text-[var(--pi-status-success)]",
  warning:
    "bg-[var(--pi-surface-subtle)] text-[var(--pi-content-primary)]",
  danger:
    "bg-[color-mix(in_srgb,var(--pi-status-danger)_9%,transparent)] text-[var(--pi-status-danger)]",
}

const toneTextClasses: Record<StatusTone, string> = {
  neutral: "text-[var(--pi-content-secondary)]",
  info: "text-[var(--pi-brand-primary)]",
  success: "text-[var(--pi-status-success)]",
  warning: "text-[var(--pi-content-primary)]",
  danger: "text-[var(--pi-status-danger)]",
}

function ActivityFeed({
  items,
  empty,
  className,
  ...props
}: ActivityFeedProps) {
  if (items.length === 0) {
    return empty ? <>{empty}</> : null
  }

  return (
    <ol
      data-slot="activity-feed"
      className={cn("divide-y divide-[var(--pi-border-default)]", className)}
      {...props}
    >
      {items.map((item) => {
        const Icon = item.icon
        const tone = item.tone ?? "neutral"

        return (
          <li
            key={item.id}
            className="flex min-w-0 gap-[var(--pi-space-2)] py-[var(--pi-space-3)] first:pt-0 last:pb-0"
          >
            {Icon ? (
              <div
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-[var(--pi-radius-md)]",
                  toneClasses[tone]
                )}
              >
                <Icon aria-hidden="true" className="size-3.5" />
              </div>
            ) : (
              <span
                aria-hidden="true"
                className={cn(
                  "mt-1.5 size-1.5 shrink-0 rounded-full bg-current",
                  toneTextClasses[tone]
                )}
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-[var(--pi-space-3)]">
                <p className="min-w-0 text-[11px] leading-[14px] font-medium text-[var(--pi-content-primary)]">
                  {item.title}
                </p>
                <time
                  dateTime={item.dateTime}
                  className="shrink-0 text-[10px] leading-[14px] text-[var(--pi-content-secondary)]"
                >
                  {item.timestamp}
                </time>
              </div>
              {item.description ? (
                <div className="mt-0.5 text-[10px] leading-[14px] text-[var(--pi-content-secondary)]">
                  {item.description}
                </div>
              ) : null}
              {item.actor ? (
                <div className="mt-[var(--pi-space-1)] text-[10px] leading-[14px] text-[var(--pi-content-secondary)]">
                  {item.actor}
                </div>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export { ActivityFeed, type ActivityFeedItem, type ActivityFeedProps }
