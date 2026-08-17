import { chromium } from 'playwright';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function scanGenPlanCard() {
  const targetUrl = 'https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenPlanFinishProduct_FormPage/edit/a5f66a95-f99c-4d31-afb4-d855dc1ce9a7';
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
    console.log('[3] Авторизованы. Переход на страницу карточки...');
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(6000);
  }

  console.log('[4] Ожидание полной загрузки карточки...');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(5000);

  // Скроллим таблицы внутри карточки вправо
  console.log('[5] Горизонтальная прокрутка таблиц вправо...');
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

  // Скриншот для визуальной проверки
  await page.screenshot({ path: 'card_page.png', fullPage: true });

  console.log('[6] Сбор всех полей формы и колонок реестра в карточке...');

  const cardData = await page.evaluate(() => {
    const mainFields: { [key: string]: string } = {};
    const tableColumns: { [key: string]: string } = {};

    // 1. Поля формы (верхняя часть карточки)
    const crtLabels = Array.from(document.querySelectorAll('crt-label, label.crt-label, .crt-field-title, label, .mat-mdc-floating-label')) as HTMLElement[];
    crtLabels.forEach((lbl) => {
      const text = lbl.innerText ? lbl.innerText.trim().replace(/[:*\n\r]/g, '') : '';
      if (text && text.length < 70 && !mainFields[text]) {
        // Формируем качественный локатор
        mainFields[text] = `page.getByLabel('${text}')`;
      }
    });

    // 2. Колонки таблицы / реестра
    const tableHeaders = Array.from(document.querySelectorAll('button, [role="columnheader"], .crt-grid-header-label')) as HTMLElement[];
    tableHeaders.forEach((el) => {
      let text = el.innerText ? el.innerText.trim() : '';
      if (!text || text.includes('\n') || text.length > 80) return;
      text = text.replace(/^Сортувати\s+/i, '').trim();

      if (text && !tableColumns[text]) {
        if (el.tagName.toLowerCase() === 'button') {
          tableColumns[text] = `page.getByRole('button', { name: 'Сортувати ${text}' })`;
        } else {
          tableColumns[text] = `page.getByText('${text}', { exact: true })`;
        }
      }
    });

    return { mainFields, tableColumns };
  });

  console.log('\n--- 📋 Собраны поля формы карточки ---');
  console.log(JSON.stringify(cardData.mainFields, null, 2));

  console.log('\n--- 📊 Собраны колонки таблицы карточки ---');
  console.log(JSON.stringify(cardData.tableColumns, null, 2));

  const resultJSON = {
    formFields: cardData.mainFields,
    gridColumns: cardData.tableColumns
  };

  fs.writeFileSync('src/locators/План_виробництва_Карточка.json', JSON.stringify(resultJSON, null, 2), 'utf-8');
  console.log('\nЛокаторы карточки сохранены в План_виробництва_Карточка.json');

  await browser.close();
}

scanGenPlanCard().catch((err) => {
  console.error('Ошибка:', err);
  process.exit(1);
});
