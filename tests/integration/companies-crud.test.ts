import { drizzle } from "drizzle-orm/node-postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import * as schema from "../../src/db/schema";
import type { SessionContext } from "../../src/server/auth/session-context";
import { NotFoundError } from "../../src/server/errors/domain-error";
import {
  archiveCompany,
  createCompany,
  getCompanies,
  getCompany,
  updateCompany,
} from "../../src/server/services/company-service";
import {
  applyIntegrationMigrations,
  createIntegrationPool,
  getIntegrationDatabaseConfig,
} from "./setup/database";
import { resetApplicationTables } from "./setup/reset";

const config = getIntegrationDatabaseConfig();
const pool = createIntegrationPool(config);
const database = drizzle(pool, { schema });

const contextA: SessionContext = {
  authUserId: "company-auth-a",
  userId: "50000000-0000-4000-8000-000000000003",
  workspaceId: "50000000-0000-4000-8000-000000000001",
  workspaceName: "Company workspace A",
  name: "Manager A",
  email: "manager-a@example.test",
  role: "account_manager",
};

const contextB: SessionContext = {
  authUserId: "company-auth-b",
  userId: "50000000-0000-4000-8000-000000000004",
  workspaceId: "50000000-0000-4000-8000-000000000002",
  workspaceName: "Company workspace B",
  name: "Manager B",
  email: "manager-b@example.test",
  role: "account_manager",
};

describe("company CRUD", () => {
  beforeAll(async () => {
    await applyIntegrationMigrations(pool);
  });

  beforeEach(async () => {
    await resetApplicationTables(pool, config);
    await pool.query(
      `insert into workspaces (id, neon_auth_organization_id, name)
       values ($1, 'company-org-a', 'Company workspace A'), ($2, 'company-org-b', 'Company workspace B')`,
      [contextA.workspaceId, contextB.workspaceId],
    );
    await pool.query(
      `insert into users (id, auth_user_id, workspace_id, name, email)
       values ($1, 'company-auth-a', $3, 'Manager A', 'manager-a@example.test'),
              ($2, 'company-auth-b', $4, 'Manager B', 'manager-b@example.test')`,
      [contextA.userId, contextB.userId, contextA.workspaceId, contextB.workspaceId],
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  it("creates, reads, updates, archives, restores, and audits a company", async () => {
    const created = await createCompany(
      contextA,
      { name: "North Harbor", domain: "https://north.example/", industry: "Property" },
      database,
    );
    expect(created.domain).toBe("north.example");
    await expect(getCompanies(contextA, undefined, database)).resolves.toHaveLength(1);

    const updated = await updateCompany(
      contextA,
      created.id,
      { name: "North Harbor Group", domain: "north.example", industry: "Inspection" },
      database,
    );
    expect(updated.name).toBe("North Harbor Group");

    await archiveCompany(contextA, created.id, true, database);
    await expect(getCompanies(contextA, undefined, database)).resolves.toHaveLength(0);
    await expect(
      getCompanies(contextA, { includeArchived: true }, database),
    ).resolves.toHaveLength(1);

    await archiveCompany(contextA, created.id, false, database);
    const audit = await pool.query<{ count: number }>(
      "select count(*)::int as count from audit_logs where workspace_id = $1 and entity_id = $2",
      [contextA.workspaceId, created.id],
    );
    expect(audit.rows[0]?.count).toBe(4);
  });

  it("returns not found for every cross-workspace read or mutation", async () => {
    const created = await createCompany(
      contextA,
      { name: "Tenant A only", domain: "tenant-a.example", industry: "Testing" },
      database,
    );

    await expect(getCompany(contextB, created.id, database)).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      updateCompany(contextB, created.id, { name: "Hijacked", domain: "", industry: "" }, database),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      archiveCompany(contextB, created.id, true, database),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
