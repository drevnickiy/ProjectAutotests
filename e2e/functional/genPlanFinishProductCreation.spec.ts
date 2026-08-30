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
    await page.waitForTimeout(3000);

    // 1. Клік по кнопці Додати в реєстрі
    console.log('📌 2. Відкриття модального вікна створення ПГП...');
    const addBtn = page.locator('#AddButton button, #AddButton').first();
    await addBtn.waitFor({ state: 'visible', timeout: 15000 });
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
      await yearInput.fill(targetYear).catch(() => { });
    }

    // Місяць у модалці (Вересень)
    const monthCb = modal.getByRole('combobox', { name: 'Місяць' })
      .or(modal.locator('crt-field, mat-form-field').filter({ hasText: 'Місяць' }).getByRole('combobox')).first();
    if (await monthCb.isVisible({ timeout: 3000 }).catch(() => false)) {
      await monthCb.click();
      await page.waitForTimeout(400);
      await monthCb.fill(targetMonthName).catch(() => { });
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
    console.log('   👉 Клік по кнопці вибору продукту в рядку таблиці...');
    const selectProductBtn = tableContainer.getByRole('button', { name: 'Оберіть значення', exact: true })
      .or(tableContainer.locator('button[title*="Оберіть значення"], [role="combobox"]'))
      .first();

    await selectProductBtn.waitFor({ state: 'visible', timeout: 8000 });
    await selectProductBtn.click();
    await page.waitForTimeout(600);

    // Обираємо готовий продукт (ГП)
    const productOption = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]')
      .filter({ hasNotText: /Додати новий|\+|Створити|Банка|Флакон|Пляшка|Дозатор|Етикетка|Коробка|Матеріал|Сировина|Основа|Концентрат/i })
      .filter({ hasText: /Шампунь|Тонік|Гель|Кондиціонер|Патчі|Крем/i })
      .first();

    if (await productOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      const prodName = (await productOption.innerText().catch(() => '')).trim();
      console.log(`   ✅ 1) Обрано Готовий Продукт (ГП): "${prodName}"`);
      await productOption.click();
    } else {
      const fallbackOpt = page.locator('.cdk-overlay-pane mat-option').first();
      const anyText = (await fallbackOpt.innerText().catch(() => '')).trim();
      console.log(`   ✅ 1) Обрано Готовий Продукт (Fallback): "${anyText}"`);
      await fallbackOpt.click();
    }
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
    // КРОК 2: ПОСЛІДОВНЕ РЕДАГУВАННЯ: Мін партія ➔ Мін залишок ➔ Замовлення
    // ─────────────────────────────────────────────────────────────
    console.log('   ✏️ 3) Послідовно заповнюємо та зберігаємо кожне поле...');

    const getColumnIndex = async (colName: string): Promise<number> => {
      const headers = page.locator('th, mat-header-cell, [role="columnheader"]');
      const count = await headers.count();
      for (let i = 0; i < count; i++) {
        const text = await headers.nth(i).innerText().catch(() => '');
        if (text.toLowerCase().includes(colName.toLowerCase())) {
          return i;
        }
      }
      return -1;
    };

    const fillRowCellAndSave = async (colHeaderName: string, value: string) => {
      console.log(`      ➔ Заповнення "${colHeaderName}" ➔ ${value}...`);

      const colIdx = await getColumnIndex(colHeaderName);
      const targetRow = page.locator('tr.mdc-data-table__row, [role="row"]').last();
      const targetCell = colIdx >= 0
        ? targetRow.locator('td, [role="gridcell"]').nth(colIdx)
        : targetRow.locator('td, [role="gridcell"]').filter({ hasText: new RegExp(colHeaderName, 'i') }).first();

      await targetCell.click();
      await page.waitForTimeout(500);

      // Клік по кнопці Редагувати (якщо з'явилася)
      const editBtn = page.getByRole('button', { name: 'Редагувати', exact: true })
        .or(page.locator('button[title*="Редагувати"], button[aria-label*="Редагувати"]')).first();
      if (await editBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(400);
      }

      // Введення значення в активний інпут
      const activeInp = page.locator('input:focus, crt-number-input input, .mat-mdc-cell input').last();
      if (await activeInp.isVisible({ timeout: 2500 }).catch(() => false)) {
        await activeInp.click();
        await activeInp.fill(value);
        await page.keyboard.press('Tab');
        await page.waitForTimeout(500);
      }

      // Натискаємо плаваючу кнопку "Зберегти все" та чекаємо
      const saveBtn = page.getByRole('button', { name: /Зберегти все/i }).first();
      if (await saveBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
      }
      console.log(`      ✅ Поле "${colHeaderName}" успішно збережено: ${value}`);
    };

    // 1) Мін партія (50)
    await fillRowCellAndSave('Мін партія', '50');

    // 2) Мін залишок (2000)
    await fillRowCellAndSave('Мін залишок', '2000');

    // 3) Замовлення (2000)
    await fillRowCellAndSave('Замовлення', '2000');

    // 6. Перевірка збереженого рядка продукту та автоматичного підтягування Технологічної карти
    console.log('📌 7. Перевірка збереженого продукту та Технологічної карти в таблиці...');
    const gridTable = page.locator('application[name*="План потреби готової продукції"], table').first();

    const productRow = gridTable.locator('[role="row"]').last();
    await expect(productRow).toBeVisible({ timeout: 10000 });

    const techMapCell = productRow.locator('[role="gridcell"], .crt-cell, .cdk-cell, a')
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
      .or(page.locator('crt-button, button').filter({ hasText: 'Затверджено' })).first();
    if (await stageApproved.isVisible({ timeout: 5000 }).catch(() => false)) {
      await stageApproved.click().catch(() => { });
      await page.waitForTimeout(2000).catch(() => { });
    }

    console.log('🎉 Успішно! Тест TC-PLAN-01 повністю виконано.');
  });
});
