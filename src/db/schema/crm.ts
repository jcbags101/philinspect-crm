import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { users, workspaces } from "./identity";

export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "to_contact",
  "followed_up",
  "converted",
  "archived",
]);

export const leadSegmentEnum = pgEnum("lead_segment", [
  "idea_rich_founder",
  "sme_going_digital",
  "corporate_innovator",
  "ph_startup_scaleup",
]);

// Retained during the data-preserving pipeline migration. New workflow code
// resolves stages through pipelineStages rather than hard-coding this enum.
export const dealStageEnum = pgEnum("deal_stage", [
  "lead",
  "discovery",
  "assessment",
  "demo_proposal",
  "follow_up",
  "parked",
  "won",
  "lost",
]);

export const pipelineOutcomeEnum = pgEnum("pipeline_outcome", [
  "open",
  "won",
  "lost",
]);

export const dealKindEnum = pgEnum("deal_kind", [
  "product",
  "service",
  "reseller",
]);

export const activityTypeEnum = pgEnum("activity_type", [
  "call",
  "email",
  "meeting",
  "note",
  "system",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "open",
  "in_progress",
  "completed",
  "cancelled",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 180 }).notNull(),
    domain: varchar("domain", { length: 255 }),
    industry: varchar("industry", { length: 140 }),
    ownerId: uuid("owner_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdById: uuid("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("companies_workspace_name_idx").on(table.workspaceId, table.name),
    index("companies_workspace_owner_idx").on(
      table.workspaceId,
      table.ownerId,
      table.deletedAt,
    ),
  ],
);

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "set null",
    }),
    ownerId: uuid("owner_id").references(() => users.id, {
      onDelete: "set null",
    }),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 80 }),
    jobTitle: varchar("job_title", { length: 140 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("contacts_workspace_email_idx").on(
      table.workspaceId,
      table.email,
    ),
    index("contacts_workspace_company_idx").on(
      table.workspaceId,
      table.companyId,
      table.deletedAt,
    ),
    index("contacts_workspace_owner_idx").on(
      table.workspaceId,
      table.ownerId,
      table.deletedAt,
    ),
  ],
);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "set null",
    }),
    contactId: uuid("contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 160 }).notNull(),
    companyName: varchar("company_name", { length: 180 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 80 }),
    industry: varchar("industry", { length: 140 }),
    segment: leadSegmentEnum("segment").notNull(),
    status: leadStatusEnum("status").default("new").notNull(),
    ownerId: uuid("owner_id").references(() => users.id, {
      onDelete: "set null",
    }),
    convertedAt: timestamp("converted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("leads_workspace_status_idx").on(
      table.workspaceId,
      table.status,
      table.deletedAt,
    ),
    index("leads_workspace_segment_idx").on(
      table.workspaceId,
      table.segment,
    ),
    index("leads_workspace_owner_idx").on(
      table.workspaceId,
      table.ownerId,
      table.deletedAt,
    ),
    index("leads_workspace_company_idx").on(
      table.workspaceId,
      table.companyId,
    ),
  ],
);

export const pipelineStages = pgTable(
  "pipeline_stages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 80 }).notNull(),
    label: varchar("label", { length: 100 }).notNull(),
    position: integer("position").notNull(),
    colorRole: varchar("color_role", { length: 80 }).notNull(),
    outcome: pipelineOutcomeEnum("outcome").default("open").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("pipeline_stages_workspace_key_idx").on(
      table.workspaceId,
      table.key,
    ),
    uniqueIndex("pipeline_stages_workspace_position_idx").on(
      table.workspaceId,
      table.position,
    ),
  ],
);

