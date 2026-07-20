"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArchiveRestore,
  BadgeDollarSign,
  BookOpen,
  Boxes,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  CircleDollarSign,
  Handshake,
  Inbox,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Moon,
  ScrollText,
  Settings,
  Sparkles,
  Sun,
  Tags,
  UsersRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/chat", label: "Chat", icon: MessageSquareText },
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Sparkles },
  { href: "/deals", label: "Deals", icon: CircleDollarSign },
  { href: "/brands", label: "Brands", icon: Building2 },
  { href: "/wiki", label: "Wiki", icon: BookOpen },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/meetings", label: "Meetings", icon: CalendarDays },
  { href: "/proposals", label: "Proposals", icon: ScrollText },
  { href: "/partnerships", label: "Partnerships", icon: Handshake },
  { href: "/users", label: "Users", icon: UsersRound },
  { href: "/revenue", label: "Revenue", icon: BadgeDollarSign },
  { href: "/bills", label: "Bills", icon: ArchiveRestore },
  { href: "/catalog", label: "Catalog", icon: Boxes },
  { href: "/audit-logs", label: "Audit logs", icon: Tags },
] as const;

function Sidebar({ collapsed, close }: { collapsed: boolean; close?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className={cn("flex h-16 items-center border-b border-sidebar-border", collapsed ? "justify-center px-2" : "px-4")}>
        <Link href="/" className="flex items-center gap-3" onClick={close}>
          <span className="grid size-8 place-items-center rounded-lg bg-primary font-semibold text-primary-foreground shadow-[0_0_20px_rgba(37,99,235,.25)]">S</span>
          {!collapsed && <span className="font-semibold tracking-tight">Symph CRM</span>}
        </Link>
      </div>
      <nav className="crm-scrollbar flex-1 space-y-1 overflow-y-auto p-2" aria-label="Main navigation">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={close}
              title={collapsed ? label : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
                active && "bg-sidebar-accent text-foreground shadow-[inset_3px_0_0_#3b82f6]",
                collapsed && "justify-center px-0",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-2">
        <Link href="/settings" className={cn("flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground", collapsed && "justify-center px-0")}>
          <Settings className="size-4" />{!collapsed && <span>Settings</span>}
        </Link>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [persona, setPersona] = useState("Account Manager");

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className={cn("fixed inset-y-0 left-0 z-30 hidden border-r border-sidebar-border transition-[width] duration-200 lg:block", collapsed ? "w-[68px]" : "w-60")}>
        <Sidebar collapsed={collapsed} />
      </aside>
      <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[68px]" : "lg:pl-60")}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/70 bg-background/90 px-4 backdrop-blur-xl sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" />}><Menu /></SheetTrigger>
            <SheetContent side="left" className="w-64 p-0"><SheetTitle className="sr-only">Navigation</SheetTitle><Sidebar collapsed={false} close={() => setMobileOpen(false)} /></SheetContent>
          </Sheet>
          <Button variant="ghost" size="icon" className="hidden text-muted-foreground lg:inline-flex" onClick={() => setCollapsed((value) => !value)} aria-label="Toggle sidebar">
            {collapsed ? <ChevronsRight /> : <ChevronsLeft />}
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">{dark ? <Sun /> : <Moon />}</Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" className="gap-2 border-border/70 bg-card/60" />}>
                <span className="hidden text-muted-foreground sm:inline">Viewing as</span>
                <span>{persona}</span><ChevronDown className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {["Account Manager", "Sales", "Admin"].map((label) => <DropdownMenuItem key={label} onClick={() => setPersona(label)}>{label}</DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-semibold">AS</div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
