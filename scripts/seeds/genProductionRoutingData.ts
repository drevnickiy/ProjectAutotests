import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { GenProductionRoutingPage } from '../../src/pages/GenProductionRoutingPage';

test.describe('Наповнення сировини у Техкарті за прямим посиланням', () => {
  let loginPage: LoginPage;
  let routingPage: GenProductionRoutingPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    routingPage = new GenProductionRoutingPage(page);
  });

  test('Додавання сировини у техкарту GP-503', async ({ page }) => {
    test.setTimeout(300000);

    const routingUrl = 'https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionRouting_FormPage/edit/745b920a-7b65-4c83-aa70-1a4bef282f32';
    console.log(`\n======================================================`);
    console.log(`📌 Відкриття техкарти за прямим посиланням: ${routingUrl}`);
    console.log(`======================================================`);

    await loginPage.open(routingUrl);
    await loginPage.login();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // 1. Перехід на вкладку "ЗАГАЛЬНА ІНФОРМАЦІЯ"
    console.log(`[Test] Перехід на вкладку "ЗАГАЛЬНА ІНФОРМАЦІЯ"...`);
    await routingPage.switchToTab('ЗАГАЛЬНА ІНФОРМАЦІЯ');
    await page.waitForTimeout(2000);

    // 2. Додавання сировини: Напівфабрикат
    console.log(`[Test] Додавання напівфабрикату "НФ-502 Гель-основа зволожуюча"...`);
    await routingPage.addRawMaterial('НФ-502 Гель-основа зволожуюча', 'кілограм', '0.14');

    // 3. Додавання сировини: Гліцерин
    console.log(`[Test] Додавання сировини "Гліцерин"...`);
    await routingPage.addRawMaterial('Гліцерин', 'кілограм', '0.01');

    // 4. Фінальне збереження
    console.log(`[Test] Фінальне збереження картки...`);
    await routingPage.saveCard();

    console.log(`🎉 Сировину успішно додано у техкарту!`);
  });
});
