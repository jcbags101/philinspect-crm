import { and, asc, desc, eq, ilike, isNull, or } from "drizzle-orm";

import { tasks, users } from "@/db/schema";
import type { DatabaseExecutor, DatabaseTransaction } from "./workspace-repository";

export async function listTasks(
  database: DatabaseExecutor,
  workspaceId: string,
  options: { includeArchived?: boolean; assignedToId?: string; query?: string } = {},
) {
  const query = options.query?.trim();
  return database
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      assignedToId: tasks.assignedToId,
      assignedToName: users.name,
      createdById: tasks.createdById,
      dueAt: tasks.dueAt,
      completedAt: tasks.completedAt,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      deletedAt: tasks.deletedAt,
    })
    .from(tasks)
    .leftJoin(users, eq(tasks.assignedToId, users.id))
    .where(
      and(
        eq(tasks.workspaceId, workspaceId),
        options.includeArchived ? undefined : isNull(tasks.deletedAt),
        options.assignedToId ? eq(tasks.assignedToId, options.assignedToId) : undefined,
        query
          ? or(ilike(tasks.title, `%${query}%`), ilike(tasks.description, `%${query}%`))
          : undefined,
      ),
    )
    .orderBy(asc(tasks.dueAt), desc(tasks.updatedAt))
    .limit(300);
}

export async function findTaskById(
  database: DatabaseExecutor,
  workspaceId: string,
  taskId: string,
) {
  const [task] = await database
    .select()
    .from(tasks)
    .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.id, taskId)))
    .limit(1);
  return task ?? null;
}

export async function insertTask(
  transaction: DatabaseTransaction,
  input: typeof tasks.$inferInsert,
) {
  const [task] = await transaction.insert(tasks).values(input).returning();
  if (!task) throw new Error("Task could not be created.");
  return task;
}

export async function updateTaskById(
  transaction: DatabaseTransaction,
  workspaceId: string,
  taskId: string,
  input: Partial<typeof tasks.$inferInsert>,
) {
  const [task] = await transaction
    .update(tasks)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.id, taskId)))
    .returning();
  return task ?? null;
}

export async function setTaskArchived(
  transaction: DatabaseTransaction,
  workspaceId: string,
  taskId: string,
  archived: boolean,
) {
  const [task] = await transaction
    .update(tasks)
    .set({ deletedAt: archived ? new Date() : null, updatedAt: new Date() })
    .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.id, taskId)))
    .returning();
  return task ?? null;
}
