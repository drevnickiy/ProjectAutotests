import { Page, Locator, expect } from '@playwright/test';

export class GenPlanFinishProductPage {
  readonly page: Page;

  // 🔹 Синяя кнопка "+ Додати" раздела
  readonly sectionAddButton: Locator;

  // 🔹 Локаторы колонок реестра от "Назва" до "Детальний опис"
  readonly nameColumn: Locator;
  readonly yearColumn: Locator;
  readonly monthColumn: Locator;
  readonly brandColumn: Locator;
  readonly statusColumn: Locator;
  readonly previousMonthColumn: Locator;
  readonly nextMonthColumn: Locator;
  readonly expectedGrowthPercentageColumn: Locator;
  readonly lowStockRiskThresholdColumn: Locator;
  readonly totalNeedThresholdColumn: Locator;
  readonly detailedDescriptionColumn: Locator;

  // 🔹 Локаторы поп-апа "Додавання плану готової продукції"
  readonly modalTitle: Locator;
  readonly modalYearInput: Locator;
  readonly modalMonthInput: Locator;
  readonly modalBrandInput: Locator;
  readonly modalGrowthPercentageInput: Locator;
  readonly modalLowStockThresholdInput: Locator;
  readonly modalTotalNeedThresholdInput: Locator;
  readonly modalCancelButton: Locator;
  readonly modalSaveButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Кнопка добавить в реестре
    this.sectionAddButton = page.locator('.crt-button--contained').filter({ hasText: 'Додати' }).last();

    // Заголовки колонок таблицы
    this.nameColumn = page.getByText('Назва', { exact: true });
    this.yearColumn = page.getByText('Рік', { exact: true });
    this.monthColumn = page.getByText('Місяць', { exact: true });
    this.brandColumn = page.getByText('Бренд', { exact: true });
    this.statusColumn = page.getByText('Статус', { exact: true });
    this.previousMonthColumn = page.getByText('Попередній місяць', { exact: true });
    this.nextMonthColumn = page.getByText('Наступний місяць', { exact: true });
    this.expectedGrowthPercentageColumn = page.getByText('Загальний відсоток очікуваного приросту', { exact: true });
    this.lowStockRiskThresholdColumn = page.getByText('Загальний поріг ризику низького запасу', { exact: true });
    this.totalNeedThresholdColumn = page.getByText('Загальний поріг потреби', { exact: true });
    this.detailedDescriptionColumn = page.getByText('Детальний опис', { exact: true });

    // Поля модального окна "Додавання плану готової продукції"
    this.modalTitle = page.getByText('Додавання плану готової продукції', { exact: true });
    this.modalYearInput = page.locator('crt-field, mat-form-field').filter({ hasText: 'Рік' }).locator('input, [role="combobox"]');
    this.modalMonthInput = page.locator('crt-field, mat-form-field').filter({ hasText: 'Місяць' }).locator('input, [role="combobox"]');
    this.modalBrandInput = page.locator('crt-field, mat-form-field').filter({ hasText: 'Бренд' }).locator('input, [role="combobox"]');
    this.modalGrowthPercentageInput = page.locator('crt-field, mat-form-field').filter({ hasText: 'Загальний відсоток очікуваного приросту' }).locator('input');
    this.modalLowStockThresholdInput = page.locator('crt-field, mat-form-field').filter({ hasText: 'Загальний поріг ризику низького запасу' }).locator('input');
    this.modalTotalNeedThresholdInput = page.locator('crt-field, mat-form-field').filter({ hasText: 'Загальний поріг потреби' }).locator('input');
    this.modalCancelButton = page.getByRole('button', { name: 'Скасувати' });
    this.modalSaveButton = page.getByRole('button', { name: 'Зберегти' });
  }

  async open(): Promise<void> {
    await this.page.goto('0/Shell/#Section/GenPlanFinishProduct_ListPage');
    await this.page.waitForLoadState('networkidle');
  }

  async clickAddButton(): Promise<void> {
    await this.sectionAddButton.click();
    await expect(this.modalTitle).toBeVisible({ timeout: 10000 });
  }

  async scrollToRight(): Promise<void> {
    await this.page.evaluate(() => {
      const gridContainers = Array.from(document.querySelectorAll('.crt-grid, [role="grid"], .cdk-virtual-scroll-viewport, div'));
      gridContainers.forEach((el) => {
        if (el.scrollWidth > el.clientWidth) {
          el.scrollLeft = el.scrollWidth;
        }
      });
    });
    await this.page.waitForTimeout(500);
  }

  async verifyAllColumnsExist(): Promise<void> {
    await expect(this.nameColumn).toBeVisible();
    await expect(this.yearColumn).toBeVisible();
    await expect(this.monthColumn).toBeVisible();
    await expect(this.brandColumn).toBeVisible();
    await expect(this.statusColumn).toBeVisible();

    await this.scrollToRight();

    await expect(this.previousMonthColumn).toBeVisible();
    await expect(this.nextMonthColumn).toBeVisible();
    await expect(this.expectedGrowthPercentageColumn).toBeVisible();
    await expect(this.lowStockRiskThresholdColumn).toBeVisible();
    await expect(this.totalNeedThresholdColumn).toBeVisible();
    await expect(this.detailedDescriptionColumn).toBeVisible();
  }

  /**
   * Проверяет наличие всех полей и кнопок в поп-апе создания плана
   */
  async verifyModalFields(): Promise<void> {
    await expect(this.modalTitle).toBeVisible();
    await expect(this.modalYearInput).toBeVisible();
    await expect(this.modalMonthInput).toBeVisible();
    await expect(this.modalBrandInput).toBeVisible();
    await expect(this.modalGrowthPercentageInput).toBeVisible();
    await expect(this.modalLowStockThresholdInput).toBeVisible();
    await expect(this.modalTotalNeedThresholdInput).toBeVisible();
    await expect(this.modalCancelButton).toBeVisible();
    await expect(this.modalSaveButton).toBeVisible();
  }
}
