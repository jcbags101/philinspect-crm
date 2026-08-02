import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import {
  ConflictError,
  NotFoundError,
  RetryableError,
  UnauthenticatedError,
} from "./domain-error";
import { translateActionError } from "./translate-action-error";

describe("translateActionError", () => {
  it.each([
    [new UnauthenticatedError(), "unauthenticated", false],
    [new NotFoundError(), "not_found", false],
    [new ConflictError(), "conflict", false],
    [new RetryableError(), "retryable", true],
  ] as const)("maps domain errors", (error, code, retryable) => {
    expect(translateActionError(error, { operation: "test" })).toMatchObject({
      ok: false,
      code,
      retryable,
    });
  });

  it("maps validation errors and field details", () => {
    const schema = z.object({ name: z.string().min(2, "Name is too short.") });
    const result = schema.safeParse({ name: "" });
    if (result.success) throw new Error("Expected the fixture to be invalid");

    expect(
      translateActionError(result.error, { operation: "create contact" }),
    ).toMatchObject({
      ok: false,
      code: "validation",
      error: "Name is too short.",
      fieldErrors: { name: ["Name is too short."] },
    });
  });

  it("does not expose unexpected provider or database messages", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = translateActionError(
      new Error("password=secret database unavailable at private-host"),
      { operation: "create deal" },
    );

    expect(result).toEqual({
      ok: false,
      code: "unexpected",
      error: "The action could not be completed. Please try again.",
      retryable: true,
    });
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain("password=secret");
    consoleError.mockRestore();
  });
});
