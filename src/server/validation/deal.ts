import { z } from "zod";

export const dealKinds = ["product", "service", "reseller"] as const;

export const dealInputSchema = z.object({
  title: z.string().trim().min(2, "Deal title must be at least 2 characters.").max(220),
  companyId: z.uuid("Select a valid company."),
  primaryContactId: z.uuid("Select a valid contact.").optional().or(z.literal("")),
  pipelineStageId: z.uuid("Select a valid pipeline stage."),
  kind: z.enum(dealKinds),
  value: z
    .string()
    .trim()
    .refine((value) => value === "" || (!Number.isNaN(Number(value)) && Number(value) >= 0), {
      message: "Deal value must be zero or greater.",
    }),
  currency: z.string().trim().toUpperCase().length(3, "Use a 3-letter currency code."),
  probability: z.coerce.number().int().min(0).max(100),
  expectedCloseAt: z
    .string()
    .trim()
    .refine((value) => value === "" || !Number.isNaN(new Date(`${value}T00:00:00`).getTime()), {
      message: "Enter a valid expected close date.",
    }),
});

export const moveDealStageSchema = z.object({
  pipelineStageId: z.uuid("Select a valid pipeline stage."),
});
