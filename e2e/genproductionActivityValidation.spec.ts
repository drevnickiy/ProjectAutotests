import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../src/pages/LoginPage';
import { GenProductionActivityPage } from '../src/pages/GenProductionActivityPage';

test.describe('Валидация раздела Виробничі завдання (GenProductionActivity)', () => {
  let activityPage: GenProductionActivityPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionActivity_ListPage');
    await loginPage.login();
    activityPage = new GenProductionActivityPage(page);
  });

  test('1. Проверка реестра и формы Виробничі завдання (GenProductionActivity_ListPage)', async () => {
    await activityPage.openSection();

    const fullData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../src/locators/Виробничі_завдання.json'), 'utf-8')
    );

    // Валидация колонок реестра
    await activityPage.validateFieldsFromDict('GenProductionActivityRegistry', fullData.registryColumns);

    // Клик + Додати / Новий и валидация полей формы
    await activityPage.waitForCardLoaded('Назва');
    await activityPage.validateFieldsFromDict('GenProductionActivityFormFields', fullData.cardFormFields);
  });

  test('2. Проверка прямой карточки создания GenProductionActivity_FormPage/add', async () => {
    await activityPage.openDirectCardForm();
    await activityPage.waitForCardLoaded('Статус');

    const fullData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../src/locators/Виробничі_завдання.json'), 'utf-8')
    );

    const combinedFields = {
      ...fullData.leftPanelFields,
      ...fullData.generalInfoTabFields,
      ...fullData.participantsTableColumns,
      ...fullData.vkyTableColumns
    };

    await activityPage.validateFieldsFromDict('GenProductionActivityCard', combinedFields);
  });

  test('3. Проверка карточки Сервісні завдання GenPageForm_ServiceTasks/add', async () => {
    await activityPage.openServiceTasksCardForm();
    await activityPage.waitForCardLoaded('Назва');

    const fullData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../src/locators/Сервісні_завдання.json'), 'utf-8')
    );

    await activityPage.validateFieldsFromDict('GenServiceTasks_LeftPanel', fullData.leftPanelFields);
    await activityPage.validateFieldsFromDict('GenServiceTasks_GeneralInfoTab', fullData.generalInfoTabFields);
    await activityPage.validateFieldsFromDict('GenServiceTasks_ParticipantsTable', fullData.participantsTableColumns);
    await activityPage.validateFieldsFromDict('GenServiceTasks_VkyTable', fullData.vkyTableColumns);
    if (fullData.taskTableColumns) {
      await activityPage.validateFieldsFromDict('GenServiceTasks_TaskTable', fullData.taskTableColumns);
    }
  });

  test('4. Проверка модального поп-апа Додати учасника завдання (GenProductionActivityParticipant_ModalPage/add)', async () => {
    await activityPage.openParticipantModalDirectUrl();
    await activityPage.waitForCardLoaded('Співробітник');

    const fullData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../src/locators/Учасники_План_Модалка.json'), 'utf-8')
    );

    await activityPage.validateFieldsFromDict('GenParticipantModal_FormFields', fullData.modalFormFields);
  });

  test('5. Проверка карточки ВКЯ (GenPageQualityControlResults/add)', async () => {
    await activityPage.page.goto('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenPageQualityControlResults/add');
    await activityPage.waitForCardLoaded('Результат перевірки');

    const fullData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../src/locators/Виробничі_завдання.json'), 'utf-8')
    ).qualityControlResultsCard;

    if (fullData) {
      await activityPage.validateFieldsFromDict('QualityControlResults_Stages', fullData.stages);
      await activityPage.validateFieldsFromDict('QualityControlResults_LeftPanel', fullData.leftPanelFields);
      await activityPage.validateFieldsFromDict('QualityControlResults_GeneralInfo', fullData.generalInfoTabFields);
      await activityPage.validateFieldsFromDict('QualityControlResults_VkyFactTable', fullData.vkyFactTableColumns);
    }
  });
});
