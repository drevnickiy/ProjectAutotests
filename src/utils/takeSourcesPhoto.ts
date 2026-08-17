import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../pages/LoginPage';

async function takeSourcesPhoto() {
  console.log('📸 [Photo] Открываем вкладку Джерела (План виробництва)...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const loginPage = new LoginPage(page);
  await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionPlan_ListPage');
  await loginPage.login('Supervisor', 'Supervisor');

  console.log('🌐 Нажатие на Додати для открытия формы...');
  await page.goto('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionPlan_ListPage', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  const addButton = page.locator('.crt-button--contained').filter({ hasText: 'Додати' }).last();
  await addButton.click();

  await page.locator('crt-field, mat-form-field, label').filter({ hasText: 'Розрахунок виробництва' }).first().waitFor({ state: 'visible', timeout: 30000 });

  console.log('👆 Переключение на вкладку Джерела...');
  const tabLocator = page.locator('.mat-mdc-tab, [role="tab"]').filter({ hasText: /Джерела/i }).first();
  await tabLocator.click();
  await page.waitForTimeout(3000);

  const screenshotPath = path.resolve(__dirname, '../../screenshots/PHOTO_Tab3Sources_Actual.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Фото вкладки Джерела успешно сохранено в: ${screenshotPath}`);

  await browser.close();
}

takeSourcesPhoto().catch(err => console.error(err));
