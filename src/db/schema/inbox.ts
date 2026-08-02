import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { companies } from "./crm";
import { users, workspaces } from "./identity";

export const channelTypeEnum = pgEnum("channel_type", [
  "email",
  "messenger",
  "instagram",
  "whatsapp",
  "viber",
]);
export const messagingAccountStatusEnum = pgEnum("messaging_account_status", [
  "connected",
  "warning",
  "disconnected",
]);
export const conversationStatusEnum = pgEnum("conversation_status", [
  "open",
  "pending",
  "resolved",
]);
export const messageDeliveryStateEnum = pgEnum("message_delivery_state", [
  "queued",
  "sent",
  "delivered",
  "read",
  "failed",
]);

export const communicationChannels = pgTable("communication_channels", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: channelTypeEnum("type").notNull(),
  label: varchar("label", { length: 80 }).notNull(),
});

export const messagingAccounts = pgTable(
  "messaging_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    channel: channelTypeEnum("channel").notNull(),
    label: varchar("label", { length: 120 }).notNull(),
    handle: varchar("handle", { length: 160 }).notNull(),
    fictionalExternalAccountId: varchar("fictional_external_account_id", { length: 180 }).notNull(),
    status: messagingAccountStatusEnum("status").default("connected").notNull(),
    syncWarning: varchar("sync_warning", { length: 240 }),
    fixture: jsonb("fixture").notNull(),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("messaging_accounts_workspace_external_idx").on(table.workspaceId, table.fictionalExternalAccountId),
    index("messaging_accounts_workspace_channel_idx").on(table.workspaceId, table.channel),
  ],
);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    messagingAccountId: uuid("messaging_account_id").notNull().references(() => messagingAccounts.id, { onDelete: "cascade" }),
    providerConversationId: varchar("provider_conversation_id", { length: 180 }).notNull(),
    channelId: uuid("channel_id").notNull().references(() => communicationChannels.id),
    companyId: uuid("company_id").references(() => companies.id),
    assigneeId: uuid("assignee_id").references(() => users.id, { onDelete: "set null" }),
    subject: varchar("subject", { length: 240 }).notNull(),
    participantLabel: varchar("participant_label", { length: 180 }).notNull(),
    participantHandle: varchar("participant_handle", { length: 180 }),
    status: conversationStatusEnum("status").default("open").notNull(),
    unreadCount: integer("unread_count").default(0).notNull(),
    lastMessagePreview: varchar("last_message_preview", { length: 280 }),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }).defaultNow().notNull(),
    unreadAt: timestamp("unread_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("conversations_workspace_provider_idx").on(table.workspaceId, table.providerConversationId),
    index("conversations_channel_idx").on(table.channelId),
    index("conversations_account_last_message_idx").on(table.messagingAccountId, table.lastMessageAt),
    index("conversations_workspace_queue_idx").on(table.workspaceId, table.status, table.assigneeId, table.unreadCount),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    senderUserId: uuid("sender_user_id").references(() => users.id, { onDelete: "set null" }),
    senderLabel: varchar("sender_label", { length: 180 }).notNull(),
    direction: varchar("direction", { length: 12 }).notNull(),
    body: text("body").notNull(),
    deliveryState: messageDeliveryStateEnum("delivery_state").default("delivered").notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 180 }),
    providerMessageId: varchar("provider_message_id", { length: 180 }),
    deliveryError: varchar("delivery_error", { length: 240 }),
    fixture: jsonb("fixture"),
    sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("messages_conversation_idempotency_idx").on(table.conversationId, table.idempotencyKey),
    index("messages_conversation_idx").on(table.conversationId),
    index("messages_workspace_chronology_idx").on(table.workspaceId, table.conversationId, table.sentAt),
  ],
);

export const messageAttempts = pgTable(
  "message_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    messageId: uuid("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
    attemptNumber: integer("attempt_number").notNull(),
    state: messageDeliveryStateEnum("state").notNull(),
    safeError: varchar("safe_error", { length: 240 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("message_attempts_message_number_idx").on(table.messageId, table.attemptNumber),
    index("message_attempts_workspace_idx").on(table.workspaceId, table.createdAt),
  ],
);

export const conversationTags = pgTable(
  "conversation_tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 80 }).notNull(),
    color: varchar("color", { length: 32 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("conversation_tags_workspace_name_idx").on(table.workspaceId, table.name)],
);

export const conversationTagLinks = pgTable(
  "conversation_tag_links",
  {
    conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id").notNull().references(() => conversationTags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.conversationId, table.tagId] })],
);
