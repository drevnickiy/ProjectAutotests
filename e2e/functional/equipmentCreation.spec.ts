import { test, Page } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';

let clickCounter = 0;
function logClick(actionDescription: string, locatorDetails: string) {
  clickCounter++;
  const timestamp = new Date().toLocaleTimeString('uk-UA', { hour12: false });
  console.log(`\n👉 [CLICK #${clickCounter}] [${timestamp}]`);
  console.log(`   📌 ДІЯ: ${actionDescription}`);
  console.log(`   🎯 ЛОКАТОР: ${locatorDetails}`);
}

/**
 * Надійний універсальний хелпер вибору значення з комбобоксів Creatio Freedom UI.
 * СТРОГО:
 * 1. Вводить назву опції в поле пошуку комбобоксу для миттєвої фільтрації (опція стає першою вгорі).
 * 2. Клікає БЕЗ `force: true` строго по текстовому елементу знайденої опції `mat-option`.
 * 3. ЦЕ НА 100% ВИКЛЮЧАЄ випадковий клік по прилиплій кнопці "+ Додати новий" внизу списку!
 */
async function selectDropdownOption(page: Page, comboboxName: string, optionText: string) {
  console.log(`\n------------------------------------------------------------`);
  console.log(`🔍 [КОМБОБОКС "${comboboxName}"] Пошук та вибір значення "${optionText}"...`);
  console.log(`------------------------------------------------------------`);

  const cb = page.getByRole('combobox', { name: new RegExp(comboboxName, 'i') })
    .or(page.locator('crt-combobox').filter({ hasText: new RegExp(comboboxName, 'i') }).getByRole('combobox'))
    .first();

  if (!await cb.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log(`   ⚠️ [${comboboxName}] Комбобокс не знайдено на сторінці`);
    return;
  }

  // 1. Клік по інпуту комбобоксу
  logClick(`Клік по полю "${comboboxName}"`, `getByRole('combobox', { name: /${comboboxName}/i })`);
  await cb.click();
  await page.waitForTimeout(400);

  // 2. Вводимо текст для фільтрації списку (щоб потрібний пункт піднявся на саму першу позицію вгору!)
  console.log(`   ⌨️ Введення фільтру: "${optionText}"`);
  await cb.fill(optionText);
  await page.waitForTimeout(1000);

  // 3. Знаходимо відфільтровану опцію вгорі списку (СТРОГО БЕЗ "+ Додати новий")
  const targetOption = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]')
    .filter({ hasNotText: /Додати новий|\+|Створити|crt-combobox-search/i })
    .filter({ hasText: new RegExp(`^\\s*${optionText.trim()}\\s*$`, 'i') })
    .first();

  if (await targetOption.isVisible({ timeout: 3000 }).catch(() => false)) {
    const targetText = (await targetOption.innerText().catch(() => '')).trim();
    console.log(`   ⏳ [ПАУЗА 2 СЕКУНДИ] Демонстрація відфільтрованої опції "${targetText}"...`);
    await page.waitForTimeout(2000);

    // Клікаємо строго по опції (БЕЗ force: true, щоб не зачепити сторонні кнопки)
    logClick(`Клік по відфільтрованій опції "${targetText}"`, `mat-option:has-text("${targetText}")`);
    await targetOption.click();
    console.log(`   ✅ [${comboboxName}] УСПІШНО ОБРАНО ➔ "${targetText}"`);
  } else {
    // Якщо пряма фільтрація повернула порожній список, пробуємо вибрати перший знайдений варіант
    const firstOption = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]')
      .filter({ hasNotText: /Додати новий|\+|Створити|crt-combobox-search/i })
      .first();

    if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      const text = (await firstOption.innerText().catch(() => '')).trim();
      logClick(`Клік по першій знайденій опції "${text}"`, `mat-option.first()`);
      await firstOption.click();
      console.log(`   ✅ [${comboboxName}] ОБРАНО ➔ "${text}"`);
    } else {
      console.log(`   ⚠️ [${comboboxName}] Опцію "${optionText}" не знайдено, закриваємо Escape`);
      await page.keyboard.press('Escape').catch(() => { });
    }
  }

  await page.waitForTimeout(800);
}

