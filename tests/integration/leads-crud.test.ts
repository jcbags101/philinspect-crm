import { drizzle } from "drizzle-orm/node-postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import * as schema from "../../src/db/schema";
import { PermissionDeniedError } from "../../src/server/auth/permissions";
import type { SessionContext } from "../../src/server/auth/session-context";
import { ConflictError, NotFoundError } from "../../src/server/errors/domain-error";
import {
  archiveLead,
  convertLead,
  createLead,
  getLead,
  getLeads,
  updateLead,
} from "../../src/server/services/lead-service";
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
  authUserId: "lead-manager-a",
  userId: "52000000-0000-4000-8000-000000000003",
  workspaceId: "52000000-0000-4000-8000-000000000001",
  workspaceName: "Lead workspace A",
  name: "Manager A",
  email: "manager-a@example.test",
  role: "account_manager",
};
const salesA: SessionContext = {
  authUserId: "lead-sales-a",
  userId: "52000000-0000-4000-8000-000000000004",
  workspaceId: managerA.workspaceId,
  workspaceName: managerA.workspaceName,
  name: "Sales A",
  email: "sales-a@example.test",
  role: "sales",
};
const managerB: SessionContext = {
  authUserId: "lead-manager-b",
  userId: "52000000-0000-4000-8000-000000000005",
  workspaceId: "52000000-0000-4000-8000-000000000002",
  workspaceName: "Lead workspace B",
  name: "Manager B",
  email: "manager-b@example.test",
  role: "account_manager",
};

function leadInput(overrides: Record<string, unknown> = {}) {
  return {
    name: "Jamie Rivera",
    companyName: "Harbor Labs",
    email: "jamie@harbor.example",
    phone: "+63 917 555 0202",
    industry: "Property technology",
    segment: "sme_going_digital",
    status: "new",
    companyId: "",
    contactId: "",
    ...overrides,
  };
}

describe("lead CRUD and conversion", () => {
  beforeAll(async () => {
    await applyIntegrationMigrations(pool);
  });

  beforeEach(async () => {
    await resetApplicationTables(pool, config);
    await pool.query(
      `insert into workspaces (id, neon_auth_organization_id, name)
       values ($1, 'lead-org-a', 'Lead workspace A'),
              ($2, 'lead-org-b', 'Lead workspace B')`,
      [managerA.workspaceId, managerB.workspaceId],
    );
    await pool.query(
      `insert into users (id, auth_user_id, workspace_id, name, email)
       values ($1, 'lead-manager-a', $4, 'Manager A', 'manager-a@example.test'),
              ($2, 'lead-sales-a', $4, 'Sales A', 'sales-a@example.test'),
              ($3, 'lead-manager-b', $5, 'Manager B', 'manager-b@example.test')`,
      [managerA.userId, salesA.userId, managerB.userId, managerA.workspaceId, managerB.workspaceId],
    );
    await pool.query(
      `insert into pipeline_stages (workspace_id, key, label, position, color_role, outcome)
       values ($1, 'lead', 'Lead', 0, 'pipeline-lead', 'open'),
              ($2, 'lead', 'Lead', 0, 'pipeline-lead', 'open')`,
      [managerA.workspaceId, managerB.workspaceId],
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  it("creates, updates, archives, restores, and audits a lead", async () => {
    const created = await createLead(managerA, leadInput(), database);
    await expect(getLeads(managerA, undefined, database)).resolves.toHaveLength(1);
    const updated = await updateLead(
      managerA,
      created.id,
      leadInput({ status: "followed_up", industry: "Inspection" }),
      database,
    );
    expect(updated.status).toBe("followed_up");

    await archiveLead(managerA, created.id, true, database);
    await expect(getLeads(managerA, undefined, database)).resolves.toHaveLength(0);
    await archiveLead(managerA, created.id, false, database);

    const audit = await pool.query<{ count: number }>(
      "select count(*)::int as count from audit_logs where workspace_id = $1 and entity_id = $2",
      [managerA.workspaceId, created.id],
    );
    expect(audit.rows[0]?.count).toBe(4);
  });

  it("atomically converts a lead into a company, contact, deal, and stage history", async () => {
    const lead = await createLead(managerA, leadInput(), database);
    const deal = await convertLead(managerA, lead.id, database);

    const converted = await getLead(managerA, lead.id, database);
    expect(converted.status).toBe("converted");
    expect(converted.convertedAt).toBeInstanceOf(Date);
    expect(converted.companyId).toBeTruthy();
    expect(converted.contactId).toBeTruthy();
    expect(deal.sourceLeadId).toBe(lead.id);

    const related = await pool.query<{ companies: number; contacts: number; deals: number; history: number }>(
      `select
         (select count(*)::int from companies where workspace_id = $1) as companies,
         (select count(*)::int from contacts where workspace_id = $1) as contacts,
         (select count(*)::int from deals where workspace_id = $1 and source_lead_id = $2) as deals,
         (select count(*)::int from deal_stage_history where workspace_id = $1 and deal_id = $3) as history`,
      [managerA.workspaceId, lead.id, deal.id],
    );
    expect(related.rows[0]).toEqual({ companies: 1, contacts: 1, deals: 1, history: 1 });
    await expect(convertLead(managerA, lead.id, database)).rejects.toBeInstanceOf(ConflictError);
  });

  it("returns not found for cross-workspace reads and mutations", async () => {
    const lead = await createLead(managerA, leadInput(), database);
    await expect(getLead(managerB, lead.id, database)).rejects.toBeInstanceOf(NotFoundError);
    await expect(updateLead(managerB, lead.id, leadInput(), database)).rejects.toBeInstanceOf(NotFoundError);
    await expect(archiveLead(managerB, lead.id, true, database)).rejects.toBeInstanceOf(NotFoundError);
    await expect(convertLead(managerB, lead.id, database)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("limits sales users to leads they own", async () => {
    const managerLead = await createLead(managerA, leadInput({ email: "manager@lead.test" }), database);
    const salesLead = await createLead(salesA, leadInput({ email: "sales@lead.test" }), database);
    const visible = await getLeads(salesA, undefined, database);
    expect(visible.map((lead) => lead.id)).toEqual([salesLead.id]);
    await expect(getLead(salesA, managerLead.id, database)).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(convertLead(salesA, managerLead.id, database)).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
