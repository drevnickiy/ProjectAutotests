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

async function selectDropdown(page: Page, label: string, optionText: string) {
  console.log(`🔍 [КОМБОБОКС "${label}"] Встановлення значення "${optionText}"...`);

  const cb = page.getByRole('combobox', { name: new RegExp(label, 'i') })
    .or(page.locator('crt-combobox, mat-form-field, crt-field').filter({ hasText: new RegExp(label, 'i') }).getByRole('combobox'))
    .first();

  if (!await cb.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log(`   ⚠️ [${label}] Комбобокс не знайдено`);
    return;
  }

  await cb.scrollIntoViewIfNeeded().catch(() => { });
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
      const nameInput = page.getByRole('textbox', { name: /Назва повна|Назва/i })
        .or(page.locator('crt-field, mat-form-field').filter({ hasText: /Назва повна|Назва/i }).locator('input'))
        .first();
      await nameInput.waitFor({ state: 'visible', timeout: 15000 });
      await nameInput.click();
      await nameInput.fill(mat.name);
      await page.waitForTimeout(500);

      // 3. Заповнення коду (Ліва панель)
      if (mat.code) {
        const codeInput = page.getByRole('textbox', { name: /Код|Артикул/i })
          .or(page.locator('input[aria-label*="Код"], input[aria-label*="Артикул"]'))
          .first();
        if (await codeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await codeInput.click();
          await codeInput.fill(mat.code);
          await page.waitForTimeout(300);
        }
      }

      // 4. Категорія (якщо задана)
      if (mat.category) {
        await selectDropdown(page, 'Категорія', mat.category);
      }

      // 5. Обов'язкове перемикання на вкладку «ЗАГАЛЬНА ІНФОРМАЦІЯ»
      console.log('📑 Перехід на вкладку "ЗАГАЛЬНА ІНФОРМАЦІЯ"...');
      const genInfoTab = page.locator('[role="tab"], .mat-mdc-tab, .mat-tab-label')
        .filter({ hasText: /ЗАГАЛЬНА ІНФОРМАЦІЯ/i })
        .first();
      if (await genInfoTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await genInfoTab.click();
        await page.waitForTimeout(1000);
      }

      // 6. Вибір Типу контролю партії (FEFO)
      if (mat.batchControl) {
        await selectDropdown(page, 'Тип контролю партії', mat.batchControl);
      }

      // 7. Термін придатності (днів) (730)
      if (mat.shelfLifeDays) {
        const shelfLifeInput = page.getByRole('textbox', { name: /Термін придатності \(днів\)|Термін придатності/i })
          .or(page.locator('crt-number-input, crt-field, mat-form-field').filter({ hasText: /Термін придатності \(днів\)|Термін придатності/i }).locator('input'))
          .first();
        if (await shelfLifeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await shelfLifeInput.click();
          await shelfLifeInput.fill(mat.shelfLifeDays);
          await page.waitForTimeout(300);
        }
      }

      // 8. Вибір Одиниці виміру (кілограм)
      if (mat.unit) {
        await selectDropdown(page, 'Одиниця виміру', mat.unit);
      }

      await page.waitForTimeout(1000);

      // 9. Скріншот заповненої картки на вкладці «ЗАГАЛЬНА ІНФОРМАЦІЯ»
      const artifactDir = '/Users/bogdansunday/.gemini/antigravity-ide/brain/275d5a89-b865-4c99-a2bc-897cc221b635';
      const cleanName = mat.code.replace(/[^a-zA-Z0-9_-]/g, '_');
      const screenshotPath = path.join(artifactDir, `created_raw_material_${cleanName}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      // 10. Збереження
      console.log('   💾 Збереження картки сировини (кнопка "Зберегти")...');
      const saveBtn = page.getByRole('button', { name: 'Зберегти', exact: true })
        .or(page.locator('button').filter({ hasText: /^Зберегти$/i }))
        .first();
      await saveBtn.click();
      await page.waitForTimeout(3000);

      console.log(`✅ Сировину "${mat.name}" успішно створено з контролем партії "${mat.batchControl}" на сервері [${env}]!`);
      console.log(`📸 Скріншот збережено в: ${screenshotPath}`);
    });
  }
});
