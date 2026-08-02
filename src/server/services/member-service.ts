import { getDb } from "@/db/client";
import {
  countActiveWorkspaceAdmins,
  findWorkspaceMemberById,
  listWorkspaceInvitations,
  listWorkspaceMembers,
  updateWorkspaceMember,
} from "@/db/repositories/member-repository";
import type { Database } from "@/db/repositories/workspace-repository";
import { assertPermission } from "@/server/auth/permissions";
import type { SessionContext } from "@/server/auth/session-context";
import { ConflictError, NotFoundError } from "@/server/errors/domain-error";
import { updateMemberSchema } from "@/server/validation/member";

import { recordAudit } from "./audit-service";

export async function getWorkspaceMembers(
  context: SessionContext,
  database: Database = getDb(),
) {
  assertPermission(context.role, "members:read");
  return listWorkspaceMembers(database, context.workspaceId);
}

export async function getWorkspaceInvitations(
  context: SessionContext,
  database: Database = getDb(),
) {
  assertPermission(context.role, "invitations:manage");
  const invitations = await listWorkspaceInvitations(database, context.workspaceId);
  const now = Date.now();
  return invitations.map((invitation) => ({
    ...invitation,
    expired: invitation.expiresAt.getTime() <= now,
  }));
}

export async function changeWorkspaceMember(
  context: SessionContext,
  membershipId: string,
  unsafeInput: unknown,
  database: Database = getDb(),
) {
  assertPermission(context.role, "members:manage");
  const input = updateMemberSchema.parse(unsafeInput);
  return database.transaction(async (transaction) => {
    const before = await findWorkspaceMemberById(
      transaction,
      context.workspaceId,
      membershipId,
    );
    if (!before) throw new NotFoundError("The workspace member could not be found.");
    if (before.userId === context.userId && input.status === "suspended") {
      throw new ConflictError("You cannot suspend your own membership.");
    }
    const removesActiveAdmin =
      before.role === "admin" &&
      before.status === "active" &&
      (input.role !== "admin" || input.status !== "active");
    if (
      removesActiveAdmin &&
      (await countActiveWorkspaceAdmins(transaction, context.workspaceId)) <= 1
    ) {
      throw new ConflictError("The workspace must keep at least one active admin.");
    }
    const member = await updateWorkspaceMember(
      transaction,
      context.workspaceId,
      membershipId,
      input,
    );
    if (!member) throw new NotFoundError("The workspace member could not be found.");

    if (before.role !== input.role) {
      await recordAudit(transaction, {
        context,
        entityType: "workspace_membership",
        entityId: member.id,
        action: "role_changed",
        label: "Changed a workspace member role",
        before: { userId: before.userId, role: before.role },
        after: { userId: before.userId, role: input.role },
      });
    }
    if (before.status !== input.status) {
      await recordAudit(transaction, {
        context,
        entityType: "workspace_membership",
        entityId: member.id,
        action: "status",
        label: input.status === "active" ? "Reactivated a workspace member" : "Suspended a workspace member",
        before: { userId: before.userId, status: before.status },
        after: { userId: before.userId, status: input.status },
      });
    }
    return member;
  });
}
