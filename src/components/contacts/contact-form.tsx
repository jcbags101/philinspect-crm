"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  createContactAction,
  updateContactAction,
} from "@/app/contacts/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/server/errors/action-result";

interface ContactFormProps {
  companies: { id: string; name: string }[];
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    jobTitle: string | null;
    companyId: string | null;
  };
}

const initialState: ActionResult = { ok: true };

export function ContactForm({ companies, contact }: ContactFormProps) {
  const action = contact
    ? updateContactAction.bind(null, contact.id)
    : createContactAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Card className="max-w-3xl">
      <CardContent>
        <form action={formAction} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" name="firstName" defaultValue={contact?.firstName} required maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" defaultValue={contact?.lastName} required maxLength={100} />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={contact?.email ?? ""} maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={contact?.phone ?? ""} maxLength={80} />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job title</Label>
              <Input id="jobTitle" name="jobTitle" defaultValue={contact?.jobTitle ?? ""} maxLength={140} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyId">Company</Label>
              <select
                id="companyId"
                name="companyId"
                defaultValue={contact?.companyId ?? ""}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">No company</option>
                {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
              </select>
            </div>
          </div>
          {!state.ok && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}
          <div className="flex gap-2">
            <Button loading={pending} loadingText="Saving…" type="submit">Save contact</Button>
            <Link className={buttonVariants({ variant: "outline" })} href={contact ? `/contacts/${contact.id}` : "/contacts"}>Cancel</Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
