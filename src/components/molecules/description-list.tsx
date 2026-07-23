import { cn } from "@/lib/utils"

interface DescriptionListItem {
  id: string
  label: React.ReactNode
  value: React.ReactNode
  hint?: React.ReactNode
  action?: React.ReactNode
}

interface DescriptionListProps extends React.ComponentProps<"dl"> {
  items: DescriptionListItem[]
  columns?: 1 | 2 | 3
  divided?: boolean
}

const columnClasses = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
}

function DescriptionList({
  items,
  columns = 2,
  divided = false,
  className,
  ...props
}: DescriptionListProps) {
  return (
    <dl
      data-slot="description-list"
      className={cn(
        "grid gap-x-[var(--pi-space-6)] gap-y-[var(--pi-space-3)]",
        columnClasses[columns],
        divided &&
          "gap-0 overflow-hidden rounded-[var(--pi-radius-md)] border border-[var(--pi-border-default)]",
        className
      )}
      {...props}
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "min-w-0",
            divided &&
              "border-b border-[var(--pi-border-default)] p-[var(--pi-space-3)] last:border-b-0 sm:border-r sm:even:border-r-0"
          )}
        >
          <dt className="text-[10px] leading-[14px] text-[var(--pi-content-secondary)]">
            {item.label}
          </dt>
          <dd className="mt-0.5 flex min-w-0 items-start gap-[var(--pi-space-2)] text-xs leading-4 font-medium text-[var(--pi-content-primary)]">
            <span className="min-w-0 flex-1 break-words">{item.value}</span>
            {item.action ? (
              <span className="shrink-0">{item.action}</span>
            ) : null}
          </dd>
          {item.hint ? (
            <dd className="mt-0.5 text-[10px] leading-[14px] text-[var(--pi-content-secondary)]">
              {item.hint}
            </dd>
          ) : null}
        </div>
      ))}
    </dl>
  )
}

export {
  DescriptionList,
  type DescriptionListItem,
  type DescriptionListProps,
}
