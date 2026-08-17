import { chromium } from 'playwright';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function scanGenContractOrderPage() {
  const targetUrl = 'https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenContractOrder_ListPage';
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
    console.log('[2] Выполняем авторизацию...');
    await page.fill('#loginEdit-el', username);
    await page.fill('#passwordEdit-el', password);
    await page.click('#t-comp18-textEl');
    await page.waitForURL(/.*\/0\/Shell\/.*/, { timeout: 60000 });
    console.log('[3] Переходим на целевую страницу...');
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
  }

  console.log('[4] Ожидание загрузки реестра GenContractOrder...');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(5000);

  // Скролл таблицы вправо
  console.log('[5] Горизонтальная прокрутка таблицы вправо...');
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

  await page.screenshot({ path: 'gencontract_order_page.png', fullPage: true });

  console.log('[6] Извлечение локаторов колонок...');

  const columnsData = await page.evaluate(() => {
    const headerElements = Array.from(
      document.querySelectorAll(
        'button, [role="columnheader"], .crt-grid-header-label, .mat-sort-header-container, label, span'
      )
    ) as HTMLElement[];

    const result: { [key: string]: string } = {};

    headerElements.forEach((el) => {
      let text = el.innerText ? el.innerText.trim() : '';
      if (!text || text.includes('\n') || text.length > 70) return;

      text = text.replace(/^Сортувати\s+/i, '').trim();

      if (text && !result[text]) {
        const isHeader =
          el.tagName.toLowerCase() === 'button' ||
          el.getAttribute('role') === 'columnheader' ||
          el.classList.contains('crt-grid-header-label') ||
          el.closest('[role="columnheader"]') !== null ||
          el.closest('button') !== null;

        if (isHeader) {
          let selector = '';
          if (el.tagName.toLowerCase() === 'button') {
            selector = `page.getByRole('button', { name: 'Сортувати ${text}' })`;
          } else {
            selector = `page.getByText('${text}', { exact: true })`;
          }
          result[text] = selector;
        }
      }
    });

    return result;
  });

  console.log('\n--- 📋 Собраны колонки GenContractOrder_ListPage ---');
  console.log(JSON.stringify(columnsData, null, 2));

  fs.writeFileSync('src/locators/Виробничі_замовлення.json', JSON.stringify(columnsData, null, 2), 'utf-8');
  console.log('\nЛокаторы сохранены в: Виробничі_замовлення.json');

  await browser.close();
}

scanGenContractOrderPage().catch((err) => {
  console.error('Ошибка:', err);
  process.exit(1);
});
