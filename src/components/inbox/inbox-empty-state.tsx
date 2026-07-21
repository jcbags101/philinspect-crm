import { MessagesSquare } from "lucide-react";

export function InboxEmptyState({ filtered = false }: { filtered?: boolean }) {
  return (
    <div className="grid h-full min-h-72 place-items-center p-8 text-center">
      <div className="max-w-xs space-y-3">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground"><MessagesSquare /></div>
        <h2 className="font-semibold">{filtered ? "No matching conversations" : "Select a conversation"}</h2>
        <p className="text-sm text-muted-foreground">{filtered ? "Try removing a filter or using another search term." : "Choose a fictional Messenger or Instagram thread to view its history."}</p>
      </div>
    </div>
  );
}
