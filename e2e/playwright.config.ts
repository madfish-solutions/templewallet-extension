import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  timeout: 1000 * 5 * 60, // 5 min duration of running every test
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
