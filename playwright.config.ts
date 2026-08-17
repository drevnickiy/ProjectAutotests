import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const BASE_URL = process.env.BASE_URL || 'https://xlab-analyst-main.poligon.crmgenesis.com/';
const STORAGE_STATE = path.resolve(__dirname, 'storageState.json');

export default defineConfig({
  testDir: './e2e',
  globalSetup: './src/utils/globalSetup.ts',
  globalTeardown: './src/utils/generateAndSendReport.ts', // Автоматическая генерация и отправка отчета на почту после каждого прогона
  timeout: 90000,
  expect: {
    timeout: 10000
  },
  fullyParallel: false, // Последовательное выполнение сценариев
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1, // 1 воркер для максимальной стабильности сессий Creatio
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results.json' }]
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
    // 1. Однократная авторизация и сохранение токена
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // 2. Последовательный прогон с готовыми токенами
    {
      name: 'chromium',
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
