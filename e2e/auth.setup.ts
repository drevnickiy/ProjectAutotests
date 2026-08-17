import { test as setup, expect } from '@playwright/test';
import * as path from 'path';
import { LoginPage } from '../src/pages/LoginPage';

const authFile = path.resolve(__dirname, '../storageState.json');

setup('1. Глобальная однократная авторизация и сохранение токена/сессии', async ({ page }) => {
  console.log('\n🔑 [Auth Setup] Однократный запуск логина и сохранение storageState.json...');
  const loginPage = new LoginPage(page);
  await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/Products_ListPage');
  await loginPage.login('Supervisor', 'Supervisor');

  // Сохраняем сессию (cookies, localStorage, токены CSRF) в файл storageState.json
  await page.context().storageState({ path: authFile });
  console.log(`✅ [Auth Setup] Сессия и токены успешно сохранены в: ${authFile}\n`);
});
