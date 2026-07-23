import * as React from "react"

import {
  Button,
  type ButtonProps,
} from "@/components/ui/button"

type IconButtonSize = "xs" | "sm" | "md" | "lg"

type IconButtonProps = Omit<
  ButtonProps,
  "aria-label" | "children" | "iconEnd" | "iconStart" | "size"
> & {
  icon: React.ReactNode
  label: string
  size?: IconButtonSize
  tooltip?: string
}

const iconButtonSizes = {
  xs: "icon-xs",
  sm: "icon-sm",
  md: "icon",
  lg: "icon-lg",
} as const

function IconButton({
  icon,
  label,
  size = "md",
  title,
  tooltip,
  ...props
}: IconButtonProps) {
  return (
    <Button
      data-slot="icon-button"
      size={iconButtonSizes[size]}
      aria-label={label}
      title={tooltip ?? title}
      {...props}
    >
      {icon}
    </Button>
  )
}

export { IconButton, type IconButtonProps, type IconButtonSize }
