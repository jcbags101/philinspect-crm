import { describe, expect, it } from "vitest";

import {
  assertPermission,
  hasPermission,
  type AppRole,
  type Permission,
  PermissionDeniedError,
} from "./permissions";

const matrix: Array<{
  permission: Permission;
  sales: boolean;
  account_manager: boolean;
  admin: boolean;
}> = [
  { permission: "contacts:write", sales: true, account_manager: true, admin: true },
  { permission: "companies:write", sales: false, account_manager: true, admin: true },
  { permission: "leads:convert", sales: true, account_manager: true, admin: true },
  { permission: "deals:move", sales: true, account_manager: true, admin: true },
  { permission: "tasks:write", sales: true, account_manager: true, admin: true },
  { permission: "inspections:write", sales: false, account_manager: true, admin: true },
  { permission: "inbox:triage", sales: false, account_manager: true, admin: true },
  { permission: "audit:read", sales: false, account_manager: true, admin: true },
  { permission: "members:read", sales: false, account_manager: true, admin: true },
  { permission: "members:manage", sales: false, account_manager: false, admin: true },
  { permission: "invitations:manage", sales: false, account_manager: false, admin: true },
  { permission: "settings:manage", sales: false, account_manager: false, admin: true },
];

describe("CRM permission matrix", () => {
  it.each(matrix)("enforces $permission", (row) => {
    for (const role of ["sales", "account_manager", "admin"] as AppRole[]) {
      expect(hasPermission(role, row.permission)).toBe(row[role]);
    }
  });

  it("throws a stable forbidden domain error", () => {
    expect(() => assertPermission("sales", "members:manage")).toThrow(
      PermissionDeniedError,
    );
  });
});
