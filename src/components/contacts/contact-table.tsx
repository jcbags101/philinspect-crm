import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ContactRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  companyName: string | null;
  deletedAt: Date | null;
}

export function ContactTable({ contacts }: { contacts: ContactRow[] }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr className="border-b last:border-0 hover:bg-muted/20" key={contact.id}>
                <td className="px-4 py-3">
                  <Link className="font-medium hover:text-primary hover:underline" href={`/contacts/${contact.id}`}>
                    {contact.firstName} {contact.lastName}
                  </Link>
                  <div className="mt-0.5 text-xs text-muted-foreground">{contact.email ?? "No email"}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{contact.companyName ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{contact.jobTitle ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{contact.phone ?? "—"}</td>
                <td className="px-4 py-3"><Badge variant="outline">{contact.deletedAt ? "Archived" : "Active"}</Badge></td>
              </tr>
            ))}
            {contacts.length === 0 && <tr><td className="px-4 py-10 text-center text-muted-foreground" colSpan={5}>No contacts found.</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
