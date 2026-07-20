"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="grid min-h-[60vh] place-items-center"><div className="max-w-md text-center"><div className="mx-auto grid size-12 place-items-center rounded-full bg-destructive/15 text-destructive"><AlertTriangle /></div><h1 className="mt-4 text-xl font-semibold">Couldn’t load this view</h1><p className="mt-2 text-sm text-muted-foreground">The demo database may be waking up. Try once more in a moment.</p><Button className="mt-5" onClick={reset}>Try again</Button></div></div>;
}
