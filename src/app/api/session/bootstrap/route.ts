import { bootstrapSessionContext } from "@/server/auth/session-context";

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
    console.error("[auth-bootstrap] failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    return Response.json(
      { error: "We could not finish setting up your workspace." },
      { status: 503 },
    );
  }
}
