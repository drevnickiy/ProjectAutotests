import { Page, Locator } from '@playwright/test';

export interface BugReporterItem {
  title: string;
  steps: string;
  severity: string;
  expectedResult: string;
  comments: string;
  screenshotFile?: string;
}

/**
 * Автоматично закриває будь-яке випадково відкрите вікно створення запису довідника
 */
export async function dismissAnyAccidentalModal(page: Page) {
  // Шукаємо СТРОГО модальні контейнери журналів/довідників, ігноруючи випадаючі списки (.cdk-overlay-pane)
  const dialogs = page.locator('mat-dialog-container:not(.cdk-overlay-pane), crt-modal-page:not(.cdk-overlay-pane)');
  const count = await dialogs.count();

  // Якщо відкрито більше 1 справжньої модалки
  if (count > 1) {
    console.warn(`⚠️ [SAFETY ENGINE] Виявлено вкладене вікно створення (всього ${count} модалок). Закриваємо верхню...`);
    const topModal = dialogs.last();
    const cancelBtn = topModal.locator('button, crt-button, [role="button"]').filter({ hasText: /^Скасувати$/i }).first();

    if (await cancelBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cancelBtn.click({ force: true }).catch(() => { });
    } else {
      await page.keyboard.press('Escape').catch(() => { });
    }
    await page.waitForTimeout(1000).catch(() => { });
  }
}

/**
 * ГЛОБАЛЬНЕ ПРАВИЛО ПРОЄКТУ ДЛЯ ОБРОБКИ ВИПАДАЮЧИХ СПИСКІВ (DROPDOWN / COMBOBOX)
 */
