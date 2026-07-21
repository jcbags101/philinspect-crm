"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { PermissionDeniedError } from "@/server/auth/permissions";
import { requireSessionContext } from "@/server/auth/session-context";
import {
  addInternalNote,
  assignConversation,
  InboxNotFoundError,
  retryDemoMessage,
  sendDemoMessage,
  setConversationStatus,
  setConversationTag,
  setConversationUnread,
} from "@/server/services/inbox-service";

export type InboxActionResult = { ok: true } | { ok: false; error: string };

async function execute(operation: () => Promise<unknown>): Promise<InboxActionResult> {
  try {
    await operation();
    revalidatePath("/inbox");
    return { ok: true };
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: error.issues[0]?.message ?? "Invalid input." };
    if (error instanceof PermissionDeniedError || error instanceof InboxNotFoundError) return { ok: false, error: error.message };
    console.error("Inbox demo action failed", error instanceof Error ? error.name : "UnknownError");
    return { ok: false, error: "The demo action could not be completed. Please try again." };
  }
}

export async function sendMessageAction(input: { conversationId: string; body: string; idempotencyKey: string }) {
  return execute(async () => sendDemoMessage(await requireSessionContext(), input));
}

export async function retryMessageAction(input: { messageId: string }) {
  return execute(async () => retryDemoMessage(await requireSessionContext(), input));
}

export async function assignConversationAction(input: { conversationId: string; assigneeId: string | null }) {
  return execute(async () => assignConversation(await requireSessionContext(), input));
}

export async function setStatusAction(input: { conversationId: string; status: "open" | "pending" | "resolved" }) {
  return execute(async () => setConversationStatus(await requireSessionContext(), input));
}

export async function setUnreadAction(input: { conversationId: string; unread: boolean }) {
  return execute(async () => setConversationUnread(await requireSessionContext(), input));
}

export async function setTagAction(input: { conversationId: string; tagId: string; active: boolean }) {
  return execute(async () => setConversationTag(await requireSessionContext(), input));
}

export async function addNoteAction(input: { conversationId: string; body: string }) {
  return execute(async () => addInternalNote(await requireSessionContext(), input));
}
