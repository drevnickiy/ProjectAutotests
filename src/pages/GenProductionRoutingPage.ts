import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export interface StageData {
  number?: string;
  name: string;
  duration?: string;
}

export interface TaskData {
  name: string;
  stageName: string;
  stageNumber?: string;
  orderInStage?: string;
  taskNumber?: string;
  description?: string;
  productType?: string;
  taskType?: string;
  equipmentType?: string;
  hours?: string;
  duration?: string;
  ignoreQuantity?: boolean;
  minInterval?: string;
  linkedTask?: string;
}

export class GenProductionRoutingPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Переход в раздел Технологічні карти (ListPage)
   */
  async openListPage(): Promise<void> {
    await this.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionRouting_ListPage');
    await this.waitForCardLoaded('Назва');
  }

  /**
   * Переход на страницу добавления Технологічної карти (FormPage/add)
   */
  async openAddCard(): Promise<void> {
    await this.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionRouting_FormPage/add');
    await this.waitForCardLoaded('Назва');
  }

  /**
   * Переход в карточку Технологічної карти по прямому URL (для продукта ТК-GP-001 Шампунь)
   */
  async openCardById(
    directUrl: string = 'https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionRouting_FormPage/edit/8f49d3f5-17e7-4c71-b50b-58f0f554a460'
  ): Promise<void> {
    await this.page.goto(directUrl, { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(3000);
  }

  /**
   * Добавление нового этапа
   */
  async addStage(data: StageData): Promise<void> {
    const stagePanel = this.page.locator('crt-expansion-panel')
      .filter({ hasText: /Standard operation task|List Production Stage Template|Типовий етап виробництва/i })
      .first()
      .or(this.page.locator('crt-expansion-panel').first());
    const existing = stagePanel.locator('.crt-grid, [role="grid"]')
      .locator('.crt-grid-cell, [role="gridcell"]')
      .filter({ hasText: data.name })
      .first();
    if (await existing.isVisible({ timeout: 1500 }).catch(() => false)) {
      console.log(`   ℹ️ Етап [${data.number}] "${data.name}" вже існує, пропускаємо.`);
      return;
    }

    const stageBtn = stagePanel.locator('button[aria-label="Новий"], button[title="Новий"], button[aria-label="New"], button[title="New"]').first();

    await stageBtn.scrollIntoViewIfNeeded().catch(() => { });
    await stageBtn.click({ force: true });
    await this.page.waitForTimeout(1000);

    const modal = this.page.getByRole('dialog').last()
      .or(this.page.locator('crt-modal, crt-modal-page, mat-dialog-container, [role="dialog"]').last());
    await modal.waitFor({ state: 'visible', timeout: 10000 });

    const numberInput = modal.getByRole('textbox', { name: /Номер|Number/i, exact: true })
      .or(modal.locator('input[aria-label="Number"], input[aria-label="Номер"]'))
      .first();
    const stageNum = String(data.number || (data.name.match(/\d+/) ? data.name.match(/\d+/)![0] : '1'));
    if (await numberInput.isVisible().catch(() => false)) {
      await numberInput.click();
      await numberInput.fill(stageNum);
    }

    const nameInput = modal.getByRole('textbox', { name: /Назва|Name/i, exact: true })
      .or(modal.locator('input[aria-label="Name"], input[aria-label="Назва"]'))
      .first();
    await nameInput.click();
    const truncatedStageName = data.name.slice(0, 50).trim();
    await nameInput.fill(truncatedStageName);

    const saveBtn = modal.getByRole('button', { name: /Зберегти|Save/i, exact: true })
      .or(modal.locator('button').filter({ hasText: /Зберегти|Save/i }))
      .first();
    await saveBtn.click();
    await modal.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => { });
    await this.page.waitForTimeout(1200);
  }

  /**
   * Добавление нового задания в строгом порядке:
   * 1. Назва
   * 2. Тип виробничого завдання
   * 3. Етап
   * 4. Порядковий номер у стадії
   * 5. Опис
   * 6. Тип обладнання
   * 7. Чекбокси (для ВКЯ)
   * 8. Тривалість (години)
   * 9. Зберегти (в самому кінці)
   */
  async addTask(data: TaskData): Promise<void> {
    const taskPanel = this.page.locator('crt-expansion-panel')
      .filter({ hasText: /Standard production operation|List Production Stage Task Template|Типове завдання етапу/i })
      .first()
      .or(this.page.locator('crt-expansion-panel').nth(1));
    const existingTask = taskPanel.locator('.crt-grid, [role="grid"]')
      .locator('.crt-grid-cell, [role="gridcell"]')
      .filter({ hasText: data.name })
      .first();
    if (await existingTask.isVisible({ timeout: 1500 }).catch(() => false)) {
      console.log(`   ℹ️ Завдання "${data.name}" вже існує, пропускаємо.`);
      return;
    }

    // Закриття будь-яких діалогів незбережених змін або завислих модалок
    const unsavedDialog = this.page.getByRole('dialog').filter({ hasText: /unsaved changes|незбережені зміни/i }).first();
    if (await unsavedDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
      const discardBtn = unsavedDialog.getByRole('button', { name: /Don't save|Не зберігати/i }).first();
      if (await discardBtn.isVisible().catch(() => false)) {
        await discardBtn.click();
        await this.page.waitForTimeout(500);
      }
    }

    const existingModals = this.page.locator('mat-dialog-container, crt-modal-page, [role="dialog"]');
    if (await existingModals.count() > 0) {
      const cancelBtn = existingModals.last().getByRole('button', { name: /Скасувати|Cancel/i }).first();
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click().catch(() => { });
        await this.page.waitForTimeout(800);
      }
    }

    // Кнопка створення нового завдання
    const taskBtn = taskPanel.locator('button[aria-label="Новий"], button[title="Новий"], button[aria-label="New"], button[title="New"]').first();
    await taskBtn.scrollIntoViewIfNeeded().catch(() => { });
    await taskBtn.click({ force: true });

    // Очікуємо появи модального вікна
    const modal = this.page.getByRole('dialog').last()
      .or(this.page.locator('crt-modal, crt-modal-page, mat-dialog-container, [role="dialog"]').last());
    await modal.waitFor({ state: 'visible', timeout: 10000 });

    // 1. Назва (строго всередині модального вікна)
    const taskNameInput = modal.getByRole('textbox', { name: /Назва|Name/i }).first();
    await taskNameInput.waitFor({ state: 'visible', timeout: 10000 });
    await taskNameInput.click();
    await taskNameInput.fill(data.name);

    // 2. Тип виробничого завдання
    const targetTaskType = data.taskType || 'Виробниче завдання';
    const taskTypeCombobox = modal.getByRole('combobox', { name: /Тип виробничого завдання|Task type|Type/i }).first();
    if (await taskTypeCombobox.isVisible().catch(() => false)) {
      await taskTypeCombobox.click();
      await this.page.waitForTimeout(500);
      await taskTypeCombobox.fill(targetTaskType);
      await this.page.waitForTimeout(500);

      const taskTypeOptions = this.page.locator('.mat-mdc-option, [role="option"], .crt-combobox-list-item, div[role="option"]');
      const matchedTaskType = taskTypeOptions.filter({ hasText: targetTaskType }).first();

      if (await matchedTaskType.isVisible().catch(() => false)) {
        await matchedTaskType.click();
      } else {
        await this.page.keyboard.press('ArrowDown');
        await this.page.keyboard.press('Enter');
      }
      await this.page.waitForTimeout(500);
    }

    // 3. Етап
    const stageCombobox = modal.getByRole('combobox', { name: /Етап|Stage/i }).first();
    await stageCombobox.click();
    await this.page.waitForTimeout(500);
    await stageCombobox.fill(data.stageName);
    await this.page.waitForTimeout(500);

    const options = this.page.locator('.mat-mdc-option, [role="option"], .crt-combobox-list-item, div[role="option"]');
    const stageOption = options.filter({ hasText: data.stageName }).first();
    const numOption = data.stageNumber ? options.filter({ hasText: new RegExp(`^${data.stageNumber}\\b`, 'i') }).first() : null;

    if (await stageOption.isVisible().catch(() => false)) {
      await stageOption.click();
    } else if (numOption && (await numOption.isVisible().catch(() => false))) {
      await numOption.click();
    } else {
      await this.page.keyboard.press('ArrowDown');
      await this.page.keyboard.press('Enter');
    }
    await this.page.waitForTimeout(500);

    // 4. Порядковий номер у стадії (Sequence number in stage)
    const orderVal = data.orderInStage || (data.name.match(/^(\d+)/) ? data.name.match(/^(\d+)/)![1] : '1');
    const orderInput = modal.getByRole('textbox', { name: /Sequence number in stage|Порядковий номер|Order in stage/i })
      .or(modal.locator('input[aria-label*="Sequence number" i], input[aria-label*="Порядковий номер" i], input[placeholder*="Порядковий номер" i], input[aria-label*="Order" i]'))
      .first();
    if (await orderInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orderInput.click();
      await orderInput.fill(String(orderVal));
    }

    // 4.1. Номер (черговість виконання завдання) (якщо є)
    const taskNumberValue = data.taskNumber !== undefined && data.taskNumber !== ''
      ? String(data.taskNumber)
      : String(orderVal);
    const numberInput = modal.getByRole('textbox', { name: /Номер|Number/i, exact: true })
      .or(modal.getByPlaceholder(/черговість виконання завдання/i))
      .or(modal.locator('input[aria-label="Номер"], input[aria-label="Number"], input[placeholder*="черговість"]'))
      .first();
    if (await numberInput.isVisible({ timeout: 1500 }).catch(() => false)) {
      await numberInput.click();
      await numberInput.fill(taskNumberValue);
    }

    // 5. Опис
    if (data.description) {
      const descInput = modal.getByRole('textbox', { name: /Опис|Description/i }).first();
      await descInput.click();
      await descInput.fill(data.description);
    }

    // 6. Тип обладнання (якщо не ВКЯ)
    if (data.equipmentType && data.taskType !== 'ВКЯ') {
      const targetEquip = data.equipmentType;
      const equipCombobox = modal.getByRole('combobox', { name: /Equipment type|Тип обладнання/i })
        .or(modal.locator('crt-combobox').filter({ hasText: /Equipment type|Тип обладнання/i }).locator('input'))
        .first();
      if (await equipCombobox.isVisible({ timeout: 2000 }).catch(() => false)) {
        await equipCombobox.click();
        await this.page.waitForTimeout(500);
        await equipCombobox.fill(targetEquip);
        await this.page.waitForTimeout(500);

        const exactOption = this.page.getByRole('option', { name: targetEquip, exact: true }).first();
        const exactLocator = this.page
          .locator('.mat-mdc-option, [role="option"], .crt-combobox-list-item, div[role="option"]')
          .filter({ hasText: new RegExp(`^\\s*${targetEquip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i') })
          .first();

        if (await exactOption.isVisible().catch(() => false)) {
          await exactOption.click();
        } else if (await exactLocator.isVisible().catch(() => false)) {
          await exactLocator.click();
        } else {
          await this.page.keyboard.press('ArrowDown');
          await this.page.keyboard.press('Enter');
        }
        await this.page.waitForTimeout(500);
      }
    }

    // 7. Чекбокси для ВКЯ або ignoreQuantity (Ігнорувати кількість / Не показувати на Gantt)
    const shouldIgnoreQty = data.ignoreQuantity === true || data.taskType === 'ВКЯ' || data.name.includes('ВКЯ');
    if (shouldIgnoreQty) {
      console.log(`   ☑️ Встановлення чекбокса "Ignore quantity"...`);
      const ignoreQtyCb = modal.getByRole('checkbox', { name: /Ignore quantity|Ігнорувати кількість/i })
        .or(modal.locator('crt-checkbox, mat-checkbox').filter({ hasText: /Ignore quantity|Ігнорувати кількість/i }))
        .first();
      if (await ignoreQtyCb.isVisible({ timeout: 2000 }).catch(() => false)) {
        const isChecked = await ignoreQtyCb.isChecked().catch(() => false);
        if (!isChecked) {
          await ignoreQtyCb.click({ force: true });
          await this.page.waitForTimeout(300);
        }
      }

      if (data.taskType === 'ВКЯ' || data.name.includes('ВКЯ')) {
        const ganttCb = modal.getByRole('checkbox', { name: /Не показувати на Gantt|Do not show on Gantt/i })
          .or(modal.locator('crt-checkbox, mat-checkbox').filter({ hasText: /Не показувати на Gantt|Do not show on Gantt/i }))
          .first();
        if (await ganttCb.isVisible({ timeout: 2000 }).catch(() => false)) {
          const isChecked = await ganttCb.isChecked().catch(() => false);
          if (!isChecked) {
            await ganttCb.click({ force: true });
            await this.page.waitForTimeout(300);
          }
        }
      }
    }

    // 8. Тривалість (хвилини / години)
    const durVal = data.duration !== undefined ? data.duration : (data.hours !== undefined ? String(Number(data.hours) * 60) : undefined);
    if (durVal !== undefined) {
      const minInput = modal.getByRole('textbox', { name: /Duration \(minutes\)|Тривалість \(хвилини\)/i })
        .or(modal.locator('input[aria-label*="Duration (minutes)" i], input[aria-label*="хвилини" i], input[placeholder*="хвилини" i]'))
        .first();
      if (await minInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await minInput.click();
        await minInput.fill(String(durVal));
      } else {
        const hoursInput = modal.getByRole('textbox', { name: /Duration \(hours\)|Тривалість \(години\)/i })
          .or(modal.locator('input[aria-label*="Duration (hours)" i], input[aria-label*="години" i], input[placeholder*="години" i]'))
          .first();
        if (await hoursInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await hoursInput.click();
          await hoursInput.fill(String(durVal));
        }
      }
    }

    // 9. Додавання обов'язкової ролі («Для збереження запису додайте хоча б одну роль»)
    const roleSection = modal.locator('crt-expansion-panel, div').filter({ hasText: /Роль в типовому завданні/i }).last();
    await roleSection.scrollIntoViewIfNeeded().catch(() => { });
    await this.page.waitForTimeout(400);

    const addRoleBtn = roleSection.getByRole('button', { name: /Add new record|New|Новий/i }).first()
      .or(roleSection.locator('button[aria-label="Новий"], button[title="Новий"]').first())
      .or(roleSection.locator('.crt-grid, [role="grid"]').locator('button').filter({ hasText: /New|Новий/i }).first())
      .or(modal.getByRole('button', { name: 'Add new record' }).first());

    await addRoleBtn.scrollIntoViewIfNeeded().catch(() => { });
    if (await addRoleBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log(`   👤 Додавання обов'язкової ролі для завдання...`);
      await addRoleBtn.click({ force: true });
      await this.page.waitForTimeout(1000);

      // 1) Якщо відкрився випадаючий список ролей (Regular worker / Section manager)
      const roleOption = this.page.getByRole('option', { name: /Regular worker/i }).first()
        .or(this.page.getByRole('listbox').getByRole('option').first())
        .or(this.page.locator('.mat-mdc-option, [role="option"]').filter({ hasText: /Regular worker/i }).first());

      if (await roleOption.isVisible({ timeout: 4000 }).catch(() => false)) {
        await roleOption.click({ force: true });
        await this.page.waitForTimeout(500);
      } else {
        await this.page.keyboard.press('ArrowDown');
        await this.page.waitForTimeout(300);
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(400);
      }

      // Якщо з'явилася плаваюча кнопка "Save all" (Зберегти всі) для рядка ролі
      const saveAllBtn = this.page.getByRole('button', { name: /Save all|Зберегти всі/i })
        .or(this.page.locator('button').filter({ hasText: /Save all|Зберегти всі/i }))
        .or(this.page.getByText(/Save all|Зберегти всі/i))
        .first();
      if (await saveAllBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        console.log(`   💾 Фіксація ролі через плаваючу кнопку "Save all"...`);
        await saveAllBtn.click({ force: true });
        await this.page.waitForTimeout(400);
      } else {
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(300);
      }

      // Клік по заголовку модалки для зняття фокусу з інлайн таблиці
      await modal.getByRole('heading').first().click({ force: true }).catch(() => { });
      await this.page.waitForTimeout(300);
    }

    // 10. Зберегти завдання та закрити модалку
    const saveBtn = modal.getByRole('button', { name: /Зберегти|Save/i })
      .or(modal.locator('button').filter({ hasText: /^(Зберегти|Save)$/i }))
      .last();
    await saveBtn.scrollIntoViewIfNeeded().catch(() => { });
    await saveBtn.click({ force: true });
    await this.page.waitForTimeout(800);

    // Якщо раптом з'явився діалог незбережених змін - миттєво підтверджуємо
    const promptDialog = this.page.getByRole('dialog')
      .filter({ hasText: /unsaved changes|незбережені зміни/i })
      .first();
    if (await promptDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('   ⚡ Закриття діалогу підтвердження незбережених змін...');
      const exactSave = promptDialog.getByRole('button', { name: 'Save', exact: true }).first();
      if (await exactSave.isVisible({ timeout: 1000 }).catch(() => false)) {
        await exactSave.click({ force: true });
      } else {
        const discardBtn = promptDialog.getByRole('button', { name: /Don't save|Не зберігати/i }).first();
        await discardBtn.click({ force: true }).catch(() => { });
      }
      await this.page.waitForTimeout(600);
    }

    await modal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => { });
    if (await modal.isVisible().catch(() => false)) {
      const promptAgain = this.page.getByRole('dialog').filter({ hasText: /unsaved changes|незбережені зміни/i }).first();
      if (await promptAgain.isVisible({ timeout: 1000 }).catch(() => false)) {
        await promptAgain.getByRole('button', { name: /Don't save|Не зберігати|Save/i }).first().click({ force: true }).catch(() => { });
        await this.page.waitForTimeout(400);
      }
      const cancelBtn = modal.getByRole('button', { name: /Cancel|Скасувати/i }).first();
      await cancelBtn.click({ force: true }).catch(() => { });
      await this.page.waitForTimeout(500);
    }
    await this.page.waitForTimeout(600);
  }

  /**
   * Зв'язування завдання з іншим завданням через "Пов'язаний шаблон завдання"
   */
  async linkTask(taskName: string, targetTaskName: string): Promise<void> {
    console.log(`🔗 Зв'язування завдання "${taskName}" ➔ "${targetTaskName}"...`);
    const taskPanel = this.page.locator('crt-expansion-panel').filter({ hasText: /Типове завдання етапу/i });
    const taskLink = taskPanel.locator('.crt-grid, [role="grid"]')
      .locator('.crt-grid-cell, [role="gridcell"]')
      .locator('a, .crt-link')
      .filter({ hasText: taskName })
      .first();

    if (!await taskLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log(`   ⚠️ Завдання "${taskName}" не знайдено для зв'язування`);
      return;
    }

    await taskLink.scrollIntoViewIfNeeded().catch(() => { });
    await taskLink.click({ force: true });

    const modal = this.page.locator('mat-dialog-container, crt-modal-page, [role="dialog"]').last();
    await modal.waitFor({ state: 'visible', timeout: 10000 });

    const linkedCombobox = modal.getByRole('combobox', { name: /Пов'язаний шаблон завдання/i })
      .or(modal.locator('crt-combobox').filter({ hasText: /Пов'язаний шаблон завдання/i }))
      .first();

    if (await linkedCombobox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await linkedCombobox.scrollIntoViewIfNeeded().catch(() => { });
      await linkedCombobox.click({ force: true });
      await this.page.waitForTimeout(500);

      const linkedInput = linkedCombobox.locator('input').first();
      if (await linkedInput.isVisible().catch(() => false)) {
        await linkedInput.fill(targetTaskName);
        await this.page.waitForTimeout(600);
      }

      const overlay = this.page.locator('.cdk-overlay-pane, [role="listbox"]').last();
      await overlay.waitFor({ state: 'visible', timeout: 3000 }).catch(() => { });
      const opt = overlay.locator('mat-option, [role="option"]').filter({ hasText: targetTaskName }).first();
      if (await opt.isVisible({ timeout: 2000 }).catch(() => false)) {
        await opt.click({ force: true });
      } else {
        await this.page.keyboard.press('ArrowDown');
        await this.page.keyboard.press('Enter');
      }
      await this.page.waitForTimeout(500);
    }

    const saveBtn = modal.getByRole('button', { name: 'Зберегти', exact: true })
      .or(modal.locator('button').filter({ hasText: /^Зберегти$/i }))
      .first();
    await saveBtn.click({ force: true });
    await modal.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => { });
    await this.page.waitForTimeout(1500);
    console.log(`   ✅ Завдання "${taskName}" успішно зв'язано з "${targetTaskName}"!`);
  }

  /**
   * Додавання сировини/матеріалу на вкладці "ЗАГАЛЬНА ІНФОРМАЦІЯ":
   * Порядок:
   * 1. Назва матеріалу / сировини
   * 2. Одиниця виміру продукту
   * 3. Норма витрат на одиницю
   * 4. Типовий етап - ПРОПУСКАЄМО
   * 5. Зберегти (в самому кінці)
   */
  async addRawMaterial(materialName: string, unit: string = 'кілограм', rate: string): Promise<void> {
    const materialsSection = this.page.locator('crt-expansion-panel')
      .filter({ hasText: /Сировина \/ матеріали|Матеріали для виробництва|Сировина та матеріали/i })
      .first();

    await materialsSection.scrollIntoViewIfNeeded().catch(() => { });

    // Перевірка чи сировина вже є в таблиці
    const existing = materialsSection.locator('.crt-grid, [role="grid"]')
      .locator('.crt-grid-cell, [role="gridcell"]')
      .filter({ hasText: materialName })
      .first();
    if (await existing.isVisible({ timeout: 1500 }).catch(() => false)) {
      console.log(`   ℹ️ Сировина "${materialName}" вже додана, пропускаємо.`);
      return;
    }

    // Кнопка створення
    const addBtn = materialsSection.locator('[icon="add"] button, button[icon="add"], button[title*="Новий"], button[aria-label*="Новий"]')
      .or(materialsSection.getByRole('button', { name: /Новий/i }))
      .or(materialsSection.locator('button').filter({ hasText: /Новий/i }))
      .first();
    await addBtn.scrollIntoViewIfNeeded().catch(() => { });
    await addBtn.click({ force: true });

    // Очікуємо модальне вікно
    const modal = this.page.locator('mat-dialog-container, crt-modal-page, [role="dialog"]').last();
    await modal.waitFor({ state: 'visible', timeout: 10000 });

    // 1. Назва матеріалу / сировини
    const matCombobox = modal.getByRole('combobox', { name: /Назва матеріалу/i })
      .or(modal.locator('crt-combobox').first())
      .first();
    await matCombobox.click({ force: true });
    await this.page.waitForTimeout(400);

    const matInput = matCombobox.locator('input').first();
    if (await matInput.isVisible().catch(() => false)) {
      await matInput.fill(materialName);
      await this.page.waitForTimeout(600);
    }

    const overlay = this.page.locator('.cdk-overlay-pane, [role="listbox"]').last();
    await overlay.waitFor({ state: 'visible', timeout: 4000 }).catch(() => { });

    const validOptions = overlay.locator('mat-option, [role="option"]').filter({
      hasNotText: /Додати новий|\+|Створити/i,
    });

    const exactOpt = validOptions.filter({ hasText: new RegExp(materialName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }).first();
    const firstWord = materialName.split(' ')[0].replace(/["']/g, '');
    const wordOpt = validOptions.filter({ hasText: new RegExp(firstWord, 'i') }).first();

    if (await exactOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
      await exactOpt.click({ force: true });
    } else if (await wordOpt.isVisible({ timeout: 1500 }).catch(() => false)) {
      await wordOpt.click({ force: true });
    } else if (await validOptions.first().isVisible({ timeout: 1500 }).catch(() => false)) {
      await validOptions.first().click({ force: true });
    } else {
      await this.page.keyboard.press('ArrowDown');
      await this.page.keyboard.press('Enter');
    }
    await this.page.keyboard.press('Escape').catch(() => { });
    await this.page.waitForTimeout(400);

    // 2. Одиниця виміру продукту
    const unitCombobox = modal.getByRole('combobox', { name: /Одиниця виміру/i })
      .or(modal.locator('crt-combobox').nth(1))
      .first();
    if (await unitCombobox.isVisible().catch(() => false)) {
      await unitCombobox.click({ force: true });
      await this.page.waitForTimeout(400);

      const unitInput = unitCombobox.locator('input').first();
      if (await unitInput.isVisible().catch(() => false)) {
        await unitInput.fill(unit);
        await this.page.waitForTimeout(500);
      }

      const unitOverlay = this.page.locator('.cdk-overlay-pane, [role="listbox"]').last();
      const unitOpt = unitOverlay.locator('mat-option, [role="option"]').filter({ hasText: new RegExp(unit, 'i') }).first();
      if (await unitOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
        await unitOpt.click({ force: true });
      } else {
        await this.page.keyboard.press('ArrowDown');
        await this.page.keyboard.press('Enter');
      }
      await this.page.keyboard.press('Escape').catch(() => { });
      await this.page.waitForTimeout(400);
    }

    // 3. Норма витрат на одиницю
    const rateInput = modal.locator('input[aria-label*="Норма витрат"], crt-number-input input')
      .or(modal.getByRole('textbox', { name: /Норма витрат/i }))
      .or(modal.locator('input[type="text"]').last())
      .first();
    await rateInput.waitFor({ state: 'visible', timeout: 5000 });
    await rateInput.click({ force: true });
    await rateInput.fill('');
    await rateInput.fill(rate);
    await this.page.waitForTimeout(300);

    // 4. Типовий етап - ПРОПУСКАЄМО

    // 5. Зберегти (в самому кінці)
    const saveBtn = modal.getByRole('button', { name: 'Зберегти', exact: true })
      .or(modal.locator('button').filter({ hasText: /^Зберегти$/i }))
      .first();
    await saveBtn.click({ force: true });
    await modal.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => { });
    await this.page.waitForTimeout(1500);
  }

  /**
   * Встановлення статусу техкарти (завжди "В роботі")
   */
  async setStatus(status: string = 'В роботі'): Promise<void> {
    console.log(`📌 Встановлення статусу техкарти: "${status}"...`);
    const statusCombobox = this.page.getByRole('combobox', { name: /Статус технологічної карти|Статус|Status/i })
      .or(this.page.locator('crt-combobox').filter({ hasText: /Статус|Status/i }))
      .first();

    if (await statusCombobox.isVisible({ timeout: 4000 }).catch(() => false)) {
      await statusCombobox.scrollIntoViewIfNeeded().catch(() => { });
      await statusCombobox.click({ force: true });
      await this.page.waitForTimeout(400);

      const input = statusCombobox.locator('input').first();
      if (await input.isVisible().catch(() => false)) {
        await input.fill(status);
        await this.page.waitForTimeout(500);
      }

      const overlay = this.page.locator('.cdk-overlay-pane, [role="listbox"]').last();
      const candidates = [status, 'В роботі', 'In progress', 'In work', 'Active'];
      let selected = false;
      for (const cand of candidates) {
        const opt = overlay.locator('mat-option, [role="option"]')
          .filter({ hasNotText: /Додати новий|Створити|create|\+/i })
          .filter({ hasText: new RegExp(cand, 'i') })
          .first();
        if (await opt.isVisible({ timeout: 1500 }).catch(() => false)) {
          await opt.click({ force: true });
          selected = true;
          break;
        }
      }

      if (!selected) {
        await this.page.keyboard.press('ArrowDown');
        await this.page.keyboard.press('Enter');
      }
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Встановлення дат дії техкарти (від дати створення на 1 рік вперед)
   */
  async setValidityDates(startDate?: Date): Promise<void> {
    const now = startDate || new Date();
    const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    const formatDate = (d: Date) => {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}.${mm}.${yyyy}`;
    };

    const startStr = formatDate(now);
    const endStr = formatDate(nextYear);

    console.log(`📅 Встановлення дат дії ТК: ${startStr} ➔ ${endStr}...`);

    // Дата початку дії
    const startInput = this.page.getByRole('textbox', { name: /Дата початку дії|Дата початку|Valid from|Start date/i })
      .or(this.page.locator('crt-date-picker, crt-date-time-picker').filter({ hasText: /Дата початку|Valid from|Start date/i }).locator('input'))
      .first();
    if (await startInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startInput.scrollIntoViewIfNeeded().catch(() => { });
      await startInput.click({ force: true });
      await startInput.fill(startStr);
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(300);
    }

    // Дата завершення дії
    const endInput = this.page.getByRole('textbox', { name: /Дата завершення дії|Дата завершення|Valid to|End date/i })
      .or(this.page.locator('crt-date-picker, crt-date-time-picker').filter({ hasText: /Дата завершення|Valid to|End date/i }).locator('input'))
      .first();

    if (await endInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await endInput.scrollIntoViewIfNeeded().catch(() => { });
      await endInput.click({ force: true });
      await endInput.fill(endStr);
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Збереження картки техкарти
   */
  async saveCard(): Promise<void> {
    await this.page.keyboard.press('Escape').catch(() => { });
    await this.page.waitForTimeout(500);
    const cardSave = this.page.getByRole('button', { name: /Зберегти|Save/i })
      .or(this.page.locator('button').filter({ hasText: /^(Зберегти|Save)$/i }))
      .first();
    if (await cardSave.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cardSave.click({ force: true });
      await this.page.waitForTimeout(2500);
    }
  }
}

