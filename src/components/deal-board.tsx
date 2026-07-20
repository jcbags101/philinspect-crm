"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Deal = { id: string; title: string; brand: string; owner: string; stage: string; kind: string; value: number };
const stages = ["lead", "discovery", "assessment", "demo_proposal", "follow_up", "parked", "won", "lost"];
const labels: Record<string, string> = { lead: "Lead", discovery: "Discovery", assessment: "Assessment", demo_proposal: "Demo / Proposal", follow_up: "Follow up", parked: "Parked", won: "Won", lost: "Lost" };
const money = (value: number) => {
  if (value >= 1_000_000) {
    const scaled = value / 1_000_000;
    return `₱${Number.isInteger(scaled) ? scaled.toFixed(0) : scaled.toFixed(1)}M`;
  }
  if (value >= 1_000) {
    const scaled = value / 1_000;
    return `₱${Number.isInteger(scaled) ? scaled.toFixed(0) : scaled.toFixed(1)}K`;
  }
  return `₱${value.toFixed(0)}`;
};

export function DealBoard({ deals }: { deals: Deal[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => deals.filter((deal) => `${deal.title} ${deal.brand} ${deal.owner}`.toLowerCase().includes(query.toLowerCase())), [deals, query]);
  return <>
    <PageHeader title="Deals" description="Move opportunities through your end-to-end sales pipeline." actions={<Button><Plus /> New deal</Button>} />
    <div className="mb-4 flex max-w-sm items-center gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search deals…" className="pl-9" /></div><Badge variant="outline">{filtered.length} deals</Badge></div>
    <div className="crm-scrollbar -mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"><div className="flex min-w-max gap-4">{stages.map((stage) => {
      const items = filtered.filter((deal) => deal.stage === stage);
      return <section key={stage} className="w-[285px]"><div className="mb-3 flex items-center justify-between px-1"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-blue-400" /><h2 className="text-sm font-medium">{labels[stage]}</h2><span className="text-xs text-muted-foreground">{items.length}</span></div><span className="text-xs text-muted-foreground">{money(items.reduce((sum, deal) => sum + deal.value, 0))}</span></div><div className="space-y-3 rounded-xl bg-muted/20 p-2">{items.slice(0, 7).map((deal) => <Card key={deal.id} className="cursor-grab border-border/60 bg-card p-4 shadow-none transition-transform hover:-translate-y-0.5 hover:border-blue-500/30"><div className="mb-3 flex items-start justify-between gap-2"><p className="line-clamp-2 text-sm font-medium leading-5">{deal.title}</p><Badge variant="outline" className="shrink-0 text-[10px]">{deal.kind}</Badge></div><p className="truncate text-xs text-muted-foreground">{deal.brand}</p><div className="mt-4 flex items-center justify-between"><span className="font-mono text-xs text-blue-300">{money(deal.value)}</span><span className="grid size-6 place-items-center rounded-full bg-muted text-[9px] font-semibold">{deal.owner.split(" ").map((x) => x[0]).join("")}</span></div></Card>)}{items.length === 0 && <div className="grid h-24 place-items-center text-xs text-muted-foreground">No deals</div>}</div></section>;
    })}</div></div>
  </>;
}
