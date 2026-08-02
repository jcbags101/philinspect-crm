import { CompanyForm } from "@/components/companies/company-form";
import { PageHeader } from "@/components/page-header";
import { requireSessionContext } from "@/server/auth/session-context";
import { assertPermission } from "@/server/auth/permissions";

export default async function NewCompanyPage() {
  const context = await requireSessionContext();
  assertPermission(context.role, "companies:write");
  return <><PageHeader eyebrow="Companies" title="New company" description="Create a customer organization in this workspace." /><CompanyForm /></>;
}
