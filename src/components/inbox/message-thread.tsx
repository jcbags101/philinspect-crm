import { MessageBubble } from "./message-bubble";
import type { InboxMessage } from "./types";

interface MessageThreadProps {
  messages: InboxMessage[];
  retryingId: string | null;
  onRetry: (messageId: string) => void;
}

export function MessageThread({ messages, retryingId, onRetry }: MessageThreadProps) {
  return (
    <div className="crm-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(59,130,246,.06),transparent_45%)] p-4" aria-live="polite">
      <div className="mx-auto w-fit rounded-full border bg-background/70 px-3 py-1 text-[11px] text-muted-foreground">Fictional conversation history</div>
      {messages.map((message) => <MessageBubble key={message.id} message={message} retrying={retryingId === message.id} onRetry={onRetry} />)}
    </div>
  );
}
