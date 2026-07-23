"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center text-muted-foreground group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[stretch=true]:w-full data-[stretch=true]:**:data-[slot=tabs-trigger]:flex-1",
  {
    variants: {
      variant: {
        default: "gap-1 bg-transparent",
        segmented: "rounded-[var(--pi-radius-md)] bg-muted p-1",
        pill: "gap-1 rounded-full bg-muted p-1",
        line: "gap-2 border-b border-border bg-transparent",
        underline: "gap-2 border-b border-border bg-transparent",
      },
      size: {
        sm: "min-h-7",
        md: "min-h-8",
        lg: "min-h-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  size = "md",
  stretch = false,
  ...props
}: TabsPrimitive.List.Props &
  VariantProps<typeof tabsListVariants> & {
    stretch?: boolean
  }) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      data-size={size}
      data-stretch={stretch}
      className={cn(tabsListVariants({ variant, size }), className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  children,
  icon,
  count,
  ...props
}: TabsPrimitive.Tab.Props & {
  icon?: React.ReactNode
  count?: React.ReactNode
}) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "pi-caption relative inline-flex items-center justify-center gap-1.5 rounded-[var(--pi-radius-sm)] border border-transparent whitespace-nowrap text-muted-foreground transition-[color,background-color,border-color,box-shadow] group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:bg-muted/60 hover:text-foreground focus-visible:border-ring focus-visible:shadow-[var(--pi-focus-ring)] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-active:bg-card data-active:text-foreground data-active:shadow-[var(--pi-shadow-card)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        "group-data-[size=sm]/tabs-list:min-h-5 group-data-[size=sm]/tabs-list:px-2 group-data-[size=md]/tabs-list:min-h-6 group-data-[size=md]/tabs-list:px-2.5 group-data-[size=lg]/tabs-list:min-h-8 group-data-[size=lg]/tabs-list:px-3",
        "group-data-[variant=pill]/tabs-list:rounded-full group-data-[variant=pill]/tabs-list:data-active:rounded-full",
        "group-data-[variant=default]/tabs-list:data-active:bg-muted group-data-[variant=default]/tabs-list:data-active:shadow-none",
        "after:absolute after:bg-primary after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:-bottom-px group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-px group-data-vertical/tabs:after:w-0.5",
        "group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent group-data-[variant=line]/tabs-list:data-active:shadow-none group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        "group-data-[variant=underline]/tabs-list:rounded-none group-data-[variant=underline]/tabs-list:bg-transparent group-data-[variant=underline]/tabs-list:data-active:bg-transparent group-data-[variant=underline]/tabs-list:data-active:shadow-none group-data-[variant=underline]/tabs-list:data-active:after:opacity-100",
        className
      )}
      {...props}
    >
      {icon && (
        <span data-icon="inline-start" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
      {count !== undefined && (
        <span
          data-slot="tabs-count"
          className="pi-caption min-w-4 rounded-full bg-muted px-1 text-center text-muted-foreground group-data-[variant=default]/tabs-list:data-active:bg-background group-data-[variant=segmented]/tabs-list:data-active:bg-background"
        >
          {count}
        </span>
      )}
    </TabsPrimitive.Tab>
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
