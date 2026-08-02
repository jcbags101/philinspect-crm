"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSessionContext } from "@/server/auth/session-context";
import type { ActionResult } from "@/server/errors/action-result";
import { translateActionError } from "@/server/errors/translate-action-error";
import {
  archiveLead,
  convertLead,
  createLead,
  updateLead,
} from "@/server/services/lead-service";

function inputFromForm(formData: FormData) {
  return {
    name: formData.get("name"),
    companyName: formData.get("companyName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    industry: formData.get("industry"),
    segment: formData.get("segment"),
    status: formData.get("status"),
    companyId: formData.get("companyId"),
    contactId: formData.get("contactId"),
  };
}

export async function createLeadAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  let leadId: string;
  try {
    const lead = await createLead(
      await requireSessionContext(),
      inputFromForm(formData),
    );
    leadId = lead.id;
  } catch (error) {
    return translateActionError(error, { operation: "create lead" });
  }
  revalidatePath("/leads");
  redirect(`/leads/${leadId}`);
}

export async function updateLeadAction(
  leadId: string,
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await updateLead(
      await requireSessionContext(),
      leadId,
      inputFromForm(formData),
    );
  } catch (error) {
    return translateActionError(error, { operation: "update lead" });
  }
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  redirect(`/leads/${leadId}`);
}

export async function setLeadArchivedAction(
  leadId: string,
  archived: boolean,
  _previous: ActionResult,
): Promise<ActionResult> {
  void _previous;
  try {
    await archiveLead(await requireSessionContext(), leadId, archived);
  } catch (error) {
    return translateActionError(error, { operation: archived ? "archive lead" : "restore lead" });
  }
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

export async function convertLeadAction(
  leadId: string,
  _previous: ActionResult,
): Promise<ActionResult> {
  void _previous;
  try {
    await convertLead(await requireSessionContext(), leadId);
  } catch (error) {
    return translateActionError(error, { operation: "convert lead" });
  }
  revalidatePath("/leads");
  revalidatePath("/deals");
  redirect("/deals");
}
