import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductsCategoriesPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async openFinishedProductCard(): Promise<void> {
    await this.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/Products_FormPage/edit/2940574c-0d4f-45f0-a58d-361aefcf9f1d');
  }

  async openWasteProductCard(): Promise<void> {
    await this.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/Products_FormPage/edit/b755bc22-e25a-48bd-8636-fceeb10f37c1');
  }

  async openSemiFinishedProductCard(): Promise<void> {
    await this.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/Products_FormPage/edit/68c07a2d-6de3-4609-a220-c9289d636bd5');
  }
}
