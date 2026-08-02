import { Plus } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { TaskTable } from "@/components/tasks/task-table";
import { buttonVariants } from "@/components/ui/button";
import { requireSessionContext } from "@/server/auth/session-context";
import { getTasks } from "@/server/services/task-service";

export const dynamic = "force-dynamic";
export default async function TasksPage() {
  const context = await requireSessionContext();
  const tasks = await getTasks(context, { includeArchived: true });
  return <><PageHeader title="Tasks" description="Plan follow-ups and keep CRM work moving." actions={<Link className={buttonVariants()} href="/tasks/new"><Plus />New task</Link>} /><TaskTable tasks={tasks} /></>;
}
