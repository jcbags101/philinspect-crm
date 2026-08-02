import { drizzle } from "drizzle-orm/node-postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import * as schema from "../../src/db/schema";
import type { SessionContext } from "../../src/server/auth/session-context";
import {
  NotFoundError,
} from "../../src/server/errors/domain-error";
import { PermissionDeniedError } from "../../src/server/auth/permissions";
import {
  archiveContact,
  createContact,
  getContact,
  getContacts,
  updateContact,
} from "../../src/server/services/contact-service";
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
  authUserId: "contact-manager-a",
  userId: "51000000-0000-4000-8000-000000000003",
  workspaceId: "51000000-0000-4000-8000-000000000001",
  workspaceName: "Contact workspace A",
  name: "Manager A",
  email: "manager-a@example.test",
  role: "account_manager",
};

const salesA: SessionContext = {
  authUserId: "contact-sales-a",
  userId: "51000000-0000-4000-8000-000000000004",
  workspaceId: managerA.workspaceId,
  workspaceName: managerA.workspaceName,
  name: "Sales A",
  email: "sales-a@example.test",
  role: "sales",
};

const managerB: SessionContext = {
  authUserId: "contact-manager-b",
  userId: "51000000-0000-4000-8000-000000000005",
  workspaceId: "51000000-0000-4000-8000-000000000002",
  workspaceName: "Contact workspace B",
  name: "Manager B",
  email: "manager-b@example.test",
  role: "account_manager",
};

const companyAId = "51000000-0000-4000-8000-000000000006";
const companyBId = "51000000-0000-4000-8000-000000000007";

describe("contact CRUD", () => {
  beforeAll(async () => {
    await applyIntegrationMigrations(pool);
  });

  beforeEach(async () => {
    await resetApplicationTables(pool, config);
    await pool.query(
      `insert into workspaces (id, neon_auth_organization_id, name)
       values ($1, 'contact-org-a', 'Contact workspace A'),
              ($2, 'contact-org-b', 'Contact workspace B')`,
      [managerA.workspaceId, managerB.workspaceId],
    );
    await pool.query(
      `insert into users (id, auth_user_id, workspace_id, name, email)
       values ($1, 'contact-manager-a', $4, 'Manager A', 'manager-a@example.test'),
              ($2, 'contact-sales-a', $4, 'Sales A', 'sales-a@example.test'),
              ($3, 'contact-manager-b', $5, 'Manager B', 'manager-b@example.test')`,
      [
        managerA.userId,
        salesA.userId,
        managerB.userId,
        managerA.workspaceId,
        managerB.workspaceId,
      ],
    );
    await pool.query(
      `insert into companies (id, workspace_id, name, owner_id, created_by_id)
       values ($1, $3, 'Tenant A company', $4, $4),
              ($2, $5, 'Tenant B company', $6, $6)`,
      [
        companyAId,
        companyBId,
        managerA.workspaceId,
        managerA.userId,
        managerB.workspaceId,
        managerB.userId,
      ],
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  it("creates, reads, updates, archives, restores, and audits a contact", async () => {
    const created = await createContact(
      managerA,
      {
        firstName: "Alex",
        lastName: "Rivera",
        email: " ALEX@EXAMPLE.TEST ",
        phone: "+63 917 555 0101",
        jobTitle: "Operations lead",
        companyId: companyAId,
      },
      database,
    );
    expect(created.email).toBe("alex@example.test");
    await expect(getContacts(managerA, undefined, database)).resolves.toHaveLength(1);

    const updated = await updateContact(
      managerA,
      created.id,
      {
        firstName: "Alexis",
        lastName: "Rivera",
        email: "alex@example.test",
        phone: "",
        jobTitle: "Director",
        companyId: companyAId,
      },
      database,
    );
    expect(updated.firstName).toBe("Alexis");

    await archiveContact(managerA, created.id, true, database);
    await expect(getContacts(managerA, undefined, database)).resolves.toHaveLength(0);
    await archiveContact(managerA, created.id, false, database);

    const audit = await pool.query<{ count: number }>(
      "select count(*)::int as count from audit_logs where workspace_id = $1 and entity_id = $2",
      [managerA.workspaceId, created.id],
    );
    expect(audit.rows[0]?.count).toBe(4);
  });

  it("rejects a company from another workspace", async () => {
    await expect(
      createContact(
        managerA,
        {
          firstName: "Cross",
          lastName: "Tenant",
          email: "cross@example.test",
          phone: "",
          jobTitle: "",
          companyId: companyBId,
        },
        database,
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("returns not found for every cross-workspace contact operation", async () => {
    const created = await createContact(
      managerA,
      {
        firstName: "Tenant",
        lastName: "A",
        email: "tenant-a@example.test",
        phone: "",
        jobTitle: "",
        companyId: companyAId,
      },
      database,
    );

    await expect(getContact(managerB, created.id, database)).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      updateContact(
        managerB,
        created.id,
        {
          firstName: "Hijacked",
          lastName: "Contact",
          email: "",
          phone: "",
          jobTitle: "",
          companyId: "",
        },
        database,
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(archiveContact(managerB, created.id, true, database)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("limits sales users to contacts they own", async () => {
    const managerContact = await createContact(
      managerA,
      {
        firstName: "Manager",
        lastName: "Owned",
        email: "manager-owned@example.test",
        phone: "",
        jobTitle: "",
        companyId: companyAId,
      },
      database,
    );
    const salesContact = await createContact(
      salesA,
      {
        firstName: "Sales",
        lastName: "Owned",
        email: "sales-owned@example.test",
        phone: "",
        jobTitle: "",
        companyId: companyAId,
      },
      database,
    );

    const visible = await getContacts(salesA, undefined, database);
    expect(visible.map((contact) => contact.id)).toEqual([salesContact.id]);
    await expect(getContact(salesA, managerContact.id, database)).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(archiveContact(salesA, managerContact.id, true, database)).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
