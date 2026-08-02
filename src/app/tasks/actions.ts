"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSessionContext } from "@/server/auth/session-context";
import type { ActionResult } from "@/server/errors/action-result";
import { translateActionError } from "@/server/errors/translate-action-error";
import { archiveTask, createTask, updateTask } from "@/server/services/task-service";

function inputFromForm(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    dueAt: formData.get("dueAt"),
  };
}

export async function createTaskAction(_previous: ActionResult, formData: FormData): Promise<ActionResult> {
  let taskId: string;
  try {
    const task = await createTask(await requireSessionContext(), inputFromForm(formData));
    taskId = task.id;
  } catch (error) {
    return translateActionError(error, { operation: "create task" });
  }
  revalidatePath("/tasks");
  redirect(`/tasks/${taskId}`);
}

export async function updateTaskAction(taskId: string, _previous: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await updateTask(await requireSessionContext(), taskId, inputFromForm(formData));
  } catch (error) {
    return translateActionError(error, { operation: "update task" });
  }
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  redirect(`/tasks/${taskId}`);
}

export async function setTaskArchivedAction(taskId: string, archived: boolean): Promise<void> {
  await archiveTask(await requireSessionContext(), taskId, archived);
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
}
