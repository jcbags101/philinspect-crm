import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { companies, contacts, deals } from "./crm";
import { users, workspaces } from "./identity";

export const inspectionStatusEnum = pgEnum("inspection_status", [
  "draft",
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
]);

export const inspections = pgTable(
  "inspections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    primaryContactId: uuid("primary_contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    dealId: uuid("deal_id").references(() => deals.id, {
      onDelete: "set null",
    }),
    assignedToId: uuid("assigned_to_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id),
    title: varchar("title", { length: 220 }).notNull(),
    status: inspectionStatusEnum("status").default("draft").notNull(),
    location: varchar("location", { length: 300 }),
    notes: text("notes"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    reportMetadata: jsonb("report_metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("inspections_workspace_status_idx").on(
      table.workspaceId,
      table.status,
      table.scheduledAt,
    ),
    index("inspections_workspace_assignee_idx").on(
      table.workspaceId,
      table.assignedToId,
      table.status,
    ),
    index("inspections_workspace_company_idx").on(
      table.workspaceId,
      table.companyId,
    ),
    index("inspections_workspace_deal_idx").on(table.workspaceId, table.dealId),
  ],
);
