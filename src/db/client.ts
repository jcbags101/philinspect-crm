import "server-only";

import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

let pool: Pool | null = null;
let database: Database | null = null;

function getRuntimeDatabaseUrl(): string {
  const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "POSTGRES_URL or DATABASE_URL is required to connect to Neon Postgres.",
    );
  }

  return connectionString;
}

export function getDb(): Database {
  if (database) return database;

  pool = new Pool({ connectionString: getRuntimeDatabaseUrl(), max: 5 });
  attachDatabasePool(pool);
  database = drizzle({ client: pool, schema });

  return database;
}

export async function closeDb(): Promise<void> {
  if (!pool) return;
  await pool.end();
  pool = null;
  database = null;
}
