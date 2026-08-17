import { chromium } from 'playwright';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function scanGenContractOrderModal() {
  const targetUrl = 'https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenContractOrder_ListPage';
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
    console.log('[3] Авторизовались. Переходим на страницу...');
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
  }

  console.log('[4] Ожидание загрузки интерфейса...');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(4000);

  console.log('[5] Клик по синей кнопке "+ Додати" раздела...');
  const clicked = await page.evaluate(() => {
    const allButtons = Array.from(document.querySelectorAll('button, crt-button, .crt-button')) as HTMLElement[];
    const sectionAddBtn = allButtons.find(b => {
      const text = b.innerText ? b.innerText.trim() : '';
      const rect = b.getBoundingClientRect();
      return text.includes('Додати') && rect.x > 800 && rect.y > 30 && rect.y < 150;
    });

    if (sectionAddBtn) {
      sectionAddBtn.click();
      return true;
    }
    return false;
  });

  if (!clicked) {
    await page.locator('.crt-button--contained').filter({ hasText: 'Додати' }).last().click();
  }

  console.log('[6] Ожидание открытия поп-апа / карточки добавления...');
  await page.waitForTimeout(6000);

  await page.screenshot({ path: 'gencontract_order_modal.png', fullPage: true });

  console.log('[7] Извлечение полей поп-апа...');

  const fieldsData = await page.evaluate(() => {
    const result: { [key: string]: string } = {};

    const modalContainer =
      document.querySelector('[role="dialog"]') ||
      document.querySelector('.mat-mdc-dialog-container') ||
      document.querySelector('.crt-card-content') ||
      document.querySelector('form') ||
      document.body;

    const inputs = Array.from(
      modalContainer.querySelectorAll('input:not([type="hidden"]), textarea, select, mat-select, [role="combobox"], crt-combobox, crt-input')
    ) as HTMLElement[];

    inputs.forEach((el, index) => {
      let fieldName = '';

      if (el.id) {
        const lbl = modalContainer.querySelector(`label[for="${CSS.escape(el.id)}"]`) as HTMLElement;
        if (lbl && lbl.innerText.trim()) fieldName = lbl.innerText.trim();
      }

      if (!fieldName) {
        const parent = el.closest('crt-field, mat-form-field, .crt-field-container, label') || el.parentElement;
        if (parent) {
          const lbl = parent.querySelector('label, crt-label, .mat-mdc-floating-label, .crt-field-title, span') as HTMLElement;
          if (lbl && lbl.innerText.trim()) fieldName = lbl.innerText.trim();
        }
      }

      if (!fieldName) fieldName = el.getAttribute('placeholder') || '';
      if (!fieldName) fieldName = el.getAttribute('aria-label') || '';
      if (!fieldName) fieldName = el.getAttribute('title') || '';
      if (!fieldName) fieldName = el.getAttribute('name') || '';
      if (!fieldName) fieldName = el.id;
      if (!fieldName) fieldName = `Field_${index + 1}`;

      fieldName = fieldName.replace(/[:*\n\r]/g, '').trim();

      if (fieldName) {
        let selector = '';
        if (el.id) {
          selector = `#${CSS.escape(el.id)}`;
        } else if (el.getAttribute('name')) {
          selector = `[name="${el.getAttribute('name')}"]`;
        } else if (el.getAttribute('placeholder')) {
          selector = `[placeholder="${CSS.escape(el.getAttribute('placeholder')!)}"]`;
        } else {
          selector = `page.getByLabel('${fieldName}')`;
        }

        let uniqueKey = fieldName;
        let count = 1;
        while (result[uniqueKey]) {
          uniqueKey = `${fieldName}_${count}`;
          count++;
        }
        result[uniqueKey] = selector;
      }
    });

    const crtLabels = Array.from(modalContainer.querySelectorAll('crt-label, label.crt-label, .crt-field-title, .mat-mdc-floating-label')) as HTMLElement[];
    crtLabels.forEach((lbl) => {
      const text = lbl.innerText ? lbl.innerText.trim().replace(/[:*\n\r]/g, '') : '';
      if (text && text.length < 50 && !result[text]) {
        result[text] = `page.getByLabel('${text}')`;
      }
    });

    return result;
  });

  console.log('\n--- 📋 Собраны поля поп-апа GenContractOrder ---');
  console.log(JSON.stringify(fieldsData, null, 2));

  fs.writeFileSync('src/locators/Виробничі_замовлення_Модалка.json', JSON.stringify(fieldsData, null, 2), 'utf-8');
  console.log('\nРезультаты сохранены в: Виробничі_замовлення_Модалка.json');

  await browser.close();
}

scanGenContractOrderModal().catch((err) => {
  console.error('Ошибка:', err);
  process.exit(1);
});
