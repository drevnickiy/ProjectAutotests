import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../src/pages/LoginPage';
import { GenEquipmentPage } from '../src/pages/GenEquipmentPage';

test.describe('Модульные авто-тесты валидации раздела Обладнання (GenEquipment)', () => {
  let loginPage: LoginPage;
  let equipmentPage: GenEquipmentPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenEquipment_ListPage');
    await loginPage.login();

    equipmentPage = new GenEquipmentPage(page);
  });

  test('1. Проверка колонок реестра Обладнання (GenEquipment_ListPage)', async ({}, testInfo) => {
    await equipmentPage.openListPage();
    const data = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../src/locators/Обладнання.json'), 'utf-8')
    );
    await equipmentPage.validateFieldsFromDict('GenEquipment_ListPage', data.registryColumns, testInfo);
  });

  test('2. Проверка полей левой панели карточки Обладнання', async ({}, testInfo) => {
    await equipmentPage.openAddCard();
    await equipmentPage.waitForCardLoaded('Назва');
    const data = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../src/locators/Обладнання.json'), 'utf-8')
    );
    await equipmentPage.validateFieldsFromDict('GenEquipment_LeftPanel', data.leftPanelFormFields, testInfo);
  });

  test('3. Проверка полей вкладки Властивості', async ({}, testInfo) => {
    await equipmentPage.openAddCard();
    await equipmentPage.waitForCardLoaded('Назва');
    const data = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../src/locators/Обладнання.json'), 'utf-8')
    );
    await equipmentPage.switchToTab('Властивості');
    await equipmentPage.validateFieldsFromDict('GenEquipment_TabProperties', data.tabProperties, testInfo);
  });

  test('4. Проверка полей и таблиц вкладки Вхід', async ({}, testInfo) => {
    await equipmentPage.openAddCard();
    await equipmentPage.waitForCardLoaded('Назва');
    const data = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../src/locators/Обладнання.json'), 'utf-8')
    );
    await equipmentPage.switchToTab('Вхід');
    await equipmentPage.validateFieldsFromDict('GenEquipment_TabInput', data.tabInput, testInfo);
  });

  test('5. Проверка полей и таблиц вкладки Вихід', async ({}, testInfo) => {
    await equipmentPage.openAddCard();
    await equipmentPage.waitForCardLoaded('Назва');
    const data = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../src/locators/Обладнання.json'), 'utf-8')
    );
    await equipmentPage.switchToTab('Вихід');
    await equipmentPage.validateFieldsFromDict('GenEquipment_TabOutput', data.tabOutput, testInfo);
  });

  test('6. Проверка полей и таблиц вкладки Відходи (все колонки таблицы)', async ({}, testInfo) => {
    await equipmentPage.openAddCard();
    await equipmentPage.waitForCardLoaded('Назва');
    const data = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../src/locators/Обладнання.json'), 'utf-8')
    );
    await equipmentPage.switchToTab('Відходи');
    await equipmentPage.validateFieldsFromDict('GenEquipment_TabWaste', data.tabWaste, testInfo);
  });

  test('7. Проверка таблиц вкладки Обслуговування (плановое и сервисное ТО)', async ({}, testInfo) => {
    await equipmentPage.openAddCard();
    await equipmentPage.waitForCardLoaded('Назва');
    const data = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../src/locators/Обладнання.json'), 'utf-8')
    );
    await equipmentPage.switchToTab('Обслуговування');
    await equipmentPage.validateFieldsFromDict('GenEquipment_TabMaintenance', data.tabMaintenance, testInfo);
  });
});
