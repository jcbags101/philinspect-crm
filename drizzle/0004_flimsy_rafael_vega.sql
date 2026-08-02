CREATE TYPE "public"."pipeline_outcome" AS ENUM('open', 'won', 'lost');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('open', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."inspection_status" AS ENUM('draft', 'scheduled', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'invited';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'accepted';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'revoked';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'role_changed';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'converted';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'stage_moved';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'completed';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'archived';--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"company_id" uuid,
	"owner_id" uuid,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255),
	"phone" varchar(80),
	"job_title" varchar(140),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pipeline_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"key" varchar(80) NOT NULL,
	"label" varchar(100) NOT NULL,
	"position" integer NOT NULL,
	"color_role" varchar(80) NOT NULL,
	"outcome" "pipeline_outcome" DEFAULT 'open' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"title" varchar(220) NOT NULL,
	"description" text,
	"status" "task_status" DEFAULT 'open' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"assigned_to_id" uuid,
	"created_by_id" uuid NOT NULL,
	"contact_id" uuid,
	"company_id" uuid,
	"lead_id" uuid,
	"deal_id" uuid,
	"due_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workspace_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" "role_name" NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"invited_by_id" uuid NOT NULL,
	"accepted_by_user_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workspace_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "role_name" NOT NULL,
	"status" "membership_status" DEFAULT 'active' NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"primary_contact_id" uuid,
	"deal_id" uuid,
	"assigned_to_id" uuid,
	"created_by_id" uuid NOT NULL,
	"title" varchar(220) NOT NULL,
	"status" "inspection_status" DEFAULT 'draft' NOT NULL,
	"location" varchar(300),
	"notes" text,
	"scheduled_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"report_metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "brands" RENAME TO "companies";--> statement-breakpoint
ALTER TABLE "billing_plans" RENAME COLUMN "brand_id" TO "company_id";--> statement-breakpoint
ALTER TABLE "activities" RENAME COLUMN "brand_id" TO "company_id";--> statement-breakpoint
ALTER TABLE "attachments" RENAME COLUMN "brand_id" TO "company_id";--> statement-breakpoint
ALTER TABLE "deals" RENAME COLUMN "brand_id" TO "company_id";--> statement-breakpoint
ALTER TABLE "notes" RENAME COLUMN "brand_id" TO "company_id";--> statement-breakpoint
ALTER TABLE "proposals" RENAME COLUMN "brand_id" TO "company_id";--> statement-breakpoint
ALTER TABLE "conversations" RENAME COLUMN "brand_id" TO "company_id";--> statement-breakpoint
ALTER TABLE "billing_plans" DROP CONSTRAINT "billing_plans_brand_id_brands_id_fk";
--> statement-breakpoint
ALTER TABLE "activities" DROP CONSTRAINT "activities_brand_id_brands_id_fk";
--> statement-breakpoint
ALTER TABLE "attachments" DROP CONSTRAINT "attachments_brand_id_brands_id_fk";
--> statement-breakpoint
ALTER TABLE "companies" DROP CONSTRAINT "brands_owner_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "companies" DROP CONSTRAINT "brands_created_by_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "deals" DROP CONSTRAINT "deals_brand_id_brands_id_fk";
--> statement-breakpoint
ALTER TABLE "deals" DROP CONSTRAINT "deals_source_lead_id_leads_id_fk";
--> statement-breakpoint
ALTER TABLE "leads" DROP CONSTRAINT "leads_owner_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "notes" DROP CONSTRAINT "notes_brand_id_brands_id_fk";
--> statement-breakpoint
ALTER TABLE "proposals" DROP CONSTRAINT "proposals_brand_id_brands_id_fk";
--> statement-breakpoint
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_brand_id_brands_id_fk";
--> statement-breakpoint
DROP INDEX "activities_deal_idx";--> statement-breakpoint
DROP INDEX "activities_brand_idx";--> statement-breakpoint
DROP INDEX "brands_name_idx";--> statement-breakpoint
DROP INDEX "deal_stage_history_deal_idx";--> statement-breakpoint
DROP INDEX "deals_stage_idx";--> statement-breakpoint
DROP INDEX "deals_kind_idx";--> statement-breakpoint
DROP INDEX "deals_owner_idx";--> statement-breakpoint
DROP INDEX "deals_brand_idx";--> statement-breakpoint
DROP INDEX "leads_status_idx";--> statement-breakpoint
DROP INDEX "leads_segment_idx";--> statement-breakpoint
DROP INDEX "leads_owner_idx";--> statement-breakpoint
ALTER TABLE "billing_milestones" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "billing_plans" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "catalog_items" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "revenue_entries" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "revenue_targets" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "attachments" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "deal_stage_history" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "deal_stage_history" ADD COLUMN "from_pipeline_stage_id" uuid;--> statement-breakpoint
ALTER TABLE "deal_stage_history" ADD COLUMN "to_pipeline_stage_id" uuid;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "primary_contact_id" uuid;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "pipeline_stage_id" uuid;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "company_id" uuid;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "contact_id" uuid;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "partnership_accounts" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "partnership_group_members" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "partnership_groups" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "proposal_versions" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "recordings" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "integration_connections" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint

-- Data-preserving tenant backfill. Existing staging data belongs to the one
-- workspace present before this migration; new empty branches are a no-op.
DO $$
DECLARE
  fallback_workspace_id uuid;
BEGIN
  SELECT id INTO fallback_workspace_id FROM workspaces ORDER BY created_at LIMIT 1;

  IF fallback_workspace_id IS NULL AND (
    EXISTS (SELECT 1 FROM companies) OR
    EXISTS (SELECT 1 FROM leads) OR
    EXISTS (SELECT 1 FROM deals)
  ) THEN
    RAISE EXCEPTION 'Cannot backfill CRM tenant scope without a workspace';
  END IF;

  UPDATE companies SET workspace_id = fallback_workspace_id WHERE workspace_id IS NULL;
  UPDATE leads SET workspace_id = COALESCE((SELECT workspace_id FROM users WHERE users.id = leads.owner_id), fallback_workspace_id) WHERE workspace_id IS NULL;
  UPDATE deals SET workspace_id = COALESCE((SELECT workspace_id FROM users WHERE users.id = deals.owner_id), fallback_workspace_id) WHERE workspace_id IS NULL;
  UPDATE deal_stage_history SET workspace_id = COALESCE((SELECT workspace_id FROM deals WHERE deals.id = deal_stage_history.deal_id), fallback_workspace_id) WHERE workspace_id IS NULL;
  UPDATE activities SET workspace_id = COALESCE((SELECT workspace_id FROM deals WHERE deals.id = activities.deal_id), fallback_workspace_id) WHERE workspace_id IS NULL;
  UPDATE attachments SET workspace_id = COALESCE((SELECT workspace_id FROM deals WHERE deals.id = attachments.deal_id), fallback_workspace_id) WHERE workspace_id IS NULL;
  UPDATE notes SET workspace_id = COALESCE((SELECT workspace_id FROM deals WHERE deals.id = notes.deal_id), fallback_workspace_id) WHERE workspace_id IS NULL;
  UPDATE catalog_items SET workspace_id = fallback_workspace_id WHERE workspace_id IS NULL;
  UPDATE revenue_targets SET workspace_id = fallback_workspace_id WHERE workspace_id IS NULL;
  UPDATE revenue_entries SET workspace_id = COALESCE((SELECT workspace_id FROM deals WHERE deals.id = revenue_entries.deal_id), fallback_workspace_id) WHERE workspace_id IS NULL;
  UPDATE billing_plans SET workspace_id = COALESCE((SELECT workspace_id FROM deals WHERE deals.id = billing_plans.deal_id), fallback_workspace_id) WHERE workspace_id IS NULL;
  UPDATE billing_milestones SET workspace_id = COALESCE((SELECT workspace_id FROM billing_plans WHERE billing_plans.id = billing_milestones.billing_plan_id), fallback_workspace_id) WHERE workspace_id IS NULL;
  UPDATE meetings SET workspace_id = COALESCE((SELECT workspace_id FROM users WHERE users.id = meetings.owner_id), fallback_workspace_id) WHERE workspace_id IS NULL;
  UPDATE recordings SET workspace_id = COALESCE((SELECT workspace_id FROM meetings WHERE meetings.id = recordings.meeting_id), fallback_workspace_id) WHERE workspace_id IS NULL;
  UPDATE proposals SET workspace_id = COALESCE((SELECT workspace_id FROM deals WHERE deals.id = proposals.deal_id), fallback_workspace_id) WHERE workspace_id IS NULL;
  UPDATE proposal_versions SET workspace_id = COALESCE((SELECT workspace_id FROM proposals WHERE proposals.id = proposal_versions.proposal_id), fallback_workspace_id) WHERE workspace_id IS NULL;
  UPDATE partnership_accounts SET workspace_id = fallback_workspace_id WHERE workspace_id IS NULL;
  UPDATE partnership_groups SET workspace_id = COALESCE((SELECT workspace_id FROM users WHERE users.id = partnership_groups.created_by_id), fallback_workspace_id) WHERE workspace_id IS NULL;
  UPDATE partnership_group_members SET workspace_id = COALESCE((SELECT workspace_id FROM partnership_groups WHERE partnership_groups.id = partnership_group_members.group_id), fallback_workspace_id) WHERE workspace_id IS NULL;
  UPDATE integration_connections SET workspace_id = fallback_workspace_id WHERE workspace_id IS NULL;
END $$;--> statement-breakpoint

INSERT INTO pipeline_stages (workspace_id, key, label, position, color_role, outcome)
SELECT workspace.id, stage.key, stage.label, stage.position, stage.color_role,
  stage.outcome::pipeline_outcome
FROM workspaces AS workspace
CROSS JOIN (VALUES
  ('lead', 'Lead', 0, 'pipeline-lead', 'open'),
  ('discovery', 'Discovery', 1, 'pipeline-discovery', 'open'),
  ('assessment', 'Assessment', 2, 'pipeline-assessment', 'open'),
  ('demo_proposal', 'Demo Proposal', 3, 'pipeline-demo-proposal', 'open'),
  ('follow_up', 'Follow Up', 4, 'pipeline-follow-up', 'open'),
  ('parked', 'Parked', 5, 'pipeline-parked', 'open'),
  ('won', 'Won', 6, 'pipeline-won', 'won'),
  ('lost', 'Lost', 7, 'pipeline-lost', 'lost')
) AS stage(key, label, position, color_role, outcome);--> statement-breakpoint

UPDATE deals
SET pipeline_stage_id = pipeline_stages.id
FROM pipeline_stages
WHERE pipeline_stages.workspace_id = deals.workspace_id
  AND pipeline_stages.key = deals.stage::text
  AND deals.pipeline_stage_id IS NULL;--> statement-breakpoint

UPDATE deal_stage_history
SET to_pipeline_stage_id = pipeline_stages.id
FROM pipeline_stages
WHERE pipeline_stages.workspace_id = deal_stage_history.workspace_id
  AND pipeline_stages.key = deal_stage_history.to_stage::text
  AND deal_stage_history.to_pipeline_stage_id IS NULL;--> statement-breakpoint

UPDATE deal_stage_history
SET from_pipeline_stage_id = pipeline_stages.id
FROM pipeline_stages
WHERE pipeline_stages.workspace_id = deal_stage_history.workspace_id
  AND pipeline_stages.key = deal_stage_history.from_stage::text
  AND deal_stage_history.from_pipeline_stage_id IS NULL;--> statement-breakpoint

INSERT INTO workspace_memberships (workspace_id, user_id, role, status, created_by_id, created_at, updated_at)
SELECT users.workspace_id, users.id,
  COALESCE((
    SELECT roles.name
    FROM user_roles
    JOIN roles ON roles.id = user_roles.role_id
    WHERE user_roles.user_id = users.id
    ORDER BY CASE roles.name WHEN 'admin' THEN 0 WHEN 'account_manager' THEN 1 ELSE 2 END
    LIMIT 1
  ), 'sales'::role_name),
  'active', users.id, users.created_at, users.updated_at
FROM users;--> statement-breakpoint

ALTER TABLE "billing_milestones" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "billing_plans" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "catalog_items" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "revenue_entries" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "revenue_targets" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "attachments" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "deal_stage_history" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "deal_stage_history" ALTER COLUMN "to_pipeline_stage_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "deals" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "deals" ALTER COLUMN "pipeline_stage_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "meetings" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "partnership_accounts" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "partnership_group_members" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "partnership_groups" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "proposal_versions" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "proposals" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "recordings" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "integration_connections" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_accepted_by_user_id_users_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_primary_contact_id_contacts_id_fk" FOREIGN KEY ("primary_contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contacts_workspace_email_idx" ON "contacts" USING btree ("workspace_id","email");--> statement-breakpoint
CREATE INDEX "contacts_workspace_company_idx" ON "contacts" USING btree ("workspace_id","company_id","deleted_at");--> statement-breakpoint
CREATE INDEX "contacts_workspace_owner_idx" ON "contacts" USING btree ("workspace_id","owner_id","deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pipeline_stages_workspace_key_idx" ON "pipeline_stages" USING btree ("workspace_id","key");--> statement-breakpoint
CREATE UNIQUE INDEX "pipeline_stages_workspace_position_idx" ON "pipeline_stages" USING btree ("workspace_id","position");--> statement-breakpoint
CREATE INDEX "tasks_workspace_status_due_idx" ON "tasks" USING btree ("workspace_id","status","due_at");--> statement-breakpoint
CREATE INDEX "tasks_workspace_assignee_idx" ON "tasks" USING btree ("workspace_id","assigned_to_id","status");--> statement-breakpoint
CREATE INDEX "tasks_workspace_company_idx" ON "tasks" USING btree ("workspace_id","company_id");--> statement-breakpoint
CREATE INDEX "tasks_workspace_deal_idx" ON "tasks" USING btree ("workspace_id","deal_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_invitations_token_hash_idx" ON "workspace_invitations" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_invitations_pending_email_idx" ON "workspace_invitations" USING btree ("workspace_id","email") WHERE "workspace_invitations"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "workspace_invitations_workspace_status_idx" ON "workspace_invitations" USING btree ("workspace_id","status","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_memberships_workspace_user_idx" ON "workspace_memberships" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "workspace_memberships_user_status_idx" ON "workspace_memberships" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "workspace_memberships_workspace_role_idx" ON "workspace_memberships" USING btree ("workspace_id","role","status");--> statement-breakpoint
CREATE INDEX "inspections_workspace_status_idx" ON "inspections" USING btree ("workspace_id","status","scheduled_at");--> statement-breakpoint
CREATE INDEX "inspections_workspace_assignee_idx" ON "inspections" USING btree ("workspace_id","assigned_to_id","status");--> statement-breakpoint
CREATE INDEX "inspections_workspace_company_idx" ON "inspections" USING btree ("workspace_id","company_id");--> statement-breakpoint
CREATE INDEX "inspections_workspace_deal_idx" ON "inspections" USING btree ("workspace_id","deal_id");--> statement-breakpoint
ALTER TABLE "billing_milestones" ADD CONSTRAINT "billing_milestones_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_plans" ADD CONSTRAINT "billing_plans_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_plans" ADD CONSTRAINT "billing_plans_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_entries" ADD CONSTRAINT "revenue_entries_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_targets" ADD CONSTRAINT "revenue_targets_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_stage_history" ADD CONSTRAINT "deal_stage_history_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_stage_history" ADD CONSTRAINT "deal_stage_history_from_pipeline_stage_id_pipeline_stages_id_fk" FOREIGN KEY ("from_pipeline_stage_id") REFERENCES "public"."pipeline_stages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_stage_history" ADD CONSTRAINT "deal_stage_history_to_pipeline_stage_id_pipeline_stages_id_fk" FOREIGN KEY ("to_pipeline_stage_id") REFERENCES "public"."pipeline_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_primary_contact_id_contacts_id_fk" FOREIGN KEY ("primary_contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_pipeline_stage_id_pipeline_stages_id_fk" FOREIGN KEY ("pipeline_stage_id") REFERENCES "public"."pipeline_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_source_lead_id_leads_id_fk" FOREIGN KEY ("source_lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partnership_accounts" ADD CONSTRAINT "partnership_accounts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partnership_group_members" ADD CONSTRAINT "partnership_group_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partnership_groups" ADD CONSTRAINT "partnership_groups_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_versions" ADD CONSTRAINT "proposal_versions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_connections" ADD CONSTRAINT "integration_connections_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_workspace_deal_idx" ON "activities" USING btree ("workspace_id","deal_id","happened_at");--> statement-breakpoint
CREATE INDEX "activities_workspace_company_idx" ON "activities" USING btree ("workspace_id","company_id","happened_at");--> statement-breakpoint
CREATE INDEX "attachments_workspace_deal_idx" ON "attachments" USING btree ("workspace_id","deal_id");--> statement-breakpoint
CREATE INDEX "attachments_workspace_company_idx" ON "attachments" USING btree ("workspace_id","company_id");--> statement-breakpoint
CREATE INDEX "companies_workspace_name_idx" ON "companies" USING btree ("workspace_id","name");--> statement-breakpoint
CREATE INDEX "companies_workspace_owner_idx" ON "companies" USING btree ("workspace_id","owner_id","deleted_at");--> statement-breakpoint
CREATE INDEX "deal_stage_history_workspace_deal_idx" ON "deal_stage_history" USING btree ("workspace_id","deal_id","changed_at");--> statement-breakpoint
CREATE INDEX "deals_workspace_stage_idx" ON "deals" USING btree ("workspace_id","pipeline_stage_id","deleted_at");--> statement-breakpoint
CREATE INDEX "deals_workspace_owner_idx" ON "deals" USING btree ("workspace_id","owner_id","deleted_at");--> statement-breakpoint
CREATE INDEX "deals_workspace_company_idx" ON "deals" USING btree ("workspace_id","company_id");--> statement-breakpoint
CREATE INDEX "deals_workspace_source_lead_idx" ON "deals" USING btree ("workspace_id","source_lead_id");--> statement-breakpoint
CREATE INDEX "leads_workspace_status_idx" ON "leads" USING btree ("workspace_id","status","deleted_at");--> statement-breakpoint
CREATE INDEX "leads_workspace_segment_idx" ON "leads" USING btree ("workspace_id","segment");--> statement-breakpoint
CREATE INDEX "leads_workspace_owner_idx" ON "leads" USING btree ("workspace_id","owner_id","deleted_at");--> statement-breakpoint
CREATE INDEX "leads_workspace_company_idx" ON "leads" USING btree ("workspace_id","company_id");--> statement-breakpoint
CREATE INDEX "notes_workspace_deal_idx" ON "notes" USING btree ("workspace_id","deal_id");--> statement-breakpoint
CREATE INDEX "notes_workspace_company_idx" ON "notes" USING btree ("workspace_id","company_id");
