import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const overlayVariants = cva(
  "fixed inset-0 isolate z-[var(--pi-layer-overlay)] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none",
  {
    variants: {
      appearance: {
        scrim: "",
        transparent: "bg-transparent",
      },
      intensity: {
        subtle: "bg-background/40",
        default: "bg-background/60",
        strong: "bg-background/80",
      },
      blur: {
        true: "supports-backdrop-filter:backdrop-blur-xs",
        false: "",
      },
    },
    compoundVariants: [
      {
        appearance: "transparent",
        intensity: ["subtle", "default", "strong"],
        className: "bg-transparent",
      },
    ],
    defaultVariants: {
      appearance: "scrim",
      intensity: "default",
      blur: true,
    },
  }
)

type OverlayProps = React.ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof overlayVariants>

function Overlay({
  appearance = "scrim",
  blur = true,
  className,
  intensity = "default",
  ...props
}: OverlayProps) {
  return (
    <div
      data-slot="overlay"
      data-appearance={appearance}
      data-intensity={intensity}
      className={cn(
        overlayVariants({ appearance, blur, intensity }),
        className
      )}
      {...props}
    />
  )
}

export { Overlay, overlayVariants, type OverlayProps }
