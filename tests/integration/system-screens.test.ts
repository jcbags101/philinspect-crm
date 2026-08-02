import { drizzle } from "drizzle-orm/node-postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import * as schema from "../../src/db/schema";
import { PermissionDeniedError } from "../../src/server/auth/permissions";
import type { SessionContext } from "../../src/server/auth/session-context";
import { getWorkspaceAuditEvents } from "../../src/server/services/audit-service";
import { getWorkspaceSettings } from "../../src/server/services/settings-service";
import { applyIntegrationMigrations, createIntegrationPool, getIntegrationDatabaseConfig } from "./setup/database";
import { resetApplicationTables } from "./setup/reset";

const config = getIntegrationDatabaseConfig(); const pool = createIntegrationPool(config); const database = drizzle(pool, { schema });
const workspaceAId = "58000000-0000-4000-8000-000000000001"; const workspaceBId = "58000000-0000-4000-8000-000000000002"; const adminId = "58000000-0000-4000-8000-000000000003"; const userBId = "58000000-0000-4000-8000-000000000004";
const admin: SessionContext = { authUserId: "system-admin", userId: adminId, workspaceId: workspaceAId, workspaceName: "System workspace A", name: "Admin", email: "admin@example.test", role: "admin" };

describe("audit and settings scoping", () => {
  beforeAll(async () => { await applyIntegrationMigrations(pool); });
  beforeEach(async () => {
    await resetApplicationTables(pool, config);
    await pool.query(`insert into workspaces (id, neon_auth_organization_id, name) values ($1, 'system-org-a', 'System workspace A'), ($2, 'system-org-b', 'System workspace B')`, [workspaceAId, workspaceBId]);
    await pool.query(`insert into users (id, auth_user_id, workspace_id, name, email) values ($1, 'system-admin', $3, 'Admin', 'admin@example.test'), ($2, 'system-user-b', $4, 'User B', 'user-b@example.test')`, [adminId, userBId, workspaceAId, workspaceBId]);
    await pool.query(`insert into audit_logs (workspace_id, actor_id, entity_type, action, label) values ($1, $2, 'company', 'created', 'Workspace A event'), ($3, $4, 'company', 'created', 'Workspace B event')`, [workspaceAId, adminId, workspaceBId, userBId]);
    await pool.query(`insert into integration_connections (workspace_id, provider, status) values ($1, 'messenger', 'coming_soon'), ($2, 'viber', 'disconnected')`, [workspaceAId, workspaceBId]);
  });
  afterAll(async () => { await pool.end(); });

  it("returns only current-workspace audit events", async () => {
    const events = await getWorkspaceAuditEvents(admin, 100, database);
    expect(events.map((event) => event.label)).toEqual(["Workspace A event"]);
    expect(events[0]?.actorName).toBe("Admin");
  });

  it("returns only current-workspace settings integrations", async () => {
    const settings = await getWorkspaceSettings(admin, database);
    expect(settings.integrations.map((item) => item.provider)).toEqual(["messenger"]);
  });

  it("enforces audit and settings permissions", async () => {
    const sales = { ...admin, role: "sales" as const };
    const manager = { ...admin, role: "account_manager" as const };
    await expect(getWorkspaceAuditEvents(sales, 100, database)).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(getWorkspaceSettings(manager, database)).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
