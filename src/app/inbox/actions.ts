"use server";

import { revalidatePath } from "next/cache";

import { requireSessionContext } from "@/server/auth/session-context";
import {
  actionSuccess,
  type ActionResult,
} from "@/server/errors/action-result";
import { translateActionError } from "@/server/errors/translate-action-error";
import {
  addInternalNote,
  assignConversation,
  retryDemoMessage,
  sendDemoMessage,
  setConversationStatus,
  setConversationTag,
  setConversationUnread,
} from "@/server/services/inbox-service";

export type InboxActionResult = ActionResult;

async function execute(
  operationName: string,
  operation: () => Promise<unknown>,
): Promise<InboxActionResult> {
  try {
    await operation();
    revalidatePath("/inbox");
    return actionSuccess();
  } catch (error) {
    return translateActionError(error, { operation: operationName });
  }
}

export async function sendMessageAction(input: { conversationId: string; body: string; idempotencyKey: string }) {
  return execute("send demo message", async () => sendDemoMessage(await requireSessionContext(), input));
}

export async function retryMessageAction(input: { messageId: string }) {
  return execute("retry demo message", async () => retryDemoMessage(await requireSessionContext(), input));
}

export async function assignConversationAction(input: { conversationId: string; assigneeId: string | null }) {
  return execute("assign conversation", async () => assignConversation(await requireSessionContext(), input));
}

export async function setStatusAction(input: { conversationId: string; status: "open" | "pending" | "resolved" }) {
  return execute("set conversation status", async () => setConversationStatus(await requireSessionContext(), input));
}

export async function setUnreadAction(input: { conversationId: string; unread: boolean }) {
  return execute("set conversation unread", async () => setConversationUnread(await requireSessionContext(), input));
}

export async function setTagAction(input: { conversationId: string; tagId: string; active: boolean }) {
  return execute("set conversation tag", async () => setConversationTag(await requireSessionContext(), input));
}

export async function addNoteAction(input: { conversationId: string; body: string }) {
  return execute("add conversation note", async () => addInternalNote(await requireSessionContext(), input));
}
