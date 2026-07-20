import {
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { users } from "./identity";

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

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    companyName: varchar("company_name", { length: 180 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 80 }),
    industry: varchar("industry", { length: 140 }),
    segment: leadSegmentEnum("segment").notNull(),
    status: leadStatusEnum("status").default("new").notNull(),
    ownerId: uuid("owner_id").references(() => users.id),
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
    index("leads_status_idx").on(table.status),
    index("leads_segment_idx").on(table.segment),
    index("leads_owner_idx").on(table.ownerId),
  ],
);

export const brands = pgTable(
  "brands",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 180 }).notNull(),
    domain: varchar("domain", { length: 255 }),
    industry: varchar("industry", { length: 140 }),
    ownerId: uuid("owner_id").references(() => users.id),
    createdById: uuid("created_by_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [index("brands_name_idx").on(table.name)],
);

export const deals = pgTable(
  "deals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 220 }).notNull(),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id),
    sourceLeadId: uuid("source_lead_id").references(() => leads.id),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
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
    index("deals_stage_idx").on(table.stage),
    index("deals_kind_idx").on(table.kind),
    index("deals_owner_idx").on(table.ownerId),
    index("deals_brand_idx").on(table.brandId),
  ],
);

export const dealStageHistory = pgTable(
  "deal_stage_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dealId: uuid("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    fromStage: dealStageEnum("from_stage"),
    toStage: dealStageEnum("to_stage").notNull(),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id),
    changedAt: timestamp("changed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("deal_stage_history_deal_idx").on(table.dealId)],
);

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dealId: uuid("deal_id").references(() => deals.id, {
      onDelete: "cascade",
    }),
    brandId: uuid("brand_id").references(() => brands.id, {
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
    index("activities_deal_idx").on(table.dealId),
    index("activities_brand_idx").on(table.brandId),
  ],
);

export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  dealId: uuid("deal_id").references(() => deals.id, {
    onDelete: "cascade",
  }),
  brandId: uuid("brand_id").references(() => brands.id, {
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
});

export const attachments = pgTable("attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  dealId: uuid("deal_id").references(() => deals.id, {
    onDelete: "cascade",
  }),
  brandId: uuid("brand_id").references(() => brands.id, {
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
});

