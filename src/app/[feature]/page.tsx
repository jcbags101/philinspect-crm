import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { desc, eq, isNull } from "drizzle-orm";

import { ChatDemo } from "@/components/chat-demo";
import { DealBoard } from "@/components/deal-board";
import { RecordsView, type RecordColumn, type RecordRow } from "@/components/records-view";
import { getDb } from "@/db/client";
import {
  auditLogs, billingPlans, companies, catalogItems,
  deals, integrationConnections, leads, meetings, partnershipAccounts, proposals,
  revenueEntries, roles, userRoles, users,
} from "@/db/schema";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ feature: string }> };
type View = { title: string; description: string; noun: string; columns: RecordColumn[]; rows: RecordRow[]; compact?: boolean };

const titles: Record<string, string> = {
  chat: "CRM Copilot", leads: "Leads", deals: "Deals", brands: "Companies", companies: "Companies", wiki: "Wiki",
  inbox: "Inbox", meetings: "Meetings", proposals: "Proposals", partnerships: "Partnerships",
  users: "Users", revenue: "Revenue", bills: "Bills", catalog: "Catalog", "audit-logs": "Audit logs", settings: "Settings",
};

const date = (value: Date | string | null) => value ? new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)) : "—";
const money = (value: string | number | null, currency = "PHP") => value ? new Intl.NumberFormat("en-PH", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value)) : "—";
const label = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { feature } = await params;
  return { title: titles[feature] ?? "CRM" };
}

