import { drizzle } from "drizzle-orm/node-postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import * as schema from "../../src/db/schema";
import { PermissionDeniedError } from "../../src/server/auth/permissions";
import type { SessionContext } from "../../src/server/auth/session-context";
import { ConflictError, NotFoundError } from "../../src/server/errors/domain-error";
import {
  changeWorkspaceMember,
  getWorkspaceMembers,
} from "../../src/server/services/member-service";
import {
  applyIntegrationMigrations,
  createIntegrationPool,
  getIntegrationDatabaseConfig,
} from "./setup/database";
import { resetApplicationTables } from "./setup/reset";

const config = getIntegrationDatabaseConfig();
const pool = createIntegrationPool(config);
const database = drizzle(pool, { schema });
const workspaceAId = "56000000-0000-4000-8000-000000000001";
const workspaceBId = "56000000-0000-4000-8000-000000000002";
const adminAId = "56000000-0000-4000-8000-000000000003";
const managerAId = "56000000-0000-4000-8000-000000000004";
const salesAId = "56000000-0000-4000-8000-000000000005";
const adminBId = "56000000-0000-4000-8000-000000000006";

const admin: SessionContext = {
  authUserId: "member-admin-a",
  userId: adminAId,
  workspaceId: workspaceAId,
  workspaceName: "Member workspace A",
  name: "Admin A",
  email: "admin-a@example.test",
  role: "admin",
};
const manager: SessionContext = {
  authUserId: "member-manager-a",
  userId: managerAId,
  workspaceId: workspaceAId,
  workspaceName: "Member workspace A",
  name: "Manager A",
  email: "manager-a@example.test",
  role: "account_manager",
};

describe("workspace member administration", () => {
  beforeAll(async () => {
    await applyIntegrationMigrations(pool);
  });

  beforeEach(async () => {
    await resetApplicationTables(pool, config);
    await pool.query(
      `insert into workspaces (id, neon_auth_organization_id, name)
       values ($1, 'member-org-a', 'Member workspace A'),
              ($2, 'member-org-b', 'Member workspace B')`,
      [workspaceAId, workspaceBId],
    );
    await pool.query(
      `insert into users (id, auth_user_id, workspace_id, name, email)
       values ($1, 'member-admin-a', $5, 'Admin A', 'admin-a@example.test'),
              ($2, 'member-manager-a', $5, 'Manager A', 'manager-a@example.test'),
              ($3, 'member-sales-a', $5, 'Sales A', 'sales-a@example.test'),
              ($4, 'member-admin-b', $6, 'Admin B', 'admin-b@example.test')`,
      [adminAId, managerAId, salesAId, adminBId, workspaceAId, workspaceBId],
    );
    await pool.query(
      `insert into workspace_memberships (workspace_id, user_id, role, status)
       values ($1, $2, 'admin', 'active'),
              ($1, $3, 'account_manager', 'active'),
              ($1, $4, 'sales', 'active'),
              ($5, $6, 'admin', 'active')`,
      [workspaceAId, adminAId, managerAId, salesAId, workspaceBId, adminBId],
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  it("lists only members in the current workspace", async () => {
    const members = await getWorkspaceMembers(manager, database);
    expect(members.map((member) => member.email).sort()).toEqual([
      "admin-a@example.test",
      "manager-a@example.test",
      "sales-a@example.test",
    ]);
  });

  it("changes role and status with audit events", async () => {
    const salesMembership = (await getWorkspaceMembers(admin, database)).find(
      (member) => member.userId === salesAId,
    );
    expect(salesMembership).toBeTruthy();
    await changeWorkspaceMember(
      admin,
      salesMembership!.id,
      { role: "account_manager", status: "suspended" },
      database,
    );
    const updated = (await getWorkspaceMembers(admin, database)).find(
      (member) => member.userId === salesAId,
    );
    expect(updated).toMatchObject({ role: "account_manager", status: "suspended" });
    const audit = await pool.query<{ actions: string[] }>(
      "select array_agg(action::text order by created_at) as actions from audit_logs where entity_id = $1",
      [salesMembership!.id],
    );
    expect(audit.rows[0]?.actions).toEqual(["role_changed", "status"]);
  });

  it("protects the last active admin and self-suspension", async () => {
    const adminMembership = (await getWorkspaceMembers(admin, database)).find(
      (member) => member.userId === adminAId,
    );
    await expect(
      changeWorkspaceMember(
        admin,
        adminMembership!.id,
        { role: "account_manager", status: "active" },
        database,
      ),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      changeWorkspaceMember(
        admin,
        adminMembership!.id,
        { role: "admin", status: "suspended" },
        database,
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects unauthorized and cross-workspace mutations", async () => {
    const salesMembership = (await getWorkspaceMembers(admin, database)).find(
      (member) => member.userId === salesAId,
    );
    const memberB = await pool.query<{ id: string }>(
      "select id from workspace_memberships where workspace_id = $1",
      [workspaceBId],
    );
    await expect(
      changeWorkspaceMember(
        manager,
        salesMembership!.id,
        { role: "sales", status: "suspended" },
        database,
      ),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(
      changeWorkspaceMember(
        admin,
        memberB.rows[0]!.id,
        { role: "sales", status: "active" },
        database,
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
