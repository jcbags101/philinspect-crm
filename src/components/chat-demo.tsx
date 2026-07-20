"use client";

import { FormEvent, useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const suggestions = ["Summarize today’s pipeline", "Which leads need follow-up?", "Show deals at risk"];

export function ChatDemo() {
  const [messages, setMessages] = useState([{ role: "assistant", text: "Hi Ari — I can help you explore the fictional CRM data. Ask about pipeline, leads, or upcoming meetings." }]);
  const [input, setInput] = useState("");
  function send(event?: FormEvent, preset?: string) {
    event?.preventDefault(); const text = preset ?? input.trim(); if (!text) return;
    setMessages((current) => [...current, { role: "user", text }, { role: "assistant", text: "In this POC, I found 163 active deal records and 400 leads. The live assistant workflow is represented with deterministic demo responses." }]); setInput("");
  }
  return <><PageHeader title="CRM Copilot" description="Ask questions across your customer and sales workspace." />
    <Card className="mx-auto flex min-h-[650px] max-w-4xl flex-col overflow-hidden border-border/60 bg-card/75 p-0 shadow-none"><div className="flex items-center gap-3 border-b border-border/60 p-4"><div className="grid size-9 place-items-center rounded-xl bg-blue-500/10 text-blue-400"><Bot className="size-5" /></div><div><p className="text-sm font-medium">Symph Assistant</p><p className="text-xs text-emerald-400">Ready · demo mode</p></div></div><div className="crm-scrollbar flex-1 space-y-5 overflow-y-auto p-5 sm:p-8">{messages.map((message, index) => <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-primary text-primary-foreground" : "border border-border/60 bg-muted/40"}`}>{message.text}</div></div>)}</div><div className="border-t border-border/60 p-4"><div className="mb-3 flex flex-wrap gap-2">{suggestions.map((item) => <Button key={item} variant="outline" size="sm" onClick={() => send(undefined, item)}><Sparkles />{item}</Button>)}</div><form className="flex gap-2" onSubmit={(e) => send(e)}><Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask your CRM…" className="h-10" /><Button size="icon-lg" aria-label="Send"><Send /></Button></form></div></Card></>;
}
