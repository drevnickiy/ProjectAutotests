import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { BasePage } from '../../src/pages/BasePage';

test.describe('Валидация реестра и всех вкладок План виробництва (GenProductionPlan)', () => {
  let basePage: BasePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
  });

  test('1. Проверка колонок реестра GenProductionPlan_ListPage', async ({}, testInfo) => {
    await basePage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionPlan_ListPage');
    await basePage.waitForPageLoaded('Горизонт планування');

    const fullData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../src/locators/План_виробництва.json'), 'utf-8')
    );
    await basePage.validateFieldsFromDict('GenProductionPlanRegistry', fullData.registryColumns, testInfo);
  });

  test('2. Проверка полей формы, кнопок и колонок Вкладки "Продукти плану виробництва"', async ({}, testInfo) => {
    await basePage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionPlan_FormPage/add');
    await basePage.waitForCardLoaded('Розрахунок виробництва');

    const fullData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../src/locators/План_виробництва.json'), 'utf-8')
    );

    // 1. Поля карточки
    await basePage.validateFieldsFromDict('GenProductionPlan_FormFields', fullData.formFields, testInfo);

    // Убеждаемся, что открыта вкладка Продукти плану виробництва
    await basePage.switchToTab('Продукти плану виробництва');

    // 2. Кнопки и чекбоксы Вкладки 1
    await basePage.validateFieldsFromDict('GenProductionPlan_Tab1Controls', fullData.tab1ProductsPlan.controls, testInfo);

    // 3. Колонки таблицы Вкладки 1
    await basePage.validateFieldsFromDict('GenProductionPlan_Tab1Columns', fullData.tab1ProductsPlan.columns, testInfo);
  });

  test('3. Проверка кнопок, подсекций и колонок Вкладки "Виробничі замовлення"', async ({}, testInfo) => {
    await basePage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionPlan_FormPage/add');
    await basePage.waitForCardLoaded('Розрахунок виробництва');
    await basePage.switchToTab('Виробничі замовлення');

    const fullData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../src/locators/План_виробництва.json'), 'utf-8')
    );

    // 1. Кнопки действий 2-й вкладки
    await basePage.validateFieldsFromDict('GenProductionPlan_Tab2ActionButtons', fullData.tab2ProductionOrders.actionButtons, testInfo);

    // 2. Подсекции
    await basePage.validateFieldsFromDict('GenProductionPlan_Tab2SubSections', fullData.tab2ProductionOrders.subSections, testInfo);

    // 3. Колонки таблицы 2-й вкладки
    await basePage.validateFieldsFromDict('GenProductionPlan_Tab2Columns', fullData.tab2ProductionOrders.columns, testInfo);
  });

  test('4. Проверка подтаблиц и колонок Вкладки "Джерела"', async ({}, testInfo) => {
    await basePage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionPlan_FormPage/add');
    await basePage.waitForCardLoaded('Розрахунок виробництва');
    await basePage.switchToTab('Джерела');

    const fullData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../src/locators/План_виробництва.json'), 'utf-8')
    );

    // Валидация подтаблиц и колонок вкладки Джерела
    if (fullData.tab3Sources.planningFinishedProducts && fullData.tab3Sources.contractOrders) {
      await basePage.validateFieldsFromDict('GenProductionPlan_Tab3PlanningFinishedProducts', fullData.tab3Sources.planningFinishedProducts, testInfo);
      await basePage.validateFieldsFromDict('GenProductionPlan_Tab3ContractOrders', fullData.tab3Sources.contractOrders, testInfo);
    } else {
      await basePage.validateFieldsFromDict('GenProductionPlan_Tab3Sources', fullData.tab3Sources, testInfo);
    }
  });
});
