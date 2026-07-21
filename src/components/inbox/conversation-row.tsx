import { Camera, MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InboxConversation } from "./types";

interface ConversationRowProps {
  conversation: InboxConversation;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function ConversationRow({ conversation, selected, onSelect }: ConversationRowProps) {
  const time = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(new Date(conversation.lastMessageAt));
  return (
    <button type="button" onClick={() => onSelect(conversation.id)} className={cn("w-full border-b px-3 py-3 text-left transition-colors hover:bg-muted/50", selected && "bg-primary/10 shadow-[inset_3px_0_0_hsl(var(--primary))]")}>
      <span className="flex items-start gap-3">
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-full text-white", conversation.channel === "messenger" ? "bg-blue-600" : "bg-gradient-to-br from-fuchsia-500 to-orange-400")}>
          {conversation.channel === "messenger" ? <MessageCircle className="size-4" /> : <Camera className="size-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2"><span className={cn("truncate text-sm", conversation.unreadCount > 0 && "font-semibold")}>{conversation.participantLabel}</span><time className="shrink-0 text-[10px] text-muted-foreground" dateTime={conversation.lastMessageAt}>{time}</time></span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{conversation.lastMessagePreview || conversation.subject}</span>
          <span className="mt-2 flex items-center gap-1.5 overflow-hidden">
            <Badge variant="outline" className="capitalize">{conversation.status}</Badge>
            {conversation.tags.slice(0, 1).map((tag) => <Badge key={tag.id} variant="secondary">{tag.name}</Badge>)}
            {conversation.unreadCount > 0 && <Badge className="ml-auto">{conversation.unreadCount}</Badge>}
          </span>
        </span>
      </span>
    </button>
  );
}
