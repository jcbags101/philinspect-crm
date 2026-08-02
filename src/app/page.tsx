import { desc, eq, isNull, sql } from "drizzle-orm";
import { Activity, Building2, CircleDollarSign, Sparkles, TrendingUp } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDb } from "@/db/client";
import { activities, companies, deals, leads, users } from "@/db/schema";

export const dynamic = "force-dynamic";

const stageLabels: Record<string, string> = {
  lead: "Lead",
  discovery: "Discovery",
  assessment: "Assessment",
  demo_proposal: "Demo / Proposal",
  follow_up: "Follow up",
  parked: "Parked",
  won: "Won",
  lost: "Lost",
};

const activityTones: Record<string, string> = {
  call: "bg-blue-500/10 text-blue-400",
  email: "bg-violet-500/10 text-violet-400",
  meeting: "bg-emerald-500/10 text-emerald-400",
  note: "bg-amber-500/10 text-amber-400",
  system: "bg-zinc-500/10 text-zinc-400",
};

function money(value: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0, notation: "compact" }).format(value);
}

function since(date: Date) {
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
  return days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`;
}

export default async function DashboardPage() {
  const db = getDb();
  const [leadResult, brandResult, dealResult, wonResult, stageRows, recentActivities] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(leads).where(isNull(leads.deletedAt)),
    db.select({ count: sql<number>`count(*)::int` }).from(companies).where(isNull(companies.deletedAt)),
    db.select({ count: sql<number>`count(*)::int`, value: sql<string>`coalesce(sum(${deals.value}), 0)` }).from(deals).where(isNull(deals.deletedAt)),
    db.select({ count: sql<number>`count(*)::int`, value: sql<string>`coalesce(sum(${deals.value}), 0)` }).from(deals).where(eq(deals.stage, "won")),
    db.select({ stage: deals.stage, count: sql<number>`count(*)::int`, value: sql<string>`coalesce(sum(${deals.value}), 0)` }).from(deals).where(isNull(deals.deletedAt)).groupBy(deals.stage),
    db.select({ id: activities.id, title: activities.title, type: activities.type, happenedAt: activities.happenedAt, actor: users.name }).from(activities).innerJoin(users, eq(activities.actorId, users.id)).orderBy(desc(activities.happenedAt)).limit(7),
  ]);

  const pipelineValue = Number(dealResult[0]?.value ?? 0);
  const wonValue = Number(wonResult[0]?.value ?? 0);
  const maxStage = Math.max(...stageRows.map((stage) => stage.count), 1);

  return (
    <>
      <PageHeader title="Good morning, Ari" description="Here’s what’s happening across your CRM today." actions={<Button><TrendingUp /> View reports</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active pipeline" value={money(pipelineValue)} detail={`${dealResult[0]?.count ?? 0} deals in motion`} icon={CircleDollarSign} />
        <StatCard label="Won revenue" value={money(wonValue)} detail={`${wonResult[0]?.count ?? 0} deals closed`} icon={TrendingUp} tone="emerald" />
        <StatCard label="Total leads" value={String(leadResult[0]?.count ?? 0)} detail="31 converted this quarter" icon={Sparkles} tone="violet" />
        <StatCard label="Active companies" value={String(brandResult[0]?.count ?? 0)} detail="Across 8 industries" icon={Building2} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <Card className="border-border/60 bg-card/75 shadow-none">
          <CardHeader className="flex-row items-center justify-between"><div><CardTitle>Pipeline overview</CardTitle><p className="mt-1 text-sm text-muted-foreground">Deal volume by current stage</p></div><Badge variant="outline">163 total</Badge></CardHeader>
          <CardContent className="space-y-5">
            {stageRows.sort((a, b) => Object.keys(stageLabels).indexOf(a.stage) - Object.keys(stageLabels).indexOf(b.stage)).map((stage) => (
              <div key={stage.stage}>
                <div className="mb-2 flex items-center justify-between text-sm"><span>{stageLabels[stage.stage]}</span><span className="text-muted-foreground">{stage.count} deals · {money(Number(stage.value))}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400" style={{ width: `${Math.max((stage.count / maxStage) * 100, 5)}%` }} /></div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/75 shadow-none">
          <CardHeader><CardTitle>Recent activity</CardTitle><p className="text-sm text-muted-foreground">Latest updates from your team</p></CardHeader>
          <CardContent className="space-y-1">
            {recentActivities.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-xl p-3 transition-colors hover:bg-muted/50">
                <div className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${activityTones[item.type]}`}><Activity className="size-4" /></div>
                <div className="min-w-0"><p className="truncate text-sm font-medium">{item.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.actor} · {since(item.happenedAt)}</p></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
