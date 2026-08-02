import Link from "next/link";
import { Plus } from "lucide-react";

import { CompanyTable } from "@/components/companies/company-table";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { requireSessionContext } from "@/server/auth/session-context";
import { getCompanies } from "@/server/services/company-service";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const context = await requireSessionContext();
  const companies = await getCompanies(context, { includeArchived: true });
  return (
    <>
      <PageHeader title="Companies" description="Manage customer organizations and their CRM relationships." actions={<Link className={buttonVariants()} href="/companies/new"><Plus />New company</Link>} />
      <CompanyTable companies={companies} />
    </>
  );
}
