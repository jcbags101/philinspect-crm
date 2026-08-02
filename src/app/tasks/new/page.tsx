import { PageHeader } from "@/components/page-header";
import { TaskForm } from "@/components/tasks/task-form";
import { assertPermission } from "@/server/auth/permissions";
import { requireSessionContext } from "@/server/auth/session-context";

export default async function NewTaskPage() {
  const context = await requireSessionContext();
  assertPermission(context.role, "tasks:write");
  return <><PageHeader eyebrow="Tasks" title="New task" description="Create a follow-up for yourself." /><TaskForm /></>;
}
