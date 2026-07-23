import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const iconVariants = cva("inline-block shrink-0", {
  variants: {
    size: {
      xs: "size-3",
      sm: "size-3.5",
      md: "size-4",
      lg: "size-5",
      xl: "size-6",
    },
    tone: {
      inherit: "text-current",
      muted: "text-muted-foreground",
      brand: "text-primary",
      success: "text-[var(--pi-status-success)]",
      danger: "text-destructive",
    },
  },
  defaultVariants: {
    size: "md",
    tone: "inherit",
  },
})

type IconSource = React.ComponentType<React.SVGProps<SVGSVGElement>>

type IconProps = Omit<
  React.ComponentPropsWithoutRef<"svg">,
  "children" | "size"
> &
  VariantProps<typeof iconVariants> & {
    source: IconSource
    label?: string
  }

function Icon({
  source: Source,
  size = "md",
  tone = "inherit",
  label,
  className,
  ...props
}: IconProps) {
  return (
    <Source
      data-slot="icon"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      className={cn(iconVariants({ size, tone }), className)}
      {...props}
    />
  )
}

export { Icon, iconVariants, type IconProps, type IconSource }
