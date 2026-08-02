import { getDb } from "@/db/client";
import {
  findConversationForMutation,
  getConversationThread,
  getFailedMessageForRetry,
  insertInternalNote,
  insertQueuedMessage,
  listInboxConversations,
  listMessagingAccounts,
  listWorkspaceTags,
  listWorkspaceUsers,
  persistDeliveryOutcome,
  updateConversationAssignment,
  updateConversationStatus,
  updateConversationTag,
  updateConversationUnread,
  type ConversationFilters,
} from "@/db/repositories/inbox-repository";
import { messagingAdapter, type MockScenario } from "@/integrations/messaging";
import { assertPermission } from "@/server/auth/permissions";
import type { SessionContext } from "@/server/auth/session-context";
import { NotFoundError } from "@/server/errors/domain-error";
import {
  assignmentSchema,
  noteSchema,
  retryMessageSchema,
  sendMessageSchema,
  statusSchema,
  tagSchema,
  unreadSchema,
} from "@/server/validation/inbox";
import { recordInboxAudit } from "./audit-service";

export class InboxNotFoundError extends NotFoundError {
  constructor() {
    super("The conversation could not be found.");
    this.name = "InboxNotFoundError";
  }
}

function scenarioFor(providerConversationId: string): MockScenario {
  if (providerConversationId.endsWith("004")) return "fail_once";
  if (providerConversationId.endsWith("002")) return "delivered_only";
  if (providerConversationId.endsWith("001")) return "auto_reply";
  return "success";
}

function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export async function getInboxWorkspace(
  context: SessionContext,
  filters: ConversationFilters,
  selectedConversationId?: string,
) {
  assertPermission(context.role, "inbox:read");
  const [accounts, conversationRows, users, tags] = await Promise.all([
    listMessagingAccounts(context.workspaceId),
    listInboxConversations(context.workspaceId, filters),
    listWorkspaceUsers(context.workspaceId),
    listWorkspaceTags(context.workspaceId),
  ]);
  const selectedId = selectedConversationId && conversationRows.some((row) => row.id === selectedConversationId)
    ? selectedConversationId
    : conversationRows[0]?.id;
  const thread = selectedId ? await getConversationThread(context.workspaceId, selectedId) : null;

  return {
    accounts: accounts.map((account) => ({ ...account, lastSyncedAt: iso(account.lastSyncedAt) })),
    conversations: conversationRows.map((conversation) => ({ ...conversation, lastMessageAt: conversation.lastMessageAt.toISOString() })),
    users,
    tags,
    selectedId: selectedId ?? null,
    thread: thread
      ? {
          ...thread,
          messages: thread.messages.map((message) => ({ ...message, sentAt: message.sentAt.toISOString() })),
        }
      : null,
  };
}

export async function sendDemoMessage(context: SessionContext, unsafeInput: unknown) {
  assertPermission(context.role, "inbox:send");
  const input = sendMessageSchema.parse(unsafeInput);
  const db = getDb();

  const queued = await db.transaction(async (tx) => {
    const conversation = await findConversationForMutation(tx, context.workspaceId, input.conversationId);
    if (!conversation) throw new InboxNotFoundError();
    const message = await insertQueuedMessage(tx, {
      workspaceId: context.workspaceId,
      conversationId: input.conversationId,
      senderUserId: context.userId,
      senderLabel: context.name,
      body: input.body,
      idempotencyKey: input.idempotencyKey,
    });
    if (message.deliveryState === "queued") {
      await recordInboxAudit(tx, {
        workspaceId: context.workspaceId,
        actorId: context.userId,
        entityType: "message",
        entityId: message.id,
        action: "sent",
        label: "Queued a fictional demo message",
        after: { conversationId: input.conversationId, simulated: true },
      });
    }
    return { conversation, message };
  });

  if (queued.message.deliveryState !== "queued") {
    return getConversationThread(context.workspaceId, input.conversationId);
  }

  const outcome = await messagingAdapter.send({
    messageId: queued.message.id,
    accountExternalId: queued.conversation.accountExternalId,
    providerConversationId: queued.conversation.providerConversationId,
    body: queued.message.body,
    attemptNumber: 1,
    scenario: scenarioFor(queued.conversation.providerConversationId),
  });

  await db.transaction(async (tx) => {
    await persistDeliveryOutcome(tx, {
      workspaceId: context.workspaceId,
      messageId: queued.message.id,
      conversationId: input.conversationId,
      attemptNumber: 1,
      ...outcome,
      participantLabel: queued.conversation.participantLabel,
    });
    await recordInboxAudit(tx, {
      workspaceId: context.workspaceId,
      actorId: context.userId,
      entityType: "message",
      entityId: queued.message.id,
      action: "status",
      label: outcome.state === "failed" ? "Demo message delivery failed safely" : "Demo message delivery advanced",
      after: { state: outcome.state, simulated: true },
    });
  });
  return getConversationThread(context.workspaceId, input.conversationId);
}

