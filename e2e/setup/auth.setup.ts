import { test as setup } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { getStorageStatePath, getCurrentEnv, getShellUrl } from '../../src/config/environment';
import fs from 'fs';

const authFile = getStorageStatePath();
const currentEnv = getCurrentEnv();
const targetUrl = getShellUrl();
const MAX_TOKEN_AGE_MS = 25 * 60 * 1000; // 25 хвилин (безпечний ліміт до закінчення 30 хв сесії Creatio)

setup(`1. Перевірка та збереження токенів сесії для сервера [${currentEnv}]`, async ({ page }) => {
  // 1. Перевіряємо чи файл токенів вже існує і чи він "свіжий" (< 25 хв)
  if (fs.existsSync(authFile)) {
    try {
      const stats = fs.statSync(authFile);
      const ageMs = Date.now() - stats.mtimeMs;
      const ageMinutes = Math.round(ageMs / 60000);

      if (ageMs < MAX_TOKEN_AGE_MS) {
        console.log(`\n⚡ [Auth Cache] Знайдено дійсний токен сесії для сервера [${currentEnv}]!`);
        console.log(`   ⏳ Вік токена: ${ageMinutes} хв (ліміт: 25 хв). Логін пропущено, використовуємо збережений токен:`);
        console.log(`   ➔ ${authFile}\n`);
        return;
      } else {
        console.log(`\n⌛ [Auth Cache] Термін дії токена для [${currentEnv}] вичерпано (${ageMinutes} хв >= 25 хв). Оновлюємо сесію...`);
      }
    } catch (e) {
      console.warn('⚠️ [Auth Cache] Помилка перевірки файлу токена, виконуємо новий вхід.');
    }
  } else {
    console.log(`\n🔑 [Auth Setup] Файл токена відсутній. Виконуємо первинний логін для [${currentEnv}]: ${targetUrl}...`);
  }

  // 2. Виконуємо новий вхід
  const loginPage = new LoginPage(page);
  await page.goto(targetUrl);
  await page.waitForTimeout(2000);
  await loginPage.login();

  // 3. Зберігаємо оновлену сесію (cookies, localStorage, CSRF токени)
  await page.context().storageState({ path: authFile });
  console.log(`✅ [Auth Setup] Новий токен сесії для сервера [${currentEnv}] успішно збережено в:\n   ➔ ${authFile}\n`);
});
