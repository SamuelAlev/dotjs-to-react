import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: process.env.CI ? 'http://127.0.0.1:4173' : 'http://127.0.0.1:5173',
        trace: 'on-first-retry',
    },

    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: {
        command: 'pnpm preview',
        url: process.env.CI ? 'http://127.0.0.1:4173/' : 'http://127.0.0.1:5173/',
        timeout: 10 * 1000,
        reuseExistingServer: !process.env.CI,
    },
});
