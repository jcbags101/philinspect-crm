import Link from "next/link";
import { notFound } from "next/navigation";

import { setCompanyArchivedAction } from "@/app/companies/actions";
import { PageHeader } from "@/components/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSessionContext } from "@/server/auth/session-context";
import { NotFoundError } from "@/server/errors/domain-error";
import { getCompany } from "@/server/services/company-service";

interface CompanyPageProps { params: Promise<{ companyId: string }> }

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { companyId } = await params;
  const context = await requireSessionContext();
  const company = await getCompany(context, companyId).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  const archiveAction = setCompanyArchivedAction.bind(null, company.id, !company.deletedAt);
  return <>
    <PageHeader eyebrow="Companies" title={company.name} description={company.deletedAt ? "Archived company" : "Active customer organization"} actions={<><Link className={buttonVariants({ variant: "outline" })} href={`/companies/${company.id}/edit`}>Edit</Link><form action={archiveAction}><Button variant={company.deletedAt ? "outline" : "destructive"} type="submit">{company.deletedAt ? "Restore" : "Archive"}</Button></form></>} />
    <Card className="max-w-3xl"><CardHeader><CardTitle>Company details</CardTitle></CardHeader><CardContent><dl className="grid gap-5 sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">Website</dt><dd className="mt-1 text-sm">{company.domain ?? "—"}</dd></div><div><dt className="text-xs text-muted-foreground">Industry</dt><dd className="mt-1 text-sm">{company.industry ?? "—"}</dd></div><div><dt className="text-xs text-muted-foreground">Created</dt><dd className="mt-1 text-sm">{company.createdAt.toLocaleDateString("en-PH")}</dd></div><div><dt className="text-xs text-muted-foreground">Last updated</dt><dd className="mt-1 text-sm">{company.updatedAt.toLocaleDateString("en-PH")}</dd></div></dl></CardContent></Card>
  </>;
}
