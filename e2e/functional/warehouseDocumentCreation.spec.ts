import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../../src/pages/LoginPage';
import { WarehouseDocumentPage } from '../../src/pages/WarehouseDocumentPage';
import { WarehouseDocumentDetailsPage } from '../../src/pages/WarehouseDocumentDetailsPage';
import { getShellUrl } from '../../src/config/environment';

test.describe('E2E: Складські операції — Створення та проведення накладних (GenWarehouseDocument)', () => {
  let loginPage: LoginPage;
  let documentPage: WarehouseDocumentPage;
  let detailsPage: WarehouseDocumentDetailsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    documentPage = new WarehouseDocumentPage(page);
    detailsPage = new WarehouseDocumentDetailsPage(page);

    await loginPage.open(getShellUrl('#Section/GenWarehouseDocument_ListPage'));
    await loginPage.login();
  });

  test('1. Створення вхідної накладної з послідовним додаванням сировини (Чернетка)', async ({ page }) => {
    test.slow(); // Подовжений таймаут для додавання декількох позицій сировини

    // 1. Читаємо перелік сировини з локальних даних проєкту (raw_materials.json)
    console.log('📦 [SETUP] Завантажуємо перелік сировини з scripts/data/raw_materials.json...');
    let rawMaterials: string[] = [];
    try {
      const rawDataPath = path.resolve(__dirname, '../../scripts/data/raw_materials.json');
      if (fs.existsSync(rawDataPath)) {
        const rawJson = JSON.parse(fs.readFileSync(rawDataPath, 'utf-8'));
        rawMaterials = rawJson.map((r: any) => r.name).slice(0, 4); // Беремо перші 4 позиції
      }
    } catch (e) {
      console.warn('⚠️ Не вдалося завантажити локальні матеріали, використовуємо фолбек:', e);
    }

    if (rawMaterials.length === 0) {
      rawMaterials = [
        'Вода деіонізована',
        'Spolapon AES 242/70',
        'Plantapon SF (BASF)',
        'Mackam CAB 818'
      ];
    }

    console.log(`📋 Перелік сировини для додавання (${rawMaterials.length}):`, rawMaterials);

    // 2. Перехід до реєстру накладних
    console.log('🌐 [STEP 1] Перехід до реєстру накладних...');
    await documentPage.navigate();

    // 3. Натискання кнопки Додати (Створити)
    console.log('➕ [STEP 2] Натискаємо кнопку створення нової накладної...');
    await documentPage.clickAddDocument();

    // 4. Заповнення обов\'язкових та додаткових полів картки
    console.log('✍️ [STEP 3] Заповнюємо поля картки накладної...');

    // 4.1 Тип документа: Вхідний
    await detailsPage.selectSpecificDropdownOption('Тип документа', 'Вхідний');

    // 4.2 Тип базового документа: Виробниче завдання
    await detailsPage.selectSpecificDropdownOption('Тип базового документа', 'Виробниче завдання');

    // 4.3 Дата складського документа
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const randomDay = Math.floor(Math.random() * daysInMonth) + 1;
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formattedDate = `${pad(randomDay)}.${pad(currentMonth + 1)}.${currentYear}`;
    await detailsPage.fillDate('Дата складського документа', formattedDate);

    // 4.4 Контрагент та Цільовий склад
    await detailsPage.selectRandomDropdownOption('Контрагент');
    await detailsPage.selectRandomDropdownOption('Цільовий склад');

    // 4.5 Коментар
    const commentText = `Накладна з сировиною E2E Autotest (${Date.now()})`;
    await detailsPage.fillComment(commentText);

    // 5. Послідовне додавання сировини через кнопку "+" у секції "Продукт складського документа"
    console.log(`\n➕ [STEP 4] Додавання сировини (${rawMaterials.length} позицій)...`);
    for (let i = 0; i < rawMaterials.length; i++) {
      const materialName = rawMaterials[i];
      const qty = (i + 1) * 50; // 50, 100, 150, 200 кг
      console.log(`\n👉 [${i + 1}/${rawMaterials.length}] Додаємо: "${materialName}" (Кількість: ${qty})...`);
      await detailsPage.addProductLine(materialName, qty);
    }

    // 6. Перевірка доданих позицій у таблиці
    console.log('\n🔍 [STEP 5] Перевірка відображення доданих позицій у таблиці...');
    for (const materialName of rawMaterials) {
      await detailsPage.verifyProductLineVisible(materialName);
    }

    // 7. Фінальне збереження накладної (Чернетка)
    console.log('\n💾 [STEP 6] Фінальне збереження накладної...');
    await detailsPage.saveDocument();

    // 8. Перевірка відсутності системних помилок
    await detailsPage.expectNoErrors();

    const docNumber = await detailsPage.getDocumentNumber();
    console.log(`🎉 [DONE] Накладна № ${docNumber || '(успішно)'} створена як Чернетка!`);
  });

  test('2. Переведення накладної зі статусу Чернетка в статус Проведений (DCM)', async ({ page }) => {
    // 1. Перехід до реєстру накладних
    console.log('🌐 [STEP 1] Перехід до реєстру складських документів...');
    await documentPage.navigate();

    // 2. Відкриваємо першу накладну в статусі "Чернетка"
    console.log('📂 [STEP 2] Відкриваємо картку накладної зі статусом "Чернетка"...');
    await documentPage.openFirstDocument();

    // 3. Перевірка відкриття картки та відсутності помилок
    await detailsPage.expectNoErrors();
    const docNumber = await detailsPage.getDocumentNumber();
    console.log(`📄 [STEP 3] Відкрито накладну № ${docNumber || '(без номера)'}`);

    // 4. Переведення документа в статус "Проведений"
    console.log('🎯 [STEP 4] Переведення накладної в статус "Проведений"...');
    await detailsPage.setStage('Проведений');

    // 5. Збереження змін
    console.log('💾 [STEP 5] Збереження накладної після переходу в статус "Проведений"...');
    await detailsPage.saveDocument();

    // 6. Перевірка статусу та відсутності помилок
    console.log('🔍 [STEP 6] Перевірка статусу "Проведений" та відсутності помилок...');
    await detailsPage.verifyStage('Проведений');
    await detailsPage.expectNoErrors();

    console.log(`🎉 [DONE] Накладну № ${docNumber} успішно переведено в статус "Проведений"!`);
  });
});
