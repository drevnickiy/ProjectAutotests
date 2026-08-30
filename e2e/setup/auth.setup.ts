import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { getBaseUrl, getStorageStatePath, getCurrentEnv, getShellUrl } from '../../src/config/environment';

const authFile = getStorageStatePath();
const currentEnv = getCurrentEnv();
const targetUrl = getShellUrl();

setup(`1. Однократна авторизація для сервера [${currentEnv}] та збереження токенів`, async ({ page }) => {
  console.log(`\n🔑 [Auth Setup] Однократний запуск логіну для сервера [${currentEnv}]: ${targetUrl}...`);
  const loginPage = new LoginPage(page);
  await page.goto(targetUrl);
  await page.waitForTimeout(2000);
  await loginPage.login('Supervisor', 'Supervisor');

  // Зберігаємо сесію (cookies, localStorage, CSRF токени) у файл storageState для конкретного сервера
  await page.context().storageState({ path: authFile });
  console.log(`✅ [Auth Setup] Сесія та токени сервера [${currentEnv}] успішно збережені в:\n   ➔ ${authFile}\n`);
});
