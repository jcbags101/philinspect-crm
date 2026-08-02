import { redirect } from "next/navigation";

import { hasPermission, type AppRole, type Permission } from "./permissions";

export function requirePagePermission(
  role: AppRole,
  permission: Permission,
): void {
  if (!hasPermission(role, permission)) {
    redirect("/forbidden");
  }
}
