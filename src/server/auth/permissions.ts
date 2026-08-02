import { DomainError } from "@/server/errors/domain-error";

export type AppRole = "account_manager" | "sales" | "admin";

export type Permission =
  | "contacts:read"
  | "contacts:write"
  | "companies:read"
  | "companies:write"
  | "leads:read"
  | "leads:write"
  | "leads:convert"
  | "deals:read"
  | "deals:write"
  | "deals:move"
  | "tasks:read"
  | "tasks:write"
  | "inspections:read"
  | "inspections:write"
  | "inbox:read"
  | "inbox:send"
  | "inbox:triage"
  | "inbox:admin"
  | "audit:read"
  | "members:read"
  | "members:manage"
  | "invitations:manage"
  | "settings:manage"
  | "demo:reset";

const salesPermissions: Permission[] = [
  "contacts:read",
  "contacts:write",
  "companies:read",
  "leads:read",
  "leads:write",
  "leads:convert",
  "deals:read",
  "deals:write",
  "deals:move",
  "tasks:read",
  "tasks:write",
  "inspections:read",
  "inbox:read",
  "inbox:send",
];

const accountManagerPermissions: Permission[] = [
  ...salesPermissions,
  "companies:write",
  "inspections:write",
  "inbox:triage",
  "audit:read",
  "members:read",
];

const adminPermissions: Permission[] = [
  ...accountManagerPermissions,
  "inbox:admin",
  "members:manage",
  "invitations:manage",
  "settings:manage",
  "demo:reset",
];

const permissions: Record<AppRole, ReadonlySet<Permission>> = {
  sales: new Set(salesPermissions),
  account_manager: new Set(accountManagerPermissions),
  admin: new Set(adminPermissions),
};

export function hasPermission(role: AppRole, permission: Permission): boolean {
  return permissions[role].has(permission);
}

export function assertPermission(role: AppRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new PermissionDeniedError(permission);
  }
}

export class PermissionDeniedError extends DomainError {
  constructor(public readonly permission: Permission) {
    super("forbidden", "You do not have permission to perform this action.");
    this.name = "PermissionDeniedError";
  }
}
