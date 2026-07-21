"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LoaderCircle, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";

interface AuthFormProps {
  mode: "sign-in" | "sign-up";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSignUp = mode === "sign-up";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();

    const result = isSignUp
      ? await authClient.signUp.email({ email, password, name, callbackURL: "/" })
      : await authClient.signIn.email({ email, password, callbackURL: "/" });

    if (result.error) {
      setError(result.error.message || "Authentication failed. Please try again.");
      setPending(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md border-border/70 bg-card/95 shadow-2xl shadow-black/30">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[0_0_30px_rgba(37,99,235,.3)]">
          <LockKeyhole className="size-5" />
        </div>
        <div>
          <CardTitle className="text-2xl">{isSignUp ? "Create your staging account" : "Welcome back"}</CardTitle>
          <CardDescription className="mt-2">
            {isSignUp ? "Start a private PhilInspect CRM demo workspace." : "Sign in to the PhilInspect CRM staging demo."}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" autoComplete="name" required maxLength={160} placeholder="Your name" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete={isSignUp ? "new-password" : "current-password"} required minLength={8} />
            {isSignUp && <p className="text-xs text-muted-foreground">Use at least 8 characters.</p>}
          </div>
          {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <Button className="w-full" type="submit" disabled={pending}>
            {pending && <LoaderCircle className="animate-spin" />}
            {pending ? "Please wait" : isSignUp ? "Create account" : "Sign in"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignUp ? "Already have an account?" : "New to the demo?"}{" "}
          <Link className="font-medium text-primary hover:underline" href={isSignUp ? "/auth/sign-in" : "/auth/sign-up"}>
            {isSignUp ? "Sign in" : "Create an account"}
          </Link>
        </p>
        <p className="mt-4 text-center text-xs text-muted-foreground">Staging only · Fictional demo data · No external messages sent</p>
      </CardContent>
    </Card>
  );
}
