import { drizzle } from "drizzle-orm/node-postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import * as schema from "../../src/db/schema";
import type { SessionContext } from "../../src/server/auth/session-context";
import { PermissionDeniedError } from "../../src/server/auth/permissions";
import { ConflictError } from "../../src/server/errors/domain-error";
import {
  acceptWorkspaceInvitation,
  createWorkspaceInvitation,
  hashInvitationToken,
} from "../../src/server/services/invitation-service";
import {
  applyIntegrationMigrations,
  createIntegrationPool,
  getIntegrationDatabaseConfig,
} from "./setup/database";
import { resetApplicationTables } from "./setup/reset";

const config = getIntegrationDatabaseConfig();
const pool = createIntegrationPool(config);
const database = drizzle(pool, { schema });
const workspaceId = "40000000-0000-4000-8000-000000000001";
const adminUserId = "40000000-0000-4000-8000-000000000002";

const adminContext: SessionContext = {
  authUserId: "auth-admin",
  userId: adminUserId,
  workspaceId,
  workspaceName: "Invitation workspace",
  name: "Invitation admin",
  email: "admin@example.test",
  role: "admin",
};

describe("workspace invitations", () => {
  beforeAll(async () => {
    await applyIntegrationMigrations(pool);
  });

  beforeEach(async () => {
    await resetApplicationTables(pool, config);
    await pool.query(
      `insert into roles (name, label)
       values ('account_manager', 'Account Manager'), ('sales', 'Sales'), ('admin', 'Admin')`,
    );
    await pool.query(
      `insert into workspaces (id, neon_auth_organization_id, name)
       values ($1, 'invitation-workspace', 'Invitation workspace')`,
      [workspaceId],
    );
    await pool.query(
      `insert into users (id, auth_user_id, workspace_id, name, email)
       values ($1, 'auth-admin', $2, 'Invitation admin', 'admin@example.test')`,
      [adminUserId, workspaceId],
    );
    await pool.query(
      `insert into workspace_memberships (workspace_id, user_id, role)
       values ($1, $2, 'admin')`,
      [workspaceId, adminUserId],
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  it("stores only the token hash and writes an invitation audit event", async () => {
    const invitation = await createWorkspaceInvitation(
      adminContext,
      { email: "New.Member@Example.test", role: "sales" },
      database,
    );
    const result = await pool.query<{ token_hash: string; email: string }>(
      "select token_hash, email from workspace_invitations where id = $1",
      [invitation.id],
    );

    expect(result.rows[0]).toEqual({
      token_hash: hashInvitationToken(invitation.token),
      email: "new.member@example.test",
    });
    expect(result.rows[0]?.token_hash).not.toBe(invitation.token);
    const audit = await pool.query<{ count: number }>(
      "select count(*)::int as count from audit_logs where entity_id = $1 and action = 'invited'",
      [invitation.id],
    );
    expect(audit.rows[0]?.count).toBe(1);
  });

  it("accepts an email-matched invitation exactly once", async () => {
    const invitation = await createWorkspaceInvitation(
      adminContext,
      { email: "invitee@example.test", role: "account_manager" },
      database,
    );

    await acceptWorkspaceInvitation(
      {
        authUserId: "auth-invitee",
        email: "Invitee@Example.test",
        name: "Invited member",
      },
      invitation.token,
      database,
    );

    const membership = await pool.query<{ role: string; status: string }>(
      `select workspace_memberships.role, workspace_memberships.status
         from workspace_memberships
         join users on users.id = workspace_memberships.user_id
        where users.auth_user_id = 'auth-invitee'`,
    );
    expect(membership.rows).toEqual([
      { role: "account_manager", status: "active" },
    ]);

    await expect(
      acceptWorkspaceInvitation(
        {
          authUserId: "auth-invitee",
          email: "invitee@example.test",
          name: "Invited member",
        },
        invitation.token,
        database,
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects email mismatch without creating membership", async () => {
    const invitation = await createWorkspaceInvitation(
      adminContext,
      { email: "expected@example.test", role: "sales" },
      database,
    );

    await expect(
      acceptWorkspaceInvitation(
        {
          authUserId: "auth-wrong-email",
          email: "wrong@example.test",
          name: "Wrong identity",
        },
        invitation.token,
        database,
      ),
    ).rejects.toBeInstanceOf(PermissionDeniedError);

    const membership = await pool.query<{ count: number }>(
      `select count(*)::int as count from users where auth_user_id = 'auth-wrong-email'`,
    );
    expect(membership.rows[0]?.count).toBe(0);
  });

  it("rejects an expired invitation", async () => {
    const invitation = await createWorkspaceInvitation(
      adminContext,
      { email: "expired@example.test", role: "sales" },
      database,
    );
    await pool.query(
      "update workspace_invitations set expires_at = now() - interval '1 minute' where id = $1",
      [invitation.id],
    );

    await expect(
      acceptWorkspaceInvitation(
        {
          authUserId: "auth-expired",
          email: "expired@example.test",
          name: "Expired member",
        },
        invitation.token,
        database,
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
