import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  timeout: 5 * 60_000, // 5 min timeout for running every test
  fullyParallel: false,
  testDir: './src',
  workers: 1,
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' }
    }
  ]
};

export default config;
