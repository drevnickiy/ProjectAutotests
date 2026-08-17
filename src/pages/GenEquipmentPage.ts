import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class GenEquipmentPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Переход в раздел Обладнання (ListPage)
   */
  async openListPage(): Promise<void> {
    await this.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenEquipment_ListPage');
    await this.waitForCardLoaded('Назва');
  }

  /**
   * Переход на страницу добавления Обладнання (FormPage/add)
   */
  async openAddCard(): Promise<void> {
    await this.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenEquipment_FormPage/add');
    await this.waitForCardLoaded('Назва');
  }
}
