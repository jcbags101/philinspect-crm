import { CheckCircle2, Clock3, PlugZap } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePagePermission } from "@/server/auth/page-authorization";
import { requireSessionContext } from "@/server/auth/session-context";
import { getWorkspaceSettings } from "@/server/services/settings-service";

export const dynamic = "force-dynamic";
const label = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());

export default async function SettingsPage() {
  const context = await requireSessionContext();
  requirePagePermission(context.role, "settings:manage");
  const settings = await getWorkspaceSettings(context);
  return <><PageHeader title="Settings" description="Configure workspace identity and integration readiness." /><div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>Workspace</CardTitle></CardHeader><CardContent><dl className="space-y-4"><div><dt className="text-xs text-muted-foreground">Name</dt><dd className="mt-1 font-medium">{settings.workspace.name}</dd></div><div><dt className="text-xs text-muted-foreground">Workspace ID</dt><dd className="mt-1 break-all font-mono text-xs">{settings.workspace.id}</dd></div><div className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">Organization membership and role changes are managed from the Users screen.</div></dl></CardContent></Card><Card><CardHeader><CardTitle>Integrations</CardTitle></CardHeader><CardContent className="space-y-3">{settings.integrations.map((integration) => <div className="flex items-center justify-between rounded-lg border p-3" key={integration.id}><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-lg bg-muted"><PlugZap className="size-4" /></div><div><p className="font-medium">{label(integration.provider)}</p><p className="text-xs text-muted-foreground">Updated {integration.updatedAt.toLocaleDateString("en-PH")}</p></div></div><Badge variant="outline">{label(integration.status)}</Badge></div>)}{settings.integrations.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No integrations configured.</p>}</CardContent></Card><Card className="lg:col-span-2"><CardHeader><CardTitle>MVP capability status</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><div className="flex gap-3 rounded-lg border p-4"><CheckCircle2 className="size-5 text-emerald-600" /><div><p className="font-medium">CRM and mock inbox</p><p className="text-sm text-muted-foreground">Enabled for the staging demonstration.</p></div></div><div className="flex gap-3 rounded-lg border p-4"><Clock3 className="size-5 text-amber-600" /><div><p className="font-medium">Deferred capabilities</p><p className="text-sm text-muted-foreground">Billing, AI, custom domains, marketplace, advanced reports, documents, and custom fields remain out of MVP scope.</p></div></div></CardContent></Card></div></>;
}
