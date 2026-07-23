"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Menu,
  Search,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { allNavigationItems, getCurrentNavigationItem } from "./navigation";
import { Sidebar } from "./sidebar";
import { ThemeToggle } from "./theme-toggle";

interface ShellHeaderProps {
  collapsed: boolean;
  mobileOpen: boolean;
  persona: string;
  currentUser: { name: string; role: string } | null;
  onCollapsedChange: () => void;
  onMobileOpenChange: (open: boolean) => void;
  onPersonaChange: (persona: string) => void;
  onSignOut: () => void;
}

const personas = ["Account Manager", "Sales", "Admin"];

function JumpToMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="min-w-0 border-border bg-card text-muted-foreground"
            aria-label="Jump to a page"
          />
        }
      >
        <Search aria-hidden="true" />
        <span className="hidden md:inline">Jump to</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel>Jump to</DropdownMenuLabel>
        <DropdownMenuGroup>
          {allNavigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenuItem
                key={item.href}
                render={<Link href={item.href} />}
              >
                <Icon aria-hidden="true" />
                {item.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PersonaMenu({
  persona,
  onPersonaChange,
}: {
  persona: string;
  onPersonaChange: (persona: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="max-w-40 text-muted-foreground"
            aria-label={`Viewing as ${persona}`}
          />
        }
      >
        <UserRound aria-hidden="true" />
        <span className="hidden truncate sm:inline">{persona}</span>
        <ChevronDown className="hidden size-3 sm:block" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Viewing as</DropdownMenuLabel>
        <DropdownMenuGroup>
          {personas.map((label) => (
            <DropdownMenuItem
              key={label}
              onClick={() => onPersonaChange(label)}
              className={cn(label === persona && "bg-accent font-medium")}
            >
              {label}
              {label === persona && (
                <span className="pi-caption ml-auto">Active</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AccountSummary({
  currentUser,
}: {
  currentUser: ShellHeaderProps["currentUser"];
}) {
  const initials =
    currentUser?.name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "PI";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex"
            aria-label="View account details"
          />
        }
      >
        <span className="grid size-7 place-items-center rounded-full bg-secondary text-[10px] font-semibold text-secondary-foreground">
          {initials}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>
          <span className="pi-body-strong block truncate">
            {currentUser?.name ?? "PhilInspect user"}
          </span>
          <span className="pi-caption mt-0.5 block capitalize">
            {currentUser?.role ?? "Demo workspace"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/settings" />}>
          Account settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ShellHeader({
  collapsed,
  mobileOpen,
  persona,
  currentUser,
  onCollapsedChange,
  onMobileOpenChange,
  onPersonaChange,
  onSignOut,
}: ShellHeaderProps) {
  const pathname = usePathname();
  const currentItem = getCurrentNavigationItem(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur sm:px-4">
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Open navigation"
            />
          }
        >
          <Menu aria-hidden="true" />
        </SheetTrigger>
        <SheetContent side="left" className="w-60 gap-0 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar
            collapsed={false}
            close={() => onMobileOpenChange(false)}
          />
        </SheetContent>
      </Sheet>

      <Button
        variant="ghost"
        size="icon"
        className="hidden text-muted-foreground lg:inline-flex"
        onClick={onCollapsedChange}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
      >
        {collapsed ? (
          <ChevronsRight aria-hidden="true" />
        ) : (
          <ChevronsLeft aria-hidden="true" />
        )}
      </Button>

      <div className="min-w-0">
        <p className="pi-page-title truncate">
          {currentItem?.label ?? "PhilInspect CRM"}
        </p>
      </div>

      <div className="ml-auto flex min-w-0 items-center gap-0.5 sm:gap-1">
        <span className="pi-eyebrow hidden rounded-md border border-border bg-card px-2 py-1 md:inline-flex">
          Demo
        </span>
        <JumpToMenu />
        <PersonaMenu persona={persona} onPersonaChange={onPersonaChange} />
        <ThemeToggle />
        <AccountSummary currentUser={currentUser} />
        <Button
          variant="ghost"
          size="icon"
          onClick={onSignOut}
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
}
