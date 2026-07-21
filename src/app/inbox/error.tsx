"use client";

import { Button } from "@/components/ui/button";

export default function InboxError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">The demo inbox could not load</h1>
        <p className="text-sm text-muted-foreground">Your data is still safe in staging. Try loading it again.</p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
