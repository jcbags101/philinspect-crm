import { getDb } from "@/db/client";
import { sql } from "drizzle-orm";
import { findCompanyById, insertCompany } from "@/db/repositories/company-repository";
import {
  findContactByEmail,
  findContactById,
  insertContact,
} from "@/db/repositories/contact-repository";
import {
  findInitialPipelineStage,
  insertDeal,
  insertInitialDealStageHistory,
} from "@/db/repositories/deal-repository";
import {
  findLeadById,
  insertLead,
  listLeads,
  setLeadArchived,
  updateLeadById,
} from "@/db/repositories/lead-repository";
import type {
  Database,
  DatabaseTransaction,
} from "@/db/repositories/workspace-repository";
import { assertOwnedRecord } from "@/server/auth/ownership";
import { assertPermission } from "@/server/auth/permissions";
import type { SessionContext } from "@/server/auth/session-context";
import {
  ConflictError,
  NotFoundError,
} from "@/server/errors/domain-error";
import { leadInputSchema } from "@/server/validation/lead";

import { recordAudit } from "./audit-service";

function nullable(value: string | undefined) {
  return value || null;
}

export async function getLeads(
  context: SessionContext,
  options?: { includeArchived?: boolean; query?: string },
  database: Database = getDb(),
) {
  assertPermission(context.role, "leads:read");
  return listLeads(database, context.workspaceId, {
    ...options,
    ownerId: context.role === "sales" ? context.userId : undefined,
  });
}

export async function getLead(
  context: SessionContext,
  leadId: string,
  database: Database = getDb(),
) {
  assertPermission(context.role, "leads:read");
  const lead = await findLeadById(database, context.workspaceId, leadId);
  if (!lead) throw new NotFoundError("The lead could not be found.");
  assertOwnedRecord(context, lead, "leads:read");
  return lead;
}

async function assertLeadLinks(
  context: SessionContext,
  transaction: DatabaseTransaction,
  companyId: string | undefined,
  contactId: string | undefined,
) {
  if (companyId && !(await findCompanyById(transaction, context.workspaceId, companyId))) {
    throw new NotFoundError("The selected company could not be found.");
  }
  if (contactId) {
    const contact = await findContactById(transaction, context.workspaceId, contactId);
    if (!contact) throw new NotFoundError("The selected contact could not be found.");
    assertOwnedRecord(context, contact, "contacts:read");
    if (companyId && contact.companyId && contact.companyId !== companyId) {
      throw new ConflictError("The selected contact belongs to a different company.");
    }
  }
}

export async function createLead(
  context: SessionContext,
  unsafeInput: unknown,
  database: Database = getDb(),
) {
  assertPermission(context.role, "leads:write");
  const input = leadInputSchema.parse(unsafeInput);
  return database.transaction(async (transaction) => {
    await assertLeadLinks(context, transaction, input.companyId, input.contactId);
    const lead = await insertLead(transaction, {
      workspaceId: context.workspaceId,
      companyId: nullable(input.companyId),
      contactId: nullable(input.contactId),
      name: input.name,
      companyName: input.companyName,
      email: nullable(input.email),
      phone: nullable(input.phone),
      industry: nullable(input.industry),
      segment: input.segment,
      status: input.status,
      ownerId: context.userId,
    });
    await recordAudit(transaction, {
      context,
      entityType: "lead",
      entityId: lead.id,
      action: "created",
      label: "Created a lead",
      after: {
        name: lead.name,
        companyName: lead.companyName,
        segment: lead.segment,
        status: lead.status,
      },
    });
    return lead;
  });
}

export async function updateLead(
  context: SessionContext,
  leadId: string,
  unsafeInput: unknown,
  database: Database = getDb(),
) {
  assertPermission(context.role, "leads:write");
  const input = leadInputSchema.parse(unsafeInput);
  return database.transaction(async (transaction) => {
    const before = await findLeadById(transaction, context.workspaceId, leadId);
    if (!before) throw new NotFoundError("The lead could not be found.");
    assertOwnedRecord(context, before, "leads:write");
    if (before.convertedAt) throw new ConflictError("Converted leads cannot be edited.");
    await assertLeadLinks(context, transaction, input.companyId, input.contactId);
    const lead = await updateLeadById(transaction, context.workspaceId, leadId, {
      companyId: nullable(input.companyId),
      contactId: nullable(input.contactId),
      name: input.name,
      companyName: input.companyName,
      email: nullable(input.email),
      phone: nullable(input.phone),
      industry: nullable(input.industry),
      segment: input.segment,
      status: input.status,
    });
    if (!lead) throw new NotFoundError("The lead could not be found.");
    await recordAudit(transaction, {
      context,
      entityType: "lead",
      entityId: lead.id,
      action: "updated",
      label: "Updated a lead",
      before: { name: before.name, segment: before.segment, status: before.status },
      after: { name: lead.name, segment: lead.segment, status: lead.status },
    });
    return lead;
  });
}

