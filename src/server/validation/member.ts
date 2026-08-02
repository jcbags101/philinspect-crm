import { z } from "zod";

export const updateMemberSchema = z.object({
  role: z.enum(["account_manager", "sales", "admin"]),
  status: z.enum(["active", "suspended"]),
});
