"use client";

import Link from "next/link";
import { useActionState } from "react";

import { createDealAction, updateDealAction } from "@/app/deals/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/server/errors/action-result";

interface DealFormProps {
  companies: { id: string; name: string }[];
  contacts: { id: string; firstName: string; lastName: string }[];
  stages: { id: string; label: string }[];
  deal?: {
    id: string;
    title: string;
    companyId: string;
    primaryContactId: string | null;
    pipelineStageId: string;
    kind: "product" | "service" | "reseller";
    value: string | null;
    currency: string;
    probability: number;
    expectedCloseAt: Date | null;
  };
}

const initialState: ActionResult = { ok: true };
const selectClass = "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function DealForm({ companies, contacts, stages, deal }: DealFormProps) {
  const action = deal ? updateDealAction.bind(null, deal.id) : createDealAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  return (
    <Card className="max-w-3xl">
      <CardContent>
        <form action={formAction} className="space-y-5">
          <div className="space-y-2"><Label htmlFor="title">Deal title</Label><Input id="title" name="title" defaultValue={deal?.title} required maxLength={220} /></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="companyId">Company</Label><select className={selectClass} id="companyId" name="companyId" defaultValue={deal?.companyId ?? ""} required><option value="" disabled>Select company</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></div>
            <div className="space-y-2"><Label htmlFor="primaryContactId">Primary contact</Label><select className={selectClass} id="primaryContactId" name="primaryContactId" defaultValue={deal?.primaryContactId ?? ""}><option value="">No primary contact</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.firstName} {contact.lastName}</option>)}</select></div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="pipelineStageId">Pipeline stage</Label><select className={selectClass} id="pipelineStageId" name="pipelineStageId" defaultValue={deal?.pipelineStageId ?? stages[0]?.id ?? ""} required>{stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}</select></div>
            <div className="space-y-2"><Label htmlFor="kind">Deal type</Label><select className={selectClass} id="kind" name="kind" defaultValue={deal?.kind ?? "service"}><option value="product">Product</option><option value="service">Service</option><option value="reseller">Reseller</option></select></div>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-2"><Label htmlFor="value">Value</Label><Input id="value" name="value" type="number" min="0" step="0.01" defaultValue={deal?.value ?? ""} /></div>
            <div className="space-y-2"><Label htmlFor="currency">Currency</Label><Input id="currency" name="currency" defaultValue={deal?.currency ?? "PHP"} required minLength={3} maxLength={3} /></div>
            <div className="space-y-2"><Label htmlFor="probability">Probability (%)</Label><Input id="probability" name="probability" type="number" min="0" max="100" defaultValue={deal?.probability ?? 10} required /></div>
          </div>
          <div className="max-w-xs space-y-2"><Label htmlFor="expectedCloseAt">Expected close date</Label><Input id="expectedCloseAt" name="expectedCloseAt" type="date" defaultValue={deal?.expectedCloseAt?.toISOString().slice(0, 10) ?? ""} /></div>
          {!state.ok && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
          <div className="flex gap-2"><Button loading={pending} loadingText="Saving…" type="submit">Save deal</Button><Link className={buttonVariants({ variant: "outline" })} href={deal ? `/deals/${deal.id}` : "/deals"}>Cancel</Link></div>
        </form>
      </CardContent>
    </Card>
  );
}
