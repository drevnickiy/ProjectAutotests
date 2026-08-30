import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class WorkShiftDetailsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async fillName(name: string) {
    console.log(`✏️ Заповнення поля "Назва": ${name}`);
    const input = this.page.getByRole('textbox', { name: 'Назва' })
      .or(this.page.locator('crt-field, mat-form-field').filter({ hasText: 'Назва' }).locator('input'))
      .first();
    await input.waitFor({ state: 'visible', timeout: 15000 });
    await input.click();
    await input.fill(name);
  }

  async selectDropdownOption(label: string, optionText?: string) {
    console.log(`📋 Вибір значення для поля "${label}"${optionText ? `: "${optionText}"` : ''}...`);
    let combobox = this.page.getByRole('combobox', { name: new RegExp(label, 'i') }).first();
    if (!await combobox.isVisible({ timeout: 3000 }).catch(() => false)) {
      combobox = this.page.locator('crt-field, mat-form-field').filter({ hasText: label }).getByRole('combobox').first();
    }
    
    if (!await combobox.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log(`⚠️ Поле комбобоксу "${label}" не знайдено на формі.`);
      return;
    }

    await combobox.scrollIntoViewIfNeeded().catch(() => {});
    await combobox.click();
    await this.page.waitForTimeout(400);

    if (optionText) {
      await combobox.fill(optionText).catch(() => {});
      await this.page.waitForTimeout(600);
      
      const specificOption = this.page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]')
        .filter({ hasNotText: /Додати новий|\+|Створити/i })
        .filter({ hasText: new RegExp(optionText, 'i') })
        .first();
      if (await specificOption.isVisible({ timeout: 4000 }).catch(() => false)) {
        await specificOption.click();
        await this.page.waitForTimeout(500);
        return;
      }
    }

    const options = this.page.locator('.cdk-overlay-pane mat-option:not([disabled]), [role="listbox"] [role="option"]:not([disabled])')
      .filter({ hasNotText: /Створити|Создать|Новий|Create|New|Додати/i });

    await options.first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    const count = await options.count();
    
    if (count > 0) {
      const targetOption = options.first();
      const selectedText = (await targetOption.innerText().catch(() => '')).trim();
      console.log(`   ✅ Обрано опцію: "${selectedText}"`);
      await targetOption.click();
      await this.page.waitForTimeout(500);
    } else {
      await this.page.keyboard.press('Escape');
    }
  }

  async fillStartDate(dateStr: string) {
    console.log(`📅 Заповнення поля "Початок": ${dateStr}`);
    const input = this.page.getByRole('textbox', { name: 'Початок' })
      .or(this.page.locator('crt-field, mat-form-field').filter({ hasText: 'Початок' }).locator('input'))
      .first();
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.click();
    await input.fill(dateStr);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500);
  }

  async fillEndDate(dateStr: string) {
    console.log(`📅 Заповнення поля "Завершення": ${dateStr}`);
    const input = this.page.getByRole('textbox', { name: 'Завершення' })
      .or(this.page.locator('crt-field, mat-form-field').filter({ hasText: 'Завершення' }).locator('input'))
      .first();
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.click();
    await input.fill(dateStr);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500);
  }

  async clickAddEmployee() {
    console.log('📑 Перехід на вкладку "Розрахунки" для додавання співробітника...');
    await this.switchToTab('Розрахунки');

    const empHeader = this.page.getByText('Співробітники', { exact: true }).last();
    await empHeader.scrollIntoViewIfNeeded().catch(() => {});

    const empSection = this.page.locator('crt-expansion-panel, div.crt-section, div, section')
      .filter({ has: this.page.getByText('Співробітники', { exact: true }) })
      .filter({ has: this.page.getByRole('button', { name: 'Новий' }) });

    let newBtn = empSection.getByRole('button', { name: 'Новий' }).first();
    if (!await newBtn.isVisible().catch(() => false)) {
      newBtn = this.page.getByRole('button', { name: 'Новий', exact: true }).nth(2);
    }

    if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newBtn.scrollIntoViewIfNeeded().catch(() => {});
      await newBtn.click();
      await this.page.waitForTimeout(1500);
    }
  }

  async saveChanges() {
    console.log('💾 Збереження змін у картці зміни...');
    const saveBtn = this.page.getByRole('button', { name: 'Зберегти', exact: true })
      .or(this.page.locator('button').filter({ hasText: 'Зберегти' }))
      .first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click();
      await this.waitForPageLoaded();
    }
  }

  async closePage() {
    console.log('🚪 Закриття сторінки зміни...');
    const closeBtn = this.page.getByRole('button', { name: 'Закрити' })
      .or(this.page.getByRole('button', { name: 'Назад' }))
      .first();
    if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await closeBtn.click();
      await this.waitForPageLoaded();
    }
  }
}
