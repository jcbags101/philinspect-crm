import { and, asc, eq, ilike, isNull, or } from "drizzle-orm";

import { companies } from "@/db/schema";

import type {
  DatabaseExecutor,
  DatabaseTransaction,
} from "./workspace-repository";

export async function listCompanies(
  database: DatabaseExecutor,
  workspaceId: string,
  options: { includeArchived?: boolean; query?: string } = {},
) {
  const query = options.query?.trim();
  return database
    .select({
      id: companies.id,
      name: companies.name,
      domain: companies.domain,
      industry: companies.industry,
      ownerId: companies.ownerId,
      createdAt: companies.createdAt,
      updatedAt: companies.updatedAt,
      deletedAt: companies.deletedAt,
    })
    .from(companies)
    .where(
      and(
        eq(companies.workspaceId, workspaceId),
        options.includeArchived ? undefined : isNull(companies.deletedAt),
        query
          ? or(
              ilike(companies.name, `%${query}%`),
              ilike(companies.domain, `%${query}%`),
              ilike(companies.industry, `%${query}%`),
            )
          : undefined,
      ),
    )
    .orderBy(asc(companies.name))
    .limit(250);
}

export async function findCompanyById(
  database: DatabaseExecutor,
  workspaceId: string,
  companyId: string,
) {
  const [company] = await database
    .select()
    .from(companies)
    .where(
      and(
        eq(companies.workspaceId, workspaceId),
        eq(companies.id, companyId),
      ),
    )
    .limit(1);
  return company ?? null;
}

export async function insertCompany(
  transaction: DatabaseTransaction,
  input: typeof companies.$inferInsert,
) {
  const [company] = await transaction
    .insert(companies)
    .values(input)
    .returning();
  if (!company) throw new Error("Company could not be created.");
  return company;
}

export async function updateCompanyById(
  transaction: DatabaseTransaction,
  workspaceId: string,
  companyId: string,
  input: Partial<typeof companies.$inferInsert>,
) {
  const [company] = await transaction
    .update(companies)
    .set({ ...input, updatedAt: new Date() })
    .where(
      and(
        eq(companies.workspaceId, workspaceId),
        eq(companies.id, companyId),
      ),
    )
    .returning();
  return company ?? null;
}

export async function setCompanyArchived(
  transaction: DatabaseTransaction,
  workspaceId: string,
  companyId: string,
  archived: boolean,
) {
  const [company] = await transaction
    .update(companies)
    .set({ deletedAt: archived ? new Date() : null, updatedAt: new Date() })
    .where(
      and(
        eq(companies.workspaceId, workspaceId),
        eq(companies.id, companyId),
      ),
    )
    .returning();
  return company ?? null;
}
