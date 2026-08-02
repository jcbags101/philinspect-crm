import { asc, eq } from "drizzle-orm";

import { integrationConnections } from "@/db/schema";
import type { DatabaseExecutor } from "./workspace-repository";

export async function listWorkspaceIntegrations(
  database: DatabaseExecutor,
  workspaceId: string,
) {
  return database
    .select()
    .from(integrationConnections)
    .where(eq(integrationConnections.workspaceId, workspaceId))
    .orderBy(asc(integrationConnections.provider));
}
