import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock3 } from "lucide-react";

import { ChatDemo } from "@/components/chat-demo";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireSessionContext } from "@/server/auth/session-context";

type PageProps = { params: Promise<{ feature: string }> };

const deferredFeatures: Record<string, { title: string; description: string }> = {
  wiki: {
    title: "Wiki",
    description: "Reusable playbooks and shared sales knowledge.",
  },
  meetings: {
    title: "Meetings",
    description: "Scheduling and recordings are outside the current CRM MVP.",
  },
  proposals: {
    title: "Proposals",
    description: "Proposal documents are deferred; use Inspections for the approved MVP workflow.",
  },
  partnerships: {
    title: "Partnerships",
    description: "Partner account management is planned after the CRM MVP.",
  },
  revenue: {
    title: "Revenue",
    description: "Advanced revenue reporting is deferred for this MVP.",
  },
  bills: {
    title: "Bills",
    description: "Billing is deferred for this MVP.",
  },
  catalog: {
    title: "Catalog",
    description: "The product and service catalog is planned for a later release.",
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { feature } = await params;
  return { title: feature === "chat" ? "CRM Copilot" : deferredFeatures[feature]?.title ?? "CRM" };
}

export default async function FeaturePage({ params }: PageProps) {
  const { feature } = await params;
  await requireSessionContext();
  if (feature === "chat") return <ChatDemo />;
  const deferred = deferredFeatures[feature];
  if (!deferred) notFound();
  return (
    <>
      <PageHeader title={deferred.title} description={deferred.description} />
      <Card className="max-w-3xl">
        <CardContent className="flex gap-4 py-8">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted"><Clock3 className="size-5 text-muted-foreground" /></div>
          <div><h2 className="font-medium">Deferred after MVP</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">This screen is intentionally read-only and performs no database mutations. The current MVP focuses on contacts, companies, leads, deals, tasks, inspections, users, the mock inbox, audit logs, and workspace settings.</p></div>
        </CardContent>
      </Card>
    </>
  );
}
