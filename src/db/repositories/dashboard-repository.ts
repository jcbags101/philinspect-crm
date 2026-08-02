import {
  and,
  count,
  desc,
  eq,
  isNull,
  notInArray,
  sql,
} from "drizzle-orm";

import {
  auditLogs,
  companies,
  deals,
  leads,
  pipelineStages,
  tasks,
  users,
} from "@/db/schema";
import type { DatabaseExecutor } from "./workspace-repository";

interface DashboardScope {
  workspaceId: string;
  ownedById?: string;
}

export async function getDashboardMetrics(
  database: DatabaseExecutor,
  scope: DashboardScope,
) {
  const ownerDealFilter = scope.ownedById
    ? eq(deals.ownerId, scope.ownedById)
    : undefined;
  const ownerLeadFilter = scope.ownedById
    ? eq(leads.ownerId, scope.ownedById)
    : undefined;
  const assigneeTaskFilter = scope.ownedById
    ? eq(tasks.assignedToId, scope.ownedById)
    : undefined;

  const [leadRows, companyRows, openDealRows, wonDealRows, taskRows] =
    await Promise.all([
      database
        .select({
          total: count(leads.id),
          converted: sql<number>`count(*) filter (where ${leads.convertedAt} is not null)::int`,
        })
        .from(leads)
        .where(
          and(
            eq(leads.workspaceId, scope.workspaceId),
            isNull(leads.deletedAt),
            ownerLeadFilter,
          ),
        ),
      database
        .select({ total: count(companies.id) })
        .from(companies)
        .where(
          and(
            eq(companies.workspaceId, scope.workspaceId),
            isNull(companies.deletedAt),
          ),
        ),
      database
        .select({
          total: count(deals.id),
          value: sql<string>`coalesce(sum(${deals.value}), 0)`,
        })
        .from(deals)
        .innerJoin(
          pipelineStages,
          and(
            eq(deals.pipelineStageId, pipelineStages.id),
            eq(pipelineStages.workspaceId, scope.workspaceId),
          ),
        )
        .where(
          and(
            eq(deals.workspaceId, scope.workspaceId),
            eq(pipelineStages.outcome, "open"),
            isNull(deals.deletedAt),
            ownerDealFilter,
          ),
        ),
      database
        .select({
          total: count(deals.id),
          value: sql<string>`coalesce(sum(${deals.value}), 0)`,
        })
        .from(deals)
        .innerJoin(
          pipelineStages,
          and(
            eq(deals.pipelineStageId, pipelineStages.id),
            eq(pipelineStages.workspaceId, scope.workspaceId),
          ),
        )
        .where(
          and(
            eq(deals.workspaceId, scope.workspaceId),
            eq(pipelineStages.outcome, "won"),
            isNull(deals.deletedAt),
            ownerDealFilter,
          ),
        ),
      database
        .select({
          open: count(tasks.id),
          overdue: sql<number>`count(*) filter (where ${tasks.dueAt} < now())::int`,
        })
        .from(tasks)
        .where(
          and(
            eq(tasks.workspaceId, scope.workspaceId),
            isNull(tasks.deletedAt),
            notInArray(tasks.status, ["completed", "cancelled"]),
            assigneeTaskFilter,
          ),
        ),
    ]);

  return {
    leads: leadRows[0] ?? { total: 0, converted: 0 },
    companies: companyRows[0] ?? { total: 0 },
    openDeals: openDealRows[0] ?? { total: 0, value: "0" },
    wonDeals: wonDealRows[0] ?? { total: 0, value: "0" },
    tasks: taskRows[0] ?? { open: 0, overdue: 0 },
  };
}

export async function getDashboardPipeline(
  database: DatabaseExecutor,
  scope: DashboardScope,
) {
  return database
    .select({
      id: pipelineStages.id,
      label: pipelineStages.label,
      position: pipelineStages.position,
      outcome: pipelineStages.outcome,
      count: count(deals.id),
      value: sql<string>`coalesce(sum(${deals.value}), 0)`,
    })
    .from(pipelineStages)
    .leftJoin(
      deals,
      and(
        eq(deals.pipelineStageId, pipelineStages.id),
        eq(deals.workspaceId, scope.workspaceId),
        isNull(deals.deletedAt),
        scope.ownedById ? eq(deals.ownerId, scope.ownedById) : undefined,
      ),
    )
    .where(
      and(
        eq(pipelineStages.workspaceId, scope.workspaceId),
        eq(pipelineStages.isActive, true),
      ),
    )
    .groupBy(pipelineStages.id)
    .orderBy(pipelineStages.position);
}

export async function getDashboardActivity(
  database: DatabaseExecutor,
  scope: DashboardScope,
  limit = 7,
) {
  return database
    .select({
      id: auditLogs.id,
      label: auditLogs.label,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      actor: users.name,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorId, users.id))
    .where(
      and(
        eq(auditLogs.workspaceId, scope.workspaceId),
        scope.ownedById ? eq(auditLogs.actorId, scope.ownedById) : undefined,
      ),
    )
    .orderBy(desc(auditLogs.createdAt))
    .limit(Math.min(Math.max(limit, 1), 20));
}
