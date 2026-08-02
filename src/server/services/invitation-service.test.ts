import { describe, expect, it } from "vitest";

import { hashInvitationToken } from "../invitations/token";

describe("invitation tokens", () => {
  it("hashes tokens deterministically without retaining the raw value", () => {
    const token = "a-secure-raw-token-that-must-never-be-persisted";
    const hash = hashInvitationToken(token);

    expect(hash).toHaveLength(64);
    expect(hash).toBe(hashInvitationToken(token));
    expect(hash).not.toContain(token);
  });
});
