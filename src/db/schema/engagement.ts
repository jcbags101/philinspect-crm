import {
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { brands, deals } from "./crm";
import { users } from "./identity";

export const meetingStatusEnum = pgEnum("meeting_status", [
  "pending",
  "done",
  "failed",
]);
export const proposalTypeEnum = pgEnum("proposal_type", [
  "presentation",
  "formal",
]);
export const proposalStatusEnum = pgEnum("proposal_status", [
  "draft",
  "sent",
  "signed",
]);
export const partnershipStatusEnum = pgEnum("partnership_status", [
  "pending",
  "approved",
]);

export const meetings = pgTable("meetings", {
  id: uuid("id").defaultRandom().primaryKey(),
  dealId: uuid("deal_id").references(() => deals.id),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 220 }).notNull(),
  status: meetingStatusEnum("status").default("pending").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const recordings = pgTable("recordings", {
  id: uuid("id").defaultRandom().primaryKey(),
  meetingId: uuid("meeting_id")
    .notNull()
    .references(() => meetings.id, { onDelete: "cascade" }),
  durationSeconds: varchar("duration_seconds", { length: 12 }).notNull(),
  transcript: text("transcript"),
  fixture: jsonb("fixture"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const proposals = pgTable("proposals", {
  id: uuid("id").defaultRandom().primaryKey(),
  dealId: uuid("deal_id")
    .notNull()
    .references(() => deals.id),
  brandId: uuid("brand_id")
    .notNull()
    .references(() => brands.id),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 220 }).notNull(),
  type: proposalTypeEnum("type").notNull(),
  status: proposalStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const proposalVersions = pgTable("proposal_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  proposalId: uuid("proposal_id")
    .notNull()
    .references(() => proposals.id, { onDelete: "cascade" }),
  version: varchar("version", { length: 30 }).notNull(),
  fixture: jsonb("fixture"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const partnershipAccounts = pgTable("partnership_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  status: partnershipStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const partnershipGroups = pgTable("partnership_groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  createdById: uuid("created_by_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const partnershipGroupMembers = pgTable("partnership_group_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => partnershipGroups.id, { onDelete: "cascade" }),
  accountId: uuid("account_id")
    .notNull()
    .references(() => partnershipAccounts.id, { onDelete: "cascade" }),
});