export async function selectRandomValidDropdownOption(
  page: Page,
  comboboxLocator: Locator,
  fieldName: string,
  bugsCollector?: BugReporterItem[]
): Promise<string | undefined> {
  if (!await comboboxLocator.isVisible({ timeout: 4000 }).catch(() => false)) {
    console.warn(`⚠️ [DROPDOWN GLOBAL] Поле "${fieldName}" невидиме.`);
    return undefined;
  }

  const inputEl = comboboxLocator.locator('input').first();
  const currentVal = (await inputEl.inputValue().catch(() => '') || await inputEl.getAttribute('value').catch(() => '') || '').trim();
  if (currentVal.length > 0 && !currentVal.includes('Оберіть')) {
    console.log(`⏭️ [DROPDOWN GLOBAL] Поле "${fieldName}" вже заповнене ("${currentVal}")`);
    return currentVal;
  }

  console.log(`👉 [DROPDOWN GLOBAL] Відкриваємо список: "${fieldName}"`);

  // 🎯 СУВОРЕ ПРАВИЛО: Клікаємо на combobox або input елемент і викликаємо відкриття списку
  if (await inputEl.isVisible({ timeout: 2000 }).catch(() => false)) {
    await inputEl.click({ force: true });
  } else {
    await comboboxLocator.click({ force: true });
  }
  await page.waitForTimeout(800).catch(() => { });

  // Перевіряємо чи відкрилася панель списку, якщо ні — натискаємо Стрілку вниз (ArrowDown) або повторний клік
  let optionsPanel = page.locator('.cdk-overlay-pane, mat-autocomplete, [role="listbox"]').last();
  if (!await optionsPanel.isVisible({ timeout: 1500 }).catch(() => false)) {
    await page.keyboard.press('ArrowDown').catch(() => { });
    await page.waitForTimeout(800).catch(() => { });
  }
  if (!await optionsPanel.isVisible({ timeout: 1500 }).catch(() => false)) {
    await comboboxLocator.click({ force: true }).catch(() => { });
    await page.waitForTimeout(1000).catch(() => { });
  }

  // Перевіряємо чи випадково не відкрилося вікно створення
  await dismissAnyAccidentalModal(page);

  optionsPanel = page.locator('.cdk-overlay-pane, mat-autocomplete, [role="listbox"]').last();
  if (!await optionsPanel.isVisible({ timeout: 4000 }).catch(() => false)) {
    console.warn(`⚠️ [DROPDOWN GLOBAL] Панель списку "${fieldName}" не з'явилася.`);
    return undefined;
  }

  // 🎯 ГЛОБАЛЬНЕ ВІДСІЮВАННЯ: Знаходимо mat-option, ВІДКИДАЮЧИ кнопки "додати", "створити", "+"
  const validOptionElements = optionsPanel.locator('mat-option, [role="option"]').filter({
    hasNotText: /\+|додати|добавить|створити|создать|новий|новый|create|new|add/i
  });

  const count = await validOptionElements.count();
  const safeLocators: { loc: Locator; text: string }[] = [];

  for (let i = 0; i < count; i++) {
    const opt = validOptionElements.nth(i);
    const text = (await opt.textContent().catch(() => '') || '').trim();
    const innerHtml = (await opt.innerHTML().catch(() => '') || '').trim();

    if (!text) continue;
    const combined = (text + ' ' + innerHtml).toLowerCase();

    // 🚫 ГЛОБАЛЬНА ЗАБОРОНА СТВОРЕННЯ
    if (combined.includes('+')) continue;
    if (combined.includes('додати')) continue;
    if (combined.includes('добавить')) continue;
    if (combined.includes('створити')) continue;
    if (combined.includes('создать')) continue;
    if (combined.includes('новий')) continue;
    if (combined.includes('новый')) continue;
    if (combined.includes('create')) continue;
    if (combined.includes('add')) continue;

    // 🚫 ГЛОБАЛЬНИЙ ЧОРНИЙ СПИСОК ЗРАЗКІВ
    if (combined.includes('motherboard ut165lz-32p1')) continue;
    if (combined.includes('raw material')) continue;
    if (combined.includes('test product 1 raw')) continue;
    if (combined.includes('tinplate')) continue;
    if (combined.includes('wood')) continue;

    safeLocators.push({ loc: opt, text });
  }

  if (safeLocators.length > 0) {
    const randomIndex = Math.floor(Math.random() * safeLocators.length);
    const chosen = safeLocators[randomIndex];

    console.log(`   👇 [DROPDOWN GLOBAL] Обираємо існуючий запис (${randomIndex + 1}/${safeLocators.length}): "${chosen.text}"`);
    await chosen.loc.click({ force: true }).catch(() => { });
    await page.waitForTimeout(300).catch(() => { });

    return chosen.text;
  } else {
    console.warn(`⚠️ [DROPDOWN GLOBAL BUG] Немає доступних варіантів ("Немає даних") у списку "${fieldName}"! Фіксуємо баг...`);

    if (bugsCollector) {
      const screenshotFile = `test-results/bug_empty_dropdown_${fieldName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
      await page.screenshot({ path: screenshotFile, fullPage: false }).catch(() => { });

      bugsCollector.push({
        title: `Відсутні доступні значення (Немає даних) у довіднику «${fieldName}»`,
        steps: `1. Відкрити форму з полем «${fieldName}».\n2. Натиснути на випадаючий список «${fieldName}».\n3. Перевірити наявність записів для вибору.`,
        severity: 'Medium',
        expectedResult: 'Випадаючий список містить існуючі записи довідника для вибору.',
        comments: `У довіднику «${fieldName}» відображається «Немає даних» або відсутні валідні записи.`,
        screenshotFile
      });
    }

    await page.keyboard.press('Escape').catch(() => { });
    await page.waitForTimeout(1000).catch(() => { });
    return undefined;
  }
}

/**
 * Обирає конкретний запис із випадаючого списку (наприклад 'В роботі', 'Простій', 'Лінія 1'), з фолбеком на випадковий валідний
 */
export async function selectSpecificDropdownOption(
  page: Page,
  comboboxLocator: Locator,
  fieldName: string,
  targetText: string,
  bugsCollector?: BugReporterItem[]
): Promise<string | undefined> {
  if (!await comboboxLocator.isVisible({ timeout: 4000 }).catch(() => false)) {
    console.warn(`⚠️ [DROPDOWN] Поле "${fieldName}" невидиме.`);
    return undefined;
  }

  console.log(`👉 [DROPDOWN] Відкриваємо список "${fieldName}" для вибору "${targetText}"`);
  const inputEl = comboboxLocator.locator('input').first();
  if (await inputEl.isVisible({ timeout: 2000 }).catch(() => false)) {
    await inputEl.click({ force: true });
  } else {
    await comboboxLocator.click({ force: true });
  }
  await page.waitForTimeout(800).catch(() => { });

  let optionsPanel = page.locator('.cdk-overlay-pane, mat-autocomplete, [role="listbox"]').last();
  if (!await optionsPanel.isVisible({ timeout: 1500 }).catch(() => false)) {
    await page.keyboard.press('ArrowDown').catch(() => { });
    await page.waitForTimeout(800).catch(() => { });
  }

  await dismissAnyAccidentalModal(page);

  optionsPanel = page.locator('.cdk-overlay-pane, mat-autocomplete, [role="listbox"]').last();
  const targetOpt = optionsPanel.locator('mat-option, [role="option"]').filter({ hasText: new RegExp(`^\\s*${targetText}\\s*$`, 'i') }).first();

  if (await targetOpt.isVisible({ timeout: 1500 }).catch(() => false)) {
    console.log(`   👇 [DROPDOWN] Обрано точний запис: "${targetText}"`);
    await targetOpt.click({ force: true }).catch(() => {});
    await page.waitForTimeout(300).catch(() => { });
    return targetText;
  }

  const fallbackOpt = optionsPanel.locator('mat-option, [role="option"]').filter({ hasText: targetText }).first();
  if (await fallbackOpt.isVisible({ timeout: 1500 }).catch(() => false)) {
    const text = (await fallbackOpt.textContent().catch(() => '') || '').trim();
    console.log(`   👇 [DROPDOWN] Обрано запис за підстрокою: "${text}"`);
    await fallbackOpt.click({ force: true }).catch(() => {});
    await page.waitForTimeout(300).catch(() => { });
    return text;
  }

  console.warn(`⚠️ [DROPDOWN] Конкретний варіант "${targetText}" не знайдено у "${fieldName}". Обираємо рандомний валідний...`);
  return await selectRandomValidDropdownOption(page, comboboxLocator, fieldName, bugsCollector);
}
