"use client";

import { useActionState } from "react";

import { convertLeadAction } from "@/app/leads/actions";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/server/errors/action-result";

const initialState: ActionResult = { ok: true };

export function ConvertLeadButton({ leadId }: { leadId: string }) {
  const [state, action, pending] = useActionState(
    convertLeadAction.bind(null, leadId),
    initialState,
  );
  return (
    <form action={action} className="flex items-center gap-2">
      {!state.ok && <span role="alert" className="text-xs text-destructive">{state.error}</span>}
      <Button loading={pending} loadingText="Converting…" type="submit">Convert to deal</Button>
    </form>
  );
}
