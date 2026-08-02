import { sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import { findCompanyById } from "@/db/repositories/company-repository";
import { findContactById } from "@/db/repositories/contact-repository";
import {
  findDealById,
  findPipelineStageById,
  insertDeal,
  insertInitialDealStageHistory,
  listDeals,
  listDealStageHistory,
  listPipelineStages,
  setDealArchived,
  updateDealById,
} from "@/db/repositories/deal-repository";
import type {
  Database,
  DatabaseTransaction,
} from "@/db/repositories/workspace-repository";
import { assertOwnedRecord } from "@/server/auth/ownership";
import { assertPermission } from "@/server/auth/permissions";
import type { SessionContext } from "@/server/auth/session-context";
import { ConflictError, NotFoundError } from "@/server/errors/domain-error";
import { dealInputSchema, moveDealStageSchema } from "@/server/validation/deal";

import { recordAudit } from "./audit-service";

type LegacyDealStage =
  | "lead"
  | "discovery"
  | "assessment"
  | "demo_proposal"
  | "follow_up"
  | "parked"
  | "won"
  | "lost";

const legacyStages = new Set<LegacyDealStage>([
  "lead",
  "discovery",
  "assessment",
  "demo_proposal",
  "follow_up",
  "parked",
  "won",
  "lost",
]);

function legacyStageFor(stage: { key: string; outcome: "open" | "won" | "lost" }): LegacyDealStage {
  if (stage.outcome === "won") return "won";
  if (stage.outcome === "lost") return "lost";
  return legacyStages.has(stage.key as LegacyDealStage)
    ? (stage.key as LegacyDealStage)
    : "lead";
}

function expectedClose(value: string) {
  return value ? new Date(`${value}T00:00:00+08:00`) : null;
}

async function validateDealLinks(
  context: SessionContext,
  transaction: DatabaseTransaction,
  companyId: string,
  contactId: string | undefined,
  pipelineStageId: string,
) {
  const [company, stage] = await Promise.all([
    findCompanyById(transaction, context.workspaceId, companyId),
    findPipelineStageById(transaction, context.workspaceId, pipelineStageId),
  ]);
  if (!company || company.deletedAt) {
    throw new NotFoundError("The selected company could not be found.");
  }
  if (!stage || !stage.isActive) {
    throw new NotFoundError("The selected pipeline stage could not be found.");
  }
  if (contactId) {
    const contact = await findContactById(transaction, context.workspaceId, contactId);
    if (!contact || contact.deletedAt) {
      throw new NotFoundError("The selected contact could not be found.");
    }
    assertOwnedRecord(context, contact, "contacts:read");
    if (contact.companyId && contact.companyId !== companyId) {
      throw new ConflictError("The selected contact belongs to a different company.");
    }
  }
  return stage;
}

export async function getPipelineStages(
  context: SessionContext,
  database: Database = getDb(),
) {
  assertPermission(context.role, "deals:read");
  return listPipelineStages(database, context.workspaceId);
}

export async function getDeals(
  context: SessionContext,
  options?: { includeArchived?: boolean; query?: string },
  database: Database = getDb(),
) {
  assertPermission(context.role, "deals:read");
  return listDeals(database, context.workspaceId, {
    ...options,
    ownerId: context.role === "sales" ? context.userId : undefined,
  });
}

export async function getDeal(
  context: SessionContext,
  dealId: string,
  database: Database = getDb(),
) {
  assertPermission(context.role, "deals:read");
  const deal = await findDealById(database, context.workspaceId, dealId);
  if (!deal) throw new NotFoundError("The deal could not be found.");
  assertOwnedRecord(context, deal, "deals:read");
  return deal;
}

export async function getDealStageHistory(
  context: SessionContext,
  dealId: string,
  database: Database = getDb(),
) {
  await getDeal(context, dealId, database);
  return listDealStageHistory(database, context.workspaceId, dealId);
}

export async function createDeal(
  context: SessionContext,
  unsafeInput: unknown,
  database: Database = getDb(),
) {
  assertPermission(context.role, "deals:write");
  const input = dealInputSchema.parse(unsafeInput);
  return database.transaction(async (transaction) => {
    const stage = await validateDealLinks(
      context,
      transaction,
      input.companyId,
      input.primaryContactId,
      input.pipelineStageId,
    );
    const legacyStage = legacyStageFor(stage);
    const probability = stage.outcome === "won" ? 100 : stage.outcome === "lost" ? 0 : input.probability;
    const deal = await insertDeal(transaction, {
      workspaceId: context.workspaceId,
      title: input.title,
      companyId: input.companyId,
      primaryContactId: input.primaryContactId || null,
      ownerId: context.userId,
      pipelineStageId: stage.id,
      stage: legacyStage,
      kind: input.kind,
      value: input.value || null,
      currency: input.currency,
      probability,
      expectedCloseAt: expectedClose(input.expectedCloseAt),
    });
    await insertInitialDealStageHistory(transaction, {
      workspaceId: context.workspaceId,
      dealId: deal.id,
      toPipelineStageId: stage.id,
      toStage: legacyStage,
      actorId: context.userId,
    });
    await recordAudit(transaction, {
      context,
      entityType: "deal",
      entityId: deal.id,
      action: "created",
      label: "Created a deal",
      after: {
        title: deal.title,
        companyId: deal.companyId,
        pipelineStageId: deal.pipelineStageId,
        value: deal.value,
      },
    });
    return deal;
  });
}

export async function updateDeal(
  context: SessionContext,
  dealId: string,
  unsafeInput: unknown,
  database: Database = getDb(),
) {
  assertPermission(context.role, "deals:write");
  const input = dealInputSchema.parse(unsafeInput);
  return database.transaction(async (transaction) => {
    await transaction.execute(sql`
      select id from deals
      where workspace_id = ${context.workspaceId} and id = ${dealId}
      for update
    `);
    const before = await findDealById(transaction, context.workspaceId, dealId);
    if (!before) throw new NotFoundError("The deal could not be found.");
    assertOwnedRecord(context, before, "deals:write");
    const stage = await validateDealLinks(
      context,
      transaction,
      input.companyId,
      input.primaryContactId,
      input.pipelineStageId,
    );
    const legacyStage = legacyStageFor(stage);
    const probability = stage.outcome === "won" ? 100 : stage.outcome === "lost" ? 0 : input.probability;
    const deal = await updateDealById(transaction, context.workspaceId, dealId, {
      title: input.title,
      companyId: input.companyId,
      primaryContactId: input.primaryContactId || null,
      pipelineStageId: stage.id,
      stage: legacyStage,
      kind: input.kind,
      value: input.value || null,
      currency: input.currency,
      probability,
      expectedCloseAt: expectedClose(input.expectedCloseAt),
    });
    if (!deal) throw new NotFoundError("The deal could not be found.");
    if (before.pipelineStageId !== stage.id) {
      await insertInitialDealStageHistory(transaction, {
        workspaceId: context.workspaceId,
        dealId: deal.id,
        fromPipelineStageId: before.pipelineStageId,
        toPipelineStageId: stage.id,
        fromStage: before.stage,
        toStage: legacyStage,
        actorId: context.userId,
      });
      await recordAudit(transaction, {
        context,
        entityType: "deal",
        entityId: deal.id,
        action: "stage_moved",
        label: "Moved a deal to another pipeline stage",
        before: {
          pipelineStageId: before.pipelineStageId,
          stage: before.pipelineStageLabel,
        },
        after: { pipelineStageId: stage.id, stage: stage.label },
      });
    }
    await recordAudit(transaction, {
      context,
      entityType: "deal",
      entityId: deal.id,
      action: "updated",
      label: "Updated a deal",
      before: { title: before.title, companyId: before.companyId, pipelineStageId: before.pipelineStageId, value: before.value },
      after: { title: deal.title, companyId: deal.companyId, pipelineStageId: deal.pipelineStageId, value: deal.value },
    });
    return deal;
  });
}

export async function moveDealStage(
  context: SessionContext,
  dealId: string,
  unsafeInput: unknown,
  database: Database = getDb(),
) {
  assertPermission(context.role, "deals:move");
  const input = moveDealStageSchema.parse(unsafeInput);
  return database.transaction(async (transaction) => {
    await transaction.execute(sql`
      select id from deals
      where workspace_id = ${context.workspaceId} and id = ${dealId}
      for update
    `);
    const before = await findDealById(transaction, context.workspaceId, dealId);
    if (!before) throw new NotFoundError("The deal could not be found.");
    assertOwnedRecord(context, before, "deals:move");
    if (before.deletedAt) throw new ConflictError("Archived deals cannot change stage.");
    const target = await findPipelineStageById(
      transaction,
      context.workspaceId,
      input.pipelineStageId,
    );
    if (!target || !target.isActive) {
      throw new NotFoundError("The pipeline stage could not be found.");
    }
    if (target.id === before.pipelineStageId) return before;
    const toStage = legacyStageFor(target);
    const fromStage = before.stage;
    const deal = await updateDealById(transaction, context.workspaceId, dealId, {
      pipelineStageId: target.id,
      stage: toStage,
      probability: target.outcome === "won" ? 100 : target.outcome === "lost" ? 0 : before.probability,
    });
    if (!deal) throw new NotFoundError("The deal could not be found.");
    await insertInitialDealStageHistory(transaction, {
      workspaceId: context.workspaceId,
      dealId: deal.id,
      fromPipelineStageId: before.pipelineStageId,
      toPipelineStageId: target.id,
      fromStage,
      toStage,
      actorId: context.userId,
    });
    await recordAudit(transaction, {
      context,
      entityType: "deal",
      entityId: deal.id,
      action: "stage_moved",
      label: "Moved a deal to another pipeline stage",
      before: { pipelineStageId: before.pipelineStageId, stage: before.pipelineStageLabel },
      after: { pipelineStageId: target.id, stage: target.label },
    });
    return deal;
  });
}

export async function archiveDeal(
  context: SessionContext,
  dealId: string,
  archived: boolean,
  database: Database = getDb(),
) {
  assertPermission(context.role, "deals:write");
  return database.transaction(async (transaction) => {
    const before = await findDealById(transaction, context.workspaceId, dealId);
    if (!before) throw new NotFoundError("The deal could not be found.");
    assertOwnedRecord(context, before, "deals:write");
    const deal = await setDealArchived(transaction, context.workspaceId, dealId, archived);
    if (!deal) throw new NotFoundError("The deal could not be found.");
    await recordAudit(transaction, {
      context,
      entityType: "deal",
      entityId: deal.id,
      action: archived ? "archived" : "restored",
      label: archived ? "Archived a deal" : "Restored a deal",
      after: { title: deal.title },
    });
    return deal;
  });
}
