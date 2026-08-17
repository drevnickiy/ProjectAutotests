import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Переход в раздел Продукты (ListPage)
   */
  async openProductsListPage(): Promise<void> {
    await this.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/Products_ListPage');
    await this.waitForCardLoaded('Назва');
  }

  /**
   * Открытие модального окна создания Продукта (MiniPage)
   */
  async openProductsAddModal(): Promise<void> {
    await this.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/Products_ListPage[modal=Products_MiniPage/add]');
    await this.waitForCardLoaded('Назва');
  }
}
