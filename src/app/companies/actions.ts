"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSessionContext } from "@/server/auth/session-context";
import type { ActionResult } from "@/server/errors/action-result";
import { translateActionError } from "@/server/errors/translate-action-error";
import {
  archiveCompany,
  createCompany,
  updateCompany,
} from "@/server/services/company-service";

function inputFromForm(formData: FormData) {
  return {
    name: formData.get("name"),
    domain: formData.get("domain"),
    industry: formData.get("industry"),
  };
}

export async function createCompanyAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  void _previous;
  let companyId: string;
  try {
    const company = await createCompany(
      await requireSessionContext(),
      inputFromForm(formData),
    );
    companyId = company.id;
  } catch (error) {
    return translateActionError(error, { operation: "create company" });
  }
  revalidatePath("/companies");
  redirect(`/companies/${companyId}`);
}

export async function updateCompanyAction(
  companyId: string,
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  void _previous;
  try {
    await updateCompany(
      await requireSessionContext(),
      companyId,
      inputFromForm(formData),
    );
  } catch (error) {
    return translateActionError(error, { operation: "update company" });
  }
  revalidatePath("/companies");
  revalidatePath(`/companies/${companyId}`);
  redirect(`/companies/${companyId}`);
}

export async function setCompanyArchivedAction(
  companyId: string,
  archived: boolean,
): Promise<void> {
  await archiveCompany(await requireSessionContext(), companyId, archived);
  revalidatePath("/companies");
  revalidatePath(`/companies/${companyId}`);
}
