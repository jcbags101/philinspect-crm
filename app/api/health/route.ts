import { sql } from "@/lib/db";

export async function GET() {
  try {
    await sql`select 1`;
    return Response.json({ status: "ok", service: "crm-core", database: "connected", version: "0.1.0" });
  } catch {
    return Response.json({ status: "error", database: "unavailable" }, { status: 503 });
  }
}
