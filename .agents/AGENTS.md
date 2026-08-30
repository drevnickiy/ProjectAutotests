# Правила и регламент выполнения тестов в проекте Xlab

## 1. Автоматическая генерация и отправка отчетов на почту
- Все прогоны Playwright авто-тестов автоматически вызывают `globalTeardown: './src/utils/generateAndSendReport.ts'`.
- После прогона формируется интерактивный HTML-дашборд `custom_report.html` с изумрудной подсветкой статусов, фото-галереей скриншотов каждого шага и фильтрацией.
- При наличии настроек SMTP в `.env` (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_TO`) отчет автоматически отправляется в виде HTML пиьсма и вложения на указанный e-mail.

## 2. Изоляция сессии (storageState)
- Однократная авторизация выполняется в `e2e/auth.setup.ts` и сохраняется в `storageState.json`.
- Последовательное выполнение (`workers: 1`, `fullyParallel: false`) обеспечивает 100% стабильность работы с сервером Creatio без обрывов HTTP/2 сессий.

## 3. Регламент исправления багов и взаимодействия
- При исправлении ошибок UI или фиче-запросов НЕ запускать браузерный субагент для самостоятельного тестирования без согласия пользователя.
- НЕ перезапускать тесты (npx playwright test) без явного указания/команды пользователя.
- Взаимодействие: сначала сделать исправление, затем сказать пользователю: «Я пофиксил, проверь пожалуйста!», давая пользователю возможность самому протестировать решение.
## 4. Регламент предоставления отчета по тестам в чате
- Всегда выводить детальный отчёт в чат по результатам прогона тестов.
- Отчёт обязателен к наглядному оформлению: включать общую статистику (Passed / Failed), список упавших тестов со списком ВСЕХ ненайденных/отсутствующих полей и ссылками на соответствующие скриншоты/фотографий ошибок (BUG / failure screenshot), а также ссылку на `custom_report.html`.
- В `test-history.json` хранится история текущего + 2 предыдущих прогонов для вкладки «📈 Статистика» в дашборде.

## 5. Архитектурная топология и маппинг проекта (Codebase Map)
Детальная матрица сущностей хранится в скилле `.agents/skills/codebase-map/SKILL.md`.

### Структура директорий:
- `src/pages/`: Page Object классы (наследуются от `BasePage.ts`).
  - `BasePage.ts` — базовые методы взаимодействия с Creatio (выпадающие списки, сохранение, скриншоты, валидация полей).
  - `ProductsPage.ts`, `GenProductionPlanPage.ts`, `GenPlanFinishProductPage.ts`, `GenProductionRoutingPage.ts`, `GenProductionCalculatPage.ts`, `GenProductionTaskPage.ts`, `GenEquipmentPage.ts`, `WorkShiftPage.ts`, `GenContractOrderPage.ts`, `GenWarehouseDocumentPage.ts`, `ProductMaterialsPage.ts`, `LoginPage.ts`.
- `src/locators/`: Словари полей и локаторов в JSON (`Продукти.json`, `План_виробництва.json`, `Технологічні_карти.json`, `Обладнання.json` и др.).
- `src/config/`: `environment.ts` — управление серверами `main` / `main2`, сессиями `storageState-*.json` и `getShellUrl()`.
- `src/utils/`: `generateAndSendReport.ts` (HTML отчет + SMTP), `dropdown.ts` (селекторы списков), `scan*.ts` (сканеры Creatio DOM).
- `e2e/`:
  - `setup/auth.setup.ts` — однократная авторизация.
  - `functional/` — сквозные бизнес-сценарии создания сущностей и расчётов.
  - `validation/` — тесты валидации наличия и соответствия полей форм/реестров сканированным словарям.
- `scripts/`:
  - `seeds/` — нумерованные сид-скрипты `00`...`06` для последовательного наполнения БД Creatio.
  - `data/` — JSON-файлы с исходными данными для сидинга.

## 6. Принцип Data-Driven сидинга (Разделение данных и кода)
- **Строгое правило**: При необходимости изменить или добавить тестовые данные для наполнения Creatio (продукты, оборудование, техкарты, материалы) — **НЕ модифицировать TypeScript-код скриптов в `scripts/seeds/`**.
- Все данные подаются исключительно через редактирование соответствующих JSON-файлов в `scripts/data/` (`equipment.json`, `semi_finished_products.json`, `finished_products.json`, `raw_materials.json`, `semi_finished_routings.json`, `finished_routings.json`, `semi_finished_materials.json`, `finished_materials.json`).
- Код скриптов `scripts/seeds/*.ts` меняется ТОЛЬКО в случае изменения логики работы UI Creatio или фикса багов селекторов.

## 7. Методология BMAD (Breakthrough Method for Agile AI-Driven Development)
В проекте внедрены специализированные скиллы по стандарту BMAD:
- `bmad-requirements-analyst`: парсинг ТЗ/видео БА, формализация формул и Acceptance Criteria.
- `bmad-test-docs`: Risk-Based тест-планы (P0–P3), чек-листы сценариев TS1..TSN, RTM-матрицы и Quality Gates.
- `bmad-root-cause-analyst`: классификация сбоев тестов (Категории A, B, C, D) и составление баг-репортов.



