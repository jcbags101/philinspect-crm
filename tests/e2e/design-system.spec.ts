import { expect, test } from "@playwright/test"

test("renders the Figma-aligned design system and interactive states", async ({
  page,
}) => {
  const consoleErrors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text())
  })

  await page.goto("/design-system")

  await expect(
    page.getByRole("heading", { name: "PhilInspect design system" })
  ).toBeVisible()
  await expect(page.getByText("#2563EB")).toBeVisible()
  await expect(page.getByRole("button", { name: "Create lead" })).toBeVisible()

  await page.getByRole("tab", { name: "Won 4" }).click()
  await expect(
    page.getByText("Four opportunities closed successfully.")
  ).toBeVisible()

  await page.getByLabel("Filter deals").fill("Northstar")
  await expect(page.getByRole("cell", { name: "Northstar Logistics" })).toBeVisible()
  await expect(page.getByRole("cell", { name: "Bayan Retail Group" })).toBeHidden()

  expect(consoleErrors).toEqual([])
})

test("keeps the design system usable at the mobile breakpoint", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/design-system")

  await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "PhilInspect design system" })
  ).toBeVisible()
  await expect(page.getByLabel("Filter deals")).toBeVisible()
})
