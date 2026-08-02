import postgres from "postgres";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
export const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 4, prepare: false });

export async function getDashboardCounts() {
  const [row] = await sql`select (select count(*)::int from contacts) contacts, (select count(*)::int from companies) companies, (select count(*)::int from leads where status not in ('won','lost')) leads, (select coalesce(sum(value),0)::float8 from deals where status = 'open') pipeline_value`;
  return { contacts: Number(row.contacts), companies: Number(row.companies), leads: Number(row.leads), pipelineValue: Number(row.pipeline_value) };
}
