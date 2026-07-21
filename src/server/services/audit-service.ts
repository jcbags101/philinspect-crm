import { writeAuditEvent } from "@/db/repositories/audit-repository";
import type { DatabaseTransaction } from "@/db/repositories/workspace-repository";
import type { auditLogs } from "@/db/schema";

export async function recordInboxAudit(
  tx: DatabaseTransaction,
  input: {
    workspaceId: string;
    actorId: string;
    entityType: string;
    entityId: string;
    action: typeof auditLogs.$inferInsert.action;
    label: string;
    after?: Record<string, unknown>;
  },
): Promise<void> {
  await writeAuditEvent(tx, {
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    label: input.label,
    after: input.after,
    via: "relaydesk-demo",
  });
}
