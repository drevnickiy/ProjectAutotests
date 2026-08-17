import { chromium, Page } from 'playwright';
import * as fs from 'fs';

export interface FieldLocatorMap {
  [fieldName: string]: string;
}

/**
 * Автоматически собирает локаторы полей ввода с заданной страницы веб-приложения.
 * @param url Ссылка на страницу
 * @param headless Режим запуска браузера
 */
export async function collectPageFields(url: string, headless = false): Promise<FieldLocatorMap> {
  const browser = await chromium.launch({ headless });
  const page = await browser.newPage();

  console.log(`[Scan] Открываем страницу: ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const locatorsDict: FieldLocatorMap = await page.evaluate(() => {
    const result: FieldLocatorMap = {};
    const elements = Array.from(
      document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]), textarea, select')
    ) as HTMLElement[];

    elements.forEach((el, index) => {
      let fieldName = '';

      if (el.id) {
        const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`) as HTMLElement;
        if (label && label.innerText.trim()) {
          fieldName = label.innerText.trim();
        }
      }

      if (!fieldName) {
        const parentLabel = el.closest('label');
        if (parentLabel && parentLabel.innerText.trim()) {
          fieldName = parentLabel.innerText.trim();
        }
      }

      if (!fieldName) fieldName = el.getAttribute('placeholder') || '';
      if (!fieldName) fieldName = el.getAttribute('aria-label') || '';
      if (!fieldName) fieldName = el.getAttribute('title') || '';
      if (!fieldName) fieldName = el.getAttribute('name') || '';
      if (!fieldName) fieldName = el.id;
      if (!fieldName) fieldName = `Field_${el.tagName.toLowerCase()}_${index + 1}`;

      fieldName = fieldName.replace(/[:*\n\r]/g, '').trim();

      let selector = '';
      if (el.id) {
        selector = `#${CSS.escape(el.id)}`;
      } else if (el.getAttribute('name')) {
        selector = `[name="${el.getAttribute('name')}"]`;
      } else if (el.getAttribute('placeholder')) {
        selector = `[placeholder="${CSS.escape(el.getAttribute('placeholder')!)}"]`;
      } else if (el.getAttribute('type')) {
        selector = `${el.tagName.toLowerCase()}[type="${el.getAttribute('type')}"]`;
      } else {
        selector = `${el.tagName.toLowerCase()}:nth-of-type(${index + 1})`;
      }

      let uniqueKey = fieldName;
      let count = 1;
      while (result[uniqueKey]) {
        uniqueKey = `${fieldName}_${count}`;
        count++;
      }

      result[uniqueKey] = selector;
    });

    return result;
  });

  await browser.close();
  return locatorsDict;
}

/**
 * Проверяет наличие и видимость полей из словаря локаторов на странице.
 */
export async function verifyFieldsOnPage(page: Page, expectedLocators: FieldLocatorMap): Promise<{ passed: boolean; missing: string[] }> {
  console.log('\n--- 🔍 ПРОВЕРКА НАЛИЧИЯ ПОЛЕЙ НА СТРАНИЦЕ ---');
  const missing: string[] = [];

  for (const [fieldName, selector] of Object.entries(expectedLocators)) {
    const locator = page.locator(selector);
    const count = await locator.count();
    const isVisible = count > 0 && (await locator.first().isVisible());

    if (isVisible) {
      console.log(`✅ [ОК] Поле '${fieldName}' найден по селектору: '${selector}'`);
    } else {
      console.log(`❌ [ОШИБКА] Поле '${fieldName}' НЕ НАЙДЕНО по селектору: '${selector}'`);
      missing.push(fieldName);
    }
  }

  return { passed: missing.length === 0, missing };
}
