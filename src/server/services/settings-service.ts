import { getDb } from "@/db/client";
import { listWorkspaceIntegrations } from "@/db/repositories/settings-repository";
import type { Database } from "@/db/repositories/workspace-repository";
import { assertPermission } from "@/server/auth/permissions";
import type { SessionContext } from "@/server/auth/session-context";

export async function getWorkspaceSettings(
  context: SessionContext,
  database: Database = getDb(),
) {
  assertPermission(context.role, "settings:manage");
  const integrations = await listWorkspaceIntegrations(database, context.workspaceId);
  return {
    workspace: { id: context.workspaceId, name: context.workspaceName },
    integrations,
  };
}
