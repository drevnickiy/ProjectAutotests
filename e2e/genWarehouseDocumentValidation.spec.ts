import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../src/pages/LoginPage';
import { GenWarehouseDocumentPage } from '../src/pages/GenWarehouseDocumentPage';

test.describe('Модульные авто-тесты валидации раздела Складські операції (GenWarehouseDocument)', () => {
  let loginPage: LoginPage;
  let warehousePage: GenWarehouseDocumentPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenWarehouseDocument_ListPage');
    await loginPage.login();

    warehousePage = new GenWarehouseDocumentPage(page);
  });

  test('1. Проверка колонок реестра Складські операції (GenWarehouseDocument_ListPage)', async ({}, testInfo) => {
    await warehousePage.openListPage();
    const data = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../src/locators/Складські_операції.json'), 'utf-8')
    );
    await warehousePage.validateFieldsFromDict('GenWarehouseDocument_ListPage', data.registryColumns, testInfo);
  });

  test('2. Проверка полей левой панели карточки Складської операції', async ({}, testInfo) => {
    await warehousePage.openAddCard();
    await warehousePage.waitForCardLoaded('Номер документа');
    const data = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../src/locators/Складські_операції.json'), 'utf-8')
    );
    await warehousePage.validateFieldsFromDict('GenWarehouseDocument_LeftPanel', data.leftPanelFormFields, testInfo);
  });

  test('3. Проверка полей и таблиц вкладки Загальна інформація', async ({}, testInfo) => {
    await warehousePage.openAddCard();
    await warehousePage.waitForCardLoaded('Номер документа');
    const data = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../src/locators/Складські_операції.json'), 'utf-8')
    );
    await warehousePage.switchToTab('Загальна інформація');
    await warehousePage.validateFieldsFromDict('GenWarehouseDocument_TabGeneralInfo', data.tabGeneralInfo, testInfo);
  });

  test('4. Проверка таблиц вкладки Складська операція', async ({}, testInfo) => {
    await warehousePage.openAddCard();
    await warehousePage.waitForCardLoaded('Номер документа');
    const data = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../src/locators/Складські_операції.json'), 'utf-8')
    );
    await warehousePage.switchToTab('Складська операція');
    await warehousePage.validateFieldsFromDict('GenWarehouseDocument_TabWarehouseOperation', data.tabWarehouseOperation, testInfo);
  });

  test('5. Проверка таблиц вкладки Історія', async ({}, testInfo) => {
    await warehousePage.openAddCard();
    await warehousePage.waitForCardLoaded('Номер документа');
    const data = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../src/locators/Складські_операції.json'), 'utf-8')
    );
    await warehousePage.switchToTab('Історія');
    await warehousePage.validateFieldsFromDict('GenWarehouseDocument_TabHistory', data.tabHistory, testInfo);
  });
});
