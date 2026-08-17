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

  const scrollTableRight = async () => {
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => {
        const scrollables = Array.from(document.querySelectorAll('.crt-grid, [role="grid"], .cdk-virtual-scroll-viewport, div'));
        scrollables.forEach((el) => {
          if (el.scrollWidth > el.clientWidth) {
            el.scrollLeft += 600;
          }
        });
      });
      await page.waitForTimeout(300);
    }
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
      await scrollTableRight();
    }

    if ((await locator.count()) > 0) {
      isFound = await locator.first().isVisible().catch(() => false);
    }

    if (isFound) {
      console.log(`✅ [ОК] Поле/элемент '${fieldName}' виден и присутствует на странице.`);
    } else {
      console.error(`❌ [БАГ] Поле/элемент '${fieldName}' НЕ НАЙДЕН на странице или переименован!`);
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

test.describe('Валидация реестра и всех вкладок План виробництва (GenProductionPlan)', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionPlan_ListPage');
    await loginPage.login();
  });

  test('1. Проверка колонок реестра GenProductionPlan_ListPage', async ({ page }) => {
    await page.goto('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionPlan_ListPage', {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(5000);

    const fullData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/locators/План_виробництва.json'), 'utf-8'));
    await validateFieldsFromDict(page, 'GenProductionPlanRegistry', fullData.registryColumns);
  });

  test('2. Проверка полей формы, кнопок и колонок Вкладки "Продукти плану виробництва"', async ({ page }) => {
    await page.goto('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionPlan_ListPage', {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(5000);

    const sectionAddButton = page.locator('.crt-button--contained').filter({ hasText: 'Додати' }).last();
    await sectionAddButton.click();

    console.log('[Info] Ожидание отрисовки карточки Новий запис...');
    await page.locator('crt-field, mat-form-field, label').filter({ hasText: 'Розрахунок виробництва' }).first().waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForTimeout(2000);

    const fullData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/locators/План_виробництва.json'), 'utf-8'));

    // 1. Поля карточки
    await validateFieldsFromDict(page, 'GenProductionPlan_FormFields', fullData.formFields);

    // Убеждаемся, что открыта вкладка Продукти плану виробництва
    const tabLocator = page.locator('.mat-mdc-tab, [role="tab"]').filter({ hasText: /Продукти плану виробництва/i }).first();
    if (await tabLocator.isVisible().catch(() => false)) {
      await tabLocator.click();
      await page.waitForTimeout(2000);
    }

    // 2. Кнопки и чекбоксы Вкладки 1
    await validateFieldsFromDict(page, 'GenProductionPlan_Tab1Controls', fullData.tab1ProductsPlan.controls);

    // 3. Колонки таблицы Вкладки 1
    await validateFieldsFromDict(page, 'GenProductionPlan_Tab1Columns', fullData.tab1ProductsPlan.columns);
  });

  test('3. Проверка кнопок, подсекций и колонок Вкладки "Виробничі замовлення"', async ({ page }) => {
    await page.goto('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionPlan_ListPage', {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(5000);

    const sectionAddButton = page.locator('.crt-button--contained').filter({ hasText: 'Додати' }).last();
    await sectionAddButton.click();

    await page.locator('crt-field, mat-form-field, label').filter({ hasText: 'Розрахунок виробництва' }).first().waitFor({ state: 'visible', timeout: 30000 });

    console.log('[Info] Переключение на вкладку Виробничі замовлення...');
    const tabLocator = page.locator('.mat-mdc-tab, [role="tab"]').filter({ hasText: /Виробничі замовлення/i }).first();
    await tabLocator.click();
    await page.waitForTimeout(3000);

    const fullData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/locators/План_виробництва.json'), 'utf-8'));

    // 1. Кнопки действий 2-й вкладки
    await validateFieldsFromDict(page, 'GenProductionPlan_Tab2ActionButtons', fullData.tab2ProductionOrders.actionButtons);

    // 2. Подсекции
    await validateFieldsFromDict(page, 'GenProductionPlan_Tab2SubSections', fullData.tab2ProductionOrders.subSections);

    // 3. Колонки таблицы 2-й вкладки
    await validateFieldsFromDict(page, 'GenProductionPlan_Tab2Columns', fullData.tab2ProductionOrders.columns);
  });

  test('4. Проверка подтаблиц и колонок Вкладки "Джерела"', async ({ page }) => {
    await page.goto('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionPlan_ListPage', {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(5000);

    const sectionAddButton = page.locator('.crt-button--contained').filter({ hasText: 'Додати' }).last();
    await sectionAddButton.click();

    await page.locator('crt-field, mat-form-field, label').filter({ hasText: 'Розрахунок виробництва' }).first().waitFor({ state: 'visible', timeout: 30000 });

    console.log('[Info] Переключение на вкладку Джерела...');
    const tabLocator = page.locator('.mat-mdc-tab, [role="tab"]').filter({ hasText: /Джерела/i }).first();
    await tabLocator.click();
    await page.waitForTimeout(3000);

    const fullData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/locators/План_виробництва.json'), 'utf-8'));

    // 1. Валидация подтаблиц и колонок вкладки Джерела
    if (fullData.tab3Sources.planningFinishedProducts && fullData.tab3Sources.contractOrders) {
      await validateFieldsFromDict(page, 'GenProductionPlan_Tab3PlanningFinishedProducts', fullData.tab3Sources.planningFinishedProducts);
      await validateFieldsFromDict(page, 'GenProductionPlan_Tab3ContractOrders', fullData.tab3Sources.contractOrders);
    } else {
      await validateFieldsFromDict(page, 'GenProductionPlan_Tab3Sources', fullData.tab3Sources);
    }
  });
});
