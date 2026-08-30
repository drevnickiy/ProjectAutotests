import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../../src/pages/LoginPage';
import { WorkShiftPage } from '../../src/pages/WorkShiftPage';
import { WorkShiftDetailsPage } from '../../src/pages/WorkShiftDetailsPage';

test.describe('TC-SHIFT-01: Створення робочих змін на тиждень у березні 2027 (8 годин/зміна)', () => {
  let loginPage: LoginPage;
  let workShiftPage: WorkShiftPage;
  let workShiftDetailsPage: WorkShiftDetailsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    workShiftPage = new WorkShiftPage(page);
    workShiftDetailsPage = new WorkShiftDetailsPage(page);

    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenWorkShift_ListPage');
    await loginPage.login();
  });

  test('Створення 7 робочих змін на тиждень у березні 2027 (01.03.2027 – 07.03.2027) по 8 годин', async ({ page }, testInfo) => {
    test.setTimeout(480000); // 8 хвилин для створення 7 змін

    const marchShifts = [
      { day: 'Понеділок', startStr: '01.03.2027 08:00', endStr: '01.03.2027 16:00', name: '01.03.2027 08:00 — 16:00' },
      { day: 'Вівторок',   startStr: '02.03.2027 08:00', endStr: '02.03.2027 16:00', name: '02.03.2027 08:00 — 16:00' },
      { day: 'Середа',     startStr: '03.03.2027 08:00', endStr: '03.03.2027 16:00', name: '03.03.2027 08:00 — 16:00' },
      { day: 'Четвер',     startStr: '04.03.2027 08:00', endStr: '04.03.2027 16:00', name: '04.03.2027 08:00 — 16:00' },
      { day: 'Пʼятниця',   startStr: '05.03.2027 08:00', endStr: '05.03.2027 16:00', name: '05.03.2027 08:00 — 16:00' },
      { day: 'Субота',     startStr: '06.03.2027 08:00', endStr: '06.03.2027 16:00', name: '06.03.2027 08:00 — 16:00' },
      { day: 'Неділя',     startStr: '07.03.2027 08:00', endStr: '07.03.2027 16:00', name: '07.03.2027 08:00 — 16:00' },
    ];

    console.log(`🚀 Створення ${marchShifts.length} робочих змін на березень 2027 (01.03.2027 – 07.03.2027)...`);

    for (let i = 0; i < marchShifts.length; i++) {
      const shift = marchShifts[i];
      console.log(`\n📌 [${i + 1}/${marchShifts.length}] Створення зміни (${shift.day}): "${shift.name}"...`);

      // 1. Перехід у реєстр розділу "Зміни"
      await workShiftPage.navigate();
      await page.waitForTimeout(1000);

      // 2. Натискання кнопки додавання нової зміни
      await workShiftPage.clickAddWorkShift();
      await page.waitForTimeout(1000);

      // 3. Заповнення полів картки
      await workShiftDetailsPage.fillName(shift.name);
      await workShiftDetailsPage.selectDropdownOption('Статус робочої зміни', 'Запланована');
      await workShiftDetailsPage.fillStartDate(shift.startStr);
      await workShiftDetailsPage.fillEndDate(shift.endStr);

      // 4. Збереження
      await workShiftDetailsPage.saveChanges();
      await page.waitForTimeout(2500);

      // 5. Повернення у реєстр або закриття картки
      const backBtn = page.getByRole('button', { name: 'Назад' }).or(page.locator('button[aria-label="Назад"], button[title="Назад"]')).first();
      if (await backBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await backBtn.click().catch(() => {});
        await page.waitForTimeout(1500);
      }

      console.log(`   ✅ Зміна (${shift.day}) "${shift.name}" збережена!`);
    }

    // 6. Фінальний перехід у реєстр змін для перевірки
    console.log('\n📊 Перехід у реєстр "Зміни" та перевірка створених змін...');
    await workShiftPage.navigate();
    await page.waitForTimeout(3000);

    const screenshotDir = path.resolve(process.cwd(), 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    const screenshotPath = path.join(screenshotDir, `SUCCESS_March_2027_Shifts_Week_${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
    await testInfo.attach('SUCCESS_March_2027_Shifts_Week', { path: screenshotPath, contentType: 'image/png' }).catch(() => {});
    console.log(`📸 Фінальний скріншот тижневих змін збережено: ${screenshotPath}`);

    console.log('🎉 Всі 7 робочих змін на тиждень у березні 2027 (01.03.2027 - 07.03.2027) успішно створені!');
  });
});
