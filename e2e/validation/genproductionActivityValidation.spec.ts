import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../../src/pages/LoginPage';
import { GenProductionActivityPage } from '../../src/pages/GenProductionActivityPage';

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
      fs.readFileSync(path.resolve(__dirname, '../../src/locators/Виробничі_завдання.json'), 'utf-8')
    );

    // Валидация колонок реестра
    await activityPage.validateFieldsFromDict('GenProductionActivityRegistry', fullData.registryColumns);

    // Клик + Додати / Новий и валидация полей формы
    await activityPage.waitForCardLoaded('Назва');
    await activityPage.validateFieldsFromDict('GenProductionActivityFormFields', fullData.cardFormFields);
  });

  test('2. Проверка карточки 🏭 "Виробниче завдання" (открытие через "+ Новий")', async () => {
    await activityPage.openDirectCardForm();
    await activityPage.waitForCardLoaded('Статус');

    const fullData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../src/locators/Виробничі_завдання.json'), 'utf-8')
    );

    // Валидация полей левой панели
    await activityPage.validateFieldsFromDict('GenProductionActivity_LeftPanel', fullData.leftPanelFields);

    // Валидация полей вкладки Загальна інформація
    await activityPage.validateFieldsFromDict('GenProductionActivity_GeneralInfoTab', fullData.generalInfoTabFields);

    // Валидация таблицы Участники
    await activityPage.validateFieldsFromDict('GenProductionActivity_ParticipantsTable', fullData.participantsTableColumns);

    // Валидация таблицы ВКЯ
    await activityPage.validateFieldsFromDict('GenProductionActivity_VkyTable', fullData.vkyTableColumns);
  });

  test('3. Проверка карточки 🔧 "Сервісне завдання" (открытие через "+ Новий")', async () => {
    await activityPage.openServiceTasksCardForm();
    await activityPage.waitForCardLoaded('Назва');

    const fullData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../src/locators/Сервісні_завдання.json'), 'utf-8')
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
      fs.readFileSync(path.resolve(__dirname, '../../src/locators/Учасники_План_Модалка.json'), 'utf-8')
    );

    await activityPage.validateFieldsFromDict('GenParticipantModal_FormFields', fullData.modalFormFields);
  });

  test('5. Проверка карточки 🔬 "ВКЯ" (открытие через "+ Новий")', async () => {
    await activityPage.openQualityControlCard();
    await activityPage.waitForCardLoaded('Результат перевірки');

    const fullData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../src/locators/Виробничі_завдання.json'), 'utf-8')
    ).qualityControlResultsCard;

    if (fullData) {
      await activityPage.validateFieldsFromDict('QualityControlResults_Stages', fullData.stages);
      await activityPage.validateFieldsFromDict('QualityControlResults_LeftPanel', fullData.leftPanelFields);
      await activityPage.validateFieldsFromDict('QualityControlResults_GeneralInfo', fullData.generalInfoTabFields);
      await activityPage.validateFieldsFromDict('QualityControlResults_VkyFactTable', fullData.vkyFactTableColumns);
    }
  });
});
