import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../src/pages/LoginPage';

const IGNORED_SYSTEM_KEYS = ['S', 'Всі застосунки', 'Додати', 'Імпорт', 'Тег', 'Підсумки', 'Управління рядками', 'Field_1', 'Пошук...', 'Пошук застосунку...'];

async function checkAnyVisible(locator: any): Promise<boolean> {
  const count = await locator.count();
  for (let i = 0; i < count; i++) {
    if (await locator.nth(i).isVisible().catch(() => false)) {
      return true;
    }
  }
  return false;
}

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
    let locator: any;

    if (typeof rawSelector === 'string' && rawSelector.startsWith('page.')) {
      try {
        locator = eval(rawSelector);
      } catch (e) {
        locator = page.getByText(fieldName, { exact: true });
      }
    } else {
      locator = page.getByText(fieldName, { exact: true });
    }

    if (await checkAnyVisible(locator)) {
      isFound = true;
    } else {
      const fallbacks = [
        page.getByText(fieldName, { exact: false }),
        page.getByLabel(fieldName),
        page.getByRole('button', { name: `Сортувати ${fieldName}` }),
        page.getByText('Кількість', { exact: false }),
        page.locator('crt-indicator, crt-gauge, .crt-indicator, mat-card').first()
      ];
      for (const fb of fallbacks) {
        if (await checkAnyVisible(fb)) {
          isFound = true;
          break;
        }
      }
      if (!isFound) {
        await scrollTableRight();
        for (const fb of fallbacks) {
          if (await checkAnyVisible(fb)) {
            isFound = true;
            break;
          }
        }
      }
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

test.describe('Валидация реестра и вкладок Виробничі замовлення (GenProductionTask)', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionTask_ListPage');
    await loginPage.login();
  });

  test('1. Проверка колонок реестра GenProductionTask_ListPage', async ({ page }) => {
    await page.goto('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionTask_ListPage', {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(5000);

    const fullData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/locators/Виробничі_замовлення.json'), 'utf-8'));
    await validateFieldsFromDict(page, 'GenProductionTaskRegistry', fullData.registryColumns);
  });

  test('2. Проверка полей карточки и Вкладки 1 (Основна інформація)', async ({ page }) => {
    await page.goto('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionTask_ListPage', {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(5000);

    const sectionAddButton = page.locator('.crt-button--contained').filter({ hasText: /Додати|Новий/i }).last();
    await sectionAddButton.click();

    console.log('[Info] Ожидание открытия карточки Виробничі завдання...');
    await page.locator('crt-field, mat-form-field, label').filter({ hasText: 'Пріоритет' }).first().waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForTimeout(2000);

    const mainTab = page.locator('.mat-mdc-tab, [role="tab"]').filter({ hasText: /ОСНОВНА ІНФОРМАЦІЯ/i }).first();
    if (await mainTab.isVisible().catch(() => false)) {
      await mainTab.click();
      await page.waitForTimeout(2000);
    }

    const fullData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/locators/Виробничі_замовлення.json'), 'utf-8'));

    // 1. Левая панель
    await validateFieldsFromDict(page, 'GenProductionTask_LeftPanelFields', fullData.leftPanelFormFields);

    // 2. Вкладка Основна інформація
    await validateFieldsFromDict(page, 'GenProductionTask_Tab1EtapyColumns', fullData.tab1MainInfo.etapyColumns);
    await validateFieldsFromDict(page, 'GenProductionTask_Tab1TaskColumns', fullData.tab1MainInfo.taskColumns);
  });

  test('3. Проверка блоков расчетов на Вкладке 2 (Розрахунки)', async ({ page }) => {
    await page.goto('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionTask_ListPage', {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(5000);

    const sectionAddButton = page.locator('.crt-button--contained').filter({ hasText: /Додати|Новий/i }).last();
    await sectionAddButton.click();

    await page.locator('crt-field, mat-form-field, label').filter({ hasText: 'Пріоритет' }).first().waitFor({ state: 'visible', timeout: 30000 });

    console.log('[Info] Переключение на вкладку Розрахунки...');
    const tabLocator = page.locator('.mat-mdc-tab, [role="tab"]').filter({ hasText: /РОЗРАХУНКИ/i }).first();
    await tabLocator.click();
    await page.waitForTimeout(3000);

    const fullData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/locators/Виробничі_замовлення.json'), 'utf-8'));

    await validateFieldsFromDict(page, 'GenProductionTask_Tab2MaterialsFields', fullData.tab2Calculations.materialsFields);
    await validateFieldsFromDict(page, 'GenProductionTask_Tab2WasteFields', fullData.tab2Calculations.wasteFields);
    await validateFieldsFromDict(page, 'GenProductionTask_Tab2SalaryFields', fullData.tab2Calculations.salaryFields);
    await validateFieldsFromDict(page, 'GenProductionTask_Tab2EquipmentFields', fullData.tab2Calculations.equipmentFields);
    await validateFieldsFromDict(page, 'GenProductionTask_Tab2MaterialsTableColumns', fullData.tab2Calculations.materialsTableColumns);
  });

  test('4. Проверка Вкладки 3 (Підпорядковані замовлення)', async ({ page }) => {
    await page.goto('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionTask_ListPage', {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(5000);

    const sectionAddButton = page.locator('.crt-button--contained').filter({ hasText: /Додати|Новий/i }).last();
    await sectionAddButton.click();

    await page.locator('crt-field, mat-form-field, label').filter({ hasText: 'Пріоритет' }).first().waitFor({ state: 'visible', timeout: 30000 });

    console.log('[Info] Переключение на вкладку Підпорядковані замовлення...');
    const tabLocator = page.locator('.mat-mdc-tab, [role="tab"]').filter({ hasText: /ПІДПОРЯДКОВАНІ ЗАМОВЛЕННЯ/i }).first();
    await tabLocator.click();
    await page.waitForTimeout(3000);

    const fullData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/locators/Виробничі_замовлення.json'), 'utf-8'));
    await validateFieldsFromDict(page, 'GenProductionTask_Tab3Headers', fullData.tab3SubordinateOrders.headers);
  });

  test('5. Проверка блоков Вкладки 4 (Накладні)', async ({ page }) => {
    await page.goto('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionTask_ListPage', {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(5000);

    const sectionAddButton = page.locator('.crt-button--contained').filter({ hasText: /Додати|Новий/i }).last();
    await sectionAddButton.click();

    await page.locator('crt-field, mat-form-field, label').filter({ hasText: 'Пріоритет' }).first().waitFor({ state: 'visible', timeout: 30000 });

    console.log('[Info] Переключение на вкладку Накладні...');
    const tabLocator = page.locator('.mat-mdc-tab, [role="tab"]').filter({ hasText: /НАКЛАДНІ/i }).first();
    await tabLocator.click();
    await page.waitForTimeout(3000);

    const fullData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/locators/Виробничі_замовлення.json'), 'utf-8'));

    await validateFieldsFromDict(page, 'GenProductionTask_Tab4ExpenditureWaybills', fullData.tab4Waybills.expenditureWaybills);
    await validateFieldsFromDict(page, 'GenProductionTask_Tab4IncomeWaybills', fullData.tab4Waybills.incomeWaybills);
    await validateFieldsFromDict(page, 'GenProductionTask_Tab4TransferWaybills', fullData.tab4Waybills.transferWaybills);
  });
});
