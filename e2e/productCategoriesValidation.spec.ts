import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../src/pages/LoginPage';
import { ProductsCategoriesPage } from '../src/pages/ProductsCategoriesPage';

test.describe('Валидация категорий продуктов (Готовий продукт, Відходи, Напівфабрикат)', () => {
  let loginPage: LoginPage;
  let productsCategoriesPage: ProductsCategoriesPage;

  test.beforeEach(async ({ page }) => {
    test.setTimeout(180000); // 3 минуты на проверку глубоких вкладок Напівфабрикат
    loginPage = new LoginPage(page);
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/Products_ListPage');
    await loginPage.login();

    productsCategoriesPage = new ProductsCategoriesPage(page);
  });

  test('1. Проверка карточки Готовий продукт (все вкладки)', async ({}, testInfo) => {
    await productsCategoriesPage.openFinishedProductCard();
    await productsCategoriesPage.waitForCardLoaded('Назва');

    const fullData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../src/locators/Продукти_Категорії.json'), 'utf-8')
    );

    await productsCategoriesPage.validateFieldsFromDict('FinishedProduct_LeftPanel', fullData.finishedProduct.leftPanelFormFields, testInfo);
    await productsCategoriesPage.switchToTab('ЗАГАЛЬНА ІНФОРМАЦІЯ');
    await productsCategoriesPage.validateFieldsFromDict('FinishedProduct_GeneralInfo', fullData.finishedProduct.tabGeneralInfo, testInfo);

    await productsCategoriesPage.switchToTab('БАЛАНС');
    await productsCategoriesPage.validateFieldsFromDict('FinishedProduct_Balance', fullData.finishedProduct.tabBalance, testInfo);

    await productsCategoriesPage.switchToTab('ПОЛІГРАФІЯ ПРОДУКТУ');
    await productsCategoriesPage.validateFieldsFromDict('FinishedProduct_PolygraphyProduct', fullData.finishedProduct.tabPolygraphyProduct, testInfo);

    await productsCategoriesPage.switchToTab('ТЕХНОЛОГІЧНА КАРТА');
    await productsCategoriesPage.validateFieldsFromDict('FinishedProduct_TechMap', fullData.finishedProduct.tabTechMap, testInfo);

    await productsCategoriesPage.switchToTab('ХАРАКТЕРИСТИКИ');
    await productsCategoriesPage.validateFieldsFromDict('FinishedProduct_Characteristics', fullData.finishedProduct.tabCharacteristics, testInfo);

    await productsCategoriesPage.switchToTab('ЦІНИ І ЗАЛИШКИ');
    await productsCategoriesPage.validateFieldsFromDict('FinishedProduct_PricesStocks', fullData.finishedProduct.tabPricesStocks, testInfo);
  });

  test('2. Проверка карточки Відходи (все вкладки)', async ({}, testInfo) => {
    await productsCategoriesPage.openWasteProductCard();
    await productsCategoriesPage.waitForCardLoaded('Назва');

    const fullData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../src/locators/Продукти_Категорії.json'), 'utf-8')
    );

    await productsCategoriesPage.validateFieldsFromDict('WasteProduct_LeftPanel', fullData.wasteProduct.leftPanelFormFields, testInfo);
    await productsCategoriesPage.switchToTab('ЗАГАЛЬНА ІНФОРМАЦІЯ');
    await productsCategoriesPage.validateFieldsFromDict('WasteProduct_GeneralInfo', fullData.wasteProduct.tabGeneralInfo, testInfo);

    await productsCategoriesPage.switchToTab('БАЛАНС');
    await productsCategoriesPage.validateFieldsFromDict('WasteProduct_Balance', fullData.wasteProduct.tabBalance, testInfo);

    await productsCategoriesPage.switchToTab('ПОЛІГРАФІЯ ПРОДУКТУ');
    await productsCategoriesPage.validateFieldsFromDict('WasteProduct_PolygraphyProduct', fullData.wasteProduct.tabPolygraphyProduct, testInfo);

    await productsCategoriesPage.switchToTab('ХАРАКТЕРИСТИКИ');
    await productsCategoriesPage.validateFieldsFromDict('WasteProduct_Characteristics', fullData.wasteProduct.tabCharacteristics, testInfo);

    await productsCategoriesPage.switchToTab('ЦІНИ І ЗАЛИШКИ');
    await productsCategoriesPage.validateFieldsFromDict('WasteProduct_PricesStocks', fullData.wasteProduct.tabPricesStocks, testInfo);
  });

  test('3. Проверка карточки Напівфабрикат (ВСЕ вкладки от БАЛАНС до ЦІНИ І ЗАЛИШКИ)', async ({}, testInfo) => {
    await productsCategoriesPage.openSemiFinishedProductCard();
    await productsCategoriesPage.waitForCardLoaded('Назва');

    const fullData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../src/locators/Продукти_Категорії.json'), 'utf-8')
    );

    await productsCategoriesPage.validateFieldsFromDict('SemiFinishedProduct_LeftPanel', fullData.semiFinishedProduct.leftPanelFormFields, testInfo);

    await productsCategoriesPage.switchToTab('БАЛАНС');
    await productsCategoriesPage.validateFieldsFromDict('SemiFinishedProduct_Balance', fullData.semiFinishedProduct.tabBalance, testInfo);

    await productsCategoriesPage.switchToTab('ПОЛІГРАФІЯ');
    await productsCategoriesPage.validateFieldsFromDict('SemiFinishedProduct_Polygraphy', fullData.semiFinishedProduct.tabPolygraphy, testInfo);

    await productsCategoriesPage.switchToTab('ПОЛІГРАФІЯ ПРОДУКТУ');
    await productsCategoriesPage.validateFieldsFromDict('SemiFinishedProduct_PolygraphyProduct', fullData.semiFinishedProduct.tabPolygraphyProduct, testInfo);

    await productsCategoriesPage.switchToTab('ФІЗИКО-ХІМІЧНІ ПОКАЗНИКИ');
    await productsCategoriesPage.validateFieldsFromDict('SemiFinishedProduct_PhysicsChemistry', fullData.semiFinishedProduct.tabPhysicsChemistry, testInfo);

    await productsCategoriesPage.switchToTab('ТЕХНОЛОГІЧНА КАРТА');
    await productsCategoriesPage.validateFieldsFromDict('SemiFinishedProduct_TechMap', fullData.semiFinishedProduct.tabTechMap, testInfo);

    await productsCategoriesPage.switchToTab('ЗАКУПІВЛЯ');
    await productsCategoriesPage.validateFieldsFromDict('SemiFinishedProduct_Procurement', fullData.semiFinishedProduct.tabProcurement, testInfo);

    await productsCategoriesPage.switchToTab('ДОКУМЕНТИ');
    await productsCategoriesPage.validateFieldsFromDict('SemiFinishedProduct_Documents', fullData.semiFinishedProduct.tabDocuments, testInfo);

    await productsCategoriesPage.switchToTab('ХАРАКТЕРИСТИКИ');
    await productsCategoriesPage.validateFieldsFromDict('SemiFinishedProduct_Characteristics', fullData.semiFinishedProduct.tabCharacteristics, testInfo);

    await productsCategoriesPage.switchToTab('ЦІНИ І ЗАЛИШКИ');
    await productsCategoriesPage.validateFieldsFromDict('SemiFinishedProduct_PricesStocks', fullData.semiFinishedProduct.tabPricesStocks, testInfo);
  });
});
