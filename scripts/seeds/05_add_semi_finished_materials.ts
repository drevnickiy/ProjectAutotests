import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { ProductMaterialsPage, ProductMaterialItem } from '../../src/pages/ProductMaterialsPage';
import { GenProductionRoutingPage } from '../../src/pages/GenProductionRoutingPage';
import fs from 'fs';
import path from 'path';

interface SemiMaterialConfig {
  productName?: string;
  routingName: string;
  routingUrl?: string;
  productUrl?: string;
  materials: ProductMaterialItem[];
}

test.describe('05. Додавання сировини для напівфабрикатів (Semi-finished Materials)', () => {
  let loginPage: LoginPage;
  let materialsPage: ProductMaterialsPage;
  let routingPage: GenProductionRoutingPage;
  const dataPath = path.resolve(__dirname, '../data/semi_finished_materials.json');
  const items: SemiMaterialConfig[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    materialsPage = new ProductMaterialsPage(page);
    routingPage = new GenProductionRoutingPage(page);
  });

  for (const config of items) {
    test(`Наповнення сировини: ${config.routingName}`, async ({ page }) => {
      test.setTimeout(600000);
      console.log(`\n🧪 Додавання сировини у техкарту напівфабрикату: ${config.routingName}`);

      if (config.routingUrl) {
        await loginPage.open(config.routingUrl);
        await loginPage.login();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);
      } else {
        await loginPage.open('/0/Shell/#Section/GenProductionRouting_ListPage');
        await loginPage.login();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);

        const discardBtn = page.locator('button').filter({ hasText: /Не зберігати|Discard/i }).first();
        if (await discardBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await discardBtn.click({ force: true }).catch(() => {});
          await page.waitForTimeout(1000);
        }

        const searchInput = page.locator('crt-search-input input, input[placeholder*="Пошук"], input[aria-label*="Пошук"]').first();
        if (await searchInput.isVisible({ timeout: 4000 }).catch(() => false)) {
          await searchInput.fill(config.routingName);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(2500);
        }

        const row = page.locator('[role="gridcell"] a, .crt-link, [role="row"] a')
          .filter({ hasText: config.routingName.slice(0, 30) })
          .first();
        await row.waitFor({ state: 'visible', timeout: 20000 });
        await row.click();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);
      }

      // Перехід на вкладку "ЗАГАЛЬНА ІНФОРМАЦІЯ"
      console.log(`[Test] Перехід на вкладку "ЗАГАЛЬНА ІНФОРМАЦІЯ"...`);
      const generalTab = page.getByRole('tab', { name: /ЗАГАЛЬНА ІНФОРМАЦІЯ/i })
        .or(page.locator('[role="tab"]').filter({ hasText: /ЗАГАЛЬНА ІНФОРМАЦІЯ/i }))
        .or(page.locator('.mat-mdc-tab').filter({ hasText: /ЗАГАЛЬНА ІНФОРМАЦІЯ/i }))
        .first();
      await generalTab.click({ force: true });
      await page.waitForTimeout(2000);

      // Додавання кожної позиції сировини через спеціальний ProductMaterialsPage
      for (const mat of config.materials) {
        try {
          console.log(`[Test] Додавання сировини "${mat.materialName}" (${mat.rate} ${mat.unit || 'кг'})...`);
          await materialsPage.addMaterial(mat);
        } catch (e: any) {
          const errShot = `test-results/raw_material_fail_${Date.now()}.png`;
          await page.screenshot({ path: errShot, fullPage: false }).catch(() => { });
          console.error(`❌ [ERROR] Не вдалося додати сировину "${mat.materialName}": ${e.message}`);
          console.error(`📸 Скріншот помилки збережено в: ${errShot}`);
          throw e;
        }
      }

      // Скріншот таблиці сировини
      const artifactDir = '/Users/bogdansunday/.gemini/antigravity-ide/brain/2e2d16a7-14a3-4d3c-817a-a9e8af64be23';
      const cleanName = config.routingName.replace(/[^a-zA-Z0-9А-Яа-яіІїЇєЄ_-]/g, '_');
      const screenshotPath = path.join(artifactDir, `materials_semi_${cleanName}.png`);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`📸 Скріншот сировини збережено в: ${screenshotPath}`);

      // Фінальне збереження картки
      console.log(`[Test] Фінальне збереження картки...`);
      await routingPage.saveCard();
      console.log(`🎉 Сировину для "${config.routingName}" успішно збережено!`);
    });
  }
});

