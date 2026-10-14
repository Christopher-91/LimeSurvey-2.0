import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npm run dev --workspace=server',
      port: 5001,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev --workspace=client',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
