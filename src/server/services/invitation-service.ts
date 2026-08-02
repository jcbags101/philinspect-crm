import { getDb } from "@/db/client";
import { writeAuditEvent } from "@/db/repositories/audit-repository";
import {
  findInvitationByTokenHash,
  insertWorkspaceInvitation,
  markInvitationAccepted,
  revokePendingInvitationByEmail,
  revokeWorkspaceInvitation,
} from "@/db/repositories/invitation-repository";
import { findWorkspaceMemberByEmail } from "@/db/repositories/member-repository";
import {
  createOrLinkWorkspaceMember,
  type Database,
} from "@/db/repositories/workspace-repository";
import {
  assertPermission,
  PermissionDeniedError,
} from "@/server/auth/permissions";
import type { SessionContext } from "@/server/auth/session-context";
import {
  ConflictError,
  NotFoundError,
} from "@/server/errors/domain-error";
import {
  createInvitationToken,
  hashInvitationToken,
} from "@/server/invitations/token";
import {
  createInvitationSchema,
  invitationTokenSchema,
} from "@/server/validation/invitation";

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface InvitationIdentity {
  authUserId: string;
  email: string;
  name: string;
}

export { hashInvitationToken } from "@/server/invitations/token";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function createWorkspaceInvitation(
  context: SessionContext,
  unsafeInput: unknown,
  database: Database = getDb(),
) {
  assertPermission(context.role, "invitations:manage");
  const input = createInvitationSchema.parse(unsafeInput);
  const token = createInvitationToken();
  const tokenHash = hashInvitationToken(token);
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

  const invitation = await database.transaction(async (transaction) => {
    if (
      await findWorkspaceMemberByEmail(
        transaction,
        context.workspaceId,
        input.email,
      )
    ) {
      throw new ConflictError("This person is already a workspace member.");
    }
    await revokePendingInvitationByEmail(
      transaction,
      context.workspaceId,
      input.email,
    );
    const created = await insertWorkspaceInvitation(transaction, {
      workspaceId: context.workspaceId,
      email: input.email,
      role: input.role,
      tokenHash,
      invitedById: context.userId,
      expiresAt,
    });
    await writeAuditEvent(transaction, {
      workspaceId: context.workspaceId,
      actorId: context.userId,
      entityType: "workspace_invitation",
      entityId: created.id,
      action: "invited",
      label: "Invited a workspace member",
      after: { email: input.email, role: input.role, expiresAt },
    });
    return created;
  });

  return { ...invitation, token };
}

export async function getInvitationPreview(
  unsafeToken: unknown,
  database: Database = getDb(),
) {
  const token = invitationTokenSchema.parse(unsafeToken);
  const invitation = await findInvitationByTokenHash(
    database,
    hashInvitationToken(token),
  );
  if (!invitation) return null;
  return {
    workspaceName: invitation.workspaceName,
    email: invitation.email,
    role: invitation.role,
    status: invitation.status,
    expired: invitation.expiresAt.getTime() <= Date.now(),
  };
}

export async function acceptWorkspaceInvitation(
  identity: InvitationIdentity,
  unsafeToken: unknown,
  database: Database = getDb(),
) {
  const token = invitationTokenSchema.parse(unsafeToken);
  const tokenHash = hashInvitationToken(token);
  const normalizedEmail = normalizeEmail(identity.email);

  return database.transaction(async (transaction) => {
    const invitation = await findInvitationByTokenHash(transaction, tokenHash);
    if (!invitation) throw new NotFoundError("The invitation could not be found.");
    if (invitation.status !== "pending") {
      throw new ConflictError("This invitation is no longer available.");
    }
    if (invitation.expiresAt.getTime() <= Date.now()) {
      throw new ConflictError("This invitation has expired.");
    }
    if (normalizeEmail(invitation.email) !== normalizedEmail) {
      throw new PermissionDeniedError("invitations:manage");
    }

    const userId = await createOrLinkWorkspaceMember(transaction, {
      authUserId: identity.authUserId,
      workspaceId: invitation.workspaceId,
      name: identity.name,
      email: normalizedEmail,
      role: invitation.role,
    });
    if (!(await markInvitationAccepted(transaction, invitation.id, userId))) {
      throw new ConflictError("This invitation was already accepted.");
    }
    await writeAuditEvent(transaction, {
      workspaceId: invitation.workspaceId,
      actorId: userId,
      entityType: "workspace_invitation",
      entityId: invitation.id,
      action: "accepted",
      label: "Accepted a workspace invitation",
      after: { email: normalizedEmail, role: invitation.role },
    });
    return { workspaceId: invitation.workspaceId, userId };
  });
}

export async function revokeInvitation(
  context: SessionContext,
  invitationId: string,
  database: Database = getDb(),
): Promise<void> {
  assertPermission(context.role, "invitations:manage");
  await database.transaction(async (transaction) => {
    if (
      !(await revokeWorkspaceInvitation(
        transaction,
        context.workspaceId,
        invitationId,
      ))
    ) {
      throw new NotFoundError("The invitation could not be found.");
    }
    await writeAuditEvent(transaction, {
      workspaceId: context.workspaceId,
      actorId: context.userId,
      entityType: "workspace_invitation",
      entityId: invitationId,
      action: "revoked",
      label: "Revoked a workspace invitation",
    });
  });
}
