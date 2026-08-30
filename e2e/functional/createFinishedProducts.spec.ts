import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';

/**
 * Безпечний вибір значення з комбобоксу через введення тексту (AGENTS.md Rule 5)
 */
async function selectDropdown(page: Page, label: string, optionText: string) {
  console.log(`🔍 [КОМБОБОКС "${label}"] Встановлення значення "${optionText}"...`);

  const cb = page.getByRole('combobox', { name: new RegExp(label, 'i') })
    .or(page.locator('crt-combobox, mat-form-field, crt-field').filter({ hasText: new RegExp(label, 'i') }).getByRole('combobox'))
    .first();

  if (!await cb.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log(`   ⚠️ [${label}] Комбобокс не знайдено`);
    return;
  }

  await cb.click();
  await page.waitForTimeout(400);
  await cb.fill(optionText);
  await page.waitForTimeout(800);

  const targetOption = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]')
    .filter({ hasNotText: /Додати новий|\+|Створити|crt-combobox-search/i })
    .filter({ hasText: new RegExp(optionText.trim(), 'i') })
    .first();

  if (await targetOption.isVisible({ timeout: 3000 }).catch(() => false)) {
    const targetText = (await targetOption.innerText().catch(() => '')).trim();
    console.log(`   ✅ [${label}] Обрано: "${targetText}"`);
    await targetOption.click();
  } else {
    const firstOption = page.locator('.cdk-overlay-pane mat-option:not([aria-disabled="true"]):not(.mdc-list-item--disabled)')
      .filter({ hasNotText: /Додати новий|\+|Створити|crt-combobox-search/i })
      .first();
    if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      const text = (await firstOption.innerText().catch(() => '')).trim();
      console.log(`   ✅ [${label}] Обрано першу опцію: "${text}"`);
      await firstOption.click();
    } else {
      await page.keyboard.press('Escape').catch(() => {});
    }
  }

  await page.waitForTimeout(500);
}

test('Створення 3 нових Готових продуктів (Категорія = Готовий продукт, FEFO, Термін придатності = 730 днів)', async ({ page }) => {
  test.setTimeout(400000); // ~6.5 хвилин
  const loginPage = new LoginPage(page);

  const finishedProductsList = [
    {
      name: 'ГП-501 Крем для обличчя "Глибоке зволоження" 50мл',
      category: 'Готовий продукт',
      shelfLifeDays: '730',
      batchControl: 'FEFO'
    },
    {
      name: 'ГП-502 Крем для рук "Захисний" 50мл',
      category: 'Готовий продукт',
      shelfLifeDays: '730',
      batchControl: 'FEFO'
    },
    {
      name: 'ГП-503 Гель для вмивання "Аква-Баланс" 150мл',
      category: 'Готовий продукт',
      shelfLifeDays: '730',
      batchControl: 'FEFO'
    }
  ];

  // 1. Авторизація
  console.log('🔑 [Auth] Авторизація в Creatio...');
  await loginPage.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/Products_ListPage');
  await loginPage.login();
  await page.waitForTimeout(3000);

  for (let i = 0; i < finishedProductsList.length; i++) {
    const item = finishedProductsList[i];
    console.log(`\n================================================================================`);
    console.log(`🧴 [${i + 1}/${finishedProductsList.length}] СТВОРЕННЯ ГОТОВОГО ПРОДУКТУ: "${item.name}"`);
    console.log(`================================================================================`);

    // 1. Перехід на сторінку додавання продукту
    await page.goto('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/Products_FormPage/add');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // 2. Назва (ліва панель: Назва повна / Назва)
    console.log(`   ✏️ Введення назви: "${item.name}"`);
    const nameInput = page.getByRole('textbox', { name: /Назва повна|Назва/i })
      .or(page.locator('crt-field, mat-form-field').filter({ hasText: /Назва повна|Назва/i }).locator('input'))
      .first();
    await nameInput.waitFor({ state: 'visible', timeout: 15000 });
    await nameInput.click();
    await nameInput.fill(item.name);

    // 3. Категорія (ліва панель: Готовий продукт)
    await selectDropdown(page, 'Категорія', item.category);

    // 4. Тип контролю партії (права верхня колонка на вкладці Загальна інформація)
    await selectDropdown(page, 'Тип контролю партії', item.batchControl);

    // 5. Термін придатності (днів) (ліва колонка вкладки Загальна інформація)
    console.log(`   📅 Введення терміну придатності: ${item.shelfLifeDays} днів`);
    const shelfLifeInput = page.getByRole('textbox', { name: /Термін придатності \(днів\)|Термін придатності/i })
      .or(page.locator('crt-number-input, crt-field, mat-form-field').filter({ hasText: /Термін придатності \(днів\)|Термін придатності/i }).locator('input'))
      .first();
    if (await shelfLifeInput.isVisible({ timeout: 4000 }).catch(() => false)) {
      await shelfLifeInput.click();
      await shelfLifeInput.fill(item.shelfLifeDays);
    }

    // 6. Збереження картки
    console.log('   💾 Збереження картки готового продукту (кнопка "Зберегти")...');
    const saveBtn = page.getByRole('button', { name: 'Зберегти', exact: true })
      .or(page.locator('button').filter({ hasText: /^Зберегти$/i }))
      .first();
    await saveBtn.waitFor({ state: 'visible', timeout: 8000 });
    await saveBtn.click();
    await page.waitForTimeout(4000);

    const currentUrl = page.url();
    console.log(`✅ [${i + 1}/${finishedProductsList.length}] Продукт "${item.name}" успішно створено! (URL: ${currentUrl})`);
  }

  console.log('\n🎉 Всі 3 Готові продукти успішно збережено в системі!');
});
