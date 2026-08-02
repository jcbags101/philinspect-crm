import { z } from "zod";

export const invitationRoleSchema = z.enum([
  "account_manager",
  "sales",
  "admin",
]);

export const createInvitationSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").transform((value) => value.toLowerCase()),
  role: invitationRoleSchema,
});

export const invitationTokenSchema = z
  .string()
  .trim()
  .min(32, "The invitation link is invalid.")
  .max(256, "The invitation link is invalid.");
