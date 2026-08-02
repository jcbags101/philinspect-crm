"use client";

import { useActionState } from "react";

import { revokeInvitationAction } from "@/app/users/actions";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/server/errors/action-result";

const initialState: ActionResult = { ok: true };

export function InvitationRowAction({ invitationId }: { invitationId: string }) {
  const [state, action, pending] = useActionState(revokeInvitationAction.bind(null, invitationId), initialState);
  return <form action={action} className="flex items-center justify-end gap-2"><Button loading={pending} loadingText="Revoking…" size="sm" type="submit" variant="outline">Revoke</Button>{!state.ok && <span role="alert" className="text-xs text-destructive">{state.error}</span>}</form>;
}
