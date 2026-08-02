import { ZodError } from "zod";

import type { ActionFailure } from "./action-result";
import { DomainError } from "./domain-error";

interface TranslateActionErrorOptions {
  operation: string;
}

export function translateActionError(
  error: unknown,
  { operation }: TranslateActionErrorOptions,
): ActionFailure {
  if (error instanceof ZodError) {
    const flattened = error.flatten();
    return {
      ok: false,
      code: "validation",
      error: error.issues[0]?.message ?? "Check the highlighted fields.",
      retryable: false,
      fieldErrors: flattened.fieldErrors as Record<string, string[]>,
    };
  }

  if (error instanceof DomainError) {
    return {
      ok: false,
      code: error.code,
      error: error.message,
      retryable: error.retryable,
    };
  }

  console.error("Server action failed", {
    operation,
    errorName: error instanceof Error ? error.name : "UnknownError",
  });

  return {
    ok: false,
    code: "unexpected",
    error: "The action could not be completed. Please try again.",
    retryable: true,
  };
}
