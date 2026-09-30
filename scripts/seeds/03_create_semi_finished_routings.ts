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
        await page.locator('crt-app-header, .crt-header, mat-toolbar, .user-profile, crt-tab-header, .mat-mdc-tab-header').first().waitFor({ state: 'visible', timeout: 45000 }).catch(() => { });
        await page.waitForTimeout(3000);
      } else if (config.productName) {
        // Відкриваємо розділ Продукти та знаходимо потрібний напівфабрикат
        await loginPage.open('/0/Shell/#Section/Products_ListPage');
        await loginPage.login();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);

        const searchTerm = config.productName.includes('|') ? config.productName.split('|')[1].trim() : config.productName;
        console.log(`🔍 Пошук напівфабрикату за назвою/кодом "${searchTerm}"...`);

        const searchInput = page.locator('crt-search-input input, input[placeholder*="Пошук"], input[aria-label*="Пошук"]').first();
        if (await searchInput.isVisible({ timeout: 4000 }).catch(() => false)) {
          await searchInput.fill(searchTerm);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(2500);
        }

        const prodRow = page.locator('[role="gridcell"] a, .crt-link, [role="row"] a')
          .filter({ hasText: searchTerm })
          .first();

        await prodRow.waitFor({ state: 'visible', timeout: 25000 });
        await prodRow.click();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);
      }

      // 2. Перехід на вкладку «ТЕХНОЛОГІЧНА КАРТА / PROCESS SHEET»
      console.log(`[Test] Перехід на вкладку "ТЕХНОЛОГІЧНА КАРТА / PROCESS SHEET"...`);
      const routingTab = page.getByRole('tab', { name: /PROCESS SHEET|ТЕХНОЛОГІЧНА КАРТА/i }).first()
        .or(page.locator('[role="tab"]').filter({ hasText: /PROCESS SHEET|ТЕХНОЛОГІЧНА КАРТА/i }).first());

      await routingTab.waitFor({ state: 'visible', timeout: 45000 });
      await routingTab.scrollIntoViewIfNeeded().catch(() => { });
      await routingTab.click();
      await page.waitForTimeout(3000);

      // 3. Відкриваємо або створюємо ТК
      const panel = page.locator('crt-expansion-panel, [role="tabpanel"]').filter({ hasText: /Process sheet|Технологічна карта/i }).first()
        .or(page.locator('crt-expansion-panel').first());
      const existingRouting = panel
        .locator('a, [role="gridcell"] a, .crt-link')
        .filter({ hasText: config.id || config.name.slice(0, 15) })
        .first();

      const exists = await existingRouting.isVisible({ timeout: 3000 }).catch(() => false);

      if (exists) {
        const linkText = (await existingRouting.innerText().catch(() => '')).trim();
        console.log(`[Test] Відкриваємо існуючу ТК "${linkText}"...`);
        await existingRouting.click();
      } else {
        console.log(`[Test] Клік по кнопці створення ТК у секції "Технологічна карта / Process Sheet"...`);
        const addBtn = page.getByRole('button', { name: 'Новий', exact: true })
          .or(page.locator('crt-expansion-panel').filter({ hasText: /Process sheet|Технологічна карта/i }).getByRole('button', { name: 'New', exact: true }))
          .first();

        await addBtn.waitFor({ state: 'visible', timeout: 15000 });
        await addBtn.click();

        // Очікуємо переходу на сторінку створення ТК (GenProductionRouting_FormPage)
        await page.waitForURL(/.*GenProductionRouting_FormPage.*/, { timeout: 35000 }).catch(() => {});
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2500);

        // Вводимо назву ТК
        const nameInput = page.locator('input[aria-label="Name"], input[aria-label="Назва"]')
          .or(page.getByRole('textbox', { name: /Name|Назва/i }))
          .first();
        await nameInput.waitFor({ state: 'visible', timeout: 35000 });
        await nameInput.click();
        await nameInput.fill(config.name);
        await page.waitForTimeout(500);
      }


      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      // 3.1 Встановлення обов'язкових полів: Статус = "В роботі", Дати дії від дати створення на 1 рік
      await routingPage.setStatus('В роботі');
      await routingPage.setValidityDates();

      // 4. Перехід на вкладку "Етапи та завдання"
      console.log(`[Test] Перехід на вкладку "Етапи та завдання"...`);
      await routingPage.switchToTab('Етапи та завдання');
      await page.waitForTimeout(2000);

      // 5. Додавання типових етапів
      for (const stage of config.stages) {
        try {
          console.log(`[Test] Створення етапу: ${stage.name}...`);
          await routingPage.addStage(stage);
        } catch (e: any) {
          console.log(`⚠️ Не вдалося створити етап ${stage.name}: ${e.message}.`);
          throw e;
        }
      }

      // 6. Додавання типових завдань на Реакторах (Rule 6)
      for (const task of config.tasks) {
        try {
          console.log(`[Test] Створення завдання: ${task.name} (${task.taskType || 'Виробниче завдання'}, ${task.equipmentType || 'Реактори'}, ${task.duration || task.hours || ''})...`);
          await routingPage.addTask(task);
        } catch (e: any) {
          const errShot = `test-results/task_fail_${task.orderInStage}_${Date.now()}.png`;
          await page.screenshot({ path: errShot, fullPage: false }).catch(() => { });
          console.error(`❌ [ERROR] Не вдалося зберегти завдання "${task.name}": ${e.message}`);
          console.error(`📸 Скріншот помилки збережено в: ${errShot}`);
          throw e;
        }
      }

      // 6.1 Взаємне зв'язування завдань (закоментовано за вказівкою користувача)
      /*
      const tasksWithLinks = config.tasks.filter((t: any) => t.linkedTask);
      for (const t of tasksWithLinks) {
        try {
          await routingPage.linkTask(t.name, t.linkedTask);
        } catch (e: any) {
          console.log(`   ⚠️ Зв'язування "${t.name}" ➔ "${t.linkedTask}" пропущено або вже встановлено: ${e.message}`);
        }
      }
      */

      // Скріншот перед фінальним збереженням (всі етапи та завдання видно)
      const artifactDir = '/Users/bogdansunday/.gemini/antigravity-ide/brain/2e2d16a7-14a3-4d3c-817a-a9e8af64be23';
      const screenshotPath = path.join(artifactDir, `created_routing_${config.id}.png`);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`📸 Скріншот техкарти збережено в: ${screenshotPath}`);

      // 7. Фінальне збереження картки
      console.log(`[Test] Фінальне збереження картки...`);
      await routingPage.setStatus('В роботі');
      await routingPage.setValidityDates();
      await routingPage.saveCard();

      console.log(`🎉 Техкарту напівфабрикату "${config.name}" успішно створено та збережено!`);
    });
  }
});
