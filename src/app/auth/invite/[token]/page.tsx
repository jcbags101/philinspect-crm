import type { Metadata } from "next";
import { MailCheck, ShieldX } from "lucide-react";

import { InvitationAcceptForm } from "@/components/auth/invitation-accept-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getInvitationPreview } from "@/server/services/invitation-service";

export const metadata: Metadata = { title: "Workspace invitation" };

interface InvitationPageProps {
  params: Promise<{ token: string }>;
}

function UnavailableInvitation() {
  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <ShieldX className="mx-auto size-8 text-destructive" />
        <CardTitle>Invitation unavailable</CardTitle>
        <CardDescription>
          This link is invalid, expired, revoked, or was already used. Ask a
          workspace administrator for a new invitation.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { token } = await params;
  const preview = await getInvitationPreview(token).catch(() => null);
  const available =
    preview && preview.status === "pending" && !preview.expired;

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      {!available ? (
        <UnavailableInvitation />
      ) : (
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <MailCheck className="mx-auto size-8 text-primary" />
            <CardTitle>Join {preview.workspaceName}</CardTitle>
            <CardDescription>
              This invitation is for {preview.email} with the {preview.role.replaceAll("_", " ")} role.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InvitationAcceptForm token={token} />
          </CardContent>
        </Card>
      )}
    </main>
  );
}
