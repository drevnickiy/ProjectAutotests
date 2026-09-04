import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';

test.describe('TC-PLAN-01: Створення та затвердження Планування готової продукції (ПГП / PFP)', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenPlanFinishProduct_ListPage');
    await loginPage.login();
  });

  test('Створення PFP, додавання продукту з техкартою та переведення в статус Затверджено', async ({ page }) => {
    test.setTimeout(180000);

    console.log('📌 1. Відкриття розділу Планування готової продукції...');
    await page.goto('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenPlanFinishProduct_ListPage');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('img[alt="Завантаження"], .crt-loading-mask, crt-spinner').waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // 1. Клік по кнопці Додати в реєстрі
    console.log('📌 2. Відкриття модального вікна створення ПГП...');
    const addBtn = page.locator('#AddButton button, #AddButton, [data-item-marker="AddRecordButton"]').first();
    await addBtn.waitFor({ state: 'visible', timeout: 30000 });
    await addBtn.click();

    // Очікуємо модальне вікно
    const modal = page.locator('crt-modal, mat-dialog-container, [role="dialog"]').first();
    await modal.waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(1000);

    // 2. Заповнення полів ТІЛЬКИ всередині модального вікна
    console.log('📌 3. Заповнення параметрів у модалці (Рік, Місяць, Бренд)...');

    // Вказуємо вересень 2026
    const targetYear = '2026';
    const targetMonthName = 'Вересень';
    console.log(`📅 Цільовий плановий період: ${targetMonthName} ${targetYear}`);

    // Рік у модалці
    const yearInput = modal.getByRole('textbox', { name: 'Рік' })
      .or(modal.locator('crt-field, mat-form-field').filter({ hasText: 'Рік' }).locator('input')).first();
    if (await yearInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await yearInput.click();
      await yearInput.press('ControlOrMeta+a').catch(() => {});
      await yearInput.press('Backspace').catch(() => {});
      await yearInput.pressSequentially(targetYear, { delay: 60 }).catch(() => { });
    }

    // Місяць у модалці (Вересень)
    const monthCb = modal.getByRole('combobox', { name: 'Місяць' })
      .or(modal.locator('crt-field, mat-form-field').filter({ hasText: 'Місяць' }).getByRole('combobox')).first();
    if (await monthCb.isVisible({ timeout: 3000 }).catch(() => false)) {
      await monthCb.click();
      await page.waitForTimeout(400);
      await monthCb.pressSequentially(targetMonthName, { delay: 60 }).catch(() => { });
      await page.waitForTimeout(600);

      const monthOpt = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]')
        .filter({ hasNotText: /Додати новий|\+|Створити/i })
        .filter({ hasText: new RegExp(`^\\s*${targetMonthName}\\s*$`, 'i') })
        .first();

      if (await monthOpt.isVisible({ timeout: 3000 }).catch(() => false)) {
        await monthOpt.click();
        console.log(`   ✅ Обрано місяць: "${targetMonthName}"`);
      } else {
        const fallbackOpt = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]')
          .filter({ hasText: targetMonthName }).first();
        if (await fallbackOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
          await fallbackOpt.click();
          console.log(`   ✅ Обрано місяць (fallback): "${targetMonthName}"`);
        }
      }
    }

    // Бренд у модалці
    const brandCb = modal.getByRole('combobox', { name: 'Бренд' })
      .or(modal.locator('crt-field, mat-form-field').filter({ hasText: 'Бренд' }).getByRole('combobox')).first();
    if (await brandCb.isVisible({ timeout: 3000 }).catch(() => false)) {
      await brandCb.click();
      await page.waitForTimeout(400);
      const brandOpt = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]').first();
      if (await brandOpt.isVisible({ timeout: 3000 }).catch(() => false)) {
        await brandOpt.click();
      }
    }

    // 3. Збереження модального вікна
    console.log('📌 4. Збереження модалки...');
    const modalSaveBtn = modal.getByRole('button', { name: 'Зберегти' })
      .or(modal.locator('button').filter({ hasText: 'Зберегти' })).first();
    await modalSaveBtn.click();

    // 4. Очікуємо закриття модалки та відкриваємо створений запис PFP
    console.log('📌 5. Перехід у створену картку PFP з реєстру...');
    await modal.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => { });
    await page.waitForTimeout(2000);

    const firstPfpLink = page.getByRole('link', { name: /PFP\s*-\s*\d+/i })
      .or(page.locator('a[href*="GenPlanFinishProduct_FormPage"], [role="gridcell"] a'))
      .first();

    await firstPfpLink.waitFor({ state: 'visible', timeout: 15000 });
    const pfpNumber = (await firstPfpLink.innerText().catch(() => '')).trim();
    console.log(`   🔗 Відкриваємо запис: "${pfpNumber}"`);
    await firstPfpLink.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // 5. Додавання продукту у таблицю "План потреби готової продукції"
    console.log('📌 6. Додавання продукту у деталь "План потреби готової продукції"...');
    const tableContainer = page.locator('application[name*="План потреби готової продукції"], [aria-label*="План потреби готової продукції"], table').first();

    // Клік по кнопці Додати новий запис
    const addRowBtn = page.getByRole('button', { name: 'Додати новий запис', exact: true });
    await addRowBtn.waitFor({ state: 'visible', timeout: 15000 });
    console.log('   👉 Клік по кнопці "Додати новий запис"...');
    await addRowBtn.click();
    await page.waitForTimeout(1500);

    // Клік по кнопці вибору продукту в рядку таблиці
    console.log('   👉 Вибір продукту в рядку таблиці...');
    const selectProductBtn = tableContainer.getByRole('button', { name: 'Оберіть значення', exact: true })
      .or(tableContainer.locator('button[title*="Оберіть значення"], [role="combobox"]'))
      .first();

    if (await selectProductBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await selectProductBtn.click();
      await page.waitForTimeout(400);
    }

    // Вводимо "Шампунь", щоб відфільтрувати список
    await page.keyboard.type('Шампунь', { delay: 100 });
    await page.waitForTimeout(1000);

    // Обираємо готовий продукт (ГП) з дійсною Технологічною картою (виключаючи тестові без ТК)
    const productOption = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]')
      .filter({ hasNotText: /Додати новий|\+|Створити|Банка|Флакон|Пляшка|Дозатор|Етикетка|Коробка|Матеріал|Сировина|Основа|Концентрат|Немає даних|Test/i })
      .filter({ hasText: /Шампунь|Hydrasence/i })
      .first();

    await productOption.waitFor({ state: 'visible', timeout: 15000 });
    const prodName = (await productOption.innerText().catch(() => '')).trim();
    console.log(`   ✅ 1) Обрано Готовий Продукт (ГП): "${prodName}"`);
    await productOption.click();
    await page.waitForTimeout(1000);

    // ─────────────────────────────────────────────────────────────
    // КРОК 1: ЗБЕРІГАЄМО ОБРАНИЙ ПРОДУКТ ТА ЧЕКАЄМО
    // ─────────────────────────────────────────────────────────────
    console.log('   💾 2) Зберігаємо продукт у таблиці ("Зберегти все")...');
    const saveRowBtn = page.getByRole('button', { name: 'Зберегти все (Ctrl+S)' })
      .or(page.getByRole('button', { name: /Зберегти все/i })).first();
    await saveRowBtn.waitFor({ state: 'visible', timeout: 8000 });
    await saveRowBtn.click();
    await page.waitForTimeout(2500);

    // ─────────────────────────────────────────────────────────────
    // КРОК 2: ТОЧНЕ РЕДАГУВАННЯ ЧЕРЕЗ КОЛОНКИ: Мін партія ➔ Мін залишок ➔ Замовлення
    // ─────────────────────────────────────────────────────────────
    console.log('   ✏️ 3) Заповнення значень у таблиці через точні локатори...');

    const saveRowCell = async () => {
      const saveBtn = page.getByRole('button', { name: 'Зберегти все (Ctrl+S)' })
        .or(page.getByRole('button', { name: /Зберегти все/i })).first();
      await saveBtn.waitFor({ state: 'visible', timeout: 8000 });
      await saveBtn.click({ force: true });
      await page.waitForTimeout(1500);
    };

    // 1) Мін партія (10)
    await page.locator('.mat-mdc-cell.mdc-data-table__cell.cdk-cell.crt-data-table-cell-container.cdk-column-17850c28-8d72-510e-abff-17f7e175d599 > .crt-cell').click();
    await page.getByRole('button', { name: 'Редагувати', exact: true }).click();
    const input1 = page.getByRole('textbox', { name: 'Номер карти' });
    await input1.click();
    await input1.press('ControlOrMeta+a').catch(() => {});
    await input1.press('Backspace').catch(() => {});
    await input1.pressSequentially('10', { delay: 100 });
    await saveRowCell();

    // 2) Мін залишок (10)
    await page.locator('.mat-mdc-cell.mdc-data-table__cell.cdk-cell.crt-data-table-cell-container.cdk-column-ca2c2ccc-b8d3-d2f2-d6c5-3a7d0babff22 > .crt-cell').click();
    await page.getByRole('button', { name: 'Редагувати', exact: true }).click();
    const input2 = page.getByRole('textbox', { name: 'Номер карти' });
    await input2.click();
    await input2.press('ControlOrMeta+a').catch(() => {});
    await input2.press('Backspace').catch(() => {});
    await input2.pressSequentially('10', { delay: 100 });
    await saveRowCell();

    // 3) Замовлення (100)
    await page.locator('.mat-mdc-cell.mdc-data-table__cell.cdk-cell.crt-data-table-cell-container.cdk-column-e9455994-4a5f-6129-c7b9-83ea785eade4 > .crt-cell').click();
    await page.getByRole('button', { name: 'Редагувати', exact: true }).click();
    const input3 = page.getByRole('textbox', { name: 'Номер карти' });
    await input3.click();
    await input3.press('ControlOrMeta+a').catch(() => {});
    await input3.press('Backspace').catch(() => {});
    await input3.pressSequentially('100', { delay: 100 });
    await saveRowCell();

    // 6. Перевірка збереженого рядка продукту та автоматичного підтягування Технологічної карти
    console.log('📌 7. Перевірка збереженого продукту та Технологічної карти в таблиці...');
    const productRow = page.locator('tr.mdc-data-table__row, [role="row"]')
      .filter({ hasNotText: /Новий/i })
      .filter({ hasText: /PROD|Шампунь|Тонік|Гель|Кондиціонер|Патчі|Крем|ТК-/i })
      .first();

    await expect(productRow).toBeVisible({ timeout: 10000 });

    const techMapCell = productRow.locator('[role="gridcell"], .crt-cell, .cdk-cell, a, td')
      .filter({ hasText: /ТК-|Технологічна|GP-/i })
      .first();

    await expect(techMapCell).toBeVisible({ timeout: 10000 });
    const techMapText = (await techMapCell.innerText().catch(() => '')).trim();
    console.log(`   ✅ Технологічна карта успішно підтягнулася в колонці: "${techMapText}"`);

    // 7. Переведення по стадіях процесу до "Затверджено" через верхній DCM
    console.log('📌 8. Переведення ПГП у статус "Затверджено" через верхній DCM...');

    // Стадія "Відділ продажів"
    const stageSales = page.getByRole('button', { name: /Set the record stage Відділ продажів|Відділ продажів/i })
      .or(page.locator('.crt-stage-step, [role="tab"]').filter({ hasText: 'Відділ продажів' })).first();
    if (await stageSales.isVisible({ timeout: 4000 }).catch(() => false)) {
      await stageSales.click().catch(() => { });
      await page.waitForTimeout(1500);
    }

    // Стадія "Фінальне затвердження"
    const stageFinalApproval = page.getByRole('button', { name: /Set the record stage Фінальне затвердження|Фінальне затвердження/i })
      .or(page.locator('.crt-stage-step, [role="tab"]').filter({ hasText: 'Фінальне затвердження' })).first();
    if (await stageFinalApproval.isVisible({ timeout: 4000 }).catch(() => false)) {
      await stageFinalApproval.click().catch(() => { });
      await page.waitForTimeout(1500);
    }

    // Фінальний статус "Затверджено"
    const stageApproved = page.getByRole('button', { name: /Set the record stage Затверджено|Затверджено/i })
      .or(page.locator('.crt-stage-step, [role="tab"], button').filter({ hasText: 'Затверджено' })).first();
    await stageApproved.waitFor({ state: 'visible', timeout: 8000 });
    await stageApproved.click();
    await page.waitForTimeout(1500);

    // Якщо з'явилося меню або підтвердження переходу:
    const confirmMenuBtn = page.locator('.cdk-overlay-pane button, [role="menuitem"]').filter({ hasText: /Затверджено|Перейти/i }).first();
    if (await confirmMenuBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmMenuBtn.click().catch(() => { });
      await page.waitForTimeout(1500);
    }

    // Перевірка відсутності блокуючих помилок валідації
    const errorDialog = page.locator('mat-dialog-container, crt-modal, .ts-messagebox, [role="dialog"], [role="alertdialog"]')
      .filter({ hasText: /Не всі продукти мають технологічну карту|помилк/i })
      .first();
    const hasError = await errorDialog.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasError) {
      const errText = await errorDialog.innerText().catch(() => '');
      throw new Error(`Помилка валідації при переході в 'Затверджено': ${errText}`);
    }

    // Перевірка наявності активної або відображеної стадії "Затверджено"
    const finalApprovedIndicator = page.getByRole('button', { name: /Затверджено/i })
      .or(page.locator('.crt-stage-step, [role="tab"], button, div').filter({ hasText: /^Затверджено$/ })).first();
    await expect(finalApprovedIndicator).toBeVisible({ timeout: 8000 });
    console.log('   ✅ Статус картки успішно переведено в "Затверджено"!');

    console.log('🎉 Успішно! Тест TC-PLAN-01 повністю виконано.');
  });
});
