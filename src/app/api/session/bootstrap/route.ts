import { bootstrapSessionContext } from "@/server/auth/session-context";
import { WorkspaceAccessDeniedError } from "@/server/services/workspace-service";

export async function POST() {
  try {
    const context = await bootstrapSessionContext();
    if (!context) {
      return Response.json(
        { error: "Authentication session was not established." },
        { status: 401 },
      );
    }

    return Response.json({
      user: {
        name: context.name,
        role: context.role,
      },
    });
  } catch (error) {
    if (error instanceof WorkspaceAccessDeniedError) {
      return Response.json(
        { error: error.message, code: "workspace_access_denied" },
        { status: 403 },
      );
    }

    console.error("[auth-bootstrap] failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });

    return Response.json(
      { error: "We could not finish setting up your workspace." },
      { status: 503 },
    );
  }
}
