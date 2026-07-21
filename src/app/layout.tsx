import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { getSessionContext } from "@/server/auth/session-context";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PhilInspect CRM Demo",
    template: "%s · PhilInspect CRM",
  },
  description: "A realistic, fictional CRM proof of concept.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSessionContext();

  return (
    <html
      lang="en"
      className="dark h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <AppShell currentUser={session ? { name: session.name, role: session.role } : null}>{children}</AppShell>
      </body>
    </html>
  );
}
