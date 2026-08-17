import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class GenWarehouseDocumentPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Переход в раздел Складські операції (ListPage)
   */
  async openListPage(): Promise<void> {
    await this.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenWarehouseDocument_ListPage');
    await this.waitForCardLoaded('Номер');
  }

  /**
   * Переход на страницу добавления складского документа (FormPage/add)
   */
  async openAddCard(): Promise<void> {
    await this.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenWarehouseDocument_FormPage/add');
    await this.waitForCardLoaded('Номер документа');
  }
}
