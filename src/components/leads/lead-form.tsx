"use client";

import Link from "next/link";
import { useActionState } from "react";

import { createLeadAction, updateLeadAction } from "@/app/leads/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/server/errors/action-result";

interface LeadFormProps {
  companies: { id: string; name: string }[];
  contacts: { id: string; firstName: string; lastName: string; companyId: string | null }[];
  lead?: {
    id: string;
    name: string;
    companyName: string;
    email: string | null;
    phone: string | null;
    industry: string | null;
    segment: "idea_rich_founder" | "sme_going_digital" | "corporate_innovator" | "ph_startup_scaleup";
    status: "new" | "to_contact" | "followed_up" | "converted" | "archived";
    companyId: string | null;
    contactId: string | null;
  };
}

const initialState: ActionResult = { ok: true };
const selectClass = "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function LeadForm({ companies, contacts, lead }: LeadFormProps) {
  const action = lead ? updateLeadAction.bind(null, lead.id) : createLeadAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Card className="max-w-3xl">
      <CardContent>
        <form action={formAction} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="name">Contact name</Label><Input id="name" name="name" defaultValue={lead?.name} required maxLength={160} /></div>
            <div className="space-y-2"><Label htmlFor="companyName">Company name</Label><Input id="companyName" name="companyName" defaultValue={lead?.companyName} required maxLength={180} /></div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" defaultValue={lead?.email ?? ""} maxLength={255} /></div>
            <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" type="tel" defaultValue={lead?.phone ?? ""} maxLength={80} /></div>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-2"><Label htmlFor="industry">Industry</Label><Input id="industry" name="industry" defaultValue={lead?.industry ?? ""} maxLength={140} /></div>
            <div className="space-y-2">
              <Label htmlFor="segment">Segment</Label>
              <select className={selectClass} id="segment" name="segment" defaultValue={lead?.segment ?? "sme_going_digital"}>
                <option value="idea_rich_founder">Idea-rich founder</option>
                <option value="sme_going_digital">SME going digital</option>
                <option value="corporate_innovator">Corporate innovator</option>
                <option value="ph_startup_scaleup">PH startup / scaleup</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select className={selectClass} id="status" name="status" defaultValue={lead?.status === "converted" || lead?.status === "archived" ? "new" : lead?.status ?? "new"}>
                <option value="new">New</option>
                <option value="to_contact">To contact</option>
                <option value="followed_up">Followed up</option>
              </select>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyId">Linked company</Label>
              <select className={selectClass} id="companyId" name="companyId" defaultValue={lead?.companyId ?? ""}>
                <option value="">Create when converted</option>
                {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactId">Linked contact</Label>
              <select className={selectClass} id="contactId" name="contactId" defaultValue={lead?.contactId ?? ""}>
                <option value="">Create when converted</option>
                {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.firstName} {contact.lastName}</option>)}
              </select>
            </div>
          </div>
          {!state.ok && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
          <div className="flex gap-2">
            <Button loading={pending} loadingText="Saving…" type="submit">Save lead</Button>
            <Link className={buttonVariants({ variant: "outline" })} href={lead ? `/leads/${lead.id}` : "/leads"}>Cancel</Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
