"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import {
  isNavigationItemActive,
  navigationGroups,
  settingsNavigationItem,
  type NavigationItem,
} from "./navigation";

interface SidebarProps {
  collapsed: boolean;
  close?: () => void;
}

function Brand({ collapsed, close }: SidebarProps) {
  return (
    <Link
      href="/"
      onClick={close}
      className={cn(
        "pi-focus-ring flex h-14 items-center gap-2 rounded-lg",
        collapsed ? "justify-center px-2" : "px-3",
      )}
      aria-label={collapsed ? "PhilInspect CRM" : undefined}
    >
      <span
        aria-hidden="true"
        className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground"
      >
        P
      </span>
      {!collapsed && (
        <span className="min-w-0">
          <span className="pi-body-strong block truncate">PhilInspect</span>
          <span className="pi-caption block">Customer workspace</span>
        </span>
      )}
    </Link>
  );
}

function SidebarLink({
  item,
  pathname,
  collapsed,
  close,
}: {
  item: NavigationItem;
  pathname: string;
  collapsed: boolean;
  close?: () => void;
}) {
  const active = isNavigationItemActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={close}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "pi-focus-ring relative flex h-11 items-center gap-2 rounded-lg px-2.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:h-8",
        active &&
          "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary"
        />
      )}
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {!collapsed && <span className="pi-body-medium truncate">{item.label}</span>}
    </Link>
  );
}

export function Sidebar({ collapsed, close }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border px-2">
        <Brand collapsed={collapsed} close={close} />
      </div>

      <nav
        className="crm-scrollbar flex-1 overflow-y-auto px-2 py-3"
        aria-label="Main navigation"
      >
        <div className="space-y-4">
          {navigationGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="pi-eyebrow mb-1 px-2.5">{group.label}</p>
              )}
              {collapsed && <span className="sr-only">{group.label}</span>}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <SidebarLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    collapsed={collapsed}
                    close={close}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <SidebarLink
          item={settingsNavigationItem}
          pathname={pathname}
          collapsed={collapsed}
          close={close}
        />
      </div>
    </div>
  );
}
