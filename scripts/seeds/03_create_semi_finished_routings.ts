import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { GenProductionRoutingPage, StageData, TaskData } from '../../src/pages/GenProductionRoutingPage';
import fs from 'fs';
import path from 'path';

interface SemiRoutingConfig {
  id: string;
  name: string;
  productName: string;
  productUrl?: string;
  routingUrl?: string;
  stages: StageData[];
  tasks: TaskData[];
}

test.describe('03. Створення техкарт для напівфабрикатів (Semi-finished Routings)', () => {
  let loginPage: LoginPage;
  let routingPage: GenProductionRoutingPage;
  const dataPath = path.resolve(__dirname, '../data/semi_finished_routings.json');
  const routings: SemiRoutingConfig[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    routingPage = new GenProductionRoutingPage(page);
  });

  for (const config of routings) {
    test(`Створення техкарти напівфабрикату: ${config.name}`, async ({ page }) => {
      test.setTimeout(360000);
      console.log(`\n======================================================`);
      console.log(`📌 Створення техкарти: ${config.name}`);
      console.log(`🧪 Продукт: ${config.productName}`);
      console.log(`======================================================`);

      if (config.productUrl) {
        await loginPage.open(config.productUrl);
        await loginPage.login();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);
      } else if (config.productName) {
        // Відкриваємо розділ Продукти та знаходимо потрібний напівфабрикат
        await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/Products_ListPage');
        await loginPage.login();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);

        const prefix = config.productName.split(' ')[0] || config.productName;
        console.log(`🔍 Пошук напівфабрикату за префіксом "${prefix}"...`);

        const prodRow = page.locator('[role="gridcell"] a, .crt-link, [role="row"] a')
          .filter({ hasText: prefix })
          .first();

        await prodRow.waitFor({ state: 'visible', timeout: 15000 });
        await prodRow.click();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);
      }

      // 2. Перехід на вкладку "ТЕХНОЛОГІЧНА КАРТА"
      console.log(`[Test] Перехід на вкладку "ТЕХНОЛОГІЧНА КАРТА"...`);
      const routingTab = page.locator('[role="tab"], .mat-tab-label, .mat-mdc-tab')
        .filter({ hasText: /^ТЕХНОЛОГІЧНА КАРТА$/i })
        .first();

      await routingTab.waitFor({ state: 'visible', timeout: 15000 });
      await routingTab.click();
      await page.waitForTimeout(2000);

      // 3. Відкриваємо або створюємо ТК
      const existingRouting = page.locator('crt-expansion-panel').filter({ hasText: /Технологічна карта/i })
        .locator('a, [role="gridcell"] a, .crt-link')
        .filter({ hasText: /ТК-|TK-/i })
        .first();

      const exists = await existingRouting.isVisible({ timeout: 3000 }).catch(() => false);

      if (exists) {
        const linkText = (await existingRouting.innerText().catch(() => '')).trim();
        console.log(`[Test] Відкриваємо існуючу ТК "${linkText}"...`);
        await existingRouting.click();
      } else {
        console.log(`[Test] Клік по кнопці створення ТК у секції "Технологічна карта"...`);
        const addBtn = page.locator('crt-expansion-panel').filter({ hasText: /Технологічна карта/i })
          .locator('crt-button[icon="add"] button, [icon="add"] button, button[title*="Новий"], button[aria-label*="Новий"]')
          .first();

        await addBtn.waitFor({ state: 'visible', timeout: 10000 });
        await addBtn.click();
        await page.waitForTimeout(2500);

        // Вводимо назву ТК
        const nameInput = page.getByRole('textbox', { name: 'Назва' })
          .or(page.locator('input[aria-label="Назва"]'))
          .first();
        if (await nameInput.isVisible({ timeout: 4000 }).catch(() => false)) {
          await nameInput.click();
          await nameInput.fill(config.name);
          await page.waitForTimeout(300);
        }
      }

      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      // 4. Перехід на вкладку "Етапи та завдання"
      console.log(`[Test] Перехід на вкладку "Етапи та завдання"...`);
      await routingPage.switchToTab('Етапи та завдання');
      await page.waitForTimeout(2000);

      // 5. Додавання типових етапів
      for (const stage of config.stages) {
        console.log(`[Test] Створення етапу ${stage.number}: ${stage.name}...`);
        await routingPage.addStage(stage);
      }

      // 6. Додавання типових завдань на Реакторах (Rule 6)
      for (const task of config.tasks) {
        console.log(`[Test] Створення завдання: ${task.name} (${task.taskType}, ${task.equipmentType}, ${task.hours} год)...`);
        await routingPage.addTask(task);
      }

      // Скріншот перед фінальним збереженням (всі етапи та завдання видно)
      const artifactDir = '/Users/bogdansunday/.gemini/antigravity-ide/brain/275d5a89-b865-4c99-a2bc-897cc221b635';
      const screenshotPath = path.join(artifactDir, `created_routing_${config.id}.png`);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`📸 Скріншот техкарти збережено в: ${screenshotPath}`);

      // 7. Фінальне збереження картки
      console.log(`[Test] Фінальне збереження картки...`);
      await routingPage.saveCard();

      console.log(`🎉 Техкарту напівфабрикату "${config.name}" успішно створено та збережено!`);
    });
  }
});
