import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({ label, value, detail, icon: Icon, tone = "blue" }: { label: string; value: string; detail: string; icon: LucideIcon; tone?: "blue" | "emerald" | "amber" | "violet" }) {
  const tones = {
    blue: "text-primary",
    emerald: "text-[color:var(--pi-status-success)]",
    amber: "text-muted-foreground",
    violet: "text-primary",
  };

  return (
    <Card className="gap-0 rounded-lg border border-border bg-card py-0 shadow-[var(--pi-shadow-card)] ring-0">
      <CardContent className="flex min-h-28 items-start justify-between gap-4 p-4">
        <div className="min-w-0">
          <p className="pi-ui-label text-muted-foreground">{label}</p>
          <p className="pi-section-title mt-2 truncate text-foreground">{value}</p>
          <p className="pi-caption mt-1">{detail}</p>
        </div>
        <div
          className={`grid size-8 shrink-0 place-items-center rounded-lg bg-secondary ${tones[tone]}`}
        >
          <Icon className="size-4" aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  );
}
