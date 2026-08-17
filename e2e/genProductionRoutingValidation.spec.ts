import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../src/pages/LoginPage';
import { GenProductionRoutingPage } from '../src/pages/GenProductionRoutingPage';

test.describe('Модульные авто-тесты валидации раздела Технологічні карти (GenProductionRouting)', () => {
  let loginPage: LoginPage;
  let routingPage: GenProductionRoutingPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    routingPage = new GenProductionRoutingPage(page);
  });

  test('1. Проверка колонок реестра Технологічні карти (GenProductionRouting_ListPage)', async ({}, testInfo) => {
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionRouting_ListPage');
    await loginPage.login();
    await routingPage.openListPage();
    const data = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../src/locators/Технологічні_карти.json'), 'utf-8')
    );
    await routingPage.validateFieldsFromDict('GenProductionRouting_ListPage', data.registryColumns, testInfo);
  });

  test('2. Проверка полей левой панели карточки Технологічні карти', async ({}, testInfo) => {
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionRouting_ListPage');
    await loginPage.login();
    await routingPage.openAddCard();
    await routingPage.waitForCardLoaded('Назва');
    const data = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../src/locators/Технологічні_карти.json'), 'utf-8')
    );
    await routingPage.validateFieldsFromDict('GenProductionRouting_LeftPanel', data.leftPanelFormFields, testInfo);
  });

  test('3. Проверка полей и таблиц вкладки Загальна інформація', async ({}, testInfo) => {
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionRouting_ListPage');
    await loginPage.login();
    await routingPage.openAddCard();
    await routingPage.waitForCardLoaded('Назва');
    const data = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../src/locators/Технологічні_карти.json'), 'utf-8')
    );
    await routingPage.switchToTab('Загальна інформація');
    if (data.tabGeneralInfo.rawMaterials && data.tabGeneralInfo.wasteProducts) {
      await routingPage.validateFieldsFromDict('GenProductionRouting_TabGeneralInfo_RawMaterials', data.tabGeneralInfo.rawMaterials, testInfo);
      await routingPage.validateFieldsFromDict('GenProductionRouting_TabGeneralInfo_WasteProducts', data.tabGeneralInfo.wasteProducts, testInfo);
    } else {
      await routingPage.validateFieldsFromDict('GenProductionRouting_TabGeneralInfo', data.tabGeneralInfo, testInfo);
    }
  });

  test('4. Проверка полей и таблиц вкладки Етапи та завдання', async ({}, testInfo) => {
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionRouting_ListPage');
    await loginPage.login();
    await routingPage.openAddCard();
    await routingPage.waitForCardLoaded('Назва');
    const data = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../src/locators/Технологічні_карти.json'), 'utf-8')
    );
    await routingPage.switchToTab('Етапи та завдання');
    if (data.tabStagesTasks.typicalStage && data.tabStagesTasks.typicalTask) {
      await routingPage.validateFieldsFromDict('GenProductionRouting_TabStagesTasks_TypicalStage', data.tabStagesTasks.typicalStage, testInfo);
      await routingPage.validateFieldsFromDict('GenProductionRouting_TabStagesTasks_TypicalTask', data.tabStagesTasks.typicalTask, testInfo);
    } else {
      await routingPage.validateFieldsFromDict('GenProductionRouting_TabStagesTasks', data.tabStagesTasks, testInfo);
    }
  });

  test('5. Заполнение тестовыми данными этапов и заданий для продукта "ТК-GP-001 Шампунь"', async () => {
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionRouting_FormPage/edit/8f49d3f5-17e7-4c71-b50b-58f0f554a460');
    await loginPage.login();
    await routingPage.switchToTab('Етапи та завдання');

    // Список оборудования из первых 2-х Виробничих завдань
    const usedProductionEquipment: string[] = ['Змішувач', 'Фасування'];

    // 3-я запись (Сервісне завдання) берет любое оборудование из ранее выбранных у Виробничих завдань
    const randomServiceEquipment = usedProductionEquipment[Math.floor(Math.random() * usedProductionEquipment.length)];

    const testRoutingData = [
      {
        stage: {
          number: '1',
          name: 'Приготування та змішування інгредієнтів (Шампунь)',
        },
        task: {
          name: 'Підготовка сировини та завантаження у реактор',
          stageName: 'Приготування та змішування інгредієнтів (Шампунь)',
          stageNumber: '1',
          orderInStage: '1',
          description: 'Підготовка реактора, додавання ПАР, очищеної води та підігрів маси',
          taskType: 'Виробниче завдання',
          equipmentType: 'Змішувач',
          hours: '1',
          minInterval: '15',
        },
      },
      {
        stage: {
          number: '2',
          name: 'Фасування та розлив (Шампунь)',
        },
        task: {
          name: 'Автоматичний розлив у флакони',
          stageName: 'Фасування та розлив (Шампунь)',
          stageNumber: '2',
          orderInStage: '1',
          description: 'Розлив маси шампуню у флакони по 250 мл та укупорка кришками',
          taskType: 'Виробниче завдання',
          equipmentType: 'Фасування',
          hours: '3',
          minInterval: '20',
        },
      },
      {
        stage: {
          number: '3',
          name: 'Сервісне обслуговування обладнання',
        },
        task: {
          name: 'Профілактичне обслуговування обладнання',
          stageName: 'Сервісне обслуговування обладнання',
          stageNumber: '3',
          orderInStage: '1',
          description: 'Перевірка вузлів та очищення обладнання після виробництва',
          taskType: 'Сервісне завдання',
          equipmentType: randomServiceEquipment,
          hours: '1',
          minInterval: '10',
        },
      },
    ];

    for (const item of testRoutingData) {
      console.log(`[Test] Создание этапа ${item.stage.number}: ${item.stage.name}...`);
      await routingPage.addStage(item.stage);

      console.log(`[Test] Создание задания для этапа ${item.stage.number}: ${item.task.name}...`);
      await routingPage.addTask(item.task);
    }
  });

  test('6. Заполнение тестовыми данными этапов и заданий для полуфабриката (Напівфабрикат)', async () => {
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionRouting_FormPage/edit/8f49d3f5-17e7-4c71-b50b-58f0f554a460');
    await loginPage.login();
    await routingPage.switchToTab('Етапи та завдання');

    // 2 Выробничих задания: первое на Реактори, второе на Змішувач
    const equipTask1 = 'Реактори';
    const equipTask2 = 'Змішувач';

    const testRoutingData = [
      {
        stage: {
          number: '1',
          name: 'Приготування маси напівфабрикату в реакторі',
        },
        task: {
          name: 'Завантаження і підігрів сировини в реакторі',
          stageName: 'Приготування маси напівфабрикату в реакторі',
          stageNumber: '1',
          orderInStage: '1',
          description: 'Синтез та підігрів маси напівфабрикату',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask1,
          productType: 'semifinished' as const,
          hours: '2',
          minInterval: '15',
        },
      },
      {
        stage: {
          number: '2',
          name: 'Гомогенізація та доведення густини',
        },
        task: {
          name: 'Перемішування та охолодження маси',
          stageName: 'Гомогенізація та доведення густини',
          stageNumber: '2',
          orderInStage: '1',
          description: 'Гомогенізація та охолодження маси',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask2,
          productType: 'semifinished' as const,
          hours: '3',
          minInterval: '20',
        },
      },
      {
        stage: {
          number: '3',
          name: 'Внутрішньовиробничий контроль якості (ВКЯ)',
        },
        task: {
          name: 'Лабораторний аналіз маси з реактора',
          stageName: 'Внутрішньовиробничий контроль якості (ВКЯ)',
          stageNumber: '3',
          orderInStage: '1',
          description: 'Відбір проб та вимірювання pH і в’язкості в реакторі',
          taskType: 'ВКЯ',
          equipmentType: equipTask1, // ВКЯ на 1-е виробниче завдання (Реактори)
          productType: 'semifinished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '4',
          name: 'Сервісне обслуговування змішувача',
        },
        task: {
          name: 'Санітарна обробка та промивка змішувача',
          stageName: 'Сервісне обслуговування змішувача',
          stageNumber: '4',
          orderInStage: '1',
          description: 'Промивка емності та перевірка клапанів змішувача',
          taskType: 'Сервісне завдання',
          equipmentType: equipTask2, // Сервісне на 2-е виробниче завдання (Змішувач)
          productType: 'semifinished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
    ];

    for (const item of testRoutingData) {
      console.log(`[Test] Создание этапа ${item.stage.number}: ${item.stage.name}...`);
      await routingPage.addStage(item.stage);

      console.log(`[Test] Создание задания для этапа ${item.stage.number}: ${item.task.name} (Тип: ${item.task.taskType}, Обладнання: ${item.task.equipmentType})...`);
      await routingPage.addTask(item.task);
    }
  });

  test('7. Заполнение тестовыми данными этапов и заданий для продукта "ТК-GP-003 Тонік для обличчя"', async () => {
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionRouting_FormPage/edit/0e758942-6f29-4fcf-8b6c-77457a7f1e23');
    await loginPage.login();
    await routingPage.switchToTab('Етапи та завдання');

    // Список оборудования из первых 2-х Виробничих завдань
    const usedProductionEquipment: string[] = ['Змішувач', 'Фасування'];
    const randomServiceEquipment = usedProductionEquipment[Math.floor(Math.random() * usedProductionEquipment.length)];

    const testRoutingData = [
      {
        stage: {
          number: '1',
          name: 'Приготування розчину тоніка (Тонік для обличчя)',
        },
        task: {
          name: 'Змішування компонентів тоніка та фільтрація',
          stageName: 'Приготування розчину тоніка (Тонік для обличчя)',
          stageNumber: '1',
          orderInStage: '1',
          description: 'Змішування екстрактів, очищеної води та фільтрація маси',
          taskType: 'Виробниче завдання',
          equipmentType: 'Змішувач',
          productType: 'finished' as const,
          hours: '2',
          minInterval: '15',
        },
      },
      {
        stage: {
          number: '2',
          name: 'Розлив у флакони (Тонік для обличчя)',
        },
        task: {
          name: 'Автоматичне фасування тоніка у флакони 200мл',
          stageName: 'Розлив у флакони (Тонік для обличчя)',
          stageNumber: '2',
          orderInStage: '1',
          description: 'Фасування розчину у флакони 200мл та закупорювання дозаторами',
          taskType: 'Виробниче завдання',
          equipmentType: 'Фасування',
          productType: 'finished' as const,
          hours: '3',
          minInterval: '20',
        },
      },
      {
        stage: {
          number: '3',
          name: 'Сервісне обслуговування обладнання',
        },
        task: {
          name: 'Санітарна обробка та промивка ліній',
          stageName: 'Сервісне обслуговування обладнання',
          stageNumber: '3',
          orderInStage: '1',
          description: 'Промивка та дезінфекція ліній розливу після завершення партії',
          taskType: 'Сервісне завдання',
          equipmentType: randomServiceEquipment,
          productType: 'finished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
    ];

    for (const item of testRoutingData) {
      console.log(`[Test] Создание этапа ${item.stage.number}: ${item.stage.name}...`);
      await routingPage.addStage(item.stage);

      console.log(`[Test] Создание задания для этапа ${item.stage.number}: ${item.task.name} (Тип: ${item.task.taskType}, Обладнання: ${item.task.equipmentType})...`);
      await routingPage.addTask(item.task);
    }
  });

  test('8. Заполнение тестовыми данными этапов и заданий для продукта "ТК-GP-004 Патчі під очі"', async () => {
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionRouting_FormPage/edit/70f8d76c-3271-4c02-9c2c-77d93b2bdac8');
    await loginPage.login();
    await routingPage.switchToTab('Етапи та завдання');

    // Оборудование для 2-х Виробничих завдань
    const equipTask1 = 'Прес';
    const equipTask2 = 'Маркування та пакування';

    const usedProductionEquipment: string[] = [equipTask1, equipTask2];
    const randomServiceEquipment = usedProductionEquipment[Math.floor(Math.random() * usedProductionEquipment.length)];

    const testRoutingData = [
      {
        stage: {
          number: '1',
          name: 'Формування та вирубка патчів (Патчі під очі)',
        },
        task: {
          name: 'Вирубка гідрогелевих патчів на пресі',
          stageName: 'Формування та вирубка патчів (Патчі під очі)',
          stageNumber: '1',
          orderInStage: '1',
          description: 'Вирубка патчів із гідрогелевого полотна на тигельному пресі',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask1,
          productType: 'finished' as const,
          hours: '2',
          minInterval: '15',
        },
      },
      {
        stage: {
          number: '2',
          name: 'Упаковка у баночки та блістери (Патчі під очі)',
        },
        task: {
          name: 'Укладання патчів та герметизація упаковки',
          stageName: 'Упаковка у баночки та блістери (Патчі під очі)',
          stageNumber: '2',
          orderInStage: '1',
          description: 'Укладання патчів у баночки, заливка сироваткою та запайка фольгою',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask2,
          productType: 'finished' as const,
          hours: '3',
          minInterval: '20',
        },
      },
      {
        stage: {
          number: '3',
          name: 'Сервісне обслуговування обладнання',
        },
        task: {
          name: 'Технічний огляд та чистка прес-форм',
          stageName: 'Сервісне обслуговування обладнання',
          stageNumber: '3',
          orderInStage: '1',
          description: 'Очищення штампів та змащування направляючих преса',
          taskType: 'Сервісне завдання',
          equipmentType: randomServiceEquipment,
          productType: 'finished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
    ];

    for (const item of testRoutingData) {
      console.log(`[Test] Создание этапа ${item.stage.number}: ${item.stage.name}...`);
      await routingPage.addStage(item.stage);

      console.log(`[Test] Создание задания для этапа ${item.stage.number}: ${item.task.name} (Тип: ${item.task.taskType}, Обладнання: ${item.task.equipmentType})...`);
      await routingPage.addTask(item.task);
    }
  });

  test('9. Заполнение тестовыми данными этапов и заданий для полуфабриката "Основа кондиціонера"', async () => {
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionRouting_FormPage/edit/5fdf5243-d52a-4828-b0d8-e985720867a2');
    await loginPage.login();
    await routingPage.switchToTab('Етапи та завдання');

    // 2 Выробничих задания: первое на Реактори, второе на Змішувач
    const equipTask1 = 'Реактори';
    const equipTask2 = 'Змішувач';

    const testRoutingData = [
      {
        stage: {
          number: '1',
          name: 'Синтез емульсії (Основа кондиціонера)',
        },
        task: {
          name: 'Плавка восків у реакторі',
          stageName: 'Синтез емульсії (Основа кондиціонера)',
          stageNumber: '1',
          orderInStage: '1',
          description: 'Нагрів масляної фази до 75°C, розплавлення восків та емульгація',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask1,
          productType: 'semifinished' as const,
          hours: '3',
          minInterval: '15',
        },
      },
      {
        stage: {
          number: '2',
          name: 'Охолодження та змішування',
        },
        task: {
          name: 'Перемішування маси та добавки',
          stageName: 'Охолодження та змішування',
          stageNumber: '2',
          orderInStage: '1',
          description: 'Охолодження емульсії до 40°C та введення термочутливих активів',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask2,
          productType: 'semifinished' as const,
          hours: '2',
          minInterval: '20',
        },
      },
      {
        stage: {
          number: '3',
          name: 'Контроль якості (ВКЯ)',
        },
        task: {
          name: 'Перевірка в’язкості та pH',
          stageName: 'Контроль якості (ВКЯ)',
          stageNumber: '3',
          orderInStage: '1',
          description: 'Лабораторний аналіз стабільності емульсії з реактора',
          taskType: 'ВКЯ',
          equipmentType: equipTask1, // ВКЯ на 1-е виробниче завдання (Реактори)
          productType: 'semifinished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '4',
          name: 'Обслуговування змішувача',
        },
        task: {
          name: 'Промивка ємності змішувача',
          stageName: 'Обслуговування змішувача',
          stageNumber: '4',
          orderInStage: '1',
          description: 'Санітарна обробка гарячою водою та парами перед наступним зварюванням',
          taskType: 'Сервісне завдання',
          equipmentType: equipTask2, // Сервісне на 2-е виробниче завдання (Змішувач)
          productType: 'semifinished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
    ];

    for (const item of testRoutingData) {
      console.log(`[Test] Создание этапа ${item.stage.number}: ${item.stage.name}...`);
      await routingPage.addStage(item.stage);

      console.log(`[Test] Создание задания для этапа ${item.stage.number}: ${item.task.name} (Тип: ${item.task.taskType}, Обладнання: ${item.task.equipmentType})...`);
      await routingPage.addTask(item.task);
    }
  });

  test('10. Заполнение тестовыми данными этапов и заданий для полуфабриката "ТК-NF-202 Концентрат"', async () => {
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionRouting_FormPage/edit/60bed62d-f343-4e24-931b-e8d5b7647b17');
    await loginPage.login();
    await routingPage.switchToTab('Етапи та завдання');

    // 2 Выробничих задания: первое на Реактори, второе на Змішувач
    const equipTask1 = 'Реактори';
    const equipTask2 = 'Змішувач';

    const testRoutingData = [
      {
        stage: {
          number: '1',
          name: 'Синтез концентрату (ТК-NF-202)',
        },
        task: {
          name: 'Екстракція у реакторі',
          stageName: 'Синтез концентрату (ТК-NF-202)',
          stageNumber: '1',
          orderInStage: '1',
          description: 'Екстракція активних компонентів при контрольованій температурі',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask1,
          productType: 'semifinished' as const,
          hours: '3',
          minInterval: '15',
        },
      },
      {
        stage: {
          number: '2',
          name: 'Стабілізація концентрату',
        },
        task: {
          name: 'Змішування та гомогенізація',
          stageName: 'Стабілізація концентрату',
          stageNumber: '2',
          orderInStage: '1',
          description: 'Гомогенізація суміші для досягнення однорідності концентрату',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask2,
          productType: 'semifinished' as const,
          hours: '2',
          minInterval: '20',
        },
      },
      {
        stage: {
          number: '3',
          name: 'Контроль якості (ВКЯ)',
        },
        task: {
          name: 'Аналіз концентрації та pH',
          stageName: 'Контроль якості (ВКЯ)',
          stageNumber: '3',
          orderInStage: '1',
          description: 'Відбір проб та лабораторна перевірка характеристик концентрату',
          taskType: 'ВКЯ',
          equipmentType: equipTask1, // ВКЯ на 1-е виробниче завдання (Реактори)
          productType: 'semifinished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '4',
          name: 'Обслуговування змішувача',
        },
        task: {
          name: 'Санітарна обробка змішувача',
          stageName: 'Обслуговування змішувача',
          stageNumber: '4',
          orderInStage: '1',
          description: 'Санітарна промивка та дезінфекція ємності змішувача',
          taskType: 'Сервісне завдання',
          equipmentType: equipTask2, // Сервісне на 2-е виробниче завдання (Змішувач)
          productType: 'semifinished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
    ];

    for (const item of testRoutingData) {
      console.log(`[Test] Создание этапа ${item.stage.number}: ${item.stage.name}...`);
      await routingPage.addStage(item.stage);

      console.log(`[Test] Создание задания для этапа ${item.stage.number}: ${item.task.name} (Тип: ${item.task.taskType}, Обладнання: ${item.task.equipmentType})...`);
      await routingPage.addTask(item.task);
    }
  });

  test('11. Заполнение тестовыми данными этапов и заданий для полуфабриката "ТК-NF-301 Крем-база"', async () => {
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionRouting_FormPage/edit/c0313205-1026-443b-8efe-1155b2085ab0');
    await loginPage.login();
    await routingPage.switchToTab('Етапи та завдання');

    // 2 Выробничих задания: первое на Реактори, второе на Змішувач
    const equipTask1 = 'Реактори';
    const equipTask2 = 'Змішувач';

    const testRoutingData = [
      {
        stage: {
          number: '1',
          name: 'Синтез крем-бази (ТК-NF-301)',
        },
        task: {
          name: 'Емульгація крему у реакторі',
          stageName: 'Синтез крем-бази (ТК-NF-301)',
          stageNumber: '1',
          orderInStage: '1',
          description: 'Нагрів та емульгація водно-масляної фази крему у реакторі',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask1,
          productType: 'semifinished' as const,
          hours: '3',
          minInterval: '15',
        },
      },
      {
        stage: {
          number: '2',
          name: 'Диспергування та структурація',
        },
        task: {
          name: 'Гомогенізація маси крему',
          stageName: 'Диспергування та структурація',
          stageNumber: '2',
          orderInStage: '1',
          description: 'Высокооборотне змішування для створення стабільної кремової структури',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask2,
          productType: 'semifinished' as const,
          hours: '2',
          minInterval: '20',
        },
      },
      {
        stage: {
          number: '3',
          name: 'Контроль якості (ВКЯ)',
        },
        task: {
          name: 'Вимірювання в’язкості та pH',
          stageName: 'Контроль якості (ВКЯ)',
          stageNumber: '3',
          orderInStage: '1',
          description: 'Лабораторний вимір показників в’язкості, рН та стабільності крему',
          taskType: 'ВКЯ',
          equipmentType: equipTask1, // ВКЯ на 1-е виробниче завдання (Реактори)
          productType: 'semifinished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '4',
          name: 'Обслуговування змішувача',
        },
        task: {
          name: 'Санітарна обробка змішувача',
          stageName: 'Обслуговування змішувача',
          stageNumber: '4',
          orderInStage: '1',
          description: 'Дезінфекція та мийка робочої ємності змішувача',
          taskType: 'Сервісне завдання',
          equipmentType: equipTask2, // Сервісне на 2-е виробниче завдання (Змішувач)
          productType: 'semifinished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
    ];

    for (const item of testRoutingData) {
      console.log(`[Test] Создание этапа ${item.stage.number}: ${item.stage.name}...`);
      await routingPage.addStage(item.stage);

      console.log(`[Test] Создание задания для этапа ${item.stage.number}: ${item.task.name} (Тип: ${item.task.taskType}, Обладнання: ${item.task.equipmentType})...`);
      await routingPage.addTask(item.task);
    }
  });

  test('12. Заполнение тестовыми данными этапов и заданий для полуфабриката "ТК-NF-302 Кавовий екстракт"', async () => {
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionRouting_FormPage/edit/bd51a4b9-1507-4253-b78e-148db8fcd6a8');
    await loginPage.login();
    await routingPage.switchToTab('Етапи та завдання');

    // 2 Выробничих задания: первое на Реактори, второе на Змішувач
    const equipTask1 = 'Реактори';
    const equipTask2 = 'Змішувач';

    const testRoutingData = [
      {
        stage: {
          number: '1',
          name: 'Екстракція кави (ТК-NF-302)',
        },
        task: {
          name: 'Варіння та настоювання екстракту',
          stageName: 'Екстракція кави (ТК-NF-302)',
          stageNumber: '1',
          orderInStage: '1',
          description: 'Екстрагування активних речовин з меленої кави при високому тиску',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask1,
          productType: 'semifinished' as const,
          hours: '3',
          minInterval: '15',
        },
      },
      {
        stage: {
          number: '2',
          name: 'Фільтрація та концентрування',
        },
        task: {
          name: 'Змішування та очистка розчину',
          stageName: 'Фільтрація та концентрування',
          stageNumber: '2',
          orderInStage: '1',
          description: 'Фільтрація від осаду та стабілізація рідкої фази екстракту',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask2,
          productType: 'semifinished' as const,
          hours: '2',
          minInterval: '20',
        },
      },
      {
        stage: {
          number: '3',
          name: 'Контроль якості (ВКЯ)',
        },
        task: {
          name: 'Аналіз вмісту кофеїну та pH',
          stageName: 'Контроль якості (ВКЯ)',
          stageNumber: '3',
          orderInStage: '1',
          description: 'Перевірка сухих речовин, вмісту активів та pH водного екстракту',
          taskType: 'ВКЯ',
          equipmentType: equipTask1, // ВКЯ на 1-е виробниче завдання (Реактори)
          productType: 'semifinished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '4',
          name: 'Обслуговування змішувача',
        },
        task: {
          name: 'Промивка сит та ємностей',
          stageName: 'Обслуговування змішувача',
          stageNumber: '4',
          orderInStage: '1',
          description: 'Санітарна обробка та видалення кавового осаду з трубопроводів',
          taskType: 'Сервісне завдання',
          equipmentType: equipTask2, // Сервісне на 2-е виробниче завдання (Змішувач)
          productType: 'semifinished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
    ];

    for (const item of testRoutingData) {
      console.log(`[Test] Создание этапа ${item.stage.number}: ${item.stage.name}...`);
      await routingPage.addStage(item.stage);

      console.log(`[Test] Создание задания для этапа ${item.stage.number}: ${item.task.name} (Тип: ${item.task.taskType}, Обладнання: ${item.task.equipmentType})...`);
      await routingPage.addTask(item.task);
    }
  });

  test('13. Заполнение тестовыми данными этапов и заданий для полуфабриката "ТК-NF-401 ПАВ-основа маси"', async () => {
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionRouting_FormPage/edit/7c7923a3-d195-419c-8d9f-13079b85b2e6');
    await loginPage.login();
    await routingPage.switchToTab('Етапи та завдання');

    // 2 Выробничих задания: первое на Реактори, второе на Змішувач
    const equipTask1 = 'Реактори';
    const equipTask2 = 'Змішувач';

    const testRoutingData = [
      {
        stage: {
          number: '1',
          name: 'Синтез ПАР-основи (ТК-NF-401)',
        },
        task: {
          name: 'Нейтралізація та сульфування',
          stageName: 'Синтез ПАР-основи (ТК-NF-401)',
          stageNumber: '1',
          orderInStage: '1',
          description: 'Процес сульфування та нейтралізації маси в реакторі',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask1,
          productType: 'semifinished' as const,
          hours: '3',
          minInterval: '15',
        },
      },
      {
        stage: {
          number: '2',
          name: 'Розведення та стабілізація',
        },
        task: {
          name: 'Змішування з водною фазою',
          stageName: 'Розведення та стабілізація',
          stageNumber: '2',
          orderInStage: '1',
          description: 'Введення очищеної води та змішування до однорідного стану',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask2,
          productType: 'semifinished' as const,
          hours: '2',
          minInterval: '20',
        },
      },
      {
        stage: {
          number: '3',
          name: 'Контроль якості (ВКЯ)',
        },
        task: {
          name: 'Вимірювання сухих речовин та pH',
          stageName: 'Контроль якості (ВКЯ)',
          stageNumber: '3',
          orderInStage: '1',
          description: 'Лабораторний вимір вмісту сухих речовин, рН та піноутворення',
          taskType: 'ВКЯ',
          equipmentType: equipTask1, // ВКЯ на 1-е виробниче завдання (Реактори)
          productType: 'semifinished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '4',
          name: 'Обслуговування змішувача',
        },
        task: {
          name: 'Промивка реактора та змішувача',
          stageName: 'Обслуговування змішувача',
          stageNumber: '4',
          orderInStage: '1',
          description: 'Промивка гарячим конденсатом та парою після завершення синтезу',
          taskType: 'Сервісне завдання',
          equipmentType: equipTask2, // Сервісне на 2-е виробниче завдання (Змішувач)
          productType: 'semifinished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
    ];

    for (const item of testRoutingData) {
      console.log(`[Test] Создание этапа ${item.stage.number}: ${item.stage.name}...`);
      await routingPage.addStage(item.stage);

      console.log(`[Test] Создание задания для этапа ${item.stage.number}: ${item.task.name} (Тип: ${item.task.taskType}, Обладнання: ${item.task.equipmentType})...`);
      await routingPage.addTask(item.task);
    }
  });

  test('14. Заполнение тестовыми данными этапов и заданий для продукта "ТК-GP-002 Кондиціонер"', async () => {
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionRouting_FormPage/edit/87e45da2-9611-480d-b615-ff6ec385fdd8');
    await loginPage.login();
    await routingPage.switchToTab('Етапи та завдання');

    // Список оборудования из первых 2-х Виробничих завдань
    const usedProductionEquipment: string[] = ['Змішувач', 'Фасування'];
    const randomServiceEquipment = usedProductionEquipment[Math.floor(Math.random() * usedProductionEquipment.length)];

    const testRoutingData = [
      {
        stage: {
          number: '1',
          name: 'Приготування маси кондиціонера (ТК-GP-002)',
        },
        task: {
          name: 'Змішування кондиціонуючих добавок',
          stageName: 'Приготування маси кондиціонера (ТК-GP-002)',
          stageNumber: '1',
          orderInStage: '1',
          description: 'Змішування емульсійної бази, олій та віддушок у змішувачі',
          taskType: 'Виробниче завдання',
          equipmentType: 'Змішувач',
          productType: 'finished' as const,
          hours: '2',
          minInterval: '15',
        },
      },
      {
        stage: {
          number: '2',
          name: 'Розлив у туби та флакони (ТК-GP-002)',
        },
        task: {
          name: 'Автоматичне фасування кондиціонера у туби',
          stageName: 'Розлив у туби та флакони (ТК-GP-002)',
          stageNumber: '2',
          orderInStage: '1',
          description: 'Фасування кремоподібної маси у туби 250мл та запайка шва',
          taskType: 'Виробниче завдання',
          equipmentType: 'Фасування',
          productType: 'finished' as const,
          hours: '3',
          minInterval: '20',
        },
      },
      {
        stage: {
          number: '3',
          name: 'Сервісне обслуговування обладнання',
        },
        task: {
          name: 'Промивка та дезінфекція дозаторів',
          stageName: 'Сервісне обслуговування обладнання',
          stageNumber: '3',
          orderInStage: '1',
          description: 'Санітарна обробка ліній розливу та дозуючих сопел',
          taskType: 'Сервісне завдання',
          equipmentType: randomServiceEquipment,
          productType: 'finished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
    ];

    for (const item of testRoutingData) {
      console.log(`[Test] Создание этапа ${item.stage.number}: ${item.stage.name}...`);
      await routingPage.addStage(item.stage);

      console.log(`[Test] Создание задания для этапа ${item.stage.number}: ${item.task.name} (Тип: ${item.task.taskType}, Обладнання: ${item.task.equipmentType})...`);
      await routingPage.addTask(item.task);
    }
  });

  test('15. Заполнение тестовыми данными этапов и заданий для продукта "ТК-GP-005 Гель для душу"', async () => {
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionRouting_FormPage/edit/ce54f084-2359-4245-8e09-f940fa83333e');
    await loginPage.login();
    await routingPage.switchToTab('Етапи та завдання');

    // Список оборудования из первых 2-х Виробничих завдань
    const usedProductionEquipment: string[] = ['Змішувач', 'Фасування'];
    const randomServiceEquipment = usedProductionEquipment[Math.floor(Math.random() * usedProductionEquipment.length)];

    const testRoutingData = [
      {
        stage: {
          number: '1',
          name: 'Приготування маси гелю (ТК-GP-005)',
        },
        task: {
          name: 'Змішування ПАР та загусника',
          stageName: 'Приготування маси гелю (ТК-GP-005)',
          stageNumber: '1',
          orderInStage: '1',
          description: 'Змішування очищеної води, м’яких ПАР, екстрактів та регулювання в’язкості',
          taskType: 'Виробниче завдання',
          equipmentType: 'Змішувач',
          productType: 'finished' as const,
          hours: '2',
          minInterval: '15',
        },
      },
      {
        stage: {
          number: '2',
          name: 'Розлив у флакони 400мл (ТК-GP-005)',
        },
        task: {
          name: 'Автоматичний розлив у флакони',
          stageName: 'Розлив у флакони 400мл (ТК-GP-005)',
          stageNumber: '2',
          orderInStage: '1',
          description: 'Дозування гелю у прозорі флакони 400мл та укупорка фліп-топ кришками',
          taskType: 'Виробниче завдання',
          equipmentType: 'Фасування',
          productType: 'finished' as const,
          hours: '3',
          minInterval: '20',
        },
      },
      {
        stage: {
          number: '3',
          name: 'Сервісне обслуговування обладнання',
        },
        task: {
          name: 'Санітарна обробка та мийка ліній',
          stageName: 'Сервісне обслуговування обладнання',
          stageNumber: '3',
          orderInStage: '1',
          description: 'Мийка роторного насоса, трубопроводів та заповнювальних голок',
          taskType: 'Сервісне завдання',
          equipmentType: randomServiceEquipment,
          productType: 'finished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
    ];

    for (const item of testRoutingData) {
      console.log(`[Test] Создание этапа ${item.stage.number}: ${item.stage.name}...`);
      await routingPage.addStage(item.stage);

      console.log(`[Test] Создание задания для этапа ${item.stage.number}: ${item.task.name} (Тип: ${item.task.taskType}, Обладнання: ${item.task.equipmentType})...`);
      await routingPage.addTask(item.task);
    }
  });
});
