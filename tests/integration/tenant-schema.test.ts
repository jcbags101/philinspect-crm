import { createHash } from "node:crypto";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  applyIntegrationMigrations,
  createIntegrationPool,
  getIntegrationDatabaseConfig,
} from "./setup/database";
import { resetApplicationTables } from "./setup/reset";

const config = getIntegrationDatabaseConfig();
const pool = createIntegrationPool(config);

async function insertWorkspace(id: string, organizationId: string) {
  await pool.query(
    `insert into workspaces (id, neon_auth_organization_id, name)
     values ($1, $2, $3)`,
    [id, organizationId, `Workspace ${organizationId}`],
  );
}

async function insertUser(id: string, workspaceId: string, email: string) {
  await pool.query(
    `insert into users (id, workspace_id, name, email)
     values ($1, $2, $3, $4)`,
    [id, workspaceId, "Tenant test user", email],
  );
}

describe("tenant-safe identity schema", () => {
  beforeAll(async () => {
    await applyIntegrationMigrations(pool);
  });

  beforeEach(async () => {
    await resetApplicationTables(pool, config);
  });

  afterAll(async () => {
    await pool.end();
  });

  it("allows one identity to hold memberships in separate workspaces", async () => {
    const workspaceA = "20000000-0000-4000-8000-000000000001";
    const workspaceB = "20000000-0000-4000-8000-000000000002";
    const userId = "20000000-0000-4000-8000-000000000003";
    await insertWorkspace(workspaceA, "tenant-test-a");
    await insertWorkspace(workspaceB, "tenant-test-b");
    await insertUser(userId, workspaceA, "multi-workspace@example.test");

    await pool.query(
      `insert into workspace_memberships (workspace_id, user_id, role)
       values ($1, $3, 'admin'), ($2, $3, 'sales')`,
      [workspaceA, workspaceB, userId],
    );

    const result = await pool.query<{ count: number }>(
      `select count(*)::int as count
         from workspace_memberships
        where user_id = $1 and status = 'active'`,
      [userId],
    );
    expect(result.rows[0]?.count).toBe(2);
  });

  it("enforces one membership per workspace and user", async () => {
    const workspaceId = "21000000-0000-4000-8000-000000000001";
    const userId = "21000000-0000-4000-8000-000000000002";
    await insertWorkspace(workspaceId, "membership-unique");
    await insertUser(userId, workspaceId, "membership@example.test");
    await pool.query(
      `insert into workspace_memberships (workspace_id, user_id, role)
       values ($1, $2, 'sales')`,
      [workspaceId, userId],
    );

    await expect(
      pool.query(
        `insert into workspace_memberships (workspace_id, user_id, role)
         values ($1, $2, 'admin')`,
        [workspaceId, userId],
      ),
    ).rejects.toMatchObject({ code: "23505" });
  });

  it("enforces one pending invitation per normalized workspace email", async () => {
    const workspaceId = "22000000-0000-4000-8000-000000000001";
    const userId = "22000000-0000-4000-8000-000000000002";
    await insertWorkspace(workspaceId, "invitation-unique");
    await insertUser(userId, workspaceId, "inviter@example.test");

    await pool.query(
      `insert into workspace_invitations
        (workspace_id, email, role, token_hash, invited_by_id, expires_at)
       values ($1, 'invitee@example.test', 'sales', 'hash-one', $2, now() + interval '1 day')`,
      [workspaceId, userId],
    );

    await expect(
      pool.query(
        `insert into workspace_invitations
          (workspace_id, email, role, token_hash, invited_by_id, expires_at)
         values ($1, 'invitee@example.test', 'admin', 'hash-two', $2, now() + interval '1 day')`,
        [workspaceId, userId],
      ),
    ).rejects.toMatchObject({ code: "23505" });
  });

  it("persists only a secure invitation token hash", async () => {
    const workspaceId = "23000000-0000-4000-8000-000000000001";
    const userId = "23000000-0000-4000-8000-000000000002";
    const rawToken = "raw-invitation-token-must-not-be-stored";
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    await insertWorkspace(workspaceId, "invitation-hash");
    await insertUser(userId, workspaceId, "hash-inviter@example.test");

    await pool.query(
      `insert into workspace_invitations
        (workspace_id, email, role, token_hash, invited_by_id, expires_at)
       values ($1, 'hash-invitee@example.test', 'account_manager', $2, $3, now() + interval '1 day')`,
      [workspaceId, tokenHash, userId],
    );

    const result = await pool.query<{ token_hash: string }>(
      "select token_hash from workspace_invitations where workspace_id = $1",
      [workspaceId],
    );
    expect(result.rows[0]?.token_hash).toBe(tokenHash);
    expect(result.rows[0]?.token_hash).not.toBe(rawToken);
  });
});
