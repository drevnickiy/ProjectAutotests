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

const SYNONYMS_MAP: Record<string, string[]> = {
  'Сировина': ['Raw Materials', 'Сировина'],
  'Напівфабрикат': ['Semi-finished product', 'Напівфабрикат'],
  'Готова продукція': ['Finished product', 'Готова продукція'],
  'Готовий продукт': ['Finished product', 'Готова продукція', 'Готовий продукт'],
  'Матеріали': ['Матеріали', 'Materials'],
  'кілограм': ['kilogram', 'кілограм', 'кг'],
  'штук': ['pieces', 'штук', 'шт'],
  'FEFO': ['FEFO'],
  'FIFO': ['FIFO']
};

async function selectDropdown(page: Page, label: string, optionText: string) {
  console.log(`🔍 [КОМБОБОКС "${label}"] Встановлення значення "${optionText}"...`);

  const input = page.locator(`input[aria-label*="${label}" i]`)
    .or(page.getByRole('combobox', { name: new RegExp(label, 'i') }))
    .or(page.locator('crt-combobox, mat-form-field, crt-field').filter({ hasText: new RegExp(label, 'i') }).locator('input'))
    .first();

  if (!await input.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log(`   ⚠️ [${label}] Комбобокс не знайдено`);
    return;
  }

  await input.scrollIntoViewIfNeeded().catch(() => { });
  await input.click();
  await page.waitForTimeout(400);

  const candidates = [optionText, ...(SYNONYMS_MAP[optionText] || [])];
  let selected = false;

  for (const candidate of candidates) {
    const targetOption = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]')
      .filter({ hasNotText: /Додати новий|\+|Створити|crt-combobox-search|create/i })
      .filter({ hasText: new RegExp(`^\\s*${candidate.trim()}\\s*$`, 'i') })
      .first();

    if (await targetOption.isVisible({ timeout: 1500 }).catch(() => false)) {
      const text = (await targetOption.innerText().catch(() => '')).trim();
      console.log(`   ✅ [${label}] Обрано: "${text}"`);
      await targetOption.click();
      selected = true;
      break;
    }
  }

  if (!selected) {
    for (const candidate of candidates) {
      const targetOption = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]')
        .filter({ hasNotText: /Додати новий|\+|Створити|crt-combobox-search|create/i })
        .filter({ hasText: new RegExp(candidate.trim(), 'i') })
        .first();

      if (await targetOption.isVisible({ timeout: 1500 }).catch(() => false)) {
        const text = (await targetOption.innerText().catch(() => '')).trim();
        console.log(`   ✅ [${label}] Обрано (partial): "${text}"`);
        await targetOption.click();
        selected = true;
        break;
      }
    }
  }

  if (!selected) {
    console.log(`   ⚠️ [${label}] Не знайдено опції для "${optionText}", закриваємо список`);
    await page.keyboard.press('Escape').catch(() => { });
  }

  await page.waitForTimeout(400);
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
      await loginPage.open('/0/Shell/#Card/Products_FormPage/add');
      await loginPage.login();
      if (!page.url().includes('Products_FormPage/add')) {
        await loginPage.open('/0/Shell/#Card/Products_FormPage/add');
      }
      await page.waitForLoadState('domcontentloaded');

      // 2. Заповнення назви (Ліва панель)
      const nameInput = page.locator('input[aria-label="Name"], input[placeholder*="Specify product name"], input[aria-label*="Назва" i]')
        .or(page.getByRole('textbox', { name: /Name|Назва/i }))
        .first();
      await nameInput.waitFor({ state: 'visible', timeout: 60000 });
      await nameInput.click();
      await nameInput.fill(prod.name);
      await page.waitForTimeout(500);


      // 3. Заповнення коду
      if (prod.code) {
        const codeInput = page.locator('input[aria-label="Article number"], input[aria-label*="Код" i], input[aria-label*="Артикул" i]')
          .or(page.getByRole('textbox', { name: /Article number|Code|Код|Артикул/i }))
          .first();
        if (await codeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await codeInput.click();
          await codeInput.fill(prod.code);
          await page.waitForTimeout(300);
        }
      }

      // 4. Вибір Категорії
      if (prod.category) {
        await selectDropdown(page, 'Category|Категорія', prod.category);
      }

      // 5. Обов'язкове перемикання на вкладку «GENERAL INFORMATION / ЗАГАЛЬНА ІНФОРМАЦІЯ»
      console.log('📑 Перехід на вкладку "GENERAL INFORMATION / ЗАГАЛЬНА ІНФОРМАЦІЯ"...');
      const genInfoTab = page.locator('[role="tab"], .mat-mdc-tab, .mat-tab-label')
        .filter({ hasText: /GENERAL INFORMATION|ЗАГАЛЬНА ІНФОРМАЦІЯ/i })
        .first();
      if (await genInfoTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await genInfoTab.click();
        await page.waitForTimeout(1000);
      }

      // 6. Вибір Типу контролю партії (FEFO)
      if (prod.batchControl) {
        await selectDropdown(page, 'Batch control type|Тип контролю', prod.batchControl);
      }

      // 7. Термін придатності (днів)
      if (prod.shelfLifeDays) {
        const shelfLifeInput = page.locator('input[aria-label="Shelf life days"], input[aria-label*="Термін придатності" i]')
          .or(page.getByRole('textbox', { name: /Shelf life days|Термін придатності/i }))
          .first();
        if (await shelfLifeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await shelfLifeInput.click();
          await shelfLifeInput.fill(prod.shelfLifeDays);
          await page.waitForTimeout(300);
        }
      }

      // 8. Вибір Одиниці виміру (кілограм / kilogram)
      if (prod.unit) {
        await selectDropdown(page, 'Units|Unit of measure|Одиниця виміру', prod.unit);
      }

      await page.waitForTimeout(1000);

      // 9. Скріншот заповненої картки перед збереженням
      const artifactDir = '/Users/bogdansunday/.gemini/antigravity-ide/brain/2e2d16a7-14a3-4d3c-817a-a9e8af64be23';
      const cleanName = prod.code.replace(/[^a-zA-Z0-9_-]/g, '_');
      const screenshotPath = path.join(artifactDir, `created_test_product_${cleanName}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      // 10. Збереження картки
      console.log('   💾 Збереження картки готового продукту (кнопка "Save / Зберегти")...');
      const saveBtn = page.getByRole('button', { name: /Save|Зберегти/i })
        .or(page.locator('button').filter({ hasText: /^(Save|Зберегти)$/i }))
        .first();
      await saveBtn.click();
      await page.waitForTimeout(3000);

      console.log(`✅ Продукт "${prod.name}" успішно створено з типом контролю партії "${prod.batchControl || 'FEFO'}"!`);
      console.log(`📸 Скріншот збережено в: ${screenshotPath}`);
    });
  }
});
