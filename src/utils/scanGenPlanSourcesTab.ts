import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../pages/LoginPage';

async function scanGenPlanSourcesTab() {
  console.log('🔍 [Scan] Сканирование локаторов вкладки Джерела (План виробництва)...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const loginPage = new LoginPage(page);
  await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionPlan_FormPage/add');
  await loginPage.login('Supervisor', 'Supervisor');

  console.log('🌐 Переход на форму создания: GenProductionPlan_FormPage/add...');
  await page.goto('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionPlan_FormPage/add', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);

  // Ждем исчзеновения масок
  const mask = page.locator('.crt-loading-mask, .crt-mask, mat-spinner');
  await mask.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(3000);

  console.log('👆 Переключение на вкладку Джерела...');
  const tabLocator = page.locator('.mat-mdc-tab, [role="tab"]').filter({ hasText: /Джерела/i }).first();
  await tabLocator.click();
  await page.waitForTimeout(4000);

  // Сканируем все видимые тексты и элементы шапок таблиц на вкладке Джерела
  const scannedData: { headers: string[]; tableTitles: string[]; columns: string[] } = await page.evaluate(() => {
    const headers: string[] = [];
    const tableTitles: string[] = [];
    const columns: string[] = [];

    // Ищем заголовки секций/блоков
    const titles = Array.from(document.querySelectorAll('.crt-expansion-panel-header-title, h2, h3, .crt-caption, span'));
    titles.forEach(el => {
      const txt = el.textContent?.trim() || '';
      if ((txt.includes('Планування') || txt.includes('Контрактні') || txt.includes('замовлення')) && !tableTitles.includes(txt)) {
        tableTitles.push(txt);
      }
    });

    // Ищем заголовки колонок таблиц
    const colEls = Array.from(document.querySelectorAll('th, [role="columnheader"], .crt-grid-header-cell, button[aria-label]'));
    colEls.forEach(el => {
      let txt = el.getAttribute('aria-label') || el.textContent?.trim() || '';
      if (txt.startsWith('Сортувати')) {
        txt = txt.replace('Сортувати', '').trim();
      }
      if (txt && !columns.includes(txt) && txt.length < 50) {
        columns.push(txt);
      }
    });

    return { headers, tableTitles, columns };
  });

  console.log('\n📋 Найденные заголовки блоков:', scannedData.tableTitles);
  console.log('📋 Найденные колонки таблиц:', scannedData.columns);

  // Формируем чистый точный словарь локаторов вкладки Джерела
  const tab3Sources: Record<string, string> = {};
  const ignored = ['S', 'Всі застосунки', 'Додати', 'Імпорт', 'Тег', 'Підсумки', 'Управління рядками', 'Пошук...', 'Пошук застосунку...'];

  // Добавляем заголовки таблиц
  if (scannedData.tableTitles.some(t => t.includes('Планування'))) {
    tab3Sources["Планування готової продукції"] = "page.getByText('Планування готової продукції', { exact: true })";
  }
  if (scannedData.tableTitles.some(t => t.includes('Контрактні'))) {
    tab3Sources["Контрактні замовлення"] = "page.getByText('Контрактні замовлення', { exact: true })";
  }

  // Добавляем колонки
  scannedData.columns.forEach(col => {
    if (col && !ignored.includes(col) && !tab3Sources[col]) {
      tab3Sources[col] = `page.getByText('${col}')`;
    }
  });

  console.log('\n✨ Собранный точный словарь tab3Sources:', tab3Sources);

  // Обновляем План_виробництва.json
  const jsonPath = path.resolve(__dirname, '../locators/План_виробництва.json');
  let currentData: any = {};
  if (fs.existsSync(jsonPath)) {
    currentData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  }

  currentData.tab3Sources = tab3Sources;

  fs.writeFileSync(jsonPath, JSON.stringify(currentData, null, 2), 'utf-8');
  console.log(`\n💾 Файл локаторов План_виробництва.json обновлен: ${jsonPath}`);

  await browser.close();
}

scanGenPlanSourcesTab().catch(err => console.error(err));
