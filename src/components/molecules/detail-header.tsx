import { cn } from "@/lib/utils"

interface DetailHeaderProps extends Omit<
  React.ComponentProps<"header">,
  "title"
> {
  title: React.ReactNode
  description?: React.ReactNode
  eyebrow?: React.ReactNode
  leading?: React.ReactNode
  status?: React.ReactNode
  metadata?: React.ReactNode
  actions?: React.ReactNode
  headingLevel?: 1 | 2
}

function DetailHeader({
  title,
  description,
  eyebrow,
  leading,
  status,
  metadata,
  actions,
  headingLevel = 1,
  className,
  ...props
}: DetailHeaderProps) {
  const Heading = headingLevel === 1 ? "h1" : "h2"

  return (
    <header
      data-slot="detail-header"
      className={cn(
        "flex min-w-0 flex-col gap-[var(--pi-space-3)] border-b border-[var(--pi-border-default)] bg-[var(--pi-surface-raised)] px-[var(--pi-space-4)] py-[var(--pi-space-3)] sm:flex-row sm:items-start",
        className
      )}
      {...props}
    >
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <div className="font-mono text-[9px] leading-3 font-medium text-[var(--pi-content-secondary)]">
            {eyebrow}
          </div>
        ) : null}
        <div className="flex min-w-0 flex-wrap items-center gap-[var(--pi-space-2)]">
          <Heading className="min-w-0 text-sm leading-[18px] font-semibold text-[var(--pi-content-primary)]">
            {title}
          </Heading>
          {status}
        </div>
        {description ? (
          <div className="mt-0.5 text-[11px] leading-[14px] text-[var(--pi-content-secondary)]">
            {description}
          </div>
        ) : null}
        {metadata ? (
          <div className="mt-[var(--pi-space-2)] flex flex-wrap items-center gap-x-[var(--pi-space-3)] gap-y-[var(--pi-space-1)] text-[10px] leading-[14px] text-[var(--pi-content-secondary)]">
            {metadata}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-[var(--pi-space-2)]">
          {actions}
        </div>
      ) : null}
    </header>
  )
}

export { DetailHeader, type DetailHeaderProps }
