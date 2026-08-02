import type { LucideIcon } from "lucide-react";
import type { Permission } from "@/server/auth/permissions";
import {
  ArchiveRestore,
  BadgeDollarSign,
  BookOpen,
  Boxes,
  Building2,
  CalendarDays,
  CircleDollarSign,
  Handshake,
  Inbox,
  LayoutDashboard,
  MessageSquareText,
  ScrollText,
  Settings,
  Sparkles,
  Tags,
  UsersRound,
  ContactRound,
  ListTodo,
  ClipboardCheck,
} from "lucide-react";

export interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
  requiredPermission?: Permission;
}

export interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

export const navigationGroups: NavigationGroup[] = [
  {
    label: "Workspace",
    items: [
      { href: "/", label: "Overview", icon: LayoutDashboard },
      { href: "/chat", label: "Chat", icon: MessageSquareText },
    ],
  },
  {
    label: "CRM",
    items: [
      { href: "/leads", label: "Leads", icon: Sparkles, requiredPermission: "leads:read" },
      { href: "/deals", label: "Deals", icon: CircleDollarSign, requiredPermission: "deals:read" },
      { href: "/companies", label: "Companies", icon: Building2, requiredPermission: "companies:read" },
      { href: "/contacts", label: "Contacts", icon: ContactRound, requiredPermission: "contacts:read" },
      { href: "/tasks", label: "Tasks", icon: ListTodo, requiredPermission: "tasks:read" },
      { href: "/inspections", label: "Inspections", icon: ClipboardCheck, requiredPermission: "inspections:read" },
      { href: "/wiki", label: "Wiki", icon: BookOpen },
    ],
  },
  {
    label: "Engagement",
    items: [
      { href: "/inbox", label: "Inbox", icon: Inbox, requiredPermission: "inbox:read" },
      { href: "/meetings", label: "Meetings", icon: CalendarDays },
      { href: "/proposals", label: "Proposals", icon: ScrollText },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/partnerships", label: "Partnerships", icon: Handshake },
      { href: "/users", label: "Users", icon: UsersRound, requiredPermission: "members:read" },
      { href: "/revenue", label: "Revenue", icon: BadgeDollarSign },
      { href: "/bills", label: "Bills", icon: ArchiveRestore },
      { href: "/catalog", label: "Catalog", icon: Boxes },
      { href: "/audit-logs", label: "Audit logs", icon: Tags, requiredPermission: "audit:read" },
    ],
  },
];

export const settingsNavigationItem: NavigationItem = {
  href: "/settings",
  label: "Settings",
  icon: Settings,
  requiredPermission: "settings:manage",
};

export const allNavigationItems = [
  ...navigationGroups.flatMap((group) => group.items),
  settingsNavigationItem,
];

export function isNavigationItemActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function getCurrentNavigationItem(pathname: string) {
  return allNavigationItems.find((item) =>
    isNavigationItemActive(pathname, item.href),
  );
}
