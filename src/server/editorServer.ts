import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3005;
const projectRoot = path.resolve(__dirname, '../../');
const locatorsDir = path.join(projectRoot, 'src/locators');

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoint: Save Locators to Disk
  if (req.method === 'POST' && req.url === '/api/save-locators') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        // Payload: { files: { [fileName]: dataObject } }
        const filesMap = payload.files || {};
        let updatedCount = 0;

        for (const [fileName, fileData] of Object.entries(filesMap)) {
          // Safety check: ensure file stays inside src/locators
          const safeName = path.basename(fileName);
          const targetPath = path.join(locatorsDir, safeName);
          fs.writeFileSync(targetPath, JSON.stringify(fileData, null, 2), 'utf-8');
          updatedCount++;
        }

        console.log(`✅ [Editor Server] Успешно обновлено файлов локаторов на диске: ${updatedCount}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: updatedCount, message: `Сохранено ${updatedCount} файлов на диск!` }));
      } catch (err: any) {
        console.error('❌ [Editor Server] Ошибка сохранения локаторов:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Serve custom_report.html at root
  if (req.method === 'GET' && (req.url === '/' || req.url === '/custom_report.html')) {
    const reportPath = path.join(projectRoot, 'custom_report.html');
    try {
      // Regenerate custom_report.html on the fly from test-results.json to ensure 100% fresh data
      const { execSync } = require('child_process');
      execSync('npx ts-node src/utils/generateAndSendReport.ts', { cwd: projectRoot, stdio: 'ignore' });
    } catch (e) {
      console.error('⚠️ Ошибка авто-обновления отчёта:', e);
    }

    if (fs.existsSync(reportPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(reportPath));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Report file custom_report.html not found. Run "npm run test" or "npm run report:generate" first.');
    }
    return;
  }

  // Serve static screenshot images
  if (req.method === 'GET' && req.url?.startsWith('/screenshots/')) {
    const safePath = path.join(projectRoot, path.normalize(req.url));
    if (fs.existsSync(safePath)) {
      const ext = path.extname(safePath).toLowerCase();
      const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(fs.readFileSync(safePath));
    } else {
      res.writeHead(404);
      res.end();
    }
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n🚀 [Editor Server] Сервер локаторов запущен: ${url}`);
  console.log(`💡 Вы можете изменять названия полей и локаторов прямо в UI отчета и сохранять их в 1 клик!\n`);

  // Auto-open in browser on macOS
  exec(`open ${url}`);
});
