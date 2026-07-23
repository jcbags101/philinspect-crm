import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/lib/auth/server";

const neonAuthMiddleware = auth.middleware({ loginUrl: "/auth/sign-in" });

export default function proxy(request: NextRequest) {
  if (request.method === "POST" && request.headers.has("next-action")) {
    return NextResponse.next();
  }

  return neonAuthMiddleware(request);
}

export const config = {
  matcher: ["/((?!api/auth|auth(?:/|$)|_next/static|_next/image|favicon.ico).*)"],
};
