import { Search } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requirePagePermission } from "@/server/auth/page-authorization";
import { requireSessionContext } from "@/server/auth/session-context";
import { getWorkspaceAuditEvents } from "@/server/services/audit-service";

export const dynamic = "force-dynamic";
const label = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
interface Props { searchParams: Promise<{ q?: string }> }

export default async function AuditLogsPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const context = await requireSessionContext();
  requirePagePermission(context.role, "audit:read");
  const events = await getWorkspaceAuditEvents(context, 250);
  const needle = q.trim().toLowerCase();
  const filtered = needle ? events.filter((event) => [event.label, event.action, event.entityType, event.actorName].some((value) => String(value ?? "").toLowerCase().includes(needle))) : events;
  return <><PageHeader title="Audit logs" description="A transparent history of important workspace changes." /><Card className="mb-4 p-3"><form action="/audit-logs"><div className="relative max-w-md"><Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-8" name="q" defaultValue={q} placeholder="Search audit events…" /></div></form></Card><Card className="overflow-hidden p-0"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead><tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground"><th className="px-4 py-3">Event</th><th className="px-4 py-3">Entity</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Timestamp</th></tr></thead><tbody>{filtered.map((event) => <tr className="border-b last:border-0" key={event.id}><td className="px-4 py-3 font-medium">{event.label}</td><td className="px-4 py-3"><Badge variant="outline">{label(event.entityType)}</Badge></td><td className="px-4 py-3"><Badge variant="outline">{label(event.action)}</Badge></td><td className="px-4 py-3 text-muted-foreground">{event.actorName ?? "System"}</td><td className="px-4 py-3 text-muted-foreground">{event.via}</td><td className="px-4 py-3 text-muted-foreground">{event.createdAt.toLocaleString("en-PH")}</td></tr>)}{filtered.length === 0 && <tr><td className="px-4 py-10 text-center text-muted-foreground" colSpan={6}>No audit events found.</td></tr>}</tbody></table></div></Card></>;
}
