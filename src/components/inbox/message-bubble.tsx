import { AlertCircle, Check, CheckCheck, Clock3, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InboxMessage } from "./types";

interface MessageBubbleProps {
  message: InboxMessage;
  retrying: boolean;
  onRetry: (messageId: string) => void;
}

function DeliveryIcon({ state }: { state: InboxMessage["deliveryState"] }) {
  if (state === "queued") return <Clock3 className="size-3" />;
  if (state === "sent") return <Check className="size-3" />;
  if (state === "delivered" || state === "read") return <CheckCheck className={cn("size-3", state === "read" && "text-blue-400")} />;
  return <AlertCircle className="size-3 text-destructive" />;
}

export function MessageBubble({ message, retrying, onRetry }: MessageBubbleProps) {
  const inbound = message.direction === "inbound";
  const internal = message.direction === "internal";
  const time = new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit" }).format(new Date(message.sentAt));
  return (
    <article className={cn("flex", inbound ? "justify-start" : "justify-end")}>
      <div className={cn("max-w-[82%] space-y-1", internal && "w-full max-w-full")}>
        <div className={cn(
          "rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
          inbound && "rounded-bl-md border bg-card",
          !inbound && !internal && "rounded-br-md bg-primary text-primary-foreground",
          internal && "border border-amber-500/30 bg-amber-500/10 text-amber-100",
        )}>
          {internal && <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-amber-400">Internal note</p>}
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
        </div>
        <div className={cn("flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground", !inbound && "justify-end")}>
          <span>{message.senderLabel}</span><span>·</span><time dateTime={message.sentAt}>{time}</time>
          {!inbound && !internal && <><DeliveryIcon state={message.deliveryState} /><span className="capitalize">{message.deliveryState}</span></>}
        </div>
        {message.deliveryState === "failed" && (
          <div className="flex items-center justify-end gap-2 text-xs text-destructive">
            <span>{message.deliveryError}</span>
            <Button size="sm" variant="outline" disabled={retrying} onClick={() => onRetry(message.id)}><RotateCcw /> Retry</Button>
          </div>
        )}
      </div>
    </article>
  );
}
