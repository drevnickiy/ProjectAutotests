import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';

test.describe('TC-PLAN-02-NEG: Валідація блокування затвердження ПГП для продукту з кількома ТК без обраної карти', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenPlanFinishProduct_ListPage');
    await loginPage.login();
  });

  test('Спроба затвердження продукту з декількома ТК без вибору конкретної карти викликає поп-ап блокування', async ({ page }) => {
    test.setTimeout(180000);

    console.log('📌 1. Відкриття розділу Планування готової продукції...');
    await page.goto('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenPlanFinishProduct_ListPage');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // 1. Створення нового запису ПГП
    console.log('📌 2. Відкриття модального вікна створення ПГП...');
    const addBtn = page.locator('#AddButton button, #AddButton').first();
    await addBtn.waitFor({ state: 'visible', timeout: 15000 });
    await addBtn.click();

    const modal = page.locator('crt-modal, mat-dialog-container, [role="dialog"]').first();
    await modal.waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(1000);

    // Розрахунок гарантованого майбутнього періоду:
    const monthNamesUk = [
      'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
      'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
    ];
    const now = new Date();
    const futureDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const targetYear = futureDate.getFullYear().toString();
    const targetMonthName = monthNamesUk[futureDate.getMonth()];
    console.log(`📅 Цільовий період: ${targetMonthName} ${targetYear}`);

    // Заповнення року
    const yearInput = modal.getByRole('textbox', { name: 'Рік' })
      .or(modal.locator('crt-field, mat-form-field').filter({ hasText: 'Рік' }).locator('input')).first();
    if (await yearInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await yearInput.click();
      await yearInput.fill(targetYear).catch(() => { });
    }

    // Заповнення місяця
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
      }
    }

    // Вибір бренду
    const brandCb = modal.getByRole('combobox', { name: 'Бренд' })
      .or(modal.locator('crt-field, mat-form-field').filter({ hasText: 'Бренд' }).getByRole('combobox')).first();
    if (await brandCb.isVisible({ timeout: 3000 }).catch(() => false)) {
      await brandCb.click();
      await page.waitForTimeout(400);
      const brandOpt = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]').first();
      if (await brandOpt.isVisible().catch(() => false)) {
        await brandOpt.click();
      }
    }

    // Збереження модального вікна
    console.log('📌 3. Збереження модалки...');
    const modalSaveBtn = modal.getByRole('button', { name: 'Зберегти' })
      .or(modal.locator('button').filter({ hasText: 'Зберегти' })).first();
    await modalSaveBtn.click();

    // Відкриття створеної картки
    console.log('📌 4. Відкриття створеної картки з реєстру...');
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

    // 2. Додавання продукту "Шампунь" (що має 3 техкарти)
    console.log('📌 5. Додавання продукту "Шампунь" (має 3 техкарти, карта не обирається автоматично)...');
    const tableContainer = page.locator('application[name*="План потреби готової продукції"], [aria-label*="План потреби готової продукції"], table').first();

    const addRowBtn = page.getByRole('button', { name: 'Додати новий запис', exact: true });
    await addRowBtn.waitFor({ state: 'visible', timeout: 15000 });
    console.log('   👉 Клік по кнопці "Додати новий запис"...');
    await addRowBtn.click();
    await page.waitForTimeout(1500);

    // Відкриваємо вибір продукту строго ВСЕРЕДИНІ ТАБЛИЦІ
    console.log('   👉 Клік по кнопці вибору продукту в рядку таблиці...');
    const selectProductBtn = tableContainer.getByRole('button', { name: 'Оберіть значення', exact: true })
      .or(tableContainer.locator('button[title*="Оберіть значення"], [role="combobox"]'))
      .first();

    await selectProductBtn.waitFor({ state: 'visible', timeout: 8000 });
    await selectProductBtn.click();
    // Шукаємо точний збіг "Шампунь" через скролінг випадаючого списку
    console.log('   🔍 Прокручуємо випадаючий список у пошуках точного "Шампунь"...');
    const dropdownList = page.locator('.cdk-overlay-pane [role="listbox"], .cdk-overlay-pane, [role="listbox"]').first();
    await dropdownList.waitFor({ state: 'visible', timeout: 5000 });
    await dropdownList.hover().catch(() => {});

    const targetOption = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]')
      .filter({ hasNotText: /Етикетка|Банка|Флакон|Пляшка|Дозатор|Кришка|Коробка|без ТК|одна ТК|Об'єм та сила|Додати новий/i })
      .filter({ hasText: /^Шампунь$/i })
      .first();

    for (let i = 0; i < 35; i++) {
      if (await targetOption.isVisible().catch(() => false)) {
        break;
      }
      await page.mouse.wheel(0, 300);
      await dropdownList.evaluate((el) => {
        el.scrollTop += 300;
      }).catch(() => {});
      await page.waitForTimeout(200);
    }

    await targetOption.scrollIntoViewIfNeeded().catch(() => {});
    await targetOption.waitFor({ state: 'visible', timeout: 10000 });
    const prodName = (await targetOption.innerText().catch(() => '')).trim();
    console.log(`   ✅ Знайдено та обрано точний продукт: "${prodName}"`);
    await targetOption.click();
    await page.waitForTimeout(1000);

    // Збереження рядка через кнопку "Зберегти все"
    console.log('   💾 Збереження доданого продукту в таблиці...');
    const saveRowBtn = page.getByRole('button', { name: 'Зберегти все', exact: true })
      .or(page.getByRole('button', { name: 'Зберегти все (Ctrl+S)' }))
      .or(page.locator('button').filter({ hasText: 'Зберегти все' }))
      .first();
    if (await saveRowBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveRowBtn.click();
    }

    // Підтвердження системного діалогу збереження, якщо з'явиться
    const confirmSaveBtn = page.locator('dialog, mat-dialog-container, [role="dialog"]').getByRole('button', { name: 'Зберегти', exact: true }).first();
    if (await confirmSaveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmSaveBtn.click();
    }
    await page.waitForTimeout(2000);

    // 3. Спроба переведення у статус "Затверджено" без вибору конкретної техкарти
    console.log('📌 6. Спроба переведення ПГП у статус "Затверджено" без обраної ТК...');

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

    // Натискання "Затверджено"
    const stageApproved = page.getByRole('button', { name: /Set the record stage Затверджено|Затверджено/i })
      .or(page.locator('crt-button, button').filter({ hasText: 'Затверджено' })).first();
    await stageApproved.waitFor({ state: 'visible', timeout: 5000 });
    await stageApproved.click();
    await page.waitForTimeout(1500);

    // 4. Перевірка появи модального вікна / поп-апу помилки валідації
    console.log('📌 7. Перевірка появи діалогового вікна помилки валідації...');
    const errorDialog = page.getByText(/Не всі продукти мають технологічну карту\.?\s*Заповніть технологічні карти для всіх/i)
      .or(page.locator('mat-dialog-container, crt-modal, .ts-messagebox, .crt-toast, [role="dialog"], [role="alertdialog"]').filter({ hasText: /Не всі продукти мають технологічну карту|технологічн/i }))
      .first();

    await expect(errorDialog).toBeVisible({ timeout: 15000 });
    const errorMsg = (await errorDialog.innerText().catch(() => '')).trim();
    console.log(`🚨 Отримано очікуваний поп-ап блокування: "${errorMsg}"`);

    // Підтвердження діалогу закриття
    const okBtn = errorDialog.getByRole('button', { name: 'OK', exact: true })
      .or(page.getByRole('button', { name: 'OK', exact: true })).first();
    if (await okBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await okBtn.click();
    }

    console.log('🎉 Успішно! Тест блокування затвердження без вибору ТК для продукту з декількома картами пройдено.');
  });
});
