import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export interface StageData {
  number: string;
  name: string;
}

export interface TaskData {
  name: string;
  stageName: string;
  stageNumber?: string;
  orderInStage: string;
  description: string;
  productType?: string;
  taskType?: string;
  equipmentType?: string;
  hours?: string;
  minInterval?: string;
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
    const stageBtn = this.page.locator('#FlexContainer_9ssw7lq').getByRole('button', { name: 'Новий' }).first();
    await stageBtn.scrollIntoViewIfNeeded().catch(() => { });
    await stageBtn.click();
    await this.page.waitForTimeout(1000);

    const numberInput = this.page.getByRole('textbox', { name: 'Номер' });
    await numberInput.click();
    await numberInput.fill(data.number);

    const nameInput = this.page.getByRole('textbox', { name: 'Назва' });
    await nameInput.click();
    await nameInput.fill(data.name);

    const saveBtn = this.page.getByRole('button', { name: 'Зберегти' });
    await saveBtn.click();
    await this.page.waitForTimeout(2000);
  }

  /**
   * Добавление нового задания
   */
  async addTask(data: TaskData): Promise<void> {
    const taskBtn = this.page.locator('#FlexContainer_cphjuxl').getByRole('button', { name: 'Новий' }).first();
    await taskBtn.scrollIntoViewIfNeeded().catch(() => { });
    await taskBtn.click();
    await this.page.waitForTimeout(1000);

    const taskNameInput = this.page.getByRole('textbox', { name: 'Назва' });
    await taskNameInput.click();
    await taskNameInput.fill(data.name);

    // Выбор этапа по названию / номеру в выпадающем списке
    const stageCombobox = this.page.getByRole('combobox', { name: 'Етап' });
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

    // Порядковый номер у стадии
    const orderInput = this.page.getByRole('textbox', { name: 'Порядковий номер у стадії' });
    await orderInput.click();
    await orderInput.fill(data.orderInStage);

    // Описание
    const descInput = this.page.getByRole('textbox', { name: 'Опис' });
    await descInput.click();
    await descInput.fill(data.description);

    // Разделение разрешенного оборудования по типу продукции:
    // 1. Готовая продукция: БЕЗ "Реактори"
    const finishedProductEquip = [
      'Змішувач',
      'Маркування та пакування',
      'Прес',
      'Прес-форма',
      'Стерилізатор',
      'Фасування',
    ];

    // 2. Полуфабрикат: включает "Реактори", но БЕЗ "Маркування та пакування" и "Фасування"
    const semiFinishedProductEquip = [
      'Реактори',
      'Змішувач',
      'Прес',
      'Прес-форма',
      'Стерилізатор',
    ];

    const allowedEquipmentTypes = data.productType === 'semifinished' ? semiFinishedProductEquip : finishedProductEquip;
    const targetEquip = data.equipmentType || allowedEquipmentTypes[Math.floor(Math.random() * allowedEquipmentTypes.length)];

    const equipCombobox = this.page.getByRole('combobox', { name: 'Тип обладнання' });
    await equipCombobox.click();
    await this.page.waitForTimeout(500);
    await equipCombobox.fill(targetEquip);
    await this.page.waitForTimeout(500);

    // Точный клик по опции (regex с якорями ^ и $, чтобы 'Змішувач' не совпадал с 'Бетонозмішувач')
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

    // Выбор типа производственного задания (data.taskType или дефолтный)
    const taskTypeCombobox = this.page.getByRole('combobox', { name: 'Тип виробничого завдання' });
    if (await taskTypeCombobox.isVisible().catch(() => false)) {
      await taskTypeCombobox.click();
      await this.page.waitForTimeout(500);

      const targetTaskType = data.taskType || 'Виробниче завдання';
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

    // Если выбран 'ВКЯ' или видно поле 'Тип ВКЯ' — дожидаемся и выбираем случайный доступный вариант
    if (data.taskType === 'ВКЯ' || (await this.page.getByRole('combobox', { name: 'Тип ВКЯ' }).isVisible().catch(() => false))) {
      const vkyCombobox = this.page.getByRole('combobox', { name: 'Тип ВКЯ' });
      await vkyCombobox.waitFor({ state: 'visible', timeout: 10000 }).catch(() => { });
      if (await vkyCombobox.isVisible().catch(() => false)) {
        await vkyCombobox.click();
        await this.page.waitForTimeout(500);

        const vkyOptions = this.page.locator('.mat-mdc-option, [role="option"], .crt-combobox-list-item, div[role="option"]');
        const vkyCount = await vkyOptions.count();
        if (vkyCount > 0) {
          const randomIndex = Math.floor(Math.random() * vkyCount);
          await vkyOptions.nth(randomIndex).click();
        } else {
          await this.page.keyboard.press('ArrowDown');
          await this.page.keyboard.press('Enter');
        }
        await this.page.waitForTimeout(500);
      }
    }

    // Если выбран 'Сервісне завдання' или видно поле 'Тип сервісного завдання' — дожидаемся и выбираем случайный доступный вариант
    if (data.taskType === 'Сервісне завдання' || (await this.page.getByRole('combobox', { name: 'Тип сервісного завдання' }).isVisible().catch(() => false))) {
      const serviceTaskTypeCombobox = this.page.getByRole('combobox', { name: 'Тип сервісного завдання' });
      await serviceTaskTypeCombobox.waitFor({ state: 'visible', timeout: 10000 }).catch(() => { });
      if (await serviceTaskTypeCombobox.isVisible().catch(() => false)) {
        await serviceTaskTypeCombobox.click();
        await this.page.waitForTimeout(500);

        const serviceOptions = this.page.locator('.mat-mdc-option, [role="option"], .crt-combobox-list-item, div[role="option"]');
        const serviceCount = await serviceOptions.count();
        if (serviceCount > 0) {
          const randomIndex = Math.floor(Math.random() * serviceCount);
          await serviceOptions.nth(randomIndex).click();
        } else {
          await this.page.keyboard.press('ArrowDown');
          await this.page.keyboard.press('Enter');
        }
        await this.page.waitForTimeout(500);
      }
    }

    // Длительность (только часы)
    if (data.hours !== undefined) {
      const hoursInput = this.page.getByRole('textbox', { name: 'Тривалість (години)' });
      await hoursInput.click();
      await hoursInput.fill(data.hours);
    }

    // Минимальный интервал
    if (data.minInterval !== undefined) {
      const intervalInput = this.page.getByRole('textbox', { name: 'Мінімальний інтервал до наступної активності (хв.)' });
      await intervalInput.click();
      await intervalInput.fill(data.minInterval);
    }

    // Сохранить
    const saveBtn = this.page.getByRole('button', { name: 'Зберегти' });
    await saveBtn.click();
    await this.page.waitForTimeout(1500);
  }
}
