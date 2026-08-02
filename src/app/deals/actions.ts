"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSessionContext } from "@/server/auth/session-context";
import type { ActionResult } from "@/server/errors/action-result";
import { translateActionError } from "@/server/errors/translate-action-error";
import {
  archiveDeal,
  createDeal,
  moveDealStage,
  updateDeal,
} from "@/server/services/deal-service";

function inputFromForm(formData: FormData) {
  return {
    title: formData.get("title"),
    companyId: formData.get("companyId"),
    primaryContactId: formData.get("primaryContactId"),
    pipelineStageId: formData.get("pipelineStageId"),
    kind: formData.get("kind"),
    value: formData.get("value"),
    currency: formData.get("currency"),
    probability: formData.get("probability"),
    expectedCloseAt: formData.get("expectedCloseAt"),
  };
}

export async function createDealAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  let dealId: string;
  try {
    const deal = await createDeal(
      await requireSessionContext(),
      inputFromForm(formData),
    );
    dealId = deal.id;
  } catch (error) {
    return translateActionError(error, { operation: "create deal" });
  }
  revalidatePath("/deals");
  redirect(`/deals/${dealId}`);
}

export async function updateDealAction(
  dealId: string,
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await updateDeal(
      await requireSessionContext(),
      dealId,
      inputFromForm(formData),
    );
  } catch (error) {
    return translateActionError(error, { operation: "update deal" });
  }
  revalidatePath("/deals");
  revalidatePath(`/deals/${dealId}`);
  redirect(`/deals/${dealId}`);
}

export async function moveDealStageAction(
  dealId: string,
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await moveDealStage(await requireSessionContext(), dealId, {
      pipelineStageId: formData.get("pipelineStageId"),
    });
  } catch (error) {
    return translateActionError(error, { operation: "move deal stage" });
  }
  revalidatePath("/deals");
  revalidatePath(`/deals/${dealId}`);
  return { ok: true };
}

export async function setDealArchivedAction(
  dealId: string,
  archived: boolean,
): Promise<void> {
  await archiveDeal(await requireSessionContext(), dealId, archived);
  revalidatePath("/deals");
  revalidatePath(`/deals/${dealId}`);
}
