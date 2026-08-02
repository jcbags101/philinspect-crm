import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const label = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());

interface LeadRow {
  id: string;
  name: string;
  companyName: string;
  email: string | null;
  industry: string | null;
  segment: string;
  status: string;
  updatedAt: Date;
  deletedAt: Date | null;
}

export function LeadTable({ leads }: { leads: LeadRow[] }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead><tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground"><th className="px-4 py-3">Lead</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Segment</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Industry</th><th className="px-4 py-3">Updated</th></tr></thead>
          <tbody>
            {leads.map((lead) => (
              <tr className="border-b last:border-0 hover:bg-muted/20" key={lead.id}>
                <td className="px-4 py-3"><Link className="font-medium hover:text-primary hover:underline" href={`/leads/${lead.id}`}>{lead.name}</Link><div className="mt-0.5 text-xs text-muted-foreground">{lead.email ?? "No email"}</div></td>
                <td className="px-4 py-3 text-muted-foreground">{lead.companyName}</td>
                <td className="px-4 py-3"><Badge variant="outline">{label(lead.segment)}</Badge></td>
                <td className="px-4 py-3"><Badge variant="outline">{lead.deletedAt ? "Archived" : label(lead.status)}</Badge></td>
                <td className="px-4 py-3 text-muted-foreground">{lead.industry ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{lead.updatedAt.toLocaleDateString("en-PH")}</td>
              </tr>
            ))}
            {leads.length === 0 && <tr><td className="px-4 py-10 text-center text-muted-foreground" colSpan={6}>No leads found.</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
