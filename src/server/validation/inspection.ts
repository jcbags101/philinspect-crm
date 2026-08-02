import { z } from "zod";

export const inspectionStatuses = [
  "draft",
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export const inspectionInputSchema = z.object({
  title: z.string().trim().min(2, "Inspection title must be at least 2 characters.").max(220),
  companyId: z.uuid("Select a valid company."),
  primaryContactId: z.uuid("Select a valid contact.").optional().or(z.literal("")),
  dealId: z.uuid("Select a valid deal.").optional().or(z.literal("")),
  assignedToId: z.uuid("Select a valid assignee.").optional().or(z.literal("")),
  status: z.enum(inspectionStatuses),
  location: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(10_000).optional().or(z.literal("")),
  scheduledAt: z.string().trim().refine(
    (value) => value === "" || !Number.isNaN(new Date(value).getTime()),
    { message: "Enter a valid inspection schedule." },
  ),
});
