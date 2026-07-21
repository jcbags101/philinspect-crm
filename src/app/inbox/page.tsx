import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { InboxWorkspace } from "@/components/inbox/inbox-workspace";
import { getSessionContext } from "@/server/auth/session-context";
import { getInboxWorkspace } from "@/server/services/inbox-service";

export const metadata: Metadata = { title: "Unified inbox" };
export const dynamic = "force-dynamic";

interface InboxPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function scalar(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const context = await getSessionContext();
  if (!context) redirect("/auth/sign-in");
  const params = await searchParams;
  const assignee = scalar(params.assignee);
  const data = await getInboxWorkspace(
    context,
    {
      accountId: scalar(params.account),
      channel: scalar(params.channel) === "instagram" ? "instagram" : scalar(params.channel) === "messenger" ? "messenger" : undefined,
      search: scalar(params.q),
      unreadOnly: scalar(params.unread) === "1",
      assigneeId: assignee && assignee !== "unassigned" ? assignee : undefined,
      unassignedOnly: assignee === "unassigned",
      tagId: scalar(params.tag),
    },
    scalar(params.conversation),
  );

  return <InboxWorkspace data={data} currentUser={{ id: context.userId, name: context.name, role: context.role }} />;
}
