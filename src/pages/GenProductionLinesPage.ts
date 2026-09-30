import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export interface ProductionLineData {
  name: string;
  isActive?: boolean;
}

export class GenProductionLinesPage extends BasePage {
  readonly createBtn: Locator;
  readonly nameInput: Locator;
  readonly activeCheckbox: Locator;
  readonly saveBtn: Locator;

  constructor(page: Page) {
    super(page);
    this.createBtn = page.getByRole('button', { name: 'Створити' });
    this.nameInput = page.getByRole('textbox', { name: 'Назва' });
    this.activeCheckbox = page.getByRole('checkbox', { name: 'Активна' });
    this.saveBtn = page.getByRole('button', { name: 'Зберегти' });
  }

  async openListPage(): Promise<void> {
    await this.open('/0/Shell/#Section/GenProductionLines_ListPage');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async createLine(data: ProductionLineData): Promise<void> {
    await this.openListPage();
    await this.page.waitForTimeout(2000);

    // Клік "Створити"
    await this.createBtn.waitFor({ state: 'visible', timeout: 15000 });
    await this.createBtn.click();
    await this.page.waitForTimeout(1000);

    // Заповнення назви
    await this.nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.nameInput.click();
    await this.nameInput.fill(data.name);
    await this.page.waitForTimeout(300);

    // Чекбокс "Активна"
    if (data.isActive !== false) {
      if (await this.activeCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
        await this.activeCheckbox.check();
        await this.page.waitForTimeout(300);
      }
    } else {
      if (await this.activeCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
        await this.activeCheckbox.uncheck();
        await this.page.waitForTimeout(300);
      }
    }

    // Клік "Зберегти"
    await this.saveBtn.waitFor({ state: 'visible', timeout: 5000 });
    await this.saveBtn.click();
    await this.page.waitForTimeout(2000);
  }
}
