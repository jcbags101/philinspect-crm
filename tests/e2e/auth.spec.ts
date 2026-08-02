import { expect, test } from "@playwright/test";

test("protects CRM routes and keeps failed authentication responsive", async ({ page }) => {
  await page.goto("/inbox");
  await expect(page).toHaveURL(/\/auth\/sign-in/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

  await page.getByLabel("Email").fill(`missing-${Date.now()}@example.test`);
  await page.getByLabel("Password").fill("Invalid-demo-password-2026!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert")).toBeVisible({ timeout: 25_000 });
  await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();

  await page.getByRole("link", { name: "Create an account" }).click();
  await expect(page).toHaveURL(/\/auth\/sign-up/);
  await expect(page.getByText("Create an identity, then accept an invitation")).toBeVisible();
});
