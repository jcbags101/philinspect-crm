ALTER TABLE "users" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "workspace_id" SET NOT NULL;