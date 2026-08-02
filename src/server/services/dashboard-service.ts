import { getDb } from "@/db/client";
import {
  getDashboardActivity,
  getDashboardMetrics,
  getDashboardPipeline,
} from "@/db/repositories/dashboard-repository";
import type { Database } from "@/db/repositories/workspace-repository";
import { assertPermission } from "@/server/auth/permissions";
import type { SessionContext } from "@/server/auth/session-context";

export async function getDashboard(
  context: SessionContext,
  database: Database = getDb(),
) {
  assertPermission(context.role, "leads:read");
  assertPermission(context.role, "deals:read");
  assertPermission(context.role, "companies:read");
  assertPermission(context.role, "tasks:read");

  const scope = {
    workspaceId: context.workspaceId,
    ownedById: context.role === "sales" ? context.userId : undefined,
  };
  const [metrics, pipeline, activity] = await Promise.all([
    getDashboardMetrics(database, scope),
    getDashboardPipeline(database, scope),
    getDashboardActivity(database, scope),
  ]);
  return { metrics, pipeline, activity };
}
