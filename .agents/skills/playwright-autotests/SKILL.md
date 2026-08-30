---
name: playwright-autotests
description: >-
  Comprehensive guide and rules for writing reliable, maintainable Playwright autotests
  in TypeScript based on official Playwright documentation (playwright.dev).
  Use this skill whenever creating, refactoring, debugging, or reviewing Playwright tests,
  Page Object Models (POM), locators, assertions, auth states, fixtures, or test configs.
---

# Playwright Autotesting Master Guide & Best Practices

This skill provides an end-to-end framework and standards for developing robust, scalable, and non-flaky end-to-end (E2E) autotests using Playwright and TypeScript, adhering strictly to official Playwright guidelines.

---

## 1. Core Principles of Reliable Playwright Tests

1. **Test User-Visible Behavior**:
   - Locate elements the way users and screen readers perceive them (`getByRole`, `getByText`, `getByLabel`, `getByPlaceholder`).
   - Avoid brittle implementation details (CSS classes like `.btn-primary-v2`, XPath hierarchies like `div > div:nth-child(3)`).

2. **Leverage Auto-Waiting & Actionability**:
   - Playwright automatically waits for elements to be visible, enabled, stable, and receive events before performing actions (`click()`, `fill()`, `check()`).
   - **NEVER** use manual sleeps (`page.waitForTimeout()`) in production tests unless explicitly simulating human typing delays.

3. **Use Web-First Async Assertions**:
   - Always use `await expect(locator).toBeVisible()` instead of `expect(await locator.isVisible()).toBe(true)`.
   - Web-first assertions poll the DOM until the condition is met or timeout is reached, eliminating race conditions.

4. **Isolate Test State & Reuse Authentication**:
   - Each test must run in its own isolated BrowserContext.
   - Use `storageState.json` generated once via a `setup` project to avoid logging in during every test.

5. **Structure Code with Page Object Model (POM)**:
   - Encapsulate page selectors and interactions within typed Page classes.
   - Keep test files focused on test flow and assertions (`expect`), not raw selectors.

---

## 2. Test Anatomy & Writing Structure

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Feature: Order Management', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.open();
  });

  test('should create a new customer order successfully', async ({ page }) => {
    // 1. Arrange & Act
    await dashboardPage.clickCreateOrder();
    await dashboardPage.fillOrderDetails({
      customer: 'Acme Corp',
      quantity: 5,
      deliveryDate: '2026-09-01',
    });
    await dashboardPage.submitOrder();

    // 2. Assert (Web-First)
    await expect(dashboardPage.successNotification).toBeVisible();
    await expect(dashboardPage.orderStatusBadge).toHaveText('Created');
  });
});
```

---

## 3. Locator Strategy (Priority Order)

| Priority | Locator Method | Best Used For | Example |
| :--- | :--- | :--- | :--- |
| **1 (Highest)** | `page.getByRole(role, { name })` | Interactive elements (buttons, links, dialogs, checkboxes, tabs, headings) | `page.getByRole('button', { name: 'Зберегти' })` |
| **2** | `page.getByLabel(text)` | Form fields with `<label>` or `aria-label` | `page.getByLabel('Електронна пошта')` |
| **3** | `page.getByPlaceholder(text)` | Inputs without labels that have placeholder text | `page.getByPlaceholder('Пошук...')` |
| **4** | `page.getByText(text)` | Non-interactive text content, paragraphs, spans | `page.getByText('Замовлення успішно створено')` |
| **5** | `page.getByTestId(id)` | Dynamic/complex controls when role/text is ambiguous | `page.getByTestId('order-submit-btn')` |
| **6 (Fallback)** | `.locator('selector').filter()` | Nested containers, grids, repeating table rows | `page.locator('[role="row"]').filter({ hasText: 'ORD-1024' })` |

> 📖 **Deep Dive**: See [Locators Reference](./references/locators_guide.md) for complex filtering, chaining, and shadow DOM handling.

---

## 4. Web-First Assertions Matrix

| Intent | Correct (Web-First, Auto-Retrying) | ❌ Anti-Pattern (Immediate / Flaky) |
| :--- | :--- | :--- |
| **Visibility** | `await expect(loc).toBeVisible();` | `expect(await loc.isVisible()).toBe(true);` |
| **Element Count** | `await expect(loc).toHaveCount(3);` | `expect(await loc.count()).toBe(3);` |
| **Exact Text** | `await expect(loc).toHaveText('Готово');` | `expect(await loc.innerText()).toBe('Готово');` |
| **Value in Input** | `await expect(loc).toHaveValue('100.00');` | `expect(await loc.inputValue()).toBe('100.00');` |
| **Enabled State** | `await expect(loc).toBeEnabled();` | `expect(await loc.isEnabled()).toBe(true);` |
| **Checked State** | `await expect(loc).toBeChecked();` | `expect(await loc.isChecked()).toBe(true);` |
| **URL Route** | `await expect(page).toHaveURL(/.*dashboard/);` | `expect(page.url()).toContain('dashboard');` |

> 📖 **Deep Dive**: See [Assertions Reference](./references/assertions_guide.md) for full list of matchers, custom error messages, and timeouts.

---

## 5. Page Object Model (POM) Best Practices

1. **Locator declarations in constructor or getters**: Use `readonly Locator` fields.
2. **Never assert inside actions unless verifying step completion**: Keep business validations inside test specs.
3. **Return promises or Page Objects for chaining**: Keep methods focused on single user intentions.

```typescript
import { Page, Locator, expect } from '@playwright/test';

