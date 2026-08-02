import { notFound } from "next/navigation";

import { ContactForm } from "@/components/contacts/contact-form";
import { PageHeader } from "@/components/page-header";
import { assertPermission } from "@/server/auth/permissions";
import { requireSessionContext } from "@/server/auth/session-context";
import { NotFoundError } from "@/server/errors/domain-error";
import { getCompanies } from "@/server/services/company-service";
import { getContact } from "@/server/services/contact-service";

interface EditContactPageProps { params: Promise<{ contactId: string }> }

export default async function EditContactPage({ params }: EditContactPageProps) {
  const { contactId } = await params;
  const context = await requireSessionContext();
  assertPermission(context.role, "contacts:write");
  const [contact, companies] = await Promise.all([
    getContact(context, contactId).catch((error) => {
      if (error instanceof NotFoundError) notFound();
      throw error;
    }),
    getCompanies(context, { includeArchived: true }),
  ]);
  return (
    <>
      <PageHeader eyebrow="Contacts" title={`Edit ${contact.firstName} ${contact.lastName}`} />
      <ContactForm contact={contact} companies={companies} />
    </>
  );
}
