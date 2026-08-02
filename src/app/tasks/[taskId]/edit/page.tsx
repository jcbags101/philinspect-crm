import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { TaskForm } from "@/components/tasks/task-form";
import { assertPermission } from "@/server/auth/permissions";
import { requireSessionContext } from "@/server/auth/session-context";
import { NotFoundError } from "@/server/errors/domain-error";
import { getTask } from "@/server/services/task-service";

interface EditTaskPageProps { params: Promise<{ taskId: string }> }
export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const { taskId } = await params;
  const context = await requireSessionContext();
  assertPermission(context.role, "tasks:write");
  const task = await getTask(context, taskId).catch((error) => { if (error instanceof NotFoundError) notFound(); throw error; });
  return <><PageHeader eyebrow="Tasks" title={`Edit ${task.title}`} /><TaskForm task={task} /></>;
}
