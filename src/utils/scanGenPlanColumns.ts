import { chromium, Page } from 'playwright';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function scanGenPlanPage() {
  const targetUrl = 'https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenPlanFinishProduct_ListPage';
  const username = process.env.TEST_USERNAME || 'Supervisor';
  const password = process.env.TEST_PASSWORD || 'Supervisor';

  console.log(`[1] Запускаем браузер и переходим на страницу: ${targetUrl}`);
  const browser = await chromium.launch({ headless: false }); // Открываем браузер
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // Проверяем авторизацию
  const isLoginPage = await page.locator('#loginEdit-el').isVisible().catch(() => false);
  if (isLoginPage) {
    console.log('[2] Выполняем авторизацию...');
    await page.fill('#loginEdit-el', username);
    await page.fill('#passwordEdit-el', password);
    await page.click('#t-comp18-textEl');
    await page.waitForURL(/.*\/0\/Shell\/.*/, { timeout: 60000 });
    console.log('[3] Авторизация прошла успешно. Переходим на целевую страницу...');
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
  }

  console.log('[4] Ожидание полной загрузки реестра...');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(5000);

  // Скроллим таблицу вправо несколько раз для подгрузки динамических колонок в DOM
  console.log('[5] Прокрутка таблицы вправо для сбора всех заголовков...');
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => {
      const gridContainers = Array.from(document.querySelectorAll('.crt-grid, [role="grid"], .cdk-virtual-scroll-viewport, div'));
      gridContainers.forEach((el) => {
        if (el.scrollWidth > el.clientWidth) {
          el.scrollLeft += 800;
        }
      });
    });
    await page.waitForTimeout(800);
  }

  console.log('[6] Извлечение колонок от "Назва" до "Детальний опис"...');
  
  const extractedColumns = await page.evaluate(() => {
    // Собираем элементы таблицы: заголовки, кнопки сортировки, заглавные поля
    const elements = Array.from(
      document.querySelectorAll(
        'button, [role="columnheader"], .crt-grid-header-label, .mat-sort-header-container, label, span, div'
      )
    ) as HTMLElement[];

    const result: { [key: string]: string } = {};

    elements.forEach((el) => {
      let text = el.innerText ? el.innerText.trim() : '';
      if (!text || text.includes('\n') || text.length > 60) return;

      // Убираем префикс "Сортувати"
      text = text.replace(/^Сортувати\s+/i, '').trim();

      // Нам нужны элементы таблицы и формы
      if (text && !result[text]) {
        // Проверяем, является ли элемент заголовком таблицы или кнопкой сортировки
        const isHeader =
          el.tagName.toLowerCase() === 'button' ||
          el.getAttribute('role') === 'columnheader' ||
          el.classList.contains('crt-grid-header-label') ||
          el.closest('[role="columnheader"]') !== null ||
          el.closest('button') !== null;

        if (isHeader) {
          // Формируем релевантный селектор Playwright
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

  console.log('\n--- 📋 Собраны заголовки и локаторы ---');
  console.log(JSON.stringify(extractedColumns, null, 2));

  fs.writeFileSync('src/locators/План_виробництва_Реєстр.json', JSON.stringify(extractedColumns, null, 2), 'utf-8');
  console.log('\nЛокаторы сохранены в файл: План_виробництва_Реєстр.json');

  await browser.close();
}

scanGenPlanPage().catch((err) => {
  console.error('Ошибка:', err);
  process.exit(1);
});
