import { expect, test } from "@playwright/test";

test("visitor can complete the common-wish Bhai Dooj journey", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /some bonds are forever/i })).toBeVisible();

  await page.getByRole("button", { name: /open your surprise/i }).click();
  await page.getByLabel("Your name").fill("Riya");
  await page.getByRole("button", { name: /that's me/i }).click();
  await expect(page.getByRole("heading", { name: "Dear Riya," })).toBeVisible();
  await expect(page.getByText(/This little surprise is for you/)).toBeVisible();

  await page.getByRole("button", { name: /our bond, our story/i }).click();
  await expect(page.getByRole("heading", { name: /a bond beyond words/i })).toBeVisible();
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByRole("button", { name: /a note from me/i }).click();
  await expect(page.getByRole("heading", { name: /your brother/i })).toBeVisible();
  await page.getByRole("button", { name: /one last thing/i }).click();
  await expect(page.getByRole("heading", { name: /happy bhai dooj/i })).toBeVisible();
});

test("name form validates empty input", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /open your surprise/i }).click();
  await page.getByRole("button", { name: /that's me/i }).click();
  await expect(page.getByRole("alert")).toContainText("Please enter your name");
});
