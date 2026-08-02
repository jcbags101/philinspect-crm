import { expect, type Page } from "@playwright/test";

export interface TestCredentials {
  email: string;
  password: string;
}

export function readCredentials(
  prefix: "PLAYWRIGHT_ADMIN" | "PLAYWRIGHT_SALES",
): TestCredentials | null {
  const email = process.env[`${prefix}_EMAIL`]?.trim();
  const password = process.env[`${prefix}_PASSWORD`];
  return email && password ? { email, password } : null;
}

export async function signIn(
  page: Page,
  credentials: TestCredentials,
): Promise<void> {
  await page.goto("/auth/sign-in");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible();
}
