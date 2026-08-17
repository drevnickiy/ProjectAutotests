import { Page, Locator, expect } from '@playwright/test';

export class GenContractOrderPage {
  readonly page: Page;

  // 🔹 Кнопка "+ Додати" раздела
  readonly sectionAddButton: Locator;

  // 🔹 Заголовки колонок реестра
  readonly nameColumn: Locator;
  readonly createdAtColumn: Locator;
  readonly contractorColumn: Locator;
  readonly plannedExecutionDateColumn: Locator;
  readonly actualExecutionDateColumn: Locator;

  // 🔹 Поля формы добавления "Новий запис"
  readonly nameInput: Locator;
  readonly createdAtInput: Locator;
  readonly contractorInput: Locator;
  readonly plannedExecutionDateInput: Locator;
  readonly actualExecutionDateInput: Locator;
  readonly statusInput: Locator;

  // 🔹 Колонки таблицы "Продукти у контрактному замовленні"
  readonly productColumn: Locator;
  readonly quantityColumn: Locator;
  readonly techCardColumn: Locator;
  readonly unitColumn: Locator;
  readonly commentColumn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sectionAddButton = page.locator('.crt-button--contained').filter({ hasText: 'Додати' }).last();

    // Колонки реестра
    this.nameColumn = page.getByText('Назва', { exact: true });
    this.createdAtColumn = page.getByText('Дата створення', { exact: true });
    this.contractorColumn = page.getByText('Контрагент', { exact: true });
    this.plannedExecutionDateColumn = page.getByText('Планова дата виконання', { exact: true });
    this.actualExecutionDateColumn = page.getByText('Фактична дата виконання', { exact: true });

    // Поля формы нового элемента
    this.nameInput = page.getByLabel('Назва');
    this.createdAtInput = page.getByLabel('Дата створення');
    this.contractorInput = page.getByLabel('Контрагент');
    this.plannedExecutionDateInput = page.getByLabel('Планова дата виконання');
    this.actualExecutionDateInput = page.getByLabel('Фактична дата виконання');
    this.statusInput = page.getByLabel('Статус');

    // Колонки таблицы нового элемента
    this.productColumn = page.getByText('Продукт', { exact: true });
    this.quantityColumn = page.getByText('Кількість', { exact: true });
    this.techCardColumn = page.getByText('Технологічна карта', { exact: true });
    this.unitColumn = page.getByText('Одиниця виміру', { exact: true });
    this.commentColumn = page.getByText('Коментар', { exact: true });
  }

  async open(): Promise<void> {
    await this.page.goto('0/Shell/#Section/GenContractOrder_ListPage');
    await this.page.waitForLoadState('networkidle');
  }

  async clickAddButton(): Promise<void> {
    await this.sectionAddButton.click();
    await this.page.waitForTimeout(4000);
  }

  async scrollToRight(): Promise<void> {
    await this.page.evaluate(() => {
      const scrollables = Array.from(document.querySelectorAll('.crt-grid, [role="grid"], .cdk-virtual-scroll-viewport, div'));
      scrollables.forEach((el) => {
        if (el.scrollWidth > el.clientWidth) {
          el.scrollLeft = el.scrollWidth;
        }
      });
    });
    await this.page.waitForTimeout(500);
  }

  async verifyAllColumnsExist(): Promise<void> {
    await expect(this.nameColumn).toBeVisible();
    await expect(this.createdAtColumn).toBeVisible();
    await expect(this.contractorColumn).toBeVisible();

    await this.scrollToRight();

    await expect(this.plannedExecutionDateColumn).toBeVisible();
    await expect(this.actualExecutionDateColumn).toBeVisible();
  }

  async verifyNewRecordFields(): Promise<void> {
    await expect(this.nameInput).toBeVisible();
    await expect(this.createdAtInput).toBeVisible();
    await expect(this.contractorInput).toBeVisible();
    await expect(this.plannedExecutionDateInput).toBeVisible();
    await expect(this.actualExecutionDateInput).toBeVisible();
    await expect(this.statusInput).toBeVisible();

    await expect(this.productColumn).toBeVisible();
    await expect(this.quantityColumn).toBeVisible();
    await expect(this.techCardColumn).toBeVisible();
    await expect(this.unitColumn).toBeVisible();
    await expect(this.commentColumn).toBeVisible();
  }
}
