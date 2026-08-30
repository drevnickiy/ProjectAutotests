import { test } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { GenPlanFinishProductPage } from '../../src/pages/GenPlanFinishProductPage';

test.describe('Планування готової продукції (ПГП / GenPlanFinishProduct)', () => {
  let planFinishPage: GenPlanFinishProductPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    planFinishPage = new GenPlanFinishProductPage(page);

    // Авторизация и передача токена/сессии
    await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenPlanFinishProduct_ListPage');
    await loginPage.login();
  });

  test('1. Проверка колонок реестра GenPlanFinishProduct_ListPage', async () => {
    await planFinishPage.verifyAllColumnsExist();
  });

  test('2. Проверка открытия и полей модального окна добавления ПГП', async () => {
    await planFinishPage.clickAddButton();
    await planFinishPage.verifyModalFields();
  });
});
