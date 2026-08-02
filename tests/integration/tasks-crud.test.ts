import { drizzle } from "drizzle-orm/node-postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import * as schema from "../../src/db/schema";
import { PermissionDeniedError } from "../../src/server/auth/permissions";
import type { SessionContext } from "../../src/server/auth/session-context";
import { NotFoundError } from "../../src/server/errors/domain-error";
import {
  archiveTask,
  createTask,
  getTask,
  getTasks,
  updateTask,
} from "../../src/server/services/task-service";
import {
  applyIntegrationMigrations,
  createIntegrationPool,
  getIntegrationDatabaseConfig,
} from "./setup/database";
import { resetApplicationTables } from "./setup/reset";

const config = getIntegrationDatabaseConfig();
const pool = createIntegrationPool(config);
const database = drizzle(pool, { schema });

const managerA: SessionContext = {
  authUserId: "task-manager-a",
  userId: "54000000-0000-4000-8000-000000000003",
  workspaceId: "54000000-0000-4000-8000-000000000001",
  workspaceName: "Task workspace A",
  name: "Manager A",
  email: "manager-a@example.test",
  role: "account_manager",
};
const salesA: SessionContext = {
  authUserId: "task-sales-a",
  userId: "54000000-0000-4000-8000-000000000004",
  workspaceId: managerA.workspaceId,
  workspaceName: managerA.workspaceName,
  name: "Sales A",
  email: "sales-a@example.test",
  role: "sales",
};
const managerB: SessionContext = {
  authUserId: "task-manager-b",
  userId: "54000000-0000-4000-8000-000000000005",
  workspaceId: "54000000-0000-4000-8000-000000000002",
  workspaceName: "Task workspace B",
  name: "Manager B",
  email: "manager-b@example.test",
  role: "account_manager",
};

function taskInput(overrides: Record<string, unknown> = {}) {
  return {
    title: "Follow up with customer",
    description: "Confirm inspection requirements.",
    status: "open",
    priority: "high",
    dueAt: "2026-08-15T09:30",
    ...overrides,
  };
}

describe("task CRUD", () => {
  beforeAll(async () => {
    await applyIntegrationMigrations(pool);
  });

  beforeEach(async () => {
    await resetApplicationTables(pool, config);
    await pool.query(
      `insert into workspaces (id, neon_auth_organization_id, name)
       values ($1, 'task-org-a', 'Task workspace A'),
              ($2, 'task-org-b', 'Task workspace B')`,
      [managerA.workspaceId, managerB.workspaceId],
    );
    await pool.query(
      `insert into users (id, auth_user_id, workspace_id, name, email)
       values ($1, 'task-manager-a', $4, 'Manager A', 'manager-a@example.test'),
              ($2, 'task-sales-a', $4, 'Sales A', 'sales-a@example.test'),
              ($3, 'task-manager-b', $5, 'Manager B', 'manager-b@example.test')`,
      [managerA.userId, salesA.userId, managerB.userId, managerA.workspaceId, managerB.workspaceId],
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  it("creates, completes, archives, restores, and audits a task", async () => {
    const created = await createTask(managerA, taskInput(), database);
    await expect(getTasks(managerA, undefined, database)).resolves.toHaveLength(1);
    const completed = await updateTask(
      managerA,
      created.id,
      taskInput({ status: "completed" }),
      database,
    );
    expect(completed.completedAt).toBeInstanceOf(Date);

    await archiveTask(managerA, created.id, true, database);
    await expect(getTasks(managerA, undefined, database)).resolves.toHaveLength(0);
    await archiveTask(managerA, created.id, false, database);

    const audit = await pool.query<{ actions: string[] }>(
      "select array_agg(action::text order by created_at) as actions from audit_logs where workspace_id = $1 and entity_id = $2",
      [managerA.workspaceId, created.id],
    );
    expect(audit.rows[0]?.actions).toEqual(["created", "completed", "archived", "restored"]);
  });

  it("returns not found for cross-workspace reads and mutations", async () => {
    const task = await createTask(managerA, taskInput(), database);
    await expect(getTask(managerB, task.id, database)).rejects.toBeInstanceOf(NotFoundError);
    await expect(updateTask(managerB, task.id, taskInput(), database)).rejects.toBeInstanceOf(NotFoundError);
    await expect(archiveTask(managerB, task.id, true, database)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("limits sales users to tasks assigned to them", async () => {
    const managerTask = await createTask(managerA, taskInput({ title: "Manager task" }), database);
    const salesTask = await createTask(salesA, taskInput({ title: "Sales task" }), database);
    const visible = await getTasks(salesA, undefined, database);
    expect(visible.map((task) => task.id)).toEqual([salesTask.id]);
    await expect(getTask(salesA, managerTask.id, database)).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(updateTask(salesA, managerTask.id, taskInput(), database)).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
