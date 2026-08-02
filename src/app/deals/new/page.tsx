import { DealForm } from "@/components/deals/deal-form";
import { PageHeader } from "@/components/page-header";
import { assertPermission } from "@/server/auth/permissions";
import { requireSessionContext } from "@/server/auth/session-context";
import { getCompanies } from "@/server/services/company-service";
import { getContacts } from "@/server/services/contact-service";
import { getPipelineStages } from "@/server/services/deal-service";

export default async function NewDealPage() {
  const context = await requireSessionContext();
  assertPermission(context.role, "deals:write");
  const [companies, contacts, stages] = await Promise.all([getCompanies(context), getContacts(context), getPipelineStages(context)]);
  return <><PageHeader eyebrow="Deals" title="New deal" description="Add an opportunity to the sales pipeline." /><DealForm companies={companies} contacts={contacts} stages={stages} /></>;
}
