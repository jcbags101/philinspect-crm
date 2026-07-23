import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  meta,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && <p className="pi-eyebrow mb-1">{eyebrow}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="pi-page-title text-foreground">{title}</h1>
          {meta}
        </div>
        {description && (
          <p className="pi-body mt-1 max-w-3xl text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {actions}
        </div>
      )}
    </header>
  );
}
