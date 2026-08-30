import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class WorkShiftPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    console.log('📌 Перехід у розділ "Зміни"...');
    await this.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenWorkShift_ListPage', 'Зміни');
    await this.waitForPageLoaded();
  }

  async clickAddWorkShift() {
    console.log('📌 Натискання кнопки додавання нової зміни...');
    const addBtn = this.page.getByRole('button', { name: 'Новий', exact: true })
      .or(this.page.locator('#AddButton button, #AddButton, button[title*="Новий"]'))
      .first();
    await addBtn.waitFor({ state: 'visible', timeout: 15000 });
    await addBtn.click();
    await this.waitForPageLoaded();
  }
}
