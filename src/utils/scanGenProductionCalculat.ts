import { chromium } from 'playwright';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function scanGenProductionCalculat() {
  const targetUrl = 'https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionCalculat_ListPage';
  const username = process.env.TEST_USERNAME || 'Supervisor';
  const password = process.env.TEST_PASSWORD || 'Supervisor';

  console.log(`[1] Запуск браузера: ${targetUrl}`);
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // Проверка авторизации
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

  console.log('[4] Ожидание загрузки реестра GenProductionCalculat...');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(5000);

  // 1. Извлекаем колонки реестра
  console.log('[5] Сбор колонок реестра...');
  const registryColumns = await page.evaluate(() => {
    const elements = Array.from(
      document.querySelectorAll('button, [role="columnheader"], .crt-grid-header-label')
    ) as HTMLElement[];
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

  console.log('\n--- 📋 Колонки реестра ---');
  console.log(JSON.stringify(registryColumns, null, 2));
  fs.writeFileSync('src/locators/Розрахунок_виробництва_Реєстр.json', JSON.stringify(registryColumns, null, 2), 'utf-8');

  // 2. Клик по кнопке "+ Додати" раздела
  console.log('[6] Нажимаем кнопку "+ Додати"...');
  const sectionAddBtn = page.locator('.crt-button--contained').filter({ hasText: 'Додати' }).last();
  await sectionAddBtn.click();

  console.log('[7] Ожидаем загрузку формы карточки создания...');
  await page.waitForTimeout(6000);

  // Снимок первой вкладки (ЗАГАЛЬНА ІНФОРМАЦІЯ)
  await page.screenshot({ path: 'genproduction_tab1.png', fullPage: true });

  console.log('[8] Сканирование Вкладки 1 (Загальна інформація)...');
  const tab1Fields = await page.evaluate(() => {
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

  // 3. Переключаемся на Вкладку 2 (ПРОДУКТИ РОЗРАХУНКУ ВИРОБНИЦТВА)
  console.log('[9] Переключаемся на вкладку "Продукти розрахунку виробництва"...');
  const tab2Header = page.locator('.mat-mdc-tab, [role="tab"], .crt-tab-header').filter({ hasText: /Продукти розрахунку виробництва/i }).first();

  if (await tab2Header.isVisible().catch(() => false)) {
    await tab2Header.click();
    await page.waitForTimeout(4000);
  } else {
    // Пробуем по тексту заглавных букв
    await page.getByText('ПРОДУКТИ РОЗРАХУНКУ ВИРОБНИЦТВА', { exact: false }).first().click().catch(() => {});
    await page.waitForTimeout(4000);
  }

  // Снимок второй вкладки
  await page.screenshot({ path: 'genproduction_tab2.png', fullPage: true });

  console.log('[10] Сканирование Вкладки 2 (Продукти розрахунку виробництва)...');
  const tab2Fields = await page.evaluate(() => {
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

  const fullCardData = {
    registryColumns,
    tab1GeneralInfo: tab1Fields,
    tab2ProductsCalculation: tab2Fields
  };

  fs.writeFileSync('src/locators/Розрахунок_виробництва.json', JSON.stringify(fullCardData, null, 2), 'utf-8');
  console.log('\nРезультаты сканирования сохранены в: Розрахунок_виробництва.json');

  await browser.close();
}

scanGenProductionCalculat().catch((err) => {
  console.error('Ошибка:', err);
  process.exit(1);
});
