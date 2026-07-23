import { expect, test, type Page } from "@playwright/test";

async function signUp(page: Page) {
  await page.goto("/auth/sign-up");
  await page.getByLabel("Name").fill("Inbox Test Agent");
  await page.getByLabel("Email").fill(`inbox-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`);
  await page.getByLabel("Password").fill("Fictional-demo-password-2026!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });
  await page.goto("/inbox");
  await expect(page.getByRole("heading", { name: "Unified inbox" })).toBeVisible();
}

test("persists mock messages, triage changes, tags, and notes", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await signUp(page);

  await expect(page.getByText("Demo — no external message sent")).toBeVisible();
  await page.getByRole("button", { name: "Instagram" }).click();
  await expect(page.getByRole("button", { name: /Fictional customer 03/ })).toBeVisible();
  await page.getByRole("button", { name: "All" }).click();
  await page.getByLabel("Search conversations").fill("Fictional customer 01");
  await page.getByRole("button", { name: /Fictional customer 01/ }).click();
  await expect(page.getByText("fixture-messenger-conversation-001")).toBeVisible();

  const marker = `POC persistence ${Date.now()}`;
  await page.getByPlaceholder("Write a fictional reply…").fill(marker);
  await page.getByRole("button", { name: "Send demo reply" }).click();
  await expect(page.locator("article").filter({ hasText: marker })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("article").getByText("Thanks! This is a deterministic fictional auto-reply for the demo.", { exact: true }).last()).toBeVisible({
    timeout: 30_000,
  });

  await page.getByLabel("Conversation status").selectOption("pending");
  await expect(page.getByLabel("Conversation status")).toHaveValue("pending", { timeout: 20_000 });
  await page.getByRole("button", { name: "VIP", exact: true }).click();
  const note = `Internal persistence note ${Date.now()}`;
  await page.getByPlaceholder("Visible only to your demo team").fill(note);
  await page.getByRole("button", { name: "Add internal note" }).click();
  await expect(page.locator("article").filter({ hasText: note })).toBeVisible({ timeout: 20_000 });

  await page.reload();
  await expect(page.locator("article").filter({ hasText: marker })).toBeVisible();
  await expect(page.locator("article").filter({ hasText: note })).toBeVisible();
  await expect(page.getByLabel("Conversation status")).toHaveValue("pending");
  expect(consoleErrors).toEqual([]);
});

test("retries a deterministic fail-once message without duplication", async ({ page }) => {
  await signUp(page);
  await page.getByLabel("Search conversations").fill("Fictional customer 04");
  await expect(page.getByRole("button", { name: /Fictional customer 04/ })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /Fictional customer 04/ }).click();
  await expect(page.getByText("fixture-instagram-conversation-004")).toBeVisible();

  const marker = `Fail once ${Date.now()}`;
  await page.getByPlaceholder("Write a fictional reply…").fill(marker);
  await page.getByRole("button", { name: "Send demo reply" }).click();
  const failedMessage = page.locator("article").filter({ hasText: marker });
  await expect(failedMessage).toBeVisible({ timeout: 20_000 });
  await expect(failedMessage.getByText("Simulated temporary delivery failure")).toBeVisible();
  await failedMessage.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(failedMessage.getByText("read", { exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("article").filter({ hasText: marker })).toHaveCount(1);
});
