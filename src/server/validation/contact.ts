import { z } from "zod";

const optionalEmail = z
  .string()
  .trim()
  .max(255)
  .transform((value) => value.toLowerCase())
  .refine((value) => value === "" || z.email().safeParse(value).success, {
    message: "Enter a valid email address.",
  });

export const contactInputSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(100),
  lastName: z.string().trim().min(1, "Last name is required.").max(100),
  email: optionalEmail.optional().or(z.literal("")),
  phone: z.string().trim().max(80).optional().or(z.literal("")),
  jobTitle: z.string().trim().max(140).optional().or(z.literal("")),
  companyId: z.uuid("Select a valid company.").optional().or(z.literal("")),
});

export type ContactInput = z.infer<typeof contactInputSchema>;
