import { z } from "zod";

export const conversationIdSchema = z.string().uuid();
export const sendMessageSchema = z.object({
  conversationId: conversationIdSchema,
  body: z.string().trim().min(1, "Write a message first.").max(2_000),
  idempotencyKey: z.string().min(8).max(180),
});
export const retryMessageSchema = z.object({ messageId: z.string().uuid() });
export const assignmentSchema = z.object({
  conversationId: conversationIdSchema,
  assigneeId: z.string().uuid().nullable(),
});
export const statusSchema = z.object({
  conversationId: conversationIdSchema,
  status: z.enum(["open", "pending", "resolved"]),
});
export const unreadSchema = z.object({
  conversationId: conversationIdSchema,
  unread: z.boolean(),
});
export const tagSchema = z.object({
  conversationId: conversationIdSchema,
  tagId: z.string().uuid(),
  active: z.boolean(),
});
export const noteSchema = z.object({
  conversationId: conversationIdSchema,
  body: z.string().trim().min(1, "Write a note first.").max(2_000),
});
