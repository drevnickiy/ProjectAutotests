import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { BasePage } from '../../src/pages/BasePage';

test.describe('Валидация реестра и формы Контрактні замовлення (GenContractOrder)', () => {
  let basePage: BasePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
  });

  test('1. Проверка присутствия всех колонок реестра GenContractOrder_ListPage', async ({}, testInfo) => {
    await basePage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenContractOrder_ListPage');
    await basePage.waitForPageLoaded('Контрагент');

    const orderFields = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../src/locators/Контрактні_замовлення.json'), 'utf-8')
    );
    await basePage.validateFieldsFromDict('GenContractOrderRegistry', orderFields.registryColumns || orderFields, testInfo);
  });

  test('2. Проверка полей карточки и таблицы Продукти у контрактному замовленні', async ({}, testInfo) => {
    await basePage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenContractOrder_FormPage/add');
    await basePage.waitForCardLoaded('Контрагент');

    const orderData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../src/locators/Контрактні_замовлення.json'), 'utf-8')
    );
    const combinedFields = { ...orderData.leftPanelFormFields, ...orderData.tabGeneralInfo };

    await basePage.validateFieldsFromDict('GenContractOrderCard', combinedFields, testInfo);
  });
});
