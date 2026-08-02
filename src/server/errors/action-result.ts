import type { DomainErrorCode } from "./domain-error";

export type ActionErrorCode = DomainErrorCode | "unexpected";

export interface ActionFailure {
  ok: false;
  code: ActionErrorCode;
  error: string;
  retryable: boolean;
  fieldErrors?: Record<string, string[]>;
}

export type ActionSuccess<T = undefined> = T extends undefined
  ? { ok: true }
  : { ok: true; data: T };

export type ActionResult<T = undefined> = ActionSuccess<T> | ActionFailure;

export function actionSuccess(): ActionSuccess;
export function actionSuccess<T>(data: T): ActionSuccess<T>;
export function actionSuccess<T>(data?: T): ActionSuccess<T> | ActionSuccess {
  return data === undefined
    ? ({ ok: true } as ActionSuccess)
    : ({ ok: true, data } as ActionSuccess<T>);
}
