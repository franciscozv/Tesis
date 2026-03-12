import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const SCREENSHOTS_DIR = join(process.cwd(), 'review-output');

try { mkdirSync(SCREENSHOTS_DIR, { recursive: true }); } catch {}

const browser = await chromium.launch({ headless: true });
const consoleMessages = [];

async function captureAt(page, name, url, width, height) {
  await page.setViewportSize({ width, height });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(600);
  const path = join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  console.log(`Captured: ${path}`);
  return path;
}

const page = await browser.newPage();

page.on('console', (msg) => {
  consoleMessages.push({ type: msg.type(), text: msg.text() });
});
page.on('pageerror', (err) => {
  consoleMessages.push({ type: 'pageerror', text: err.message });
});

await captureAt(page, '1-desktop-1440-login', 'http://localhost:3000/auth/login', 1440, 900);
await captureAt(page, '2-tablet-768-login', 'http://localhost:3000/auth/login', 768, 1024);
await captureAt(page, '3-mobile-375-login', 'http://localhost:3000/auth/login', 375, 812);
await captureAt(page, '4-desktop-recuperar-password', 'http://localhost:3000/auth/recuperar-password', 1440, 900);
await captureAt(page, '5-mobile-recuperar-password', 'http://localhost:3000/auth/recuperar-password', 375, 812);

const logPath = join(SCREENSHOTS_DIR, 'console.json');
writeFileSync(logPath, JSON.stringify(consoleMessages, null, 2));
console.log(`Console log: ${logPath} (${consoleMessages.length} messages)`);
const errors = consoleMessages.filter(m => m.type === 'error' || m.type === 'pageerror');
console.log(`Errors/pageerrors: ${errors.length}`);
if (errors.length) errors.forEach(e => console.log('  ERROR:', e.text));

await browser.close();
console.log('Done.');
