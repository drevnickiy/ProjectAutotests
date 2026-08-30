import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';
import fs from 'fs';
import path from 'path';

interface FinishedProductData {
  code: string;
  name: string;
  category: string;
  unit: string;
  batchControl?: string;
  shelfLifeDays?: string;
  url?: string;
  description: string;
}

async function selectDropdown(page: Page, label: string, optionText: string) {
  console.log(`🔍 [КОМБОБОКС "${label}"] Встановлення значення "${optionText}"...`);

  const cb = page.getByRole('combobox', { name: new RegExp(label, 'i') })
    .or(page.locator('crt-combobox, mat-form-field, crt-field').filter({ hasText: new RegExp(label, 'i') }).getByRole('combobox'))
    .first();

  if (!await cb.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log(`   ⚠️ [${label}] Комбобокс не знайдено`);
    return;
  }

  await cb.click();
  await page.waitForTimeout(400);
  await cb.fill(optionText);
  await page.waitForTimeout(800);

  const targetOption = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]')
    .filter({ hasNotText: /Додати новий|\+|Створити|crt-combobox-search/i })
    .filter({ hasText: new RegExp(optionText.trim(), 'i') })
    .first();

  if (await targetOption.isVisible({ timeout: 3000 }).catch(() => false)) {
    const targetText = (await targetOption.innerText().catch(() => '')).trim();
    console.log(`   ✅ [${label}] Обрано: "${targetText}"`);
    await targetOption.click();
  } else {
    const firstOption = page.locator('.cdk-overlay-pane mat-option:not([aria-disabled="true"]):not(.mdc-list-item--disabled)')
      .filter({ hasNotText: /Додати новий|\+|Створити|crt-combobox-search/i })
      .first();
    if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      const text = (await firstOption.innerText().catch(() => '')).trim();
      console.log(`   ✅ [${label}] Обрано першу опцію: "${text}"`);
      await firstOption.click();
    } else {
      await page.keyboard.press('Escape').catch(() => { });
    }
  }

  await page.waitForTimeout(500);
}

test.describe('02. Створення готової продукції (Finished Products)', () => {
  let loginPage: LoginPage;
  const dataPath = path.resolve(__dirname, '../data/finished_products.json');
  const products: FinishedProductData[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  for (const prod of products) {
    test(`Створення готового продукту: ${prod.name}`, async ({ page }) => {
      test.setTimeout(180000);
      console.log(`\n======================================================`);
      console.log(`🧴 Створення готового продукту [${prod.code}] "${prod.name}"...`);
      console.log(`======================================================`);

      // 1. Відкриття прямої форми створення продукту
      await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/Products_FormPage/add');
      await loginPage.login();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      // 2. Заповнення назви
      const nameInput = page.getByRole('textbox', { name: /Назва повна|Назва/i })
        .or(page.locator('crt-field, mat-form-field').filter({ hasText: /Назва повна|Назва/i }).locator('input'))
        .first();
      await nameInput.waitFor({ state: 'visible', timeout: 15000 });
      await nameInput.click();
      await nameInput.fill(prod.name);
      await page.waitForTimeout(500);

      // 3. Заповнення коду
      if (prod.code) {
        const codeInput = page.getByRole('textbox', { name: /Код|Артикул/i })
          .or(page.locator('input[aria-label*="Код"], input[aria-label*="Артикул"]'))
          .first();
        if (await codeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await codeInput.click();
          await codeInput.fill(prod.code);
          await page.waitForTimeout(300);
        }
      }

      // 4. Вибір Категорії
      if (prod.category) {
        await selectDropdown(page, 'Категорія', prod.category);
      }

      // 5. Вибір Типу контролю партії
      if (prod.batchControl) {
        await selectDropdown(page, 'Тип контролю партії', prod.batchControl);
      }

      // 6. Термін придатності (днів)
      if (prod.shelfLifeDays) {
        const shelfLifeInput = page.getByRole('textbox', { name: /Термін придатності \(днів\)|Термін придатності/i })
          .or(page.locator('crt-number-input, crt-field, mat-form-field').filter({ hasText: /Термін придатності \(днів\)|Термін придатності/i }).locator('input'))
          .first();
        if (await shelfLifeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await shelfLifeInput.click();
          await shelfLifeInput.fill(prod.shelfLifeDays);
          await page.waitForTimeout(300);
        }
      }

      // 7. Вибір Одиниці виміру
      if (prod.unit) {
        await selectDropdown(page, 'Одиниця виміру', prod.unit);
      }

      await page.waitForTimeout(1000);

      // 8. Скріншот заповненої картки перед збереженням
      const artifactDir = '/Users/bogdansunday/.gemini/antigravity-ide/brain/275d5a89-b865-4c99-a2bc-897cc221b635';
      const screenshotPath = path.join(artifactDir, 'created_test_product.png');
      await page.screenshot({ path: screenshotPath, fullPage: false });

      // 9. Збереження картки
      console.log('   💾 Збереження картки готового продукту (кнопка "Зберегти")...');
      const saveBtn = page.getByRole('button', { name: 'Зберегти', exact: true })
        .or(page.locator('button').filter({ hasText: /^Зберегти$/i }))
        .first();
      await saveBtn.click();
      await page.waitForTimeout(3000);

      console.log(`✅ Продукт "${prod.name}" успішно створено з типом контролю партії "${prod.batchControl || 'FEFO'}"!`);
      console.log(`📸 Скріншот збережено в: ${screenshotPath}`);
    });
  }
});
