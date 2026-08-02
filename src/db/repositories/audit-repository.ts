import { desc, eq } from "drizzle-orm";

import { auditLogs } from "@/db/schema";
import type { DatabaseExecutor } from "./workspace-repository";

export async function writeAuditEvent(
  db: DatabaseExecutor,
  event: typeof auditLogs.$inferInsert,
): Promise<void> {
  await db.insert(auditLogs).values(event);
}

export async function listWorkspaceAuditEvents(
  db: DatabaseExecutor,
  workspaceId: string,
  limit = 100,
) {
  return db
    .select({
      id: auditLogs.id,
      actorId: auditLogs.actorId,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      action: auditLogs.action,
      label: auditLogs.label,
      before: auditLogs.before,
      after: auditLogs.after,
      via: auditLogs.via,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .where(eq(auditLogs.workspaceId, workspaceId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(Math.min(Math.max(limit, 1), 250));
}
