import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export interface OutputSemiFinishedData {
  nfName: string;
  rate: string;
  unit?: string;
}

export interface OutputProductData {
  productName: string;
  rate: string;
  unit?: string;
}

export interface EquipmentData {
  name: string;
  type: string;
  status?: string;
  commissioningDate?: string;
  line?: string;
  capacity?: string;
  productivity?: string;
  productivityUnit?: string;
  calibration50?: string;
  calibration75?: string;
  calibration95?: string;
  outputSemiFinished?: OutputSemiFinishedData[];
  outputProducts?: OutputProductData[];
}

export class GenEquipmentPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async openListPage(): Promise<void> {
    await this.open('/0/Shell/#Section/GenEquipment_ListPage');
    await this.page.waitForLoadState('domcontentloaded');
    await this.waitForCreatioReady();
  }

  async openAddCard(): Promise<void> {
    await this.openListPage();
    await this.page.waitForTimeout(2000);

    const createBtn = this.page.locator('.crt-button--contained, crt-button[crtopticon="add"], button')
      .filter({ hasText: /New|Створити|Новий|Create/i })
      .first();
    await createBtn.waitFor({ state: 'visible', timeout: 45000 });
    await createBtn.click();
    await this.waitForCreatioReady();
    await this.page.waitForTimeout(2500);
  }

  private async selectCombobox(comboboxOrInput: Locator, value: string): Promise<void> {
    const tagName = await comboboxOrInput.evaluate(el => el.tagName.toLowerCase()).catch(() => '');
    const input = tagName === 'input' ? comboboxOrInput : comboboxOrInput.locator('input').first();

    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.click({ force: true });
    await this.page.waitForTimeout(300);
    await input.fill(value);
    await this.page.waitForTimeout(600);

    const escaped = value.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matchOpt = this.page.locator('.cdk-overlay-pane mat-option:not([aria-disabled="true"]):not(.mdc-list-item--disabled)')
      .filter({ hasNotText: /Додати новий|Створити|crt-combobox-action|create/i })
      .filter({ hasText: new RegExp(escaped, 'i') })
      .first();

    if (await matchOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
      await matchOpt.click({ position: { x: 5, y: 5 }, force: true });
    } else {
      // Try first word
      const firstWord = value.trim().split(' ')[0].replace(/["'\[\]]/g, '');
      const wordMatch = this.page.locator('.cdk-overlay-pane mat-option:not([aria-disabled="true"]):not(.mdc-list-item--disabled)')
        .filter({ hasNotText: /Додати новий|Створити|crt-combobox-action|create/i })
        .filter({ hasText: new RegExp(firstWord, 'i') })
        .first();
      if (firstWord && await wordMatch.isVisible({ timeout: 1500 }).catch(() => false)) {
        await wordMatch.click({ position: { x: 5, y: 5 }, force: true });
      } else {
        await this.page.keyboard.press('ArrowDown');
        await this.page.keyboard.press('Enter');
      }
    }
    await this.page.keyboard.press('Escape').catch(() => { });

    await this.page.waitForTimeout(300);
  }

  async createEquipment(item: EquipmentData): Promise<void> {
    await this.openAddCard();

    // 1. Назва
    const nameInput = this.page.locator('input[aria-label="Name"], input[aria-label="Назва"]')
      .or(this.page.getByRole('textbox', { name: /Назва|Name/i }))
      .first();
    await nameInput.waitFor({ state: 'visible', timeout: 15000 });
    await nameInput.click();
    await nameInput.fill(item.name);
    await this.page.waitForTimeout(300);

    // 2. Статус (за замовчуванням 'В роботі')
    const statusVal = item.status || 'В роботі';
    const statusCb = this.page.getByRole('combobox', { name: /Статус|Status/i }).first();
    if (await statusCb.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.selectCombobox(statusCb, statusVal);
    }

    // 3. Тип обладнання (строго 'Реактор' або інший тип)
    if (item.type) {
      const typeCb = this.page.getByRole('combobox', { name: /Тип обладнання|Equipment type|Type/i }).first();
      if (await typeCb.isVisible({ timeout: 3000 }).catch(() => false)) {
        await this.selectCombobox(typeCb, item.type);
      }
    }

    // 4. Дата введення в експлуатацію
    if (item.commissioningDate) {
      const dateInput = this.page.getByRole('textbox', { name: /Дата введення в експлуатацію|Commissioning date/i }).first();
      if (await dateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await dateInput.click();
        await dateInput.fill(item.commissioningDate);
        await this.page.waitForTimeout(300);
      }
    }

    // 5. Виробнича лінія
    if (item.line) {
      const lineCb = this.page.getByRole('combobox', { name: /Виробнича лінія|Production line|Line/i }).first();
      if (await lineCb.isVisible({ timeout: 3000 }).catch(() => false)) {
        await this.selectCombobox(lineCb, item.line);
      }
    }

    // 6. Виробнича потужність
    if (item.capacity) {
      const capInput = this.page.getByRole('textbox', { name: /Виробнича потужність|Capacity/i }).first()
        .or(this.page.locator('input[aria-label*="Виробнича потужність" i], input[aria-label*="Capacity" i]').first());
      if (await capInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await capInput.click();
        await capInput.fill(item.capacity);
        await this.page.waitForTimeout(300);
      }
    }

    // 7. Вкладка "Властивості"
    const propTab = this.page.getByTitle(/Властивості|Properties/i)
      .or(this.page.locator('[role="tab"]').filter({ hasText: /Властивості|Properties/i }))
      .first();

    if (await propTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await propTab.click();
      await this.page.waitForTimeout(1000);

      // Продуктивність
      if (item.productivity) {
        const prodInput = this.page.getByRole('textbox', { name: /Продуктивність|Productivity/i }).first();
        if (await prodInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await prodInput.click();
          await prodInput.fill(item.productivity);
          await this.page.waitForTimeout(300);
        }
      }

      // Одиниця продуктивності
      if (item.productivityUnit) {
        const prodUnitCb = this.page.getByRole('combobox', { name: /Одиниця продуктивності|Productivity unit/i }).first();
        if (await prodUnitCb.isVisible({ timeout: 3000 }).catch(() => false)) {
          await this.selectCombobox(prodUnitCb, item.productivityUnit);
        }
      }

      // Коефіцієнти завантаження
      if (item.calibration50) {
        const cal50 = this.page.locator('input[aria-label*="50%"]').first();
        if (await cal50.isVisible({ timeout: 1500 }).catch(() => false)) {
          await cal50.click();
          await cal50.fill(item.calibration50);
        }
      }
      if (item.calibration75) {
        const cal75 = this.page.locator('input[aria-label*="75%"]').first();
        if (await cal75.isVisible({ timeout: 1500 }).catch(() => false)) {
          await cal75.click();
          await cal75.fill(item.calibration75);
        }
      }
      if (item.calibration95) {
        const cal95 = this.page.locator('input[aria-label*="95%"]').first();
        if (await cal95.isVisible({ timeout: 1500 }).catch(() => false)) {
          await cal95.click();
          await cal95.fill(item.calibration95);
        }
      }
    }

    // 8. Вкладка "ВИХІД"
    if ((item.outputSemiFinished && item.outputSemiFinished.length > 0) || (item.outputProducts && item.outputProducts.length > 0)) {
      const outputTab = this.page.getByTitle(/Вихід|Output/i)
        .or(this.page.locator('[role="tab"]').filter({ hasText: /Вихід|Output/i }))
        .first();
      await outputTab.click();
      await this.page.waitForTimeout(1500);

      // Додавання напівфабрикатів
      if (item.outputSemiFinished) {
        for (const outNf of item.outputSemiFinished) {
          await this.addOutputSemiFinished(outNf);
        }
      }

      // Додавання готових продуктів
      if (item.outputProducts) {
        for (const outProd of item.outputProducts) {
          await this.addOutputProduct(outProd);
        }
      }
    }

    // 9. Зберегти картку
    const saveBtn = this.page.getByRole('button', { name: /Зберегти|Save/i }).first();
    await saveBtn.click();
    await this.page.waitForTimeout(3000);
  }

  /**
   * Додавання напівфабрикату на вкладці "ВИХІД" (верхня таблиця)
   */
  async addOutputSemiFinished(data: OutputSemiFinishedData): Promise<void> {
    const createBtn = this.page.locator('#FlexContainer_u697e4l').getByRole('button', { name: /Створити|Create|New|Новий/i }).first()
      .or(this.page.locator('crt-expansion-panel').filter({ hasText: /Напівфабрикати|Semi-finished/i }).getByRole('button', { name: /Створити|Create|New|Новий/i }).first());

    await createBtn.click();
    await this.page.waitForTimeout(1500);

    // Напівфабрикат
    const nfCb = this.page.getByRole('combobox', { name: /Напівфабрикат|Semi-finished/i }).first();
    await this.selectCombobox(nfCb, data.nfName);

    // Продуктивність (од/год)
    if (data.rate) {
      const rateInput = this.page.getByRole('textbox', { name: /Продуктивність|Productivity/i }).first();
      if (await rateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await rateInput.click();
        await rateInput.fill(data.rate);
        await this.page.waitForTimeout(300);
      }
    }

    // Одиниця виміру продукту
    if (data.unit) {
      const unitCb = this.page.getByRole('combobox', { name: /Одиниця виміру|Unit of measure|Unit/i }).first();
      if (await unitCb.isVisible({ timeout: 2000 }).catch(() => false)) {
        await this.selectCombobox(unitCb, data.unit);
      }
    }

    // Зберегти модалку
    const saveModalBtn = this.page.getByRole('button', { name: /Зберегти|Save/i }).last();
    await saveModalBtn.click();
    await this.page.waitForTimeout(1500);
  }

  /**
   * Додавання готового продукту на вкладці "ВИХІД" (нижня таблиця)
   */
  async addOutputProduct(data: OutputProductData): Promise<void> {
    const createBtn = this.page.locator('#FlexContainer_ns6ddds').getByRole('button', { name: /Створити|Create|New|Новий/i }).first()
      .or(this.page.locator('crt-expansion-panel').filter({ hasText: /Продукти|Finished|Products/i }).getByRole('button', { name: /Створити|Create|New|Новий/i }).first());

    await createBtn.click();
    await this.page.waitForTimeout(1500);

    // Продукт
    const prodCb = this.page.getByRole('combobox', { name: /Продукт|Product/i }).first();
    await this.selectCombobox(prodCb, data.productName);

    // Продуктивність (од/год)
    if (data.rate) {
      const rateInput = this.page.getByRole('textbox', { name: /Продуктивність|Productivity/i }).first();
      if (await rateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await rateInput.click();
        await rateInput.fill(data.rate);
        await this.page.waitForTimeout(300);
      }
    }

    // Одиниця виміру продукту
    if (data.unit) {
      const unitCb = this.page.getByRole('combobox', { name: /Одиниця виміру|Unit of measure|Unit/i }).first();
      if (await unitCb.isVisible({ timeout: 2000 }).catch(() => false)) {
        await this.selectCombobox(unitCb, data.unit);
      }
    }

    // Зберегти модалку
    const saveModalBtn = this.page.getByRole('button', { name: /Зберегти|Save/i }).last();
    await saveModalBtn.click();
    await this.page.waitForTimeout(1500);
  }
}

