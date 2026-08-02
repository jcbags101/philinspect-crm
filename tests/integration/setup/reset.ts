import type { Pool } from "pg";

import {
  getIntegrationDatabaseConfig,
  type IntegrationDatabaseConfig,
} from "./database";

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

export async function resetApplicationTables(
  pool: Pool,
  config: IntegrationDatabaseConfig = getIntegrationDatabaseConfig(),
): Promise<void> {
  // Re-run validation at the destructive boundary, even when a caller passes a
  // previously constructed pool.
  const validated = getIntegrationDatabaseConfig();

  if (validated.url !== config.url || validated.branchId !== config.branchId) {
    throw new Error("Integration database safety validation failed.");
  }

  const result = await pool.query<{ tablename: string }>(
    `select tablename
       from pg_tables
      where schemaname = 'public'
        and tablename <> '__drizzle_migrations'
      order by tablename`,
  );

  if (result.rows.length === 0) return;

  const tables = result.rows
    .map(({ tablename }) => `public.${quoteIdentifier(tablename)}`)
    .join(", ");

  await pool.query(`truncate table ${tables} restart identity cascade`);
}
