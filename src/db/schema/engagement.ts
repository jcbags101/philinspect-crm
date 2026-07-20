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

import { brands, deals } from "./crm";
import { users } from "./identity";

export const channelTypeEnum = pgEnum("channel_type", [
  "email",
  "messenger",
  "instagram",
  "whatsapp",
  "viber",
]);
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

export const communicationChannels = pgTable("communication_channels", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: channelTypeEnum("type").notNull(),
  label: varchar("label", { length: 80 }).notNull(),
});

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    channelId: uuid("channel_id")
      .notNull()
      .references(() => communicationChannels.id),
    brandId: uuid("brand_id").references(() => brands.id),
    subject: varchar("subject", { length: 240 }).notNull(),
    participantLabel: varchar("participant_label", { length: 180 }).notNull(),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    unreadAt: timestamp("unread_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("conversations_channel_idx").on(table.channelId)],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderLabel: varchar("sender_label", { length: 180 }).notNull(),
    direction: varchar("direction", { length: 12 }).notNull(),
    body: text("body").notNull(),
    fixture: jsonb("fixture"),
    sentAt: timestamp("sent_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("messages_conversation_idx").on(table.conversationId)],
);

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

