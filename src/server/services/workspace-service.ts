import { getDb } from "@/db/client";
import {
  findWorkspaceMemberByAuthUserId,
  type WorkspaceMemberRecord,
} from "@/db/repositories/workspace-repository";
import { DomainError } from "@/server/errors/domain-error";

export interface AuthIdentity {
  authUserId: string;
  organizationId?: string;
  name: string;
  email: string;
}

export class WorkspaceAccessDeniedError extends DomainError {
  constructor() {
    super(
      "forbidden",
      "Your account does not have access to a PhilInspect CRM workspace.",
    );
    this.name = "WorkspaceAccessDeniedError";
  }
}

export async function resolveWorkspaceMember(identity: AuthIdentity): Promise<WorkspaceMemberRecord> {
  const db = getDb();
  const existing = await findWorkspaceMemberByAuthUserId(
    db,
    identity.authUserId,
    identity.organizationId,
  );
  if (existing) return existing;
  throw new WorkspaceAccessDeniedError();
}
