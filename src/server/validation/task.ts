import { z } from "zod";

export const taskStatuses = ["open", "in_progress", "completed", "cancelled"] as const;
export const taskPriorities = ["low", "medium", "high", "urgent"] as const;

export const taskInputSchema = z.object({
  title: z.string().trim().min(2, "Task title must be at least 2 characters.").max(220),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  status: z.enum(taskStatuses),
  priority: z.enum(taskPriorities),
  dueAt: z.string().trim().refine(
    (value) => value === "" || !Number.isNaN(new Date(value).getTime()),
    { message: "Enter a valid due date and time." },
  ),
});
