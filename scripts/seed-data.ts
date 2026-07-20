import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import {
  activities,
  auditLogs,
  billingMilestones,
  billingPlans,
  brands,
  catalogItems,
  communicationChannels,
  conversations,
  dealStageHistory,
  deals,
  demoSessions,
  integrationConnections,
  leads,
  meetings,
  messages,
  notes,
  partnershipAccounts,
  partnershipGroupMembers,
  partnershipGroups,
  proposals,
  proposalVersions,
  recordings,
  revenueEntries,
  revenueTargets,
  roles,
  userRoles,
  users,
} from "../src/db/schema";

config({ path: ".env.local" });

const fixedNow = new Date("2026-07-20T08:00:00.000Z");

function id(group: number, index: number): string {
  return `00000000-0000-4000-8000-${String(group * 1_000_000 + index).padStart(12, "0")}`;
}

function daysAgo(days: number): Date {
  return new Date(fixedNow.getTime() - days * 86_400_000);
}

const stages = [
  "lead",
  "discovery",
  "assessment",
  "demo_proposal",
  "follow_up",
  "parked",
  "won",
  "lost",
] as const;

const leadSegments = [
  "idea_rich_founder",
  "sme_going_digital",
  "corporate_innovator",
  "ph_startup_scaleup",
] as const;
const industries = [
  "Financial Services",
  "Consumer Goods",
  "Healthcare",
  "Real Estate",
  "Technology",
  "Logistics",
  "Education",
  "Hospitality",
];
const firstNames = [
  "Ari",
  "Bea",
  "Carlo",
  "Dani",
  "Eli",
  "Faye",
  "Gio",
  "Hana",
  "Ira",
  "Jules",
  "Kai",
  "Lia",
];
const lastNames = [
  "Santos",
  "Reyes",
  "Cruz",
  "Garcia",
  "Lim",
  "Tan",
  "Flores",
  "Mendoza",
];

