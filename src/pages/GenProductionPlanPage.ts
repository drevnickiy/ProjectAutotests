import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class GenProductionPlanPage extends BasePage {
  // 🔹 Вкладки формы
  readonly generalInfoTab: Locator;
  readonly productsPlanTab: Locator;
  readonly productionOrdersTab: Locator;
  readonly sourcesTab: Locator;

  // 🔹 Поля формы (левая панель)
  readonly nameInput: Locator;
  readonly statusInput: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly calculationInput: Locator;

  constructor(page: Page) {
    super(page);

    // Вкладки
    this.generalInfoTab = page.locator('.mat-mdc-tab, [role="tab"]').filter({ hasText: /Загальна інформація/i }).first();
    this.productsPlanTab = page.locator('.mat-mdc-tab, [role="tab"]').filter({ hasText: /Продукти плану виробництва/i }).first();
    this.productionOrdersTab = page.locator('.mat-mdc-tab, [role="tab"]').filter({ hasText: /Виробничі замовлення/i }).first();
    this.sourcesTab = page.locator('.mat-mdc-tab, [role="tab"]').filter({ hasText: /Джерела/i }).first();

    // Поля формы
    this.nameInput = page.getByLabel('Назва');
    this.statusInput = page.getByLabel('Статус');
    this.startDateInput = page.getByLabel('Дата початку (план)');
    this.endDateInput = page.getByLabel('Дата завершення (план)');
    this.calculationInput = page.getByLabel('Розрахунок виробництва');
  }

  async openSection(): Promise<void> {
    await this.open('0/Shell/#Section/GenProductionPlan_ListPage');
  }
}
