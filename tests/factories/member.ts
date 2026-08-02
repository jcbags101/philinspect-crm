import type { AppRole } from "../../src/server/auth/permissions";
import { workspaceFixture, type WorkspaceFixture } from "./workspace";

let memberSequence = 0;

export interface MemberFixture {
  authUserId: string;
  email: string;
  id: string;
  name: string;
  role: AppRole;
  workspace: WorkspaceFixture;
}

export function memberFixture(
  overrides: Partial<MemberFixture> = {},
): MemberFixture {
  memberSequence += 1;
  return {
    id: `10000000-0000-4000-8000-${memberSequence.toString().padStart(12, "0")}`,
    authUserId: `test-auth-user-${memberSequence}`,
    email: `member-${memberSequence}@example.test`,
    name: `Member ${memberSequence}`,
    role: "sales",
    workspace: workspaceFixture(),
    ...overrides,
  };
}
