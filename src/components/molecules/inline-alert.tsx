import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

type InlineAlertTone = "info" | "success" | "warning" | "danger"

interface InlineAlertProps extends React.ComponentProps<"div"> {
  tone?: InlineAlertTone
  title?: string
  icon?: LucideIcon
  actions?: React.ReactNode
}

const icons: Record<InlineAlertTone, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
}

const toneClasses: Record<InlineAlertTone, string> = {
  info:
    "border-[color-mix(in_srgb,var(--pi-brand-primary)_24%,transparent)] bg-[color-mix(in_srgb,var(--pi-brand-primary)_7%,transparent)] text-[var(--pi-brand-primary)]",
  success:
    "border-[color-mix(in_srgb,var(--pi-status-success)_24%,transparent)] bg-[color-mix(in_srgb,var(--pi-status-success)_7%,transparent)] text-[var(--pi-status-success)]",
  warning:
    "border-[color-mix(in_srgb,var(--pi-badge-warning)_24%,transparent)] bg-[color-mix(in_srgb,var(--pi-badge-warning)_7%,transparent)] text-[var(--pi-badge-warning)]",
  danger:
    "border-[color-mix(in_srgb,var(--pi-status-danger)_24%,transparent)] bg-[color-mix(in_srgb,var(--pi-status-danger)_7%,transparent)] text-[var(--pi-status-danger)]",
}

function InlineAlert({
  tone = "info",
  title,
  icon,
  actions,
  children,
  className,
  role,
  ...props
}: InlineAlertProps) {
  const Icon = icon ?? icons[tone]

  return (
    <div
      data-slot="inline-alert"
      data-tone={tone}
      role={role ?? (tone === "danger" ? "alert" : "status")}
      className={cn(
        "flex items-start gap-[var(--pi-space-2)] rounded-[var(--pi-radius-md)] border px-[var(--pi-space-3)] py-[var(--pi-space-2)] text-[11px] leading-[14px]",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      <Icon aria-hidden="true" className="mt-px size-3.5 shrink-0" />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? (
          <div
            className={cn(
              "text-[var(--pi-content-secondary)]",
              title && "mt-0.5"
            )}
          >
            {children}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-[var(--pi-space-1)]">
          {actions}
        </div>
      ) : null}
    </div>
  )
}

export { InlineAlert, type InlineAlertProps, type InlineAlertTone }
