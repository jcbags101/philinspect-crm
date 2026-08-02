import type { SessionContext } from "./session-context";
import { assertPermission, type Permission } from "./permissions";

export function authorize(
  context: SessionContext,
  permission: Permission,
): SessionContext {
  assertPermission(context.role, permission);
  return context;
}
