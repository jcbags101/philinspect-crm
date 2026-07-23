import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button pi-body-medium inline-flex shrink-0 items-center justify-center rounded-[6px] border border-transparent bg-clip-padding whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] outline-none select-none focus-visible:border-ring focus-visible:shadow-[var(--pi-focus-ring)] active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:shadow-[var(--pi-focus-ring)] data-[loading=true]:cursor-wait [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline:
          "border-border bg-card text-foreground hover:bg-muted aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_srgb,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "text-foreground hover:bg-muted aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "bg-destructive text-primary-foreground hover:bg-destructive/90 focus-visible:border-destructive",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        md: "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "pi-caption h-6 gap-1 px-2 in-data-[slot=button-group]:rounded-[6px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "pi-ui-label h-7 gap-1 px-2.5 in-data-[slot=button-group]:rounded-[var(--pi-radius-md)] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-2 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        icon: "size-8",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-10 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    fullWidth?: boolean
    iconStart?: React.ReactNode
    iconEnd?: React.ReactNode
    loading?: boolean
    loadingText?: React.ReactNode
    pressed?: boolean
  }

function Button({
  className,
  variant = "default",
  size = "default",
  children,
  disabled,
  fullWidth = false,
  iconStart,
  iconEnd,
  loading = false,
  loadingText,
  pressed,
  "aria-pressed": ariaPressed,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-loading={loading}
      aria-busy={loading || undefined}
      aria-pressed={pressed ?? ariaPressed}
      disabled={disabled || loading}
      className={cn(
        buttonVariants({ variant, size }),
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading && (
        <span
          data-slot="button-spinner"
          aria-hidden="true"
          className="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      )}
      {!loading && iconStart && (
        <span data-icon="inline-start" aria-hidden="true">
          {iconStart}
        </span>
      )}
      {loading && loadingText !== undefined ? loadingText : children}
      {!loading && iconEnd && (
        <span data-icon="inline-end" aria-hidden="true">
          {iconEnd}
        </span>
      )}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants, type ButtonProps }
