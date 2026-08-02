import Link from "next/link";
import {
  Activity,
  Building2,
  CircleDollarSign,
  ListTodo,
  TrendingUp,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSessionContext } from "@/server/auth/session-context";
import { getDashboard } from "@/server/services/dashboard-service";

export const dynamic = "force-dynamic";

const actionTone: Record<string, string> = {
  created: "bg-blue-500/10 text-blue-500",
  converted: "bg-violet-500/10 text-violet-500",
  stage_moved: "bg-amber-500/10 text-amber-600",
  completed: "bg-emerald-500/10 text-emerald-600",
  archived: "bg-zinc-500/10 text-zinc-500",
};

function money(value: string | number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
    notation: "compact",
  }).format(Number(value));
}

function since(date: Date) {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

export default async function DashboardPage() {
  const context = await requireSessionContext();
  const { metrics, pipeline, activity } = await getDashboard(context);
  const maxStage = Math.max(...pipeline.map((stage) => stage.count), 1);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${context.name.split(" ")[0]}`}
        description={`Here’s what’s happening in ${context.workspaceName}.`}
        actions={<Link className={buttonVariants()} href="/deals"><TrendingUp />View pipeline</Link>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open pipeline" value={money(metrics.openDeals.value)} detail={`${metrics.openDeals.total} active deals`} icon={CircleDollarSign} />
        <StatCard label="Won revenue" value={money(metrics.wonDeals.value)} detail={`${metrics.wonDeals.total} won deals`} icon={TrendingUp} tone="emerald" />
        <StatCard label="Active leads" value={String(metrics.leads.total)} detail={`${metrics.leads.converted} converted`} icon={Building2} tone="violet" />
        <StatCard label="Open tasks" value={String(metrics.tasks.open)} detail={`${metrics.tasks.overdue} overdue`} icon={ListTodo} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <Card className="border-border/60 bg-card/75 shadow-none">
          <CardHeader className="flex-row items-center justify-between">
            <div><CardTitle>Pipeline overview</CardTitle><p className="mt-1 text-sm text-muted-foreground">Deal volume by current stage</p></div>
            <Badge variant="outline">{metrics.companies.total} companies</Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            {pipeline.map((stage) => (
              <div key={stage.id}>
                <div className="mb-2 flex items-center justify-between gap-4 text-sm"><span>{stage.label}</span><span className="text-right text-muted-foreground">{stage.count} deals · {money(stage.value)}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400" style={{ width: `${stage.count ? Math.max((stage.count / maxStage) * 100, 5) : 0}%` }} /></div>
              </div>
            ))}
            {pipeline.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No active pipeline stages are configured.</p>}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/75 shadow-none">
          <CardHeader><CardTitle>Recent activity</CardTitle><p className="text-sm text-muted-foreground">Latest workspace changes</p></CardHeader>
          <CardContent className="space-y-1">
            {activity.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-xl p-3 transition-colors hover:bg-muted/50">
                <div className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${actionTone[item.action] ?? "bg-muted text-muted-foreground"}`}><Activity className="size-4" /></div>
                <div className="min-w-0"><p className="truncate text-sm font-medium">{item.label}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.actor ?? "System"} · {since(item.createdAt)}</p></div>
              </div>
            ))}
            {activity.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No activity has been recorded yet.</p>}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
