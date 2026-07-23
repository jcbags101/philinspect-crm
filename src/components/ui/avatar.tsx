"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-border bg-muted font-medium text-muted-foreground",
  {
    variants: {
      size: {
        xs: "pi-eyebrow size-5",
        sm: "pi-caption size-6",
        md: "pi-ui-label size-8",
        lg: "pi-body-medium size-10",
        xl: "pi-section-title size-12",
      },
      shape: {
        circle: "rounded-full",
        rounded: "rounded-[var(--pi-radius-md)]",
      },
    },
    defaultVariants: {
      size: "md",
      shape: "circle",
    },
  }
)

const avatarStatusVariants = cva(
  "absolute right-0 bottom-0 rounded-full border-2 border-[var(--pi-surface-raised)]",
  {
    variants: {
      size: {
        xs: "size-1.5",
        sm: "size-2",
        md: "size-2.5",
        lg: "size-3",
        xl: "size-3.5",
      },
      status: {
        online: "bg-[var(--pi-status-success)]",
        away: "bg-muted-foreground",
        busy: "bg-[var(--pi-status-danger)]",
        offline: "bg-border",
      },
    },
    defaultVariants: {
      size: "md",
      status: "offline",
    },
  }
)

type AvatarStatus = "online" | "away" | "busy" | "offline"

type AvatarProps = Omit<React.ComponentPropsWithoutRef<"span">, "children"> &
  VariantProps<typeof avatarVariants> & {
    alt?: string
    fallback?: React.ReactNode
    name: string
    src?: string | null
    status?: AvatarStatus
  }

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)

  if (words.length === 0) {
    return "?"
  }

  return `${words[0]?.[0] ?? ""}${words.length > 1 ? words.at(-1)?.[0] ?? "" : ""}`.toUpperCase()
}

function Avatar({
  alt,
  className,
  fallback,
  name,
  shape = "circle",
  size = "md",
  src,
  status,
  ...props
}: AvatarProps) {
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null)
  const showImage = Boolean(src) && failedSrc !== src

  return (
    <span
      data-slot="avatar-root"
      data-size={size}
      data-shape={shape}
      className={cn("relative inline-flex shrink-0", className)}
      {...props}
    >
      <span
        data-slot="avatar"
        className={cn(avatarVariants({ size, shape }))}
        role={showImage ? undefined : "img"}
        aria-label={showImage ? undefined : alt ?? name}
      >
        {showImage ? (
          // Provider avatar URLs are dynamic and cannot be preconfigured for next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            data-slot="avatar-image"
            src={src ?? undefined}
            alt={alt ?? name}
            className="size-full object-cover"
            onError={() => setFailedSrc(src ?? null)}
          />
        ) : (
          <span data-slot="avatar-fallback" aria-hidden="true">
            {fallback ?? getInitials(name)}
          </span>
        )}
      </span>
      {status && (
        <span
          data-slot="avatar-status"
          role="img"
          aria-label={`${name} is ${status}`}
          className={avatarStatusVariants({ size, status })}
        />
      )}
    </span>
  )
}

type AvatarGroupProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "children"
> & {
  children: React.ReactNode
  max?: number
  size?: NonNullable<VariantProps<typeof avatarVariants>["size"]>
}

function AvatarGroup({
  children,
  className,
  max = 4,
  size = "md",
  ...props
}: AvatarGroupProps) {
  const avatars = React.Children.toArray(children)
  const visible = avatars.slice(0, Math.max(0, max))
  const overflow = Math.max(0, avatars.length - visible.length)

  return (
    <div
      data-slot="avatar-group"
      className={cn("flex -space-x-2 [&_[data-slot=avatar-root]]:ring-2 [&_[data-slot=avatar-root]]:ring-card", className)}
      {...props}
    >
      {visible}
      {overflow > 0 && (
        <span
          data-slot="avatar-group-overflow"
          aria-label={`${overflow} more`}
          className={cn(
            avatarVariants({ size, shape: "circle" }),
            "relative ring-2 ring-card"
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  )
}

export {
  Avatar,
  AvatarGroup,
  avatarVariants,
  getInitials,
  type AvatarGroupProps,
  type AvatarProps,
  type AvatarStatus,
}
