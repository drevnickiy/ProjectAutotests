import { Page, Locator, expect } from '@playwright/test';

export class GenProductionCalculatPage {
  readonly page: Page;

  // 🔹 Синяя кнопка "+ Додати" раздела
  readonly sectionAddButton: Locator;

  // 🔹 Вкладки формы создания
  readonly generalInfoTab: Locator;
  readonly productsCalculationTab: Locator;

  // 🔹 Поля формы (левая панель карточки)
  readonly nameInput: Locator;
  readonly lastUpdatedInput: Locator;
  readonly calculationStatusInput: Locator;
  readonly periodStartDateInput: Locator;
  readonly periodEndDateInput: Locator;
  readonly lockDateInput: Locator;

  // 🔹 Вкладка 1: Колонки таблицы "План виробництва"
  readonly tab1NameColumn: Locator;
  readonly tab1PeriodStartDateColumn: Locator;
  readonly tab1PeriodEndDateColumn: Locator;
  readonly tab1StatusColumn: Locator;

  // 🔹 Вкладка 2: Колонки таблицы "Продукти розрахунку виробництва"
  readonly tab2CreatedAtColumn: Locator;
  readonly tab2ProductColumn: Locator;
  readonly tab2QuantityToProduceColumn: Locator;
  readonly tab2FinishProductPlanningColumn: Locator;
  readonly tab2ContractOrderColumn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sectionAddButton = page.locator('.crt-button--contained').filter({ hasText: 'Додати' }).last();

    // Вкладки карточки
    this.generalInfoTab = page.locator('.mat-mdc-tab, [role="tab"]').filter({ hasText: /Загальна інформація/i }).first();
    this.productsCalculationTab = page.locator('.mat-mdc-tab, [role="tab"]').filter({ hasText: /Продукти розрахунку виробництва/i }).first();

    // Поля формы
    this.nameInput = page.getByLabel('Назва');
    this.lastUpdatedInput = page.getByLabel('Дата останнього оновлення');
    this.calculationStatusInput = page.getByLabel('Статус розрахунку виробництва');
    this.periodStartDateInput = page.getByLabel('Дата початку періоду');
    this.periodEndDateInput = page.getByLabel('Дата завершення періоду');
    this.lockDateInput = page.getByLabel('Дата блокування');

    // Таблица Вкладка 1
    this.tab1NameColumn = page.getByText('Назва', { exact: true });
    this.tab1PeriodStartDateColumn = page.getByText('Дата початку періоду', { exact: true });
    this.tab1PeriodEndDateColumn = page.getByText('Дата завершення періоду', { exact: true });
    this.tab1StatusColumn = page.getByText('Статус', { exact: true });

    // Таблица Вкладка 2
    this.tab2CreatedAtColumn = page.getByText('Дата створення', { exact: true });
    this.tab2ProductColumn = page.getByText('Продукт', { exact: true });
    this.tab2QuantityToProduceColumn = page.getByText('Кількість до виробництва', { exact: true });
    this.tab2FinishProductPlanningColumn = page.getByText('Планування ГП', { exact: true });
    this.tab2ContractOrderColumn = page.getByText('Контрактне замовлення', { exact: true });
  }

  async open(): Promise<void> {
    await this.page.goto('0/Shell/#Section/GenProductionCalculat_ListPage');
    await this.page.waitForLoadState('networkidle');
  }

  async clickAddButton(): Promise<void> {
    await this.sectionAddButton.click();
    await this.page.waitForTimeout(4000);
  }

  async switchToTab2(): Promise<void> {
    if (await this.productsCalculationTab.isVisible().catch(() => false)) {
      await this.productsCalculationTab.click();
    } else {
      await this.page.getByText('ПРОДУКТИ РОЗРАХУНКУ ВИРОБНИЦТВА', { exact: false }).first().click();
    }
    await this.page.waitForTimeout(2000);
  }

  async verifyFormFields(): Promise<void> {
    await expect(this.nameInput).toBeVisible();
    await expect(this.lastUpdatedInput).toBeVisible();
    await expect(this.calculationStatusInput).toBeVisible();
    await expect(this.periodStartDateInput).toBeVisible();
    await expect(this.periodEndDateInput).toBeVisible();
    await expect(this.lockDateInput).toBeVisible();
  }

  async verifyTab1Columns(): Promise<void> {
    await expect(this.tab1NameColumn).toBeVisible();
    await expect(this.tab1PeriodStartDateColumn).toBeVisible();
    await expect(this.tab1PeriodEndDateColumn).toBeVisible();
    await expect(this.tab1StatusColumn).toBeVisible();
  }

  async verifyTab2Columns(): Promise<void> {
    await expect(this.tab2CreatedAtColumn).toBeVisible();
    await expect(this.tab2ProductColumn).toBeVisible();
    await expect(this.tab2QuantityToProduceColumn).toBeVisible();
    await expect(this.tab2FinishProductPlanningColumn).toBeVisible();
    await expect(this.tab2ContractOrderColumn).toBeVisible();
  }
}
