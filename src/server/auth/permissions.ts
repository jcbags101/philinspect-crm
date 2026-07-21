export type AppRole = "account_manager" | "sales" | "admin";

export type Permission =
  | "inbox:read"
  | "inbox:send"
  | "inbox:triage"
  | "inbox:admin"
  | "demo:reset";

const permissions: Record<AppRole, ReadonlySet<Permission>> = {
  sales: new Set(["inbox:read", "inbox:send"]),
  account_manager: new Set(["inbox:read", "inbox:send", "inbox:triage"]),
  admin: new Set(["inbox:read", "inbox:send", "inbox:triage", "inbox:admin", "demo:reset"]),
};

export function hasPermission(role: AppRole, permission: Permission): boolean {
  return permissions[role].has(permission);
}

export function assertPermission(role: AppRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new PermissionDeniedError(permission);
  }
}

export class PermissionDeniedError extends Error {
  constructor(public readonly permission: Permission) {
    super("You do not have permission to perform this action.");
    this.name = "PermissionDeniedError";
  }
}
