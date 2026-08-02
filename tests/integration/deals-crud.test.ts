import { drizzle } from "drizzle-orm/node-postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import * as schema from "../../src/db/schema";
import { PermissionDeniedError } from "../../src/server/auth/permissions";
import type { SessionContext } from "../../src/server/auth/session-context";
import { NotFoundError } from "../../src/server/errors/domain-error";
import {
  archiveDeal,
  createDeal,
  getDeal,
  getDeals,
  getDealStageHistory,
  moveDealStage,
  updateDeal,
} from "../../src/server/services/deal-service";
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
  authUserId: "deal-manager-a",
  userId: "53000000-0000-4000-8000-000000000003",
  workspaceId: "53000000-0000-4000-8000-000000000001",
  workspaceName: "Deal workspace A",
  name: "Manager A",
  email: "manager-a@example.test",
  role: "account_manager",
};
const salesA: SessionContext = {
  authUserId: "deal-sales-a",
  userId: "53000000-0000-4000-8000-000000000004",
  workspaceId: managerA.workspaceId,
  workspaceName: managerA.workspaceName,
  name: "Sales A",
  email: "sales-a@example.test",
  role: "sales",
};
const managerB: SessionContext = {
  authUserId: "deal-manager-b",
  userId: "53000000-0000-4000-8000-000000000005",
  workspaceId: "53000000-0000-4000-8000-000000000002",
  workspaceName: "Deal workspace B",
  name: "Manager B",
  email: "manager-b@example.test",
  role: "account_manager",
};

const companyAId = "53000000-0000-4000-8000-000000000006";
const companyBId = "53000000-0000-4000-8000-000000000007";
const contactAId = "53000000-0000-4000-8000-000000000008";
const leadStageAId = "53000000-0000-4000-8000-000000000009";
const wonStageAId = "53000000-0000-4000-8000-000000000010";
const leadStageBId = "53000000-0000-4000-8000-000000000011";

function dealInput(owner: SessionContext, overrides: Record<string, unknown> = {}) {
  return {
    title: `${owner.name} opportunity`,
    companyId: companyAId,
    primaryContactId: contactAId,
    pipelineStageId: leadStageAId,
    kind: "service",
    value: "125000",
    currency: "PHP",
    probability: 20,
    expectedCloseAt: "2026-09-30",
    ...overrides,
  };
}

describe("deal CRUD and pipeline movement", () => {
  beforeAll(async () => {
    await applyIntegrationMigrations(pool);
  });

  beforeEach(async () => {
    await resetApplicationTables(pool, config);
    await pool.query(
      `insert into workspaces (id, neon_auth_organization_id, name)
       values ($1, 'deal-org-a', 'Deal workspace A'),
              ($2, 'deal-org-b', 'Deal workspace B')`,
      [managerA.workspaceId, managerB.workspaceId],
    );
    await pool.query(
      `insert into users (id, auth_user_id, workspace_id, name, email)
       values ($1, 'deal-manager-a', $4, 'Manager A', 'manager-a@example.test'),
              ($2, 'deal-sales-a', $4, 'Sales A', 'sales-a@example.test'),
              ($3, 'deal-manager-b', $5, 'Manager B', 'manager-b@example.test')`,
      [managerA.userId, salesA.userId, managerB.userId, managerA.workspaceId, managerB.workspaceId],
    );
    await pool.query(
      `insert into companies (id, workspace_id, name, owner_id, created_by_id)
       values ($1, $3, 'Tenant A company', $4, $4),
              ($2, $5, 'Tenant B company', $6, $6)`,
      [companyAId, companyBId, managerA.workspaceId, managerA.userId, managerB.workspaceId, managerB.userId],
    );
    await pool.query(
      `insert into contacts (id, workspace_id, company_id, owner_id, first_name, last_name, email)
       values ($1, $2, $3, $4, 'Primary', 'Contact', 'primary@deal.test')`,
      [contactAId, managerA.workspaceId, companyAId, managerA.userId],
    );
    await pool.query(
      `insert into pipeline_stages (id, workspace_id, key, label, position, color_role, outcome)
       values ($1, $4, 'lead', 'Lead', 0, 'pipeline-lead', 'open'),
              ($2, $4, 'won', 'Won', 1, 'pipeline-won', 'won'),
              ($3, $5, 'lead', 'Lead', 0, 'pipeline-lead', 'open')`,
      [leadStageAId, wonStageAId, leadStageBId, managerA.workspaceId, managerB.workspaceId],
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  it("creates, updates, moves, archives, restores, and audits a deal", async () => {
    const created = await createDeal(managerA, dealInput(managerA), database);
    expect(created.value).toBe("125000.00");
    const updated = await updateDeal(
      managerA,
      created.id,
      dealInput(managerA, { title: "Updated opportunity", value: "150000" }),
      database,
    );
    expect(updated.title).toBe("Updated opportunity");

    const moved = await moveDealStage(
      managerA,
      created.id,
      { pipelineStageId: wonStageAId },
      database,
    );
    expect(moved.probability).toBe(100);
    expect(moved.stage).toBe("won");
    await expect(getDealStageHistory(managerA, created.id, database)).resolves.toHaveLength(2);

    await archiveDeal(managerA, created.id, true, database);
    await expect(getDeals(managerA, undefined, database)).resolves.toHaveLength(0);
    await archiveDeal(managerA, created.id, false, database);

    const audit = await pool.query<{ count: number }>(
      "select count(*)::int as count from audit_logs where workspace_id = $1 and entity_id = $2",
      [managerA.workspaceId, created.id],
    );
    expect(audit.rows[0]?.count).toBe(5);
  });

  it("rejects cross-workspace relationships and stage targets", async () => {
    await expect(
      createDeal(managerA, dealInput(managerA, { companyId: companyBId }), database),
    ).rejects.toBeInstanceOf(NotFoundError);
    const deal = await createDeal(managerA, dealInput(managerA), database);
    await expect(
      moveDealStage(managerA, deal.id, { pipelineStageId: leadStageBId }, database),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("returns not found for cross-workspace reads and mutations", async () => {
    const deal = await createDeal(managerA, dealInput(managerA), database);
    await expect(getDeal(managerB, deal.id, database)).rejects.toBeInstanceOf(NotFoundError);
    await expect(updateDeal(managerB, deal.id, dealInput(managerB), database)).rejects.toBeInstanceOf(NotFoundError);
    await expect(archiveDeal(managerB, deal.id, true, database)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("limits sales users to deals they own", async () => {
    const managerDeal = await createDeal(managerA, dealInput(managerA), database);
    await pool.query("update contacts set owner_id = $1 where id = $2", [salesA.userId, contactAId]);
    const salesDeal = await createDeal(salesA, dealInput(salesA, { title: "Sales opportunity" }), database);
    const visible = await getDeals(salesA, undefined, database);
    expect(visible.map((deal) => deal.id)).toEqual([salesDeal.id]);
    await expect(getDeal(salesA, managerDeal.id, database)).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(moveDealStage(salesA, managerDeal.id, { pipelineStageId: wonStageAId }, database)).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
