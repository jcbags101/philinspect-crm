"use server";

import { redirect } from "next/navigation";

import { requireAuthenticatedIdentity } from "@/server/auth/session-context";
import { actionSuccess, type ActionResult } from "@/server/errors/action-result";
import { translateActionError } from "@/server/errors/translate-action-error";
import { acceptWorkspaceInvitation } from "@/server/services/invitation-service";

export async function acceptInvitationAction(
  token: string,
  _previous: ActionResult,
): Promise<ActionResult> {
  void _previous;
  try {
    const identity = await requireAuthenticatedIdentity();
    await acceptWorkspaceInvitation(identity, token);
  } catch (error) {
    return translateActionError(error, { operation: "accept workspace invitation" });
  }

  redirect("/");
  return actionSuccess();
}