async function loadView(feature: string): Promise<View | null> {
  const db = getDb();

  if (feature === "leads") {
    const rows = await db.select({ id: leads.id, name: leads.name, company: leads.companyName, segment: leads.segment, status: leads.status, industry: leads.industry, owner: users.name, createdAt: leads.createdAt }).from(leads).leftJoin(users, eq(leads.ownerId, users.id)).where(isNull(leads.deletedAt)).orderBy(desc(leads.updatedAt)).limit(100);
    return { title: "Leads", description: "Capture, qualify, and convert potential customers.", noun: "lead", columns: [{ key: "name", label: "Contact" }, { key: "company", label: "Company" }, { key: "segment", label: "Segment", badge: true }, { key: "status", label: "Status", badge: true }, { key: "industry", label: "Industry" }, { key: "owner", label: "Owner" }, { key: "created", label: "Created" }], rows: rows.map((row) => ({ id: row.id, name: row.name, company: row.company, segment: label(row.segment), status: label(row.status), industry: row.industry, owner: row.owner, created: date(row.createdAt) })) };
  }

  if (feature === "brands" || feature === "companies") {
    const rows = await db.select({ id: companies.id, name: companies.name, domain: companies.domain, industry: companies.industry, owner: users.name, updatedAt: companies.updatedAt }).from(companies).leftJoin(users, eq(companies.ownerId, users.id)).where(isNull(companies.deletedAt)).orderBy(companies.name).limit(100);
    return { title: "Companies", description: "A shared view of every customer organization and relationship.", noun: "company", columns: [{ key: "name", label: "Company" }, { key: "domain", label: "Website" }, { key: "industry", label: "Industry", badge: true }, { key: "owner", label: "Account owner" }, { key: "updated", label: "Last updated" }], rows: rows.map((row) => ({ id: row.id, name: row.name, domain: row.domain, industry: row.industry, owner: row.owner, updated: date(row.updatedAt) })) };
  }

  if (feature === "meetings") {
    const rows = await db.select({ id: meetings.id, title: meetings.title, status: meetings.status, startsAt: meetings.startsAt, owner: users.name, deal: deals.title }).from(meetings).innerJoin(users, eq(meetings.ownerId, users.id)).leftJoin(deals, eq(meetings.dealId, deals.id)).orderBy(desc(meetings.startsAt));
    return { title: "Meetings", description: "Schedule calls and keep recordings tied to each deal.", noun: "meeting", columns: [{ key: "title", label: "Meeting" }, { key: "deal", label: "Deal" }, { key: "owner", label: "Owner" }, { key: "status", label: "Status", badge: true }, { key: "starts", label: "Starts" }], rows: rows.map((row) => ({ id: row.id, title: row.title, deal: row.deal, owner: row.owner, status: label(row.status), starts: date(row.startsAt) })) };
  }

  if (feature === "proposals") {
    const rows = await db.select({ id: proposals.id, title: proposals.title, type: proposals.type, status: proposals.status, brand: companies.name, owner: users.name, updatedAt: proposals.updatedAt }).from(proposals).innerJoin(companies, eq(proposals.companyId, companies.id)).innerJoin(users, eq(proposals.ownerId, users.id)).orderBy(desc(proposals.updatedAt));
    return { title: "Proposals", description: "Build, version, send, and track customer proposals.", noun: "proposal", columns: [{ key: "title", label: "Proposal" }, { key: "brand", label: "Brand" }, { key: "type", label: "Format", badge: true }, { key: "status", label: "Status", badge: true }, { key: "owner", label: "Owner" }, { key: "updated", label: "Updated" }], rows: rows.map((row) => ({ id: row.id, title: row.title, brand: row.brand, type: label(row.type), status: label(row.status), owner: row.owner, updated: date(row.updatedAt) })) };
  }

  if (feature === "partnerships") {
    const rows = await db.select().from(partnershipAccounts).orderBy(partnershipAccounts.name);
    return { title: "Partnerships", description: "Manage partner accounts and relationship groups.", noun: "partner", columns: [{ key: "name", label: "Partner account" }, { key: "status", label: "Approval", badge: true }, { key: "created", label: "Created" }], rows: rows.map((row) => ({ id: row.id, name: row.name, status: label(row.status), created: date(row.createdAt) })) };
  }

  if (feature === "users") {
    const rows = await db.select({ id: users.id, name: users.name, email: users.email, role: roles.label, createdAt: users.createdAt }).from(users).leftJoin(userRoles, eq(users.id, userRoles.userId)).leftJoin(roles, eq(userRoles.roleId, roles.id)).orderBy(users.name);
    return { title: "Users", description: "Manage demo workspace members and role-based access.", noun: "user", columns: [{ key: "name", label: "Name" }, { key: "email", label: "Email" }, { key: "role", label: "Role", badge: true }, { key: "created", label: "Joined" }], rows: rows.map((row) => ({ id: row.id, name: row.name, email: row.email, role: row.role, created: date(row.createdAt) })) };
  }

  if (feature === "revenue") {
    const rows = await db.select({ id: revenueEntries.id, deal: deals.title, amount: revenueEntries.amount, currency: revenueEntries.currency, month: revenueEntries.month, isRecurring: revenueEntries.isRecurring }).from(revenueEntries).innerJoin(deals, eq(revenueEntries.dealId, deals.id)).orderBy(desc(revenueEntries.month)).limit(100);
    return { title: "Revenue", description: "Track booked revenue against monthly targets.", noun: "revenue entry", columns: [{ key: "deal", label: "Deal" }, { key: "month", label: "Month" }, { key: "type", label: "Type", badge: true }, { key: "amount", label: "Amount", align: "right" }], rows: rows.map((row) => ({ id: row.id, deal: row.deal, month: date(row.month), type: row.isRecurring ? "Recurring" : "One-time", amount: money(row.amount, row.currency) })) };
  }

  if (feature === "bills") {
    const rows = await db.select({ id: billingPlans.id, deal: deals.title, brand: companies.name, type: billingPlans.type, totalValue: billingPlans.totalValue, monthlyValue: billingPlans.monthlyValue, currency: billingPlans.currency, startsOn: billingPlans.startsOn }).from(billingPlans).innerJoin(deals, eq(billingPlans.dealId, deals.id)).innerJoin(companies, eq(billingPlans.companyId, companies.id)).where(isNull(billingPlans.deletedAt)).orderBy(desc(billingPlans.createdAt));
    return { title: "Bills", description: "Plan monthly and milestone billing for won work.", noun: "billing plan", columns: [{ key: "brand", label: "Brand" }, { key: "deal", label: "Deal" }, { key: "type", label: "Billing", badge: true }, { key: "starts", label: "Starts" }, { key: "monthly", label: "Monthly", align: "right" }, { key: "total", label: "Total", align: "right" }], rows: rows.map((row) => ({ id: row.id, brand: row.brand, deal: row.deal, type: label(row.type), starts: date(row.startsOn), monthly: money(row.monthlyValue, row.currency), total: money(row.totalValue, row.currency) })) };
  }

  if (feature === "catalog") {
    const rows = await db.select().from(catalogItems).where(isNull(catalogItems.deletedAt)).orderBy(catalogItems.kind, catalogItems.name);
    return { title: "Catalog", description: "Products, services, and reseller offers available to your team.", noun: "catalog item", columns: [{ key: "name", label: "Offering" }, { key: "kind", label: "Type", badge: true }, { key: "landingPage", label: "Landing page" }, { key: "state", label: "State", badge: true }, { key: "updated", label: "Updated" }], rows: rows.map((row) => ({ id: row.id, name: row.name, kind: label(row.kind), landingPage: row.landingPage, state: row.isActive ? "Active" : "Inactive", updated: date(row.updatedAt) })) };
  }

  if (feature === "audit-logs") {
    const rows = await db.select({ id: auditLogs.id, label: auditLogs.label, action: auditLogs.action, entityType: auditLogs.entityType, actor: users.name, via: auditLogs.via, createdAt: auditLogs.createdAt }).from(auditLogs).leftJoin(users, eq(auditLogs.actorId, users.id)).orderBy(desc(auditLogs.createdAt)).limit(100);
    return { title: "Audit logs", description: "A transparent history of important workspace changes.", noun: "audit event", compact: true, columns: [{ key: "label", label: "Event" }, { key: "entity", label: "Entity", badge: true }, { key: "action", label: "Action", badge: true }, { key: "actor", label: "Actor" }, { key: "via", label: "Source" }, { key: "created", label: "Timestamp" }], rows: rows.map((row) => ({ id: row.id, label: row.label, entity: label(row.entityType), action: label(row.action), actor: row.actor, via: row.via, created: date(row.createdAt) })) };
  }

  if (feature === "settings") {
    const rows = await db.select().from(integrationConnections).orderBy(integrationConnections.provider);
    return { title: "Settings", description: "Configure integrations and workspace defaults for this demo.", noun: "integration", columns: [{ key: "provider", label: "Integration" }, { key: "status", label: "Connection", badge: true }, { key: "updated", label: "Last checked" }], rows: rows.map((row) => ({ id: row.id, provider: row.provider, status: label(row.status), updated: date(row.updatedAt) })) };
  }

  if (feature === "wiki") {
    return { title: "Wiki", description: "Reusable playbooks and shared sales knowledge.", noun: "article", columns: [{ key: "title", label: "Article" }, { key: "category", label: "Collection", badge: true }, { key: "owner", label: "Owner" }, { key: "updated", label: "Updated" }], rows: [
      { id: "1", title: "Discovery call playbook", category: "Sales process", owner: "Ari Santos", updated: "Jul 18, 2026" },
      { id: "2", title: "Enterprise qualification guide", category: "Qualification", owner: "Bea Reyes", updated: "Jul 16, 2026" },
      { id: "3", title: "Proposal review checklist", category: "Proposals", owner: "Carlo Cruz", updated: "Jul 12, 2026" },
      { id: "4", title: "Customer handoff template", category: "Delivery", owner: "Dani Garcia", updated: "Jul 9, 2026" },
    ] };
  }

  return null;
}

export default async function FeaturePage({ params }: PageProps) {
  const { feature } = await params;
  if (feature === "chat") return <ChatDemo />;
  if (feature === "deals") {
    const db = getDb();
    const rows = await db.select({ id: deals.id, title: deals.title, stage: deals.stage, kind: deals.kind, value: deals.value, brand: companies.name, owner: users.name }).from(deals).innerJoin(companies, eq(deals.companyId, companies.id)).innerJoin(users, eq(deals.ownerId, users.id)).where(isNull(deals.deletedAt)).orderBy(desc(deals.updatedAt));
    return <DealBoard deals={rows.map((row) => ({ ...row, value: Number(row.value ?? 0) }))} />;
  }
  const view = await loadView(feature);
  if (!view) notFound();
  return <RecordsView {...view} />;
}
