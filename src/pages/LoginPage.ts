import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(targetUrl = 'https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenPlanFinishProduct_ListPage'): Promise<void> {
    await super.open(targetUrl);
  }

  async login(username?: string, password?: string): Promise<void> {
    const user = username || process.env.TEST_USERNAME || 'Supervisor';
    const pass = password || process.env.TEST_PASSWORD || 'Supervisor';

    // Конкретные селекторы поля ввода логина на форме входа Creatio
    const loginInput = this.page.locator('#loginEdit-el-inputEl, #loginEdit-el, input[name="username"]').first();
    const isLoginVisible = await loginInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (isLoginVisible) {
      console.log('[Auth] Форма входа обнаружена. Выполняем авторизацию...');
      const passInput = this.page.locator('#passwordEdit-el-inputEl, #passwordEdit-el, input[name="password"]').first();
      const submitBtn = this.page.locator('#t-comp18-textEl, button:has-text("LOG IN"), button:has-text("Увійти")').first();

      await loginInput.fill(user);
      await passInput.fill(pass);
      await submitBtn.click();

      await this.page.waitForURL(/.*\/0\/Shell\/.*/, { timeout: 60000 });
      await this.page.waitForLoadState('networkidle').catch(() => {});
      await this.page.waitForTimeout(3000);
    } else {
      console.log('[Auth] Сессия уже активна (storageState), форма входа пропущена.');
    }
  }
}
