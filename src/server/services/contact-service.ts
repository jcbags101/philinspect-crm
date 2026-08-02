import { getDb } from "@/db/client";
import { findCompanyById } from "@/db/repositories/company-repository";
import {
  findContactByEmail,
  findContactById,
  insertContact,
  listContacts,
  setContactArchived,
  updateContactById,
} from "@/db/repositories/contact-repository";
import type {
  Database,
  DatabaseTransaction,
} from "@/db/repositories/workspace-repository";
import { assertOwnedRecord } from "@/server/auth/ownership";
import { assertPermission } from "@/server/auth/permissions";
import type { SessionContext } from "@/server/auth/session-context";
import { ConflictError, NotFoundError } from "@/server/errors/domain-error";
import { contactInputSchema } from "@/server/validation/contact";

import { recordAudit } from "./audit-service";

function nullable(value: string | undefined) {
  return value || null;
}

export async function getContacts(
  context: SessionContext,
  options?: { includeArchived?: boolean; query?: string },
  database: Database = getDb(),
) {
  assertPermission(context.role, "contacts:read");
  return listContacts(database, context.workspaceId, {
    ...options,
    ownerId: context.role === "sales" ? context.userId : undefined,
  });
}

export async function getContact(
  context: SessionContext,
  contactId: string,
  database: Database = getDb(),
) {
  assertPermission(context.role, "contacts:read");
  const contact = await findContactById(database, context.workspaceId, contactId);
  if (!contact) throw new NotFoundError("The contact could not be found.");
  assertOwnedRecord(context, contact, "contacts:read");
  return contact;
}

async function assertCompanyInWorkspace(
  database: DatabaseTransaction,
  workspaceId: string,
  companyId: string | undefined,
) {
  if (!companyId) return;
  const company = await findCompanyById(database, workspaceId, companyId);
  if (!company) {
    throw new NotFoundError("The selected company could not be found.");
  }
}

export async function createContact(
  context: SessionContext,
  unsafeInput: unknown,
  database: Database = getDb(),
) {
  assertPermission(context.role, "contacts:write");
  const input = contactInputSchema.parse(unsafeInput);
  return database.transaction(async (transaction) => {
    await assertCompanyInWorkspace(transaction, context.workspaceId, input.companyId);
    if (
      input.email &&
      (await findContactByEmail(transaction, context.workspaceId, input.email))
    ) {
      throw new ConflictError("A contact with this email already exists.");
    }
    const contact = await insertContact(transaction, {
      workspaceId: context.workspaceId,
      companyId: nullable(input.companyId),
      ownerId: context.userId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: nullable(input.email),
      phone: nullable(input.phone),
      jobTitle: nullable(input.jobTitle),
    });
    await recordAudit(transaction, {
      context,
      entityType: "contact",
      entityId: contact.id,
      action: "created",
      label: "Created a contact",
      after: {
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        companyId: contact.companyId,
      },
    });
    return contact;
  });
}

export async function updateContact(
  context: SessionContext,
  contactId: string,
  unsafeInput: unknown,
  database: Database = getDb(),
) {
  assertPermission(context.role, "contacts:write");
  const input = contactInputSchema.parse(unsafeInput);
  return database.transaction(async (transaction) => {
    const before = await findContactById(transaction, context.workspaceId, contactId);
    if (!before) throw new NotFoundError("The contact could not be found.");
    assertOwnedRecord(context, before, "contacts:write");
    await assertCompanyInWorkspace(transaction, context.workspaceId, input.companyId);
    if (
      input.email &&
      (await findContactByEmail(
        transaction,
        context.workspaceId,
        input.email,
        contactId,
      ))
    ) {
      throw new ConflictError("A contact with this email already exists.");
    }
    const contact = await updateContactById(
      transaction,
      context.workspaceId,
      contactId,
      {
        companyId: nullable(input.companyId),
        firstName: input.firstName,
        lastName: input.lastName,
        email: nullable(input.email),
        phone: nullable(input.phone),
        jobTitle: nullable(input.jobTitle),
      },
    );
    if (!contact) throw new NotFoundError("The contact could not be found.");
    await recordAudit(transaction, {
      context,
      entityType: "contact",
      entityId: contact.id,
      action: "updated",
      label: "Updated a contact",
      before: {
        firstName: before.firstName,
        lastName: before.lastName,
        email: before.email,
        companyId: before.companyId,
      },
      after: {
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        companyId: contact.companyId,
      },
    });
    return contact;
  });
}

export async function archiveContact(
  context: SessionContext,
  contactId: string,
  archived: boolean,
  database: Database = getDb(),
) {
  assertPermission(context.role, "contacts:write");
  return database.transaction(async (transaction) => {
    const before = await findContactById(transaction, context.workspaceId, contactId);
    if (!before) throw new NotFoundError("The contact could not be found.");
    assertOwnedRecord(context, before, "contacts:write");
    const contact = await setContactArchived(
      transaction,
      context.workspaceId,
      contactId,
      archived,
    );
    if (!contact) throw new NotFoundError("The contact could not be found.");
    await recordAudit(transaction, {
      context,
      entityType: "contact",
      entityId: contact.id,
      action: archived ? "archived" : "restored",
      label: archived ? "Archived a contact" : "Restored a contact",
      after: { firstName: contact.firstName, lastName: contact.lastName },
    });
    return contact;
  });
}