export async function seedDemoData(): Promise<void> {
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("A Neon database URL is required.");

  const pool = new Pool({ connectionString, max: 1 });
  const db = drizzle(pool);

  try {
    await pool.query(`
      TRUNCATE TABLE
        audit_logs,
        billing_milestones,
        billing_plans,
        revenue_entries,
        revenue_targets,
        catalog_items,
        partnership_group_members,
        partnership_groups,
        partnership_accounts,
        proposal_versions,
        proposals,
        recordings,
        meetings,
        messages,
        conversations,
        communication_channels,
        attachments,
        notes,
        activities,
        deal_stage_history,
        deals,
        brands,
        leads,
        integration_connections,
        demo_sessions,
        user_roles,
        roles,
        users
      RESTART IDENTITY CASCADE
    `);

    const roleRows: (typeof roles.$inferInsert)[] = [
      { id: id(1, 1), name: "account_manager", label: "Account Manager" },
      { id: id(1, 2), name: "sales", label: "Sales" },
      { id: id(1, 3), name: "admin", label: "Admin" },
    ];
    await db.insert(roles).values(roleRows);

    const userRows: (typeof users.$inferInsert)[] = Array.from(
      { length: 12 },
      (_, index) => ({
        id: id(2, index + 1),
        name: `${firstNames[index]} ${lastNames[index % lastNames.length]}`,
        email: `${firstNames[index].toLowerCase()}@demo.symph.local`,
        createdAt: daysAgo(90 - index),
        updatedAt: daysAgo(index % 7),
      }),
    );
    await db.insert(users).values(userRows);
    await db.insert(userRoles).values(
      userRows.map((user, index) => ({
        userId: user.id!,
        roleId: roleRows[index === 11 ? 2 : index >= 8 ? 1 : 0].id!,
      })),
    );
    await db.insert(demoSessions).values({
      id: id(3, 1),
      activeUserId: userRows[0].id!,
      expiresAt: new Date("2030-01-01T00:00:00.000Z"),
    });

    const brandRows: (typeof brands.$inferInsert)[] = Array.from(
      { length: 148 },
      (_, index) => ({
        id: id(10, index + 1),
        name: `${["Northstar", "Harbor", "Cedar", "Orbit", "Summit", "Lumen", "Atlas", "River"][index % 8]} ${["Labs", "Foods", "Capital", "Health", "Works", "Group"][index % 6]} ${String(index + 1).padStart(3, "0")}`,
        domain: index % 3 === 0 ? `demo-brand-${index + 1}.example` : null,
        industry: industries[index % industries.length],
        ownerId: userRows[index % 8].id!,
        createdById: userRows[(index + 2) % 8].id!,
        createdAt: daysAgo(180 - (index % 160)),
        updatedAt: daysAgo(index % 20),
      }),
    );
    await db.insert(brands).values(brandRows);

    const leadRows: (typeof leads.$inferInsert)[] = Array.from(
      { length: 400 },
      (_, index) => ({
        id: id(11, index + 1),
        name: `${firstNames[index % firstNames.length]} ${lastNames[(index + 3) % lastNames.length]} ${index + 1}`,
        companyName: `Prospect Studio ${String(index + 1).padStart(3, "0")}`,
        email: `prospect${index + 1}@example.test`,
        phone: `+63 900 000 ${String(index + 1).padStart(4, "0")}`,
        industry: industries[index % industries.length],
        segment: leadSegments[index % leadSegments.length],
        status:
          index < 31
            ? "converted"
            : index % 5 === 0
              ? "followed_up"
              : index % 3 === 0
                ? "to_contact"
                : "new",
        ownerId: userRows[index % 8].id!,
        convertedAt: index < 31 ? daysAgo(index % 30) : null,
        createdAt: daysAgo(index % 120),
        updatedAt: daysAgo(index % 14),
      }),
    );
    await db.insert(leads).values(leadRows);

    const catalogRows: (typeof catalogItems.$inferInsert)[] = [
      ["Launchpad Suite", "product", "https://launchpad.example"],
      ["Signal Desk", "product", "https://signal.example"],
      ["Product Discovery", "service", null],
      ["Cloud Modernization", "service", null],
      ["Managed Delivery", "service", null],
      ["Northwind Partner", "reseller", null],
      ["Orbit Workspace", "reseller", null],
      ["Beacon Cloud", "reseller", null],
      ["Lumen Security", "reseller", "https://lumen.example"],
    ].map(([name, kind, landingPage], index) => ({
      id: id(12, index + 1),
      name: name as string,
      kind: kind as "product" | "service" | "reseller",
      landingPage: landingPage as string | null,
      createdAt: daysAgo(80 + index),
      updatedAt: daysAgo(index),
    }));
    await db.insert(catalogItems).values(catalogRows);

    const dealRows: (typeof deals.$inferInsert)[] = Array.from(
      { length: 163 },
      (_, index) => {
        const stage = stages[index % stages.length];
        const kind = index < 16 ? "product" : index < 137 ? "service" : "reseller";
        return {
          id: id(13, index + 1),
          title: `${brandRows[index % brandRows.length].name} — ${catalogRows[index % catalogRows.length].name}`,
          brandId: brandRows[index % brandRows.length].id!,
          sourceLeadId: index < 31 ? leadRows[index].id! : null,
          ownerId: userRows[index % 8].id!,
          stage,
          kind,
          value: stage === "lost" ? null : String(75_000 + (index % 24) * 125_000),
          currency: index % 23 === 0 ? "SGD" : "PHP",
          probability: [10, 25, 40, 60, 70, 30, 100, 0][index % 8],
          expectedCloseAt: new Date(2026, 6 + (index % 6), 5 + (index % 20)),
          createdAt: daysAgo(150 - (index % 120)),
          updatedAt: daysAgo(index % 18),
        };
      },
    );
    await db.insert(deals).values(dealRows);
    await db.insert(dealStageHistory).values(
      dealRows.map((deal, index) => ({
        id: id(14, index + 1),
        dealId: deal.id!,
        fromStage: null,
        toStage: deal.stage!,
        actorId: deal.ownerId!,
        changedAt: deal.updatedAt!,
      })),
    );

    await db.insert(activities).values(
      Array.from({ length: 180 }, (_, index) => ({
        id: id(15, index + 1),
        dealId: dealRows[index % dealRows.length].id!,
        brandId: dealRows[index % dealRows.length].brandId,
        actorId: userRows[index % 8].id!,
        type: ["call", "email", "meeting", "note", "system"][index % 5] as
          | "call"
          | "email"
          | "meeting"
          | "note"
          | "system",
        title: `Demo activity ${index + 1}`,
        body: "Fictional CRM activity generated for the product demonstration.",
        happenedAt: daysAgo(index % 45),
      })),
    );
    await db.insert(notes).values(
      Array.from({ length: 60 }, (_, index) => ({
        id: id(16, index + 1),
        dealId: dealRows[index % dealRows.length].id!,
        brandId: dealRows[index % dealRows.length].brandId,
        authorId: userRows[index % 8].id!,
        body: `Demo note ${index + 1}: follow up on the fictional stakeholder requirements.`,
        createdAt: daysAgo(index % 30),
        updatedAt: daysAgo(index % 30),
      })),
    );

    const channelRows: (typeof communicationChannels.$inferInsert)[] = [
      "email",
      "messenger",
      "instagram",
      "whatsapp",
      "viber",
    ].map((type, index) => ({
      id: id(20, index + 1),
      type: type as (typeof communicationChannels.$inferInsert)["type"],
      label: type[0].toUpperCase() + type.slice(1),
    }));
    await db.insert(communicationChannels).values(channelRows);

    const conversationRows: (typeof conversations.$inferInsert)[] = Array.from(
      { length: 30 },
      (_, index) => ({
        id: id(21, index + 1),
        channelId: channelRows[index % channelRows.length].id!,
        brandId: brandRows[index % brandRows.length].id!,
        subject: `Demo conversation ${index + 1}`,
        participantLabel: `Fictional contact ${index + 1}`,
        lastMessageAt: daysAgo(index % 15),
        unreadAt: index % 4 === 0 ? daysAgo(index % 15) : null,
        createdAt: daysAgo(45 - (index % 40)),
      }),
    );
    await db.insert(conversations).values(conversationRows);
    await db.insert(messages).values(
      Array.from({ length: 90 }, (_, index) => ({
        id: id(22, index + 1),
        conversationId: conversationRows[index % conversationRows.length].id!,
        senderLabel: index % 2 === 0 ? "Demo contact" : "Symph demo user",
        direction: index % 2 === 0 ? "inbound" : "outbound",
        body: `This is fictional demo message ${index + 1}.`,
        fixture: { simulated: true },
        sentAt: daysAgo(index % 20),
      })),
    );

    const meetingRows: (typeof meetings.$inferInsert)[] = Array.from(
      { length: 18 },
      (_, index) => ({
        id: id(23, index + 1),
        dealId: dealRows[index].id!,
        ownerId: userRows[index % 8].id!,
        title: `Discovery session ${index + 1}`,
        status: ["pending", "done", "failed"][index % 3] as
          | "pending"
          | "done"
          | "failed",
        startsAt: daysAgo(18 - index),
        notes: "Fictional meeting notes for the CRM POC.",
      }),
    );
    await db.insert(meetings).values(meetingRows);
    await db.insert(recordings).values(
      meetingRows.slice(0, 8).map((meeting, index) => ({
        id: id(24, index + 1),
        meetingId: meeting.id!,
        durationSeconds: String(900 + index * 120),
        transcript: "This is a simulated meeting transcript.",
        fixture: { simulated: true },
      })),
    );

    const proposalRows: (typeof proposals.$inferInsert)[] = Array.from(
      { length: 24 },
      (_, index) => ({
        id: id(25, index + 1),
        dealId: dealRows[index].id!,
        brandId: dealRows[index].brandId,
        ownerId: userRows[index % 8].id!,
        title: `Proposal ${String(index + 1).padStart(3, "0")}`,
        type: index % 2 === 0 ? "presentation" : "formal",
        status: ["draft", "sent", "signed"][index % 3] as
          | "draft"
          | "sent"
          | "signed",
        createdAt: daysAgo(40 - index),
        updatedAt: daysAgo(index % 10),
      }),
    );
    await db.insert(proposals).values(proposalRows);
    await db.insert(proposalVersions).values(
      proposalRows.map((proposal, index) => ({
        id: id(26, index + 1),
        proposalId: proposal.id!,
        version: "v1",
        fixture: { simulated: true, pages: 12 + (index % 8) },
      })),
    );

    const partnershipRows: (typeof partnershipAccounts.$inferInsert)[] =
      Array.from({ length: 12 }, (_, index) => ({
        id: id(27, index + 1),
        name: `Demo Partner ${index + 1}`,
        status: index % 3 === 0 ? "pending" : "approved",
      }));
    await db.insert(partnershipAccounts).values(partnershipRows);
    const groupRows: (typeof partnershipGroups.$inferInsert)[] = Array.from(
      { length: 3 },
      (_, index) => ({
        id: id(28, index + 1),
        name: ["Regional Partners", "Delivery Network", "Technology Alliance"][
          index
        ],
        createdById: userRows[8 + index].id!,
      }),
    );
    await db.insert(partnershipGroups).values(groupRows);
    await db.insert(partnershipGroupMembers).values(
      partnershipRows.map((account, index) => ({
        id: id(29, index + 1),
        groupId: groupRows[index % groupRows.length].id!,
        accountId: account.id!,
      })),
    );

    await db.insert(revenueTargets).values(
      Array.from({ length: 12 }, (_, index) => ({
        id: id(30, index + 1),
        year: 2026,
        month: index + 1,
        amount: "22000000.00",
        currency: "PHP",
      })),
    );
    const revenueRows: (typeof revenueEntries.$inferInsert)[] = Array.from(
      { length: 96 },
      (_, index) => ({
        id: id(31, index + 1),
        dealId: dealRows[index % dealRows.length].id!,
        catalogItemId: catalogRows[index % catalogRows.length].id!,
        month: `2026-${String((index % 8) + 5).padStart(2, "0")}-01`,
        amount: String(9_000 + (index % 18) * 90_000),
        currency: "PHP",
        isRecurring: index % 4 === 0,
      }),
    );
    await db.insert(revenueEntries).values(revenueRows);

    const billingRows: (typeof billingPlans.$inferInsert)[] = Array.from(
      { length: 3 },
      (_, index) => ({
        id: id(32, index + 1),
        dealId: dealRows[index + 10].id!,
        brandId: dealRows[index + 10].brandId,
        type: index === 0 ? "milestone" : "monthly",
        totalValue: String([9000, 15000, 50000][index]),
        monthlyValue: index === 0 ? null : String([0, 15000, 50000][index]),
        currency: "PHP",
        startsOn: "2026-06-08",
        endsOn: index === 0 ? "2026-07-06" : null,
      }),
    );
    await db.insert(billingPlans).values(billingRows);
    await db.insert(billingMilestones).values(
      Array.from({ length: 3 }, (_, index) => ({
        id: id(33, index + 1),
        billingPlanId: billingRows[0].id!,
        label: ["Kickoff", "Design approval", "Launch"][index],
        amount: "3000.00",
        dueOn: `2026-0${6 + index}-08`,
      })),
    );

    await db.insert(integrationConnections).values([
      {
        id: id(34, 1),
        provider: "google",
        status: "disconnected",
        fixture: { simulated: true },
      },
      ...["viber", "whatsapp", "messenger"].map((provider, index) => ({
        id: id(34, index + 2),
        provider,
        status: "coming_soon" as const,
        fixture: { simulated: true },
      })),
    ]);

    await db.insert(auditLogs).values(
      Array.from({ length: 1855 }, (_, index) => ({
        id: id(35, index + 1),
        actorId: userRows[index % userRows.length].id!,
        entityType: ["deal", "lead", "brand", "proposal", "billing"][index % 5],
        entityId: dealRows[index % dealRows.length].id!,
        action: ["created", "updated", "status"][index % 3] as
          | "created"
          | "updated"
          | "status",
        label: `Generated demo event ${index + 1}`,
        before: index % 3 === 0 ? null : { state: "previous" },
        after: { state: "current", simulated: true },
        via: "seed",
        createdAt: new Date(fixedNow.getTime() - index * 1_800_000),
      })),
    );
  } finally {
    await pool.end();
  }
}
