import { and, eq, isNull } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  roles,
  userRoles,
  users,
  workspaceMemberships,
  workspaces,
} from "@/db/schema";
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
  organizationId?: string,
): Promise<WorkspaceMemberRecord | null> {
  const [member] = await db
    .select({
      userId: users.id,
      workspaceId: workspaces.id,
      workspaceName: workspaces.name,
      name: users.name,
      email: users.email,
      role: workspaceMemberships.role,
    })
    .from(workspaceMemberships)
    .innerJoin(users, eq(workspaceMemberships.userId, users.id))
    .innerJoin(workspaces, eq(workspaceMemberships.workspaceId, workspaces.id))
    .where(
      and(
        eq(users.authUserId, authUserId),
        eq(workspaceMemberships.status, "active"),
        organizationId
          ? eq(workspaces.neonAuthOrganizationId, organizationId)
          : undefined,
      ),
    )
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

export async function createOrLinkWorkspaceMember(
  db: DatabaseTransaction,
  input: {
    authUserId: string;
    workspaceId: string;
    name: string;
    email: string;
    role: AppRole;
  },
): Promise<string> {
  const [existingEmail] = await db
    .select({ id: users.id, authUserId: users.authUserId })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  let userId: string;
  if (existingEmail?.authUserId === input.authUserId) {
    userId = existingEmail.id;
  } else if (existingEmail && !existingEmail.authUserId) {
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
  } else if (!existingEmail) {
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
  } else {
    throw new Error("This email is already linked to another application identity.");
  }

  const [role] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, input.role)).limit(1);
  if (!role) throw new Error(`Required CRM role is missing: ${input.role}`);

  await db.insert(userRoles).values({ userId, roleId: role.id }).onConflictDoNothing();
  await db
    .insert(workspaceMemberships)
    .values({
      workspaceId: input.workspaceId,
      userId,
      role: input.role,
      status: "active",
    })
    .onConflictDoUpdate({
      target: [workspaceMemberships.workspaceId, workspaceMemberships.userId],
      set: { role: input.role, status: "active", updatedAt: new Date() },
    });
  return userId;
}
