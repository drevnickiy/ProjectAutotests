import { test, expect } from '@playwright/test';
import { SampleProductPage } from './sample_pom';

test.describe('E2E: Product Catalog Lifecycle', () => {
  let productPage: SampleProductPage;

  test.beforeEach(async ({ page }) => {
    productPage = new SampleProductPage(page);
    await productPage.open();
  });

  test('should create and verify a new finished product', async ({ page }) => {
    const timestamp = Date.now();
    const productName = `Шампунь Органік ${timestamp}`;
    const productCode = `GP-${timestamp.toString().slice(-4)}`;

    // 1. Create Product
    await productPage.createNewProduct({
      name: productName,
      code: productCode,
      category: 'Готовий продукт',
      shelfLifeDays: '730',
    });

    // 2. Assert Web-First
    await expect(productPage.successNotification).toBeVisible();
    await expect(productPage.getProductRow(productCode)).toBeVisible();
    await expect(productPage.getProductRow(productCode)).toContainText(productName);
  });
});
