import { expect, test } from "@playwright/test";

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
}

test("protects the inbox and supports sign-up and sign-out", async ({ page }) => {
  await page.goto("/inbox");
  await expect(page).toHaveURL(/\/auth\/sign-in/);

  await page.getByRole("link", { name: "Create an account" }).click();
  await page.getByLabel("Name").fill("Playwright Demo User");
  await page.getByLabel("Email").fill(uniqueEmail("auth-smoke"));
  await page.getByLabel("Password").fill("Fictional-demo-password-2026!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });

  await page.goto("/inbox");
  await expect(page.getByRole("heading", { name: "Unified inbox" })).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/auth\/sign-in/);
});
