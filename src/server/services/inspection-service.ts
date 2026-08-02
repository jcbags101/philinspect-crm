import { getDb } from "@/db/client";
import { findCompanyById } from "@/db/repositories/company-repository";
import { findContactById } from "@/db/repositories/contact-repository";
import { findDealById } from "@/db/repositories/deal-repository";
import {
  findInspectionById,
  insertInspection,
  listInspections,
  setInspectionArchived,
  updateInspectionById,
} from "@/db/repositories/inspection-repository";
import { findActiveWorkspaceMemberByUserId } from "@/db/repositories/member-repository";
import type { Database, DatabaseTransaction } from "@/db/repositories/workspace-repository";
import { assertOwnedRecord } from "@/server/auth/ownership";
import { assertPermission } from "@/server/auth/permissions";
import type { SessionContext } from "@/server/auth/session-context";
import { ConflictError, NotFoundError } from "@/server/errors/domain-error";
import { inspectionInputSchema } from "@/server/validation/inspection";

import { recordAudit } from "./audit-service";

async function validateInspectionLinks(
  context: SessionContext,
  transaction: DatabaseTransaction,
  input: { companyId: string; primaryContactId?: string; dealId?: string; assignedToId?: string },
) {
  const company = await findCompanyById(transaction, context.workspaceId, input.companyId);
  if (!company || company.deletedAt) throw new NotFoundError("The selected company could not be found.");
  if (input.primaryContactId) {
    const contact = await findContactById(transaction, context.workspaceId, input.primaryContactId);
    if (!contact || contact.deletedAt) throw new NotFoundError("The selected contact could not be found.");
    if (contact.companyId && contact.companyId !== input.companyId) throw new ConflictError("The selected contact belongs to a different company.");
  }
  if (input.dealId) {
    const deal = await findDealById(transaction, context.workspaceId, input.dealId);
    if (!deal || deal.deletedAt) throw new NotFoundError("The selected deal could not be found.");
    if (deal.companyId !== input.companyId) throw new ConflictError("The selected deal belongs to a different company.");
  }
  if (input.assignedToId && !(await findActiveWorkspaceMemberByUserId(transaction, context.workspaceId, input.assignedToId))) {
    throw new NotFoundError("The selected assignee could not be found.");
  }
}

export async function getInspections(context: SessionContext, options?: { includeArchived?: boolean; query?: string }, database: Database = getDb()) {
  assertPermission(context.role, "inspections:read");
  return listInspections(database, context.workspaceId, { ...options, assignedToId: context.role === "sales" ? context.userId : undefined });
}

export async function getInspection(context: SessionContext, inspectionId: string, database: Database = getDb()) {
  assertPermission(context.role, "inspections:read");
  const inspection = await findInspectionById(database, context.workspaceId, inspectionId);
  if (!inspection) throw new NotFoundError("The inspection could not be found.");
  assertOwnedRecord(context, inspection, "inspections:read");
  return inspection;
}

export async function createInspection(context: SessionContext, unsafeInput: unknown, database: Database = getDb()) {
  assertPermission(context.role, "inspections:write");
  const input = inspectionInputSchema.parse(unsafeInput);
  return database.transaction(async (transaction) => {
    await validateInspectionLinks(context, transaction, input);
    const completedAt = input.status === "completed" ? new Date() : null;
    const inspection = await insertInspection(transaction, {
      workspaceId: context.workspaceId,
      companyId: input.companyId,
      primaryContactId: input.primaryContactId || null,
      dealId: input.dealId || null,
      assignedToId: input.assignedToId || context.userId,
      createdById: context.userId,
      title: input.title,
      status: input.status,
      location: input.location || null,
      notes: input.notes || null,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      completedAt,
      reportMetadata: completedAt ? { generatedAt: completedAt.toISOString(), version: 1, outcome: "completed" } : null,
    });
    await recordAudit(transaction, { context, entityType: "inspection", entityId: inspection.id, action: "created", label: "Created an inspection", after: { title: inspection.title, companyId: inspection.companyId, status: inspection.status, assignedToId: inspection.assignedToId } });
    return inspection;
  });
}

export async function updateInspection(context: SessionContext, inspectionId: string, unsafeInput: unknown, database: Database = getDb()) {
  assertPermission(context.role, "inspections:write");
  const input = inspectionInputSchema.parse(unsafeInput);
  return database.transaction(async (transaction) => {
    const before = await findInspectionById(transaction, context.workspaceId, inspectionId);
    if (!before) throw new NotFoundError("The inspection could not be found.");
    await validateInspectionLinks(context, transaction, input);
    const completedAt = input.status === "completed" ? before.completedAt ?? new Date() : null;
    const inspection = await updateInspectionById(transaction, context.workspaceId, inspectionId, {
      companyId: input.companyId,
      primaryContactId: input.primaryContactId || null,
      dealId: input.dealId || null,
      assignedToId: input.assignedToId || context.userId,
      title: input.title,
      status: input.status,
      location: input.location || null,
      notes: input.notes || null,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      completedAt,
      reportMetadata: completedAt ? before.reportMetadata ?? { generatedAt: completedAt.toISOString(), version: 1, outcome: "completed" } : before.reportMetadata,
    });
    if (!inspection) throw new NotFoundError("The inspection could not be found.");
    await recordAudit(transaction, { context, entityType: "inspection", entityId: inspection.id, action: before.status !== "completed" && inspection.status === "completed" ? "completed" : "updated", label: before.status !== "completed" && inspection.status === "completed" ? "Completed an inspection" : "Updated an inspection", before: { title: before.title, status: before.status, assignedToId: before.assignedToId }, after: { title: inspection.title, status: inspection.status, assignedToId: inspection.assignedToId } });
    return inspection;
  });
}

export async function archiveInspection(context: SessionContext, inspectionId: string, archived: boolean, database: Database = getDb()) {
  assertPermission(context.role, "inspections:write");
  return database.transaction(async (transaction) => {
    const before = await findInspectionById(transaction, context.workspaceId, inspectionId);
    if (!before) throw new NotFoundError("The inspection could not be found.");
    const inspection = await setInspectionArchived(transaction, context.workspaceId, inspectionId, archived);
    if (!inspection) throw new NotFoundError("The inspection could not be found.");
    await recordAudit(transaction, { context, entityType: "inspection", entityId: inspection.id, action: archived ? "archived" : "restored", label: archived ? "Archived an inspection" : "Restored an inspection", after: { title: inspection.title } });
    return inspection;
  });
}
