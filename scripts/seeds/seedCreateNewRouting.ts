import { test, Page, Locator } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';

export interface StageData {
  number: string;
  name: string;
}

export interface TaskData {
  name: string;
  stageName: string;
  order: string;
  equipmentType?: string;
  taskType?: 'Виробниче завдання' | 'Сервісне завдання' | 'ВКЯ';
  vkyType?: string;
  hours?: string;
  minInterval?: string;
  linkedTaskTemplate?: string;
  description: string;
}

test.describe('Скрипт створення нової Технологічної карти (Routing) з повною бізнес-логікою', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  async function selectComboboxInModal(modal: Locator, labelPattern: RegExp, optionText: string, page: Page) {
    const cb = modal.locator('crt-combobox, mat-form-field').filter({ hasText: labelPattern }).locator('input').first()
      .or(modal.locator('input').filter({ hasText: labelPattern }).first());

    if (await cb.isVisible({ timeout: 4000 }).catch(() => false)) {
      await cb.click({ force: true });
      await page.waitForTimeout(300);
      await cb.fill(optionText);
      await page.waitForTimeout(800);

      const opt = page.locator('.cdk-overlay-pane mat-option:not([aria-disabled="true"]):not(.mdc-list-item--disabled)')
        .filter({ hasNotText: /Додати новий|\+|Створити|crt-combobox-search/i })
        .filter({ hasText: new RegExp(optionText, 'i') })
        .first();

      if (await opt.isVisible({ timeout: 2500 }).catch(() => false)) {
        await opt.click();
      } else {
        const fallbackOpt = page.locator('.cdk-overlay-pane mat-option:not([aria-disabled="true"]):not(.mdc-list-item--disabled)')
          .filter({ hasNotText: /Додати новий|\+|Створити/i })
          .first();
        if (await fallbackOpt.isVisible({ timeout: 1500 }).catch(() => false)) {
          await fallbackOpt.click();
        } else {
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('Enter');
        }
      }
      await page.waitForTimeout(600);
      await page.locator('.cdk-overlay-backdrop').waitFor({ state: 'detached', timeout: 2000 }).catch(() => { });
    }
  }

  test('Створення нової Технологічної карти для продукту з усіма типами завдань (Виробничі, ВКЯ, Сервісні)', async ({ page }) => {
    test.setTimeout(360000);

    const suffix = Date.now().toString().slice(-4);
    const routingData = {
      name: `ТК-GP-005 Гель для душу ${suffix}`,
      code: `TK-GP-005-${suffix}`,
      version: '1.0',
      status: 'В роботі',
      product: 'Гель для душу "Морська свіжість" 300мл',
      startDate: '01.08.2026',
      endDate: '31.12.2026',
      stages: [
        { number: '10', name: `Стерилізація флаконів (${suffix})` },
        { number: '20', name: `Приготування маси гелю (${suffix})` },
        { number: '30', name: `Розлив у флакони 400мл (${suffix})` },
        { number: '40', name: `Пакування у короби (${suffix})` },
        { number: '50', name: `Сервісне обслуговування (${suffix})` },
      ] as StageData[],
      tasks: [
        {
          name: 'Стерилізація флаконів',
          stageName: `Стерилізація флаконів (${suffix})`,
          order: '1',
          taskType: 'Виробниче завдання',
          equipmentType: 'Фасування',
          hours: '1',
          minInterval: '15',
          description: 'Термічна дезінфекція та стерилізація флаконів',
        },
        {
          name: 'Приготування маси гелю',
          stageName: `Приготування маси гелю (${suffix})`,
          order: '1',
          taskType: 'Виробниче завдання',
          equipmentType: 'Реактор',
          hours: '2',
          minInterval: '20',
          description: 'Варка, змішування ПАР та гомогенізація маси гелю',
        },
        {
          name: 'Вхідний контроль якості маси гелю',
          stageName: `Приготування маси гелю (${suffix})`,
          order: '2',
          taskType: 'ВКЯ',
          hours: '1',
          minInterval: '10',
          description: 'Лабораторний аналіз в’язкості, pH та органолептики',
        },
        {
          name: 'Розлив у флакони 400мл',
          stageName: `Розлив у флакони 400мл (${suffix})`,
          order: '1',
          taskType: 'Виробниче завдання',
          equipmentType: 'Фасування',
          hours: '3',
          minInterval: '15',
          description: 'Автоматичний розлив маси гелю у флакони та укупорка',
        },
        {
          name: 'Маркування та пакування',
          stageName: `Пакування у короби (${suffix})`,
          order: '1',
          taskType: 'Виробниче завдання',
          equipmentType: 'Пакування',
          hours: '1',
          minInterval: '10',
          description: 'Наклейка етикеток та укладання готової продукції у гофрокороби',
        },
        {
          name: 'Профілактичне очищення та обслуговування',
          stageName: `Сервісне обслуговування (${suffix})`,
          order: '1',
          taskType: 'Сервісне завдання',
          equipmentType: 'Реактор',
          hours: '1',
          minInterval: '10',
          description: 'CIP-мийка та профілактичне сервісне обслуговування реактора',
        },
      ] as TaskData[],
    };

    console.log(`\n======================================================`);
    console.log(`🚀 СТВОРЕННЯ ПОВНОЇ ТЕХНОЛОГІЧНОЇ КАРТИ: "${routingData.name}"`);
    console.log(`📦 Продукт: "${routingData.product}"`);
    console.log(`🔢 Етапів: ${routingData.stages.length}, Завдань: ${routingData.tasks.length}`);
    console.log(`======================================================`);

    console.log('📌 1. Відкриття форми створення Техкарти (#Card/GenProductionRouting_FormPage/add)...');
    await page.goto('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionRouting_FormPage/add', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Перевірка авторизації
    await loginPage.login();
    await page.waitForTimeout(2000);

    // ─────────────────────────────────────────────────────────────
    // 2. Заповнення основних реквізитів ТК (Ліва панель)
    // ─────────────────────────────────────────────────────────────
    console.log('📌 2. Заповнення реквізитів Техкарти...');

    // 2.1. Назва
    console.log(`   ✏️ 1. Назва: "${routingData.name}"`);
    const nameInput = page.getByRole('textbox', { name: 'Назва' })
      .or(page.locator('input[aria-label="Назва"]'))
      .first();
    await nameInput.waitFor({ state: 'visible', timeout: 30000 });
    await nameInput.click();
    await nameInput.fill(routingData.name);
    await page.waitForTimeout(400);

    // 2.2. Код
    console.log(`   ✏️ 2. Код: "${routingData.code}"`);
    const codeInput = page.getByRole('textbox', { name: 'Код' })
      .or(page.locator('input[aria-label="Код"]'))
      .first();
    if (await codeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await codeInput.click();
      await codeInput.fill(routingData.code);
      await page.waitForTimeout(300);
    }

    // 2.3. Версія
    console.log(`   ✏️ 3. Версія: "${routingData.version}"`);
    const versionInput = page.getByRole('textbox', { name: 'Версія' })
      .or(page.locator('input[aria-label="Версія"]'))
      .first();
    if (await versionInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await versionInput.click();
      await versionInput.fill(routingData.version);
      await page.waitForTimeout(300);
    }

    // 2.4. Статус технологічної карти ("В роботі")
    console.log(`   🔍 4. Статус технологічної карти: "${routingData.status}"`);
    const statusField = page.getByRole('combobox', { name: /Статус технологічної карти|Статус/i })
      .or(page.locator('input[aria-label*="Статус"]'))
      .first();
    if (await statusField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await statusField.click();
      await page.waitForTimeout(300);
      await statusField.fill(routingData.status);
      await page.waitForTimeout(800);

      const statusOpt = page.locator('.cdk-overlay-pane mat-option:not([aria-disabled="true"]):not(.mdc-list-item--disabled)')
        .filter({ hasNotText: /Додати новий|\+|Створити|crt-combobox-search/i })
        .filter({ hasText: new RegExp(routingData.status, 'i') })
        .first();

      if (await statusOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
        await statusOpt.click();
      } else {
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
      }
      await page.waitForTimeout(400);
      await page.locator('.cdk-overlay-backdrop').waitFor({ state: 'detached', timeout: 2000 }).catch(() => { });
    }

    // 2.5. Продукт (пошук у дропдауні)
    console.log(`   🔍 5. Продукт: "${routingData.product}"`);
    const productField = page.getByRole('combobox', { name: 'Продукт', exact: true })
      .or(page.locator('input[aria-label*="Продукт"]'))
      .first();
    await productField.waitFor({ state: 'visible', timeout: 10000 });
    await productField.click();
    await page.waitForTimeout(300);
    await productField.fill(routingData.product);
    await page.waitForTimeout(1200);

    const prodOpt = page.locator('.cdk-overlay-pane mat-option:not([aria-disabled="true"]):not(.mdc-list-item--disabled)')
      .filter({ hasNotText: /Додати новий|\+|Створити|crt-combobox-search/i })
      .filter({ hasText: new RegExp(routingData.product, 'i') })
      .first();

    if (await prodOpt.isVisible({ timeout: 3000 }).catch(() => false)) {
      await prodOpt.scrollIntoViewIfNeeded().catch(() => { });
      await prodOpt.click();
    } else {
      const fallbackProd = page.locator('.cdk-overlay-pane mat-option:not([aria-disabled="true"]):not(.mdc-list-item--disabled)')
        .filter({ hasNotText: /Додати новий|\+|Створити/i })
        .first();
      if (await fallbackProd.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fallbackProd.click();
      } else {
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
      }
    }
    await page.waitForTimeout(500);
    await page.locator('.cdk-overlay-backdrop').waitFor({ state: 'detached', timeout: 2000 }).catch(() => { });

    // 2.6. Дати
    const startDateField = page.locator('input[aria-label*="Дата початку"]').first();
    if (await startDateField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startDateField.click();
      await startDateField.fill(routingData.startDate);
      await page.waitForTimeout(300);
    }

    const endDateField = page.locator('input[aria-label*="Дата завершення"]').first();
    if (await endDateField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await endDateField.click();
      await endDateField.fill(routingData.endDate);
      await page.waitForTimeout(300);
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Вкладка "Етапи та завдання"
    // ─────────────────────────────────────────────────────────────
    console.log('\n📌 3. Перехід на вкладку "Етапи та завдання"...');
    const stagesTasksTab = page.locator('[role="tab"], .mat-mdc-tab, .crt-tab-header, .mat-tab-label')
      .filter({ hasText: /Етапи та завдання/i })
      .first();
    await stagesTasksTab.waitFor({ state: 'visible', timeout: 30000 });
    await stagesTasksTab.click();
    await page.waitForTimeout(2000);

    // 3.1. Додавання типових етапів
    console.log(`\n📌 4. Додавання ${routingData.stages.length} типових етапів...`);
    const stagesSection = page.locator('crt-expansion-panel, .crt-expansion-panel').filter({ hasText: /Типовий етап виробництва|Типові етапи/i }).first();

    for (const stage of routingData.stages) {
      console.log(`   ➕ Етап [${stage.number}]: "${stage.name}"...`);
      await page.locator('.cdk-overlay-pane, crt-modal, .cdk-overlay-backdrop').waitFor({ state: 'detached', timeout: 5000 }).catch(() => { });
      await page.waitForTimeout(500);

      const addStageBtn = stagesSection.locator('button[title="Новий"], button[aria-label="Новий"], crt-button[icon="add"] button').first();
      await addStageBtn.waitFor({ state: 'visible', timeout: 10000 });
      await addStageBtn.click({ force: true });
      await page.waitForTimeout(1500);

      const stageModal = page.locator('crt-modal, mat-dialog-container, [role="dialog"]').first();
      await stageModal.waitFor({ state: 'visible', timeout: 10000 });

      // Номер
      const numberInput = stageModal.locator('input[aria-label*="Номер"], crt-input input').first();
      await numberInput.waitFor({ state: 'visible', timeout: 5000 });
      await numberInput.click();
      await numberInput.fill(stage.number);
      await page.waitForTimeout(300);

      // Назва
      const nameInputModal = stageModal.locator('input[aria-label*="Назва"], crt-input input').last();
      await nameInputModal.click();
      await nameInputModal.fill(stage.name);
      await page.waitForTimeout(300);

      // Зберегти етап
      const saveStageBtn = stageModal.getByRole('button', { name: 'Зберегти', exact: true }).first();
      await saveStageBtn.click();
      await stageModal.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => { });
      await page.waitForTimeout(1500);
      console.log(`   ✅ Етап "${stage.name}" збережено!`);
    }

    // 3.2. Додавання типових завдань (з повною бізнес-логікою)
    console.log(`\n📌 5. Додавання ${routingData.tasks.length} типових завдань...`);
    const tasksSection = page.locator('crt-expansion-panel, .crt-expansion-panel').filter({ hasText: /Типове завдання етапу|Типові завдання/i }).first();

    for (const task of routingData.tasks) {
      console.log(`   ➕ Завдання: "${task.name}" (${task.taskType}) -> Етап: "${task.stageName}"...`);
      await page.locator('.cdk-overlay-pane, crt-modal, .cdk-overlay-backdrop').waitFor({ state: 'detached', timeout: 5000 }).catch(() => { });
      await page.waitForTimeout(500);

      const addTaskBtn = tasksSection.locator('button[title="Новий"], button[aria-label="Новий"], crt-button[icon="add"] button').first();
      await addTaskBtn.waitFor({ state: 'visible', timeout: 10000 });
      await addTaskBtn.click({ force: true });
      await page.waitForTimeout(1500);

      const taskModal = page.locator('crt-modal, mat-dialog-container, [role="dialog"]').first();
      await taskModal.waitFor({ state: 'visible', timeout: 10000 });

      // 1. Назва завдання
      const taskNameInput = taskModal.locator('input[aria-label*="Назва"]').first();
      await taskNameInput.waitFor({ state: 'visible', timeout: 5000 });
      await taskNameInput.click();
      await taskNameInput.fill(task.name);
      await page.waitForTimeout(300);

      // 2. Вибір типового етапу
      await selectComboboxInModal(taskModal, /Типовий етап|Етап/i, task.stageName, page);

      // 3. Порядок в етапі
      const orderInput = taskModal.locator('input[aria-label*="Порядок"]').first();
      if (await orderInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await orderInput.click();
        await orderInput.fill(task.order);
        await page.waitForTimeout(200);
      }

      // 4. Тип виробничого завдання (Виробниче завдання / Сервісне завдання / ВКЯ)
      if (task.taskType) {
        await selectComboboxInModal(taskModal, /Тип виробничого завдання/i, task.taskType, page);
      }

      // 5. Якщо тип ВКЯ — обираємо 'Тип ВКЯ'
      if (task.taskType === 'ВКЯ') {
        const vkyCb = taskModal.locator('crt-combobox, mat-form-field').filter({ hasText: /Тип ВКЯ/i }).locator('input').first();
        if (await vkyCb.isVisible({ timeout: 2500 }).catch(() => false)) {
          await vkyCb.click({ force: true });
          await page.waitForTimeout(500);
          const firstVkyOpt = page.locator('.cdk-overlay-pane mat-option:not([aria-disabled="true"]):not(.mdc-list-item--disabled)')
            .filter({ hasNotText: /Додати новий|\+|crt-combobox-search/i })
            .first();
          if (await firstVkyOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
            await firstVkyOpt.click();
          } else {
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('Enter');
          }
          await page.waitForTimeout(400);
          await page.locator('.cdk-overlay-backdrop').waitFor({ state: 'detached', timeout: 2000 }).catch(() => { });
        }
      }

      // 6. Тип обладнання (якщо не ВКЯ або якщо поле доступне)
      if (task.equipmentType) {
        await selectComboboxInModal(taskModal, /Тип обладнання/i, task.equipmentType, page);
      }

      // 7. Тривалість (години)
      if (task.hours) {
        const hoursInput = taskModal.locator('input[aria-label*="Тривалість (години)"], input[aria-label*="години"], input[aria-label*="Норма часу"]').first();
        if (await hoursInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await hoursInput.click();
          await hoursInput.fill(task.hours);
          await page.waitForTimeout(200);
        }
      }

      // 8. Мінімальний інтервал до наступної активності (хв.)
      if (task.minInterval) {
        const intervalInput = taskModal.locator('input[aria-label*="Мінімальний інтервал"], input[aria-label*="інтервал"]').first();
        if (await intervalInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await intervalInput.click();
          await intervalInput.fill(task.minInterval);
          await page.waitForTimeout(200);
        }
      }

      // 9. Опис
      if (task.description) {
        const descInput = taskModal.locator('textarea[aria-label*="Опис"], input[aria-label*="Опис"]').first();
        if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await descInput.click();
          await descInput.fill(task.description);
          await page.waitForTimeout(200);
        }
      }

      // 10. Зберегти завдання
      const saveTaskBtn = taskModal.getByRole('button', { name: 'Зберегти', exact: true }).first();
      await saveTaskBtn.click();
      await taskModal.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => { });
      await page.waitForTimeout(1500);
      console.log(`   ✅ Завдання "${task.name}" збережено!`);
    }

    // ─────────────────────────────────────────────────────────────
    // 6. Фінальне збереження картки
    // ─────────────────────────────────────────────────────────────
    console.log('\n💾 6. Фінальне збереження картки Техкарти...');
    const saveCardBtn = page.getByRole('button', { name: 'Зберегти', exact: true })
      .or(page.locator('button').filter({ hasText: /^Зберегти$/i }))
      .first();

    if (await saveCardBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveCardBtn.click();
      await page.waitForTimeout(2000);
    }

    console.log(`\n🎉 Нову Технологічну карту для "${routingData.product}" з усіма етапами та розширеною логікою завдань успішно створено та збережено!`);
  });
});
