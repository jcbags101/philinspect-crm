import { and, asc, count, desc, eq } from "drizzle-orm";

import {
  users,
  workspaceInvitations,
  workspaceMemberships,
} from "@/db/schema";
import type {
  DatabaseExecutor,
  DatabaseTransaction,
} from "./workspace-repository";

export async function listWorkspaceMembers(
  database: DatabaseExecutor,
  workspaceId: string,
) {
  return database
    .select({
      id: workspaceMemberships.id,
      userId: workspaceMemberships.userId,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      role: workspaceMemberships.role,
      status: workspaceMemberships.status,
      createdAt: workspaceMemberships.createdAt,
      updatedAt: workspaceMemberships.updatedAt,
    })
    .from(workspaceMemberships)
    .innerJoin(users, eq(workspaceMemberships.userId, users.id))
    .where(eq(workspaceMemberships.workspaceId, workspaceId))
    .orderBy(asc(users.name));
}

export async function findWorkspaceMemberById(
  database: DatabaseExecutor,
  workspaceId: string,
  membershipId: string,
) {
  const [member] = await database
    .select({
      id: workspaceMemberships.id,
      userId: workspaceMemberships.userId,
      name: users.name,
      email: users.email,
      role: workspaceMemberships.role,
      status: workspaceMemberships.status,
    })
    .from(workspaceMemberships)
    .innerJoin(users, eq(workspaceMemberships.userId, users.id))
    .where(
      and(
        eq(workspaceMemberships.workspaceId, workspaceId),
        eq(workspaceMemberships.id, membershipId),
      ),
    )
    .limit(1);
  return member ?? null;
}

export async function findWorkspaceMemberByEmail(
  database: DatabaseExecutor,
  workspaceId: string,
  email: string,
) {
  const [member] = await database
    .select({ id: workspaceMemberships.id, status: workspaceMemberships.status })
    .from(workspaceMemberships)
    .innerJoin(users, eq(workspaceMemberships.userId, users.id))
    .where(
      and(
        eq(workspaceMemberships.workspaceId, workspaceId),
        eq(users.email, email),
      ),
    )
    .limit(1);
  return member ?? null;
}

export async function findActiveWorkspaceMemberByUserId(
  database: DatabaseExecutor,
  workspaceId: string,
  userId: string,
) {
  const [member] = await database
    .select({ id: workspaceMemberships.id, userId: workspaceMemberships.userId })
    .from(workspaceMemberships)
    .where(
      and(
        eq(workspaceMemberships.workspaceId, workspaceId),
        eq(workspaceMemberships.userId, userId),
        eq(workspaceMemberships.status, "active"),
      ),
    )
    .limit(1);
  return member ?? null;
}

export async function countActiveWorkspaceAdmins(
  database: DatabaseExecutor,
  workspaceId: string,
) {
  const [result] = await database
    .select({ total: count(workspaceMemberships.id) })
    .from(workspaceMemberships)
    .where(
      and(
        eq(workspaceMemberships.workspaceId, workspaceId),
        eq(workspaceMemberships.role, "admin"),
        eq(workspaceMemberships.status, "active"),
      ),
    );
  return result?.total ?? 0;
}

export async function updateWorkspaceMember(
  transaction: DatabaseTransaction,
  workspaceId: string,
  membershipId: string,
  input: {
    role: "account_manager" | "sales" | "admin";
    status: "active" | "suspended";
  },
) {
  const [member] = await transaction
    .update(workspaceMemberships)
    .set({ ...input, updatedAt: new Date() })
    .where(
      and(
        eq(workspaceMemberships.workspaceId, workspaceId),
        eq(workspaceMemberships.id, membershipId),
      ),
    )
    .returning();
  return member ?? null;
}

export async function listWorkspaceInvitations(
  database: DatabaseExecutor,
  workspaceId: string,
) {
  return database
    .select({
      id: workspaceInvitations.id,
      email: workspaceInvitations.email,
      role: workspaceInvitations.role,
      status: workspaceInvitations.status,
      expiresAt: workspaceInvitations.expiresAt,
      createdAt: workspaceInvitations.createdAt,
    })
    .from(workspaceInvitations)
    .where(eq(workspaceInvitations.workspaceId, workspaceId))
    .orderBy(desc(workspaceInvitations.createdAt))
    .limit(100);
}
