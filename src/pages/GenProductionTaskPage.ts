import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class GenProductionTaskPage extends BasePage {
  // 🔹 Вкладки карточки
  readonly mainInfoTab: Locator;
  readonly calculationsTab: Locator;
  readonly subordinateOrdersTab: Locator;
  readonly waybillsTab: Locator;
  readonly analyticsTab: Locator;

  // 🔹 Поля левой панели карточки
  readonly nameInput: Locator;
  readonly startingFromInput: Locator;
  readonly statusInput: Locator;
  readonly priorityInput: Locator;
  readonly parentOrderInput: Locator;
  readonly groupingStateInput: Locator;
  readonly aggregatingOrderInput: Locator;

  constructor(page: Page) {
    super(page);

    // Вкладки
    this.mainInfoTab = page.locator('.mat-mdc-tab, [role="tab"]').filter({ hasText: /ОСНОВНА ІНФОРМАЦІЯ/i }).first();
    this.calculationsTab = page.locator('.mat-mdc-tab, [role="tab"]').filter({ hasText: /РОЗРАХУНКИ/i }).first();
    this.subordinateOrdersTab = page.locator('.mat-mdc-tab, [role="tab"]').filter({ hasText: /ПІДПОРЯДКОВАНІ ЗАМОВЛЕННЯ/i }).first();
    this.waybillsTab = page.locator('.mat-mdc-tab, [role="tab"]').filter({ hasText: /НАКЛАДНІ/i }).first();
    this.analyticsTab = page.locator('.mat-mdc-tab, [role="tab"]').filter({ hasText: /АНАЛІТИКА/i }).first();

    // Поля формы
    this.nameInput = page.getByLabel('Назва');
    this.startingFromInput = page.getByLabel('Починаючи з');
    this.statusInput = page.getByLabel('Статус');
    this.priorityInput = page.getByLabel('Пріоритет');
    this.parentOrderInput = page.getByLabel('Батьківське виробниче замовлення');
    this.groupingStateInput = page.getByLabel('Стан групування');
    this.aggregatingOrderInput = page.getByLabel('Агрегуюче замовлення');
  }

  async openSection(): Promise<void> {
    await this.open('0/Shell/#Section/GenProductionTask_ListPage');
  }
}
