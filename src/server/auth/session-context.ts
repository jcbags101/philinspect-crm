import { cache } from "react";

import { auth } from "@/lib/auth/server";
import { resolveWorkspaceMember } from "@/server/services/workspace-service";
import type { AppRole } from "./permissions";

export interface SessionContext {
  authUserId: string;
  userId: string;
  workspaceId: string;
  workspaceName: string;
  name: string;
  email: string;
  role: AppRole;
}

async function resolveSessionContext(): Promise<SessionContext | null> {
  const { data } = await auth.getSession();
  if (!data?.user) return null;

  const organizationId = data.session.activeOrganizationId ?? "demo:philinspect-staging";
  const member = await resolveWorkspaceMember({
    authUserId: data.user.id,
    organizationId,
    organizationName: data.session.activeOrganizationId
      ? "PhilInspect CRM Workspace"
      : "PhilInspect CRM Demo",
    name: data.user.name || data.user.email,
    email: data.user.email,
  });

  return {
    authUserId: data.user.id,
    userId: member.userId,
    workspaceId: member.workspaceId,
    workspaceName: member.workspaceName,
    name: member.name,
    email: member.email,
    role: member.role,
  };
}

export const getSessionContext = cache(resolveSessionContext);

export async function requireSessionContext(): Promise<SessionContext> {
  const context = await getSessionContext();
  if (!context) throw new Error("Authentication required.");
  return context;
}
