import { expect, test, type Page } from "@playwright/test";

const editRoutineButton = (page: Page) =>
  page.locator(".bottom-nav button").nth(2);

test.beforeEach(async ({ page }) => {
  await page.goto("./");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("first launch can edit and save the active routine", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Routine 1" })).toBeVisible();
  await expect(page.getByText("Step 1", { exact: true })).toBeVisible();
  await expect(page.getByText("01:00", { exact: true })).toBeVisible();
  await editRoutineButton(page).click();
  await page.getByLabel("Routine name").fill("Morning intervals");
  await page.getByLabel("Step 1 name").fill("Focus");
  await page.getByRole("button", { name: "Save routine" }).click();
  await expect(
    page.getByRole("heading", { name: "Morning intervals" }),
  ).toBeVisible();
  await expect(page.getByText("Focus", { exact: true })).toBeVisible();
});

test("a running routine recovers after reload and completes", async ({ page }) => {
  const startPauseButton = page.locator(".primary-control");
  await editRoutineButton(page).click();
  await page.getByLabel("Minutes").selectOption("0");
  await page.getByLabel("Seconds").selectOption("2");
  await page.getByRole("button", { name: "Save routine" }).click();
  await startPauseButton.click();
  await expect(startPauseButton.locator(".play-symbol")).toHaveText("Ⅱ");
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.locator(".primary-control .play-symbol")).toHaveText("Ⅱ");
  await expect(page.getByText("Completed", { exact: true })).toBeVisible({
    timeout: 4_000,
  });
  await expect(page.getByText("00:00", { exact: true })).toBeVisible();
});

test("the precached app shell starts offline", async ({ page, context }) => {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Routine 1" })).toBeVisible();
});
