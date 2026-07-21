import type { getInboxWorkspace } from "@/server/services/inbox-service";

export type InboxData = Awaited<ReturnType<typeof getInboxWorkspace>>;
export type InboxAccount = InboxData["accounts"][number];
export type InboxConversation = InboxData["conversations"][number];
export type InboxThread = NonNullable<InboxData["thread"]>;
export type InboxMessage = InboxThread["messages"][number];
export type InboxUser = InboxData["users"][number];
export type InboxTag = InboxData["tags"][number];

export interface CurrentInboxUser {
  id: string;
  name: string;
  role: "account_manager" | "sales" | "admin";
}
