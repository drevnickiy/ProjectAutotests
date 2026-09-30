import { test } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { GenProductionRoutingPage } from '../../src/pages/GenProductionRoutingPage';
import { ProductMaterialsPage } from '../../src/pages/ProductMaterialsPage';
import fs from 'fs';
import path from 'path';

interface MaterialItem {
  materialName: string;
  unit?: string;
  rate: string;
  stageName?: string;
  comment?: string;
}

interface FinishedMaterialConfig {
  productName: string;
  productUrl?: string;
  routingUrl?: string;
  materials: MaterialItem[];
}

test.describe('06. Додавання сировини та напівфабрикатів для готової продукції', () => {
  let loginPage: LoginPage;
  let routingPage: GenProductionRoutingPage;
  let productMaterialsPage: ProductMaterialsPage;
  const dataPath = path.resolve(__dirname, '../data/finished_materials.json');
  const items: FinishedMaterialConfig[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    routingPage = new GenProductionRoutingPage(page);
    productMaterialsPage = new ProductMaterialsPage(page);
  });

  for (const config of items) {
    test(`Наповнення сировини/НФ: ${config.productName}`, async ({ page }) => {
      test.setTimeout(300000);
      console.log(`\n======================================================`);
      console.log(`🌾 Додавання сировини для: ${config.productName}`);
      console.log(`======================================================`);

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

        const targetSearch = (config as any).routingName || config.productName;
        const searchInput = page.locator('crt-search-input input, input[placeholder*="Пошук"], input[aria-label*="Пошук"]').first();
        if (await searchInput.isVisible({ timeout: 4000 }).catch(() => false)) {
          await searchInput.fill(targetSearch);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(2500);
        }

        const row = page.locator('[role="gridcell"] a, .crt-link, [role="row"] a')
          .filter({ hasText: targetSearch.slice(0, 30) })
          .first();
        await row.waitFor({ state: 'visible', timeout: 20000 });
        await row.click();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);
      }

      // Перехід на вкладку "ЗАГАЛЬНА ІНФОРМАЦІЯ"
      console.log(`[Test] Перехід на вкладку "ЗАГАЛЬНА ІНФОРМАЦІЯ"...`);
      const generalTab = page.locator('[role="tab"], .mat-tab-label, .mat-mdc-tab, .mat-mdc-tab-header .mdc-tab, div')
        .filter({ hasText: /^ЗАГАЛЬНА ІНФОРМАЦІЯ$/i })
        .first();
      if (await generalTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await generalTab.click();
        await page.waitForTimeout(2000);
      }

      // Додавання кожної позиції сировини / НФ
      for (const mat of config.materials) {
        console.log(`[Test] Додавання матеріалу/НФ "${mat.materialName}" (${mat.rate} ${mat.unit || 'штук'})...`);
        await productMaterialsPage.addMaterial({
          materialName: mat.materialName,
          unit: mat.unit || 'штук',
          rate: mat.rate,
          stageName: mat.stageName || 'Фасування'
        });
      }

      // Скріншот таблиці сировини
      const artifactDir = '/Users/bogdansunday/.gemini/antigravity-ide/brain/2e2d16a7-14a3-4d3c-817a-a9e8af64be23';
      const cleanName = config.productName.replace(/[^a-zA-Z0-9А-Яа-яіІїЇєЄ_-]/g, '_');
      const screenshotPath = path.join(artifactDir, `materials_finished_${cleanName}.png`);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`📸 Скріншот сировини збережено в: ${screenshotPath}`);

      // Збереження
      console.log(`[Test] Фінальне збереження картки...`);
      await routingPage.saveCard();
      console.log(`🎉 Сировину для "${config.productName}" успішно збережено!`);
    });
  }
});
