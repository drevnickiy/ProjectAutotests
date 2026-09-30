import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const ENVIRONMENTS: Record<string, string> = {
  main: 'https://xlab-analyst-main.poligon.crmgenesis.com',
  main2: 'https://xlab-analyst-main2.poligon.crmgenesis.com',
  preprod: 'https://xlab-preprod.poligon.crmgenesis.com',
  main3: 'https://xlab-preprod.poligon.crmgenesis.com',
  analytics2: 'https://xlab-analytics2.poligon.crmgenesis.com',
  '3': 'https://xlab-preprod.poligon.crmgenesis.com',
};

/**
 * Отримує поточне середовище (main, main2, analytics2 або preprod)
 */
export function getCurrentEnv(): string {
  if (process.env.ENV) {
    const rawEnv = process.env.ENV.trim().toLowerCase();
    if (rawEnv === 'analytics2') return 'analytics2';
    if (rawEnv === '3' || rawEnv === 'main3' || rawEnv === 'preprod') return 'preprod';
    if (rawEnv === '2' || rawEnv === 'main2') return 'main2';
    if (rawEnv === '1' || rawEnv === 'main') return 'main';
    if (ENVIRONMENTS[process.env.ENV]) {
      return process.env.ENV;
    }
    if (ENVIRONMENTS[rawEnv]) {
      return rawEnv;
    }
  }
  if (process.env.BASE_URL) {
    if (process.env.BASE_URL.includes('analytics2')) return 'analytics2';
    if (process.env.BASE_URL.includes('preprod')) return 'preprod';
    if (process.env.BASE_URL.includes('main2')) return 'main2';
    if (process.env.BASE_URL.includes('main')) return 'main';
  }
  return 'main';
}

/**
 * Отримує базовий URL поточного сервера (без кінцевого слешу)
 */
export function getBaseUrl(): string {
  const env = getCurrentEnv();
  const rawUrl = process.env.BASE_URL || ENVIRONMENTS[env] || ENVIRONMENTS.main;
  return rawUrl.replace(/\/+$/, '').replace(/\/0\/Shell\/?$/, '');
}

/**
 * Отримує шлях до файлу сесії (storageState) для поточного сервера
 */
export function getStorageStatePath(): string {
  const env = getCurrentEnv();
  return path.resolve(__dirname, `../../storageState-${env}.json`);
}

/**
 * Будує повний або відносний URL до розділу чи картки в Shell
 * @param pathPart Наприклад '#Section/Products_ListPage' або '#Card/Products_FormPage/edit/...'
 */
export function getShellUrl(pathPart = ''): string {
  const baseUrl = getBaseUrl();
  const cleanPath = pathPart.startsWith('/') ? pathPart.slice(1) : pathPart;
  if (cleanPath.startsWith('0/Shell/')) {
    return `${baseUrl}/${cleanPath}`;
  }
  return `${baseUrl}/0/Shell/${cleanPath}`;
}
