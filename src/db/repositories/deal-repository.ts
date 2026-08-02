import { and, asc, desc, eq, ilike, isNull, or } from "drizzle-orm";

import {
  companies,
  contacts,
  dealStageHistory,
  deals,
  pipelineStages,
  users,
} from "@/db/schema";

import type {
  DatabaseExecutor,
  DatabaseTransaction,
} from "./workspace-repository";

export async function findInitialPipelineStage(
  database: DatabaseExecutor,
  workspaceId: string,
) {
  const [stage] = await database
    .select()
    .from(pipelineStages)
    .where(
      and(
        eq(pipelineStages.workspaceId, workspaceId),
        eq(pipelineStages.isActive, true),
        eq(pipelineStages.outcome, "open"),
      ),
    )
    .orderBy(asc(pipelineStages.position))
    .limit(1);
  return stage ?? null;
}

export async function listPipelineStages(
  database: DatabaseExecutor,
  workspaceId: string,
  options: { includeInactive?: boolean } = {},
) {
  return database
    .select()
    .from(pipelineStages)
    .where(
      and(
        eq(pipelineStages.workspaceId, workspaceId),
        options.includeInactive ? undefined : eq(pipelineStages.isActive, true),
      ),
    )
    .orderBy(asc(pipelineStages.position));
}

export async function findPipelineStageById(
  database: DatabaseExecutor,
  workspaceId: string,
  pipelineStageId: string,
) {
  const [stage] = await database
    .select()
    .from(pipelineStages)
    .where(
      and(
        eq(pipelineStages.workspaceId, workspaceId),
        eq(pipelineStages.id, pipelineStageId),
      ),
    )
    .limit(1);
  return stage ?? null;
}

export async function listDeals(
  database: DatabaseExecutor,
  workspaceId: string,
  options: {
    includeArchived?: boolean;
    ownerId?: string;
    query?: string;
  } = {},
) {
  const query = options.query?.trim();
  return database
    .select({
      id: deals.id,
      title: deals.title,
      companyId: deals.companyId,
      companyName: companies.name,
      primaryContactId: deals.primaryContactId,
      ownerId: deals.ownerId,
      ownerName: users.name,
      pipelineStageId: deals.pipelineStageId,
      pipelineStageLabel: pipelineStages.label,
      pipelineStageOutcome: pipelineStages.outcome,
      stage: deals.stage,
      kind: deals.kind,
      value: deals.value,
      currency: deals.currency,
      probability: deals.probability,
      expectedCloseAt: deals.expectedCloseAt,
      createdAt: deals.createdAt,
      updatedAt: deals.updatedAt,
      deletedAt: deals.deletedAt,
    })
    .from(deals)
    .innerJoin(
      companies,
      and(eq(deals.companyId, companies.id), eq(companies.workspaceId, workspaceId)),
    )
    .innerJoin(
      pipelineStages,
      and(
        eq(deals.pipelineStageId, pipelineStages.id),
        eq(pipelineStages.workspaceId, workspaceId),
      ),
    )
    .innerJoin(users, eq(deals.ownerId, users.id))
    .where(
      and(
        eq(deals.workspaceId, workspaceId),
        options.includeArchived ? undefined : isNull(deals.deletedAt),
        options.ownerId ? eq(deals.ownerId, options.ownerId) : undefined,
        query
          ? or(
              ilike(deals.title, `%${query}%`),
              ilike(companies.name, `%${query}%`),
              ilike(users.name, `%${query}%`),
            )
          : undefined,
      ),
    )
    .orderBy(desc(deals.updatedAt))
    .limit(300);
}

export async function findDealById(
  database: DatabaseExecutor,
  workspaceId: string,
  dealId: string,
) {
  const [deal] = await database
    .select({
      id: deals.id,
      workspaceId: deals.workspaceId,
      title: deals.title,
      companyId: deals.companyId,
      companyName: companies.name,
      primaryContactId: deals.primaryContactId,
      primaryContactFirstName: contacts.firstName,
      primaryContactLastName: contacts.lastName,
      sourceLeadId: deals.sourceLeadId,
      ownerId: deals.ownerId,
      ownerName: users.name,
      pipelineStageId: deals.pipelineStageId,
      pipelineStageLabel: pipelineStages.label,
      pipelineStageOutcome: pipelineStages.outcome,
      stage: deals.stage,
      kind: deals.kind,
      value: deals.value,
      currency: deals.currency,
      probability: deals.probability,
      expectedCloseAt: deals.expectedCloseAt,
      createdAt: deals.createdAt,
      updatedAt: deals.updatedAt,
      deletedAt: deals.deletedAt,
    })
    .from(deals)
    .innerJoin(
      companies,
      and(eq(deals.companyId, companies.id), eq(companies.workspaceId, workspaceId)),
    )
    .leftJoin(
      contacts,
      and(
        eq(deals.primaryContactId, contacts.id),
        eq(contacts.workspaceId, workspaceId),
      ),
    )
    .innerJoin(
      pipelineStages,
      and(
        eq(deals.pipelineStageId, pipelineStages.id),
        eq(pipelineStages.workspaceId, workspaceId),
      ),
    )
    .innerJoin(users, eq(deals.ownerId, users.id))
    .where(and(eq(deals.workspaceId, workspaceId), eq(deals.id, dealId)))
    .limit(1);
  return deal ?? null;
}

export async function insertDeal(
  transaction: DatabaseTransaction,
  input: typeof deals.$inferInsert,
) {
  const [deal] = await transaction.insert(deals).values(input).returning();
  if (!deal) throw new Error("Deal could not be created.");
  return deal;
}

export async function insertInitialDealStageHistory(
  transaction: DatabaseTransaction,
  input: typeof dealStageHistory.$inferInsert,
) {
  await transaction.insert(dealStageHistory).values(input);
}

export async function updateDealById(
  transaction: DatabaseTransaction,
  workspaceId: string,
  dealId: string,
  input: Partial<typeof deals.$inferInsert>,
) {
  const [deal] = await transaction
    .update(deals)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(deals.workspaceId, workspaceId), eq(deals.id, dealId)))
    .returning();
  return deal ?? null;
}

export async function setDealArchived(
  transaction: DatabaseTransaction,
  workspaceId: string,
  dealId: string,
  archived: boolean,
) {
  const [deal] = await transaction
    .update(deals)
    .set({ deletedAt: archived ? new Date() : null, updatedAt: new Date() })
    .where(and(eq(deals.workspaceId, workspaceId), eq(deals.id, dealId)))
    .returning();
  return deal ?? null;
}

export async function listDealStageHistory(
  database: DatabaseExecutor,
  workspaceId: string,
  dealId: string,
) {
  return database
    .select({
      id: dealStageHistory.id,
      fromPipelineStageId: dealStageHistory.fromPipelineStageId,
      toPipelineStageId: dealStageHistory.toPipelineStageId,
      actorId: dealStageHistory.actorId,
      changedAt: dealStageHistory.changedAt,
    })
    .from(dealStageHistory)
    .where(
      and(
        eq(dealStageHistory.workspaceId, workspaceId),
        eq(dealStageHistory.dealId, dealId),
      ),
    )
    .orderBy(desc(dealStageHistory.changedAt));
}
