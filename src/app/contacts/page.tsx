import { Plus } from "lucide-react";
import Link from "next/link";

import { ContactTable } from "@/components/contacts/contact-table";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { requireSessionContext } from "@/server/auth/session-context";
import { getContacts } from "@/server/services/contact-service";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const context = await requireSessionContext();
  const contacts = await getContacts(context, { includeArchived: true });
  return (
    <>
      <PageHeader
        title="Contacts"
        description="Manage the people connected to your customer organizations."
        actions={<Link className={buttonVariants()} href="/contacts/new"><Plus />New contact</Link>}
      />
      <ContactTable contacts={contacts} />
    </>
  );
}
