import { ArrowLeft, CheckCircle2, MailOpen, MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InboxThread, InboxUser } from "./types";

interface ConversationToolbarProps {
  thread: InboxThread;
  users: InboxUser[];
  pending: boolean;
  canTriage: boolean;
  onBack: () => void;
  onAssign: (assigneeId: string | null) => void;
  onStatus: (status: "open" | "pending" | "resolved") => void;
  onUnread: (unread: boolean) => void;
}

export function ConversationToolbar({ thread, users, pending, canTriage, onBack, onAssign, onStatus, onUnread }: ConversationToolbarProps) {
  return (
    <header className="flex min-h-16 items-center gap-3 border-b px-3 py-2">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onBack} aria-label="Back to conversations"><ArrowLeft /></Button>
      <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-semibold">{thread.participantLabel}</h2><p className="truncate text-xs text-muted-foreground">{thread.accountLabel} · {thread.subject}</p></div>
      <Badge variant="outline" className="hidden capitalize sm:inline-flex">{thread.channel}</Badge>
      <select aria-label="Conversation status" value={thread.status} disabled={!canTriage || pending} onChange={(event) => onStatus(event.target.value as "open" | "pending" | "resolved")} className="hidden h-8 rounded-lg border border-input bg-background px-2 text-xs md:block"><option value="open">Open</option><option value="pending">Pending</option><option value="resolved">Resolved</option></select>
      <select aria-label="Assign conversation" value={thread.assigneeId ?? ""} disabled={!canTriage || pending} onChange={(event) => onAssign(event.target.value || null)} className="hidden h-8 max-w-36 rounded-lg border border-input bg-background px-2 text-xs xl:block"><option value="">Unassigned</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select>
      <Button variant="ghost" size="icon" disabled={!canTriage || pending} onClick={() => onUnread(thread.unreadCount === 0)} aria-label={thread.unreadCount ? "Mark read" : "Mark unread"}>{thread.unreadCount ? <MailOpen /> : <CheckCircle2 />}</Button>
      <Button variant="ghost" size="icon" aria-label="More demo actions"><MoreHorizontal /></Button>
    </header>
  );
}
