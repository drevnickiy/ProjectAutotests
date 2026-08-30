import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { GenEquipmentPage, EquipmentData } from '../../src/pages/GenEquipmentPage';
import { getCurrentEnv, getBaseUrl } from '../../src/config/environment';
import fs from 'fs';
import path from 'path';

test.describe('00. Створення та калібрування обладнання (Equipment Seeding)', () => {
  let loginPage: LoginPage;
  let equipmentPage: GenEquipmentPage;

  const dataPath = path.resolve(__dirname, '../data/equipment.json');
  const equipmentList: EquipmentData[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    equipmentPage = new GenEquipmentPage(page);
  });

  for (const item of equipmentList) {
    test(`Створення обладнання: [${item.type}] ${item.name}`, async ({ page }) => {
      test.setTimeout(180000);
      const env = getCurrentEnv();
      const baseUrl = getBaseUrl();

      console.log(`\n======================================================`);
      console.log(`⚙️ Створення обладнання на сервері [${env}] (${baseUrl})`);
      console.log(`📌 Назва: ${item.name}`);
      console.log(`🏷️ Тип: ${item.type} | Лінія: ${item.line || 'Не вказана'}`);
      if (item.capacity) console.log(`🛢️ Потужність/Об'єм: ${item.capacity} кг | Час 95%: ${item.calibration95} год`);
      if (item.productivity) console.log(`⚡ Продуктивність: ${item.productivity} ${item.productivityUnit || 'шт/год'}`);
      console.log(`======================================================`);

      await loginPage.open();
      await loginPage.login();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      await equipmentPage.createEquipment(item);

      // Скріншот створеного обладнання
      const artifactDir = '/Users/bogdansunday/.gemini/antigravity-ide/brain/275d5a89-b865-4c99-a2bc-897cc221b635';
      const cleanName = item.name.replace(/[^a-zA-Z0-9А-Яа-яіІїЇєЄ_-]/g, '_').slice(0, 40);
      const screenshotPath = path.join(artifactDir, `created_equipment_${cleanName}.png`);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`📸 Скріншот обладнання збережено в: ${screenshotPath}`);

      console.log(`🎉 Обладнання "${item.name}" успішно створено та налаштовано на сервері [${env}]!`);
    });
  }
});
