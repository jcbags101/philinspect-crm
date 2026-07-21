CREATE TYPE "public"."conversation_status" AS ENUM('open', 'pending', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."message_delivery_state" AS ENUM('queued', 'sent', 'delivered', 'read', 'failed');--> statement-breakpoint
CREATE TYPE "public"."messaging_account_status" AS ENUM('connected', 'warning', 'disconnected');--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'sent';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'retried';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'assigned';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'tagged';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'noted';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'read_status';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'reset';--> statement-breakpoint
CREATE TABLE "conversation_tag_links" (
	"conversation_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "conversation_tag_links_conversation_id_tag_id_pk" PRIMARY KEY("conversation_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "conversation_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" varchar(80) NOT NULL,
	"color" varchar(32) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"attempt_number" integer NOT NULL,
	"state" "message_delivery_state" NOT NULL,
	"safe_error" varchar(240),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messaging_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"channel" "channel_type" NOT NULL,
	"label" varchar(120) NOT NULL,
	"handle" varchar(160) NOT NULL,
	"fictional_external_account_id" varchar(180) NOT NULL,
	"status" "messaging_account_status" DEFAULT 'connected' NOT NULL,
	"sync_warning" varchar(240),
	"fixture" jsonb NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "workspaces" ("id", "neon_auth_organization_id", "name")
VALUES ('00000000-0000-4000-8000-000004000001', 'demo:philinspect-staging', 'PhilInspect CRM Demo')
ON CONFLICT ("neon_auth_organization_id") DO NOTHING;--> statement-breakpoint
UPDATE "users" SET "workspace_id" = '00000000-0000-4000-8000-000004000001' WHERE "workspace_id" IS NULL;--> statement-breakpoint
UPDATE "audit_logs" SET "workspace_id" = '00000000-0000-4000-8000-000004000001' WHERE "workspace_id" IS NULL;--> statement-breakpoint
INSERT INTO "messaging_accounts" ("id", "workspace_id", "channel", "label", "handle", "fictional_external_account_id", "status", "fixture") VALUES
  ('ffffffff-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000004000001', 'email', 'Legacy Email Demo', 'legacy-email-demo', 'migration-email-demo', 'connected', '{"simulated":true,"migration":true}'),
  ('ffffffff-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000004000001', 'messenger', 'Legacy Messenger Demo', 'legacy-messenger-demo', 'migration-messenger-demo', 'connected', '{"simulated":true,"migration":true}'),
  ('ffffffff-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000004000001', 'instagram', 'Legacy Instagram Demo', 'legacy-instagram-demo', 'migration-instagram-demo', 'connected', '{"simulated":true,"migration":true}'),
  ('ffffffff-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000004000001', 'whatsapp', 'Legacy WhatsApp Demo', 'legacy-whatsapp-demo', 'migration-whatsapp-demo', 'connected', '{"simulated":true,"migration":true}'),
  ('ffffffff-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000004000001', 'viber', 'Legacy Viber Demo', 'legacy-viber-demo', 'migration-viber-demo', 'connected', '{"simulated":true,"migration":true}');--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "messaging_account_id" uuid;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "provider_conversation_id" varchar(180);--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "assignee_id" uuid;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "participant_handle" varchar(180);--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "status" "conversation_status" DEFAULT 'open' NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "unread_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "last_message_preview" varchar(280);--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
UPDATE "conversations" AS c SET
  "workspace_id" = '00000000-0000-4000-8000-000004000001',
  "messaging_account_id" = CASE cc."type"
    WHEN 'email' THEN 'ffffffff-0000-4000-8000-000000000001'::uuid
    WHEN 'messenger' THEN 'ffffffff-0000-4000-8000-000000000002'::uuid
    WHEN 'instagram' THEN 'ffffffff-0000-4000-8000-000000000003'::uuid
    WHEN 'whatsapp' THEN 'ffffffff-0000-4000-8000-000000000004'::uuid
    ELSE 'ffffffff-0000-4000-8000-000000000005'::uuid
  END,
  "provider_conversation_id" = 'migration-' || c."id"::text,
  "unread_count" = CASE WHEN c."unread_at" IS NULL THEN 0 ELSE 1 END,
  "last_message_preview" = c."subject"
FROM "communication_channels" AS cc
WHERE c."channel_id" = cc."id";--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "messaging_account_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "provider_conversation_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "sender_user_id" uuid;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "delivery_state" "message_delivery_state" DEFAULT 'delivered' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "idempotency_key" varchar(180);--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "provider_message_id" varchar(180);--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "delivery_error" varchar(240);--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
UPDATE "messages" AS m SET "workspace_id" = c."workspace_id" FROM "conversations" AS c WHERE m."conversation_id" = c."id";--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversation_tag_links" ADD CONSTRAINT "conversation_tag_links_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_tag_links" ADD CONSTRAINT "conversation_tag_links_tag_id_conversation_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."conversation_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_tags" ADD CONSTRAINT "conversation_tags_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_attempts" ADD CONSTRAINT "message_attempts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_attempts" ADD CONSTRAINT "message_attempts_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messaging_accounts" ADD CONSTRAINT "messaging_accounts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "conversation_tags_workspace_name_idx" ON "conversation_tags" USING btree ("workspace_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "message_attempts_message_number_idx" ON "message_attempts" USING btree ("message_id","attempt_number");--> statement-breakpoint
CREATE INDEX "message_attempts_workspace_idx" ON "message_attempts" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "messaging_accounts_workspace_external_idx" ON "messaging_accounts" USING btree ("workspace_id","fictional_external_account_id");--> statement-breakpoint
CREATE INDEX "messaging_accounts_workspace_channel_idx" ON "messaging_accounts" USING btree ("workspace_id","channel");--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_messaging_account_id_messaging_accounts_id_fk" FOREIGN KEY ("messaging_account_id") REFERENCES "public"."messaging_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "conversations_workspace_provider_idx" ON "conversations" USING btree ("workspace_id","provider_conversation_id");--> statement-breakpoint
CREATE INDEX "conversations_account_last_message_idx" ON "conversations" USING btree ("messaging_account_id","last_message_at");--> statement-breakpoint
CREATE INDEX "conversations_workspace_queue_idx" ON "conversations" USING btree ("workspace_id","status","assignee_id","unread_count");--> statement-breakpoint
CREATE UNIQUE INDEX "messages_conversation_idempotency_idx" ON "messages" USING btree ("conversation_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "messages_workspace_chronology_idx" ON "messages" USING btree ("workspace_id","conversation_id","sent_at");
