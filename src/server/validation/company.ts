import { z } from "zod";

export const companyInputSchema = z.object({
  name: z.string().trim().min(2, "Company name must be at least 2 characters.").max(180),
  domain: z
    .string()
    .trim()
    .max(255)
    .transform((value) => value.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, ""))
    .optional()
    .or(z.literal("")),
  industry: z.string().trim().max(140).optional().or(z.literal("")),
});

export type CompanyInput = z.infer<typeof companyInputSchema>;
