"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Inbox, ShieldCheck } from "lucide-react";

import {
  addNoteAction,
  assignConversationAction,
  retryMessageAction,
  sendMessageAction,
  setStatusAction,
  setTagAction,
  setUnreadAction,
  type InboxActionResult,
} from "@/app/inbox/actions";
import { Badge } from "@/components/ui/badge";
import { AccountFilters } from "./account-filters";
import { ConversationList } from "./conversation-list";
import { ConversationToolbar } from "./conversation-toolbar";
import { CustomerContext } from "./customer-context";
import { InboxEmptyState } from "./inbox-empty-state";
import { MessageComposer } from "./message-composer";
import { MessageThread } from "./message-thread";
import type { CurrentInboxUser, InboxData } from "./types";

interface InboxWorkspaceProps {
  data: InboxData;
  currentUser: CurrentInboxUser;
}

export function InboxWorkspace({ data, currentUser }: InboxWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [pending, setPending] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mobileThreadVisible, setMobileThreadVisible] = useState(Boolean(data.selectedId));
  const canTriage = currentUser.role !== "sales";

  function navigate(mutator: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutator(params);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function setFilter(key: string, value?: string) {
    navigate((params) => {
      if (value) params.set(key, value); else params.delete(key);
      if (key !== "conversation") params.delete("conversation");
    });
  }

  function updateSearch(value: string) {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setFilter("q", value.trim() || undefined), 300);
  }

  function selectConversation(id: string) {
    setMobileThreadVisible(true);
    setFilter("conversation", id);
  }

  async function runAction(operation: () => Promise<InboxActionResult>): Promise<boolean> {
    setPending(true);
    setError(null);
    const result = await operation();
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    router.refresh();
    return true;
  }

  async function retry(messageId: string) {
    setRetryingId(messageId);
    await runAction(() => retryMessageAction({ messageId }));
    setRetryingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><div className="flex items-center gap-2"><Inbox className="size-5 text-primary" /><h1 className="text-2xl font-semibold tracking-tight">Unified inbox</h1><Badge variant="secondary">RelayDesk demo</Badge></div><p className="mt-1 text-sm text-muted-foreground">Messenger and Instagram conversations in one fictional workspace.</p></div>
        <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs text-blue-200"><ShieldCheck className="size-4" />No external account connected</div>
      </div>
      {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
      <div className="grid h-[calc(100vh-11.5rem)] min-h-[620px] overflow-hidden rounded-xl border bg-background shadow-xl shadow-black/10 lg:grid-cols-[330px_minmax(0,1fr)] xl:grid-cols-[330px_minmax(0,1fr)_300px]">
        <div className={`${mobileThreadVisible ? "hidden lg:flex" : "flex"} min-h-0 flex-col border-r`}>
          <AccountFilters accounts={data.accounts} users={data.users} tags={data.tags} accountId={searchParams.get("account") ?? undefined} channel={searchParams.get("channel") ?? undefined} search={search} unreadOnly={searchParams.get("unread") === "1"} assignee={searchParams.get("assignee") ?? undefined} tagId={searchParams.get("tag") ?? undefined} onFilter={setFilter} onSearch={updateSearch} />
          <div className="flex items-center justify-between border-b px-3 py-2 text-xs text-muted-foreground"><span>{data.conversations.length} conversations</span><span>{data.conversations.reduce((sum, item) => sum + item.unreadCount, 0)} unread</span></div>
          <ConversationList conversations={data.conversations} selectedId={data.selectedId} onSelect={selectConversation} />
        </div>
        <section className={`${mobileThreadVisible ? "flex" : "hidden lg:flex"} min-h-0 flex-col`}>
          {data.thread ? (
            <>
              <ConversationToolbar thread={data.thread} users={data.users} pending={pending} canTriage={canTriage} onBack={() => setMobileThreadVisible(false)} onAssign={(assigneeId) => void runAction(() => assignConversationAction({ conversationId: data.thread!.id, assigneeId }))} onStatus={(status) => void runAction(() => setStatusAction({ conversationId: data.thread!.id, status }))} onUnread={(unread) => void runAction(() => setUnreadAction({ conversationId: data.thread!.id, unread }))} />
              <MessageThread messages={data.thread.messages} retryingId={retryingId} onRetry={(id) => void retry(id)} />
              <MessageComposer disabled={!data.thread} pending={pending} onSend={(body) => runAction(() => sendMessageAction({ conversationId: data.thread!.id, body, idempotencyKey: crypto.randomUUID() }))} />
            </>
          ) : <InboxEmptyState />}
        </section>
        {data.thread && <CustomerContext thread={data.thread} tags={data.tags} pending={pending} canTriage={canTriage} onTag={(tagId, active) => void runAction(() => setTagAction({ conversationId: data.thread!.id, tagId, active }))} onNote={(body) => runAction(() => addNoteAction({ conversationId: data.thread!.id, body }))} />}
      </div>
    </div>
  );
}
