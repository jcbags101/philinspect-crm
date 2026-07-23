import * as React from "react"

import { cn } from "@/lib/utils"

function Kbd({ className, ...props }: React.ComponentPropsWithoutRef<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pi-caption inline-flex min-w-5 items-center justify-center rounded-[var(--pi-radius-sm)] border border-border bg-muted px-1 py-0.5 font-mono text-muted-foreground shadow-[var(--pi-shadow-card)]",
        className
      )}
      {...props}
    />
  )
}

type KbdGroupProps = Omit<
  React.ComponentPropsWithoutRef<"span">,
  "children"
> & {
  keys: React.ReactNode[]
  label?: string
  separator?: React.ReactNode
}

function KbdGroup({
  className,
  keys,
  label,
  separator = "+",
  ...props
}: KbdGroupProps) {
  const accessibleLabel =
    label ??
    keys
      .filter((key): key is string | number => {
        return typeof key === "string" || typeof key === "number"
      })
      .join(" plus ")

  return (
    <span
      data-slot="kbd-group"
      aria-label={accessibleLabel || undefined}
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    >
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span aria-hidden="true" className="pi-caption text-muted-foreground">
              {separator}
            </span>
          )}
          <Kbd aria-hidden={accessibleLabel ? true : undefined}>{key}</Kbd>
        </React.Fragment>
      ))}
    </span>
  )
}

export { Kbd, KbdGroup, type KbdGroupProps }
