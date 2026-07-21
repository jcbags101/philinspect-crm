import { describe, expect, it } from "vitest";

import { assertPermission, hasPermission, PermissionDeniedError } from "./permissions";

describe("CRM permissions", () => {
  it("keeps sales access focused on reading and sending", () => {
    expect(hasPermission("sales", "inbox:read")).toBe(true);
    expect(hasPermission("sales", "inbox:send")).toBe(true);
    expect(hasPermission("sales", "inbox:triage")).toBe(false);
  });

  it("allows account managers to triage without administration", () => {
    expect(hasPermission("account_manager", "inbox:triage")).toBe(true);
    expect(hasPermission("account_manager", "inbox:admin")).toBe(false);
  });

  it("reserves demo reset for administrators", () => {
    expect(hasPermission("admin", "demo:reset")).toBe(true);
    expect(() => assertPermission("sales", "demo:reset")).toThrow(PermissionDeniedError);
  });
});
