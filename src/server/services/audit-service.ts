import {
  listWorkspaceAuditEvents,
  writeAuditEvent,
} from "@/db/repositories/audit-repository";
import type {
  DatabaseExecutor,
  DatabaseTransaction,
} from "@/db/repositories/workspace-repository";
import type { auditLogs } from "@/db/schema";
import { assertPermission } from "@/server/auth/permissions";
import type { SessionContext } from "@/server/auth/session-context";

const SENSITIVE_KEY =
  /(password|passphrase|token|cookie|secret|database.?url|connection.?string|credential|authorization)/i;

export function redactAuditValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactAuditValue);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
      key,
      SENSITIVE_KEY.test(key) ? "[REDACTED]" : redactAuditValue(nested),
    ]),
  );
}

export async function recordAudit(
  transaction: DatabaseTransaction,
  input: {
    context: Pick<SessionContext, "workspaceId" | "userId">;
    entityType: string;
    entityId?: string | null;
    action: typeof auditLogs.$inferInsert.action;
    label: string;
    before?: unknown;
    after?: unknown;
    via?: string;
  },
): Promise<void> {
  await writeAuditEvent(transaction, {
    workspaceId: input.context.workspaceId,
    actorId: input.context.userId,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    label: input.label,
    before: redactAuditValue(input.before),
    after: redactAuditValue(input.after),
    via: input.via ?? "app",
  });
}

export async function getWorkspaceAuditEvents(
  database: DatabaseExecutor,
  context: SessionContext,
  limit?: number,
) {
  assertPermission(context.role, "audit:read");
  return listWorkspaceAuditEvents(database, context.workspaceId, limit);
}

export async function recordInboxAudit(
  transaction: DatabaseTransaction,
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
  await recordAudit(transaction, {
    context: { workspaceId: input.workspaceId, userId: input.actorId },
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    label: input.label,
    after: input.after,
    via: "relaydesk-demo",
  });
}
