import { CompanyForm } from "@/components/companies/company-form";
import { PageHeader } from "@/components/page-header";
import { requirePagePermission } from "@/server/auth/page-authorization";
import { requireSessionContext } from "@/server/auth/session-context";

export default async function NewCompanyPage() {
  const context = await requireSessionContext();
  requirePagePermission(context.role, "companies:write");
  return <><PageHeader eyebrow="Companies" title="New company" description="Create a customer organization in this workspace." /><CompanyForm /></>;
}
