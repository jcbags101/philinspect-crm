import { notFound } from "next/navigation";

import { LeadForm } from "@/components/leads/lead-form";
import { PageHeader } from "@/components/page-header";
import { assertPermission } from "@/server/auth/permissions";
import { requireSessionContext } from "@/server/auth/session-context";
import { NotFoundError } from "@/server/errors/domain-error";
import { getCompanies } from "@/server/services/company-service";
import { getContacts } from "@/server/services/contact-service";
import { getLead } from "@/server/services/lead-service";

interface EditLeadPageProps { params: Promise<{ leadId: string }> }

export default async function EditLeadPage({ params }: EditLeadPageProps) {
  const { leadId } = await params;
  const context = await requireSessionContext();
  assertPermission(context.role, "leads:write");
  const [lead, companies, contacts] = await Promise.all([
    getLead(context, leadId).catch((error) => {
      if (error instanceof NotFoundError) notFound();
      throw error;
    }),
    getCompanies(context, { includeArchived: true }),
    getContacts(context, { includeArchived: true }),
  ]);
  return <><PageHeader eyebrow="Leads" title={`Edit ${lead.name}`} /><LeadForm lead={lead} companies={companies} contacts={contacts} /></>;
}
