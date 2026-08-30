# Page Object Model (POM) Design Pattern

Page Object Model is an industry-standard design pattern in test automation that creates an object repository for web UI elements, improving maintainability and reducing code duplication.

---

## 1. Golden Rules of Page Objects in Playwright

1. **Locators as Readonly Properties**: Initialize locators inside the constructor or getter methods, not inside action methods.
2. **Encapsulate UI Logic**: Methods in POM should represent user actions (`fillForm`, `saveRecord`, `searchByQuery`), not low-level Playwright primitives.
3. **Separate Actions from Assertions**: Page objects should perform actions and provide locators. Test files (`.spec.ts`) should contain the `expect()` assertions.
4. **Composition over Inheritance**: Use component/section objects for reusable UI widgets (e.g., modals, navigation bars, grids) rather than massive god-classes.

---

## 2. Standard TypeScript POM Template

```typescript
import { Page, Locator } from '@playwright/test';

export interface ProductFormData {
  name: string;
  code: string;
  category?: string;
  shelfLifeDays?: string;
}

export class ProductsPage {
  readonly page: Page;
  readonly newProductBtn: Locator;
  readonly nameInput: Locator;
  readonly codeInput: Locator;
  readonly categoryCombobox: Locator;
  readonly saveBtn: Locator;
  readonly productRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newProductBtn = page.getByRole('button', { name: 'Створити', exact: true });
    this.nameInput = page.getByRole('textbox', { name: 'Назва' });
    this.codeInput = page.getByRole('textbox', { name: 'Код' });
    this.categoryCombobox = page.getByRole('combobox', { name: 'Категорія' });
    this.saveBtn = page.getByRole('button', { name: 'Зберегти' });
    this.productRows = page.locator('[role="row"], table tr');
  }

  async open(): Promise<void> {
    await this.page.goto('/0/Shell/#Section/Products_ListPage');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async fillProductForm(data: ProductFormData): Promise<void> {
    await this.nameInput.fill(data.name);
    await this.codeInput.fill(data.code);

    if (data.category) {
      await this.categoryCombobox.click();
      await this.categoryCombobox.fill(data.category);
      await this.page.getByRole('option', { name: data.category }).first().click();
    }
  }

  async createNewProduct(data: ProductFormData): Promise<void> {
    await this.newProductBtn.click();
    await this.fillProductForm(data);
    await this.saveBtn.click();
  }

  getProductRow(productNameOrCode: string): Locator {
    return this.productRows.filter({ hasText: productNameOrCode });
  }
}
```

---

## 3. Sub-Component / Modal Encapsulation

```typescript
export class ConfirmDialog {
  readonly dialog: Locator;
  readonly confirmBtn: Locator;
  readonly cancelBtn: Locator;

  constructor(page: Page) {
    this.dialog = page.getByRole('dialog', { name: /підтвердження/i });
    this.confirmBtn = this.dialog.getByRole('button', { name: 'Так' });
    this.cancelBtn = this.dialog.getByRole('button', { name: 'Скасувати' });
  }

  async confirm(): Promise<void> {
    await this.confirmBtn.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }
}
```
