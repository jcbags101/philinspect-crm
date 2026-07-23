import { cn } from "@/lib/utils"

interface DetailSectionProps extends Omit<
  React.ComponentProps<"section">,
  "title"
> {
  title?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  inset?: boolean
}

function DetailSection({
  title,
  description,
  actions,
  inset = true,
  children,
  className,
  ...props
}: DetailSectionProps) {
  return (
    <section
      data-slot="detail-section"
      className={cn(
        "rounded-[var(--pi-radius-md)] border border-[var(--pi-border-default)] bg-[var(--pi-surface-raised)] shadow-[var(--pi-shadow-card)]",
        className
      )}
      {...props}
    >
      {title || description || actions ? (
        <div className="flex min-w-0 items-start justify-between gap-[var(--pi-space-3)] border-b border-[var(--pi-border-default)] px-[var(--pi-space-3)] py-[var(--pi-space-2)]">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-xs leading-4 font-semibold text-[var(--pi-content-primary)]">
                {title}
              </h2>
            ) : null}
            {description ? (
              <div className="mt-0.5 text-[10px] leading-[14px] text-[var(--pi-content-secondary)]">
                {description}
              </div>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 items-center gap-[var(--pi-space-1)]">
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className={cn(inset && "p-[var(--pi-space-3)]")}>{children}</div>
    </section>
  )
}

export { DetailSection, type DetailSectionProps }
