import { ConversationRow } from "./conversation-row";
import { InboxEmptyState } from "./inbox-empty-state";
import type { InboxConversation } from "./types";

interface ConversationListProps {
  conversations: InboxConversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  if (!conversations.length) return <InboxEmptyState filtered />;
  return (
    <div className="crm-scrollbar min-h-0 flex-1 overflow-y-auto" aria-label="Conversations">
      {conversations.map((conversation) => <ConversationRow key={conversation.id} conversation={conversation} selected={conversation.id === selectedId} onSelect={onSelect} />)}
    </div>
  );
}
