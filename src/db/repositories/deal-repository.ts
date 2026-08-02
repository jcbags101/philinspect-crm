import { and, asc, eq } from "drizzle-orm";

import { dealStageHistory, deals, pipelineStages } from "@/db/schema";

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
