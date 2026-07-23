import { cn } from "@/lib/utils"

interface EntityListItemProps extends Omit<
  React.ComponentProps<"article">,
  "title"
> {
  title: React.ReactNode
  description?: React.ReactNode
  leading?: React.ReactNode
  status?: React.ReactNode
  metadata?: React.ReactNode
  actions?: React.ReactNode
  selected?: boolean
}

function EntityListItem({
  title,
  description,
  leading,
  status,
  metadata,
  actions,
  selected = false,
  className,
  ...props
}: EntityListItemProps) {
  return (
    <article
      data-slot="entity-list-item"
      data-selected={selected || undefined}
      className={cn(
        "flex min-w-0 items-start gap-[var(--pi-space-3)] rounded-[var(--pi-radius-md)] border border-[var(--pi-border-default)] bg-[var(--pi-surface-raised)] p-[var(--pi-space-3)] shadow-[var(--pi-shadow-card)] transition-colors hover:bg-[var(--pi-surface-subtle)] data-[selected]:border-[var(--pi-brand-primary)] data-[selected]:bg-[color-mix(in_srgb,var(--pi-brand-primary)_6%,var(--pi-surface-raised))]",
        className
      )}
      {...props}
    >
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-[var(--pi-space-2)]">
          <h3 className="min-w-0 truncate text-xs leading-4 font-medium text-[var(--pi-content-primary)]">
            {title}
          </h3>
          {status}
        </div>
        {description ? (
          <div className="mt-0.5 line-clamp-2 text-[11px] leading-[14px] text-[var(--pi-content-secondary)]">
            {description}
          </div>
        ) : null}
        {metadata ? (
          <div className="mt-[var(--pi-space-2)] flex min-w-0 flex-wrap items-center gap-x-[var(--pi-space-3)] gap-y-[var(--pi-space-1)] text-[10px] leading-[14px] text-[var(--pi-content-secondary)]">
            {metadata}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-[var(--pi-space-1)]">
          {actions}
        </div>
      ) : null}
    </article>
  )
}

export { EntityListItem, type EntityListItemProps }
