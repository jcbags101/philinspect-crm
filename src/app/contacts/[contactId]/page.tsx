import Link from "next/link";
import { notFound } from "next/navigation";

import { setContactArchivedAction } from "@/app/contacts/actions";
import { PageHeader } from "@/components/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSessionContext } from "@/server/auth/session-context";
import { NotFoundError } from "@/server/errors/domain-error";
import { getContact } from "@/server/services/contact-service";

interface ContactPageProps { params: Promise<{ contactId: string }> }

export default async function ContactPage({ params }: ContactPageProps) {
  const { contactId } = await params;
  const context = await requireSessionContext();
  const contact = await getContact(context, contactId).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  const archiveAction = setContactArchivedAction.bind(null, contact.id, !contact.deletedAt);
  const name = `${contact.firstName} ${contact.lastName}`;
  return (
    <>
      <PageHeader
        eyebrow="Contacts"
        title={name}
        description={contact.deletedAt ? "Archived contact" : contact.jobTitle ?? "Active contact"}
        actions={
          <>
            <Link className={buttonVariants({ variant: "outline" })} href={`/contacts/${contact.id}/edit`}>Edit</Link>
            <form action={archiveAction}><Button variant={contact.deletedAt ? "outline" : "destructive"} type="submit">{contact.deletedAt ? "Restore" : "Archive"}</Button></form>
          </>
        }
      />
      <Card className="max-w-3xl">
        <CardHeader><CardTitle>Contact details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid gap-5 sm:grid-cols-2">
            <div><dt className="text-xs text-muted-foreground">Email</dt><dd className="mt-1 text-sm">{contact.email ?? "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Phone</dt><dd className="mt-1 text-sm">{contact.phone ?? "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Company</dt><dd className="mt-1 text-sm">{contact.companyName ?? "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Job title</dt><dd className="mt-1 text-sm">{contact.jobTitle ?? "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Created</dt><dd className="mt-1 text-sm">{contact.createdAt.toLocaleDateString("en-PH")}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Last updated</dt><dd className="mt-1 text-sm">{contact.updatedAt.toLocaleDateString("en-PH")}</dd></div>
          </dl>
        </CardContent>
      </Card>
    </>
  );
}
