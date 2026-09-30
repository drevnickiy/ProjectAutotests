import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { getShellUrl } from '../config/environment';

export class WarehouseDocumentPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    console.log('🌐 [LIST] Перехід до реєстру складських документів...');
    await this.open(getShellUrl('#Section/GenWarehouseDocument_ListPage'));
    await this.waitForCreatioReady();
  }

  async clickAddDocument() {
    console.log('➕ [LIST] Натискаємо кнопку створення нової накладної...');
    const addBtn = this.page.locator('#AddButton button, button:has-text("Додати"), button:has-text("Новий")')
      .or(this.page.getByRole('button', { name: /Додати|Новий/i }))
      .first();

    await addBtn.waitFor({ state: 'visible', timeout: 15000 });
    await addBtn.click({ force: true });
    await this.page.waitForURL(/GenWarehouseDocument_FormPage/i, { timeout: 15000 }).catch(() => { });
    await this.waitForCreatioReady();
    await this.page.waitForTimeout(1500);
  }

  async filterByStatusDraft() {
    console.log('🔍 [LIST] Фільтрація за статусом "Чернетка"...');
    await this.page.locator('span').filter({ hasText: 'Статус' }).first().click();
    await this.page.waitForTimeout(500);

    // Знімаємо галочку зі статусу "До виконання" (якщо є)
    try {
      const inProgress1 = this.page.getByText('До виконання').first();
      if (await inProgress1.isVisible({ timeout: 1000 })) await inProgress1.click();

      const inProgress2 = this.page.getByText('До виконання').nth(2);
      if (await inProgress2.isVisible({ timeout: 1000 })) await inProgress2.click();
    } catch (e) { }

    // Вибираємо статус "Чернетка"
    await this.page.locator('div').filter({ hasText: 'Чернетка' }).last().click();

    // Закриваємо попап фільтра
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(2000);
  }

  async openFirstDocument(docNumber?: string) {
    console.log(`📂 [LIST] Шукаємо накладну${docNumber ? ` № ${docNumber}` : ' зі статусом "Чернетка"'}...`);
    let row = this.page.locator('crt-data-table-row, crt-data-grid-row, [role="row"]');
    if (docNumber) {
      row = row.filter({ hasText: docNumber }).first();
    } else {
      row = row.filter({ hasText: /Чернетка/i }).first();
    }

    await row.waitFor({ state: 'visible', timeout: 15000 });
    const link = row.locator('a, [role="link"]').first();
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('👉 [LIST] Клікаємо по посиланню накладної...');
      await link.click();
    } else {
      console.log('👉 [LIST] Подвійний клік по рядку накладної...');
      await row.dblclick();
    }

    await this.page.waitForURL(/GenWarehouseDocument_FormPage/i, { timeout: 15000 }).catch(() => { });
    await this.waitForCreatioReady();
    console.log('✅ [LIST] Картку накладної успішно відкрито');
  }
}
