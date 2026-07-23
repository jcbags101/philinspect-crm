"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { ShellHeader } from "@/components/shell/header";
import { Sidebar } from "@/components/shell/sidebar";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth/client";

interface AppShellProps {
  children: React.ReactNode;
  currentUser: { name: string; role: string } | null;
}

export function AppShell({ children, currentUser }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [persona, setPersona] = useState("Account Manager");

  async function signOut() {
    await authClient.signOut();
    router.replace("/auth/sign-in");
    router.refresh();
  }

  if (pathname.startsWith("/auth/")) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background p-4">
        {children}
      </main>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#main-content"
        className="pi-focus-ring fixed left-3 top-3 z-50 -translate-y-16 rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-[var(--pi-shadow-floating)] transition-transform focus:translate-y-0"
      >
        Skip to main content
      </a>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-sidebar-border transition-[width] duration-200 motion-reduce:transition-none lg:block",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <Sidebar collapsed={collapsed} />
      </aside>
      <div
        className={cn(
          "transition-[padding] duration-200 motion-reduce:transition-none",
          collapsed ? "lg:pl-16" : "lg:pl-60",
        )}
      >
        <ShellHeader
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          persona={persona}
          currentUser={currentUser}
          onCollapsedChange={() => setCollapsed((value) => !value)}
          onMobileOpenChange={setMobileOpen}
          onPersonaChange={setPersona}
          onSignOut={() => void signOut()}
        />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[75rem] p-4 outline-none sm:p-6 lg:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
