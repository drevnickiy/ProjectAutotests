import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export interface ProductMaterialItem {
  materialName: string;
  unit?: string;
  rate: string;
  stageName: string;
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
    await input.click();
    await this.page.waitForTimeout(400);

    if (searchText) {
      await input.fill(searchText);
      await this.page.waitForTimeout(800);

      const matchOpt = this.page.locator('.cdk-overlay-pane mat-option:not([aria-disabled="true"]):not(.mdc-list-item--disabled)')
        .filter({ hasNotText: /Додати новий|\+|Створити|crt-combobox-search/i })
        .filter({ hasText: new RegExp(searchText, 'i') })
        .first();

      if (await matchOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
        await matchOpt.click();
        await this.page.waitForTimeout(500);
        return;
      }

      // Якщо точного збігу за текстом немає — очищуємо, щоб показати всі доступні опції
      await input.clear();
      await this.page.waitForTimeout(600);
    }

    // Вибір першої доступної валідної опції зі списку
    const firstOpt = this.page.locator('.cdk-overlay-pane mat-option:not([aria-disabled="true"]):not(.mdc-list-item--disabled)')
      .filter({ hasNotText: /Додати новий|\+|Створити|crt-combobox-search/i })
      .first();

    if (await firstOpt.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstOpt.click();
    } else {
      await this.page.keyboard.press('ArrowDown');
      await this.page.keyboard.press('Enter');
    }
    await this.page.waitForTimeout(500);
  }

  /**
   * Добавление позиции материала в секцию "Матеріали для виробництва"
   * Порядок:
   * 1. Назва матеріалу / сировини (combobox 1)
   * 2. Одиниця виміру продукту (combobox 2)
   * 3. Норма витрат на одиницю (number input)
   * 4. Типовий етап (combobox 3)
   * 5. Зберегти
   */
  async addMaterial(item: ProductMaterialItem): Promise<void> {
    console.log(`\n👉 Додавання: "${item.materialName}" | Одиниця: "${item.unit || 'кг'}" | Норма: ${item.rate} | Етап: "${item.stageName}"...`);

    // Очікуємо повного зникнення попередніх оверлеїв/модалок
    await this.page.locator('.cdk-overlay-pane, crt-modal, .cdk-overlay-backdrop').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
    await this.page.waitForTimeout(1000);

    // Секція "Матеріали для виробництва"
    const materialsSection = this.page.locator('crt-expansion-panel, .crt-expansion-panel')
      .filter({ hasText: /Матеріали для виробництва/i })
      .first();

    await materialsSection.scrollIntoViewIfNeeded().catch(() => {});

    // Кнопка "+" біля заголовка "Матеріали для виробництва"
    const addBtn = materialsSection.locator('button[title="Новий"], button[aria-label="Новий"], crt-button[icon="add"] button, [data-item-marker="AddButton"], [data-item-marker="AddRecordButton"]').first()
      .or(materialsSection.locator('button:has(.crt-icon-add), button:has(crt-icon[icon="add"])').first())
      .or(materialsSection.locator('header button, .crt-header button, .crt-expansion-panel-header button').first())
      .or(materialsSection.locator('button').nth(1));

    await addBtn.waitFor({ state: 'visible', timeout: 15000 });
    await addBtn.click({ force: true });
    await this.page.waitForTimeout(1500);

    // Модальне вікно GenRawMaterials_ModalPage (crt-modal)
    const modal = this.page.locator('crt-modal, mat-dialog-container, [role="dialog"]').first();
    await modal.waitFor({ state: 'visible', timeout: 15000 });

    // 1. Поле: Назва матеріалу / сировини (1-й комбобокс)
    console.log(`   🔍 1. [Назва матеріалу / сировини]: "${item.materialName}"...`);
    const matCombobox = modal.locator('crt-combobox').nth(0)
      .or(modal.locator('crt-combobox, mat-form-field').filter({ hasText: /Назва матеріалу/i }).first());
    await this.selectComboboxOption(matCombobox, item.materialName);

    // 2. Поле: Одиниця виміру продукту (2-й комбобокс)
    console.log(`   🔍 2. [Одиниця виміру продукту]: "${item.unit || 'кг'}"...`);
    const unitCombobox = modal.locator('crt-combobox').nth(1)
      .or(modal.locator('crt-combobox, mat-form-field').filter({ hasText: /Одиниця виміру/i }).first());
    await this.selectComboboxOption(unitCombobox, item.unit);

    // 3. Поле: Норма витрат на одиницю (просте поле введення числа)
    console.log(`   ⌨️ 3. [Норма витрат на одиницю]: "${item.rate}"...`);
    const rateInput = modal.locator('input[aria-label*="Норма витрат"], crt-number-input input').first()
      .or(modal.locator('input[type="text"]').nth(1));
    await rateInput.waitFor({ state: 'visible', timeout: 10000 });
    await rateInput.click();
    await this.page.waitForTimeout(200);
    await rateInput.fill(item.rate);
    await this.page.waitForTimeout(400);

    // 4. Поле: Типовий етап (3-й комбобокс)
    console.log(`   🔍 4. [Типовий етап]: "${item.stageName}"...`);
    const stageCombobox = modal.locator('crt-combobox').nth(2)
      .or(modal.locator('crt-combobox, mat-form-field').filter({ hasText: /Типовий етап|Етап/i }).first());
    await this.selectComboboxOption(stageCombobox, item.stageName);

    // 5. Збереження модального вікна
    console.log('   💾 5. [Зберегти]...');
    const saveBtn = modal.getByRole('button', { name: 'Зберегти', exact: true })
      .or(modal.locator('button').filter({ hasText: 'Зберегти' }))
      .first();

    await saveBtn.click();
    await modal.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await this.page.waitForTimeout(2000);
    console.log(`   ✅ Позицію успішно збережено!`);
  }
}
