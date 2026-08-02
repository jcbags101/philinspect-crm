import { notFound } from "next/navigation";

import { DealForm } from "@/components/deals/deal-form";
import { PageHeader } from "@/components/page-header";
import { requirePagePermission } from "@/server/auth/page-authorization";
import { requireSessionContext } from "@/server/auth/session-context";
import { NotFoundError } from "@/server/errors/domain-error";
import { getCompanies } from "@/server/services/company-service";
import { getContacts } from "@/server/services/contact-service";
import { getDeal, getPipelineStages } from "@/server/services/deal-service";

interface EditDealPageProps { params: Promise<{ dealId: string }> }
export default async function EditDealPage({ params }: EditDealPageProps) {
  const { dealId } = await params;
  const context = await requireSessionContext();
  requirePagePermission(context.role, "deals:write");
  const [deal, companies, contacts, stages] = await Promise.all([getDeal(context, dealId).catch((error) => { if (error instanceof NotFoundError) notFound(); throw error; }), getCompanies(context, { includeArchived: true }), getContacts(context, { includeArchived: true }), getPipelineStages(context)]);
  return <><PageHeader eyebrow="Deals" title={`Edit ${deal.title}`} /><DealForm deal={deal} companies={companies} contacts={contacts} stages={stages} /></>;
}
