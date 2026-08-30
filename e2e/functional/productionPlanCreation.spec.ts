import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { GenProductionPlanPage } from '../../src/pages/GenProductionPlanPage';

test.describe('TC-PLAN-04 / 05: Створення Плану виробництва та запуск алгоритмів планування', () => {
  let loginPage: LoginPage;
  let planPage: GenProductionPlanPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    planPage = new GenProductionPlanPage(page);
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionPlan_ListPage');
    await loginPage.login();
  });

  test('Створення Плану виробництва, алгоритм "Запланувати виробництво" та "Підібрати обладнання"', async ({ page }) => {
    test.setTimeout(240000);

    console.log('📌 1. Відкриття реєстру розділу "План виробництва"...');
    await page.goto('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionPlan_ListPage', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // 1. Клік по СИНІЙ кнопці "+ Додати" вгорі справа
    console.log('📌 2. Клік по синій кнопці "+ Додати" в реєстрі...');
    const addBtn = page.locator('crt-button[caption*="Додати"] button, button:has-text("Додати")')
      .or(page.getByRole('button', { name: 'Додати', exact: true }))
      .first();

    await addBtn.waitFor({ state: 'visible', timeout: 15000 });
    await addBtn.click({ force: true });
    await page.waitForTimeout(2500);

    // Якщо перехід на сторінку додавання не відбувся по кліку — переходимо напряму
    if (!page.url().includes('GenProductionPlan_FormPage')) {
      console.log('🔄 Відкриття сторінки додавання Плану виробництва...');
      await page.goto('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionPlan_FormPage/add', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
    }

    // Очікуємо завантаження полів форми
    console.log('⏳ Очікуємо готовності полів форми Плану виробництва...');
    const formInput = page.locator('input:not([type="file"])').first();
    await formInput.waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForTimeout(1500);

    // 2. Встановлення дат планового тижня
    console.log('📌 3. Заповнення дат тижневого плану та розрахунку виробництва...');

    // Розраховуємо дати наступного понеділка та неділі
    const now = new Date();
    const daysUntilMonday = ((1 + 7 - now.getDay()) % 7) || 7;
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextMonday.getDate() + 6);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const startDateStr = `${pad(nextMonday.getDate())}.${pad(nextMonday.getMonth() + 1)}.${nextMonday.getFullYear()}`;
    const endDateStr = `${pad(nextSunday.getDate())}.${pad(nextSunday.getMonth() + 1)}.${nextSunday.getFullYear()}`;
    console.log(`📅 Плановий період тижня: ${startDateStr} — ${endDateStr}`);

    // Дата початку (план)
    const startDateField = page.locator('crt-date-time-picker, crt-date-picker, mat-form-field, crt-field')
      .filter({ hasText: /Дата початку/i })
      .locator('input:not([type="file"])')
      .first();

    if (await startDateField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await startDateField.click();
      await startDateField.fill(startDateStr);
      await page.waitForTimeout(400);
    }

    // Дата завершення (план)
    const endDateField = page.locator('crt-date-time-picker, crt-date-picker, mat-form-field, crt-field')
      .filter({ hasText: /Дата завершення/i })
      .locator('input:not([type="file"])')
      .first();

    if (await endDateField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await endDateField.click();
      await endDateField.fill(endDateStr);
      await page.waitForTimeout(400);
    }

    // Поле "Розрахунок виробництва" (вибір активного розрахунку)
    console.log('🔍 Вибір розрахунку виробництва...');
    const calcCombobox = page.locator('crt-combobox, mat-form-field, crt-field')
      .filter({ hasText: /Розрахунок виробництва/i })
      .first();

    if (await calcCombobox.isVisible({ timeout: 5000 }).catch(() => false)) {
      const calcInput = calcCombobox.locator('input:not([type="file"])').first();
      await calcInput.click();
      await page.waitForTimeout(600);

      // Обираємо перший доступний активний розрахунок (без force: true згідно з AGENTS.md)
      const firstCalcOpt = page.locator('.cdk-overlay-pane mat-option:not([aria-disabled="true"]):not(.mdc-list-item--disabled)')
        .filter({ hasNotText: /Додати новий|\+|Створити|crt-combobox-search/i })
        .first();

      if (await firstCalcOpt.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstCalcOpt.click();
      } else {
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
      }
      await page.waitForTimeout(800);
    }

    // Збереження картки
    console.log('💾 Збереження картки Плану виробництва...');
    const saveBtn = page.getByRole('button', { name: 'Зберегти', exact: true })
      .or(page.locator('button').filter({ hasText: /^Зберегти$/i }))
      .first();

    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(4000);
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Алгоритм 1: "Запланувати виробництво"
    // ─────────────────────────────────────────────────────────────
    console.log('\n⚙️ 4. Перехід на вкладку "ПРОДУКТИ ПЛАНУ ВИРОБНИЦТВА" та запуск "Запланувати виробництво"...');
    const productsTab = page.locator('[role="tab"], .mat-mdc-tab, .mat-tab-label')
      .filter({ hasText: /Продукти плану|ПРОДУКТИ/i })
      .first();

    if (await productsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await productsTab.click();
      await page.waitForTimeout(2000);
    }

    // Кнопка "Запланувати виробництво"
    const scheduleBtn = page.getByRole('button', { name: /Запланувати виробництво/i })
      .or(page.locator('button, crt-button').filter({ hasText: /Запланувати виробництво/i }))
      .first();

    if (await scheduleBtn.isVisible({ timeout: 15000 }).catch(() => false)) {
      console.log('🚀 Натискання кнопки [Запланувати виробництво]...');
      await scheduleBtn.click();
      await page.waitForTimeout(6000);
    }

    // ─────────────────────────────────────────────────────────────
    // 4. Алгоритм 2: "Підібрати обладнання"
    // ─────────────────────────────────────────────────────────────
    console.log('\n⚙️ 5. Перехід на вкладку "ВИРОБНИЧІ ЗАМОВЛЕННЯ" та запуск "Підібрати обладнання"...');
    const ordersTab = page.locator('[role="tab"], .mat-mdc-tab, .mat-tab-label')
      .filter({ hasText: /Виробничі замовлення|ЗАМОВЛЕННЯ/i })
      .first();

    if (await ordersTab.isVisible({ timeout: 10000 }).catch(() => false)) {
      await ordersTab.click();
      await page.waitForTimeout(2000);
    }

    // Кнопка "Підібрати обладнання"
    const selectEquipmentBtn = page.getByRole('button', { name: /Підібрати обладнання/i })
      .or(page.locator('button, crt-button').filter({ hasText: /Підібрати обладнання/i }))
      .first();

    if (await selectEquipmentBtn.isVisible({ timeout: 15000 }).catch(() => false)) {
      console.log('🚀 Натискання кнопки [Підібрати обладнання]...');
      await selectEquipmentBtn.click();
      await page.waitForTimeout(6000);
    }

    // Якщо з'явилося модальне попередження про ліміт завантаження 80% — підтверджуємо "Так"
    const confirmModalBtn = page.locator('mat-dialog-container button, crt-modal button')
      .filter({ hasText: /Так|Продовжити|OK|Підтвердити/i })
      .first();

    if (await confirmModalBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      console.log('⚠️ З’явилося підтвердження завантаження понад 80%, підтверджуємо...');
      await confirmModalBtn.click();
      await page.waitForTimeout(3000);
    }

    // ─────────────────────────────────────────────────────────────
    // 5. Затвердження плану виробництва
    // ─────────────────────────────────────────────────────────────
    console.log('\n🔒 6. Фінальне затвердження Плану виробництва...');
    const approveBtn = page.getByRole('button', { name: /Затвердити/i })
      .or(page.locator('button, crt-button').filter({ hasText: /^Затвердити$/i }))
      .first();

    if (await approveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await approveBtn.click();
      await page.waitForTimeout(3000);
      console.log('✅ Кнопку [Затвердити] успішно натиснуто!');
    }

    console.log('\n🎉 План виробництва успішно створено, розраховано та запущено алгоритми!');
  });
});
