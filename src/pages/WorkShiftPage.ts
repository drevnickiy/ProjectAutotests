import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { getShellUrl } from '../config/environment';

export class WorkShiftPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    console.log('📌 Перехід у розділ "Зміни"...');
    await this.open(getShellUrl('#Section/GenWorkShift_ListPage'));
    await this.waitForCreatioReady();
  }

  async clickAddWorkShift() {
    console.log('📌 Натискання кнопки додавання нової зміни...');
    const addBtn = this.page.getByRole('button', { name: 'Новий', exact: true })
      .or(this.page.locator('#AddButton button, #AddButton, button[title*="Новий"], button:has-text("Додати")'))
      .first();
    await addBtn.waitFor({ state: 'visible', timeout: 15000 });
    await addBtn.click();
    await this.waitForCreatioReady();
  }
}
