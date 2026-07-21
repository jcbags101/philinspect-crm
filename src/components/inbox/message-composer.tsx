"use client";

import { useState, type FormEvent } from "react";
import { FileText, Paperclip, Send, ShieldCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MessageComposerProps {
  disabled: boolean;
  pending: boolean;
  onSend: (body: string) => Promise<boolean>;
}

export function MessageComposer({ disabled, pending, onSend }: MessageComposerProps) {
  const [body, setBody] = useState("");
  const [attachment, setAttachment] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = `${body.trim()}${attachment ? "\n\n[Simulated attachment: product-brief.pdf]" : ""}`.trim();
    if (!content) return;
    if (await onSend(content)) {
      setBody("");
      setAttachment(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2 border-t bg-card/50 p-3">
      <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs text-blue-200"><ShieldCheck className="size-4" /><strong>Demo — no external message sent</strong></div>
      {attachment && <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs"><FileText className="size-4" /><span>product-brief.pdf</span><BadgeText /><button type="button" className="ml-auto text-muted-foreground hover:text-foreground" onClick={() => setAttachment(false)} aria-label="Remove simulated attachment"><X className="size-4" /></button></div>}
      <Textarea value={body} onChange={(event) => setBody(event.target.value)} disabled={disabled || pending} maxLength={2000} placeholder="Write a fictional reply…" className="max-h-36 min-h-20 resize-none" />
      <div className="flex items-center justify-between">
        <Button type="button" size="sm" variant="ghost" disabled={disabled || pending || attachment} onClick={() => setAttachment(true)}><Paperclip /> Simulate attachment</Button>
        <Button type="submit" size="sm" disabled={disabled || pending || (!body.trim() && !attachment)}><Send /> {pending ? "Sending…" : "Send demo reply"}</Button>
      </div>
    </form>
  );
}

function BadgeText() {
  return <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">Simulated · 124 KB</span>;
}
