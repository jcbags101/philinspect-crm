import Link from "next/link";

import { MoveDealStageForm } from "@/components/deals/move-deal-stage-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface Stage { id: string; label: string; outcome: "open" | "won" | "lost" }
interface Deal { id: string; title: string; companyName: string; pipelineStageId: string; value: string | null; currency: string; probability: number }

function money(value: string | null, currency: string) {
  return value ? new Intl.NumberFormat("en-PH", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value)) : "No value";
}

export function DealPipelineBoard({ deals, stages }: { deals: Deal[]; stages: Stage[] }) {
  return (
    <div className="overflow-x-auto pb-3">
      <div className="grid min-w-max grid-flow-col auto-cols-[280px] gap-4">
        {stages.map((stage) => {
          const stageDeals = deals.filter((deal) => deal.pipelineStageId === stage.id);
          return (
            <section key={stage.id} className="rounded-xl border bg-muted/15 p-3" aria-labelledby={`stage-${stage.id}`}>
              <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold" id={`stage-${stage.id}`}>{stage.label}</h2><Badge variant="outline">{stageDeals.length}</Badge></div>
              <div className="space-y-3">
                {stageDeals.map((deal) => (
                  <Card className="p-3" key={deal.id}>
                    <Link className="text-sm font-medium hover:text-primary hover:underline" href={`/deals/${deal.id}`}>{deal.title}</Link>
                    <p className="mt-1 text-xs text-muted-foreground">{deal.companyName}</p>
                    <div className="mt-3 flex items-center justify-between text-xs"><span>{money(deal.value, deal.currency)}</span><span className="text-muted-foreground">{deal.probability}%</span></div>
                    <MoveDealStageForm dealId={deal.id} currentStageId={stage.id} stages={stages} />
                  </Card>
                ))}
                {stageDeals.length === 0 && <p className="rounded-lg border border-dashed px-3 py-8 text-center text-xs text-muted-foreground">No deals</p>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
