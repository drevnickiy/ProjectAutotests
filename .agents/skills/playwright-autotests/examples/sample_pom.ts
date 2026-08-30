import { Page, Locator } from '@playwright/test';

export interface ProductData {
  name: string;
  code: string;
  category?: string;
  shelfLifeDays?: string;
}

export class SampleProductPage {
  readonly page: Page;
  readonly newBtn: Locator;
  readonly nameInput: Locator;
  readonly codeInput: Locator;
  readonly categoryCombobox: Locator;
  readonly shelfLifeInput: Locator;
  readonly saveBtn: Locator;
  readonly successNotification: Locator;
  readonly productRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newBtn = page.getByRole('button', { name: 'Створити', exact: true });
    this.nameInput = page.getByRole('textbox', { name: 'Назва' });
    this.codeInput = page.getByRole('textbox', { name: 'Код' });
    this.categoryCombobox = page.getByRole('combobox', { name: 'Категорія' });
    this.shelfLifeInput = page.getByRole('textbox', { name: /Термін придатності|Днів/i });
    this.saveBtn = page.getByRole('button', { name: 'Зберегти' });
    this.successNotification = page.getByText(/Успішно збережено|Запис збережено/i);
    this.productRows = page.locator('[role="row"], table tr');
  }

  async open(): Promise<void> {
    await this.page.goto('/0/Shell/#Section/Products_ListPage');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async createNewProduct(data: ProductData): Promise<void> {
    await this.newBtn.click();
    await this.nameInput.fill(data.name);
    await this.codeInput.fill(data.code);

    if (data.category) {
      await this.categoryCombobox.click();
      await this.categoryCombobox.fill(data.category);
      await this.page.locator('.cdk-overlay-pane mat-option, [role="option"]')
        .filter({ hasText: new RegExp(data.category, 'i') })
        .first()
        .click();
    }

    if (data.shelfLifeDays) {
      await this.shelfLifeInput.fill(data.shelfLifeDays);
    }

    await this.saveBtn.click();
  }

  getProductRow(identifier: string): Locator {
    return this.productRows.filter({ hasText: identifier }).first();
  }
}
