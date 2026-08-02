import { LeadForm } from "@/components/leads/lead-form";
import { PageHeader } from "@/components/page-header";
import { assertPermission } from "@/server/auth/permissions";
import { requireSessionContext } from "@/server/auth/session-context";
import { getCompanies } from "@/server/services/company-service";
import { getContacts } from "@/server/services/contact-service";

export default async function NewLeadPage() {
  const context = await requireSessionContext();
  assertPermission(context.role, "leads:write");
  const [companies, contacts] = await Promise.all([
    getCompanies(context),
    getContacts(context),
  ]);
  return <><PageHeader eyebrow="Leads" title="New lead" description="Capture a potential customer and qualification details." /><LeadForm companies={companies} contacts={contacts} /></>;
}
