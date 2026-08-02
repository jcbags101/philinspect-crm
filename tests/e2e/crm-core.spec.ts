import { expect, test, type Page } from "@playwright/test";

import { readCredentials, signIn } from "./helpers/auth";

const adminCredentials = readCredentials("PLAYWRIGHT_ADMIN");
const salesCredentials = readCredentials("PLAYWRIGHT_SALES");
const allowMutations = process.env.PLAYWRIGHT_ALLOW_MUTATIONS === "1";

async function archiveEntity(page: Page, url: string, label: string) {
  await page.goto(url);
  await page.getByRole("button", { name: `Archive ${label}` }).click();
  await expect(page.getByRole("button", { name: `Restore ${label}` })).toBeVisible();
}

test("admin completes the core CRM workflow", async ({ page }) => {
  test.skip(!adminCredentials, "Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD.");
  test.skip(!allowMutations, "Set PLAYWRIGHT_ALLOW_MUTATIONS=1 for the recoverable CRM acceptance flow.");
  if (!adminCredentials) return;

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const company = `E2E Company ${suffix}`;
  const contactFirst = "E2E";
  const contactLast = `Contact ${suffix}`;
  const contact = `${contactFirst} ${contactLast}`;
  const lead = `E2E Lead ${suffix}`;
  const deal = `E2E Deal ${suffix}`;
  const task = `E2E Task ${suffix}`;
  const inspection = `E2E Inspection ${suffix}`;

  await signIn(page, adminCredentials);

  await page.goto("/companies/new");
  await page.getByLabel("Company name").fill(company);
  await page.getByLabel("Industry").fill("Inspection services");
  await page.getByRole("button", { name: "Save company" }).click();
  await expect(page.getByRole("heading", { name: company })).toBeVisible();
  const companyUrl = page.url();

  await page.goto("/contacts/new");
  await page.getByLabel("First name").fill(contactFirst);
  await page.getByLabel("Last name").fill(contactLast);
  await page.getByLabel("Email").fill(`e2e-${suffix}@example.test`);
  await page.getByLabel("Company").selectOption({ label: company });
  await page.getByRole("button", { name: "Save contact" }).click();
  await expect(page.getByRole("heading", { name: contact })).toBeVisible();
  const contactUrl = page.url();

  await page.goto("/leads/new");
  await page.getByLabel("Contact name").fill(lead);
  await page.getByLabel("Company name").fill(company);
  await page.getByLabel("Linked company").selectOption({ label: company });
  await page.getByLabel("Linked contact").selectOption({ label: contact });
  await page.getByRole("button", { name: "Save lead" }).click();
  await expect(page.getByRole("heading", { name: lead })).toBeVisible();
  const leadUrl = page.url();

  await page.goto("/deals/new");
  await page.getByLabel("Deal title").fill(deal);
  await page.getByLabel("Company", { exact: true }).selectOption({ label: company });
  await page.getByLabel("Primary contact").selectOption({ label: contact });
  await page.getByLabel("Value").fill("250000");
  await page.getByRole("button", { name: "Save deal" }).click();
  await expect(page.getByRole("heading", { name: deal })).toBeVisible();
  const dealUrl = page.url();

  const stageSelect = page.getByLabel("Move to stage");
  const currentStage = await stageSelect.inputValue();
  const stageValues = await stageSelect.locator("option").evaluateAll((options) =>
    options.map((option) => (option as HTMLOptionElement).value),
  );
  const targetStage = stageValues.find((value) => value !== currentStage);
  expect(targetStage).toBeTruthy();
  await stageSelect.selectOption(targetStage!);
  await page.getByRole("button", { name: "Move stage" }).click();
  await expect(stageSelect).toHaveValue(targetStage!);

  await page.goto("/tasks/new");
  await page.getByLabel("Task title").fill(task);
  await page.getByLabel("Priority").selectOption("high");
  await page.getByRole("button", { name: "Save task" }).click();
  await expect(page.getByRole("heading", { name: task })).toBeVisible();
  const taskUrl = page.url();

  await page.goto("/inspections/new");
  await page.getByLabel("Inspection title").fill(inspection);
  await page.getByLabel("Company", { exact: true }).selectOption({ label: company });
  await page.getByLabel("Primary contact").selectOption({ label: contact });
  await page.getByLabel("Related deal").selectOption({ label: deal });
  await page.getByLabel("Status").selectOption("scheduled");
  await page.getByRole("button", { name: "Save inspection" }).click();
  await expect(page.getByRole("heading", { name: inspection })).toBeVisible();
  const inspectionUrl = page.url();
  await page.getByRole("link", { name: "View report" }).click();
  await expect(page.getByRole("heading", { name: /Inspection report/ })).toBeVisible();

  await archiveEntity(page, inspectionUrl, inspection);
  await archiveEntity(page, taskUrl, task);
  await archiveEntity(page, dealUrl, deal);
  await archiveEntity(page, leadUrl, lead);
  await archiveEntity(page, contactUrl, contact);
  await archiveEntity(page, companyUrl, company);
});

test("sales user is routed to the forbidden screen for manager-only pages", async ({ page }) => {
  test.skip(!salesCredentials, "Set PLAYWRIGHT_SALES_EMAIL and PLAYWRIGHT_SALES_PASSWORD.");
  if (!salesCredentials) return;

  await signIn(page, salesCredentials);
  await page.goto("/companies/new");
  await expect(page).toHaveURL(/\/forbidden$/);
  await expect(page.getByRole("heading", { name: "Access restricted" })).toBeVisible();
  await expect(page.getByText("No data was changed.")).toBeVisible();

  await page.goto("/users");
  await expect(page).toHaveURL(/\/forbidden$/);
});