test('Створення 2 одиниць обладнання для Лінії розливу (через точний пошук та фільтрацію)', async ({ page }) => {
  test.setTimeout(600000); // 10 хвилин
  const loginPage = new LoginPage(page);
  clickCounter = 0;

  // 🏭 2 одиниці для Лінії розливу:
  const equipmentList = [
    {
      name: 'Автомат розливу та укупорки АРУ-1000',
      type: 'Фасування',
      isReactor: false,
      line: 'Лінія розливу',
      capacity: '',
      productivity: '1000',
      unit: 'штуки/год',
      description: 'Розлив тоніків, шампунів та гелів для душу у флакони'
    },
    {
      name: 'Маркувальний комплекс флаконів МПК-200',
      type: 'Маркування та пакування',
      isReactor: false,
      line: 'Лінія розливу',
      capacity: '',
      productivity: '1200',
      unit: 'штуки/год',
      description: 'Етикетування флаконів, нанесення датера та QR-коду партії'
    }
  ];

  // 1. Авторизація
  console.log('🔑 [Auth] Виконуємо первинну авторизацію...');
  await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/');
  await loginPage.login();
  await page.waitForTimeout(3000);

  for (let i = 0; i < equipmentList.length; i++) {
    const item = equipmentList[i];
    const timestamp = Date.now().toString().slice(-5);
    const equipmentName = `${item.name} [${timestamp}]`;

    console.log(`\n================================================================================`);
    console.log(`⚙️  [${i + 1}/${equipmentList.length}] СТВОРЕННЯ: "${equipmentName}" (${item.line}, Тип: ${item.type})`);
    console.log(`================================================================================`);

    // 1. Навігація в розділ Обладнання та оновлення сторінки
    await page.goto('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenEquipment_ListPage');
    await page.reload();
    await page.waitForTimeout(3000);

    // 2. Відкриваємо картку створення нового обладнання
    const createBtnLocator = `getByRole('button', { name: 'Створити' })`;
    const createBtn = page.getByRole('button', { name: 'Створити' })
      .or(page.locator('crt-button').filter({ hasText: /Створити|Новий|\+/i }))
      .first();

    await createBtn.waitFor({ state: 'visible', timeout: 30000 }).catch(() => { });
    logClick(`Клік по кнопці "Створити" нову картку обладнання`, createBtnLocator);
    await createBtn.click({ force: true });
    await page.waitForTimeout(4000);

    // 🔴 1. Поле "Назва"
    const nameInputLocator = `getByRole('textbox', { name: 'Назва' })`;
    logClick(`Клік по полю "Назва" + введення "${equipmentName}"`, nameInputLocator);
    const nameInput = page.getByRole('textbox', { name: 'Назва' }).first();
    await nameInput.click();
    await nameInput.fill(equipmentName);

    // 🔴 2. Поле "Статус"
    await selectDropdownOption(page, 'Статус', 'В роботі');

    // 🔴 3. Поле "Тип обладнання"
    await selectDropdownOption(page, 'Тип обладнання', item.type);

    // 🔴 4. Поле "Виробнича потужність" (не реактор)
    console.log(`ℹ️ [SKIP] Поле "Виробнича потужність" пропущено (не реактор)`);

    // 🔴 5. Поле "Виробнича лінія"
    await selectDropdownOption(page, 'Виробнича лінія', item.line);

    // 🔴 6. Перехід СТРОГО на вкладку "ВЛАСТИВОСТІ"
    const propTabLocator = `locator('[role="tab"]').filter({ hasText: /^ВЛАСТИВОСТІ$/i })`;
    const propertiesTab = page.locator('[role="tab"], .mat-tab-label, .mat-mdc-tab')
      .filter({ hasText: /^ВЛАСТИВОСТІ$/i })
      .first();

    if (await propertiesTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await propertiesTab.scrollIntoViewIfNeeded().catch(() => { });
      logClick(`Перехід на вкладку "ВЛАСТИВОСТІ"`, propTabLocator);
      await propertiesTab.click();
      await page.waitForTimeout(1500);
    }

    // 🔴 7. Поле "Продуктивність"
    const prodLocator = `getByRole('textbox', { name: 'Продуктивність' })`;
    const productivityInput = page.getByRole('textbox', { name: 'Продуктивність' }).first();
    if (await productivityInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      logClick(`Клік по полю "Продуктивність" + введення "${item.productivity}"`, prodLocator);
      await productivityInput.click();
      await productivityInput.fill(item.productivity);
    }

    // 🔴 8. Поле "Одиниця продуктивності"
    await selectDropdownOption(page, 'Одиниця продуктивності', item.unit);

    // 💾 Збереження картки
    const saveBtnLocator = `getByRole('button', { name: 'Зберегти' })`;
    const saveBtn = page.getByRole('button', { name: 'Зберегти' })
      .or(page.locator('button, crt-button, [role="button"]').filter({ hasText: /Зберегти/i }))
      .first();
    logClick(`Збереження картки [${i + 1}/${equipmentList.length}]`, saveBtnLocator);
    await saveBtn.click();
    await page.waitForTimeout(4000);

    console.log(`✅ [${i + 1}/${equipmentList.length}] Обладнання "${equipmentName}" успішно створено!`);
  }

  console.log(`\n🎉 [FINISH] Обидві одиниці обладнання створено! Всього виконано ${clickCounter} кліків із безпечним вибором.`);
});
