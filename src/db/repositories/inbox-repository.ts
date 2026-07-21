import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  brands,
  conversationTagLinks,
  conversationTags,
  conversations,
  messageAttempts,
  messages,
  messagingAccounts,
  users,
} from "@/db/schema";
import type { DatabaseTransaction } from "./workspace-repository";

export interface ConversationFilters {
  accountId?: string;
  channel?: "messenger" | "instagram";
  search?: string;
  unreadOnly?: boolean;
  assigneeId?: string;
  unassignedOnly?: boolean;
  tagId?: string;
}

export async function listMessagingAccounts(workspaceId: string) {
  const db = getDb();
  return db
    .select({
      id: messagingAccounts.id,
      channel: messagingAccounts.channel,
      label: messagingAccounts.label,
      handle: messagingAccounts.handle,
      status: messagingAccounts.status,
      syncWarning: messagingAccounts.syncWarning,
      lastSyncedAt: messagingAccounts.lastSyncedAt,
      conversationCount: sql<number>`count(${conversations.id})::int`,
      unreadCount: sql<number>`coalesce(sum(${conversations.unreadCount}), 0)::int`,
    })
    .from(messagingAccounts)
    .leftJoin(
      conversations,
      and(eq(conversations.messagingAccountId, messagingAccounts.id), eq(conversations.workspaceId, workspaceId)),
    )
    .where(eq(messagingAccounts.workspaceId, workspaceId))
    .groupBy(messagingAccounts.id)
    .orderBy(messagingAccounts.channel, messagingAccounts.label);
}

export async function listWorkspaceUsers(workspaceId: string) {
  return getDb()
    .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.workspaceId, workspaceId))
    .orderBy(users.name);
}

export async function listWorkspaceTags(workspaceId: string) {
  return getDb()
    .select({ id: conversationTags.id, name: conversationTags.name, color: conversationTags.color })
    .from(conversationTags)
    .where(eq(conversationTags.workspaceId, workspaceId))
    .orderBy(conversationTags.name);
}

