import { sql } from "./db";

export async function hasPermission(userId: string, permission: string) {
  const rows = await sql`select 1 from memberships m join membership_roles mr on mr.membership_id=m.id join role_permissions rp on rp.role_id=mr.role_id join permissions p on p.id=rp.permission_id where m.user_id=${userId} and (p.key=${permission} or p.key='*') limit 1`;
  return rows.length > 0;
}

export async function requirePermission(userId: string, permission: string) {
  if (!(await hasPermission(userId, permission))) throw new Error("Forbidden");
}