export async function archiveLead(
  context: SessionContext,
  leadId: string,
  archived: boolean,
  database: Database = getDb(),
) {
  assertPermission(context.role, "leads:write");
  return database.transaction(async (transaction) => {
    const before = await findLeadById(transaction, context.workspaceId, leadId);
    if (!before) throw new NotFoundError("The lead could not be found.");
    assertOwnedRecord(context, before, "leads:write");
    if (before.convertedAt) throw new ConflictError("Converted leads cannot be archived.");
    const lead = await setLeadArchived(transaction, context.workspaceId, leadId, archived);
    if (!lead) throw new NotFoundError("The lead could not be found.");
    await recordAudit(transaction, {
      context,
      entityType: "lead",
      entityId: lead.id,
      action: archived ? "archived" : "restored",
      label: archived ? "Archived a lead" : "Restored a lead",
      after: { name: lead.name },
    });
    return lead;
  });
}

export async function convertLead(
  context: SessionContext,
  leadId: string,
  database: Database = getDb(),
) {
  assertPermission(context.role, "leads:convert");
  return database.transaction(async (transaction) => {
    await transaction.execute(sql`
      select id
      from leads
      where workspace_id = ${context.workspaceId} and id = ${leadId}
      for update
    `);
    const lead = await findLeadById(transaction, context.workspaceId, leadId);
    if (!lead) throw new NotFoundError("The lead could not be found.");
    assertOwnedRecord(context, lead, "leads:convert");
    if (lead.convertedAt || lead.status === "converted") {
      throw new ConflictError("This lead has already been converted.");
    }
    await assertLeadLinks(
      context,
      transaction,
      lead.companyId ?? undefined,
      lead.contactId ?? undefined,
    );

    let companyId = lead.companyId;
    if (!companyId && lead.contactId) {
      const linkedContact = await findContactById(
        transaction,
        context.workspaceId,
        lead.contactId,
      );
      companyId = linkedContact?.companyId ?? null;
    }
    if (!companyId) {
      const company = await insertCompany(transaction, {
        workspaceId: context.workspaceId,
        name: lead.companyName,
        industry: lead.industry,
        ownerId: lead.ownerId ?? context.userId,
        createdById: context.userId,
      });
      companyId = company.id;
      await recordAudit(transaction, {
        context,
        entityType: "company",
        entityId: company.id,
        action: "created",
        label: "Created a company from a lead",
        after: { name: company.name, sourceLeadId: lead.id },
      });
    }

    let contactId = lead.contactId;
    if (!contactId && lead.email) {
      const existing = await findContactByEmail(transaction, context.workspaceId, lead.email);
      if (existing) {
        const contact = await findContactById(transaction, context.workspaceId, existing.id);
        if (!contact) throw new NotFoundError("The matching contact could not be found.");
        assertOwnedRecord(context, contact, "contacts:read");
        if (contact.companyId && contact.companyId !== companyId) {
          throw new ConflictError("The matching contact belongs to a different company.");
        }
        contactId = contact.id;
      }
    }
    if (!contactId) {
      const nameParts = lead.name.trim().split(/\s+/);
      const firstName = nameParts.shift() ?? lead.name;
      const lastName = nameParts.join(" ") || "Contact";
      const contact = await insertContact(transaction, {
        workspaceId: context.workspaceId,
        companyId,
        ownerId: lead.ownerId ?? context.userId,
        firstName,
        lastName,
        email: lead.email,
        phone: lead.phone,
      });
      contactId = contact.id;
      await recordAudit(transaction, {
        context,
        entityType: "contact",
        entityId: contact.id,
        action: "created",
        label: "Created a contact from a lead",
        after: { firstName, lastName, sourceLeadId: lead.id },
      });
    }
    if (contactId) {
      const resolvedContact = await findContactById(
        transaction,
        context.workspaceId,
        contactId,
      );
      if (!resolvedContact) throw new NotFoundError("The contact could not be found.");
      if (resolvedContact.companyId && resolvedContact.companyId !== companyId) {
        throw new ConflictError("The contact belongs to a different company.");
      }
    }

    const stage = await findInitialPipelineStage(transaction, context.workspaceId);
    if (!stage) throw new ConflictError("This workspace has no active deal pipeline.");
    const ownerId = lead.ownerId ?? context.userId;
    const deal = await insertDeal(transaction, {
      workspaceId: context.workspaceId,
      title: `${lead.companyName} opportunity`,
      companyId,
      primaryContactId: contactId,
      sourceLeadId: lead.id,
      ownerId,
      pipelineStageId: stage.id,
      stage: "lead",
      kind: "service",
      probability: 10,
    });
    await insertInitialDealStageHistory(transaction, {
      workspaceId: context.workspaceId,
      dealId: deal.id,
      toPipelineStageId: stage.id,
      toStage: "lead",
      actorId: context.userId,
    });
    await updateLeadById(transaction, context.workspaceId, lead.id, {
      companyId,
      contactId,
      status: "converted",
      convertedAt: new Date(),
    });
    await recordAudit(transaction, {
      context,
      entityType: "deal",
      entityId: deal.id,
      action: "created",
      label: "Created a deal from a lead",
      after: { title: deal.title, sourceLeadId: lead.id, pipelineStageId: stage.id },
    });
    await recordAudit(transaction, {
      context,
      entityType: "lead",
      entityId: lead.id,
      action: "converted",
      label: "Converted a lead to a deal",
      before: { status: lead.status },
      after: { status: "converted", companyId, contactId, dealId: deal.id },
    });
    return deal;
  });
}
