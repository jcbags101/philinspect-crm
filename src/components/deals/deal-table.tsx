import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface DealRow { id: string; title: string; companyName: string; pipelineStageLabel: string; kind: string; value: string | null; currency: string; probability: number; ownerName: string; deletedAt: Date | null }

export function DealTable({ deals }: { deals: DealRow[] }) {
  return <Card className="overflow-hidden p-0"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead><tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground"><th className="px-4 py-3">Deal</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Stage</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Owner</th><th className="px-4 py-3 text-right">Value</th></tr></thead><tbody>{deals.map((deal) => <tr className="border-b last:border-0 hover:bg-muted/20" key={deal.id}><td className="px-4 py-3"><Link className="font-medium hover:text-primary hover:underline" href={`/deals/${deal.id}`}>{deal.title}</Link>{deal.deletedAt && <div className="text-xs text-destructive">Archived</div>}</td><td className="px-4 py-3 text-muted-foreground">{deal.companyName}</td><td className="px-4 py-3"><Badge variant="outline">{deal.pipelineStageLabel}</Badge></td><td className="px-4 py-3 text-muted-foreground">{deal.kind}</td><td className="px-4 py-3 text-muted-foreground">{deal.ownerName}</td><td className="px-4 py-3 text-right">{deal.value ? new Intl.NumberFormat("en-PH", { style: "currency", currency: deal.currency, maximumFractionDigits: 0 }).format(Number(deal.value)) : "—"}</td></tr>)}{deals.length === 0 && <tr><td className="px-4 py-10 text-center text-muted-foreground" colSpan={6}>No deals found.</td></tr>}</tbody></table></div></Card>;
}
