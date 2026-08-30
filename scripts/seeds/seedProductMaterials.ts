import { test } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { ProductMaterialsPage, ProductMaterialItem } from '../../src/pages/ProductMaterialsPage';

export interface ProductSeedConfig {
  name: string;
  url: string;
  materials: ProductMaterialItem[];
}

const productsToSeed: ProductSeedConfig[] = [
  {
    name: 'Кондиціонер "Зволоження" 250мл',
    url: 'https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/Products_FormPage/edit/9c108165-ca0a-4a74-8edd-42671b13c60b',
    materials: [
      {
        materialName: 'Genamin CTAC',
        unit: 'кг',
        rate: '0.04',
        stageName: 'Приготування маси',
      },
      {
        materialName: 'Hydrovance',
        unit: 'кг',
        rate: '0.08',
        stageName: 'Приготування маси',
      },
      {
        materialName: 'Ароматизатор "Квітковий"',
        unit: 'кг',
        rate: '0.01',
        stageName: 'Приготування маси',
      },
      {
        materialName: 'Tinplate',
        unit: 'шт',
        rate: '1',
        stageName: 'Розлив у туби',
      },
    ],
  },
  {
    name: 'Тонік для обличчя "Свіжість" 200мл',
    url: 'https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/Products_FormPage/edit/a70448c0-8b77-4b12-bcf6-6a09549ab896',
    materials: [
      {
        materialName: 'Hydrovance',
        unit: 'кг',
        rate: '0.05',
        stageName: 'Приготування розчину',
      },
      {
        materialName: 'Ароматизатор "Квітковий"',
        unit: 'кг',
        rate: '0.005',
        stageName: 'Приготування розчину',
      },
      {
        materialName: 'Tinplate',
        unit: 'шт',
        rate: '1',
        stageName: 'Розлив у флакони',
      },
    ],
  },
  {
    name: 'Патчі гідрогелеві під очі (30 пар/уп)',
    url: 'https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/Products_FormPage/edit/eda3e489-c1d4-4ec2-8cff-f1b09da0b6d0',
    materials: [
      {
        materialName: 'Hydrovance',
        unit: 'кг',
        rate: '0.03',
        stageName: 'Вирубка патчів',
      },
      {
        materialName: 'Tinplate',
        unit: 'шт',
        rate: '1',
        stageName: 'Фасування у баночки',
      },
    ],
  },
  {
    name: 'Гель для душу "Морська свіжість" 300мл',
    url: 'https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/Products_FormPage/edit/e344e8ec-7b51-4663-b95c-fa66109366ad',
    materials: [
      {
        materialName: 'Genamin CTAC',
        unit: 'кг',
        rate: '0.06',
        stageName: 'Приготування маси гелю',
      },
      {
        materialName: 'Hydrovance',
        unit: 'кг',
        rate: '0.05',
        stageName: 'Приготування маси гелю',
      },
      {
        materialName: 'Tinplate',
        unit: 'шт',
        rate: '1',
        stageName: 'Розлив у флакони',
      },
    ],
  },
  {
    name: 'Крем-скраб для тіла "Кавовий" 200мл',
    url: 'https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/Products_FormPage/edit/4985751f-bd23-4f24-be11-ff36f17c49e9',
    materials: [
      {
        materialName: 'Genamin CTAC',
        unit: 'кг',
        rate: '0.05',
        stageName: 'Варка крем-бази',
      },
      {
        materialName: 'Hydrovance',
        unit: 'кг',
        rate: '0.05',
        stageName: 'Внесення скрабуючих часток',
      },
      {
        materialName: 'Tinplate',
        unit: 'шт',
        rate: '1',
        stageName: 'Фасування у баночки',
      },
    ],
  },
  {
    name: 'Крем-баттер для тіла "Манго" 250мл',
    url: 'https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/Products_FormPage/edit/c82e2a66-eaf9-4bef-a805-408dade060c4',
    materials: [
      {
        materialName: 'Баттер-основа',
        unit: 'кг',
        rate: '0.25',
        stageName: 'Варка маси',
      },
      {
        materialName: 'Масло Ши',
        unit: 'кг',
        rate: '0.05',
        stageName: 'Варка маси',
      },
    ],
  },
];

test.describe('Скрипт масового заповнення матеріалів технологічних карт (BOM)', () => {
  let loginPage: LoginPage;
  let materialsPage: ProductMaterialsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    materialsPage = new ProductMaterialsPage(page);
  });

  for (let i = 0; i < productsToSeed.length; i++) {
    const product = productsToSeed[i];

    test(`[${i + 1}/${productsToSeed.length}] Заповнення матеріалів: ${product.name}`, async ({ page }) => {
      test.setTimeout(360000);

      console.log(`\n======================================================`);
      console.log(`🚀 [${i + 1}/${productsToSeed.length}] ОБРОБКА: ${product.name}`);
      console.log(`🔗 URL: ${product.url}`);
      console.log(`======================================================`);

      console.log('📌 1. Відкриття картки продукту по прямому URL...');
      await loginPage.open(product.url);
      await loginPage.login();
      await page.waitForTimeout(2000);

      console.log('📌 2. Перехід на вкладку "ТЕХНОЛОГІЧНА КАРТА"...');
      await materialsPage.switchToTab('ТЕХНОЛОГІЧНА КАРТА');
      await page.waitForTimeout(2000);

      console.log(`📌 3. Додавання ${product.materials.length} позицій сировини / матеріалів...`);
      for (const item of product.materials) {
        await materialsPage.addMaterial(item);
      }

      console.log(`\n🎉 Усі матеріали для ${product.name} успішно додано та збережено!`);
    });
  }
});
