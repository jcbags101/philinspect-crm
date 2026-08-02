import Link from "next/link";
import { notFound } from "next/navigation";

import { setLeadArchivedAction } from "@/app/leads/actions";
import { EntityArchiveAction } from "@/components/entity-archive-action";
import { ConvertLeadButton } from "@/components/leads/convert-lead-button";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSessionContext } from "@/server/auth/session-context";
import { NotFoundError } from "@/server/errors/domain-error";
import { getLead } from "@/server/services/lead-service";

const label = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
interface LeadPageProps { params: Promise<{ leadId: string }> }

export default async function LeadPage({ params }: LeadPageProps) {
  const { leadId } = await params;
  const context = await requireSessionContext();
  const lead = await getLead(context, leadId).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  const archiveAction = setLeadArchivedAction.bind(null, lead.id, !lead.deletedAt);
  const canEdit = !lead.convertedAt && !lead.deletedAt;
  const canArchive = !lead.convertedAt;
  return (
    <>
      <PageHeader eyebrow="Leads" title={lead.name} description={`${lead.companyName} · ${lead.deletedAt ? "Archived" : label(lead.status)}`} actions={<>{canEdit && <Link className={buttonVariants({ variant: "outline" })} href={`/leads/${lead.id}/edit`}>Edit</Link>}{canArchive && <EntityArchiveAction action={archiveAction} archived={Boolean(lead.deletedAt)} entityLabel={lead.name} />}{canEdit && <ConvertLeadButton leadId={lead.id} />}</>} />
      <Card className="max-w-3xl"><CardHeader><CardTitle>Lead details</CardTitle></CardHeader><CardContent><dl className="grid gap-5 sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">Email</dt><dd className="mt-1 text-sm">{lead.email ?? "—"}</dd></div><div><dt className="text-xs text-muted-foreground">Phone</dt><dd className="mt-1 text-sm">{lead.phone ?? "—"}</dd></div><div><dt className="text-xs text-muted-foreground">Segment</dt><dd className="mt-1 text-sm">{label(lead.segment)}</dd></div><div><dt className="text-xs text-muted-foreground">Industry</dt><dd className="mt-1 text-sm">{lead.industry ?? "—"}</dd></div><div><dt className="text-xs text-muted-foreground">Linked company</dt><dd className="mt-1 text-sm">{lead.linkedCompanyName ?? "Created on conversion"}</dd></div><div><dt className="text-xs text-muted-foreground">Linked contact</dt><dd className="mt-1 text-sm">{lead.linkedContactFirstName ? `${lead.linkedContactFirstName} ${lead.linkedContactLastName}` : "Created on conversion"}</dd></div><div><dt className="text-xs text-muted-foreground">Created</dt><dd className="mt-1 text-sm">{lead.createdAt.toLocaleDateString("en-PH")}</dd></div><div><dt className="text-xs text-muted-foreground">Converted</dt><dd className="mt-1 text-sm">{lead.convertedAt?.toLocaleDateString("en-PH") ?? "—"}</dd></div></dl></CardContent></Card>
    </>
  );
}
