import { auditLogs } from "@/db/schema";
import type { DatabaseExecutor } from "./workspace-repository";

export async function writeAuditEvent(
  db: DatabaseExecutor,
  event: typeof auditLogs.$inferInsert,
): Promise<void> {
  await db.insert(auditLogs).values(event);
}
