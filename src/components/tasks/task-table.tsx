import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const label = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
interface TaskRow { id: string; title: string; status: string; priority: string; assignedToName: string | null; dueAt: Date | null; deletedAt: Date | null }

export function TaskTable({ tasks }: { tasks: TaskRow[] }) {
  return <Card className="overflow-hidden p-0"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground"><th className="px-4 py-3">Task</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Assignee</th><th className="px-4 py-3">Due</th></tr></thead><tbody>{tasks.map((task) => <tr className="border-b last:border-0 hover:bg-muted/20" key={task.id}><td className="px-4 py-3"><Link className="font-medium hover:text-primary hover:underline" href={`/tasks/${task.id}`}>{task.title}</Link>{task.deletedAt && <div className="text-xs text-destructive">Archived</div>}</td><td className="px-4 py-3"><Badge variant="outline">{label(task.status)}</Badge></td><td className="px-4 py-3"><Badge variant="outline">{label(task.priority)}</Badge></td><td className="px-4 py-3 text-muted-foreground">{task.assignedToName ?? "Unassigned"}</td><td className="px-4 py-3 text-muted-foreground">{task.dueAt?.toLocaleString("en-PH") ?? "—"}</td></tr>)}{tasks.length === 0 && <tr><td className="px-4 py-10 text-center text-muted-foreground" colSpan={5}>No tasks found.</td></tr>}</tbody></table></div></Card>;
}
