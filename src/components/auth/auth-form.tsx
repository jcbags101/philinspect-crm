"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { LoaderCircle, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";

interface AuthFormProps {
  mode: "sign-in" | "sign-up";
}

const subscribeToHydration = () => () => undefined;
const AUTH_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(
      () => reject(new Error(message)),
      AUTH_TIMEOUT_MS,
    );

    promise.then(
      (value) => {
        window.clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

async function readBootstrapResponse(response: Response): Promise<{
  error?: string;
  user?: { name: string; role: string };
} | null> {
  const body = (await response.json().catch(() => null)) as {
    error?: unknown;
    user?: { name?: unknown; role?: unknown };
  } | null;

  if (!body) return null;
  return {
    error: typeof body.error === "string" ? body.error : undefined,
    user:
      typeof body.user?.name === "string" &&
      typeof body.user.role === "string"
        ? { name: body.user.name, role: body.user.role }
        : undefined,
  };
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const mounted = useSyncExternalStore(subscribeToHydration, () => true, () => false);
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

    let authenticated = false;

    try {
      const result = await withTimeout(
        isSignUp
          ? authClient.signUp.email({
              email,
              password,
              name,
              callbackURL: "/",
            })
          : authClient.signIn.email({
              email,
              password,
              callbackURL: "/",
            }),
        "Authentication took too long. Please try again.",
      );

      if (result.error) {
        throw new Error(
          result.error.message || "Authentication failed. Please try again.",
        );
      }
      authenticated = true;

      const bootstrapResponse = await withTimeout(
        fetch("/api/session/bootstrap", {
          method: "POST",
          headers: { Accept: "application/json" },
        }),
        "Workspace setup took too long. Please sign in and try again.",
      );
      const bootstrapResult = await readBootstrapResponse(bootstrapResponse);
      if (!bootstrapResponse.ok || !bootstrapResult?.user) {
        throw new Error(
          bootstrapResult?.error ??
            "We could not finish setting up your workspace.",
        );
      }

      router.replace("/");
      router.refresh();
    } catch (submissionError) {
      const fallback = authenticated
        ? "Your account is ready, but workspace setup did not finish. Please sign in and try again."
        : "Authentication failed. Please try again.";
      setError(
        submissionError instanceof Error && submissionError.message
          ? submissionError.message
          : fallback,
      );
    } finally {
      setPending(false);
    }
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
          <Button className="w-full" type="submit" disabled={pending || !mounted}>
            {pending && <LoaderCircle className="animate-spin" />}
            {!mounted ? "Loading secure form…" : pending ? "Please wait" : isSignUp ? "Create account" : "Sign in"}
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
