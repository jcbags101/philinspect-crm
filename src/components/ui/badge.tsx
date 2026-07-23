import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge pi-caption inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent whitespace-nowrap transition-[color,background-color,border-color,box-shadow] focus-visible:border-ring focus-visible:shadow-[var(--pi-focus-ring)] aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      appearance: {
        solid:
          "border-transparent bg-[var(--badge-color)] text-[var(--badge-on-color)]",
        soft:
          "border-transparent bg-[color-mix(in_srgb,var(--badge-color)_12%,transparent)] text-[var(--badge-color)]",
        outline:
          "border-[var(--badge-color)] bg-transparent text-[var(--badge-color)]",
        subtle:
          "border-transparent bg-muted text-[var(--badge-color)]",
        segment:
          "border-border bg-[var(--pi-surface-sidebar)] text-sidebar-foreground",
      },
      tone: {
        neutral:
          "[--badge-color:var(--pi-badge-neutral)] [--badge-on-color:var(--pi-content-inverse)]",
        gray:
          "[--badge-color:var(--pi-badge-neutral)] [--badge-on-color:var(--pi-content-inverse)]",
        brand:
          "[--badge-color:var(--pi-brand-primary)] [--badge-on-color:var(--pi-content-inverse)]",
        blue:
          "[--badge-color:var(--pi-brand-primary)] [--badge-on-color:var(--pi-content-inverse)]",
        purple:
          "[--badge-color:var(--pi-badge-purple)] [--badge-on-color:var(--pi-content-inverse)]",
        orange:
          "[--badge-color:var(--pi-badge-warning)] [--badge-on-color:var(--pi-content-inverse)]",
        yellow:
          "[--badge-color:var(--pi-badge-warning)] [--badge-on-color:var(--pi-content-inverse)]",
        success:
          "[--badge-color:var(--pi-status-success)] [--badge-on-color:var(--pi-content-inverse)]",
        green:
          "[--badge-color:var(--pi-status-success)] [--badge-on-color:var(--pi-content-inverse)]",
        danger:
          "[--badge-color:var(--pi-status-danger)] [--badge-on-color:var(--pi-content-inverse)]",
        red:
          "[--badge-color:var(--pi-status-danger)] [--badge-on-color:var(--pi-content-inverse)]",
      },
      size: {
        sm: "h-[18px] px-1.5 [&_svg]:size-2.5",
        md: "h-5 px-2 [&_svg]:size-3",
        status: "h-5 w-[78px] px-2 [&_svg]:size-3",
        segment: "h-[22px] w-[116px] px-[9px] [&_svg]:size-3",
      },
    },
    compoundVariants: [
      {
        appearance: "soft",
        tone: ["brand", "blue"],
        className: "bg-[var(--pi-brand-soft)]",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

type BadgeProps = useRender.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    dot?: boolean
    iconStart?: React.ReactNode
    onRemove?: React.MouseEventHandler<HTMLButtonElement>
    removeLabel?: string
  }

function Badge({
  className,
  variant = "default",
  appearance,
  tone,
  size = "md",
  children,
  dot = false,
  iconStart,
  onRemove,
  removeLabel = "Remove",
  render,
  ...props
}: BadgeProps) {
  const content = (
    <>
      {dot && (
        <span
          data-slot="badge-dot"
          aria-hidden="true"
          className="size-1.5 rounded-full bg-current"
        />
      )}
      {iconStart && (
        <span data-icon="inline-start" aria-hidden="true">
          {iconStart}
        </span>
      )}
      {children}
      {onRemove && (
        <button
          type="button"
          data-slot="badge-remove"
          aria-label={removeLabel}
          className="-mr-1 grid size-4 place-items-center rounded-full opacity-70 outline-none hover:opacity-100 focus-visible:shadow-[var(--pi-focus-ring)]"
          onClick={(event) => {
            event.stopPropagation()
            onRemove(event)
          }}
        >
          <XIcon className="size-2.5" />
        </button>
      )}
    </>
  )

  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(
          badgeVariants({ variant, appearance, tone, size }),
          className
        ),
        children: content,
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
      appearance,
      tone,
      size,
    },
  })
}

export { Badge, badgeVariants, type BadgeProps }
