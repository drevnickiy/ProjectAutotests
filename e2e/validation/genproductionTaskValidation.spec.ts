import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { BasePage } from '../../src/pages/BasePage';

test.describe('Валидация реестра и вкладок Виробничі замовлення (GenProductionTask)', () => {
  let basePage: BasePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
  });

  test('1. Проверка колонок реестра GenProductionTask_ListPage', async ({}, testInfo) => {
    await basePage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionTask_ListPage');
    await basePage.waitForPageLoaded('Дата створення');

    const fullData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../src/locators/Виробничі_замовлення.json'), 'utf-8')
    );
    await basePage.validateFieldsFromDict('GenProductionTaskRegistry', fullData.registryColumns, testInfo);
  });

  test('2. Проверка полей карточки и Вкладки 1 (Основна інформація)', async ({}, testInfo) => {
    await basePage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionTask_FormPage/add');
    await basePage.waitForCardLoaded('Пріоритет');
    await basePage.switchToTab('ОСНОВНА ІНФОРМАЦІЯ');

    const fullData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../src/locators/Виробничі_замовлення.json'), 'utf-8')
    );

    // 1. Левая панель
    await basePage.validateFieldsFromDict('GenProductionTask_LeftPanelFields', fullData.leftPanelFormFields, testInfo);

    // 2. Вкладка Основна інформація
    await basePage.validateFieldsFromDict('GenProductionTask_Tab1EtapyColumns', fullData.tab1MainInfo.etapyColumns, testInfo);
    await basePage.validateFieldsFromDict('GenProductionTask_Tab1TaskColumns', fullData.tab1MainInfo.taskColumns, testInfo);
  });

  test('3. Проверка блоков расчетов на Вкладке 2 (Розрахунки)', async ({}, testInfo) => {
    await basePage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionTask_FormPage/add');
    await basePage.waitForCardLoaded('Пріоритет');
    await basePage.switchToTab('РОЗРАХУНКИ');

    const fullData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../src/locators/Виробничі_замовлення.json'), 'utf-8')
    );

    await basePage.validateFieldsFromDict('GenProductionTask_Tab2MaterialsFields', fullData.tab2Calculations.materialsFields, testInfo);
    await basePage.validateFieldsFromDict('GenProductionTask_Tab2WasteFields', fullData.tab2Calculations.wasteFields, testInfo);
    await basePage.validateFieldsFromDict('GenProductionTask_Tab2SalaryFields', fullData.tab2Calculations.salaryFields, testInfo);
    await basePage.validateFieldsFromDict('GenProductionTask_Tab2EquipmentFields', fullData.tab2Calculations.equipmentFields, testInfo);
    await basePage.validateFieldsFromDict('GenProductionTask_Tab2MaterialsTableColumns', fullData.tab2Calculations.materialsTableColumns, testInfo);
  });

  test('4. Проверка Вкладки 3 (Підпорядковані замовлення)', async ({}, testInfo) => {
    await basePage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionTask_FormPage/add');
    await basePage.waitForCardLoaded('Пріоритет');
    await basePage.switchToTab('ПІДПОРЯДКОВАНІ ЗАМОВЛЕННЯ');

    const fullData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../src/locators/Виробничі_замовлення.json'), 'utf-8')
    );
    await basePage.validateFieldsFromDict('GenProductionTask_Tab3Headers', fullData.tab3SubordinateOrders.headers, testInfo);
  });

  test('5. Проверка блоков Вкладки 4 (Накладні)', async ({}, testInfo) => {
    await basePage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionTask_FormPage/add');
    await basePage.waitForCardLoaded('Пріоритет');
    await basePage.switchToTab('НАКЛАДНІ');

    const fullData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../src/locators/Виробничі_замовлення.json'), 'utf-8')
    );

    await basePage.validateFieldsFromDict('GenProductionTask_Tab4ExpenditureWaybills', fullData.tab4Waybills.expenditureWaybills, testInfo);
    await basePage.validateFieldsFromDict('GenProductionTask_Tab4IncomeWaybills', fullData.tab4Waybills.incomeWaybills, testInfo);
    await basePage.validateFieldsFromDict('GenProductionTask_Tab4TransferWaybills', fullData.tab4Waybills.transferWaybills, testInfo);
  });
});
