import { LayoutGrid, List, Plus } from "lucide-react";
import Link from "next/link";

import { DealPipelineBoard } from "@/components/deals/deal-pipeline-board";
import { DealTable } from "@/components/deals/deal-table";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { requireSessionContext } from "@/server/auth/session-context";
import { getDeals, getPipelineStages } from "@/server/services/deal-service";

export const dynamic = "force-dynamic";
interface DealsPageProps { searchParams: Promise<{ view?: string }> }

export default async function DealsPage({ searchParams }: DealsPageProps) {
  const { view } = await searchParams;
  const context = await requireSessionContext();
  const [deals, stages] = await Promise.all([getDeals(context, { includeArchived: view === "list" }), getPipelineStages(context)]);
  return <><PageHeader title="Deals" description="Move opportunities through your end-to-end sales pipeline." actions={<><Link className={buttonVariants({ variant: "outline" })} href={view === "list" ? "/deals" : "/deals?view=list"}>{view === "list" ? <LayoutGrid /> : <List />}{view === "list" ? "Board" : "List"}</Link><Link className={buttonVariants()} href="/deals/new"><Plus />New deal</Link></>} />{view === "list" ? <DealTable deals={deals} /> : <DealPipelineBoard deals={deals} stages={stages} />}</>;
}
