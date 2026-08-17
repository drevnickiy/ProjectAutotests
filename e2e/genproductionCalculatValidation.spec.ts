import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../src/pages/LoginPage';

const IGNORED_SYSTEM_KEYS = ['S', 'Всі застосунки', 'Додати', 'Імпорт', 'Тег', 'Підсумки', 'Управління рядками', 'Field_1', 'Пошук...', 'Пошук застосунку...'];

async function validateFieldsFromDict(
  page: Page,
  testName: string,
  fieldsDict: { [fieldName: string]: string }
): Promise<void> {
  const missingOrChangedFields: string[] = [];

  console.log(`\n--- 🔍 Проверка полей для: ${testName} ---`);

  const scrollTable = async () => {
    await page.evaluate(() => {
      const scrollables = Array.from(document.querySelectorAll('.crt-grid, [role="grid"], .cdk-virtual-scroll-viewport, div'));
      scrollables.forEach((el) => {
        if (el.scrollWidth > el.clientWidth) {
          el.scrollLeft += 800;
        }
      });
    });
    await page.waitForTimeout(400);
  };

  for (const [fieldName, rawSelector] of Object.entries(fieldsDict)) {
    if (IGNORED_SYSTEM_KEYS.includes(fieldName)) {
      continue;
    }

    let isFound = false;
    let locator = page.getByText(fieldName, { exact: true });

    if ((await locator.count()) === 0) {
      locator = page.getByLabel(fieldName);
    }
    if ((await locator.count()) === 0) {
      locator = page.getByRole('button', { name: `Сортувати ${fieldName}` });
    }

    if ((await locator.count()) === 0 || !(await locator.first().isVisible().catch(() => false))) {
      await scrollTable();
    }

    if ((await locator.count()) > 0) {
      isFound = await locator.first().isVisible().catch(() => false);
    }

    if (isFound) {
      console.log(`✅ [ОК] Поле/колонка '${fieldName}' видна и присутствует на странице.`);
    } else {
      console.error(`❌ [БАГ] Поле/колонка '${fieldName}' НЕ НАЙДЕНА на странице или переименована!`);
      missingOrChangedFields.push(fieldName);

      const safeName = fieldName.replace(/[^a-zA-Z0-9а-яА-Я_]/g, '_');
      const screenshotDir = path.resolve(__dirname, '../screenshots');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }

      const screenshotPath = path.join(screenshotDir, `BUG_${testName}_${safeName}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 Скриншот дефекта сохранен в: ${screenshotPath}`);
    }
  }

  if (missingOrChangedFields.length > 0) {
    throw new Error(
      `⚠️ ОБНАРУЖЕНЫ БАГИ! Следующие элементы (${missingOrChangedFields.length}) отсутствуют или переименованы:\n` +
        missingOrChangedFields.map((f) => ` - "${f}"`).join('\n')
    );
  }

  const screenshotDir = path.resolve(__dirname, '../screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  const successScreenshotPath = path.join(screenshotDir, `SUCCESS_${testName}_passed.png`);
  await page.screenshot({ path: successScreenshotPath, fullPage: true });

  console.log(`🎉 Все элементы сценария ${testName} успешно прошли валидацию!`);
  console.log(`📸 Скриншот успешного прохождения сохранен в: ${successScreenshotPath}`);
}

test.describe('Валидация реестра и 2-х вкладок Розрахунок виробництва (GenProductionCalculat)', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionCalculat_ListPage');
    await loginPage.login();
  });

  test('1. Проверка присутствия всех колонок реестра GenProductionCalculat_ListPage', async ({ page }) => {
    await page.goto('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionCalculat_ListPage', {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(5000);

    const fullData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/locators/Розрахунок_виробництва.json'), 'utf-8'));
    await validateFieldsFromDict(page, 'GenProductionCalculatRegistry', fullData.registryColumns);
  });

  test('2. Проверка полей формы и колонок Вкладки 1 (Загальна інформація) при нажатии на Додати', async ({ page }) => {
    await page.goto('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionCalculat_ListPage', {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(5000);

    const sectionAddButton = page.locator('.crt-button--contained').filter({ hasText: 'Додати' }).last();
    await sectionAddButton.click();

    console.log('[Info] Ожидание открытия карточки и рендеринга полей Вкладки 1...');
    await page.locator('crt-field, mat-form-field, label').filter({ hasText: 'Статус розрахунку виробництва' }).first().waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForTimeout(2000);

    const fullData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/locators/Розрахунок_виробництва.json'), 'utf-8'));

    // Поля формы левого меню
    await validateFieldsFromDict(page, 'GenProductionCalculat_LeftPanel', fullData.leftPanelFields || fullData.formFields);

    // Таблица Вкладки 1
    await validateFieldsFromDict(page, 'GenProductionCalculat_Tab1Columns', fullData.tab1ProductionPlanColumns);
  });

  test('3. Проверка колонок Вкладки 2 (Продукти розрахунку виробництва)', async ({ page }) => {
    await page.goto('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionCalculat_ListPage', {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(5000);

    const sectionAddButton = page.locator('.crt-button--contained').filter({ hasText: 'Додати' }).last();
    await sectionAddButton.click();

    console.log('[Info] Ожидание открытия карточки...');
    await page.locator('crt-field, mat-form-field, label').filter({ hasText: 'Статус розрахунку виробництва' }).first().waitFor({ state: 'visible', timeout: 30000 });

    // Переключение на Вкладку 2
    console.log('[Info] Переключаемся на Вкладку 2 (Продукти розрахунку виробництва)...');
    const tab2 = page.locator('.mat-mdc-tab, [role="tab"]').filter({ hasText: /Продукти розрахунку виробництва/i }).first();
    if (await tab2.isVisible().catch(() => false)) {
      await tab2.click();
    } else {
      await page.getByText('ПРОДУКТИ РОЗРАХУНКУ ВИРОБНИЦТВА', { exact: false }).first().click();
    }
    await page.waitForTimeout(3000);

    const fullData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/locators/Розрахунок_виробництва.json'), 'utf-8'));

    // Таблица Вкладки 2
    await validateFieldsFromDict(page, 'GenProductionCalculat_Tab2Columns', fullData.tab2ProductsCalculationColumns);
  });
});
