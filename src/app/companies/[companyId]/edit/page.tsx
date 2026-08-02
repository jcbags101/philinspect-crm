import { notFound } from "next/navigation";

import { CompanyForm } from "@/components/companies/company-form";
import { PageHeader } from "@/components/page-header";
import { requirePagePermission } from "@/server/auth/page-authorization";
import { requireSessionContext } from "@/server/auth/session-context";
import { NotFoundError } from "@/server/errors/domain-error";
import { getCompany } from "@/server/services/company-service";

interface EditCompanyPageProps { params: Promise<{ companyId: string }> }

export default async function EditCompanyPage({ params }: EditCompanyPageProps) {
  const { companyId } = await params;
  const context = await requireSessionContext();
  requirePagePermission(context.role, "companies:write");
  const company = await getCompany(context, companyId).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  return <><PageHeader eyebrow="Companies" title={`Edit ${company.name}`} /><CompanyForm company={company} /></>;
}