export const deals = pgTable(
  "deals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 220 }).notNull(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    primaryContactId: uuid("primary_contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    sourceLeadId: uuid("source_lead_id").references(() => leads.id, {
      onDelete: "set null",
    }),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    pipelineStageId: uuid("pipeline_stage_id")
      .notNull()
      .references(() => pipelineStages.id),
    stage: dealStageEnum("stage").default("lead").notNull(),
    kind: dealKindEnum("kind").notNull(),
    value: numeric("value", { precision: 14, scale: 2 }),
    currency: varchar("currency", { length: 3 }).default("PHP").notNull(),
    probability: integer("probability").default(10).notNull(),
    expectedCloseAt: timestamp("expected_close_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("deals_workspace_stage_idx").on(
      table.workspaceId,
      table.pipelineStageId,
      table.deletedAt,
    ),
    index("deals_workspace_owner_idx").on(
      table.workspaceId,
      table.ownerId,
      table.deletedAt,
    ),
    index("deals_workspace_company_idx").on(
      table.workspaceId,
      table.companyId,
    ),
    index("deals_workspace_source_lead_idx").on(
      table.workspaceId,
      table.sourceLeadId,
    ),
  ],
);

export const dealStageHistory = pgTable(
  "deal_stage_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    dealId: uuid("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    fromPipelineStageId: uuid("from_pipeline_stage_id").references(
      () => pipelineStages.id,
      { onDelete: "set null" },
    ),
    toPipelineStageId: uuid("to_pipeline_stage_id")
      .notNull()
      .references(() => pipelineStages.id),
    fromStage: dealStageEnum("from_stage"),
    toStage: dealStageEnum("to_stage").notNull(),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id),
    changedAt: timestamp("changed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("deal_stage_history_workspace_deal_idx").on(
      table.workspaceId,
      table.dealId,
      table.changedAt,
    ),
  ],
);

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    dealId: uuid("deal_id").references(() => deals.id, {
      onDelete: "cascade",
    }),
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "cascade",
    }),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id),
    type: activityTypeEnum("type").notNull(),
    title: varchar("title", { length: 220 }).notNull(),
    body: text("body"),
    happenedAt: timestamp("happened_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("activities_workspace_deal_idx").on(
      table.workspaceId,
      table.dealId,
      table.happenedAt,
    ),
    index("activities_workspace_company_idx").on(
      table.workspaceId,
      table.companyId,
      table.happenedAt,
    ),
  ],
);

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    dealId: uuid("deal_id").references(() => deals.id, {
      onDelete: "cascade",
    }),
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "cascade",
    }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("notes_workspace_deal_idx").on(table.workspaceId, table.dealId),
    index("notes_workspace_company_idx").on(
      table.workspaceId,
      table.companyId,
    ),
  ],
);

export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    dealId: uuid("deal_id").references(() => deals.id, {
      onDelete: "cascade",
    }),
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "cascade",
    }),
    uploadedById: uuid("uploaded_by_id")
      .notNull()
      .references(() => users.id),
    name: varchar("name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 120 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    fixture: jsonb("fixture"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("attachments_workspace_deal_idx").on(
      table.workspaceId,
      table.dealId,
    ),
    index("attachments_workspace_company_idx").on(
      table.workspaceId,
      table.companyId,
    ),
  ],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 220 }).notNull(),
    description: text("description"),
    status: taskStatusEnum("status").default("open").notNull(),
    priority: taskPriorityEnum("priority").default("medium").notNull(),
    assignedToId: uuid("assigned_to_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id),
    contactId: uuid("contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "set null",
    }),
    leadId: uuid("lead_id").references(() => leads.id, {
      onDelete: "set null",
    }),
    dealId: uuid("deal_id").references(() => deals.id, {
      onDelete: "set null",
    }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("tasks_workspace_status_due_idx").on(
      table.workspaceId,
      table.status,
      table.dueAt,
    ),
    index("tasks_workspace_assignee_idx").on(
      table.workspaceId,
      table.assignedToId,
      table.status,
    ),
    index("tasks_workspace_company_idx").on(table.workspaceId, table.companyId),
    index("tasks_workspace_deal_idx").on(table.workspaceId, table.dealId),
  ],
);
