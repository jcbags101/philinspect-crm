import { z } from "zod";

export const leadStatuses = [
  "new",
  "to_contact",
  "followed_up",
  "converted",
  "archived",
] as const;

export const leadSegments = [
  "idea_rich_founder",
  "sme_going_digital",
  "corporate_innovator",
  "ph_startup_scaleup",
] as const;

export const leadInputSchema = z.object({
  name: z.string().trim().min(2, "Lead name must be at least 2 characters.").max(160),
  companyName: z.string().trim().min(2, "Company name is required.").max(180),
  email: z
    .string()
    .trim()
    .max(255)
    .transform((value) => value.toLowerCase())
    .refine((value) => value === "" || z.email().safeParse(value).success, {
      message: "Enter a valid email address.",
    }),
  phone: z.string().trim().max(80).optional().or(z.literal("")),
  industry: z.string().trim().max(140).optional().or(z.literal("")),
  segment: z.enum(leadSegments),
  status: z.enum(leadStatuses).exclude(["converted", "archived"]),
  companyId: z.uuid("Select a valid company.").optional().or(z.literal("")),
  contactId: z.uuid("Select a valid contact.").optional().or(z.literal("")),
});

export type LeadInput = z.infer<typeof leadInputSchema>;
