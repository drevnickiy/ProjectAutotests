import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../../src/pages/LoginPage';
import { GenProductionRoutingPage } from '../../src/pages/GenProductionRoutingPage';

test.describe('Модульные авто-тесты валидации раздела Технологічні карти (GenProductionRouting)', () => {
  let loginPage: LoginPage;
  let routingPage: GenProductionRoutingPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    routingPage = new GenProductionRoutingPage(page);
  });

  test('1. Проверка колонок реестра Технологічні карти (GenProductionRouting_ListPage)', async ({ }, testInfo) => {
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionRouting_ListPage');
    await loginPage.login();
    await routingPage.openListPage();
    const data = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../src/locators/Технологічні_карти.json'), 'utf-8')
    );
    await routingPage.validateFieldsFromDict('GenProductionRouting_ListPage', data.registryColumns, testInfo);
  });

  test('2. Проверка полей левой панели карточки Технологічні карти', async ({ }, testInfo) => {
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionRouting_ListPage');
    await loginPage.login();
    await routingPage.openAddCard();
    await routingPage.waitForCardLoaded('Назва');
    const data = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../src/locators/Технологічні_карти.json'), 'utf-8')
    );
    await routingPage.validateFieldsFromDict('GenProductionRouting_LeftPanel', data.leftPanelFormFields, testInfo);
  });

  test('3. Проверка полей и таблиц вкладки Загальна інформація', async ({ }, testInfo) => {
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionRouting_ListPage');
    await loginPage.login();
    await routingPage.openAddCard();
    await routingPage.waitForCardLoaded('Назва');
    const data = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../src/locators/Технологічні_карти.json'), 'utf-8')
    );
    await routingPage.switchToTab('Загальна інформація');
    if (data.tabGeneralInfo.rawMaterials && data.tabGeneralInfo.wasteProducts) {
      await routingPage.validateFieldsFromDict('GenProductionRouting_TabGeneralInfo_RawMaterials', data.tabGeneralInfo.rawMaterials, testInfo);
      await routingPage.validateFieldsFromDict('GenProductionRouting_TabGeneralInfo_WasteProducts', data.tabGeneralInfo.wasteProducts, testInfo);
    } else {
      await routingPage.validateFieldsFromDict('GenProductionRouting_TabGeneralInfo', data.tabGeneralInfo, testInfo);
    }
  });

  test('4. Проверка полей и таблиц вкладки Етапи та завдання', async ({ }, testInfo) => {
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionRouting_ListPage');
    await loginPage.login();
    await routingPage.openAddCard();
    await routingPage.waitForCardLoaded('Назва');
    const data = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../src/locators/Технологічні_карти.json'), 'utf-8')
    );
    await routingPage.switchToTab('Етапи та завдання');
    if (data.tabStagesTasks.typicalStage && data.tabStagesTasks.typicalTask) {
      await routingPage.validateFieldsFromDict('GenProductionRouting_TabStagesTasks_TypicalStage', data.tabStagesTasks.typicalStage, testInfo);
      await routingPage.validateFieldsFromDict('GenProductionRouting_TabStagesTasks_TypicalTask', data.tabStagesTasks.typicalTask, testInfo);
    } else {
      await routingPage.validateFieldsFromDict('GenProductionRouting_TabStagesTasks', data.tabStagesTasks, testInfo);
    }
  });
});
