import path from "node:path";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const TEST_TARGET_MARKER = "philinspect-crm-test";

const RUNTIME_DATABASE_VARIABLES = [
  "POSTGRES_URL",
  "DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_PRISMA_URL",
] as const;

export interface IntegrationDatabaseConfig {
  branchId: string;
  url: string;
}

type DatabaseEnvironment = Readonly<Record<string, string | undefined>>;

function normalizedDatabaseTarget(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("TEST_DATABASE_URL must be a valid PostgreSQL URL.");
  }

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error("TEST_DATABASE_URL must be a valid PostgreSQL URL.");
  }

  const host = url.hostname.replace(/-pooler(?=\.)/, "");
  return `${host}:${url.port || "5432"}${url.pathname}`;
}

export function getIntegrationDatabaseConfig(
  environment: DatabaseEnvironment = process.env,
): IntegrationDatabaseConfig {
  const url = environment.TEST_DATABASE_URL;
  if (!url) {
    throw new Error("TEST_DATABASE_URL is required for integration tests.");
  }

  if (environment.TEST_DATABASE_TARGET !== TEST_TARGET_MARKER) {
    throw new Error(
      "TEST_DATABASE_TARGET must explicitly identify the integration test target.",
    );
  }

  const branchId = environment.TEST_DATABASE_BRANCH_ID;
  if (!branchId?.startsWith("br-")) {
    throw new Error(
      "TEST_DATABASE_BRANCH_ID is required for the isolated Neon test branch.",
    );
  }

  const testTarget = normalizedDatabaseTarget(url);
  for (const variableName of RUNTIME_DATABASE_VARIABLES) {
    const runtimeUrl = environment[variableName];
    if (runtimeUrl && normalizedDatabaseTarget(runtimeUrl) === testTarget) {
      throw new Error(
        `TEST_DATABASE_URL must not resolve to the runtime database (${variableName}).`,
      );
    }
  }

  return { branchId, url };
}

export function createIntegrationPool(
  config: IntegrationDatabaseConfig,
): Pool {
  return new Pool({ connectionString: config.url, max: 2 });
}

export async function applyIntegrationMigrations(pool: Pool): Promise<void> {
  const database = drizzle(pool);
  await migrate(database, {
    migrationsFolder: path.resolve(process.cwd(), "drizzle"),
  });
}
