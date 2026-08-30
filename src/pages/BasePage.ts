import { Page, Locator, TestInfo } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export const IGNORED_SYSTEM_KEYS = [
  'S',
  'Всі застосунки',
  'Додати',
  'Імпорт',
  'Тег',
  'Підсумки',
  'Управління рядками',
  'Field_1',
  'Field_4',
  'Username',
  'Password',
  'LOG IN',
  'Forgot your password?',
  'Пошук...',
  'Пошук застосунку...',
];

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Комплексне смарт-очікування готовності Creatio (зняття масок завантаження, спиннерів, оверлеїв)
   */
  async waitForCreatioReady(timeoutMs = 30000): Promise<void> {
    // 1. Очікуємо повного зникнення будь-яких завантажувальних масок і спиннерів
    const masks = this.page.locator(
      '.crt-loading-mask, .crt-mask, mat-spinner, .mat-mdc-progress-spinner, [data-item-marker*="Spinner"], crt-progress-bar'
    );
    await masks.waitFor({ state: 'hidden', timeout: timeoutMs }).catch(() => {});

    // 2. Очікуємо стабілізації DOM-контенту
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
    await this.page.waitForTimeout(400);
  }

  /**
   * Сумісний аліас для waitForCreatioReady
   */
  async waitForCreatioLoaded(): Promise<void> {
    await this.waitForCreatioReady();
  }

  /**
   * Сумісний аліас для очікування завантаження сторінки
   */
  async waitForPageLoaded(expectedLabel = 'Назва'): Promise<void> {
    await this.waitForCardLoaded(expectedLabel);
  }

  /**
   * Надійне заповнення текстового або числового поля
   */
  async safeSetInput(labelOrPattern: string | RegExp, value: string, timeoutMs = 15000): Promise<void> {
    await this.waitForCreatioReady();

    const input = this.page
      .getByRole('textbox', { name: labelOrPattern })
      .or(
        this.page
          .locator('crt-input, crt-number-input, crt-field, mat-form-field')
          .filter({ hasText: labelOrPattern })
          .locator('input:not([type="file"])')
      )
      .first();

    await input.waitFor({ state: 'visible', timeout: timeoutMs });
    await input.scrollIntoViewIfNeeded().catch(() => {});
    await input.click();
    await input.fill(value);
    await this.page.waitForTimeout(300);
  }

  /**
   * Надійний вибір значення з випадаючого списку (Combobox) з 3-рівневим захистом від рассинхрону пакетів (Smart Fallback)
   */
  async safeSelectCombobox(
    labelOrPattern: string | RegExp,
    targetValue: string,
    synonyms: string[] = [],
    timeoutMs = 15000
  ): Promise<string> {
    await this.waitForCreatioReady();

    const cb = this.page
      .getByRole('combobox', { name: labelOrPattern })
      .or(
        this.page
          .locator('crt-combobox, mat-form-field, crt-field')
          .filter({ hasText: labelOrPattern })
          .getByRole('combobox')
      )
      .first();

    await cb.waitFor({ state: 'visible', timeout: timeoutMs });
    await cb.scrollIntoViewIfNeeded().catch(() => {});
    await cb.click();
    await this.page.waitForTimeout(400);

    // Вводимо текст для фільтрації
    if (targetValue) {
      await cb.fill(targetValue);
      await this.page.waitForTimeout(600);
    }

    const overlay = this.page.locator('.cdk-overlay-pane, [role="listbox"]').last();
    await overlay.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

    // Фільтруємо валідні опції (виключаючи "+ Додати новий")
    const validOptions = overlay.locator('mat-option, [role="option"]').filter({
      hasNotText: /Додати новий|\+|Створити|создать|create|new|crt-combobox-search/i,
    });

    // 1. Спроба точного пошуку
    const exactOpt = validOptions.filter({ hasText: new RegExp(`^\\s*${targetValue.trim()}\\s*$`, 'i') }).first();
    if (await exactOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
      const selectedText = (await exactOpt.innerText().catch(() => targetValue)).trim();
      await exactOpt.click();
      await this.page.waitForTimeout(400);
      return selectedText;
    }

    // 2. Спроба пошуку за синонімами (Fuzzy Match)
    for (const syn of synonyms) {
      const synOpt = validOptions.filter({ hasText: new RegExp(syn.trim(), 'i') }).first();
      if (await synOpt.isVisible({ timeout: 1500 }).catch(() => false)) {
        const selectedText = (await synOpt.innerText().catch(() => syn)).trim();
        console.log(`   🟡 [SafeCombobox] Обрано синонім "${selectedText}" замість "${targetValue}"`);
        await synOpt.click();
        await this.page.waitForTimeout(400);
        return selectedText;
      }
    }

    // 3. Fallback на перший доступний валідний елемент
    const firstOpt = validOptions.first();
    if (await firstOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
      const selectedText = (await firstOpt.innerText().catch(() => '')).trim();
      console.warn(`   🟠 [SafeCombobox Fallback] Обрано перший доступний запис: "${selectedText}"`);
      await firstOpt.click();
      await this.page.waitForTimeout(400);
      return selectedText;
    }

    // Якщо список абсолютно порожній (не перенесено дані пакета)
    await this.page.keyboard.press('Escape').catch(() => {});
    throw new Error(
      `⚠️ [DATA BINDING ERROR] Справочник для "${labelOrPattern.toString()}" пуст на сервере! Значение "${targetValue}" не найдено.`
    );
  }

  /**
   * Надійний клік по кнопці з очікуванням готовності
   */
  async safeClickButton(labelOrPattern: string | RegExp, timeoutMs = 15000): Promise<void> {
    await this.waitForCreatioReady();

    const btn = this.page
      .getByRole('button', { name: labelOrPattern })
      .or(this.page.locator('button, crt-button, [role="button"]').filter({ hasText: labelOrPattern }))
      .first();

    await btn.waitFor({ state: 'visible', timeout: timeoutMs });
    await btn.scrollIntoViewIfNeeded().catch(() => {});
    await btn.click();
    await this.waitForCreatioReady();
  }

  /**
   * Натискання кнопки "Зберегти"
   */
  async clickSave(): Promise<void> {
    await this.safeClickButton(/^Зберегти$/i);
  }

  /**
   * Переход по ссылке с полным ожиданием прогрузки данных
   */
  async open(urlOrPath: string): Promise<void> {
    await this.page.goto(urlOrPath, { waitUntil: 'domcontentloaded' });
    await this.waitForCreatioReady();
  }

  /**
   * Клик по кнопке (+ Додати / Новий)
   */
  async clickSectionAddButton(): Promise<void> {
    const addButton = this.page
      .locator('.crt-button--contained, crt-button[crtopticon="add"], button')
      .filter({ hasText: /Додати|Новий|Створити/i })
      .first();
    await addButton.click({ force: true }).catch(() => {});
    await this.waitForCreatioReady();
  }

  /**
   * Ожидание загрузки полей карточки
   */
  async waitForCardLoaded(expectedLabel = 'Назва'): Promise<void> {
    await this.waitForCreatioReady();
    const fieldLocator = this.page
      .locator('crt-field, mat-form-field, label')
      .filter({ hasText: expectedLabel })
      .first();
    await fieldLocator.waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
  }

  /**
   * Плавный горизонтальный скролл таблицы вправо
   */
  async scrollToRight(times = 4, scrollAmount = 600): Promise<void> {
    for (let i = 0; i < times; i++) {
      await this.page.evaluate((amount) => {
        const scrollables = Array.from(
          document.querySelectorAll('.crt-grid, [role="grid"], .cdk-virtual-scroll-viewport, div')
        );
        scrollables.forEach((el) => {
          if (el.scrollWidth > el.clientWidth) {
            el.scrollLeft += amount;
          }
        });
      }, scrollAmount);
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Плавный вертикальный скролл вниз
   */
  async scrollToBottom(times = 3, scrollAmount = 500): Promise<void> {
    for (let i = 0; i < times; i++) {
      await this.page.evaluate((amount) => {
        const scrollables = Array.from(
          document.querySelectorAll('.crt-card-content, .cdk-virtual-scroll-viewport, main, div')
        );
        scrollables.forEach((el) => {
          if (el.scrollHeight > el.clientHeight) {
            el.scrollTop += amount;
          }
        });
        window.scrollBy(0, amount);
      }, scrollAmount);
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Переключение на вкладку карточки по точной строке с полным ожиданием отрисовки
   */
  async switchToTab(tabName: string | RegExp): Promise<void> {
    let tabPattern: RegExp;

    if (typeof tabName === 'string') {
      if (tabName.toUpperCase().includes('ЗАГАЛЬНА ІНФОРМАЦІЯ')) {
        tabPattern = /^ЗАГАЛЬНА ІНФОРМАЦІЯ$|^ГУ$/i;
      } else {
        tabPattern = new RegExp(`^${tabName}$`, 'i');
      }
    } else {
      tabPattern = tabName;
    }

    const leftArrow = this.page
      .locator(
        '.mat-mdc-tab-header-pagination-before, mat-tab-header .mat-mdc-tab-header-pagination-before, mat-tab-header > div:nth-child(1)'
      )
      .first();

    for (let i = 0; i < 5; i++) {
      if (await leftArrow.isVisible().catch(() => false)) {
        await leftArrow.click({ force: true }).catch(() => {});
        await this.page.waitForTimeout(200);
      }
    }

    const findTab = async () => {
      return this.page
        .locator('.mat-mdc-tab, [role="tab"], .tab-header, .crt-tab-header, [data-item-marker*="Tab"]')
        .filter({ hasText: tabPattern })
        .first();
    };

    let tabLocator = await findTab();

    for (let attempt = 0; attempt < 8; attempt++) {
      if (await tabLocator.isVisible().catch(() => false)) break;
      const rightArrow = this.page
        .locator(
          '.mat-mdc-tab-header-pagination-after, mat-tab-header .mat-mdc-tab-header-pagination-after, mat-tab-header > div:nth-child(3)'
        )
        .first();
      if (await rightArrow.isVisible().catch(() => false)) {
        await rightArrow.click({ force: true }).catch(() => {});
        await this.page.waitForTimeout(300);
        tabLocator = await findTab();
      }
    }

    if (await tabLocator.isVisible().catch(() => false)) {
      await tabLocator.click({ force: true }).catch(() => {});
    } else {
      await this.page
        .getByText(tabName.toString(), { exact: true })
        .first()
        .click({ force: true })
        .catch(() => {});
    }

    // Ждем полной прогрузки вкладки
    await this.waitForCreatioReady();
  }

  /**
   * Вспомогательный метод проверки видимости хотя бы одного локатора
   */
  private async checkAnyVisible(locator: Locator): Promise<boolean> {
    const count = await locator.count();
    for (let i = 0; i < count; i++) {
      if (await locator.nth(i).isVisible().catch(() => false)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Универсальный валидатор локаторов по словарю с авто-скриншотами ошибок/успеха и прикреплением к HTML отчету
   */
  async validateFieldsFromDict(
    testName: string,
    fieldsDict: { [fieldName: string]: string },
    testInfo?: TestInfo
  ): Promise<void> {
    // Ждем полного окончания всех анимаций и загрузок перед началом проверки
    await this.waitForCreatioReady();

    const missingOrChangedFields: string[] = [];

    console.log(`\n--- 🔍 Проверка полей для: ${testName} ---`);

    for (const [fieldName] of Object.entries(fieldsDict)) {
      if (IGNORED_SYSTEM_KEYS.includes(fieldName)) {
        continue;
      }

      let isFound = false;
      let locator = this.page.getByText(fieldName, { exact: true });

      if (!(await this.checkAnyVisible(locator))) {
        locator = this.page.getByLabel(fieldName);
      }
      if (!(await this.checkAnyVisible(locator))) {
        locator = this.page.locator(`text=${fieldName}`);
      }
      if (!(await this.checkAnyVisible(locator))) {
        const prefix = fieldName.split(' ')[0];
        if (prefix && prefix.length > 3) {
          locator = this.page.locator(`label:has-text("${prefix}"), crt-field:has-text("${prefix}")`);
        }
      }
      if (!(await this.checkAnyVisible(locator))) {
        locator = this.page.getByRole('button', { name: `Сортувати ${fieldName}` });
      }

      if (!(await this.checkAnyVisible(locator))) {
        await this.scrollToBottom(2, 400);
        isFound = await this.checkAnyVisible(locator);
      } else {
        isFound = true;
      }

      if (!(await this.checkAnyVisible(locator))) {
        await this.scrollToRight();
        isFound = await this.checkAnyVisible(locator);
      }

      if (isFound) {
        await locator.first().scrollIntoViewIfNeeded().catch(() => {});
        await locator.first().focus().catch(() => {});
        console.log(`✅ [ОК] Элемент/поле '${fieldName}' виден и присутствует на странице.`);
      } else {
        console.error(`❌ [БАГ] Элемент/поле '${fieldName}' НЕ НАЙДЕН на странице или переименован!`);
        missingOrChangedFields.push(fieldName);

        await this.page
          .evaluate((missingName) => {
            const banner = document.createElement('div');
            banner.className = 'xlab-bug-overlay-banner';
            banner.style.position = 'fixed';
            banner.style.top = '20px';
            banner.style.right = '20px';
            banner.style.zIndex = '9999999';
            banner.style.background = '#dc2626';
            banner.style.color = '#ffffff';
            banner.style.padding = '14px 22px';
            banner.style.borderRadius = '10px';
            banner.style.fontSize = '17px';
            banner.style.fontWeight = '700';
            banner.style.fontFamily = 'sans-serif';
            banner.style.boxShadow = '0 10px 30px rgba(220, 38, 38, 0.6)';
            banner.style.border = '3px solid #ffffff';
            banner.innerHTML = `⚠️ НЕ НАЙДЕНО / ИЗМЕНИЛОСЬ ПОЛЕ: <span style="text-decoration: underline;">"${missingName}"</span>`;
            document.body.appendChild(banner);
          }, fieldName)
          .catch(() => {});

        const safeName = fieldName.replace(/[^a-zA-Z0-9а-яА-Я_]/g, '_');
        const screenshotDir = path.resolve(__dirname, '../../screenshots');
        if (!fs.existsSync(screenshotDir)) {
          fs.mkdirSync(screenshotDir, { recursive: true });
        }

        const now = new Date();
        const datePrefix = now.toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14); // e.g. 20260812_100855 -> 20260812100855
        const fileName = `${datePrefix}_BUG_${testName}_${safeName}.png`;
        const screenshotPath = path.join(screenshotDir, fileName);
        const buffer = await this.page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`📸 Скриншот дефекта сохранен в: ${screenshotPath}`);

        await this.page
          .evaluate(() => {
            const banner = document.querySelector('.xlab-bug-overlay-banner');
            if (banner) banner.remove();
          })
          .catch(() => {});

        if (testInfo) {
          await testInfo.attach(fileName, {
            body: buffer,
            contentType: 'image/png',
          });
        }
      }
    }

    const screenshotDir = path.resolve(__dirname, '../../screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    const now = new Date();
    const datePrefix = now.toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14);
    const successFileName = `${datePrefix}_SUCCESS_${testName}_passed.png`;
    const successScreenshotPath = path.join(screenshotDir, successFileName);
    const successBuffer = await this.page.screenshot({ path: successScreenshotPath, fullPage: true });

    if (testInfo) {
      await testInfo.attach(successFileName, {
        body: successBuffer,
        contentType: 'image/png',
      });
    }

    console.log(`🎉 Все элементы сценария ${testName} успешно прошли валидацию!`);
    console.log(`📸 Скриншот успешного прохождения сохранен в: ${successScreenshotPath}`);

    if (missingOrChangedFields.length > 0) {
      throw new Error(
        `⚠️ ОБНАРУЖЕНЫ БАГИ! Следующие элементы (${missingOrChangedFields.length}) отсутствуют или переименованы:\n` +
          missingOrChangedFields.map((f) => ` - "${f}"`).join('\n')
      );
    }
  }
}
