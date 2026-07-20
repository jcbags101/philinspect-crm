"use client";

import { useMemo, useState } from "react";
import { Download, Plus, Search, SlidersHorizontal } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type RecordColumn = { key: string; label: string; align?: "left" | "right"; badge?: boolean };
export type RecordRow = Record<string, string | number | null>;

function badgeTone(value: string) {
  const normalized = value.toLowerCase();
  if (["won", "signed", "approved", "connected", "active", "converted", "done", "paid"].some((x) => normalized.includes(x))) return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  if (["lost", "failed", "deleted", "disconnected"].some((x) => normalized.includes(x))) return "border-red-500/20 bg-red-500/10 text-red-300";
  if (["pending", "follow", "draft", "parked", "contact"].some((x) => normalized.includes(x))) return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  return "border-blue-500/20 bg-blue-500/10 text-blue-300";
}

export function RecordsView({ title, description, noun, columns, rows, compact = false }: { title: string; description: string; noun: string; columns: RecordColumn[]; rows: RecordRow[]; compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? rows.filter((row) => Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(needle))) : rows;
  }, [query, rows]);

  function demoNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2400);
  }

  return <>
    <PageHeader title={title} description={description} actions={<Button onClick={() => demoNotice(`${noun} creation is available in the full demo flow.`)}><Plus /> New {noun}</Button>} />
    {notice && <div className="fixed right-5 top-20 z-50 rounded-lg border border-blue-500/20 bg-blue-950/95 px-4 py-3 text-sm text-blue-100 shadow-2xl">{notice}</div>}
    <Card className="overflow-hidden border-border/60 bg-card/75 py-0 shadow-none">
      <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder={`Search ${title.toLowerCase()}…`} /></div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => demoNotice("Filters are ready for a connected workflow.")}><SlidersHorizontal /> Filter</Button><Button variant="outline" onClick={() => demoNotice("A sample export was prepared for this demo.")}><Download /> Export</Button></div>
      </div>
      <div className="crm-scrollbar overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead><tr className="border-b border-border/60 bg-muted/20">{columns.map((column) => <th key={column.key} className={`px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground ${column.align === "right" ? "text-right" : "text-left"}`}>{column.label}</th>)}</tr></thead>
          <tbody>{filtered.map((row, index) => <tr key={String(row.id ?? index)} className="border-b border-border/40 transition-colors last:border-0 hover:bg-muted/30">{columns.map((column, columnIndex) => {
            const value = row[column.key];
            return <td key={column.key} className={`px-5 ${compact ? "py-2.5" : "py-4"} ${columnIndex === 0 ? "font-medium text-foreground" : "text-muted-foreground"} ${column.align === "right" ? "text-right font-mono" : "text-left"}`}>{column.badge && value ? <Badge variant="outline" className={badgeTone(String(value))}>{String(value).replaceAll("_", " ")}</Badge> : String(value ?? "—")}</td>;
          })}</tr>)}</tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-border/60 px-5 py-3 text-xs text-muted-foreground"><span>Showing {filtered.length} of {rows.length} demo records</span><span>Neon · fictional data</span></div>
    </Card>
  </>;
}
