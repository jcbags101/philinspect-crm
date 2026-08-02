"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/server/errors/action-result";

const initialState: ActionResult = { ok: true };

interface EntityArchiveActionProps {
  action: (previous: ActionResult) => Promise<ActionResult>;
  archived: boolean;
  entityLabel: string;
}

export function EntityArchiveAction({
  action,
  archived,
  entityLabel,
}: EntityArchiveActionProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const verb = archived ? "Restore" : "Archive";

  return (
    <form action={formAction} className="flex flex-wrap items-center justify-end gap-2">
      {!state.ok && (
        <span className="max-w-64 text-right text-xs text-destructive" role="alert">
          {state.error}
        </span>
      )}
      <Button
        aria-label={`${verb} ${entityLabel}`}
        loading={pending}
        loadingText={archived ? "Restoring…" : "Archiving…"}
        type="submit"
        variant={archived ? "outline" : "destructive"}
      >
        {verb}
      </Button>
    </form>
  );
}
