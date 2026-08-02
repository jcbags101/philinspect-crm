import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Workspace access required" };

export default function AccessDeniedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 grid size-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-700">
            <ShieldAlert className="size-5" />
          </div>
          <CardTitle>Workspace invitation required</CardTitle>
          <CardDescription>
            Your identity is authenticated, but it is not an active member of a
            PhilInspect CRM workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center text-sm text-muted-foreground">
          <p>
            Ask a workspace administrator to invite this email address, then
            open the invitation link.
          </p>
          <Link className={buttonVariants({ variant: "outline" })} href="/auth/sign-in">
            Return to sign in
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
