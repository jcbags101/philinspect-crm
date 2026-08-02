"use client";

import { useActionState } from "react";

import { moveDealStageAction } from "@/app/deals/actions";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/server/errors/action-result";

const initialState: ActionResult = { ok: true };

export function MoveDealStageForm({ dealId, currentStageId, stages }: { dealId: string; currentStageId: string; stages: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState(moveDealStageAction.bind(null, dealId), initialState);
  return (
    <form action={action} className="mt-3 space-y-2 border-t pt-3">
      <select aria-label="Move to stage" className="h-7 w-full rounded-md border border-input bg-transparent px-2 text-xs" name="pipelineStageId" defaultValue={currentStageId}>{stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}</select>
      {!state.ok && <p role="alert" className="text-xs text-destructive">{state.error}</p>}
      <Button className="w-full" size="sm" loading={pending} loadingText="Moving…" type="submit" variant="outline">Move stage</Button>
    </form>
  );
}
