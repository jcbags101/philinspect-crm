"use client";

import { useState, type FormEvent } from "react";
import { Building2, FileText, Tag, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { InboxTag, InboxThread } from "./types";

interface CustomerContextProps {
  thread: InboxThread;
  tags: InboxTag[];
  pending: boolean;
  canTriage: boolean;
  onTag: (tagId: string, active: boolean) => void;
  onNote: (body: string) => Promise<boolean>;
}

export function CustomerContext({ thread, tags, pending, canTriage, onTag, onNote }: CustomerContextProps) {
  const [note, setNote] = useState("");

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!note.trim()) return;
    if (await onNote(note.trim())) setNote("");
  }

  return (
    <aside className="crm-scrollbar hidden min-h-0 overflow-y-auto border-l bg-card/30 xl:block">
      <div className="space-y-5 p-4">
        <section><div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><UserRound className="size-4" /> Contact</div><div className="rounded-xl border bg-card p-3"><p className="font-medium">{thread.participantLabel}</p><p className="mt-1 text-xs text-muted-foreground">{thread.participantHandle || "Messenger customer"}</p><p className="mt-3 text-xs text-muted-foreground">Provider ID</p><p className="truncate font-mono text-[11px]">{thread.providerConversationId}</p></div></section>
        <section><div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><Building2 className="size-4" /> Related CRM record</div><div className="rounded-xl border bg-card p-3"><p className="font-medium">{thread.brandName || "Unlinked fictional brand"}</p><p className="mt-1 text-xs text-muted-foreground">{thread.brandIndustry || "No industry"}</p><p className="mt-2 text-xs text-primary">{thread.brandDomain || "No website"}</p></div></section>
        <section><div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><Tag className="size-4" /> Tags</div><div className="flex flex-wrap gap-2">{tags.map((tag) => { const active = thread.tags.some((item) => item.id === tag.id); return <button key={tag.id} type="button" disabled={!canTriage || pending} onClick={() => onTag(tag.id, !active)}><Badge variant={active ? "default" : "outline"}>{tag.name}</Badge></button>; })}</div></section>
        <section><div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><FileText className="size-4" /> Internal note</div><form className="space-y-2" onSubmit={submitNote}><Textarea value={note} onChange={(event) => setNote(event.target.value)} disabled={!canTriage || pending} placeholder="Visible only to your demo team" /><Button className="w-full" size="sm" type="submit" variant="secondary" disabled={!canTriage || pending || !note.trim()}>Add internal note</Button></form></section>
      </div>
    </aside>
  );
}
