"use client";

import Link from "next/link";
import { useActionState } from "react";

import { acceptInvitationAction } from "@/app/auth/invite/[token]/actions";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/server/errors/action-result";

const initialState: ActionResult = { ok: true };

export function InvitationAcceptForm({ token }: { token: string }) {
  const action = acceptInvitationAction.bind(null, token);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-3">
      {!state.ok && (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {state.error}
        </p>
      )}
      <Button className="w-full" loading={pending} loadingText="Accepting invitation…" type="submit">
        Accept invitation
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Not signed in with the invited email?{" "}
        <Link className="text-primary hover:underline" href="/auth/sign-in">
          Sign in first
        </Link>
      </p>
    </form>
  );
}
