import { config } from "dotenv";
import { Pool } from "pg";

config({ path: ".env.local", quiet: true });

const tenantTables = [
  "activities",
  "attachments",
  "audit_logs",
  "billing_milestones",
  "billing_plans",
  "catalog_items",
  "companies",
  "contacts",
  "conversations",
  "deal_stage_history",
  "deals",
  "inspections",
  "integration_connections",
  "leads",
  "meetings",
  "messages",
  "notes",
  "partnership_accounts",
  "partnership_group_members",
  "partnership_groups",
  "pipeline_stages",
  "proposal_versions",
  "proposals",
  "recordings",
  "revenue_entries",
  "revenue_targets",
  "tasks",
  "workspace_invitations",
  "workspace_memberships",
] as const;

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

async function main(): Promise<void> {
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL_UNPOOLED or DATABASE_URL is required.");
  }

  const pool = new Pool({ connectionString, max: 1 });
  try {
    const missing: string[] = [];
    const unscoped: Array<{ table: string; count: number }> = [];

    for (const table of tenantTables) {
      const exists = await pool.query<{ exists: boolean }>(
        `select exists (
           select 1 from information_schema.tables
            where table_schema = 'public' and table_name = $1
         )`,
        [table],
      );
      if (!exists.rows[0]?.exists) {
        missing.push(table);
        continue;
      }

      const result = await pool.query<{ count: number }>(
        `select count(*)::int as count
           from public.${quoteIdentifier(table)}
          where workspace_id is null`,
      );
      if ((result.rows[0]?.count ?? 0) > 0) {
        unscoped.push({ table, count: result.rows[0]!.count });
      }
    }

    const pipelineCoverage = await pool.query<{ count: number }>(
      `select count(*)::int as count
         from deals
        where pipeline_stage_id is null`,
    );
    const membershipCoverage = await pool.query<{ count: number }>(
      `select count(*)::int as count
         from users
         left join workspace_memberships
           on workspace_memberships.workspace_id = users.workspace_id
          and workspace_memberships.user_id = users.id
          and workspace_memberships.status = 'active'
        where workspace_memberships.id is null`,
    );
    const admins = await pool.query<{ count: number }>(
      `select count(*)::int as count
         from workspace_memberships
        where status = 'active' and role = 'admin'`,
    );

    if (
      missing.length > 0 ||
      unscoped.length > 0 ||
      (pipelineCoverage.rows[0]?.count ?? 0) > 0 ||
      (membershipCoverage.rows[0]?.count ?? 0) > 0 ||
      (admins.rows[0]?.count ?? 0) < 1
    ) {
      throw new Error(
        `MVP migration verification failed: ${JSON.stringify({
          missing,
          unscoped,
          dealsWithoutStage: pipelineCoverage.rows[0]?.count ?? 0,
          usersWithoutMembership: membershipCoverage.rows[0]?.count ?? 0,
          activeAdmins: admins.rows[0]?.count ?? 0,
        })}`,
      );
    }

    console.info(
      `Verified ${tenantTables.length} tenant tables, deal stage coverage, active memberships, and initial admin preservation.`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Migration verification failed.");
  process.exitCode = 1;
});
