import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  applyIntegrationMigrations,
  createIntegrationPool,
  getIntegrationDatabaseConfig,
} from "./setup/database";
import { resetApplicationTables } from "./setup/reset";

describe("integration database safety contract", () => {
  it("refuses a missing TEST_DATABASE_URL", () => {
    expect(() =>
      getIntegrationDatabaseConfig({
        TEST_DATABASE_TARGET: "philinspect-crm-test",
        TEST_DATABASE_BRANCH_ID: "br-test",
      }),
    ).toThrow("TEST_DATABASE_URL is required for integration tests.");
  });

  it("refuses a test URL that resolves to the runtime database", () => {
    const runtime = "postgresql://user:password@example.test/neondb";

    expect(() =>
      getIntegrationDatabaseConfig({
        TEST_DATABASE_URL: runtime,
        TEST_DATABASE_TARGET: "philinspect-crm-test",
        TEST_DATABASE_BRANCH_ID: "br-test",
        POSTGRES_URL: runtime,
      }),
    ).toThrow("TEST_DATABASE_URL must not resolve to the runtime database");
  });

  it("refuses an unmarked database target", () => {
    expect(() =>
      getIntegrationDatabaseConfig({
        TEST_DATABASE_URL: "postgresql://user:password@test.example/neondb",
        TEST_DATABASE_BRANCH_ID: "br-test",
      }),
    ).toThrow("TEST_DATABASE_TARGET");
  });
});

describe("isolated Neon test branch", () => {
  const config = getIntegrationDatabaseConfig();
  const pool = createIntegrationPool(config);

  beforeAll(async () => {
    await applyIntegrationMigrations(pool);
    await resetApplicationTables(pool, config);
  });

  afterAll(async () => {
    await pool.end();
  });

  it("applies the complete migration journal to the isolated target", async () => {
    const tables = await pool.query<{ tablename: string }>(
      `select tablename
         from pg_tables
        where schemaname = 'public'
        order by tablename`,
    );

    const names = tables.rows.map(({ tablename }) => tablename);
    expect(names).toContain("workspaces");
    expect(names).toContain("leads");
    expect(names).toContain("deals");
    expect(names).toContain("conversations");
  });

  it("resets only application data while retaining the schema", async () => {
    await pool.query(
      `insert into workspaces (neon_auth_organization_id, name)
       values ('test-reset-organization', 'Test reset workspace')`,
    );

    await resetApplicationTables(pool, config);

    const result = await pool.query<{ count: number }>(
      "select count(*)::int as count from workspaces",
    );
    expect(result.rows[0]?.count).toBe(0);
  });
});
