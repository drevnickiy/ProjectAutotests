import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

import { getShellUrl } from '../config/environment';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(targetUrl = getShellUrl()): Promise<void> {
    await super.open(targetUrl);
  }

  async login(username?: string, password?: string): Promise<void> {
    const user = username || process.env.TEST_USERNAME || 'Supervisor';
    const pass = password || process.env.TEST_PASSWORD || 'Supervisor';

    // Конкретные селекторы формы входа Creatio (пароль всегда присутствует только на странице логина)
    const passInput = this.page.locator('input[type="password"], #passwordEdit-el-inputEl, #passwordEdit-el, input[name="password"]').first();
    const loginInput = this.page.locator('#loginEdit-el-inputEl, #loginEdit-el, input[name="username"], input[name="userName"], input[placeholder*="Username" i], input[placeholder*="Логін" i]').first();
    const authenticatedElement = this.page.locator('crt-app-header, mat-toolbar, .crt-header, .user-profile, crt-navigation-panel').first();

    // Ждем либо появление формы логина, либо авторизованного интерфейса
    await Promise.race([
      passInput.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
      authenticatedElement.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})
    ]);

    const isLoginVisible = await passInput.isVisible({ timeout: 1500 }).catch(() => false);

    if (isLoginVisible) {
      console.log('[Auth] Форма входа обнаружена. Выполняем авторизацию...');
      const submitBtn = this.page.locator('button:has-text("LOG IN"), button:has-text("Увійти"), button[type="submit"], #t-comp18-textEl').first();

      await loginInput.fill(user);
      await passInput.fill(pass);
      await submitBtn.click();

      await this.page.waitForURL(/.*\/0\/Shell\/.*/, { timeout: 60000 });
      await this.page.waitForLoadState('domcontentloaded').catch(() => {});
      await this.page.waitForTimeout(3000);
    } else {
      console.log('[Auth] Сессия уже активна (storageState), форма входа пропущена.');
    }
  }
}
