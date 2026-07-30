import { cache } from "react";
import { headers } from "next/headers";
import { z } from "zod";

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

const authSessionSchema = z.object({
  session: z
    .object({
      activeOrganizationId: z.string().nullish(),
    })
    .passthrough(),
  user: z
    .object({
      id: z.string().min(1),
      email: z.string().email(),
      name: z.string().nullish(),
    })
    .passthrough(),
});

type AuthSessionData = z.infer<typeof authSessionSchema>;

function getAuthBaseUrl(): string {
  const value = process.env.NEON_AUTH_BASE_URL;
  if (!value) {
    throw new Error("Missing required environment variable: NEON_AUTH_BASE_URL");
  }
  return value;
}

function getRequestOrigin(requestHeaders: Headers): string {
  const forwardedHost =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const forwardedProtocol =
    requestHeaders.get("x-forwarded-proto") ??
    (forwardedHost?.includes("localhost") ? "http" : "https");

  return (
    requestHeaders.get("origin") ??
    requestHeaders.get("referer")?.split("/").slice(0, 3).join("/") ??
    (forwardedHost ? `${forwardedProtocol}://${forwardedHost}` : "")
  );
}

async function readAuthSession(): Promise<AuthSessionData | null> {
  const requestHeaders = await headers();
  const cookie = requestHeaders.get("cookie") ?? "";
  if (!cookie) return null;

  const baseUrl = getAuthBaseUrl();
  const url = new URL(
    "get-session",
    baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
  );
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Cookie: cookie,
      Origin: getRequestOrigin(requestHeaders),
      "x-neon-auth-proxy": "nextjs",
    },
    cache: "no-store",
  });

  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) {
    throw new Error(`Neon Auth session lookup failed (${response.status})`);
  }

  const parsed = authSessionSchema.safeParse(await response.json());
  return parsed.success ? parsed.data : null;
}

async function resolveSessionContextFromAuth(
  data: AuthSessionData | null,
): Promise<SessionContext | null> {
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

async function resolveSessionContext(): Promise<SessionContext | null> {
  return resolveSessionContextFromAuth(await readAuthSession());
}

export const getSessionContext = cache(resolveSessionContext);

export async function bootstrapSessionContext(): Promise<SessionContext | null> {
  const { data, error } = await auth.getSession();
  if (error) {
    throw new Error(error.message || "Authentication session bootstrap failed");
  }

  const parsed = authSessionSchema.safeParse(data);
  return resolveSessionContextFromAuth(parsed.success ? parsed.data : null);
}

export async function requireSessionContext(): Promise<SessionContext> {
  const context = await getSessionContext();
  if (!context) throw new Error("Authentication required.");
  return context;
}
