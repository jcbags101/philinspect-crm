import Link from "next/link";
import { notFound } from "next/navigation";

import { setTaskArchivedAction } from "@/app/tasks/actions";
import { EntityArchiveAction } from "@/components/entity-archive-action";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSessionContext } from "@/server/auth/session-context";
import { NotFoundError } from "@/server/errors/domain-error";
import { getTask } from "@/server/services/task-service";

const label = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
interface TaskPageProps { params: Promise<{ taskId: string }> }
export default async function TaskPage({ params }: TaskPageProps) {
  const { taskId } = await params;
  const context = await requireSessionContext();
  const task = await getTask(context, taskId).catch((error) => { if (error instanceof NotFoundError) notFound(); throw error; });
  const archiveAction = setTaskArchivedAction.bind(null, task.id, !task.deletedAt);
  return <><PageHeader eyebrow="Tasks" title={task.title} description={`${label(task.priority)} priority · ${label(task.status)}`} actions={<><Link className={buttonVariants({ variant: "outline" })} href={`/tasks/${task.id}/edit`}>Edit</Link><EntityArchiveAction action={archiveAction} archived={Boolean(task.deletedAt)} entityLabel={task.title} /></>} /><Card className="max-w-3xl"><CardHeader><CardTitle>Task details</CardTitle></CardHeader><CardContent><p className="mb-6 whitespace-pre-wrap text-sm text-muted-foreground">{task.description || "No description."}</p><dl className="grid gap-5 sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">Status</dt><dd className="mt-1 text-sm">{label(task.status)}</dd></div><div><dt className="text-xs text-muted-foreground">Priority</dt><dd className="mt-1 text-sm">{label(task.priority)}</dd></div><div><dt className="text-xs text-muted-foreground">Due</dt><dd className="mt-1 text-sm">{task.dueAt?.toLocaleString("en-PH") ?? "—"}</dd></div><div><dt className="text-xs text-muted-foreground">Completed</dt><dd className="mt-1 text-sm">{task.completedAt?.toLocaleString("en-PH") ?? "—"}</dd></div></dl></CardContent></Card></>;
}
