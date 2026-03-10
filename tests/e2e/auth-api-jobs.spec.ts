import { expect, test } from "@playwright/test";
import { markUserEmailVerified, resetE2EDatabase } from "./helpers/db";

const tinyPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9pN8WnQAAAAASUVORK5CYII=",
    "base64"
);

test.describe("auth, api keys, and job lifecycle", () => {
    test.beforeEach(async () => {
        await resetE2EDatabase();
    });

    test("signs up, signs in, creates an API key, and runs a job", async ({ page }) => {
        const email = `e2e-${Date.now()}@example.com`;
        const password = "Password123!";

        await page.goto("/signup");
        await page.getByTestId("signup-name").fill("E2E User");
        await page.getByTestId("signup-email").fill(email);
        await page.getByTestId("signup-password").fill(password);
        await page.getByTestId("signup-confirm-password").fill(password);
        await page.getByTestId("signup-submit").click();

        await page.waitForURL(/verify-email/, { timeout: 15_000 });
        await markUserEmailVerified(email);

        await page.goto("/login");

        await page.getByTestId("login-email").fill(email);
        await page.getByTestId("login-password").fill(password);
        await page.getByTestId("login-submit").click();

        await page.waitForURL(/dashboard/, { timeout: 20_000 });
        await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible({ timeout: 20_000 });
        await page.goto("/dashboard/api-keys");
        await expect(
            page.getByRole("heading", { name: "API keys", exact: true, level: 1 })
        ).toBeVisible({ timeout: 15_000 });

        await page.getByTestId("api-key-name").fill("E2E Key");
        await page.getByTestId("api-key-create").click();
        await expect(page.getByTestId("api-key-secret")).toContainText("cb_live_", {
            timeout: 20_000,
        });

        await page.goto("/background-remover");
        await page.setInputFiles('[data-testid="tool-file-input"]', {
            name: "sample.png",
            mimeType: "image/png",
            buffer: tinyPng,
        });
        await page.getByTestId("tool-run").click();

        await expect(page.getByTestId("tool-output-preview")).toBeVisible({
            timeout: 20_000,
        });
        await expect(page.getByTestId("tool-download-output")).toBeVisible({
            timeout: 20_000,
        });
    });
});
