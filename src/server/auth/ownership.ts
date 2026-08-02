import type { SessionContext } from "./session-context";
import { PermissionDeniedError, type Permission } from "./permissions";

interface OwnedRecord {
  assignedToId?: string | null;
  ownerId?: string | null;
}

export function canAccessOwnedRecord(
  context: SessionContext,
  record: OwnedRecord,
): boolean {
  if (context.role !== "sales") return true;
  return (
    record.ownerId === context.userId || record.assignedToId === context.userId
  );
}

export function assertOwnedRecord(
  context: SessionContext,
  record: OwnedRecord,
  permission: Permission,
): void {
  if (!canAccessOwnedRecord(context, record)) {
    throw new PermissionDeniedError(permission);
  }
}
