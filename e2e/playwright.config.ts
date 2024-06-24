import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
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
