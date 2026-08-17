import { chromium } from 'playwright';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function scanGenProductionPlan() {
  const targetUrl = 'https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionPlan_ListPage';
  const username = process.env.TEST_USERNAME || 'Supervisor';
  const password = process.env.TEST_PASSWORD || 'Supervisor';

  console.log(`[1] Запуск браузера: ${targetUrl}`);
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  const isLoginPage = await page.locator('#loginEdit-el').isVisible().catch(() => false);
  if (isLoginPage) {
    console.log('[2] Авторизация...');
    await page.fill('#loginEdit-el', username);
    await page.fill('#passwordEdit-el', password);
    await page.click('#t-comp18-textEl');
    await page.waitForURL(/.*\/0\/Shell\/.*/, { timeout: 60000 });
    console.log('[3] Переход на страницу...');
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
  }

  console.log('[4] Ожидание загрузки реестра GenProductionPlan...');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(5000);

  // Скролл таблицы реестра вправо
  console.log('[5] Горизонтальный скролл реестра вправо...');
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => {
      const scrollables = Array.from(document.querySelectorAll('.crt-grid, [role="grid"], .cdk-virtual-scroll-viewport, div'));
      scrollables.forEach((el) => {
        if (el.scrollWidth > el.clientWidth) {
          el.scrollLeft += 800;
        }
      });
    });
    await page.waitForTimeout(800);
  }

  // 1. Извлекаем колонки реестра
  const registryColumns = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('button, [role="columnheader"], .crt-grid-header-label')) as HTMLElement[];
    const result: { [key: string]: string } = {};

    elements.forEach((el) => {
      let text = el.innerText ? el.innerText.trim() : '';
      if (!text || text.includes('\n') || text.length > 70) return;
      text = text.replace(/^Сортувати\s+/i, '').trim();

      if (text && !result[text]) {
        result[text] = el.tagName.toLowerCase() === 'button'
          ? `page.getByRole('button', { name: 'Сортувати ${text}' })`
          : `page.getByText('${text}', { exact: true })`;
      }
    });
    return result;
  });

  console.log('\n--- 📋 Колонки реестра GenProductionPlan ---');
  console.log(JSON.stringify(registryColumns, null, 2));

  // 2. Клик по синей кнопке "+ Додати" раздела
  console.log('[6] Клик по синей кнопке "+ Додати"...');
  const sectionAddBtn = page.locator('.crt-button--contained').filter({ hasText: 'Додати' }).last();
  await sectionAddBtn.click();
  await page.waitForTimeout(6000);

  // Снимок формы добавления
  await page.screenshot({ path: 'genproduction_plan_card.png', fullPage: true });

  // Функция сканирования текущего вида карточки
  const scanCurrentTab = async () => {
    // Прокручиваем все таблицы вправо
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => {
        const scrollables = Array.from(document.querySelectorAll('.crt-grid, [role="grid"], .cdk-virtual-scroll-viewport, div'));
        scrollables.forEach((el) => {
          if (el.scrollWidth > el.clientWidth) {
            el.scrollLeft += 800;
          }
        });
      });
      await page.waitForTimeout(500);
    }

    return await page.evaluate(() => {
      const mainFields: { [key: string]: string } = {};
      const labels = Array.from(document.querySelectorAll('crt-label, label.crt-label, .crt-field-title, label, .mat-mdc-floating-label')) as HTMLElement[];

      labels.forEach((lbl) => {
        const text = lbl.innerText ? lbl.innerText.trim().replace(/[:*\n\r]/g, '') : '';
        if (text && text.length < 70 && !mainFields[text]) {
          mainFields[text] = `page.getByLabel('${text}')`;
        }
      });

      const tableHeaders = Array.from(document.querySelectorAll('button, [role="columnheader"], .crt-grid-header-label')) as HTMLElement[];
      const tableColumns: { [key: string]: string } = {};
      tableHeaders.forEach((el) => {
        let text = el.innerText ? el.innerText.trim() : '';
        if (!text || text.includes('\n') || text.length > 80) return;
        text = text.replace(/^Сортувати\s+/i, '').trim();

        if (text && !tableColumns[text]) {
          tableColumns[text] = `page.getByText('${text}', { exact: true })`;
        }
      });

      return { mainFields, tableColumns };
    });
  };

  // Вкладка 1: ЗАГАЛЬНА ІНФОРМАЦІЯ
  console.log('[7] Сканирование Вкладки 1 (Загальна інформація)...');
  const tab1Data = await scanCurrentTab();

  // Ищем все видимые названия вкладок в шапке карточки
  const tabsList = await page.evaluate(() => {
    const tabEls = Array.from(document.querySelectorAll('.mat-mdc-tab, [role="tab"], .crt-tab-header')) as HTMLElement[];
    return tabEls.map(t => t.innerText ? t.innerText.trim() : '').filter(t => t.length > 0);
  });
  console.log('[8] Найдено вкладок карточки:', tabsList);

  const scannedTabsData: { [tabName: string]: any } = {
    'Загальна інформація': tab1Data
  };

  // Переходим по остальным вкладкам
  for (const tabName of tabsList) {
    if (tabName.toLowerCase().includes('загальна')) continue;

    console.log(`[9] Переключаемся на вкладку: "${tabName}"...`);
    const tabLocator = page.locator('.mat-mdc-tab, [role="tab"]').filter({ hasText: new RegExp(tabName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }).first();

    if (await tabLocator.isVisible().catch(() => false)) {
      await tabLocator.click();
      await page.waitForTimeout(4000);
      scannedTabsData[tabName] = await scanCurrentTab();
    }
  }

  const result = {
    registryColumns,
    tabs: scannedTabsData
  };

  fs.writeFileSync('src/locators/План_виробництва.json', JSON.stringify(result, null, 2), 'utf-8');
  console.log('\nРезультаты сканирования сохранены в: План_виробництва.json');

  await browser.close();
}

scanGenProductionPlan().catch((err) => {
  console.error('Ошибка:', err);
  process.exit(1);
});
