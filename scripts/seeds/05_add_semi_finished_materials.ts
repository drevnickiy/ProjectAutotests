import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { GenProductionRoutingPage } from '../../src/pages/GenProductionRoutingPage';
import fs from 'fs';
import path from 'path';

interface MaterialItem {
  materialName: string;
  unit: string;
  rate: string;
}

interface SemiMaterialConfig {
  productName?: string;
  routingName: string;
  routingUrl?: string;
  productUrl?: string;
  materials: MaterialItem[];
}

test.describe('05. Додавання сировини для напівфабрикатів (Semi-finished Materials)', () => {
  let loginPage: LoginPage;
  let routingPage: GenProductionRoutingPage;
  const dataPath = path.resolve(__dirname, '../data/semi_finished_materials.json');
  const items: SemiMaterialConfig[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    routingPage = new GenProductionRoutingPage(page);
  });

  for (const config of items) {
    test(`Наповнення сировини: ${config.routingName}`, async ({ page }) => {
      test.setTimeout(300000);
      console.log(`\n🧪 Додавання сировини у техкарту напівфабрикату: ${config.routingName}`);

      if (config.routingUrl) {
        await loginPage.open(config.routingUrl);
        await loginPage.login();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);
      } else {
        // Відкриваємо розділ Технологічні карти напряму
        await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionRouting_ListPage');
        await loginPage.login();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);

        const prefix = config.routingName.split(' ')[0] || config.routingName;
        console.log(`🔍 Відкриття техкарти за назвою/префіксом "${prefix}"...`);

        const routingRow = page.locator('[role="gridcell"] a, .crt-link, [role="row"] a')
          .filter({ hasText: prefix })
          .first();

        if (await routingRow.isVisible({ timeout: 5000 }).catch(() => false)) {
          await routingRow.click();
        } else {
          // Якщо не знайдено за повним префіксом - шукаємо за кодом (наприклад NF-901)
          const codeMatch = config.routingName.match(/NF-\d+|НФ-\d+/i)?.[0] || prefix;
          const altRow = page.locator('[role="gridcell"] a, .crt-link, [role="row"] a')
            .filter({ hasText: codeMatch })
            .first();
          await altRow.waitFor({ state: 'visible', timeout: 10000 });
          await altRow.click();
        }

        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);
      }

      // Перехід на вкладку "ЗАГАЛЬНА ІНФОРМАЦІЯ"
      console.log(`[Test] Перехід на вкладку "ЗАГАЛЬНА ІНФОРМАЦІЯ"...`);
      await routingPage.switchToTab('ЗАГАЛЬНА ІНФОРМАЦІЯ');
      await page.waitForTimeout(2000);

      // Додавання кожної позиції сировини
      for (const mat of config.materials) {
        console.log(`[Test] Додавання сировини "${mat.materialName}" (${mat.rate} ${mat.unit})...`);
        await routingPage.addRawMaterial(mat.materialName, mat.unit, mat.rate);
      }

      // Скріншот таблиці сировини
      const artifactDir = '/Users/bogdansunday/.gemini/antigravity-ide/brain/275d5a89-b865-4c99-a2bc-897cc221b635';
      const cleanName = config.routingName.replace(/[^a-zA-Z0-9А-Яа-яіІїЇєЄ_-]/g, '_');
      const screenshotPath = path.join(artifactDir, `materials_semi_${cleanName}.png`);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`📸 Скріншот сировини збережено в: ${screenshotPath}`);

      // Збереження
      console.log(`[Test] Фінальне збереження картки...`);
      await routingPage.saveCard();
      console.log(`🎉 Сировину для "${config.routingName}" успішно збережено!`);
    });
  }
});
