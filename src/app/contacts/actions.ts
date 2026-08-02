"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSessionContext } from "@/server/auth/session-context";
import type { ActionResult } from "@/server/errors/action-result";
import { translateActionError } from "@/server/errors/translate-action-error";
import {
  archiveContact,
  createContact,
  updateContact,
} from "@/server/services/contact-service";

function inputFromForm(formData: FormData) {
  return {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    jobTitle: formData.get("jobTitle"),
    companyId: formData.get("companyId"),
  };
}

export async function createContactAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  let contactId: string;
  try {
    const contact = await createContact(
      await requireSessionContext(),
      inputFromForm(formData),
    );
    contactId = contact.id;
  } catch (error) {
    return translateActionError(error, { operation: "create contact" });
  }
  revalidatePath("/contacts");
  redirect(`/contacts/${contactId}`);
}

export async function updateContactAction(
  contactId: string,
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await updateContact(
      await requireSessionContext(),
      contactId,
      inputFromForm(formData),
    );
  } catch (error) {
    return translateActionError(error, { operation: "update contact" });
  }
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contactId}`);
  redirect(`/contacts/${contactId}`);
}

export async function setContactArchivedAction(
  contactId: string,
  archived: boolean,
): Promise<void> {
  await archiveContact(await requireSessionContext(), contactId, archived);
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contactId}`);
}
