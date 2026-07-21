import { and, count, eq, isNotNull, isNull } from "drizzle-orm";

import { getDb } from "@/db/client";
import { roles, userRoles, users, workspaces } from "@/db/schema";
import type { AppRole } from "@/server/auth/permissions";

export type Database = ReturnType<typeof getDb>;
export type DatabaseTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
export type DatabaseExecutor = Database | DatabaseTransaction;

export interface WorkspaceMemberRecord {
  userId: string;
  workspaceId: string;
  workspaceName: string;
  name: string;
  email: string;
  role: AppRole;
}

export async function findWorkspaceMemberByAuthUserId(
  db: DatabaseExecutor,
  authUserId: string,
): Promise<WorkspaceMemberRecord | null> {
  const [member] = await db
    .select({
      userId: users.id,
      workspaceId: workspaces.id,
      workspaceName: workspaces.name,
      name: users.name,
      email: users.email,
      role: roles.name,
    })
    .from(users)
    .innerJoin(workspaces, eq(users.workspaceId, workspaces.id))
    .innerJoin(userRoles, eq(users.id, userRoles.userId))
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(users.authUserId, authUserId))
    .limit(1);

  return member ?? null;
}

export async function findOrCreateWorkspace(
  db: DatabaseTransaction,
  neonAuthOrganizationId: string,
  name: string,
): Promise<{ id: string; name: string }> {
  await db
    .insert(workspaces)
    .values({ neonAuthOrganizationId, name })
    .onConflictDoNothing({ target: workspaces.neonAuthOrganizationId });

  const [workspace] = await db
    .select({ id: workspaces.id, name: workspaces.name })
    .from(workspaces)
    .where(eq(workspaces.neonAuthOrganizationId, neonAuthOrganizationId))
    .limit(1);

  if (!workspace) throw new Error("Workspace could not be resolved.");
  return workspace;
}

export async function countWorkspaceMembers(
  db: DatabaseTransaction,
  workspaceId: string,
): Promise<number> {
  const [result] = await db
    .select({ value: count() })
    .from(users)
    .where(and(eq(users.workspaceId, workspaceId), isNotNull(users.authUserId)));
  return result?.value ?? 0;
}

export async function createOrLinkWorkspaceMember(
  db: DatabaseTransaction,
  input: {
    authUserId: string;
    workspaceId: string;
    name: string;
    email: string;
    role: AppRole;
  },
): Promise<void> {
  const [existingEmail] = await db
    .select({ id: users.id, authUserId: users.authUserId })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  let userId: string;
  if (existingEmail && !existingEmail.authUserId) {
    const [linked] = await db
      .update(users)
      .set({
        authUserId: input.authUserId,
        workspaceId: input.workspaceId,
        name: input.name,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, existingEmail.id), isNull(users.authUserId)))
      .returning({ id: users.id });
    if (!linked) throw new Error("Existing user could not be linked.");
    userId = linked.id;
  } else {
    const [created] = await db
      .insert(users)
      .values({
        authUserId: input.authUserId,
        workspaceId: input.workspaceId,
        name: input.name,
        email: input.email,
      })
      .returning({ id: users.id });
    if (!created) throw new Error("Application user could not be created.");
    userId = created.id;
  }

  const [role] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, input.role)).limit(1);
  if (!role) throw new Error(`Required CRM role is missing: ${input.role}`);

  await db.insert(userRoles).values({ userId, roleId: role.id }).onConflictDoNothing();
}
