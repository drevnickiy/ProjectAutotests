import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../pages/LoginPage';

async function scanGenEquipmentColumns() {
  console.log('🔍 [Scan] Запуск авторизованного сканирования колонок страницы Обладнання...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const loginPage = new LoginPage(page);
  await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenEquipment_ListPage');
  await loginPage.login('Supervisor', 'Supervisor');

  console.log('🌐 Переход в раздел: GenEquipment_ListPage...');
  await page.goto('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenEquipment_ListPage', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(8000);

  // Ждем исчзеновения масок загрузки
  const mask = page.locator('.crt-loading-mask, .crt-mask, mat-spinner');
  await mask.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(3000);

  // Извлекаем все тексты заголовков колонок таблицы
  const scannedHeaders: string[] = await page.evaluate(() => {
    const headers: string[] = [];
    const elements = Array.from(document.querySelectorAll('button[aria-label], [role="columnheader"], .crt-grid-header-cell, th'));
    
    elements.forEach((el) => {
      let text = el.getAttribute('aria-label') || el.textContent?.trim() || '';
      if (text.startsWith('Сортувати')) {
        text = text.replace('Сортувати', '').trim();
      }
      if (text && !headers.includes(text) && text.length < 50) {
        headers.push(text);
      }
    });

    return headers;
  });

  console.log('\n📋 Действительно найденные колонки реестра Обладнання:', scannedHeaders);

  const registryColumns: Record<string, string> = {};
  const ignored = ['S', 'Всі застосунки', 'Додати', 'Імпорт', 'Тег', 'Підсумки', 'Управління рядками', 'Пошук...', 'Пошук застосунку...'];

  scannedHeaders.forEach((colName) => {
    if (colName && !ignored.includes(colName)) {
      registryColumns[colName] = `page.getByRole('button', { name: 'Сортувати ${colName}' })`;
    }
  });

  console.log('\n✨ Обновлённые колонки registryColumns:', registryColumns);

  const jsonPath = path.resolve(__dirname, '../locators/Обладнання.json');
  let currentData: any = {};
  if (fs.existsSync(jsonPath)) {
    currentData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  }

  currentData.registryColumns = registryColumns;

  fs.writeFileSync(jsonPath, JSON.stringify(currentData, null, 2), 'utf-8');
  console.log(`\n💾 Обновлен файл локаторов Обладнання.json: ${jsonPath}`);

  await browser.close();
}

scanGenEquipmentColumns().catch(err => console.error(err));
