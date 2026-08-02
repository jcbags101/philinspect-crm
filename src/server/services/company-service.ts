import { getDb } from "@/db/client";
import {
  findCompanyById,
  insertCompany,
  listCompanies,
  setCompanyArchived,
  updateCompanyById,
} from "@/db/repositories/company-repository";
import type { Database } from "@/db/repositories/workspace-repository";
import { assertPermission } from "@/server/auth/permissions";
import type { SessionContext } from "@/server/auth/session-context";
import { NotFoundError } from "@/server/errors/domain-error";
import { companyInputSchema } from "@/server/validation/company";

import { recordAudit } from "./audit-service";

export async function getCompanies(
  context: SessionContext,
  options?: { includeArchived?: boolean; query?: string },
  database: Database = getDb(),
) {
  assertPermission(context.role, "companies:read");
  return listCompanies(database, context.workspaceId, options);
}

export async function getCompany(
  context: SessionContext,
  companyId: string,
  database: Database = getDb(),
) {
  assertPermission(context.role, "companies:read");
  const company = await findCompanyById(database, context.workspaceId, companyId);
  if (!company) throw new NotFoundError("The company could not be found.");
  return company;
}

export async function createCompany(
  context: SessionContext,
  unsafeInput: unknown,
  database: Database = getDb(),
) {
  assertPermission(context.role, "companies:write");
  const input = companyInputSchema.parse(unsafeInput);
  return database.transaction(async (transaction) => {
    const company = await insertCompany(transaction, {
      workspaceId: context.workspaceId,
      name: input.name,
      domain: input.domain || null,
      industry: input.industry || null,
      ownerId: context.userId,
      createdById: context.userId,
    });
    await recordAudit(transaction, {
      context,
      entityType: "company",
      entityId: company.id,
      action: "created",
      label: "Created a company",
      after: { name: company.name, domain: company.domain, industry: company.industry },
    });
    return company;
  });
}

export async function updateCompany(
  context: SessionContext,
  companyId: string,
  unsafeInput: unknown,
  database: Database = getDb(),
) {
  assertPermission(context.role, "companies:write");
  const input = companyInputSchema.parse(unsafeInput);
  return database.transaction(async (transaction) => {
    const before = await findCompanyById(transaction, context.workspaceId, companyId);
    if (!before) throw new NotFoundError("The company could not be found.");
    const company = await updateCompanyById(transaction, context.workspaceId, companyId, {
      name: input.name,
      domain: input.domain || null,
      industry: input.industry || null,
    });
    if (!company) throw new NotFoundError("The company could not be found.");
    await recordAudit(transaction, {
      context,
      entityType: "company",
      entityId: company.id,
      action: "updated",
      label: "Updated a company",
      before: { name: before.name, domain: before.domain, industry: before.industry },
      after: { name: company.name, domain: company.domain, industry: company.industry },
    });
    return company;
  });
}

export async function archiveCompany(
  context: SessionContext,
  companyId: string,
  archived: boolean,
  database: Database = getDb(),
) {
  assertPermission(context.role, "companies:write");
  return database.transaction(async (transaction) => {
    const company = await setCompanyArchived(
      transaction,
      context.workspaceId,
      companyId,
      archived,
    );
    if (!company) throw new NotFoundError("The company could not be found.");
    await recordAudit(transaction, {
      context,
      entityType: "company",
      entityId: company.id,
      action: archived ? "archived" : "restored",
      label: archived ? "Archived a company" : "Restored a company",
      after: { name: company.name },
    });
    return company;
  });
}
