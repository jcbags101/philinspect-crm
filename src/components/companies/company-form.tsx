"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  createCompanyAction,
  updateCompanyAction,
} from "@/app/companies/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/server/errors/action-result";

interface CompanyFormProps {
  company?: { id: string; name: string; domain: string | null; industry: string | null };
}

const initialState: ActionResult = { ok: true };

export function CompanyForm({ company }: CompanyFormProps) {
  const action = company
    ? updateCompanyAction.bind(null, company.id)
    : createCompanyAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Card className="max-w-2xl">
      <CardContent>
        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Company name</Label>
            <Input id="name" name="name" defaultValue={company?.name} required maxLength={180} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="domain">Website/domain</Label>
              <Input id="domain" name="domain" defaultValue={company?.domain ?? ""} maxLength={255} placeholder="example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" name="industry" defaultValue={company?.industry ?? ""} maxLength={140} />
            </div>
          </div>
          {!state.ok && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
          <div className="flex gap-2">
            <Button loading={pending} loadingText="Saving…" type="submit">Save company</Button>
            <Link className={buttonVariants({ variant: "outline" })} href={company ? `/companies/${company.id}` : "/companies"}>Cancel</Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
