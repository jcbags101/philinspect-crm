"use client";

import Link from "next/link";
import { useActionState } from "react";

import { createTaskAction, updateTaskAction } from "@/app/tasks/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/server/errors/action-result";

interface TaskFormProps {
  task?: {
    id: string;
    title: string;
    description: string | null;
    status: "open" | "in_progress" | "completed" | "cancelled";
    priority: "low" | "medium" | "high" | "urgent";
    dueAt: Date | null;
  };
}

const initialState: ActionResult = { ok: true };
const selectClass = "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function TaskForm({ task }: TaskFormProps) {
  const action = task ? updateTaskAction.bind(null, task.id) : createTaskAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const dueAt = task?.dueAt ? new Date(task.dueAt.getTime() - task.dueAt.getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : "";
  return <Card className="max-w-3xl"><CardContent><form action={formAction} className="space-y-5"><div className="space-y-2"><Label htmlFor="title">Task title</Label><Input id="title" name="title" defaultValue={task?.title} required maxLength={220} /></div><div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" defaultValue={task?.description ?? ""} maxLength={5000} rows={5} /></div><div className="grid gap-5 sm:grid-cols-3"><div className="space-y-2"><Label htmlFor="status">Status</Label><select className={selectClass} id="status" name="status" defaultValue={task?.status ?? "open"}><option value="open">Open</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div><div className="space-y-2"><Label htmlFor="priority">Priority</Label><select className={selectClass} id="priority" name="priority" defaultValue={task?.priority ?? "medium"}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></div><div className="space-y-2"><Label htmlFor="dueAt">Due</Label><Input id="dueAt" name="dueAt" type="datetime-local" defaultValue={dueAt} /></div></div>{!state.ok && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}<div className="flex gap-2"><Button loading={pending} loadingText="Saving…" type="submit">Save task</Button><Link className={buttonVariants({ variant: "outline" })} href={task ? `/tasks/${task.id}` : "/tasks"}>Cancel</Link></div></form></CardContent></Card>;
}
