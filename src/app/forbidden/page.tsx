import Link from "next/link";
import { ShieldX } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSessionContext } from "@/server/auth/session-context";

export const metadata = { title: "Access restricted" };

export default async function ForbiddenPage() {
  await requireSessionContext();

  return (
    <>
      <PageHeader
        eyebrow="Workspace security"
        title="Access restricted"
        description="Your account is signed in, but your current workspace role cannot open this page."
      />
      <Card className="max-w-xl">
        <CardHeader>
          <div className="mb-3 grid size-10 place-items-center rounded-lg bg-destructive/10 text-destructive">
            <ShieldX className="size-5" />
          </div>
          <CardTitle>Permission required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ask a workspace administrator if you need access. No data was changed.
          </p>
          <Link className={buttonVariants()} href="/">
            Return to dashboard
          </Link>
        </CardContent>
      </Card>
    </>
  );
}
