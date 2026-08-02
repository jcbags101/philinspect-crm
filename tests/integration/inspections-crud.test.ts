import { drizzle } from "drizzle-orm/node-postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import * as schema from "../../src/db/schema";
import { PermissionDeniedError } from "../../src/server/auth/permissions";
import type { SessionContext } from "../../src/server/auth/session-context";
import { NotFoundError } from "../../src/server/errors/domain-error";
import {
  archiveInspection,
  createInspection,
  getInspection,
  getInspections,
  updateInspection,
} from "../../src/server/services/inspection-service";
import { applyIntegrationMigrations, createIntegrationPool, getIntegrationDatabaseConfig } from "./setup/database";
import { resetApplicationTables } from "./setup/reset";

const config = getIntegrationDatabaseConfig(); const pool = createIntegrationPool(config); const database = drizzle(pool, { schema });
const manager: SessionContext = { authUserId: "inspection-manager", userId: "57000000-0000-4000-8000-000000000003", workspaceId: "57000000-0000-4000-8000-000000000001", workspaceName: "Inspection workspace A", name: "Manager", email: "manager@example.test", role: "account_manager" };
const sales: SessionContext = { authUserId: "inspection-sales", userId: "57000000-0000-4000-8000-000000000004", workspaceId: manager.workspaceId, workspaceName: manager.workspaceName, name: "Sales", email: "sales@example.test", role: "sales" };
const workspaceBId = "57000000-0000-4000-8000-000000000002"; const userBId = "57000000-0000-4000-8000-000000000005"; const companyAId = "57000000-0000-4000-8000-000000000006"; const companyBId = "57000000-0000-4000-8000-000000000007";

function input(overrides: Record<string, unknown> = {}) { return { title: "Building condition inspection", companyId: companyAId, primaryContactId: "", dealId: "", assignedToId: sales.userId, status: "scheduled", location: "Makati City", notes: "Initial scope and access requirements confirmed.", scheduledAt: "2026-08-20T09:00", ...overrides }; }

describe("inspection CRUD and reports", () => {
  beforeAll(async () => { await applyIntegrationMigrations(pool); });
  beforeEach(async () => {
    await resetApplicationTables(pool, config);
    await pool.query(`insert into workspaces (id, neon_auth_organization_id, name) values ($1, 'inspection-org-a', 'Inspection workspace A'), ($2, 'inspection-org-b', 'Inspection workspace B')`, [manager.workspaceId, workspaceBId]);
    await pool.query(`insert into users (id, auth_user_id, workspace_id, name, email) values ($1, 'inspection-manager', $4, 'Manager', 'manager@example.test'), ($2, 'inspection-sales', $4, 'Sales', 'sales@example.test'), ($3, 'inspection-user-b', $5, 'User B', 'user-b@example.test')`, [manager.userId, sales.userId, userBId, manager.workspaceId, workspaceBId]);
    await pool.query(`insert into workspace_memberships (workspace_id, user_id, role, status) values ($1, $2, 'account_manager', 'active'), ($1, $3, 'sales', 'active'), ($4, $5, 'account_manager', 'active')`, [manager.workspaceId, manager.userId, sales.userId, workspaceBId, userBId]);
    await pool.query(`insert into companies (id, workspace_id, name, owner_id, created_by_id) values ($1, $3, 'Company A', $4, $4), ($2, $5, 'Company B', $6, $6)`, [companyAId, companyBId, manager.workspaceId, manager.userId, workspaceBId, userBId]);
  });
  afterAll(async () => { await pool.end(); });

  it("creates, completes, archives, restores, and audits an inspection", async () => {
    const created = await createInspection(manager, input(), database);
    await expect(getInspections(sales, undefined, database)).resolves.toHaveLength(1);
    const completed = await updateInspection(manager, created.id, input({ status: "completed", notes: "Inspection completed with no critical findings." }), database);
    expect(completed.completedAt).toBeInstanceOf(Date);
    expect(completed.reportMetadata).toMatchObject({ version: 1, outcome: "completed" });
    await archiveInspection(manager, created.id, true, database);
    await expect(getInspections(manager, undefined, database)).resolves.toHaveLength(0);
    await archiveInspection(manager, created.id, false, database);
    const audit = await pool.query<{ actions: string[] }>("select array_agg(action::text order by created_at) as actions from audit_logs where entity_id = $1", [created.id]);
    expect(audit.rows[0]?.actions).toEqual(["created", "completed", "archived", "restored"]);
  });

  it("restricts sales users to assigned inspections and denies writes", async () => {
    const assigned = await createInspection(manager, input(), database);
    await createInspection(manager, input({ title: "Manager inspection", assignedToId: manager.userId }), database);
    const visible = await getInspections(sales, undefined, database);
    expect(visible.map((item) => item.id)).toEqual([assigned.id]);
    await expect(createInspection(sales, input(), database)).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(getInspection(sales, visible[0]!.id, database)).resolves.toMatchObject({ assignedToId: sales.userId });
  });

  it("rejects cross-workspace records and relationships", async () => {
    await expect(createInspection(manager, input({ companyId: companyBId }), database)).rejects.toBeInstanceOf(NotFoundError);
    const created = await createInspection(manager, input(), database);
    const contextB: SessionContext = { ...manager, userId: userBId, workspaceId: workspaceBId, authUserId: "inspection-user-b", email: "user-b@example.test" };
    await expect(getInspection(contextB, created.id, database)).rejects.toBeInstanceOf(NotFoundError);
  });
});
