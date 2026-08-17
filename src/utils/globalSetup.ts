import * as fs from 'fs';
import * as path from 'path';

async function globalSetup() {
  const rootDir = path.resolve(__dirname, '../../');
  const jsonReportPath = path.join(rootDir, 'test-results.json');
  const htmlReportPath = path.join(rootDir, 'custom_report.html');
  const zipReportPath = path.join(rootDir, 'test_report.zip');
  const screenshotsDir = path.join(rootDir, 'screenshots');
  const testResultsDir = path.join(rootDir, 'test-results');
  const fullJsonReportPath = path.join(rootDir, 'test-results-full.json');

  if (process.env.PRESERVE_REPORT === 'true') {
    console.log('\n📌 [Global Setup] Сохранение существующего отчета для частичного обследования/дозапуска (PRESERVE_REPORT=true)...');
    // Ensure screenshot directory exists
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    return;
  }

  console.log('\n🧹 [Global Setup] Полное удаление старого отчета и сброс результатов перед полным запуском...');

  // 1. Удаляем старый test-results.json & test-results-full.json
  if (fs.existsSync(jsonReportPath)) fs.unlinkSync(jsonReportPath);
  if (fs.existsSync(fullJsonReportPath)) fs.unlinkSync(fullJsonReportPath);

  // 2. Удаляем старый custom_report.html
  if (fs.existsSync(htmlReportPath)) fs.unlinkSync(htmlReportPath);

  // 3. Удаляем старый zip архив
  if (fs.existsSync(zipReportPath)) fs.unlinkSync(zipReportPath);

  // 4. Очищаем скриншоты
  if (fs.existsSync(screenshotsDir)) {
    fs.rmSync(screenshotsDir, { recursive: true, force: true });
  }
  fs.mkdirSync(screenshotsDir, { recursive: true });

  // 5. Очищаем test-results
  if (fs.existsSync(testResultsDir)) {
    fs.rmSync(testResultsDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testResultsDir, { recursive: true });
}

export default globalSetup;
