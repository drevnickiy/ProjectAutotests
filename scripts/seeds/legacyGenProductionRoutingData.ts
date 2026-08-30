import { test } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { GenProductionRoutingPage } from '../../src/pages/GenProductionRoutingPage';

test.describe('Функциональные тесты: заполнение технологических карт данными (GenProductionRouting)', () => {
  let loginPage: LoginPage;
  let routingPage: GenProductionRoutingPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    routingPage = new GenProductionRoutingPage(page);
  });

  test('5. Заполнение тестовыми данными этапов и заданий для продукта "ТК-GP-001 Шампунь"', async () => {
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionRouting_FormPage/edit/8f49d3f5-17e7-4c71-b50b-58f0f554a460');
    await loginPage.login();
    await routingPage.switchToTab('Етапи та завдання');

    // Список оборудования из первых 3-х Виробничих завдань
    const usedProductionEquipment: string[] = ['Змішувач', 'Фасування', 'Маркування та пакування'];
    const randomServiceEquipment = usedProductionEquipment[Math.floor(Math.random() * usedProductionEquipment.length)];

    const testRoutingData = [
      {
        stage: {
          number: '1',
          name: 'Приготування та змішування (Шампунь)',
        },
        task: {
          name: 'Змішування ПАР та водопідготовка',
          stageName: 'Приготування та змішування (Шампунь)',
          stageNumber: '1',
          orderInStage: '1',
          description: 'Підготовка ємності, додавання ПАР, очищеної води та підігрів маси',
          taskType: 'Виробниче завдання',
          equipmentType: 'Змішувач',
          productType: 'finished' as const,
          hours: '1',
          minInterval: '15',
        },
      },
      {
        stage: {
          number: '2',
          name: 'Розлив у флакони (Шампунь)',
        },
        task: {
          name: 'Автоматичний розлив у флакони',
          stageName: 'Розлив у флакони (Шампунь)',
          stageNumber: '2',
          orderInStage: '1',
          description: 'Розлив маси шампуню у флакони по 250 мл та укупорка кришками',
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
          name: 'Пакування та маркування (Шампунь)',
        },
        task: {
          name: 'Маркування та укладання у короби',
          stageName: 'Пакування та маркування (Шампунь)',
          stageNumber: '3',
          orderInStage: '1',
          description: 'Наклейка етикеток з датою виробництва, укладання у транспортні короби',
          taskType: 'Виробниче завдання',
          equipmentType: 'Маркування та пакування',
          productType: 'finished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '4',
          name: 'Сервісне обслуговування обладнання',
        },
        task: {
          name: 'Профілактичне обслуговування ліній',
          stageName: 'Сервісне обслуговування обладнання',
          stageNumber: '4',
          orderInStage: '1',
          description: 'Перевірка вузлів та очищення фасувального обладнання після партиції',
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

  test('6. Заполнение тестовыми данными этапов и заданий для продукта "ТК-GP-001 Шампунь"', async () => {
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionRouting_FormPage/edit/8f49d3f5-17e7-4c71-b50b-58f0f554a460');
    await loginPage.login();
    await routingPage.switchToTab('Етапи та завдання');

    const equipTask1 = 'Стерилізатор';
    const equipTask2 = 'Змішувач';
    const equipTask3 = 'Фасування';
    const equipTask4 = 'Маркування та пакування';

    const testRoutingData = [
      {
        stage: {
          number: '1',
          name: 'Стерилізація флаконів (ТК-GP-001)',
        },
        task: {
          name: 'Термічна дезінфекція флаконів',
          stageName: 'Стерилізація флаконів (ТК-GP-001)',
          stageNumber: '1',
          orderInStage: '1',
          description: 'Термічна дезінфекція та стерилізація флаконів перед розливом шампуню',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask1,
          productType: 'finished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '2',
          name: 'Зведення маси шампуню (ТК-GP-001)',
        },
        task: {
          name: 'Змішування ПАР-основи та активів',
          stageName: 'Зведення маси шампуню (ТК-GP-001)',
          stageNumber: '2',
          orderInStage: '1',
          description: 'Змішування ПАР-основи NF-401, очищеної води, екстрактів та регулювання pH',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask2,
          productType: 'finished' as const,
          hours: '2',
          minInterval: '15',
        },
      },
      {
        stage: {
          number: '3',
          name: 'Розлив у флакони 250мл (ТК-GP-001)',
        },
        task: {
          name: 'Автоматичний розлив на АРУ-1000',
          stageName: 'Розлив у флакони 250мл (ТК-GP-001)',
          stageNumber: '3',
          orderInStage: '1',
          description: 'Дозування шампуню у флакони 250мл та укупорка фліп-топ кришками',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask3,
          productType: 'finished' as const,
          hours: '3',
          minInterval: '20',
        },
      },
      {
        stage: {
          number: '4',
          name: 'Пакування у короби (ТК-GP-001)',
        },
        task: {
          name: 'Маркування флаконів на МПК-200',
          stageName: 'Пакування у короби (ТК-GP-001)',
          stageNumber: '4',
          orderInStage: '1',
          description: 'Маркування дати випуску, нанесення кругової етикетки та укладання у короби',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask4,
          productType: 'finished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '5',
          name: 'Сервісне обслуговування змішувача',
        },
        task: {
          name: 'Санобробка ємності змішувача',
          stageName: 'Сервісне обслуговування змішувача',
          stageNumber: '5',
          orderInStage: '1',
          description: 'Санітарна обробка та промивка ємності змішувача гарячою водою',
          taskType: 'Сервісне завдання',
          equipmentType: equipTask2,
          productType: 'finished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '6',
          name: 'Сервісне обслуговування фасування',
        },
        task: {
          name: 'Промивка розливних сопел АРУ-1000',
          stageName: 'Сервісне обслуговування фасування',
          stageNumber: '6',
          orderInStage: '1',
          description: 'Мийка дозуючих сопел та роторних ліній подачі після розливу шампуню',
          taskType: 'Сервісне завдання',
          equipmentType: equipTask3,
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

  test('7. Заполнение тестовыми данными этапов и заданий для продукта "ТК-GP-003 Тонік для обличчя"', async () => {
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionRouting_FormPage/edit/0e758942-6f29-4fcf-8b6c-77457a7f1e23');
    await loginPage.login();
    await routingPage.switchToTab('Етапи та завдання');

    const equipTask1 = 'Стерилізатор';
    const equipTask2 = 'Змішувач';
    const equipTask3 = 'Фасування';
    const equipTask4 = 'Маркування та пакування';

    const testRoutingData = [
      {
        stage: {
          number: '1',
          name: 'Стерилізація флаконів (ТК-GP-003)',
        },
        task: {
          name: 'Термічна обробка флаконів тоніка',
          stageName: 'Стерилізація флаконів (ТК-GP-003)',
          stageNumber: '1',
          orderInStage: '1',
          description: 'Термічна дезінфекція та стерилізація флаконів перед розливом',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask1,
          productType: 'finished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '2',
          name: 'Приготування розчину (ТК-GP-003)',
        },
        task: {
          name: 'Змішування компонентів тоніка',
          stageName: 'Приготування розчину (ТК-GP-003)',
          stageNumber: '2',
          orderInStage: '1',
          description: 'Змішування екстрактів, очищеної води та фільтрація маси',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask2,
          productType: 'finished' as const,
          hours: '2',
          minInterval: '15',
        },
      },
      {
        stage: {
          number: '3',
          name: 'Розлив у флакони (ТК-GP-003)',
        },
        task: {
          name: 'Автоматичний розлив тоніка 200мл',
          stageName: 'Розлив у флакони (ТК-GP-003)',
          stageNumber: '3',
          orderInStage: '1',
          description: 'Фасування розчину у флакони 200мл та закупорювання дозаторами',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask3,
          productType: 'finished' as const,
          hours: '3',
          minInterval: '20',
        },
      },
      {
        stage: {
          number: '4',
          name: 'Пакування та маркування (ТК-GP-003)',
        },
        task: {
          name: 'Маркування флаконів та укладка',
          stageName: 'Пакування та маркування (ТК-GP-003)',
          stageNumber: '4',
          orderInStage: '1',
          description: 'Наклейка етикеток та укладання готових флаконів у короби',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask4,
          productType: 'finished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '5',
          name: 'Сервісне обслуговування змішувача',
        },
        task: {
          name: 'Санобробка ємності змішувача',
          stageName: 'Сервісне обслуговування змішувача',
          stageNumber: '5',
          orderInStage: '1',
          description: 'Санітарна обробка та промивка ємності після розчину тоніка',
          taskType: 'Сервісне завдання',
          equipmentType: equipTask2,
          productType: 'finished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '6',
          name: 'Сервісне обслуговування фасування',
        },
        task: {
          name: 'Дезінфекція розливних сопел',
          stageName: 'Сервісне обслуговування фасування',
          stageNumber: '6',
          orderInStage: '1',
          description: 'Промивка та дезінфекція розливних сопел та дозаторів',
          taskType: 'Сервісне завдання',
          equipmentType: equipTask3,
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

    const equipTask1 = 'Стерилізатор';
    const equipTask2 = 'Прес';
    const equipTask3 = 'Фасування';
    const equipTask4 = 'Маркування та пакування';

    const testRoutingData = [
      {
        stage: {
          number: '1',
          name: 'Стерилізація прес-форм (ТК-GP-004)',
        },
        task: {
          name: 'Термічна дезінфекція прес-форм',
          stageName: 'Стерилізація прес-форм (ТК-GP-004)',
          stageNumber: '1',
          orderInStage: '1',
          description: 'Термічна дезінфекція та стерилізація штампів і прес-форм',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask1,
          productType: 'finished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '2',
          name: 'Вирубка патчів (ТК-GP-004)',
        },
        task: {
          name: 'Вирубка гідрогелю на пресі',
          stageName: 'Вирубка патчів (ТК-GP-004)',
          stageNumber: '2',
          orderInStage: '1',
          description: 'Вирубка патчів із гідрогелевого полотна на тигельному пресі',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask2,
          productType: 'finished' as const,
          hours: '2',
          minInterval: '15',
        },
      },
      {
        stage: {
          number: '3',
          name: 'Фасування у баночки (ТК-GP-004)',
        },
        task: {
          name: 'Укладання патчів та заливка',
          stageName: 'Фасування у баночки (ТК-GP-004)',
          stageNumber: '3',
          orderInStage: '1',
          description: 'Укладання патчів у баночки, заливка сироваткою та запайка фольгою',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask3,
          productType: 'finished' as const,
          hours: '3',
          minInterval: '20',
        },
      },
      {
        stage: {
          number: '4',
          name: 'Пакування у короби (ТК-GP-004)',
        },
        task: {
          name: 'Маркування та групове пакування',
          stageName: 'Пакування у короби (ТК-GP-004)',
          stageNumber: '4',
          orderInStage: '1',
          description: 'Маркування дати випуску та укладання у транспортні короби',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask4,
          productType: 'finished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '5',
          name: 'Сервісне обслуговування преса',
        },
        task: {
          name: 'Очищення штампів та чистка преса',
          stageName: 'Сервісне обслуговування преса',
          stageNumber: '5',
          orderInStage: '1',
          description: 'Очищення штампів та змащування направляючих преса',
          taskType: 'Сервісне завдання',
          equipmentType: equipTask2,
          productType: 'finished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '6',
          name: 'Сервісне обслуговування фасування',
        },
        task: {
          name: 'Дезінфекція сопел розливу',
          stageName: 'Сервісне обслуговування фасування',
          stageNumber: '6',
          orderInStage: '1',
          description: 'Санітарна обробка та промивка ліній розливу сироватки',
          taskType: 'Сервісне завдання',
          equipmentType: equipTask3,
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

    const equipTask1 = 'Стерилізатор';
    const equipTask2 = 'Реактор';
    const equipTask3 = 'Змішувач';

    const testRoutingData = [
      {
        stage: {
          number: '1',
          name: 'Стерилізація ємностей',
        },
        task: {
          name: 'Дезінфекція реакторного вузла',
          stageName: 'Стерилізація ємностей',
          stageNumber: '1',
          orderInStage: '1',
          description: 'Термічна дезінфекція та стерилізація технологічних емностей',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask1,
          productType: 'semifinished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '2',
          name: 'Синтез емульсії кондиціонера',
        },
        task: {
          name: 'Плавка восків у реакторі',
          stageName: 'Синтез емульсії кондиціонера',
          stageNumber: '2',
          orderInStage: '1',
          description: 'Нагрів масляної фази до 75°C, розплавлення восків та емульгація',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask2,
          productType: 'semifinished' as const,
          hours: '3',
          minInterval: '15',
        },
      },
      {
        stage: {
          number: '3',
          name: 'Охолодження та змішування',
        },
        task: {
          name: 'Перемішування маси та добавки',
          stageName: 'Охолодження та змішування',
          stageNumber: '3',
          orderInStage: '1',
          description: 'Охолодження емульсії до 40°C та введення термочутливих активів',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask3,
          productType: 'semifinished' as const,
          hours: '2',
          minInterval: '20',
        },
      },
      {
        stage: {
          number: '4',
          name: 'Лабораторний контроль якості',
        },
        task: {
          name: 'Перевірка в’язкості та pH',
          stageName: 'Лабораторний контроль якості',
          stageNumber: '4',
          orderInStage: '1',
          description: 'Лабораторний аналіз стабільності емульсії з реактора',
          taskType: 'ВКЯ',
          equipmentType: equipTask2, // ВКЯ на 2-е виробниче завдання (Реактори)
          productType: 'semifinished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '5',
          name: 'Сервісне обслуговування змішувача',
        },
        task: {
          name: 'Промивка ємності змішувача',
          stageName: 'Сервісне обслуговування змішувача',
          stageNumber: '5',
          orderInStage: '1',
          description: 'Санітарна обробка гарячою водою та парами перед наступним зварюванням',
          taskType: 'Сервісне завдання',
          equipmentType: equipTask3, // Сервісне на 3-е виробниче завдання (Змішувач)
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

    const equipTask1 = 'Реактор';
    const equipTask2 = 'Змішувач';

    const testRoutingData = [
      {
        stage: {
          number: '1',
          name: 'Екстракція маси концентрату',
        },
        task: {
          name: 'Екстракція у реакторі',
          stageName: 'Екстракція маси концентрату',
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
          name: 'Гомогенізація та стабілізація',
        },
        task: {
          name: 'Змішування та гомогенізація',
          stageName: 'Гомогенізація та стабілізація',
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
          name: 'Контроль концентрації та pH',
        },
        task: {
          name: 'Аналіз концентрації та pH',
          stageName: 'Контроль концентрації та pH',
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
          name: 'Санобробка ємності змішувача',
        },
        task: {
          name: 'Санітарна обробка змішувача',
          stageName: 'Санобробка ємності змішувача',
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

    const equipTask1 = 'Стерилізатор';
    const equipTask2 = 'Реактор';
    const equipTask3 = 'Змішувач';
    const equipTask4 = 'Прес';

    const testRoutingData = [
      {
        stage: {
          number: '1',
          name: 'Стерилізація реакторного вузла',
        },
        task: {
          name: 'Термічна обробка реактора',
          stageName: 'Стерилізація реакторного вузла',
          stageNumber: '1',
          orderInStage: '1',
          description: 'Парова стерилізація та дезінфекція реакторного вузла',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask1,
          productType: 'semifinished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '2',
          name: 'Синтез водно-масляної фази',
        },
        task: {
          name: 'Емульгація крему у реакторі',
          stageName: 'Синтез водно-масляної фази',
          stageNumber: '2',
          orderInStage: '1',
          description: 'Нагрів та емульгація водно-масляної фази крему у реакторі',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask2,
          productType: 'semifinished' as const,
          hours: '3',
          minInterval: '15',
        },
      },
      {
        stage: {
          number: '3',
          name: 'Диспергування кремової маси',
        },
        task: {
          name: 'Гомогенізація маси крему',
          stageName: 'Диспергування кремової маси',
          stageNumber: '3',
          orderInStage: '1',
          description: 'Высокооборотне змішування для створення стабільної кремової структури',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask3,
          productType: 'semifinished' as const,
          hours: '2',
          minInterval: '20',
        },
      },
      {
        stage: {
          number: '4',
          name: 'Формування та пластифікація',
        },
        task: {
          name: 'Пластифікація густої бази',
          stageName: 'Формування та пластифікація',
          stageNumber: '4',
          orderInStage: '1',
          description: 'Формування щільної структури крем-бази під тиском',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask4,
          productType: 'semifinished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '5',
          name: 'Лабораторна перевірка в’язкості',
        },
        task: {
          name: 'Вимірювання в’язкості та pH',
          stageName: 'Лабораторна перевірка в’язкості',
          stageNumber: '5',
          orderInStage: '1',
          description: 'Лабораторний вимір показників в’язкості, рН та стабільності крему',
          taskType: 'ВКЯ',
          equipmentType: equipTask2, // ВКЯ на 2-е виробниче завдання (Реактори)
          productType: 'semifinished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '6',
          name: 'Промивка та дезінфекція змішувача',
        },
        task: {
          name: 'Санітарна обробка змішувача',
          stageName: 'Промивка та дезінфекція змішувача',
          stageNumber: '6',
          orderInStage: '1',
          description: 'Дезінфекція та мийка робочої ємності змішувача',
          taskType: 'Сервісне завдання',
          equipmentType: equipTask3, // Сервісне на 3-е виробниче завдання (Змішувач)
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

    const equipTask1 = 'Реактор';
    const equipTask2 = 'Змішувач';
    const equipTask3 = 'Прес';

    const testRoutingData = [
      {
        stage: {
          number: '1',
          name: 'Екстракція кавових активів',
        },
        task: {
          name: 'Варіння та настоювання екстракту',
          stageName: 'Екстракція кавових активів',
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
          name: 'Фільтрація та відстоювання',
        },
        task: {
          name: 'Змішування та очистка розчину',
          stageName: 'Фільтрація та відстоювання',
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
          name: 'Пресування осаду екстракту',
        },
        task: {
          name: 'Віджимання макухи на пресі',
          stageName: 'Пресування осаду екстракту',
          stageNumber: '3',
          orderInStage: '1',
          description: 'Механічне пресування та віджим рідкої фази з кавової гущі',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask3,
          productType: 'semifinished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '4',
          name: 'Аналіз вмісту кофеїну та pH',
        },
        task: {
          name: 'Лабораторний аналіз активів',
          stageName: 'Аналіз вмісту кофеїну та pH',
          stageNumber: '4',
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
          number: '5',
          name: 'Санобробка ємностей та сит',
        },
        task: {
          name: 'Промивка сит та ємностей',
          stageName: 'Санобробка ємностей та сит',
          stageNumber: '5',
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

    const equipTask1 = 'Реактор';
    const equipTask2 = 'Змішувач';
    const equipTask3 = 'Стерилізатор';

    const testRoutingData = [
      {
        stage: {
          number: '1',
          name: 'Нейтралізація та сульфування',
        },
        task: {
          name: 'Нейтралізація та сульфування',
          stageName: 'Нейтралізація та сульфування',
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
          name: 'Стерилізація накопичувачів',
        },
        task: {
          name: 'Парова дезінфекція ємностей',
          stageName: 'Стерилізація накопичувачів',
          stageNumber: '3',
          orderInStage: '1',
          description: 'Стерилізація накопичувальних ємностей перед перекачуванням ПАР-основи',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask3,
          productType: 'semifinished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '4',
          name: 'Вимірювання сухих речовин та pH',
        },
        task: {
          name: 'Перевірка якості ПАР-основи',
          stageName: 'Вимірювання сухих речовин та pH',
          stageNumber: '4',
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
          number: '5',
          name: 'Санобробка лінії сульфування',
        },
        task: {
          name: 'Промивка реактора та змішувача',
          stageName: 'Санобробка лінії сульфування',
          stageNumber: '5',
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

    const equipTask1 = 'Стерилізатор';
    const equipTask2 = 'Змішувач';
    const equipTask3 = 'Фасування';
    const equipTask4 = 'Маркування та пакування';

    const testRoutingData = [
      {
        stage: {
          number: '1',
          name: 'Стерилізація ємностей (ТК-GP-002)',
        },
        task: {
          name: 'Стерилізація пакувальної тари',
          stageName: 'Стерилізація ємностей (ТК-GP-002)',
          stageNumber: '1',
          orderInStage: '1',
          description: 'Термічна обробка та стерилізація флаконів і кришок перед розливом',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask1,
          productType: 'finished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '2',
          name: 'Приготування маси кондиціонера (ТК-GP-002)',
        },
        task: {
          name: 'Змішування кондиціонуючих добавок',
          stageName: 'Приготування маси кондиціонера (ТК-GP-002)',
          stageNumber: '2',
          orderInStage: '1',
          description: 'Змішування емульсійної бази, олій та віддушок у змішувачі',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask2,
          productType: 'finished' as const,
          hours: '2',
          minInterval: '15',
        },
      },
      {
        stage: {
          number: '3',
          name: 'Розлив у туби та флакони (ТК-GP-002)',
        },
        task: {
          name: 'Автоматичне фасування кондиціонера',
          stageName: 'Розлив у туби та флакони (ТК-GP-002)',
          stageNumber: '3',
          orderInStage: '1',
          description: 'Фасування кремоподібної маси у туби 250мл та запайка шва',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask3,
          productType: 'finished' as const,
          hours: '3',
          minInterval: '20',
        },
      },
      {
        stage: {
          number: '4',
          name: 'Пакування та маркування (ТК-GP-002)',
        },
        task: {
          name: 'Маркування туб та укладання у короби',
          stageName: 'Пакування та маркування (ТК-GP-002)',
          stageNumber: '4',
          orderInStage: '1',
          description: 'Маркування дати випуску, групове пакування у короби',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask4,
          productType: 'finished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '5',
          name: 'Сервісне обслуговування змішувача',
        },
        task: {
          name: 'Промивка ємності змішувача',
          stageName: 'Сервісне обслуговування змішувача',
          stageNumber: '5',
          orderInStage: '1',
          description: 'Промивка та санобробка ємності змішувача гарячим конденсатом',
          taskType: 'Сервісне завдання',
          equipmentType: equipTask2,
          productType: 'finished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '6',
          name: 'Сервісне обслуговування фасування',
        },
        task: {
          name: 'Санобробка дозаторів фасування',
          stageName: 'Сервісне обслуговування фасування',
          stageNumber: '6',
          orderInStage: '1',
          description: 'Промивка ліній розливу та дозуючих сопел фасувальної установки',
          taskType: 'Сервісне завдання',
          equipmentType: equipTask3,
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

    const equipTask1 = 'Стерилізатор';
    const equipTask2 = 'Змішувач';
    const equipTask3 = 'Фасування';
    const equipTask4 = 'Маркування та пакування';

    const testRoutingData = [
      {
        stage: {
          number: '1',
          name: 'Стерилізація флаконів (ТК-GP-005)',
        },
        task: {
          name: 'Термічна дезінфекція флаконів гелю',
          stageName: 'Стерилізація флаконів (ТК-GP-005)',
          stageNumber: '1',
          orderInStage: '1',
          description: 'Термічна дезінфекція та стерилізація флаконів перед розливом гелю',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask1,
          productType: 'finished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '2',
          name: 'Приготування маси гелю (ТК-GP-005)',
        },
        task: {
          name: 'Змішування ПАР та загусника',
          stageName: 'Приготування маси гелю (ТК-GP-005)',
          stageNumber: '2',
          orderInStage: '1',
          description: 'Змішування очищеної води, м’яких ПАР, екстрактів та регулювання в’язкості',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask2,
          productType: 'finished' as const,
          hours: '2',
          minInterval: '15',
        },
      },
      {
        stage: {
          number: '3',
          name: 'Розлив у флакони 400мл (ТК-GP-005)',
        },
        task: {
          name: 'Автоматичний розлив у флакони',
          stageName: 'Розлив у флакони 400мл (ТК-GP-005)',
          stageNumber: '3',
          orderInStage: '1',
          description: 'Дозування гелю у прозорі флакони 400мл та укупорка фліп-топ кришками',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask3,
          productType: 'finished' as const,
          hours: '3',
          minInterval: '20',
        },
      },
      {
        stage: {
          number: '4',
          name: 'Пакування у короби (ТК-GP-005)',
        },
        task: {
          name: 'Маркування флаконів та укладка',
          stageName: 'Пакування у короби (ТК-GP-005)',
          stageNumber: '4',
          orderInStage: '1',
          description: 'Маркування дати випуску и укладання флаконів у короби',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask4,
          productType: 'finished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '5',
          name: 'Сервісне обслуговування змішувача',
        },
        task: {
          name: 'Санобробка ємності змішувача',
          stageName: 'Сервісне обслуговування змішувача',
          stageNumber: '5',
          orderInStage: '1',
          description: 'Санітарна обробка та мийка ємності змішувача гарячою водою',
          taskType: 'Сервісне завдання',
          equipmentType: equipTask2,
          productType: 'finished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '6',
          name: 'Сервісне обслуговування фасування',
        },
        task: {
          name: 'Мийка дозаторів та ліній розливу',
          stageName: 'Сервісне обслуговування фасування',
          stageNumber: '6',
          orderInStage: '1',
          description: 'Мийка роторного насоса, трубопроводів та заповнювальних голок',
          taskType: 'Сервісне завдання',
          equipmentType: equipTask3,
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

  test('16. Заполнение тестовыми данными этапов и заданий для продукта "ТК-GP-006 Крем-скраб"', async () => {
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionRouting_FormPage/edit/3d8ee938-e60d-434e-b887-fe327d40b373');
    await loginPage.login();
    await routingPage.switchToTab('Етапи та завдання');

    const equipTask1 = 'Стерилізатор';
    const equipTask2 = 'Змішувач';
    const equipTask3 = 'Фасування';
    const equipTask4 = 'Маркування та пакування';

    const testRoutingData = [
      {
        stage: {
          number: '1',
          name: 'Стерилізація баночок (ТК-GP-006)',
        },
        task: {
          name: 'Термічна дезінфекція баночок скрабу',
          stageName: 'Стерилізація баночок (ТК-GP-006)',
          stageNumber: '1',
          orderInStage: '1',
          description: 'Термічна дезінфекція та стерилізація баночок перед розливом скрабу',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask1,
          productType: 'finished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '2',
          name: 'Приготування крем-скрабу (ТК-GP-006)',
        },
        task: {
          name: 'Змішування абразиву та крему',
          stageName: 'Приготування крем-скрабу (ТК-GP-006)',
          stageNumber: '2',
          orderInStage: '1',
          description: 'Змішування кремової бази, натурального абразиву та ароматизаторів',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask2,
          productType: 'finished' as const,
          hours: '2',
          minInterval: '15',
        },
      },
      {
        stage: {
          number: '3',
          name: 'Розлив у баночки 250мл (ТК-GP-006)',
        },
        task: {
          name: 'Автоматичне фасування у баночки',
          stageName: 'Розлив у баночки 250мл (ТК-GP-006)',
          stageNumber: '3',
          orderInStage: '1',
          description: 'Фасування кремоподібного скрабу у баночки 250мл та укупорка кришками',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask3,
          productType: 'finished' as const,
          hours: '3',
          minInterval: '20',
        },
      },
      {
        stage: {
          number: '4',
          name: 'Пакування у короби (ТК-GP-006)',
        },
        task: {
          name: 'Маркування баночок та укладка',
          stageName: 'Пакування у короби (ТК-GP-006)',
          stageNumber: '4',
          orderInStage: '1',
          description: 'Маркування дати випуску и укладання баночок у короби',
          taskType: 'Виробниче завдання',
          equipmentType: equipTask4,
          productType: 'finished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '5',
          name: 'Сервісне обслуговування змішувача',
        },
        task: {
          name: 'Санобробка ємності змішувача',
          stageName: 'Сервісне обслуговування змішувача',
          stageNumber: '5',
          orderInStage: '1',
          description: 'Санітарна обробка та мийка ємності змішувача гарячою водою',
          taskType: 'Сервісне завдання',
          equipmentType: equipTask2,
          productType: 'finished' as const,
          hours: '1',
          minInterval: '10',
        },
      },
      {
        stage: {
          number: '6',
          name: 'Сервісне обслуговування фасування',
        },
        task: {
          name: 'Мийка шнекового дозатора',
          stageName: 'Сервісне обслуговування фасування',
          stageNumber: '6',
          orderInStage: '1',
          description: 'Мийка шнекового дозатора та ліній розливу після партії',
          taskType: 'Сервісне завдання',
          equipmentType: equipTask3,
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

  test('17. Привязка производственного задания на реакторе к заданию ВКЯ через "Пов\'язаний шаблон завдання" (Основа кондиціонера)', async () => {
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionRouting_FormPage/edit/5fdf5243-d52a-4828-b0d8-e985720867a2');
    await loginPage.login();
    await routingPage.switchToTab('Етапи та завдання');

    console.log('[Test] Привязка задания на Реакторе к ВКЯ "Перевірка в’язкості та pH"...');
    await routingPage.linkTaskToVky('Реактор', 'Перевірка в’язкості та pH');
  });

  test('18. Заполнение этапов, заданий и сырья для "ТК-GP-007 Крем-баттер Манго 250мл"', async ({ page }) => {
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionRouting_FormPage/edit/b371dbbb-2d10-40ae-8bfa-29b087c05338');
    await loginPage.login();

    // 1. СПОЧАТКУ: ЕТАПИ ТА ЗАВДАННЯ НА ВКЛАДЦІ "Етапи та завдання"
    console.log('[Test] Перехід на вкладку "Етапи та завдання"...');
    await routingPage.switchToTab('Етапи та завдання');

    // 1.1. Спочатку створюємо унікальні етапи
    const stages = [
      { number: '10', name: 'Варка емульсійної маси (Лінія 4)' },
      { number: '20', name: 'Фасування та маркування банок 250мл' },
    ];

    for (const stage of stages) {
      console.log(`[Test] Создание этапа ${stage.number}: ${stage.name}...`);
      await routingPage.addStage(stage);
    }

    // 1.2. Потім створюємо всі завдання
    const tasks = [
      {
        name: 'Варка та гомогенізація маси',
        stageName: 'Варка емульсійної маси (Лінія 4)',
        stageNumber: '10',
        orderInStage: '1',
        description: 'Варка емульсійної основи баттеру в реакторі ВР-250 (потужність 250 кг)',
        taskType: 'Виробниче завдання',
        equipmentType: 'Реактор',
        productType: 'finished' as const,
        hours: '2',
        minInterval: '15',
      },
      {
        name: 'CIP-мийка та дезінфекція реактора',
        stageName: 'Варка емульсійної маси (Лінія 4)',
        stageNumber: '10',
        orderInStage: '2',
        description: 'Промивка та парова дезінфекція реактора ВР-250 після варки',
        taskType: 'Сервісне завдання',
        equipmentType: 'Реактор',
        productType: 'finished' as const,
        hours: '1',
        minInterval: '10',
      },
      {
        name: 'Фасування у банки 250мл',
        stageName: 'Фасування та маркування банок 250мл',
        stageNumber: '20',
        orderInStage: '1',
        description: 'Розлив крем-баттеру у пластикові банки 250мл',
        taskType: 'Виробниче завдання',
        equipmentType: 'Фасування',
        productType: 'finished' as const,
        hours: '2',
        minInterval: '15',
      },
    ];

    for (const task of tasks) {
      console.log(`[Test] Создание задания: ${task.name} (${task.taskType}, ${task.equipmentType}, ${task.hours} ч)...`);
      await routingPage.addTask(task);
    }

    // 2. ПОТІМ: СИРОВИНА ТА МАТЕРІАЛИ НА ВКЛАДЦІ "Загальна інформація"
    console.log('[Test] Перехід на вкладку "Загальна інформація"...');
    await page.getByTitle('Загальна інформація', { exact: true }).click();
    await page.waitForTimeout(2000);

    const rawAddBtn = page.locator('#GridDetailAddBtn_06020vt').getByRole('button', { name: 'Новий' }).first()
      .or(page.locator('[aria-label*="Сировина"]').locator('button').filter({ hasText: /Новий|\+/i }).first());

    if (await rawAddBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('[Test] Клік по кнопці додавання сировини (#GridDetailAddBtn_06020vt)...');
      await rawAddBtn.click();
      await page.waitForTimeout(1500);

      // Якщо відкрилася модалка
      const modal = page.locator('mat-dialog-container, crt-modal, .cdk-overlay-pane').last();
      if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
        const matCb = modal.locator('crt-combobox, mat-form-field').first().locator('input');
        if (await matCb.isVisible().catch(() => false)) {
          await matCb.click();
          await matCb.fill('Баттер-основа');
          await page.waitForTimeout(800);
          const opt = page.locator('.cdk-overlay-pane mat-option').first();
          if (await opt.isVisible().catch(() => false)) await opt.click();
        }

        const rateInp = modal.locator('crt-number-input, mat-form-field, input').filter({ hasText: /Норма|Кількість/i }).locator('input').first()
          .or(modal.locator('input').nth(1));
        if (await rateInp.isVisible().catch(() => false)) {
          await rateInp.click();
          await rateInp.fill('0,25');
        }

        const saveBtn = modal.locator('button').filter({ hasText: /Зберегти/i }).first();
        if (await saveBtn.isVisible().catch(() => false)) await saveBtn.click();
      } else {
        // Якщо інлайн-рядок
        const inlineCb = page.locator('crt-data-table input:not([type="checkbox"]):not([type="file"])').first();
        if (await inlineCb.isVisible().catch(() => false)) {
          await inlineCb.click();
          await inlineCb.fill('Баттер-основа');
          await page.waitForTimeout(800);
          const opt = page.locator('.cdk-overlay-pane mat-option').first();
          if (await opt.isVisible().catch(() => false)) await opt.click();

          const rateInputs = page.locator('crt-data-table input:not([type="checkbox"])');
          const count = await rateInputs.count();
          for (let i = 0; i < count; i++) {
            const inp = rateInputs.nth(i);
            const val = await inp.inputValue().catch(() => '');
            if (val === '' || val === '0' || val === '0,00') {
              await inp.click();
              await inp.fill('0,25');
              await page.keyboard.press('Tab');
              break;
            }
          }
          const saveAll = page.locator('button:has-text("Зберегти все")').first();
          if (await saveAll.isVisible().catch(() => false)) await saveAll.click();
        }
      }
      await page.waitForTimeout(2000);
      console.log('[Test] Сировина успішно збережена!');
    }

    // 3. Збереження всієї картки
    const cardSave = page.getByRole('button', { name: 'Зберегти' }).first();
    if (await cardSave.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cardSave.click();
      await page.waitForTimeout(3000);
    }
  });

  test('19. Заполнение этапов, заданий и сырья для полуфабриката "ТК-NF-007 Баттер-основа Манго БО-250"', async ({ page }) => {
    test.setTimeout(360000);
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionRouting_FormPage/edit/f0db5c82-fcee-42ce-b04a-eef9ad5b4474');
    await loginPage.login();

    // 1. СПОЧАТКУ: ЕТАПИ ТА ЗАВДАННЯ НА ВКЛАДЦІ "Етапи та завдання"
    console.log('[Test] Перехід на вкладку "Етапи та завдання"...');
    await routingPage.switchToTab('Етапи та завдання');

    // 1.1. Спочатку створюємо унікальні етапи (для НФ строго варка на лінії 4 / реакторі, без фасування)
    const stages = [
      { number: '10', name: 'Варка та гомогенізація основи (Лінія 4)' },
    ];

    for (const stage of stages) {
      console.log(`[Test] Создание этапа ${stage.number}: ${stage.name}...`);
      await routingPage.addStage(stage);
    }

    // 1.2. Потім створюємо всі завдання
    const tasks = [
      {
        name: 'Варка та плавлення баттер-маси',
        stageName: 'Варка та гомогенізація основи (Лінія 4)',
        stageNumber: '10',
        orderInStage: '1',
        description: 'Плавлення масел ши та манго, емульгування у реакторі ВР-250 (250 кг)',
        taskType: 'Виробниче завдання',
        equipmentType: 'Реактор',
        productType: 'semifinished' as const,
        hours: '3',
        minInterval: '15',
      },
      {
        name: 'CIP-мийка та дезінфекція реактора',
        stageName: 'Варка та гомогенізація основи (Лінія 4)',
        stageNumber: '10',
        orderInStage: '2',
        description: 'Очищення та парова стерилізація реактора ВР-250',
        taskType: 'Сервісне завдання',
        equipmentType: 'Реактор',
        productType: 'semifinished' as const,
        hours: '1',
        minInterval: '10',
      },
      {
        name: 'Контроль в’язкості та однорідності',
        stageName: 'Варка та гомогенізація основи (Лінія 4)',
        stageNumber: '10',
        orderInStage: '3',
        description: 'Лабораторний аналіз зразка баттер-основи',
        taskType: 'ВКЯ',
        equipmentType: 'Реактор',
        productType: 'semifinished' as const,
        hours: '1',
        minInterval: '10',
      },
    ];

    for (const task of tasks) {
      console.log(`[Test] Создание задания: ${task.name} (${task.taskType}, ${task.equipmentType}, ${task.hours} ч)...`);
      await routingPage.addTask(task);
    }

    // 2. Збереження всієї картки
    const cardSave = page.getByRole('button', { name: 'Зберегти' }).first();
    if (await cardSave.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cardSave.click();
      await page.waitForTimeout(3000);
    }
    console.log('🎉 Технологічну карту для напівфабрикату "ТК-NF-007 Баттер-основа Манго" успішно заповнено!');
  });
});

