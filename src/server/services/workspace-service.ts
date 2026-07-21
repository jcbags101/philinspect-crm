import { getDb } from "@/db/client";
import {
  countWorkspaceMembers,
  createOrLinkWorkspaceMember,
  findOrCreateWorkspace,
  findWorkspaceMemberByAuthUserId,
  type WorkspaceMemberRecord,
} from "@/db/repositories/workspace-repository";

export interface AuthIdentity {
  authUserId: string;
  organizationId: string;
  organizationName: string;
  name: string;
  email: string;
}

export async function resolveWorkspaceMember(identity: AuthIdentity): Promise<WorkspaceMemberRecord> {
  const db = getDb();
  const existing = await findWorkspaceMemberByAuthUserId(db, identity.authUserId);
  if (existing) return existing;

  await db.transaction(async (tx) => {
    const concurrent = await findWorkspaceMemberByAuthUserId(tx, identity.authUserId);
    if (concurrent) return;

    const workspace = await findOrCreateWorkspace(tx, identity.organizationId, identity.organizationName);
    const memberCount = await countWorkspaceMembers(tx, workspace.id);
    await createOrLinkWorkspaceMember(tx, {
      authUserId: identity.authUserId,
      workspaceId: workspace.id,
      name: identity.name,
      email: identity.email,
      role: memberCount === 0 ? "admin" : "account_manager",
    });
  });

  const created = await findWorkspaceMemberByAuthUserId(db, identity.authUserId);
  if (!created) throw new Error("Workspace membership could not be initialized.");
  return created;
}
