import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { users, workspaces } from "./identity";

export const auditActionEnum = pgEnum("audit_action", [
  "created",
  "updated",
  "status",
  "deleted",
  "restored",
  "permanent_deleted",
  "sent",
  "retried",
  "assigned",
  "tagged",
  "noted",
  "read_status",
  "reset",
  "invited",
  "accepted",
  "revoked",
  "role_changed",
  "converted",
  "stage_moved",
  "completed",
  "archived",
]);

export const integrationStatusEnum = pgEnum("integration_status", [
  "connected",
  "disconnected",
  "coming_soon",
]);

export const integrationConnections = pgTable("integration_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 80 }).notNull(),
  status: integrationStatusEnum("status").notNull(),
  fixture: jsonb("fixture"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => users.id),
    entityType: varchar("entity_type", { length: 80 }).notNull(),
    entityId: uuid("entity_id"),
    action: auditActionEnum("action").notNull(),
    label: varchar("label", { length: 240 }).notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    via: varchar("via", { length: 80 }).default("app").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_logs_created_idx").on(table.createdAt),
    index("audit_logs_workspace_idx").on(table.workspaceId, table.createdAt),
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    index("audit_logs_actor_idx").on(table.actorId),
  ],
);
