import { getDb } from "@/db/client";
import {
  findTaskById,
  insertTask,
  listTasks,
  setTaskArchived,
  updateTaskById,
} from "@/db/repositories/task-repository";
import type { Database } from "@/db/repositories/workspace-repository";
import { assertOwnedRecord } from "@/server/auth/ownership";
import { assertPermission } from "@/server/auth/permissions";
import type { SessionContext } from "@/server/auth/session-context";
import { NotFoundError } from "@/server/errors/domain-error";
import { taskInputSchema } from "@/server/validation/task";

import { recordAudit } from "./audit-service";

function dueDate(value: string) {
  return value ? new Date(value) : null;
}

export async function getTasks(
  context: SessionContext,
  options?: { includeArchived?: boolean; query?: string },
  database: Database = getDb(),
) {
  assertPermission(context.role, "tasks:read");
  return listTasks(database, context.workspaceId, {
    ...options,
    assignedToId: context.role === "sales" ? context.userId : undefined,
  });
}

export async function getTask(
  context: SessionContext,
  taskId: string,
  database: Database = getDb(),
) {
  assertPermission(context.role, "tasks:read");
  const task = await findTaskById(database, context.workspaceId, taskId);
  if (!task) throw new NotFoundError("The task could not be found.");
  assertOwnedRecord(context, task, "tasks:read");
  return task;
}

export async function createTask(
  context: SessionContext,
  unsafeInput: unknown,
  database: Database = getDb(),
) {
  assertPermission(context.role, "tasks:write");
  const input = taskInputSchema.parse(unsafeInput);
  return database.transaction(async (transaction) => {
    const task = await insertTask(transaction, {
      workspaceId: context.workspaceId,
      title: input.title,
      description: input.description || null,
      status: input.status,
      priority: input.priority,
      assignedToId: context.userId,
      createdById: context.userId,
      dueAt: dueDate(input.dueAt),
      completedAt: input.status === "completed" ? new Date() : null,
    });
    await recordAudit(transaction, {
      context,
      entityType: "task",
      entityId: task.id,
      action: "created",
      label: "Created a task",
      after: { title: task.title, status: task.status, priority: task.priority, dueAt: task.dueAt },
    });
    return task;
  });
}

export async function updateTask(
  context: SessionContext,
  taskId: string,
  unsafeInput: unknown,
  database: Database = getDb(),
) {
  assertPermission(context.role, "tasks:write");
  const input = taskInputSchema.parse(unsafeInput);
  return database.transaction(async (transaction) => {
    const before = await findTaskById(transaction, context.workspaceId, taskId);
    if (!before) throw new NotFoundError("The task could not be found.");
    assertOwnedRecord(context, before, "tasks:write");
    const task = await updateTaskById(transaction, context.workspaceId, taskId, {
      title: input.title,
      description: input.description || null,
      status: input.status,
      priority: input.priority,
      dueAt: dueDate(input.dueAt),
      completedAt:
        input.status === "completed"
          ? before.completedAt ?? new Date()
          : null,
    });
    if (!task) throw new NotFoundError("The task could not be found.");
    await recordAudit(transaction, {
      context,
      entityType: "task",
      entityId: task.id,
      action: before.status !== "completed" && task.status === "completed" ? "completed" : "updated",
      label: before.status !== "completed" && task.status === "completed" ? "Completed a task" : "Updated a task",
      before: { title: before.title, status: before.status, priority: before.priority, dueAt: before.dueAt },
      after: { title: task.title, status: task.status, priority: task.priority, dueAt: task.dueAt },
    });
    return task;
  });
}

export async function archiveTask(
  context: SessionContext,
  taskId: string,
  archived: boolean,
  database: Database = getDb(),
) {
  assertPermission(context.role, "tasks:write");
  return database.transaction(async (transaction) => {
    const before = await findTaskById(transaction, context.workspaceId, taskId);
    if (!before) throw new NotFoundError("The task could not be found.");
    assertOwnedRecord(context, before, "tasks:write");
    const task = await setTaskArchived(transaction, context.workspaceId, taskId, archived);
    if (!task) throw new NotFoundError("The task could not be found.");
    await recordAudit(transaction, {
      context,
      entityType: "task",
      entityId: task.id,
      action: archived ? "archived" : "restored",
      label: archived ? "Archived a task" : "Restored a task",
      after: { title: task.title },
    });
    return task;
  });
}
