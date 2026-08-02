import { and, asc, desc, eq, ilike, isNull, or } from "drizzle-orm";

import { companies, contacts, leads } from "@/db/schema";

import type {
  DatabaseExecutor,
  DatabaseTransaction,
} from "./workspace-repository";

interface LeadListOptions {
  includeArchived?: boolean;
  ownerId?: string;
  query?: string;
}

export async function listLeads(
  database: DatabaseExecutor,
  workspaceId: string,
  options: LeadListOptions = {},
) {
  const query = options.query?.trim();
  return database
    .select({
      id: leads.id,
      name: leads.name,
      companyName: leads.companyName,
      email: leads.email,
      phone: leads.phone,
      industry: leads.industry,
      segment: leads.segment,
      status: leads.status,
      ownerId: leads.ownerId,
      companyId: leads.companyId,
      contactId: leads.contactId,
      convertedAt: leads.convertedAt,
      createdAt: leads.createdAt,
      updatedAt: leads.updatedAt,
      deletedAt: leads.deletedAt,
    })
    .from(leads)
    .where(
      and(
        eq(leads.workspaceId, workspaceId),
        options.includeArchived ? undefined : isNull(leads.deletedAt),
        options.ownerId ? eq(leads.ownerId, options.ownerId) : undefined,
        query
          ? or(
              ilike(leads.name, `%${query}%`),
              ilike(leads.companyName, `%${query}%`),
              ilike(leads.email, `%${query}%`),
              ilike(leads.industry, `%${query}%`),
            )
          : undefined,
      ),
    )
    .orderBy(desc(leads.updatedAt), asc(leads.name))
    .limit(250);
}

export async function findLeadById(
  database: DatabaseExecutor,
  workspaceId: string,
  leadId: string,
) {
  const [lead] = await database
    .select({
      id: leads.id,
      workspaceId: leads.workspaceId,
      companyId: leads.companyId,
      linkedCompanyName: companies.name,
      contactId: leads.contactId,
      linkedContactFirstName: contacts.firstName,
      linkedContactLastName: contacts.lastName,
      name: leads.name,
      companyName: leads.companyName,
      email: leads.email,
      phone: leads.phone,
      industry: leads.industry,
      segment: leads.segment,
      status: leads.status,
      ownerId: leads.ownerId,
      convertedAt: leads.convertedAt,
      createdAt: leads.createdAt,
      updatedAt: leads.updatedAt,
      deletedAt: leads.deletedAt,
    })
    .from(leads)
    .leftJoin(
      companies,
      and(eq(leads.companyId, companies.id), eq(companies.workspaceId, workspaceId)),
    )
    .leftJoin(
      contacts,
      and(eq(leads.contactId, contacts.id), eq(contacts.workspaceId, workspaceId)),
    )
    .where(and(eq(leads.workspaceId, workspaceId), eq(leads.id, leadId)))
    .limit(1);
  return lead ?? null;
}

export async function insertLead(
  transaction: DatabaseTransaction,
  input: typeof leads.$inferInsert,
) {
  const [lead] = await transaction.insert(leads).values(input).returning();
  if (!lead) throw new Error("Lead could not be created.");
  return lead;
}

export async function updateLeadById(
  transaction: DatabaseTransaction,
  workspaceId: string,
  leadId: string,
  input: Partial<typeof leads.$inferInsert>,
) {
  const [lead] = await transaction
    .update(leads)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(leads.workspaceId, workspaceId), eq(leads.id, leadId)))
    .returning();
  return lead ?? null;
}

export async function setLeadArchived(
  transaction: DatabaseTransaction,
  workspaceId: string,
  leadId: string,
  archived: boolean,
) {
  const [lead] = await transaction
    .update(leads)
    .set({
      deletedAt: archived ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(leads.workspaceId, workspaceId), eq(leads.id, leadId)))
    .returning();
  return lead ?? null;
}
