import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { getBaseUrl, getStorageStatePath } from './src/config/environment';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const BASE_URL = getBaseUrl();
const STORAGE_STATE = getStorageStatePath();

export default defineConfig({
  testDir: './',
  globalSetup: './src/utils/globalSetup.ts',
  globalTeardown: './src/utils/generateAndSendReport.ts',
  timeout: 90000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results.json' }],
  ],

  use: {
    baseURL: BASE_URL,
    actionTimeout: 15000,
    navigationTimeout: 60000,
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'retain-on-failure',
    viewport: { width: 1920, height: 1080 },
  },

  projects: [
    // 1. Однократна авторизація для поточного сервера (main або main2)
    {
      name: 'setup',
      testMatch: /e2e\/setup\/auth\.setup\.ts/,
    },
    // 2. Тестові сценарії e2e
    {
      name: 'chromium',
      testMatch: /e2e\/(functional|validation)\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: ['--start-maximized'],
        },
      },
      dependencies: ['setup'],
    },
    // 3. Скрипти сидингу даних
    {
      name: 'seeds',
      testMatch: /scripts\/seeds\/.*\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: ['--start-maximized'],
        },
      },
      dependencies: ['setup'],
    },
  ],
});
