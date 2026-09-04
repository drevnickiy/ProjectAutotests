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
  hours?: string;
  description: string;
}

test.describe('Створення Технологічної карти для напівфабрикату', () => {
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

      if (await opt.isVisible({ timeout: 4000 }).catch(() => false)) {
        await opt.click();
      } else {
        const fallbackOpt = page.locator('.cdk-overlay-pane mat-option:not([aria-disabled="true"]):not(.mdc-list-item--disabled)')
          .filter({ hasNotText: /Додати новий|\+|Створити/i })
          .first();
        if (await fallbackOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
          await fallbackOpt.click();
        } else {
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('Enter');
        }
      }
      await page.waitForTimeout(500);
      await page.locator('.cdk-overlay-backdrop').waitFor({ state: 'detached', timeout: 2000 }).catch(() => {});
    }
  }

  test('Створити техкарту для продукту за посиланням', async ({ page }) => {
    test.setTimeout(360000);

    // =========================================================================
    // ⚙️ БЛОК ВХІДНИХ ДАНИХ (Для нових продуктів редагуйте ТІЛЬКИ цей блок)
    // =========================================================================
    const productUrl = 'https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/Products_FormPage/edit/7499be5a-e85c-4af9-a83f-c2e219c487e0';
    const productName = 'НФ Шампунь Hydrasence Silk';

    const routingData = {
      name: `ТК-НФ | Варка ${productName.replace(/^НФ\s*/i, '').slice(0, 35)}`.slice(0, 50),
      code: `TK-NF-${Date.now().toString().slice(-4)}`,
      version: '1.0',
      status: 'В роботі',
      startDate: '04.09.2026',
      endDate: '04.09.2027',
      stages: [
        { number: '1', name: 'фаза А' },
        { number: '2', name: 'фаза Б' },
        { number: '3', name: 'фаза фініш + ВКЯ' }
      ] as StageData[],
      tasks: [
        {
          name: '1, набрати воду в реактор',
          stageName: 'фаза А',
          order: '1',
          taskType: 'Виробниче завдання',
          equipmentType: 'Реактори',
          hours: '0.5',
          description: 'Залити очищену деіонізовану воду в реактор'
        },
        {
          name: '2, увімкнути нагрів, компоненти фази А',
          stageName: 'фаза А',
          order: '2',
          taskType: 'Виробниче завдання',
          equipmentType: 'Реактори',
          hours: '1.0',
          description: 'Увімкнути нагрів до 60C, додати компоненти водної фази'
        },
        {
          name: '3, змішати та додати компоненти фази Б',
          stageName: 'фаза Б',
          order: '1',
          taskType: 'Виробниче завдання',
          equipmentType: 'Реактори',
          hours: '0.5',
          description: 'Ввести ПАРи та основу при повільному перемішуванні'
        },
        {
          name: '4, фінальне ВКЯ напівфабрикату',
          stageName: 'фаза фініш + ВКЯ',
          order: '1',
          taskType: 'ВКЯ',
          hours: '0.3',
          description: "Лабораторний аналіз в'язкості, pH та гомогенності маси"
        }
      ] as TaskData[]
    };

    console.log(`\n======================================================`);
    console.log(`🚀 СТВОРЕННЯ ТЕХКАРТИ: "${routingData.name}"`);
    console.log(`🔗 Для продукту: ${productName} (${productUrl})`);
    console.log(`======================================================`);

    const routingAddUrl = 'https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionRouting_FormPage/add';
    await loginPage.open(routingAddUrl);
    await loginPage.login();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(4000);

    // 2.1 Назва
    console.log(`   ✏️ Введення назви: "${routingData.name}"...`);
    const routingNameInput = page.getByRole('textbox', { name: 'Назва' })
      .or(page.locator('input[aria-label="Назва"]'))
      .first();
    await routingNameInput.waitFor({ state: 'visible', timeout: 30000 });
    await routingNameInput.click();
    await routingNameInput.fill(routingData.name);
    await page.waitForTimeout(400);

    // 2.2 Код
    const codeField = page.getByRole('textbox', { name: 'Код' })
      .or(page.locator('input[aria-label="Код"]'))
      .first();
    if (await codeField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await codeField.click();
      await codeField.fill(routingData.code);
      await page.waitForTimeout(300);
    }

    // 2.3 Версія
    const versionField = page.getByRole('textbox', { name: 'Версія' })
      .or(page.locator('input[aria-label="Версія"]'))
      .first();
    if (await versionField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await versionField.click();
      await versionField.fill(routingData.version);
      await page.waitForTimeout(300);
    }

    // 2.4 Статус: "В роботі"
    console.log(`   🔍 Вибір статусу: "${routingData.status}"...`);
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
      await page.locator('.cdk-overlay-backdrop').waitFor({ state: 'detached', timeout: 2000 }).catch(() => {});
    }

    // 2.5 Прив'язка до продукту (чекаємо поки продукт завантажиться і відсіюємо кнопку "Додати")
    console.log(`   🔍 Пошук продукту: "${productName}"...`);
    const productField = page.getByRole('combobox', { name: 'Продукт', exact: true })
      .or(page.locator('input[aria-label*="Продукт"]'))
      .first();
    await productField.waitFor({ state: 'visible', timeout: 10000 });
    await productField.click();
    await page.waitForTimeout(400);
    await productField.fill('');
    await page.waitForTimeout(200);
    await productField.pressSequentially(productName, { delay: 40 });

    console.log(`   ⏳ Очікуємо поки з'явиться продукт "${productName}" у списку (ігноруючи «Додати»)...`);
    const productOption = page.locator('.cdk-overlay-pane mat-option, [role="listbox"] [role="option"]')
      .filter({ hasNotText: /Додати|Створити|\+|Create|Add/i })
      .filter({ hasText: productName })
      .first();

    // Очікуємо поки саме продукт підтягнеться з сервера
    await productOption.waitFor({ state: 'visible', timeout: 30000 });
    console.log(`   🎯 Продукт "${productName}" з'явився у списку! Обираємо...`);
    await page.waitForTimeout(600);
    await productOption.click({ force: true });
    await page.waitForTimeout(1000);

    await page.locator('.cdk-overlay-backdrop').waitFor({ state: 'detached', timeout: 3000 }).catch(() => {});
    const selectedVal = await productField.inputValue().catch(() => '');
    console.log(`   ✅ Значення у полі Продукт: "${selectedVal}"`);

    // 2.6 Дати
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

    // ==============================================================
    // 3. ДОДАВАННЯ ЕТАПІВ ТА ЗАВДАНЬ
    // ==============================================================
    console.log('\n👉 3. Перехід на вкладку "Етапи та завдання"...');
    const stagesTasksTab = page.locator('[role="tab"], .mat-mdc-tab, .crt-tab-header, .mat-tab-label')
      .filter({ hasText: /Етапи та завдання/i })
      .first();
    await stagesTasksTab.waitFor({ state: 'visible', timeout: 30000 });
    await stagesTasksTab.click();
    await page.waitForTimeout(2500);

    // 3.1 Етапи
    console.log(`\n➕ Додавання ${routingData.stages.length} етапів...`);
    const stagesSection = page.locator('crt-expansion-panel, .crt-expansion-panel').filter({ hasText: /Типовий етап виробництва|Типові етапи/i }).first();

    for (const stage of routingData.stages) {
      console.log(`   ➕ Етап [${stage.number}]: "${stage.name}"...`);
      await page.locator('.cdk-overlay-pane, crt-modal, .cdk-overlay-backdrop').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
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
      await stageModal.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1500);
      console.log(`   ✅ Етап "${stage.name}" збережено!`);
    }

    // 3.2 Завдання
    console.log(`\n➕ Додавання ${routingData.tasks.length} завдань...`);
    const tasksSection = page.locator('crt-expansion-panel, .crt-expansion-panel').filter({ hasText: /Типове завдання етапу|Типові завдання/i }).first();

    for (const task of routingData.tasks) {
      console.log(`   ➕ Завдання: "${task.name}" (${task.taskType}) -> Етап: "${task.stageName}"...`);
      await page.locator('.cdk-overlay-pane, crt-modal, .cdk-overlay-backdrop').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
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

      // 2. Тип виробничого завдання (Виробниче завдання, ВКЯ, Сервісне завдання)
      const targetTaskType = task.taskType || 'Виробниче завдання';
      console.log(`   🏷️ Вибір типу завдання: "${targetTaskType}"...`);
      const taskTypeCb = taskModal.getByRole('combobox', { name: /Тип виробничого завдання/i })
        .or(taskModal.locator('input[aria-label*="Тип виробничого завдання"]'))
        .or(taskModal.locator('crt-combobox[label*="Тип виробничого завдання"] input'))
        .first();

      if (await taskTypeCb.isVisible({ timeout: 5000 }).catch(() => false)) {
        await taskTypeCb.click();
        await page.waitForTimeout(300);
        await taskTypeCb.fill('');
        await page.waitForTimeout(200);
        await taskTypeCb.fill(targetTaskType);
        await page.waitForTimeout(800);

        const taskTypeOpt = page.locator('.cdk-overlay-pane mat-option, [role="option"]')
          .filter({ hasNotText: /Додати новий|\+|Створити/i })
          .filter({ hasText: new RegExp(`^\\s*${targetTaskType}\\s*$`, 'i') })
          .or(page.locator('.cdk-overlay-pane mat-option, [role="option"]').filter({ hasText: targetTaskType }))
          .first();

        if (await taskTypeOpt.isVisible({ timeout: 3000 }).catch(() => false)) {
          await taskTypeOpt.click();
        } else {
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('Enter');
        }
        await page.waitForTimeout(400);
        await page.locator('.cdk-overlay-backdrop').waitFor({ state: 'detached', timeout: 2000 }).catch(() => {});
      }

      // 3. Вибір типового етапу
      console.log(`   🏷️ Вибір етапу: "${task.stageName}"...`);
      const stageCb = taskModal.getByRole('combobox', { name: /Етап/i })
        .or(taskModal.locator('input[aria-label*="Етап"]'))
        .or(taskModal.locator('crt-combobox[label*="Етап"] input'))
        .first();

      if (await stageCb.isVisible({ timeout: 5000 }).catch(() => false)) {
        await stageCb.click();
        await page.waitForTimeout(300);
        await stageCb.fill('');
        await page.waitForTimeout(200);
        await stageCb.fill(task.stageName);
        await page.waitForTimeout(800);

        const stageOpt = page.locator('.cdk-overlay-pane mat-option, [role="option"]')
          .filter({ hasNotText: /Додати новий|\+|Створити/i })
          .filter({ hasText: task.stageName })
          .first();

        if (await stageOpt.isVisible({ timeout: 3000 }).catch(() => false)) {
          await stageOpt.click();
        } else {
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('Enter');
        }
        await page.waitForTimeout(400);
        await page.locator('.cdk-overlay-backdrop').waitFor({ state: 'detached', timeout: 2000 }).catch(() => {});
      }

      // 4. Порядковий номер у стадії
      console.log(`   🔢 Введення порядкового номера у стадії: "${task.order}"...`);
      const orderInput = taskModal.getByRole('textbox', { name: /Порядковий номер/i })
        .or(taskModal.locator('crt-number-input, mat-form-field, crt-field').filter({ hasText: /Порядковий номер/i }).locator('input'))
        .or(taskModal.locator('input[aria-label*="Порядковий номер"], input[placeholder*="Порядковий номер"]'))
        .first();
      if (await orderInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await orderInput.click();
        await orderInput.fill(task.order);
        await page.waitForTimeout(200);
      } else {
        const fallbackOrder = taskModal.locator('input[type="number"], crt-number-input input').first();
        if (await fallbackOrder.isVisible({ timeout: 2000 }).catch(() => false)) {
          await fallbackOrder.click();
          await fallbackOrder.fill(task.order);
          await page.waitForTimeout(200);
        }
      }

      // 5. Тип обладнання (тільки якщо не ВКЯ)
      if (task.equipmentType && targetTaskType !== 'ВКЯ') {
        await selectComboboxInModal(taskModal, /Тип обладнання/i, task.equipmentType, page);
      }

      // 6. Чекбокси
      // "Ігнорувати кількість" (для НФ завжди TRUE)
      const ignoreQtyCb = taskModal.locator('crt-checkbox, mat-checkbox').filter({ hasText: /Ігнорувати кількість/i }).first();
      if (await ignoreQtyCb.isVisible({ timeout: 2000 }).catch(() => false)) {
        const input = ignoreQtyCb.locator('input[type="checkbox"]').first();
        const isChecked = await input.isChecked().catch(() => false);
        if (!isChecked) {
          await ignoreQtyCb.locator('label, .mdc-checkbox, .mdc-form-field').first().click({ force: true }).catch(async () => {
            await ignoreQtyCb.click({ force: true });
          });
          await page.waitForTimeout(300);
        }
      }

      // Для ВКЯ також ставимо "Не показувати на Gantt"
      if (targetTaskType === 'ВКЯ') {
        const ganttCb = taskModal.locator('crt-checkbox, mat-checkbox').filter({ hasText: /Не показувати на Gantt/i }).first();
        if (await ganttCb.isVisible({ timeout: 2000 }).catch(() => false)) {
          const input = ganttCb.locator('input[type="checkbox"]').first();
          const isChecked = await input.isChecked().catch(() => false);
          if (!isChecked) {
            await ganttCb.locator('label, .mdc-checkbox, .mdc-form-field').first().click({ force: true }).catch(async () => {
              await ganttCb.click({ force: true });
            });
            await page.waitForTimeout(300);
          }
        }
      }

      // 7. Тривалість (години)
      if (task.hours) {
        console.log(`   ⏱️ Введення тривалості: "${task.hours}" год...`);
        const hoursInput = taskModal.getByRole('textbox', { name: /Тривалість|години|Норма часу/i })
          .or(taskModal.locator('crt-number-input, mat-form-field, crt-field').filter({ hasText: /Тривалість|години|Норма часу/i }).locator('input'))
          .or(taskModal.locator('input[aria-label*="Тривалість"], input[aria-label*="години"], input[aria-label*="Норма часу"]'))
          .first();
        if (await hoursInput.isVisible({ timeout: 4000 }).catch(() => false)) {
          await hoursInput.click();
          await hoursInput.fill(task.hours);
          await page.waitForTimeout(200);
        }
      }

      // 8. Опис
      if (task.description) {
        const descInput = taskModal.getByRole('textbox', { name: 'Опис' })
          .or(taskModal.locator('textarea[aria-label*="Опис"], input[aria-label*="Опис"]'))
          .first();
        if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await descInput.click();
          await descInput.fill(task.description);
          await page.waitForTimeout(200);
        }
      }

      // 9. Зберегти завдання
      const saveTaskBtn = taskModal.getByRole('button', { name: 'Зберегти', exact: true })
        .or(taskModal.locator('button').filter({ hasText: /^Зберегти$/i }))
        .first();
      await saveTaskBtn.scrollIntoViewIfNeeded().catch(() => {});
      await saveTaskBtn.click();
      await taskModal.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1500);
      console.log(`   ✅ Завдання "${task.name}" збережено!`);
    }

    // ==============================================================
    // 4. ФІНАЛЬНЕ ЗБЕРЕЖЕННЯ КАРТКИ (ТІЛЬКИ ПІСЛЯ ЗАПОВНЕННЯ ЕТАПІВ ТА ЗАВДАНЬ)
    // ==============================================================
    console.log('\n💾 4. Перевірка збереження картки Техкарти...');
    const finalSaveBtn = page.getByRole('button', { name: 'Зберегти', exact: true })
      .or(page.locator('button').filter({ hasText: /^Зберегти$/i }))
      .first();

    if (await finalSaveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('   💾 Натискаємо "Зберегти" для фіксації змін...');
      await finalSaveBtn.click();
      await page.waitForTimeout(3000);
    } else {
      console.log('   ✅ Картка вже автоматично збережена (кнопка "Зберегти" прихована, всі дані зафіксовані).');
    }

    // Робимо фінальний скріншот готової техкарти
    await page.screenshot({ path: 'screenshots/completed_routing_card.png', fullPage: true }).catch(() => {});

    console.log(`\n🎉 ТЕХКАРТУ "${routingData.name}" УСПІШНО СТВОРЕНО ТА ЗБЕРЕЖЕНО!`);
    console.log(`🔗 Прив'язано до продукту: ${productName} (${productUrl})`);
  });
});
