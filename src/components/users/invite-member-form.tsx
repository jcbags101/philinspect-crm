"use client";

import { useActionState, useState } from "react";

import { inviteMemberAction } from "@/app/users/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/server/errors/action-result";

const initialState: ActionResult<{ invitePath: string }> = { ok: true, data: { invitePath: "" } };

export function InviteMemberForm() {
  const [state, action, pending] = useActionState(inviteMemberAction, initialState);
  const [copied, setCopied] = useState(false);
  const invitePath = state.ok ? state.data.invitePath : "";

  async function copyInvite() {
    if (!invitePath) return;
    await navigator.clipboard.writeText(`${window.location.origin}${invitePath}`);
    setCopied(true);
  }

  return (
    <Card>
      <CardHeader><CardTitle>Invite a member</CardTitle></CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 sm:grid-cols-[1fr_190px_auto] sm:items-end">
          <div className="space-y-2"><Label htmlFor="invite-email">Email</Label><Input id="invite-email" name="email" type="email" placeholder="teammate@example.com" required /></div>
          <div className="space-y-2"><Label htmlFor="invite-role">Role</Label><select id="invite-role" name="role" defaultValue="sales" className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"><option value="sales">Sales</option><option value="account_manager">Account Manager</option><option value="admin">Admin</option></select></div>
          <Button loading={pending} loadingText="Creating…" type="submit">Create invite</Button>
        </form>
        {!state.ok && <p role="alert" className="mt-3 text-sm text-destructive">{state.error}</p>}
        {invitePath && (
          <div className="mt-4 rounded-lg border bg-muted/20 p-3">
            <p className="text-xs font-medium">Invitation created</p>
            <p className="mt-1 break-all text-xs text-muted-foreground">{invitePath}</p>
            <Button className="mt-3" onClick={() => void copyInvite()} size="sm" type="button" variant="outline">{copied ? "Copied" : "Copy full link"}</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
