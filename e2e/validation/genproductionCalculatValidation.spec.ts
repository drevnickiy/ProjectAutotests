import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { BasePage } from '../../src/pages/BasePage';

test.describe('Валидация реестра и 2-х вкладок Розрахунок виробництва (GenProductionCalculat)', () => {
  let basePage: BasePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
  });

  test('1. Проверка присутствия всех колонок реестра GenProductionCalculat_ListPage', async ({}, testInfo) => {
    await basePage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionCalculat_ListPage');
    await basePage.waitForPageLoaded('Статус розрахунку виробництва');

    const fullData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../src/locators/Розрахунок_виробництва.json'), 'utf-8')
    );
    await basePage.validateFieldsFromDict('GenProductionCalculatRegistry', fullData.registryColumns, testInfo);
  });

  test('2. Проверка полей формы и колонок Вкладки 1 (Загальна інформація) при нажатии на Додати', async ({}, testInfo) => {
    await basePage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionCalculat_FormPage/add');
    await basePage.waitForCardLoaded('Статус розрахунку виробництва');

    const fullData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../src/locators/Розрахунок_виробництва.json'), 'utf-8')
    );

    // Поля формы левого меню
    await basePage.validateFieldsFromDict('GenProductionCalculat_LeftPanel', fullData.leftPanelFields || fullData.formFields, testInfo);

    // Таблица Вкладки 1
    await basePage.switchToTab('Загальна інформація');
    await basePage.validateFieldsFromDict('GenProductionCalculat_Tab1Columns', fullData.tab1ProductionPlanColumns, testInfo);
  });

  test('3. Проверка колонок Вкладки 2 (Продукти розрахунку виробництва)', async ({}, testInfo) => {
    await basePage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionCalculat_FormPage/add');
    await basePage.waitForCardLoaded('Статус розрахунку виробництва');
    await basePage.switchToTab('Продукти розрахунку виробництва');

    const fullData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../src/locators/Розрахунок_виробництва.json'), 'utf-8')
    );

    // Таблица Вкладки 2
    await basePage.validateFieldsFromDict('GenProductionCalculat_Tab2Columns', fullData.tab2ProductsCalculationColumns, testInfo);
  });
});
