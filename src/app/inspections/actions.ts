"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSessionContext } from "@/server/auth/session-context";
import type { ActionResult } from "@/server/errors/action-result";
import { translateActionError } from "@/server/errors/translate-action-error";
import { archiveInspection, createInspection, updateInspection } from "@/server/services/inspection-service";

function inputFromForm(formData: FormData) {
  return { title: formData.get("title"), companyId: formData.get("companyId"), primaryContactId: formData.get("primaryContactId"), dealId: formData.get("dealId"), assignedToId: formData.get("assignedToId"), status: formData.get("status"), location: formData.get("location"), notes: formData.get("notes"), scheduledAt: formData.get("scheduledAt") };
}
export async function createInspectionAction(_previous: ActionResult, formData: FormData): Promise<ActionResult> {
  let id: string;
  try { id = (await createInspection(await requireSessionContext(), inputFromForm(formData))).id; }
  catch (error) { return translateActionError(error, { operation: "create inspection" }); }
  revalidatePath("/inspections"); redirect(`/inspections/${id}`);
}
export async function updateInspectionAction(id: string, _previous: ActionResult, formData: FormData): Promise<ActionResult> {
  try { await updateInspection(await requireSessionContext(), id, inputFromForm(formData)); }
  catch (error) { return translateActionError(error, { operation: "update inspection" }); }
  revalidatePath("/inspections"); revalidatePath(`/inspections/${id}`); redirect(`/inspections/${id}`);
}
export async function setInspectionArchivedAction(id: string, archived: boolean): Promise<void> {
  await archiveInspection(await requireSessionContext(), id, archived); revalidatePath("/inspections"); revalidatePath(`/inspections/${id}`);
}
