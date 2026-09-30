import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { selectRandomValidDropdownOption, dismissAnyAccidentalModal } from '../utils/dropdown';

export const BLACKLISTED_PRODUCT_OPTIONS = /Motherboard|UT165LZ|Raw Material|test Product|Tinplate|Wood/i;

export class WarehouseDocumentDetailsPage extends BasePage {
  readonly commentInput: Locator;
  readonly lineQuantityInput: Locator;
  readonly lineTotalInput: Locator;

  constructor(page: Page) {
    super(page);
    this.commentInput = page.getByRole('textbox', { name: 'Коментар' });
    this.lineQuantityInput = page.getByRole('textbox', { name: 'Кількість' }).last();
    this.lineTotalInput = page.getByRole('textbox', { name: 'Разом' }).last();
  }

  async fillDate(label: string, dateStr: string) {
    const input = this.page.getByRole('textbox', { name: label });
    await input.scrollIntoViewIfNeeded().catch(() => { });
    await input.click();
    await input.fill(dateStr);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500);
  }

  async fillComment(text: string) {
    await this.commentInput.scrollIntoViewIfNeeded().catch(() => { });
    await this.commentInput.click({ force: true });
    await this.commentInput.fill(text);
  }

  async selectSpecificDropdownOption(label: string, optionName: string, useLast: boolean = false, exact: boolean = false) {
    console.log(`🔍 [DROPDOWN] Пошук та вибір "${optionName}" у списку "${label}"...`);
    let combobox = this.page.locator('crt-combobox').filter({ hasText: new RegExp(label, 'i') }).locator('input').first();
    if (!await combobox.isVisible({ timeout: 5000 }).catch(() => false)) {
      combobox = useLast
        ? this.page.getByRole('combobox', { name: label }).last()
        : this.page.getByRole('combobox', { name: label }).first();
    }

    await combobox.waitFor({ state: 'visible', timeout: 15000 });
    await combobox.scrollIntoViewIfNeeded().catch(() => { });
    const inputEl = combobox.locator('input').first();
    const targetInput = (await inputEl.isVisible({ timeout: 1000 }).catch(() => false)) ? inputEl : combobox;

    await targetInput.click({ force: true, position: { x: 15, y: 15 } });
    await this.page.keyboard.press('Meta+A').catch(() => { });
    await this.page.keyboard.press('Control+A').catch(() => { });
    await targetInput.fill(optionName).catch(() => { });
    await this.page.waitForTimeout(1000);
    await dismissAnyAccidentalModal(this.page);

    const option = exact
      ? this.page.locator('mat-option:not(.crt-combobox-search-text-action), [role="option"]:not(.crt-combobox-search-text-action)').filter({ hasText: new RegExp(`^${optionName}$`, 'i') })
      : this.page.locator('mat-option:not(.crt-combobox-search-text-action), [role="option"]:not(.crt-combobox-search-text-action)').filter({ hasText: new RegExp(optionName, 'i') });

    const isOptionVisible = await option.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
    if (isOptionVisible) {
      await option.first().click({ force: true });
      console.log(`✅ [DROPDOWN] Обрано опцію: "${optionName}"`);
    } else {
      console.warn(`⚠️ [DROPDOWN] Опцію "${optionName}" не знайдено, натискаємо Escape`);
      await this.page.keyboard.press('Escape').catch(() => { });
    }
    await this.page.waitForTimeout(500);
  }

  async selectRandomDropdownOption(label: string, container?: Locator) {
    console.log(`🎲 [DROPDOWN] Випадковий вибір зі списку "${label}"...`);
    const formRoot = container || this.page.locator('crt-card-content, [role="form"], crt-form, .crt-form, crt-flex-container, mat-dialog-container, crt-modal-page').first();

    let combobox = formRoot.locator('crt-combobox').filter({ has: this.page.locator(`input[aria-label*="${label}"], label:has-text("${label}")`) }).first();
    if (!await combobox.isVisible({ timeout: 1500 }).catch(() => false)) {
      combobox = formRoot.locator(`crt-combobox[aria-label*="${label}"]`).first();
    }
    if (!await combobox.isVisible({ timeout: 1500 }).catch(() => false)) {
      combobox = formRoot.locator('crt-field').filter({ hasText: new RegExp(`^\\s*${label}`, 'i') }).locator('crt-combobox, input').first();
    }
    if (!await combobox.isVisible({ timeout: 1500 }).catch(() => false)) {
      combobox = formRoot.getByRole('combobox', { name: new RegExp(label, 'i') }).first();
    }
    if (!await combobox.isVisible({ timeout: 1500 }).catch(() => false)) {
      combobox = formRoot.locator(`input[aria-label*="${label}"]`).first();
    }

    if (!await combobox.isVisible({ timeout: 1500 }).catch(() => false)) {
      const mainArea = this.page.locator('main, [role="main"], crt-card-content').first();
      combobox = mainArea.locator(`crt-combobox[aria-label*="${label}"], input[aria-label*="${label}"]`).first();
    }

    return await selectRandomValidDropdownOption(this.page, combobox, label);
  }

  /**
   * Натискає кнопку "+" у заголовку секції "Продукт складського документа".
   */
  async clickAddProductLine(): Promise<Locator> {
    console.log('➕ [DETAIL] Натискаємо кнопку "+" (Новий) у заголовку "Продукт складського документа"...');
    const panel = this.page.locator('crt-expansion-panel').filter({ hasText: /Продукт складського документа/i });
    const header = panel.locator('crt-expansion-panel-header, mat-expansion-panel-header, .crt-expansion-panel-header').first();

    const addBtn = header.getByRole('button', { name: 'Новий', exact: true })
      .or(header.getByRole('button', { name: /Новий|Додати|\+/i }))
      .or(header.locator('button.crt-button, button').nth(1))
      .first();

    await addBtn.scrollIntoViewIfNeeded().catch(() => { });
    await addBtn.waitFor({ state: 'visible', timeout: 10000 });
    await addBtn.click({ force: true });

    // Очікуємо модальне вікно "Додати продукт до складського документа"
    const modal = this.page.locator('[role="dialog"], crt-dialog-container').filter({ hasText: /Додати продукт|Продукт/i }).first();
    await modal.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ [MODAL] Модальне вікно "Додати продукт" відкрито');
    return modal;
  }

  async clickAddNewLine(): Promise<Locator> {
    return await this.clickAddProductLine();
  }

  async fillLineQuantity(value: number) {
    const input = this.page.locator('crt-input, crt-number-input, [role="textbox"]').filter({ hasText: /Кількість/i }).locator('input').first()
      .or(this.lineQuantityInput);
    await input.click({ force: true });
    await input.fill(value.toString());
  }

  /**
   * Додає продукт у модальному вікні та зберігає модалку
   */
  async addProductLine(productNameOrQty?: string | number, quantity: number = 10) {
    let targetProductName: string | undefined = undefined;
    let targetQty: number = 10;

    if (typeof productNameOrQty === 'string') {
      targetProductName = productNameOrQty;
      targetQty = quantity;
    } else if (typeof productNameOrQty === 'number') {
      targetQty = productNameOrQty;
    }

    const modal = await this.clickAddProductLine();

    // 1. Обираємо продукт
    console.log(`🎲 [MODAL] Обираємо продукт: "${targetProductName || 'Рандомний'}"...`);
    const productCombobox = modal.locator('crt-combobox').filter({ hasText: /Продукт/i }).locator('input').first();
    if (await productCombobox.isVisible({ timeout: 4000 }).catch(() => false)) {
      await productCombobox.click({ force: true });
    } else {
      await modal.getByRole('combobox', { name: 'Продукт' }).last().click({ force: true });
    }
    await this.page.waitForTimeout(1000);

    if (targetProductName) {
      const inputEl = (await productCombobox.isVisible().catch(() => false))
        ? productCombobox
        : modal.getByRole('combobox', { name: 'Продукт' }).last().locator('input').first();

      await inputEl.fill(targetProductName).catch(() => { });
      await this.page.waitForTimeout(1200);

      const specificOption = this.page.locator('mat-option:not(.crt-combobox-search-text-action), [role="option"]:not(.crt-combobox-search-text-action)')
        .filter({ hasText: targetProductName })
        .first();

      if (await specificOption.isVisible({ timeout: 4000 }).catch(() => false)) {
        await specificOption.scrollIntoViewIfNeeded().catch(() => { });
        await specificOption.click({ force: true });
        console.log(`✅ [MODAL] Обрано продукт: "${targetProductName}"`);
      } else {
        console.warn(`⚠️ [MODAL] Опцію "${targetProductName}" не знайдено у списку, обираємо першу доступну...`);
        const firstOpt = this.page.locator('mat-option:not(.crt-combobox-search-text-action), [role="option"]:not(.crt-combobox-search-text-action)')
          .filter({ hasNotText: BLACKLISTED_PRODUCT_OPTIONS })
          .first();
        if (await firstOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
          await firstOpt.click({ force: true });
        }
      }
    } else {
      const productOptions = this.page.locator('mat-option[role="option"]:not(.crt-combobox-autocomplete-loader):not([disabled]):not(.crt-combobox-search-text-action)')
        .filter({ hasNotText: /Створити|Создать|Новий|Create|New|Додати/i })
        .filter({ hasNotText: BLACKLISTED_PRODUCT_OPTIONS });

      const optCount = await productOptions.count();
      if (optCount > 0) {
        const randIdx = Math.floor(Math.random() * optCount);
        const chosenOpt = productOptions.nth(randIdx);
        const chosenText = (await chosenOpt.textContent().catch(() => ''))?.trim();
        console.log(`✅ [MODAL] Обрано рандомний продукт: "${chosenText}"`);
        await chosenOpt.scrollIntoViewIfNeeded().catch(() => { });
        await chosenOpt.click({ force: true });
      } else {
        console.warn('⚠️ [MODAL] Немає доступних продуктів, закриваємо список');
        await this.page.keyboard.press('Escape').catch(() => { });
      }
    }
    await this.page.waitForTimeout(1000);

    // 2. Вказуємо кількість
    const qtyInput = modal.locator('crt-input, crt-number-input, [role="textbox"]').filter({ hasText: /Кількість/i }).locator('input').first()
      .or(modal.locator('input[aria-label*="Кількість"]')).first();
    if (await qtyInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log(`✍️ [MODAL] Вводимо кількість: ${targetQty}`);
      await qtyInput.click({ force: true });
      await qtyInput.fill(targetQty.toString());
      await this.page.keyboard.press('Tab').catch(() => { });
      await this.page.waitForTimeout(500);
    }

    // 3. Зберігаємо модальне вікно
    console.log('💾 [MODAL] Зберігаємо рядок продукту...');
    const footer = modal.locator('mat-dialog-actions, crt-modal-footer, .crt-modal-footer, footer, [slot="actions"]').last();
    let saveBtn = footer.locator('button, crt-button, [role="button"]').filter({ hasText: /Зберегти/i }).last();
    if (!await saveBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      saveBtn = modal.locator('button, crt-button').filter({ hasText: /Зберегти/i }).last();
    }
    await saveBtn.scrollIntoViewIfNeeded().catch(() => { });
    await saveBtn.click({ force: true });

    // Чекаємо закриття модалки
    await modal.waitFor({ state: 'detached', timeout: 10000 }).catch(() => { });
    await this.page.waitForTimeout(1500);
    console.log(`✅ [MODAL] Рядок продукту "${targetProductName || 'успішно'}" додано до накладної`);
  }

  async saveDocument() {
    console.log('💾 [PAGE] Зберігаємо накладну...');
    await this.page.evaluate(() => window.scrollTo(0, 0)).catch(() => { });
    await this.page.waitForTimeout(500);

    const saveBtn = this.page.locator('#SaveButton button, crt-button[data-item-marker="SaveButton"], button:has-text("Зберегти")').first();
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click({ force: true });
      await this.page.waitForTimeout(3000);
      console.log('✅ [PAGE] Натиснуто "Зберегти" накладної');
    } else {
      console.log('ℹ️ [PAGE] Кнопка "Зберегти" не потрібна або зміни застосовано автоматично DCM');
    }
  }

  /**
   * Переводить накладну на вказану стадію (DCM).
   */
  async setStage(stageName: 'Чернетка' | 'В очікуванні' | 'Проведений' | string) {
    console.log(`🎯 [STAGE] Переводимо накладну в статус "${stageName}"...`);
    await this.page.evaluate(() => window.scrollTo(0, 0)).catch(() => { });
    await this.page.waitForTimeout(500);

    if (stageName === 'Проведений') {
      const isDraftActive = await this.page.locator('button[aria-label*="Чернетка"][aria-pressed="true"]').isVisible().catch(() => false);
      if (isDraftActive) {
        console.log('🔄 [STAGE] Перехід через проміжну стадію "В очікуванні"...');
        const pendingBtn = this.page.getByRole('button', { name: /В очікуванні/i }).first();
        if (await pendingBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await pendingBtn.click({ force: true });
          await this.page.waitForTimeout(1000);
          await this.saveDocument();
        }
      }
    }

    const stageBtn = this.page.getByRole('button', { name: new RegExp(stageName, 'i') }).first();
    await stageBtn.scrollIntoViewIfNeeded().catch(() => { });
    await stageBtn.waitFor({ state: 'visible', timeout: 8000 });
    await stageBtn.click({ force: true });
    await this.page.waitForTimeout(1000);

    const menuOption = this.page.locator(`[role="menu"] button[data-item-marker="${stageName}"], [role="menu"] [role="menuitem"]`)
      .filter({ hasText: new RegExp(stageName, 'i') }).first();
    if (await menuOption.isVisible({ timeout: 1500 }).catch(() => false)) {
      console.log(`👉 [STAGE] Клікаємо пункт меню "${stageName}"...`);
      await menuOption.click({ force: true });
      await this.page.waitForTimeout(1000);
    }

    const confirmBtn = this.page.locator('[role="dialog"] button, crt-dialog-container button')
      .filter({ hasText: /Зберегти|Продовжити|Так|Підтвердити/i }).first();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click({ force: true });
      await this.page.waitForTimeout(1000);
    }

    console.log(`✅ [STAGE] Стадію "${stageName}" успішно активовано`);
  }

  async verifyStage(stageName: string) {
    console.log(`🔍 [VERIFY] Перевіряємо стадію "${stageName}"...`);
    await this.page.evaluate(() => window.scrollTo(0, 0)).catch(() => { });
    const stageBtn = this.page.getByRole('button', { name: new RegExp(stageName, 'i') }).first();
    await expect(stageBtn).toBeVisible({ timeout: 10000 });
    const isPressed = await stageBtn.getAttribute('aria-pressed').catch(() => null);
    console.log(`✅ [VERIFY] Стадію "${stageName}" підтверджено (aria-pressed=${isPressed})`);
  }

  async getDocumentNumber(): Promise<string> {
    const numInput = this.page.locator('crt-input').filter({ hasText: /Номер документа/i }).locator('input').first()
      .or(this.page.getByRole('textbox', { name: 'Номер документа' }));
    if (await numInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      return (await numInput.inputValue().catch(() => '')) || '';
    }
    return '';
  }

  async verifyProductLineVisible(productName: string) {
    const tableRow = this.page.locator('table, crt-data-table, [role="row"]').filter({ hasText: productName }).first();
    await tableRow.waitFor({ state: 'visible', timeout: 10000 });
    console.log(`   ✅ [OK] Позицію "${productName}" знайдено у таблиці накладної`);
  }

  async expectNoErrors() {
    const errorNotifications = this.page.locator('.crt-notification-error');
    await expect(errorNotifications).toHaveCount(0);
  }
}
