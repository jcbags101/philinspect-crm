"use client";

import { useActionState } from "react";

import { updateMemberAction } from "@/app/users/actions";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/server/errors/action-result";

const initialState: ActionResult = { ok: true };

export function MemberEditor({ membershipId, role, status }: { membershipId: string; role: "account_manager" | "sales" | "admin"; status: "active" | "suspended" }) {
  const [state, action, pending] = useActionState(updateMemberAction.bind(null, membershipId), initialState);
  return (
    <form action={action} className="flex min-w-[360px] items-center justify-end gap-2">
      <select aria-label="Member role" className="h-7 rounded-md border border-input bg-transparent px-2 text-xs" name="role" defaultValue={role}><option value="sales">Sales</option><option value="account_manager">Account Manager</option><option value="admin">Admin</option></select>
      <select aria-label="Member status" className="h-7 rounded-md border border-input bg-transparent px-2 text-xs" name="status" defaultValue={status}><option value="active">Active</option><option value="suspended">Suspended</option></select>
      <Button loading={pending} loadingText="Saving…" size="sm" type="submit" variant="outline">Save</Button>
      {!state.ok && <span role="alert" className="max-w-40 text-xs text-destructive">{state.error}</span>}
    </form>
  );
}
