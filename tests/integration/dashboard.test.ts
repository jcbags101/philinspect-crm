import { drizzle } from "drizzle-orm/node-postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import * as schema from "../../src/db/schema";
import type { SessionContext } from "../../src/server/auth/session-context";
import { getDashboard } from "../../src/server/services/dashboard-service";
import {
  applyIntegrationMigrations,
  createIntegrationPool,
  getIntegrationDatabaseConfig,
} from "./setup/database";
import { resetApplicationTables } from "./setup/reset";

const config = getIntegrationDatabaseConfig();
const pool = createIntegrationPool(config);
const database = drizzle(pool, { schema });

const manager: SessionContext = {
  authUserId: "dashboard-manager",
  userId: "55000000-0000-4000-8000-000000000003",
  workspaceId: "55000000-0000-4000-8000-000000000001",
  workspaceName: "Dashboard workspace A",
  name: "Manager A",
  email: "manager@example.test",
  role: "account_manager",
};
const sales: SessionContext = {
  authUserId: "dashboard-sales",
  userId: "55000000-0000-4000-8000-000000000004",
  workspaceId: manager.workspaceId,
  workspaceName: manager.workspaceName,
  name: "Sales A",
  email: "sales@example.test",
  role: "sales",
};
const workspaceBId = "55000000-0000-4000-8000-000000000002";
const userBId = "55000000-0000-4000-8000-000000000005";
const companyAId = "55000000-0000-4000-8000-000000000006";
const companyBId = "55000000-0000-4000-8000-000000000007";
const openStageAId = "55000000-0000-4000-8000-000000000008";
const wonStageAId = "55000000-0000-4000-8000-000000000009";
const openStageBId = "55000000-0000-4000-8000-000000000010";

describe("tenant-safe dashboard", () => {
  beforeAll(async () => {
    await applyIntegrationMigrations(pool);
  });

  beforeEach(async () => {
    await resetApplicationTables(pool, config);
    await pool.query(
      `insert into workspaces (id, neon_auth_organization_id, name)
       values ($1, 'dashboard-org-a', 'Dashboard workspace A'),
              ($2, 'dashboard-org-b', 'Dashboard workspace B')`,
      [manager.workspaceId, workspaceBId],
    );
    await pool.query(
      `insert into users (id, auth_user_id, workspace_id, name, email)
       values ($1, 'dashboard-manager', $4, 'Manager A', 'manager@example.test'),
              ($2, 'dashboard-sales', $4, 'Sales A', 'sales@example.test'),
              ($3, 'dashboard-user-b', $5, 'User B', 'user-b@example.test')`,
      [manager.userId, sales.userId, userBId, manager.workspaceId, workspaceBId],
    );
    await pool.query(
      `insert into companies (id, workspace_id, name, owner_id, created_by_id)
       values ($1, $3, 'Company A', $4, $4),
              ($2, $5, 'Company B', $6, $6)`,
      [companyAId, companyBId, manager.workspaceId, manager.userId, workspaceBId, userBId],
    );
    await pool.query(
      `insert into pipeline_stages (id, workspace_id, key, label, position, color_role, outcome)
       values ($1, $4, 'lead', 'Lead', 0, 'pipeline-lead', 'open'),
              ($2, $4, 'won', 'Won', 1, 'pipeline-won', 'won'),
              ($3, $5, 'lead', 'Lead', 0, 'pipeline-lead', 'open')`,
      [openStageAId, wonStageAId, openStageBId, manager.workspaceId, workspaceBId],
    );
    await pool.query(
      `insert into leads (workspace_id, name, company_name, segment, status, owner_id, converted_at)
       values ($1, 'Manager lead', 'Company A', 'sme_going_digital', 'converted', $2, now()),
              ($1, 'Sales lead', 'Company A', 'sme_going_digital', 'new', $3, null),
              ($4, 'Tenant B lead', 'Company B', 'sme_going_digital', 'new', $5, null)`,
      [manager.workspaceId, manager.userId, sales.userId, workspaceBId, userBId],
    );
    await pool.query(
      `insert into deals (workspace_id, title, company_id, owner_id, pipeline_stage_id, stage, kind, value, probability)
       values ($1, 'Manager open', $2, $3, $4, 'lead', 'service', 100000, 20),
              ($1, 'Sales open', $2, $5, $4, 'lead', 'service', 50000, 20),
              ($1, 'Manager won', $2, $3, $6, 'won', 'service', 200000, 100),
              ($7, 'Tenant B open', $8, $9, $10, 'lead', 'service', 999999, 20)`,
      [manager.workspaceId, companyAId, manager.userId, openStageAId, sales.userId, wonStageAId, workspaceBId, companyBId, userBId, openStageBId],
    );
    await pool.query(
      `insert into tasks (workspace_id, title, status, priority, assigned_to_id, created_by_id, due_at)
       values ($1, 'Manager overdue', 'open', 'high', $2, $2, '2020-01-01'),
              ($1, 'Sales future', 'open', 'medium', $3, $3, '2099-01-01'),
              ($4, 'Tenant B task', 'open', 'medium', $5, $5, '2020-01-01')`,
      [manager.workspaceId, manager.userId, sales.userId, workspaceBId, userBId],
    );
    await pool.query(
      `insert into audit_logs (workspace_id, actor_id, entity_type, action, label)
       values ($1, $2, 'deal', 'created', 'Manager activity'),
              ($1, $3, 'deal', 'created', 'Sales activity'),
              ($4, $5, 'deal', 'created', 'Tenant B activity')`,
      [manager.workspaceId, manager.userId, sales.userId, workspaceBId, userBId],
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  it("returns complete workspace metrics without tenant B data", async () => {
    const result = await getDashboard(manager, database);
    expect(result.metrics.leads).toEqual({ total: 2, converted: 1 });
    expect(result.metrics.companies.total).toBe(1);
    expect(result.metrics.openDeals).toEqual({ total: 2, value: "150000.00" });
    expect(result.metrics.wonDeals).toEqual({ total: 1, value: "200000.00" });
    expect(result.metrics.tasks).toEqual({ open: 2, overdue: 1 });
    expect(result.activity.map((item) => item.label).sort()).toEqual([
      "Manager activity",
      "Sales activity",
    ]);
  });

  it("restricts sales metrics and activity to owned records", async () => {
    const result = await getDashboard(sales, database);
    expect(result.metrics.leads).toEqual({ total: 1, converted: 0 });
    expect(result.metrics.companies.total).toBe(1);
    expect(result.metrics.openDeals).toEqual({ total: 1, value: "50000.00" });
    expect(result.metrics.wonDeals).toEqual({ total: 0, value: "0" });
    expect(result.metrics.tasks).toEqual({ open: 1, overdue: 0 });
    expect(result.activity.map((item) => item.label)).toEqual(["Sales activity"]);
  });
});
