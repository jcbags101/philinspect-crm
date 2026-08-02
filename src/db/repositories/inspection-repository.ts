import { and, asc, desc, eq, ilike, isNull, or } from "drizzle-orm";

import { companies, contacts, deals, inspections, users } from "@/db/schema";
import type { DatabaseExecutor, DatabaseTransaction } from "./workspace-repository";

export async function listInspections(
  database: DatabaseExecutor,
  workspaceId: string,
  options: { includeArchived?: boolean; assignedToId?: string; query?: string } = {},
) {
  const query = options.query?.trim();
  return database
    .select({
      id: inspections.id,
      title: inspections.title,
      companyId: inspections.companyId,
      companyName: companies.name,
      assignedToId: inspections.assignedToId,
      assignedToName: users.name,
      status: inspections.status,
      location: inspections.location,
      scheduledAt: inspections.scheduledAt,
      completedAt: inspections.completedAt,
      updatedAt: inspections.updatedAt,
      deletedAt: inspections.deletedAt,
    })
    .from(inspections)
    .innerJoin(companies, and(eq(inspections.companyId, companies.id), eq(companies.workspaceId, workspaceId)))
    .leftJoin(users, eq(inspections.assignedToId, users.id))
    .where(
      and(
        eq(inspections.workspaceId, workspaceId),
        options.includeArchived ? undefined : isNull(inspections.deletedAt),
        options.assignedToId ? eq(inspections.assignedToId, options.assignedToId) : undefined,
        query ? or(ilike(inspections.title, `%${query}%`), ilike(companies.name, `%${query}%`), ilike(inspections.location, `%${query}%`)) : undefined,
      ),
    )
    .orderBy(asc(inspections.scheduledAt), desc(inspections.updatedAt))
    .limit(300);
}

export async function findInspectionById(
  database: DatabaseExecutor,
  workspaceId: string,
  inspectionId: string,
) {
  const [inspection] = await database
    .select({
      id: inspections.id,
      workspaceId: inspections.workspaceId,
      title: inspections.title,
      companyId: inspections.companyId,
      companyName: companies.name,
      primaryContactId: inspections.primaryContactId,
      primaryContactFirstName: contacts.firstName,
      primaryContactLastName: contacts.lastName,
      dealId: inspections.dealId,
      dealTitle: deals.title,
      assignedToId: inspections.assignedToId,
      assignedToName: users.name,
      createdById: inspections.createdById,
      status: inspections.status,
      location: inspections.location,
      notes: inspections.notes,
      scheduledAt: inspections.scheduledAt,
      completedAt: inspections.completedAt,
      reportMetadata: inspections.reportMetadata,
      createdAt: inspections.createdAt,
      updatedAt: inspections.updatedAt,
      deletedAt: inspections.deletedAt,
    })
    .from(inspections)
    .innerJoin(companies, and(eq(inspections.companyId, companies.id), eq(companies.workspaceId, workspaceId)))
    .leftJoin(contacts, and(eq(inspections.primaryContactId, contacts.id), eq(contacts.workspaceId, workspaceId)))
    .leftJoin(deals, and(eq(inspections.dealId, deals.id), eq(deals.workspaceId, workspaceId)))
    .leftJoin(users, eq(inspections.assignedToId, users.id))
    .where(and(eq(inspections.workspaceId, workspaceId), eq(inspections.id, inspectionId)))
    .limit(1);
  return inspection ?? null;
}

export async function insertInspection(transaction: DatabaseTransaction, input: typeof inspections.$inferInsert) {
  const [inspection] = await transaction.insert(inspections).values(input).returning();
  if (!inspection) throw new Error("Inspection could not be created.");
  return inspection;
}

export async function updateInspectionById(
  transaction: DatabaseTransaction,
  workspaceId: string,
  inspectionId: string,
  input: Partial<typeof inspections.$inferInsert>,
) {
  const [inspection] = await transaction.update(inspections).set({ ...input, updatedAt: new Date() }).where(and(eq(inspections.workspaceId, workspaceId), eq(inspections.id, inspectionId))).returning();
  return inspection ?? null;
}

export async function setInspectionArchived(
  transaction: DatabaseTransaction,
  workspaceId: string,
  inspectionId: string,
  archived: boolean,
) {
  const [inspection] = await transaction.update(inspections).set({ deletedAt: archived ? new Date() : null, updatedAt: new Date() }).where(and(eq(inspections.workspaceId, workspaceId), eq(inspections.id, inspectionId))).returning();
  return inspection ?? null;
}
