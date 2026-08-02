import { ContactForm } from "@/components/contacts/contact-form";
import { PageHeader } from "@/components/page-header";
import { assertPermission } from "@/server/auth/permissions";
import { requireSessionContext } from "@/server/auth/session-context";
import { getCompanies } from "@/server/services/company-service";

export default async function NewContactPage() {
  const context = await requireSessionContext();
  assertPermission(context.role, "contacts:write");
  const companies = await getCompanies(context);
  return (
    <>
      <PageHeader eyebrow="Contacts" title="New contact" description="Add a person to your workspace." />
      <ContactForm companies={companies} />
    </>
  );
}
