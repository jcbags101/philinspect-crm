"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createInspectionAction, updateInspectionAction } from "@/app/inspections/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/server/errors/action-result";

interface InspectionFormProps {
  companies: { id: string; name: string }[];
  contacts: { id: string; firstName: string; lastName: string }[];
  deals: { id: string; title: string }[];
  members: { userId: string; name: string }[];
  inspection?: { id: string; title: string; companyId: string; primaryContactId: string | null; dealId: string | null; assignedToId: string | null; status: "draft" | "scheduled" | "in_progress" | "completed" | "cancelled"; location: string | null; notes: string | null; scheduledAt: Date | null };
}
const initialState: ActionResult = { ok: true };
const selectClass = "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";
export function InspectionForm({ companies, contacts, deals, members, inspection }: InspectionFormProps) {
  const [state, action, pending] = useActionState(inspection ? updateInspectionAction.bind(null, inspection.id) : createInspectionAction, initialState);
  const scheduledAt = inspection?.scheduledAt ? new Date(inspection.scheduledAt.getTime() - inspection.scheduledAt.getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : "";
  return <Card className="max-w-4xl"><CardContent><form action={action} className="space-y-5"><div className="space-y-2"><Label htmlFor="title">Inspection title</Label><Input id="title" name="title" defaultValue={inspection?.title} required maxLength={220} /></div><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="companyId">Company</Label><select className={selectClass} id="companyId" name="companyId" defaultValue={inspection?.companyId ?? ""} required><option value="" disabled>Select company</option>{companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><div className="space-y-2"><Label htmlFor="primaryContactId">Primary contact</Label><select className={selectClass} id="primaryContactId" name="primaryContactId" defaultValue={inspection?.primaryContactId ?? ""}><option value="">No contact</option>{contacts.map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName}</option>)}</select></div></div><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="dealId">Related deal</Label><select className={selectClass} id="dealId" name="dealId" defaultValue={inspection?.dealId ?? ""}><option value="">No deal</option>{deals.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div><div className="space-y-2"><Label htmlFor="assignedToId">Assigned inspector</Label><select className={selectClass} id="assignedToId" name="assignedToId" defaultValue={inspection?.assignedToId ?? ""}><option value="">Assign to me</option>{members.map((item) => <option key={item.userId} value={item.userId}>{item.name}</option>)}</select></div></div><div className="grid gap-5 sm:grid-cols-3"><div className="space-y-2"><Label htmlFor="status">Status</Label><select className={selectClass} id="status" name="status" defaultValue={inspection?.status ?? "draft"}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div><div className="space-y-2"><Label htmlFor="scheduledAt">Schedule</Label><Input id="scheduledAt" name="scheduledAt" type="datetime-local" defaultValue={scheduledAt} /></div><div className="space-y-2"><Label htmlFor="location">Location</Label><Input id="location" name="location" defaultValue={inspection?.location ?? ""} maxLength={300} /></div></div><div className="space-y-2"><Label htmlFor="notes">Inspection notes</Label><Textarea id="notes" name="notes" defaultValue={inspection?.notes ?? ""} rows={7} maxLength={10000} /></div>{!state.ok && <p role="alert" className="text-sm text-destructive">{state.error}</p>}<div className="flex gap-2"><Button loading={pending} loadingText="Saving…" type="submit">Save inspection</Button><Link className={buttonVariants({ variant: "outline" })} href={inspection ? `/inspections/${inspection.id}` : "/inspections"}>Cancel</Link></div></form></CardContent></Card>;
}
