export type DomainErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "validation"
  | "conflict"
  | "retryable";

interface DomainErrorOptions {
  cause?: unknown;
  retryable?: boolean;
}

export class DomainError extends Error {
  readonly retryable: boolean;

  constructor(
    readonly code: DomainErrorCode,
    message: string,
    options: DomainErrorOptions = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "DomainError";
    this.retryable = options.retryable ?? code === "retryable";
  }
}

export class UnauthenticatedError extends DomainError {
  constructor() {
    super("unauthenticated", "Please sign in to continue.");
    this.name = "UnauthenticatedError";
  }
}

export class NotFoundError extends DomainError {
  constructor(message = "The requested record could not be found.") {
    super("not_found", message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends DomainError {
  constructor(message = "This record changed. Refresh and try again.") {
    super("conflict", message);
    this.name = "ConflictError";
  }
}

export class RetryableError extends DomainError {
  constructor(message = "The action could not be completed. Please try again.") {
    super("retryable", message, { retryable: true });
    this.name = "RetryableError";
  }
}
