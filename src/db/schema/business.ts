import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { brands, dealKindEnum, deals } from "./crm";

export const billingTypeEnum = pgEnum("billing_type", [
  "monthly",
  "milestone",
]);

export const catalogItems = pgTable("catalog_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  kind: dealKindEnum("kind").notNull(),
  landingPage: varchar("landing_page", { length: 500 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const revenueTargets = pgTable("revenue_targets", {
  id: uuid("id").defaultRandom().primaryKey(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("PHP").notNull(),
});

export const revenueEntries = pgTable(
  "revenue_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dealId: uuid("deal_id")
      .notNull()
      .references(() => deals.id),
    catalogItemId: uuid("catalog_item_id").references(() => catalogItems.id),
    month: date("month").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("PHP").notNull(),
    isRecurring: boolean("is_recurring").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("revenue_entries_deal_idx").on(table.dealId)],
);

export const billingPlans = pgTable("billing_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  dealId: uuid("deal_id")
    .notNull()
    .references(() => deals.id),
  brandId: uuid("brand_id")
    .notNull()
    .references(() => brands.id),
  type: billingTypeEnum("type").notNull(),
  totalValue: numeric("total_value", { precision: 14, scale: 2 }).notNull(),
  monthlyValue: numeric("monthly_value", { precision: 14, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("PHP").notNull(),
  startsOn: date("starts_on"),
  endsOn: date("ends_on"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const billingMilestones = pgTable("billing_milestones", {
  id: uuid("id").defaultRandom().primaryKey(),
  billingPlanId: uuid("billing_plan_id")
    .notNull()
    .references(() => billingPlans.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 180 }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  dueOn: date("due_on"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
});

