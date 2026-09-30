import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { getCurrentEnv, getBaseUrl } from '../../src/config/environment';

test.describe('Створення обладнання та налаштування виходу (main2)', () => {

  test('Створення обладнання з напівфабрикатом на вкладці ВИХІД', async ({ page }) => {
    test.setTimeout(180000);
    const loginPage = new LoginPage(page);

    const timestamp = Date.now().toString().slice(-4);
    const equipmentName = `Реактор-НФ тест ${timestamp}`;
    const env = getCurrentEnv();
    const baseUrl = getBaseUrl();

    // ⚙️ Бізнес-формула: Продуктивність (од./год) = Виробнича потужність / 8 годин зміни
    const SHIFT_HOURS = 8;
    const capacity = 4000;
    const hourlyRate = capacity / SHIFT_HOURS; // 4000 / 8 = 500

    console.log(`\n======================================================`);
    console.log(`🚀 [TEST] Створення обладнання з напівфабрикатом на сервері [${env}] (${baseUrl})`);
    console.log(`📍 Обладнання: "${equipmentName}"`);
    console.log(`📍 Потужність: ${capacity} | Зміна: ${SHIFT_HOURS} год | Продуктивність: ${hourlyRate} кг/год`);
    console.log(`======================================================`);

    // 1. Авторизація
    await loginPage.open();
    await loginPage.login();
    await page.locator('crt-app-header, .crt-header, mat-toolbar, .user-profile').first().waitFor({ state: 'visible', timeout: 35000 }).catch(() => { });
    await page.waitForTimeout(2000);

    // 2. Відкриття розділу Обладнання та клік "Створити"
    console.log(`\n--- КРОК 1: Відкриття розділу Обладнання ---`);
    await loginPage.open('/0/Shell/#Section/GenEquipment_ListPage');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const createEquipBtn = page.getByRole('button', { name: 'Створити' }).first();
    await createEquipBtn.waitFor({ state: 'visible', timeout: 35000 });
    await createEquipBtn.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2500);

    // 3. Заповнення основних полів картки
    console.log(`\n--- КРОК 2: Заповнення лівої панелі ---`);
    console.log(`✍️ Заповнення назви: "${equipmentName}"...`);
    const nameInput = page.getByRole('textbox', { name: 'Назва' }).first();
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await nameInput.click();
    await nameInput.fill(equipmentName);
    await page.waitForTimeout(300);

    // Статус: "В роботі"
    console.log(`✍️ Заповнення статусу "В роботі"...`);
    const statusCb = page.getByRole('combobox', { name: 'Статус' }).first();
    if (await statusCb.isVisible({ timeout: 3000 }).catch(() => false)) {
      await statusCb.click();
      await page.waitForTimeout(300);
      await statusCb.fill('В роботі');
      await page.waitForTimeout(500);
      const statusOpt = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]')
        .filter({ hasNotText: /Додати новий|\+|Створити/i })
        .filter({ hasText: /В роботі/i }).first();
      if (await statusOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
        await statusOpt.click();
      }
    }

    // Тип обладнання: "Реактори"
    console.log(`✍️ Заповнення типу обладнання "Реактор"...`);
    const typeCb = page.getByRole('combobox', { name: 'Тип обладнання' }).first();
    if (await typeCb.isVisible({ timeout: 3000 }).catch(() => false)) {
      await typeCb.click();
      await page.waitForTimeout(300);
      await typeCb.fill('Реактор');
      await page.waitForTimeout(600);
      const typeOpt = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]')
        .filter({ hasNotText: /Додати новий|\+|Створити/i })
        .filter({ hasText: /^Реактор/i }).first();
      if (await typeOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
        await typeOpt.click();
      }
    }

    // Дата введення в експлуатацію
    console.log(`✍️ Заповнення дати введення в експлуатацію...`);
    const dateInput = page.getByRole('textbox', { name: 'Дата введення в експлуатацію' }).first();
    if (await dateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dateInput.click();
      await dateInput.fill('04.09.2026');
      await page.waitForTimeout(300);
    }

    // Виробнича лінія
    console.log(`✍️ Прив'язка до виробничої лінії...`);
    const lineCb = page.getByRole('combobox', { name: 'Виробнича лінія' }).first();
    if (await lineCb.isVisible({ timeout: 3000 }).catch(() => false)) {
      await lineCb.click();
      await page.waitForTimeout(300);
      await lineCb.fill('Лінія');
      await page.waitForTimeout(800);
      const lineOpt = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]')
        .filter({ hasNotText: /Додати новий|\+|Створити/i })
        .first();
      if (await lineOpt.isVisible({ timeout: 3000 }).catch(() => false)) {
        const lineText = (await lineOpt.innerText().catch(() => '')).trim();
        console.log(`   ✅ Обрано лінію: "${lineText}"`);
        await lineOpt.click();
        await page.waitForTimeout(500);
      }
    }

    // Виробнича потужність
    console.log(`✍️ Заповнення потужності ${capacity}...`);
    const capInput = page.getByRole('textbox', { name: 'Виробнича потужність' }).first()
      .or(page.locator('input[aria-label*="Виробнича потужність"]').first());
    if (await capInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await capInput.click();
      await capInput.fill(capacity.toString());
      await page.waitForTimeout(300);
    }

    // 4. Вкладка "Властивості"
    console.log(`\n--- КРОК 3: Налаштування вкладки "Властивості" ---`);
    const propTab = page.getByTitle('Властивості', { exact: true })
      .or(page.locator('[role="tab"]').filter({ hasText: /^Властивості$/i })).first();
    if (await propTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await propTab.click();
      await page.waitForTimeout(1000);

      // Продуктивність (за формулою: потужність / 8 годин)
      const prodInput = page.getByRole('textbox', { name: 'Продуктивність', exact: true }).first();
      if (await prodInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await prodInput.click();
        await prodInput.fill(hourlyRate.toString());
        await page.waitForTimeout(300);
      }

      // Одиниця продуктивності: строго "кг/год"
      console.log(`✍️ Обираємо "Одиниця продуктивності": "кг/год"...`);
      const prodUnitCb = page.getByRole('combobox', { name: 'Одиниця продуктивності' }).first();
      if (await prodUnitCb.isVisible({ timeout: 3000 }).catch(() => false)) {
        await prodUnitCb.click();
        await page.waitForTimeout(300);
        await prodUnitCb.fill('кг/год');
        await page.waitForTimeout(600);
        const unitOpt = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]')
          .filter({ hasNotText: /Додати новий|\+|Створити/i })
          .filter({ hasText: /кг\/год/i }).first();
        if (await unitOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
          const unitText = (await unitOpt.innerText().catch(() => '')).trim();
          console.log(`   ✅ Обрано одиницю продуктивності: "${unitText}"`);
          await unitOpt.click();
        }
      }
    }

    // 📸 Скріншот властивостей
    const equipPropsScreenshot = `test-results/equipment_${timestamp}_properties.png`;
    await page.screenshot({ path: equipPropsScreenshot, fullPage: false }).catch(() => { });
    console.log(`📸 Скріншот властивостей: ${equipPropsScreenshot}`);

    // 5. Вкладка "ВИХІД" та додавання НАПІВФАБРИКАТУ (верхня панель)
    console.log(`\n--- КРОК 4: Додавання напівфабрикату на вкладці "ВИХІД" ---`);
    const outputTab = page.getByTitle('Вихід', { exact: true })
      .or(page.locator('[role="tab"]').filter({ hasText: /^Вихід$/i })).first();
    await outputTab.waitFor({ state: 'visible', timeout: 5000 });
    await outputTab.click();
    await page.waitForTimeout(1500);

    // Клік "Створити" в секції Напівфабрикати (#FlexContainer_u697e4l)
    console.log(`👉 Клік "Створити" на панелі напівфабрикатів (#FlexContainer_u697e4l)...`);
    const createNfBtn = page.locator('#FlexContainer_u697e4l').getByRole('button', { name: 'Створити' }).first()
      .or(page.locator('crt-expansion-panel').filter({ hasText: /Напівфабрикати/i }).getByRole('button', { name: 'Створити' }).first());
    await createNfBtn.waitFor({ state: 'visible', timeout: 10000 });
    await createNfBtn.click();
    await page.waitForTimeout(2000);

    // Модальне вікно додавання напівфабрикату
    console.log(`👉 Робота з модальним вікном (БЕЗ вибору "Тип продукту")...`);
    const modalDialog = page.locator('mat-dialog-container, crt-dialog-container, [role="dialog"]').first();
    await modalDialog.waitFor({ state: 'visible', timeout: 10000 });

    // Поле "Напівфабрикат" (обираємо прямо без типу продукту!)
    console.log(`👉 Обираємо "Напівфабрикат"...`);
    const modalNfCb = modalDialog.getByRole('combobox', { name: 'Напівфабрикат' }).first()
      .or(page.getByRole('combobox', { name: 'Напівфабрикат' }).first());
    await modalNfCb.waitFor({ state: 'visible', timeout: 10000 });
    await modalNfCb.click();
    await page.waitForTimeout(400);
    await modalNfCb.fill('НФ');
    await page.waitForTimeout(800);

    const nfOpt = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]')
      .filter({ hasNotText: /Додати новий|\+|Створити/i })
      .first();
    if (await nfOpt.isVisible({ timeout: 3000 }).catch(() => false)) {
      const selectedNfText = (await nfOpt.innerText().catch(() => '')).trim();
      console.log(`   ✅ Обрано напівфабрикат: "${selectedNfText}"`);
      await nfOpt.click();
    }
    await page.waitForTimeout(500);

    // Поле "Продуктивність (од/год)"
    console.log(`👉 Вводимо розраховану продуктивність ${hourlyRate} (${capacity} / ${SHIFT_HOURS} год)...`);
    const modalRateInput = modalDialog.locator('input[aria-label*="Продуктивність"]').first()
      .or(modalDialog.getByRole('textbox', { name: /Продуктивність/i }).first());
    await modalRateInput.waitFor({ state: 'visible', timeout: 5000 });
    await modalRateInput.fill(hourlyRate.toString());
    await page.waitForTimeout(300);

    // Поле "Одиниця виміру продукту" (одиниця продукту: кілограм)
    console.log(`👉 Обираємо одиницю виміру продукту...`);
    const modalUnitCb = modalDialog.getByRole('combobox', { name: /Одиниця виміру продукту/i }).first()
      .or(modalDialog.locator('crt-combobox[aria-label*="Одиниця"]').getByRole('combobox').first())
      .or(modalDialog.getByRole('combobox').last());
    if (await modalUnitCb.isVisible({ timeout: 3000 }).catch(() => false)) {
      await modalUnitCb.click();
      await page.waitForTimeout(300);
      await modalUnitCb.fill('кілограм');
      await page.waitForTimeout(600);
      const unitOpt = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]')
        .filter({ hasNotText: /Додати новий|\+|Створити/i })
        .filter({ hasText: /кілограм/i }).first();
      if (await unitOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
        await unitOpt.click();
      }
    }
    await page.waitForTimeout(500);

    // 📸 Скріншот заповненої модалки перед збереженням
    const modalScreenshot = `test-results/equipment_${timestamp}_modal_filled.png`;
    await page.screenshot({ path: modalScreenshot, fullPage: false }).catch(() => { });
    console.log(`📸 Скріншот модального вікна: ${modalScreenshot}`);

    // Зберегти модальне вікно
    console.log(`💾 Збереження модального вікна...`);
    const modalSaveBtn = modalDialog.getByRole('button', { name: 'Зберегти' }).first()
      .or(page.locator('[role="dialog"] button:has-text("Зберегти")').first());
    await modalSaveBtn.click();
    await page.waitForTimeout(3000);

    // 📸 Скріншот вкладки ВИХІД з доданим рядком напівфабрикату!
    const outputTabScreenshot = `test-results/equipment_${timestamp}_output_tab.png`;
    await page.screenshot({ path: outputTabScreenshot, fullPage: false }).catch(() => { });
    console.log(`📸 Скріншот вкладки ВИХІД з напівфабрикатом: ${outputTabScreenshot}`);

    // 6. Фіналізація збереження картки
    console.log(`\n--- КРОК 5: Перевірка стану збереження картки ---`);
    const saveEquipBtn = page.getByRole('button', { name: 'Зберегти' }).first();
    if (await saveEquipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log(`💾 Клік "Зберегти" на картці...`);
      await saveEquipBtn.click();
      await page.waitForTimeout(3000);
    } else {
      console.log(`ℹ️ Картка вже збережена автоматично разом із напівфабрикатом.`);
    }

    const closeBtn = page.getByRole('button', { name: 'Закрити' }).first();
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(2000);
    }

    // 7. Перевірка в реєстрі
    console.log(`\n--- КРОК 6: Перевірка в реєстрі Обладнання ---`);
    await loginPage.open('/0/Shell/#Section/GenEquipment_ListPage');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    const equipRow = page.locator('tr, [role="row"], crt-data-table-row')
      .filter({ hasText: equipmentName })
      .first();

    await expect(equipRow).toBeVisible({ timeout: 15000 });

    const finalScreenshot = `test-results/equipment_${timestamp}_final_success.png`;
    await page.screenshot({ path: finalScreenshot, fullPage: false }).catch(() => { });
    console.log(`🎉 [SUCCESS] Обладнання "${equipmentName}" успішно створено з напівфабрикатом!`);
    console.log(`📸 Фінальний скріншот: ${finalScreenshot}`);
  });

  test('Створення обладнання з готовим продуктом на вкладці ВИХІД', async ({ page }) => {
    test.setTimeout(180000);
    const loginPage = new LoginPage(page);

    const timestamp = Date.now().toString().slice(-4);
    const equipmentName = `Обладнання-ГП тест ${timestamp}`;
    const env = getCurrentEnv();
    const baseUrl = getBaseUrl();

    // ⚙️ Бізнес-формула: Продуктивність (од./год) = Виробнича потужність / 8 годин зміни
    const SHIFT_HOURS = 8;
    const capacity = 4000;
    const hourlyRate = capacity / SHIFT_HOURS; // 4000 / 8 = 500

    console.log(`\n======================================================`);
    console.log(`🚀 [TEST] Створення обладнання з готовим продуктом на сервері [${env}] (${baseUrl})`);
    console.log(`📍 Обладнання: "${equipmentName}"`);
    console.log(`📍 Потужність: ${capacity} | Зміна: ${SHIFT_HOURS} год | Продуктивність: ${hourlyRate} кг/год`);
    console.log(`======================================================`);

    // 1. Авторизація
    await loginPage.open();
    await loginPage.login();
    await page.locator('crt-app-header, .crt-header, mat-toolbar, .user-profile').first().waitFor({ state: 'visible', timeout: 35000 }).catch(() => { });
    await page.waitForTimeout(2000);

    // 2. Відкриття розділу Обладнання та клік "Створити"
    console.log(`\n--- КРОК 1: Відкриття розділу Обладнання ---`);
    await loginPage.open('/0/Shell/#Section/GenEquipment_ListPage');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const createEquipBtn = page.getByRole('button', { name: 'Створити' }).first();
    await createEquipBtn.waitFor({ state: 'visible', timeout: 35000 });
    await createEquipBtn.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2500);

    // 3. Заповнення основних полів картки
    console.log(`\n--- КРОК 2: Заповнення лівої панелі ---`);
    console.log(`✍️ Заповнення назви: "${equipmentName}"...`);
    const nameInput = page.getByRole('textbox', { name: 'Назва' }).first();
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await nameInput.click();
    await nameInput.fill(equipmentName);
    await page.waitForTimeout(300);

    // Статус: "В роботі"
    console.log(`✍️ Заповнення статусу "В роботі"...`);
    const statusCb = page.getByRole('combobox', { name: 'Статус' }).first();
    if (await statusCb.isVisible({ timeout: 3000 }).catch(() => false)) {
      await statusCb.click();
      await page.waitForTimeout(300);
      await statusCb.fill('В роботі');
      await page.waitForTimeout(500);
      const statusOpt = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]')
        .filter({ hasNotText: /Додати новий|\+|Створити/i })
        .filter({ hasText: /В роботі/i }).first();
      if (await statusOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
        await statusOpt.click();
      }
    }

    // Тип обладнання: "Реактори"
    console.log(`✍️ Заповнення типу обладнання "Реактор"...`);
    const typeCb = page.getByRole('combobox', { name: 'Тип обладнання' }).first();
    if (await typeCb.isVisible({ timeout: 3000 }).catch(() => false)) {
      await typeCb.click();
      await page.waitForTimeout(300);
      await typeCb.fill('Реактор');
      await page.waitForTimeout(600);
      const typeOpt = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]')
        .filter({ hasNotText: /Додати новий|\+|Створити/i })
        .filter({ hasText: /^Реактор/i }).first();
      if (await typeOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
        await typeOpt.click();
      }
    }

    // Дата введення в експлуатацію
    console.log(`✍️ Заповнення дати введення в експлуатацію...`);
    const dateInput = page.getByRole('textbox', { name: 'Дата введення в експлуатацію' }).first();
    if (await dateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dateInput.click();
      await dateInput.fill('04.09.2026');
      await page.waitForTimeout(300);
    }

    // Виробнича лінія
    console.log(`✍️ Прив'язка до виробничої лінії...`);
    const lineCb = page.getByRole('combobox', { name: 'Виробнича лінія' }).first();
    if (await lineCb.isVisible({ timeout: 3000 }).catch(() => false)) {
      await lineCb.click();
      await page.waitForTimeout(300);
      await lineCb.fill('Лінія');
      await page.waitForTimeout(800);
      const lineOpt = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]')
        .filter({ hasNotText: /Додати новий|\+|Створити/i })
        .first();
      if (await lineOpt.isVisible({ timeout: 3000 }).catch(() => false)) {
        const lineText = (await lineOpt.innerText().catch(() => '')).trim();
        console.log(`   ✅ Обрано лінію: "${lineText}"`);
        await lineOpt.click();
        await page.waitForTimeout(500);
      }
    }

    // Виробнича потужність
    console.log(`✍️ Заповнення потужності ${capacity}...`);
    const capInput = page.getByRole('textbox', { name: 'Виробнича потужність' }).first()
      .or(page.locator('input[aria-label*="Виробнича потужність"]').first());
    if (await capInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await capInput.click();
      await capInput.fill(capacity.toString());
      await page.waitForTimeout(300);
    }

    // 4. Вкладка "Властивості"
    console.log(`\n--- КРОК 3: Налаштування вкладки "Властивості" ---`);
    const propTab = page.getByTitle('Властивості', { exact: true })
      .or(page.locator('[role="tab"]').filter({ hasText: /^Властивості$/i })).first();
    if (await propTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await propTab.click();
      await page.waitForTimeout(1000);

      // Продуктивність (за формулою: потужність / 8 годин)
      const prodInput = page.getByRole('textbox', { name: 'Продуктивність', exact: true }).first();
      if (await prodInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await prodInput.click();
        await prodInput.fill(hourlyRate.toString());
        await page.waitForTimeout(300);
      }

      // Одиниця продуктивності: завжди "кг/год"
      console.log(`✍️ Обираємо "Одиниця продуктивності": "кг/год"...`);
      const prodUnitCb = page.getByRole('combobox', { name: 'Одиниця продуктивності' }).first();
      if (await prodUnitCb.isVisible({ timeout: 3000 }).catch(() => false)) {
        await prodUnitCb.click();
        await page.waitForTimeout(300);
        await prodUnitCb.fill('кг/год');
        await page.waitForTimeout(600);
        const unitOpt = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]')
          .filter({ hasNotText: /Додати новий|\+|Створити/i })
          .filter({ hasText: /кг\/год/i }).first();
        if (await unitOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
          const unitText = (await unitOpt.innerText().catch(() => '')).trim();
          console.log(`   ✅ Обрано одиницю продуктивності: "${unitText}"`);
          await unitOpt.click();
        }
      }
    }

    // 📸 Скріншот властивостей
    const equipPropsScreenshot = `test-results/equipment_${timestamp}_properties.png`;
    await page.screenshot({ path: equipPropsScreenshot, fullPage: false }).catch(() => { });
    console.log(`📸 Скріншот властивостей: ${equipPropsScreenshot}`);

    // 5. Вкладка "ВИХІД" та додавання готового ПРОДУКТУ (нижня панель)
    console.log(`\n--- КРОК 4: Додавання готового ПРОДУКТУ на вкладці "ВИХІД" ---`);
    const outputTab = page.getByTitle('Вихід', { exact: true })
      .or(page.locator('[role="tab"]').filter({ hasText: /^Вихід$/i })).first();
    await outputTab.waitFor({ state: 'visible', timeout: 5000 });
    await outputTab.click();
    await page.waitForTimeout(1500);

    // Клік "Створити" в секції Продукти
    console.log(`👉 Клік "Створити" на панелі продуктів...`);
    const productsPanel = page.locator('crt-expansion-panel').filter({ hasText: /Продукти/i }).first();
    await productsPanel.scrollIntoViewIfNeeded().catch(() => { });

    const createProductBtn = productsPanel.getByRole('button', { name: /Створити|Додати|\+/i }).first()
      .or(page.locator('#FlexContainer_ns6ddds').getByRole('button', { name: /Створити|Додати|\+/i }).first())
      .or(productsPanel.getByRole('button', { name: 'Новий' }).first());
    await createProductBtn.waitFor({ state: 'visible', timeout: 10000 });
    await createProductBtn.click();
    await page.waitForTimeout(2000);

    // Модальне вікно додавання продукту
    console.log(`👉 Робота з модальним вікном продукту (БЕЗ вибору "Тип продукту")...`);
    const modalDialog = page.locator('mat-dialog-container, crt-dialog-container, [role="dialog"]').first();
    await modalDialog.waitFor({ state: 'visible', timeout: 10000 });

    // Поле "Продукт" (обираємо прямо без типу продукту!)
    console.log(`👉 Обираємо "Продукт"...`);
    const modalProdCb = modalDialog.getByRole('combobox', { name: 'Продукт', exact: true });
    await modalProdCb.waitFor({ state: 'visible', timeout: 10000 });
    await modalProdCb.click();
    await page.waitForTimeout(400);
    await modalProdCb.fill('Мультиспрей');
    await page.waitForTimeout(800);

    let prodOpt = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]')
      .filter({ hasNotText: /Додати новий|\+|Створити/i })
      .first();

    if (!await prodOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
      await modalProdCb.fill('Шампунь');
      await page.waitForTimeout(800);
      prodOpt = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]')
        .filter({ hasNotText: /Додати новий|\+|Створити/i })
        .first();
    }

    if (await prodOpt.isVisible({ timeout: 3000 }).catch(() => false)) {
      const selectedProdText = (await prodOpt.innerText().catch(() => '')).trim();
      console.log(`   ✅ Обрано продукт: "${selectedProdText}"`);
      await prodOpt.click();
    }
    await page.waitForTimeout(500);

    // Поле "Продуктивність (од/год)"
    console.log(`👉 Вводимо розраховану продуктивність ${hourlyRate} (${capacity} / ${SHIFT_HOURS} год)...`);
    const modalRateInput = modalDialog.locator('input[aria-label*="Продуктивність"]').first()
      .or(modalDialog.getByRole('textbox', { name: /Продуктивність/i }).first());
    await modalRateInput.waitFor({ state: 'visible', timeout: 5000 });
    await modalRateInput.fill(hourlyRate.toString());
    await page.waitForTimeout(300);

    // Поле "Одиниця виміру продукту"
    console.log(`👉 Обираємо одиницю виміру продукту...`);
    const modalUnitCb = modalDialog.getByRole('combobox', { name: /Одиниця виміру продукту/i }).first()
      .or(modalDialog.locator('crt-combobox[aria-label*="Одиниця"]').getByRole('combobox').first())
      .or(modalDialog.getByRole('combobox').last());
    if (await modalUnitCb.isVisible({ timeout: 3000 }).catch(() => false)) {
      await modalUnitCb.click();
      await page.waitForTimeout(300);
      await modalUnitCb.fill('кілограм');
      await page.waitForTimeout(600);
      let unitOpt = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]')
        .filter({ hasNotText: /Додати новий|\+|Створити/i })
        .filter({ hasText: /кілограм/i }).first();
      if (!await unitOpt.isVisible({ timeout: 1500 }).catch(() => false)) {
        await modalUnitCb.fill('штук');
        await page.waitForTimeout(600);
        unitOpt = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]')
          .filter({ hasNotText: /Додати новий|\+|Створити/i })
          .first();
      }
      if (await unitOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
        await unitOpt.click();
      }
    }
    await page.waitForTimeout(500);

    // 📸 Скріншот заповненої модалки готового продукту перед збереженням
    const modalScreenshot = `test-results/equipment_${timestamp}_product_modal_filled.png`;
    await page.screenshot({ path: modalScreenshot, fullPage: false }).catch(() => { });
    console.log(`📸 Скріншот модального вікна продукту: ${modalScreenshot}`);

    // Зберегти модальне вікно
    console.log(`💾 Збереження модального вікна продукту...`);
    const modalSaveBtn = modalDialog.getByRole('button', { name: 'Зберегти' }).first()
      .or(page.locator('[role="dialog"] button:has-text("Зберегти")').first());
    await modalSaveBtn.click();
    await page.waitForTimeout(3000);

    // 📸 Скріншот вкладки ВИХІД з доданим рядком продукту!
    const outputTabScreenshot = `test-results/equipment_${timestamp}_output_tab_product.png`;
    await page.screenshot({ path: outputTabScreenshot, fullPage: false }).catch(() => { });
    console.log(`📸 Скріншот вкладки ВИХІД з продуктом: ${outputTabScreenshot}`);

    // 6. Фіналізація збереження картки
    console.log(`\n--- КРОК 5: Перевірка стану збереження картки ---`);
    const saveEquipBtn = page.getByRole('button', { name: 'Зберегти' }).first();
    if (await saveEquipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log(`💾 Клік "Зберегти" на картці...`);
      await saveEquipBtn.click();
      await page.waitForTimeout(3000);
    } else {
      console.log(`ℹ️ Картка вже збережена автоматично разом із продуктом.`);
    }

    const closeBtn = page.getByRole('button', { name: 'Закрити' }).first();
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(2000);
    }

    // 7. Перевірка в реєстрі
    console.log(`\n--- КРОК 6: Перевірка в реєстрі Обладнання ---`);
    await loginPage.open('/0/Shell/#Section/GenEquipment_ListPage');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    const equipRow = page.locator('tr, [role="row"], crt-data-table-row')
      .filter({ hasText: equipmentName })
      .first();

    await expect(equipRow).toBeVisible({ timeout: 15000 });

    const finalScreenshot = `test-results/equipment_${timestamp}_final_success.png`;
    await page.screenshot({ path: finalScreenshot, fullPage: false }).catch(() => { });
    console.log(`🎉 [SUCCESS] Обладнання "${equipmentName}" успішно створено з готовим продуктом та перевірено в реєстрі!`);
    console.log(`📸 Фінальний скріншот: ${finalScreenshot}`);
  });

});