export async function listInboxConversations(workspaceId: string, filters: ConversationFilters) {
  const conditions = [eq(conversations.workspaceId, workspaceId)];
  if (filters.accountId) conditions.push(eq(conversations.messagingAccountId, filters.accountId));
  if (filters.channel) conditions.push(eq(messagingAccounts.channel, filters.channel));
  if (filters.unreadOnly) conditions.push(sql`${conversations.unreadCount} > 0`);
  if (filters.assigneeId) conditions.push(eq(conversations.assigneeId, filters.assigneeId));
  if (filters.unassignedOnly) conditions.push(sql`${conversations.assigneeId} is null`);
  if (filters.search) {
    const term = `%${filters.search.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
    conditions.push(
      or(
        ilike(conversations.participantLabel, term),
        ilike(conversations.subject, term),
        ilike(conversations.lastMessagePreview, term),
      )!,
    );
  }
  if (filters.tagId) {
    conditions.push(sql`exists (
      select 1 from ${conversationTagLinks}
      where ${conversationTagLinks.conversationId} = ${conversations.id}
      and ${conversationTagLinks.tagId} = ${filters.tagId}
    )`);
  }

  const rows = await getDb()
    .select({
      id: conversations.id,
      participantLabel: conversations.participantLabel,
      participantHandle: conversations.participantHandle,
      subject: conversations.subject,
      status: conversations.status,
      unreadCount: conversations.unreadCount,
      lastMessagePreview: conversations.lastMessagePreview,
      lastMessageAt: conversations.lastMessageAt,
      accountId: messagingAccounts.id,
      accountLabel: messagingAccounts.label,
      channel: messagingAccounts.channel,
      assigneeId: users.id,
      assigneeName: users.name,
      brandId: brands.id,
      brandName: brands.name,
    })
    .from(conversations)
    .innerJoin(messagingAccounts, eq(conversations.messagingAccountId, messagingAccounts.id))
    .leftJoin(users, eq(conversations.assigneeId, users.id))
    .leftJoin(brands, eq(conversations.brandId, brands.id))
    .where(and(...conditions))
    .orderBy(desc(conversations.lastMessageAt))
    .limit(100);

  if (!rows.length) return [];
  const links = await getDb()
    .select({ conversationId: conversationTagLinks.conversationId, id: conversationTags.id, name: conversationTags.name, color: conversationTags.color })
    .from(conversationTagLinks)
    .innerJoin(conversationTags, eq(conversationTagLinks.tagId, conversationTags.id))
    .where(and(eq(conversationTags.workspaceId, workspaceId), inArray(conversationTagLinks.conversationId, rows.map((row) => row.id))));
  return rows.map((row) => ({ ...row, tags: links.filter((tag) => tag.conversationId === row.id) }));
}

export async function getConversationThread(workspaceId: string, conversationId: string) {
  const db = getDb();
  const [conversation] = await db
    .select({
      id: conversations.id,
      providerConversationId: conversations.providerConversationId,
      participantLabel: conversations.participantLabel,
      participantHandle: conversations.participantHandle,
      subject: conversations.subject,
      status: conversations.status,
      unreadCount: conversations.unreadCount,
      assigneeId: conversations.assigneeId,
      accountId: messagingAccounts.id,
      accountLabel: messagingAccounts.label,
      accountExternalId: messagingAccounts.fictionalExternalAccountId,
      channel: messagingAccounts.channel,
      brandId: brands.id,
      brandName: brands.name,
      brandDomain: brands.domain,
      brandIndustry: brands.industry,
    })
    .from(conversations)
    .innerJoin(messagingAccounts, eq(conversations.messagingAccountId, messagingAccounts.id))
    .leftJoin(brands, eq(conversations.brandId, brands.id))
    .where(and(eq(conversations.workspaceId, workspaceId), eq(conversations.id, conversationId)))
    .limit(1);
  if (!conversation) return null;

  const [messageRows, tagRows] = await Promise.all([
    db
      .select({
        id: messages.id,
        senderUserId: messages.senderUserId,
        senderLabel: messages.senderLabel,
        direction: messages.direction,
        body: messages.body,
        deliveryState: messages.deliveryState,
        deliveryError: messages.deliveryError,
        sentAt: messages.sentAt,
      })
      .from(messages)
      .where(and(eq(messages.workspaceId, workspaceId), eq(messages.conversationId, conversationId)))
      .orderBy(asc(messages.sentAt)),
    db
      .select({ id: conversationTags.id, name: conversationTags.name, color: conversationTags.color })
      .from(conversationTagLinks)
      .innerJoin(conversationTags, eq(conversationTagLinks.tagId, conversationTags.id))
      .where(and(eq(conversationTags.workspaceId, workspaceId), eq(conversationTagLinks.conversationId, conversationId))),
  ]);
  return { ...conversation, messages: messageRows, tags: tagRows };
}

export async function findConversationForMutation(
  tx: DatabaseTransaction,
  workspaceId: string,
  conversationId: string,
) {
  const [row] = await tx
    .select({
      id: conversations.id,
      participantLabel: conversations.participantLabel,
      providerConversationId: conversations.providerConversationId,
      accountExternalId: messagingAccounts.fictionalExternalAccountId,
      fixture: messagingAccounts.fixture,
    })
    .from(conversations)
    .innerJoin(messagingAccounts, eq(conversations.messagingAccountId, messagingAccounts.id))
    .where(and(eq(conversations.workspaceId, workspaceId), eq(conversations.id, conversationId)))
    .limit(1);
  return row ?? null;
}

export async function insertQueuedMessage(
  tx: DatabaseTransaction,
  input: { workspaceId: string; conversationId: string; senderUserId: string; senderLabel: string; body: string; idempotencyKey: string },
) {
  await tx.insert(messages).values({
    workspaceId: input.workspaceId,
    conversationId: input.conversationId,
    senderUserId: input.senderUserId,
    senderLabel: input.senderLabel,
    direction: "outbound",
    body: input.body,
    deliveryState: "queued",
    idempotencyKey: input.idempotencyKey,
    fixture: { simulated: true },
  }).onConflictDoNothing({ target: [messages.conversationId, messages.idempotencyKey] });

  const [message] = await tx
    .select()
    .from(messages)
    .where(and(eq(messages.conversationId, input.conversationId), eq(messages.idempotencyKey, input.idempotencyKey)))
    .limit(1);
  if (!message) throw new Error("Message could not be queued.");
  return message;
}

export async function getFailedMessageForRetry(tx: DatabaseTransaction, workspaceId: string, messageId: string) {
  const [row] = await tx
    .select({
      id: messages.id,
      body: messages.body,
      conversationId: messages.conversationId,
      deliveryState: messages.deliveryState,
      providerConversationId: conversations.providerConversationId,
      accountExternalId: messagingAccounts.fictionalExternalAccountId,
      attemptCount: sql<number>`(select count(*)::int from ${messageAttempts} where ${messageAttempts.messageId} = ${messages.id})`,
    })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .innerJoin(messagingAccounts, eq(conversations.messagingAccountId, messagingAccounts.id))
    .where(and(eq(messages.workspaceId, workspaceId), eq(messages.id, messageId)))
    .limit(1);
  return row ?? null;
}

export async function persistDeliveryOutcome(
  tx: DatabaseTransaction,
  input: {
    workspaceId: string;
    messageId: string;
    conversationId: string;
    attemptNumber: number;
    state: "sent" | "delivered" | "read" | "failed";
    providerMessageId: string | null;
    safeError: string | null;
    inboundResponse: { body: string; providerMessageId: string } | null;
    participantLabel: string;
  },
) {
  const now = new Date();
  await tx.update(messages).set({
    deliveryState: input.state,
    providerMessageId: input.providerMessageId,
    deliveryError: input.safeError,
    updatedAt: now,
  }).where(and(eq(messages.workspaceId, input.workspaceId), eq(messages.id, input.messageId)));
  await tx.insert(messageAttempts).values({
    workspaceId: input.workspaceId,
    messageId: input.messageId,
    attemptNumber: input.attemptNumber,
    state: input.state,
    safeError: input.safeError,
  }).onConflictDoNothing({ target: [messageAttempts.messageId, messageAttempts.attemptNumber] });

  let preview = input.safeError ? "Message failed · retry available" : "You sent a fictional demo message.";
  if (input.inboundResponse) {
    await tx.insert(messages).values({
      workspaceId: input.workspaceId,
      conversationId: input.conversationId,
      senderLabel: input.participantLabel,
      direction: "inbound",
      body: input.inboundResponse.body,
      deliveryState: "delivered",
      providerMessageId: input.inboundResponse.providerMessageId,
      idempotencyKey: `auto:${input.messageId}`,
      fixture: { simulated: true, scenario: "auto_reply" },
      sentAt: new Date(now.getTime() + 1),
    }).onConflictDoNothing({ target: [messages.conversationId, messages.idempotencyKey] });
    preview = input.inboundResponse.body;
  }
  await tx.update(conversations).set({ lastMessageAt: now, lastMessagePreview: preview, updatedAt: now }).where(and(eq(conversations.workspaceId, input.workspaceId), eq(conversations.id, input.conversationId)));
}

export async function updateConversationAssignment(tx: DatabaseTransaction, workspaceId: string, conversationId: string, assigneeId: string | null) {
  if (assigneeId) {
    const [assignee] = await tx.select({ id: users.id }).from(users).where(and(eq(users.workspaceId, workspaceId), eq(users.id, assigneeId))).limit(1);
    if (!assignee) return false;
  }
  const [updated] = await tx.update(conversations).set({ assigneeId, updatedAt: new Date() }).where(and(eq(conversations.workspaceId, workspaceId), eq(conversations.id, conversationId))).returning({ id: conversations.id });
  return Boolean(updated);
}

export async function updateConversationStatus(tx: DatabaseTransaction, workspaceId: string, conversationId: string, status: "open" | "pending" | "resolved") {
  const [updated] = await tx.update(conversations).set({ status, updatedAt: new Date() }).where(and(eq(conversations.workspaceId, workspaceId), eq(conversations.id, conversationId))).returning({ id: conversations.id });
  return Boolean(updated);
}

export async function updateConversationUnread(tx: DatabaseTransaction, workspaceId: string, conversationId: string, unread: boolean) {
  const [updated] = await tx.update(conversations).set({ unreadCount: unread ? 1 : 0, unreadAt: unread ? new Date() : null, updatedAt: new Date() }).where(and(eq(conversations.workspaceId, workspaceId), eq(conversations.id, conversationId))).returning({ id: conversations.id });
  return Boolean(updated);
}

export async function updateConversationTag(tx: DatabaseTransaction, workspaceId: string, conversationId: string, tagId: string, active: boolean) {
  const [tag] = await tx.select({ id: conversationTags.id }).from(conversationTags).where(and(eq(conversationTags.workspaceId, workspaceId), eq(conversationTags.id, tagId))).limit(1);
  const conversation = await findConversationForMutation(tx, workspaceId, conversationId);
  if (!tag || !conversation) return false;
  if (active) await tx.insert(conversationTagLinks).values({ conversationId, tagId }).onConflictDoNothing();
  else await tx.delete(conversationTagLinks).where(and(eq(conversationTagLinks.conversationId, conversationId), eq(conversationTagLinks.tagId, tagId)));
  return true;
}

export async function insertInternalNote(tx: DatabaseTransaction, input: { workspaceId: string; conversationId: string; userId: string; userName: string; body: string }) {
  const conversation = await findConversationForMutation(tx, input.workspaceId, input.conversationId);
  if (!conversation) return false;
  await tx.insert(messages).values({
    workspaceId: input.workspaceId,
    conversationId: input.conversationId,
    senderUserId: input.userId,
    senderLabel: `Internal note · ${input.userName}`,
    direction: "internal",
    body: input.body,
    deliveryState: "delivered",
    fixture: { simulated: true, internal: true },
  });
  await tx.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, input.conversationId));
  return true;
}