export class OrderPage {
  readonly page: Page;
  readonly createBtn: Locator;
  readonly customerInput: Locator;
  readonly saveBtn: Locator;
  readonly statusBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createBtn = page.getByRole('button', { name: 'Створити замовлення' });
    this.customerInput = page.getByRole('textbox', { name: 'Клієнт' });
    this.saveBtn = page.getByRole('button', { name: 'Зберегти' });
    this.statusBadge = page.locator('.status-badge');
  }

  async createOrder(customerName: string): Promise<void> {
    await this.createBtn.click();
    await this.customerInput.fill(customerName);
    await this.saveBtn.click();
  }
}
```

> 📖 **Deep Dive**: See [Page Object Model Guide](./references/pom_pattern.md).

---

## 6. Authentication & Session Sharing

- Run authentication **ONCE** in a `setup` project.
- Save cookies, tokens, and storage state to `storageState.json`.
- Subsequent test projects consume `storageState` automatically without opening the login page.

> 📖 **Deep Dive**: See [Auth & StorageState Guide](./references/auth_and_state.md).

---

## 7. Common Anti-Patterns to Avoid

| ❌ Bad Practice | Why it's Bad | ✅ Recommended Playwright Way |
| :--- | :--- | :--- |
| `page.waitForTimeout(5000)` | Arbitrary sleep causes slow, flaky tests | Use auto-waiting actions or `expect(loc).toBeVisible()` |
| `locator.click({ force: true })` | Bypasses actionability checks (hidden/covered element) | Fix overlay/backdrop or scroll element into view |
| `xpath=//div[3]/span/a` | Fragile; breaks on minor DOM / design tweaks | Use `getByRole`, `getByLabel`, or filtered locators |
| Shared mutable state across tests | Test pollution and cascading failures | Fresh test data, unique suffixes, or isolated DB records |
| Conditional test logic (`if (isVisible)`) | Hides real bugs and causes non-deterministic tests | Deterministic preconditions and explicit assertions |

---

## 8. Reference Documentation Index

- [Locators & Filtering Reference](./references/locators_guide.md)
- [Web-First Assertions Reference](./references/assertions_guide.md)
- [Page Object Model Design Pattern](./references/pom_pattern.md)
- [Authentication & StorageState Configuration](./references/auth_and_state.md)
- [Example: Basic E2E Test](./examples/basic_test.spec.ts)
- [Example: Modular Page Object](./examples/sample_pom.ts)
