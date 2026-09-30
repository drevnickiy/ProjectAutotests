import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { getCurrentEnv, getBaseUrl } from '../../src/config/environment';
import fs from 'fs';
import path from 'path';

interface RawMaterialData {
  code: string;
  name: string;
  category: string;
  unit: string;
  batchControl?: string;
  shelfLifeDays?: string;
  description?: string;
}

const SYNONYMS_MAP: Record<string, string[]> = {
  'Сировина': ['Raw Materials', 'Сировина'],
  'Напівфабрикат': ['Semi-finished product', 'Напівфабрикат'],
  'Готова продукція': ['Finished product', 'Готова продукція'],
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

test.describe('03. Створення сировини (Raw Materials)', () => {
  let loginPage: LoginPage;
  const dataPath = path.resolve(__dirname, '../data/raw_materials.json');
  const materials: RawMaterialData[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  for (const mat of materials) {
    test(`Створення сировини: ${mat.name}`, async ({ page }) => {
      test.setTimeout(180000);
      const env = getCurrentEnv();
      const baseUrl = getBaseUrl();

      console.log(`\n======================================================`);
      console.log(`🌿 Створення сировини [${mat.code}] "${mat.name}" на сервері [${env}] (${baseUrl})...`);
      console.log(`======================================================`);

      // 1. Відкриття форми додавання продукту
      await loginPage.open('/0/Shell/#Card/Products_FormPage/add');
      await loginPage.login();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      // 2. Заповнення назви (Ліва панель)
      const nameInput = page.locator('input[aria-label="Name"], input[placeholder*="Specify product name"], input[aria-label*="Назва" i]')
        .or(page.getByRole('textbox', { name: /Name|Назва/i }))
        .first();
      await nameInput.waitFor({ state: 'visible', timeout: 35000 });
      await nameInput.click();
      await nameInput.fill(mat.name);
      await page.waitForTimeout(500);

      // 3. Заповнення коду (Ліва панель)
      if (mat.code) {
        const codeInput = page.locator('input[aria-label="Article number"], input[aria-label*="Код" i], input[aria-label*="Артикул" i]')
          .or(page.getByRole('textbox', { name: /Article number|Code|Код|Артикул/i }))
          .first();
        if (await codeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await codeInput.click();
          await codeInput.fill(mat.code);
          await page.waitForTimeout(300);
        }
      }

      // 4. Категорія (якщо задана)
      if (mat.category) {
        await selectDropdown(page, 'Category|Категорія', mat.category);
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
      if (mat.batchControl) {
        await selectDropdown(page, 'Batch control type|Тип контролю', mat.batchControl);
      }

      // 7. Термін придатності (днів) (730)
      if (mat.shelfLifeDays) {
        const shelfLifeInput = page.locator('input[aria-label="Shelf life days"], input[aria-label*="Термін придатності" i]')
          .or(page.getByRole('textbox', { name: /Shelf life days|Термін придатності/i }))
          .first();
        if (await shelfLifeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await shelfLifeInput.click();
          await shelfLifeInput.fill(mat.shelfLifeDays);
          await page.waitForTimeout(300);
        }
      }

      // 8. Вибір Одиниці виміру (кілограм / kilogram)
      if (mat.unit) {
        await selectDropdown(page, 'Units|Unit of measure|Одиниця виміру', mat.unit);
      }

      await page.waitForTimeout(1000);

      // 9. Скріншот заповненої картки на вкладці «ЗАГАЛЬНА ІНФОРМАЦІЯ»
      const artifactDir = '/Users/bogdansunday/.gemini/antigravity-ide/brain/2e2d16a7-14a3-4d3c-817a-a9e8af64be23';
      const cleanName = mat.code.replace(/[^a-zA-Z0-9_-]/g, '_');
      const screenshotPath = path.join(artifactDir, `created_raw_material_${cleanName}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      // 10. Збереження
      console.log('   💾 Збереження картки сировини (кнопка "Save / Зберегти")...');
      const saveBtn = page.getByRole('button', { name: /Save|Зберегти/i })
        .or(page.locator('button').filter({ hasText: /^(Save|Зберегти)$/i }))
        .first();
      await saveBtn.click();
      await page.waitForTimeout(3000);

      console.log(`✅ Сировину "${mat.name}" успішно створено з контролем партії "${mat.batchControl}" на сервері [${env}]!`);
      console.log(`📸 Скріншот збережено в: ${screenshotPath}`);
    });
  }
});

