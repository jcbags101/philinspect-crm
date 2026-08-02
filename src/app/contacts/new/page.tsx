import { ContactForm } from "@/components/contacts/contact-form";
import { PageHeader } from "@/components/page-header";
import { requirePagePermission } from "@/server/auth/page-authorization";
import { requireSessionContext } from "@/server/auth/session-context";
import { getCompanies } from "@/server/services/company-service";

export default async function NewContactPage() {
  const context = await requireSessionContext();
  requirePagePermission(context.role, "contacts:write");
  const companies = await getCompanies(context);
  return (
    <>
      <PageHeader eyebrow="Contacts" title="New contact" description="Add a person to your workspace." />
      <ContactForm companies={companies} />
    </>
  );
}
