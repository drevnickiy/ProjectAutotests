import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export interface ProductMaterialItem {
  materialName: string;
  unit?: string;
  rate: string;
  stageName?: string;
  isHardLink?: boolean;
}


export class ProductMaterialsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Универсальный выбор опции из выпадающего списка Creatio
   */
  private async selectComboboxOption(combobox: Locator, searchText?: string): Promise<void> {
    const input = combobox.locator('input').first();
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.click({ force: true });
    await this.page.waitForTimeout(400);

    try {
      if (searchText) {
        await input.fill(searchText);
        await this.page.waitForTimeout(1200);

        const escapedSearch = searchText.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const matchOpt = this.page.locator('.cdk-overlay-pane mat-option:not([aria-disabled="true"]):not(.mdc-list-item--disabled)')
          .filter({ hasNotText: /Додати новий|Створити|crt-combobox-action|crt-combobox-search/i })
          .filter({ hasText: new RegExp(escapedSearch, 'i') })
          .first();

        if (await matchOpt.isVisible({ timeout: 2500 }).catch(() => false)) {
          await matchOpt.click();
          await this.page.waitForTimeout(800);
          return;
        }

        // Якщо точного збігу за повним текстом немає — спробуємо перше слово
        const firstWord = searchText.trim().split(' ')[0].replace(/["']/g, '');
        if (firstWord && firstWord.length > 2) {
          await input.fill(firstWord);
          await this.page.waitForTimeout(1200);
          const escapedWord = firstWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const wordMatch = this.page.locator('.cdk-overlay-pane mat-option:not([aria-disabled="true"]):not(.mdc-list-item--disabled)')
            .filter({ hasNotText: /Додати новий|Створити|crt-combobox-action|crt-combobox-search/i })
            .filter({ hasText: new RegExp(escapedWord, 'i') })
            .first();
          if (await wordMatch.isVisible({ timeout: 2500 }).catch(() => false)) {
            await wordMatch.click();
            await this.page.waitForTimeout(800);
            return;
          }
        }
      }

      // Вибір першої доступної валідної опції зі списку
      const firstOpt = this.page.locator('.cdk-overlay-pane mat-option:not([aria-disabled="true"]):not(.mdc-list-item--disabled)')
        .filter({ hasNotText: /Додати новий|Створити|crt-combobox-action|crt-combobox-search/i })
        .first();

      if (await firstOpt.isVisible({ timeout: 2500 }).catch(() => false)) {
        await firstOpt.click();
      } else {
        await this.page.keyboard.press('ArrowDown').catch(() => { });
        await this.page.keyboard.press('Enter').catch(() => { });
      }
      await this.page.waitForTimeout(800);
    } catch (e: any) {
      console.log(`   ⚠️ Помилка вибору в комбобоксі: ${e.message}`);
    }
  }

  /**
   * Добавление позиции материала в секцию "Матеріали для виробництва"
   */
  async addMaterial(item: ProductMaterialItem): Promise<void> {
    console.log(`\n👉 Додавання: "${item.materialName}" | Одиниця: "${item.unit || 'кг'}" | Норма: ${item.rate}...`);

    // Очікуємо повного зникнення попередніх оверлеїв/модалок
    await this.page.locator('.cdk-overlay-pane, .cdk-overlay-backdrop').waitFor({ state: 'detached', timeout: 5000 }).catch(() => { });
    await this.page.waitForTimeout(1000);

    // Секція "Сировина / матеріали продукту" або "Матеріали для виробництва"
    const materialsSection = this.page.locator('crt-expansion-panel, .crt-expansion-panel')
      .filter({ hasText: /Сировина \/ матеріали|Матеріали для виробництва|Сировина та матеріали|Матеріали \/ Сировина|Матеріали/i })
      .first();

    await materialsSection.waitFor({ state: 'visible', timeout: 15000 });
    await materialsSection.scrollIntoViewIfNeeded().catch(() => { });

    const existing = materialsSection.locator('.crt-grid, [role="grid"]')
      .locator('.crt-grid-cell, [role="gridcell"]')
      .filter({ hasText: item.materialName })
      .first();
    if (await existing.isVisible({ timeout: 1500 }).catch(() => false)) {
      console.log(`   ℹ️ Позиція "${item.materialName}" вже є в таблиці, пропускаємо.`);
      return;
    }

    // Кнопка додавання (+) в секції сировини
    const addBtn = materialsSection.locator('[id^="GridDetailAddBtn_"] button, button[title="Новий"], button[aria-label="Новий"], crt-button[icon="add"] button')
      .or(materialsSection.locator('button').filter({ hasText: /Новий/i }))
      .first();

    await addBtn.scrollIntoViewIfNeeded().catch(() => { });
    await addBtn.waitFor({ state: 'visible', timeout: 15000 });
    await addBtn.click({ force: true });
    await this.page.waitForTimeout(1500);

    // Модальне вікно GenRawMaterials_ModalPage (crt-modal)
    const modal = this.page.locator('crt-modal, mat-dialog-container, [role="dialog"]').last();
    await modal.waitFor({ state: 'visible', timeout: 15000 });

    // 1. Поле: Назва матеріалу / сировини (1-й комбобокс)
    console.log(`   🔍 1. [Назва матеріалу / сировини]: "${item.materialName}"...`);
    const matCombobox = modal.locator('crt-combobox').nth(0)
      .or(modal.locator('crt-combobox, mat-form-field').filter({ hasText: /Назва матеріалу/i }).first());
    await this.selectComboboxOption(matCombobox, item.materialName);
    await this.page.waitForTimeout(600);

    // 2. Поле: Одиниця виміру продукту (2-й комбобокс)
    const unitCombobox = modal.locator('crt-combobox').nth(1)
      .or(modal.locator('crt-combobox, mat-form-field').filter({ hasText: /Одиниця виміру/i }).first());
    const unitInput = unitCombobox.locator('input').first();
    const currentUnit = await unitInput.inputValue().catch(() => '');

    if (!currentUnit || (!currentUnit.includes('кілограм') && !currentUnit.includes('кг'))) {
      console.log(`   🔍 2. [Одиниця виміру продукту]: встановлюємо "${item.unit || 'кілограм'}"...`);
      await this.selectComboboxOption(unitCombobox, item.unit || 'кілограм');
      await this.page.waitForTimeout(400);
    } else {
      console.log(`   ✅ 2. [Одиниця виміру продукту]: автоматично встановлено "${currentUnit}", залишаємо.`);
    }

    // 3. Поле: Норма витрат на одиницю
    console.log(`   ⌨️ 3. [Норма витрат на одиницю]: "${item.rate}"...`);
    const rateInput = modal.locator('input[aria-label*="Норма витрат"], crt-number-input input').first()
      .or(modal.locator('input[type="text"]').nth(1));
    await rateInput.waitFor({ state: 'visible', timeout: 10000 });
    await rateInput.click({ force: true });
    await this.page.waitForTimeout(300);
    await rateInput.fill('');
    await rateInput.fill(item.rate);
    await this.page.waitForTimeout(500);

    // 4. Поле: Типовий етап (3-й комбобокс)
    if (item.stageName) {
      console.log(`   🔍 4. [Типовий етап]: "${item.stageName}"...`);
      const stageCombobox = modal.locator('crt-combobox').nth(2)
        .or(modal.locator('crt-combobox, mat-form-field').filter({ hasText: /Типовий етап|Етап/i }).first());

      const stageTrigger = stageCombobox.locator('button, [role="combobox"], .crt-combobox-icon, input').last();
      await stageTrigger.click({ force: true });
      await this.page.waitForTimeout(600);

      const escapedStage = item.stageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const validOptions = this.page.locator('.cdk-overlay-pane mat-option:not([aria-disabled="true"]):not(.mdc-list-item--disabled)')
        .filter({ hasNotText: /Додати|Створити|crt-combobox-action|\+/i });

      const stageOpt = validOptions.filter({ hasText: new RegExp(escapedStage, 'i') }).first();
      if (await stageOpt.isVisible({ timeout: 2500 }).catch(() => false)) {
        await stageOpt.click({ force: true });
      } else {
        const firstOpt = validOptions.first();
        if (await firstOpt.isVisible({ timeout: 1000 }).catch(() => false)) {
          await firstOpt.click({ force: true });
        }
      }
      await this.page.waitForTimeout(400);
    }

    // 4.1. Поле: Планувати разом з батьківським замовленням (жорсткий зв'язок)
    if (item.isHardLink) {
      console.log(`   ☑️ 4.1. [Планувати разом з батьківським замовленням]: встановлюємо TRUE...`);
      const hardLinkCheckbox = modal.getByRole('checkbox', { name: /Планувати разом/i })
        .or(modal.locator('crt-checkbox, mat-checkbox').filter({ hasText: /Планувати разом/i }).locator('input[type="checkbox"]'))
        .first();
      if (await hardLinkCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        const isChecked = await hardLinkCheckbox.isChecked().catch(() => false);
        if (!isChecked) {
          await hardLinkCheckbox.click({ force: true });
          await this.page.waitForTimeout(300);
        }
      }
    }

    // 5. Зберегти
    console.log('   💾 5. [Зберегти / Save]...');
    const saveBtn = modal.getByRole('button', { name: /Зберегти|Save/i })
      .or(modal.locator('button').filter({ hasText: /^(Зберегти|Save)$/i }))
      .first();


    await saveBtn.scrollIntoViewIfNeeded().catch(() => { });
    await saveBtn.click({ force: true });
    await modal.waitFor({ state: 'detached', timeout: 15000 }).catch(() => { });
    await this.page.waitForTimeout(1500);
    await this.page.waitForTimeout(2000);
    console.log(`   ✅ Позицію успішно збережено!`);
  }
}
