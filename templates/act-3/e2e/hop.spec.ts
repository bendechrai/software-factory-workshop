import { expect, test } from "@playwright/test";

const code = `e2e-${Date.now().toString(36)}`;
const destination = "https://example.com/e2e/landing";

test("a link can be created, followed, and shows its click count", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "hop" })).toBeVisible();

  await page.getByLabel("Long URL").fill(destination);
  await page.getByLabel("Custom code (optional)").fill(code);
  await page.getByRole("button", { name: "Shorten" }).click();
  await expect(page.locator("#message")).toHaveText("Short link created.");

  const row = page.locator("#rows tr", { hasText: code });
  await expect(row).toHaveCount(1);
  await expect(row.locator("td.dest")).toHaveText(destination);
  await expect(row.locator("td.num")).toHaveText("0");

  // The destination is served by the test itself so the browser follows the
  // redirect without touching the network.
  await page.route(destination, (route) => route.fulfill({ body: "landed" }));
  await page.goto(`/${code}`);
  await expect(page).toHaveURL(destination);

  await page.goto("/");
  await expect(page.locator("#rows tr", { hasText: code }).locator("td.num")).toHaveText("1");
});
