import { and, asc, eq, ilike, isNull, or } from "drizzle-orm";

import { companies, contacts } from "@/db/schema";

import type {
  DatabaseExecutor,
  DatabaseTransaction,
} from "./workspace-repository";

interface ContactListOptions {
  includeArchived?: boolean;
  ownerId?: string;
  query?: string;
}

export async function listContacts(
  database: DatabaseExecutor,
  workspaceId: string,
  options: ContactListOptions = {},
) {
  const query = options.query?.trim();
  return database
    .select({
      id: contacts.id,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      email: contacts.email,
      phone: contacts.phone,
      jobTitle: contacts.jobTitle,
      companyId: contacts.companyId,
      companyName: companies.name,
      ownerId: contacts.ownerId,
      createdAt: contacts.createdAt,
      updatedAt: contacts.updatedAt,
      deletedAt: contacts.deletedAt,
    })
    .from(contacts)
    .leftJoin(
      companies,
      and(
        eq(contacts.companyId, companies.id),
        eq(companies.workspaceId, workspaceId),
      ),
    )
    .where(
      and(
        eq(contacts.workspaceId, workspaceId),
        options.includeArchived ? undefined : isNull(contacts.deletedAt),
        options.ownerId ? eq(contacts.ownerId, options.ownerId) : undefined,
        query
          ? or(
              ilike(contacts.firstName, `%${query}%`),
              ilike(contacts.lastName, `%${query}%`),
              ilike(contacts.email, `%${query}%`),
              ilike(contacts.phone, `%${query}%`),
              ilike(companies.name, `%${query}%`),
            )
          : undefined,
      ),
    )
    .orderBy(asc(contacts.lastName), asc(contacts.firstName))
    .limit(250);
}

export async function findContactById(
  database: DatabaseExecutor,
  workspaceId: string,
  contactId: string,
) {
  const [contact] = await database
    .select({
      id: contacts.id,
      workspaceId: contacts.workspaceId,
      companyId: contacts.companyId,
      companyName: companies.name,
      ownerId: contacts.ownerId,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      email: contacts.email,
      phone: contacts.phone,
      jobTitle: contacts.jobTitle,
      createdAt: contacts.createdAt,
      updatedAt: contacts.updatedAt,
      deletedAt: contacts.deletedAt,
    })
    .from(contacts)
    .leftJoin(
      companies,
      and(
        eq(contacts.companyId, companies.id),
        eq(companies.workspaceId, workspaceId),
      ),
    )
    .where(
      and(
        eq(contacts.workspaceId, workspaceId),
        eq(contacts.id, contactId),
      ),
    )
    .limit(1);
  return contact ?? null;
}

export async function findContactByEmail(
  database: DatabaseExecutor,
  workspaceId: string,
  email: string,
  excludeContactId?: string,
) {
  const rows = await database
    .select({ id: contacts.id })
    .from(contacts)
    .where(
      and(
        eq(contacts.workspaceId, workspaceId),
        eq(contacts.email, email),
      ),
    )
    .limit(2);
  return rows.find((row) => row.id !== excludeContactId) ?? null;
}

export async function insertContact(
  transaction: DatabaseTransaction,
  input: typeof contacts.$inferInsert,
) {
  const [contact] = await transaction.insert(contacts).values(input).returning();
  if (!contact) throw new Error("Contact could not be created.");
  return contact;
}

export async function updateContactById(
  transaction: DatabaseTransaction,
  workspaceId: string,
  contactId: string,
  input: Partial<typeof contacts.$inferInsert>,
) {
  const [contact] = await transaction
    .update(contacts)
    .set({ ...input, updatedAt: new Date() })
    .where(
      and(eq(contacts.workspaceId, workspaceId), eq(contacts.id, contactId)),
    )
    .returning();
  return contact ?? null;
}

export async function setContactArchived(
  transaction: DatabaseTransaction,
  workspaceId: string,
  contactId: string,
  archived: boolean,
) {
  const [contact] = await transaction
    .update(contacts)
    .set({ deletedAt: archived ? new Date() : null, updatedAt: new Date() })
    .where(
      and(eq(contacts.workspaceId, workspaceId), eq(contacts.id, contactId)),
    )
    .returning();
  return contact ?? null;
}
