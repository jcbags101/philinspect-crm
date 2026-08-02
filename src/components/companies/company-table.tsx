import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface CompanyRow {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  deletedAt: Date | null;
}

export function CompanyTable({ companies }: { companies: CompanyRow[] }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead><tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground"><th className="px-4 py-3">Company</th><th className="px-4 py-3">Website</th><th className="px-4 py-3">Industry</th><th className="px-4 py-3">Status</th></tr></thead>
          <tbody>
            {companies.map((company) => (
              <tr className="border-b last:border-0 hover:bg-muted/20" key={company.id}>
                <td className="px-4 py-3 font-medium"><Link className="hover:text-primary hover:underline" href={`/companies/${company.id}`}>{company.name}</Link></td>
                <td className="px-4 py-3 text-muted-foreground">{company.domain ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{company.industry ?? "—"}</td>
                <td className="px-4 py-3"><Badge variant="outline">{company.deletedAt ? "Archived" : "Active"}</Badge></td>
              </tr>
            ))}
            {companies.length === 0 && <tr><td className="px-4 py-10 text-center text-muted-foreground" colSpan={4}>No companies found.</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
