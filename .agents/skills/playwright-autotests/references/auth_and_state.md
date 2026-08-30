# Authentication and State Sharing in Playwright

Logging into an application before every single test adds immense execution time and creates unnecessary load on auth servers. Playwright solves this using `storageState`.

---

## 1. How StorageState Works

1. **Setup Project**: Runs once before test projects. Authenticates via UI or API.
2. **Context Serialization**: Saves all cookies, localStorage, and sessionStorage items into a JSON file (`storageState.json`).
3. **Project Dependency**: Test projects declare `dependencies: ['setup']` and specify `storageState: 'storageState.json'`.
4. **Pre-Authenticated Context**: Every worker thread starts directly inside an authenticated browser context without hitting the login page.

---

## 2. Configuration Setup in `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const STORAGE_STATE = path.resolve(__dirname, 'storageState.json');

export default defineConfig({
  projects: [
    // 1. Auth Setup Project (runs first)
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // 2. Functional & E2E Tests (runs with preloaded state)
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
      },
    },
  ],
});
```

---

## 3. Auth Setup Script (`auth.setup.ts`)

```typescript
import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/LoginPage';

const authFile = 'storageState.json';

setup('authenticate and save storage state', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.login(process.env.USER_NAME!, process.env.USER_PASSWORD!);

  // Verify successful authentication
  await expect(page.locator('.user-avatar, #shell-header')).toBeVisible({ timeout: 20000 });

  // Save session state
  await page.context().storageState({ path: authFile });
});
```

---

## 4. Multi-Environment & Multi-Role Authentication

When testing across multiple environments (e.g. `main`, `main2`) or roles (`Admin`, `Supervisor`, `Operator`):

```typescript
// Dynamically resolve storageState path per role or environment
const env = process.env.ENV || 'main';
const role = process.env.ROLE || 'admin';
const authFile = `storageState-${env}-${role}.json`;
```
