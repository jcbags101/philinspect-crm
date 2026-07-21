import { Camera, MessageCircle, Search, SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { InboxAccount, InboxTag, InboxUser } from "./types";

interface AccountFiltersProps {
  accounts: InboxAccount[];
  users: InboxUser[];
  tags: InboxTag[];
  accountId?: string;
  channel?: string;
  search: string;
  unreadOnly: boolean;
  assignee?: string;
  tagId?: string;
  onFilter: (key: string, value?: string) => void;
  onSearch: (value: string) => void;
}

export function AccountFilters({ accounts, users, tags, accountId, channel, search, unreadOnly, assignee, tagId, onFilter, onSearch }: AccountFiltersProps) {
  return (
    <section className="space-y-3 border-b p-3" aria-label="Inbox filters">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label="Search conversations" value={search} onChange={(event) => onSearch(event.target.value)} className="pl-9" placeholder="Search conversations" />
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant={!channel ? "secondary" : "ghost"} onClick={() => onFilter("channel")}>All</Button>
        <Button size="sm" variant={channel === "messenger" ? "secondary" : "ghost"} onClick={() => onFilter("channel", "messenger")}><MessageCircle /> Messenger</Button>
        <Button size="sm" variant={channel === "instagram" ? "secondary" : "ghost"} onClick={() => onFilter("channel", "instagram")}><Camera /> Instagram</Button>
      </div>
      <div className="crm-scrollbar flex gap-2 overflow-x-auto pb-1">
        {accounts.filter((account) => !channel || account.channel === channel).map((account) => (
          <button key={account.id} type="button" onClick={() => onFilter("account", accountId === account.id ? undefined : account.id)} className={cn("min-w-44 rounded-lg border p-2 text-left transition-colors hover:bg-muted/60", accountId === account.id && "border-primary bg-primary/10")}>
            <span className="flex items-center justify-between gap-2 text-xs font-medium"><span className="truncate">{account.label}</span>{account.status === "warning" && <span className="size-2 rounded-full bg-amber-400" title={account.syncWarning ?? "Simulated warning"} />}</span>
            <span className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground"><span>{account.handle}</span><Badge variant="outline">{account.unreadCount}</Badge></span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button size="sm" variant={unreadOnly ? "secondary" : "outline"} onClick={() => onFilter("unread", unreadOnly ? undefined : "1")}><SlidersHorizontal /> Unread</Button>
        <select aria-label="Filter by assignee" value={assignee ?? ""} onChange={(event) => onFilter("assignee", event.target.value || undefined)} className="h-8 min-w-0 rounded-lg border border-input bg-background px-2 text-xs">
          <option value="">All assignees</option><option value="unassigned">Unassigned</option>
          {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
        </select>
        <select aria-label="Filter by tag" value={tagId ?? ""} onChange={(event) => onFilter("tag", event.target.value || undefined)} className="h-8 min-w-0 rounded-lg border border-input bg-background px-2 text-xs">
          <option value="">All tags</option>{tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
        </select>
      </div>
    </section>
  );
}
