import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({ label, value, detail, icon: Icon, tone = "blue" }: { label: string; value: string; detail: string; icon: LucideIcon; tone?: "blue" | "emerald" | "amber" | "violet" }) {
  const tones = { blue: "bg-blue-500/10 text-blue-400", emerald: "bg-emerald-500/10 text-emerald-400", amber: "bg-amber-500/10 text-amber-400", violet: "bg-violet-500/10 text-violet-400" };
  return <Card className="border-border/60 bg-card/75 shadow-none"><CardContent className="flex items-start justify-between p-5"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div><div className={`rounded-xl p-2.5 ${tones[tone]}`}><Icon className="size-5" /></div></CardContent></Card>;
}
