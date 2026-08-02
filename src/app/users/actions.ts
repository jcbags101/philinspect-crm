"use server";

import { revalidatePath } from "next/cache";

import { requireSessionContext } from "@/server/auth/session-context";
import { actionSuccess, type ActionResult } from "@/server/errors/action-result";
import { translateActionError } from "@/server/errors/translate-action-error";
import {
  createWorkspaceInvitation,
  revokeInvitation,
} from "@/server/services/invitation-service";
import { changeWorkspaceMember } from "@/server/services/member-service";

export async function inviteMemberAction(
  _previous: ActionResult<{ invitePath: string }>,
  formData: FormData,
): Promise<ActionResult<{ invitePath: string }>> {
  try {
    const invitation = await createWorkspaceInvitation(
      await requireSessionContext(),
      { email: formData.get("email"), role: formData.get("role") },
    );
    revalidatePath("/users");
    return actionSuccess({ invitePath: `/auth/invite/${invitation.token}` });
  } catch (error) {
    return translateActionError(error, { operation: "invite workspace member" });
  }
}

export async function updateMemberAction(
  membershipId: string,
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  void _previous;
  try {
    await changeWorkspaceMember(
      await requireSessionContext(),
      membershipId,
      { role: formData.get("role"), status: formData.get("status") },
    );
    revalidatePath("/users");
    return actionSuccess();
  } catch (error) {
    return translateActionError(error, { operation: "update workspace member" });
  }
}

export async function revokeInvitationAction(
  invitationId: string,
  _previous: ActionResult,
): Promise<ActionResult> {
  void _previous;
  try {
    await revokeInvitation(await requireSessionContext(), invitationId);
    revalidatePath("/users");
    return actionSuccess();
  } catch (error) {
    return translateActionError(error, { operation: "revoke workspace invitation" });
  }
}