export async function retryDemoMessage(context: SessionContext, unsafeInput: unknown) {
  assertPermission(context.role, "inbox:send");
  const input = retryMessageSchema.parse(unsafeInput);
  const db = getDb();
  const message = await db.transaction((tx) => getFailedMessageForRetry(tx, context.workspaceId, input.messageId));
  if (!message || message.deliveryState !== "failed") throw new InboxNotFoundError();

  const outcome = await messagingAdapter.send({
    messageId: message.id,
    accountExternalId: message.accountExternalId,
    providerConversationId: message.providerConversationId,
    body: message.body,
    attemptNumber: message.attemptCount + 1,
    scenario: scenarioFor(message.providerConversationId),
  });
  await db.transaction(async (tx) => {
    const conversation = await findConversationForMutation(tx, context.workspaceId, message.conversationId);
    if (!conversation) throw new InboxNotFoundError();
    await persistDeliveryOutcome(tx, {
      workspaceId: context.workspaceId,
      messageId: message.id,
      conversationId: message.conversationId,
      attemptNumber: message.attemptCount + 1,
      ...outcome,
      participantLabel: conversation.participantLabel,
    });
    await recordInboxAudit(tx, {
      workspaceId: context.workspaceId,
      actorId: context.userId,
      entityType: "message",
      entityId: message.id,
      action: "retried",
      label: "Retried a fictional demo message",
      after: { state: outcome.state, simulated: true },
    });
  });
}

async function mutateConversation(
  context: SessionContext,
  action: "assigned" | "status" | "read_status" | "tagged" | "noted",
  conversationId: string,
  label: string,
  mutation: Parameters<ReturnType<typeof getDb>["transaction"]>[0],
) {
  assertPermission(context.role, "inbox:triage");
  const db = getDb();
  await db.transaction(async (tx) => {
    await mutation(tx);
    await recordInboxAudit(tx, {
      workspaceId: context.workspaceId,
      actorId: context.userId,
      entityType: "conversation",
      entityId: conversationId,
      action,
      label,
      after: { simulated: true },
    });
  });
}

export async function assignConversation(context: SessionContext, unsafeInput: unknown) {
  const input = assignmentSchema.parse(unsafeInput);
  await mutateConversation(context, "assigned", input.conversationId, "Changed the demo conversation assignment", async (tx) => {
    if (!await updateConversationAssignment(tx, context.workspaceId, input.conversationId, input.assigneeId)) throw new InboxNotFoundError();
  });
}

export async function setConversationStatus(context: SessionContext, unsafeInput: unknown) {
  const input = statusSchema.parse(unsafeInput);
  await mutateConversation(context, "status", input.conversationId, "Changed the demo conversation status", async (tx) => {
    if (!await updateConversationStatus(tx, context.workspaceId, input.conversationId, input.status)) throw new InboxNotFoundError();
  });
}

export async function setConversationUnread(context: SessionContext, unsafeInput: unknown) {
  const input = unreadSchema.parse(unsafeInput);
  await mutateConversation(context, "read_status", input.conversationId, "Changed the demo conversation unread state", async (tx) => {
    if (!await updateConversationUnread(tx, context.workspaceId, input.conversationId, input.unread)) throw new InboxNotFoundError();
  });
}

export async function setConversationTag(context: SessionContext, unsafeInput: unknown) {
  const input = tagSchema.parse(unsafeInput);
  await mutateConversation(context, "tagged", input.conversationId, "Changed a demo conversation tag", async (tx) => {
    if (!await updateConversationTag(tx, context.workspaceId, input.conversationId, input.tagId, input.active)) throw new InboxNotFoundError();
  });
}

export async function addInternalNote(context: SessionContext, unsafeInput: unknown) {
  const input = noteSchema.parse(unsafeInput);
  await mutateConversation(context, "noted", input.conversationId, "Added an internal demo note", async (tx) => {
    if (!await insertInternalNote(tx, { workspaceId: context.workspaceId, conversationId: input.conversationId, userId: context.userId, userName: context.name, body: input.body })) throw new InboxNotFoundError();
  });
}
