import { describe, expect, it } from "vitest";

import type { SessionContext } from "./session-context";
import { canAccessOwnedRecord } from "./ownership";

function context(role: SessionContext["role"]): SessionContext {
  return {
    authUserId: "auth-user",
    userId: "member-one",
    workspaceId: "workspace-one",
    workspaceName: "Workspace one",
    name: "Test member",
    email: "member@example.test",
    role,
  };
}

describe("record ownership", () => {
  it("limits Sales to owned or assigned records", () => {
    expect(canAccessOwnedRecord(context("sales"), { ownerId: "member-one" })).toBe(true);
    expect(canAccessOwnedRecord(context("sales"), { assignedToId: "member-one" })).toBe(true);
    expect(canAccessOwnedRecord(context("sales"), { ownerId: "member-two" })).toBe(false);
  });

  it("allows Account Manager and Admin workspace-wide access", () => {
    expect(canAccessOwnedRecord(context("account_manager"), { ownerId: "member-two" })).toBe(true);
    expect(canAccessOwnedRecord(context("admin"), { ownerId: null })).toBe(true);
  });
});
