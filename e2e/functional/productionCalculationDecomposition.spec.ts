import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { GenProductionCalculatPage } from '../../src/pages/GenProductionCalculatPage';

test.describe('TC-PLAN-02: Декомпозиція та розрахунок виробництва (GenProductionCalculat)', () => {
  let calculatPage: GenProductionCalculatPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionCalculat_ListPage');
    await loginPage.login();

    calculatPage = new GenProductionCalculatPage(page);
  });

  test('1. Перевірка наявності активного Розрахунку виробництва та продуктів декомпозиції', async ({ page }) => {
    test.setTimeout(90000);
    await calculatPage.open();

    console.log('🔍 Пошук активного запису Розрахунку виробництва у реєстрі...');
    
    // Шукаємо запис розрахунку зі статусом "Активний" або за цільовою назвою
    const activeRow = page.locator('mat-row, tr, [role="row"]').filter({ hasText: /Активний/i }).first();
    const isRowVisible = await activeRow.isVisible().catch(() => false);
    
    const activeCalculationLink = isRowVisible
      ? activeRow.locator('a, [role="link"]').first()
      : page.getByRole('link', { name: /3_140726|PC\s*-\s*\d+|Вересень/i }).first();
    
    await activeCalculationLink.waitFor({ state: 'visible', timeout: 15000 });
    const calcName = await activeCalculationLink.innerText();
    console.log(`📄 Відкриваємо активний розрахунок: "${calcName}"...`);
    await activeCalculationLink.click();

    // Очікуємо завантаження форми
    await calculatPage.waitForCardLoaded('Статус розрахунку виробництва');

    // Перевіряємо поля лівої панелі
    await expect(calculatPage.nameInput).toBeVisible();
    await expect(calculatPage.calculationStatusInput).toBeVisible();

    // Переходимо на вкладку "ПРОДУКТИ РОЗРАХУНКУ ВИРОБНИЦТВА"
    console.log('📑 Перехід на вкладку «ПРОДУКТИ РОЗРАХУНКУ ВИРОБНИЦТВА»...');
    await calculatPage.switchToTab('Продукти розрахунку');

    // Перевіряємо таблицю продуктів декомпозиції
    const productsTable = page.locator('.crt-grid, [role="grid"]').first();
    await expect(productsTable).toBeVisible({ timeout: 10000 });

    const rowsCount = await page.locator('.crt-grid [role="row"], [role="grid"] [role="row"]').count();
    console.log(`📊 Кількість рядків у таблиці розрахунку: ${rowsCount}`);

    // Перевіряємо наявність заголовків
    await expect(page.getByText('Продукт', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Кількість до виробництва', { exact: true }).first()).toBeVisible();

    // Робимо скріншот успішного розрахунку
    await page.screenshot({ path: 'screenshots/SUCCESS_TC_PLAN_02_Decomposition.png', fullPage: true });
    console.log('✅ TC-PLAN-02 успішно виконано!');
  });
});
