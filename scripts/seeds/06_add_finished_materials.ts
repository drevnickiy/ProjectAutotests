import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { GenProductionRoutingPage } from '../../src/pages/GenProductionRoutingPage';
import fs from 'fs';
import path from 'path';

interface MaterialItem {
  materialName: string;
  unit: string;
  rate: string;
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
  const dataPath = path.resolve(__dirname, '../data/finished_materials.json');
  const items: FinishedMaterialConfig[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    routingPage = new GenProductionRoutingPage(page);
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
        if (config.productUrl) {
          await loginPage.open(config.productUrl);
        } else {
          await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/Products_ListPage');
          await loginPage.login();
          await page.waitForLoadState('domcontentloaded');
          await page.waitForTimeout(3000);

          const prefix = config.productName.split(' ')[0] || config.productName;
          console.log(`🔍 Пошук продукту за префіксом "${prefix}"...`);

          const prodRow = page.locator('[role="gridcell"] a, .crt-link, [role="row"] a')
            .filter({ hasText: prefix })
            .first();
          await prodRow.waitFor({ state: 'visible', timeout: 15000 });
          await prodRow.click();
        }

        await loginPage.login();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);

        // Перехід на вкладку "ТЕХНОЛОГІЧНА КАРТА"
        const routingTab = page.locator('[role="tab"], .mat-tab-label, .mat-mdc-tab')
          .filter({ hasText: /^ТЕХНОЛОГІЧНА КАРТА$/i })
          .first();
        await routingTab.waitFor({ state: 'visible', timeout: 15000 });
        await routingTab.click();
        await page.waitForTimeout(2000);

        const existingRouting = page.locator('crt-expansion-panel').filter({ hasText: /Технологічна карта/i })
          .locator('a, [role="gridcell"] a, .crt-link')
          .first();
        await existingRouting.waitFor({ state: 'visible', timeout: 10000 });
        await existingRouting.click();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);
      }

      // Перехід на вкладку "ЗАГАЛЬНА ІНФОРМАЦІЯ"
      console.log(`[Test] Перехід на вкладку "ЗАГАЛЬНА ІНФОРМАЦІЯ"...`);
      await routingPage.switchToTab('ЗАГАЛЬНА ІНФОРМАЦІЯ');
      await page.waitForTimeout(2000);

      // Додавання кожної позиції сировини / НФ
      for (const mat of config.materials) {
        console.log(`[Test] Додавання сировини "${mat.materialName}" (${mat.rate} ${mat.unit})${mat.comment ? ` [${mat.comment}]` : ''}...`);
        await routingPage.addRawMaterial(mat.materialName, mat.unit, mat.rate);
      }

      // Скріншот таблиці сировини
      const artifactDir = '/Users/bogdansunday/.gemini/antigravity-ide/brain/275d5a89-b865-4c99-a2bc-897cc221b635';
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
