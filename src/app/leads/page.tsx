import { Plus, Search } from "lucide-react";
import Link from "next/link";

import { LeadTable } from "@/components/leads/lead-table";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireSessionContext } from "@/server/auth/session-context";
import { getLeads } from "@/server/services/lead-service";

export const dynamic = "force-dynamic";

interface LeadsPageProps { searchParams: Promise<{ q?: string; status?: string; segment?: string }> }

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const filters = await searchParams;
  const context = await requireSessionContext();
  const rows = await getLeads(context, { includeArchived: true, query: filters.q });
  const leads = rows.filter((lead) =>
    (!filters.status || lead.status === filters.status) &&
    (!filters.segment || lead.segment === filters.segment),
  );
  const selectClass = "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm";
  return (
    <>
      <PageHeader title="Leads" description="Capture, qualify, and convert potential customers." actions={<Link className={buttonVariants()} href="/leads/new"><Plus />New lead</Link>} />
      <Card className="mb-4 p-3">
        <form className="flex flex-col gap-2 sm:flex-row" action="/leads">
          <div className="relative min-w-0 flex-1"><Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-8" name="q" defaultValue={filters.q} placeholder="Search leads…" /></div>
          <select aria-label="Status" className={selectClass} name="status" defaultValue={filters.status ?? ""}><option value="">All statuses</option><option value="new">New</option><option value="to_contact">To contact</option><option value="followed_up">Followed up</option><option value="converted">Converted</option><option value="archived">Archived</option></select>
          <select aria-label="Segment" className={selectClass} name="segment" defaultValue={filters.segment ?? ""}><option value="">All segments</option><option value="idea_rich_founder">Idea-rich founder</option><option value="sme_going_digital">SME going digital</option><option value="corporate_innovator">Corporate innovator</option><option value="ph_startup_scaleup">PH startup / scaleup</option></select>
          <button className={buttonVariants({ variant: "outline" })} type="submit">Apply</button>
        </form>
      </Card>
      <LeadTable leads={leads} />
    </>
  );
}
