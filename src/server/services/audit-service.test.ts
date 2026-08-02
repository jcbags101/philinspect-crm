import { describe, expect, it } from "vitest";

import { redactAuditValue } from "./audit-service";

describe("audit redaction", () => {
  it("recursively removes sensitive values while preserving useful state", () => {
    expect(
      redactAuditValue({
        name: "Example company",
        token: "raw-token",
        nested: {
          password: "raw-password",
          providerCredentials: { accessToken: "provider-token" },
          values: [{ cookieSecret: "cookie-secret", status: "connected" }],
        },
      }),
    ).toEqual({
      name: "Example company",
      token: "[REDACTED]",
      nested: {
        password: "[REDACTED]",
        providerCredentials: "[REDACTED]",
        values: [{ cookieSecret: "[REDACTED]", status: "connected" }],
      },
    });
  });
});
