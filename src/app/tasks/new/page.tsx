import { PageHeader } from "@/components/page-header";
import { TaskForm } from "@/components/tasks/task-form";
import { requirePagePermission } from "@/server/auth/page-authorization";
import { requireSessionContext } from "@/server/auth/session-context";

export default async function NewTaskPage() {
  const context = await requireSessionContext();
  requirePagePermission(context.role, "tasks:write");
  return <><PageHeader eyebrow="Tasks" title="New task" description="Create a follow-up for yourself." /><TaskForm /></>;
}
