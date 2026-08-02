import { and, eq } from "drizzle-orm";

import { workspaceInvitations, workspaces } from "@/db/schema";

import type {
  DatabaseExecutor,
  DatabaseTransaction,
} from "./workspace-repository";

export async function findInvitationByTokenHash(
  database: DatabaseExecutor,
  tokenHash: string,
) {
  const [invitation] = await database
    .select({
      id: workspaceInvitations.id,
      workspaceId: workspaceInvitations.workspaceId,
      workspaceName: workspaces.name,
      email: workspaceInvitations.email,
      role: workspaceInvitations.role,
      status: workspaceInvitations.status,
      expiresAt: workspaceInvitations.expiresAt,
      acceptedByUserId: workspaceInvitations.acceptedByUserId,
    })
    .from(workspaceInvitations)
    .innerJoin(workspaces, eq(workspaceInvitations.workspaceId, workspaces.id))
    .where(eq(workspaceInvitations.tokenHash, tokenHash))
    .limit(1);

  return invitation ?? null;
}

export async function revokePendingInvitationByEmail(
  database: DatabaseTransaction,
  workspaceId: string,
  email: string,
): Promise<void> {
  await database
    .update(workspaceInvitations)
    .set({ status: "revoked", updatedAt: new Date() })
    .where(
      and(
        eq(workspaceInvitations.workspaceId, workspaceId),
        eq(workspaceInvitations.email, email),
        eq(workspaceInvitations.status, "pending"),
      ),
    );
}

export async function insertWorkspaceInvitation(
  database: DatabaseTransaction,
  input: typeof workspaceInvitations.$inferInsert,
) {
  const [invitation] = await database
    .insert(workspaceInvitations)
    .values(input)
    .returning({
      id: workspaceInvitations.id,
      expiresAt: workspaceInvitations.expiresAt,
    });
  if (!invitation) throw new Error("Invitation could not be created.");
  return invitation;
}

export async function markInvitationAccepted(
  database: DatabaseTransaction,
  invitationId: string,
  acceptedByUserId: string,
): Promise<boolean> {
  const [accepted] = await database
    .update(workspaceInvitations)
    .set({
      acceptedByUserId,
      acceptedAt: new Date(),
      status: "accepted",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(workspaceInvitations.id, invitationId),
        eq(workspaceInvitations.status, "pending"),
      ),
    )
    .returning({ id: workspaceInvitations.id });
  return Boolean(accepted);
}

export async function revokeWorkspaceInvitation(
  database: DatabaseExecutor,
  workspaceId: string,
  invitationId: string,
): Promise<boolean> {
  const [revoked] = await database
    .update(workspaceInvitations)
    .set({ status: "revoked", updatedAt: new Date() })
    .where(
      and(
        eq(workspaceInvitations.id, invitationId),
        eq(workspaceInvitations.workspaceId, workspaceId),
        eq(workspaceInvitations.status, "pending"),
      ),
    )
    .returning({ id: workspaceInvitations.id });
  return Boolean(revoked);
}
