import { defineConfig, devices } from "@playwright/test";

const port = 3100;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
    testDir: "./tests/e2e",
    timeout: 60_000,
    fullyParallel: false,
    reporter: "list",
    use: {
        baseURL,
        trace: "retain-on-failure",
    },
    webServer: {
        command:
            'zsh -lc "cd apps/web && node --experimental-strip-types ../../packages/core/scripts/startup-check.mjs web && pnpm exec next dev --turbopack --port 3100"',
        url: baseURL,
        reuseExistingServer: true,
        stdout: "pipe",
        stderr: "pipe",
        env: {
            NODE_ENV: "test",
            DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:15432/cutbackground",
            BETTER_AUTH_SECRET:
                "7Tn4kQ1rX8mJ2cV9wP5dL0sH6fB3yN8uR4eZ1aK7qM9xC2vT6pW4jH8sL3dF0gY",
            BETTER_AUTH_URL: baseURL,
            NEXT_PUBLIC_BETTER_AUTH_URL: baseURL,
            ENABLE_BACKGROUND_QUEUE: "false",
            TOOL_EXECUTION_MODE: "mock",
            TOOL_MOCK_DELAY_MS: "150",
            NEXT_PUBLIC_SITE_DOMAIN: "localhost:3100",
            NEXT_PUBLIC_TOOL_NAME: "background-remover",
            TOOL_STORAGE_DIR: ".runtime/tool-assets-e2e",
        },
    },
    projects: [
        {
            name: "chromium",
            use: {
                ...devices["Desktop Chrome"],
            },
        },
    ],
});
