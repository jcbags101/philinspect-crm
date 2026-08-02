import { drizzle } from "drizzle-orm/node-postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { findWorkspaceMemberByAuthUserId } from "../../src/db/repositories/workspace-repository";
import * as schema from "../../src/db/schema";
import {
  applyIntegrationMigrations,
  createIntegrationPool,
  getIntegrationDatabaseConfig,
} from "./setup/database";
import { resetApplicationTables } from "./setup/reset";

const config = getIntegrationDatabaseConfig();
const pool = createIntegrationPool(config);
const database = drizzle(pool, { schema });

describe("workspace authorization lookup", () => {
  beforeAll(async () => {
    await applyIntegrationMigrations(pool);
  });

  beforeEach(async () => {
    await resetApplicationTables(pool, config);
    await pool.query(
      `insert into workspaces (id, neon_auth_organization_id, name)
       values
         ('30000000-0000-4000-8000-000000000001', 'organization-a', 'Workspace A'),
         ('30000000-0000-4000-8000-000000000002', 'organization-b', 'Workspace B')`,
    );
    await pool.query(
      `insert into users (id, auth_user_id, workspace_id, name, email)
       values
         ('30000000-0000-4000-8000-000000000003', 'auth-active', '30000000-0000-4000-8000-000000000001', 'Active user', 'active@example.test'),
         ('30000000-0000-4000-8000-000000000004', 'auth-suspended', '30000000-0000-4000-8000-000000000001', 'Suspended user', 'suspended@example.test')`,
    );
    await pool.query(
      `insert into workspace_memberships (workspace_id, user_id, role, status)
       values
         ('30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003', 'admin', 'active'),
         ('30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000004', 'sales', 'suspended')`,
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  it("resolves an active member in the selected organization", async () => {
    const member = await findWorkspaceMemberByAuthUserId(
      database,
      "auth-active",
      "organization-a",
    );
    expect(member).toMatchObject({
      workspaceName: "Workspace A",
      role: "admin",
    });
  });

  it("does not resolve a suspended member", async () => {
    await expect(
      findWorkspaceMemberByAuthUserId(database, "auth-suspended"),
    ).resolves.toBeNull();
  });

  it("does not fall back to another organization", async () => {
    await expect(
      findWorkspaceMemberByAuthUserId(
        database,
        "auth-active",
        "organization-b",
      ),
    ).resolves.toBeNull();
  });

  it("does not provision an unknown authenticated identity", async () => {
    await expect(
      findWorkspaceMemberByAuthUserId(database, "auth-unknown"),
    ).resolves.toBeNull();
  });
});
