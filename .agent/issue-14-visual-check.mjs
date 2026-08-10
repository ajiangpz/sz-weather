import { chromium as playwrightChromium } from 'playwright-core';
import serverlessChromium from '@sparticuz/chromium';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const baseUrl = 'http://127.0.0.1:4173';
const server = spawn('pnpm', ['dev', '--host', '127.0.0.1', '--port', '4173'], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],
});

let serverOutput = '';
server.stdout.on('data', chunk => { serverOutput += chunk.toString(); });
server.stderr.on('data', chunk => { serverOutput += chunk.toString(); });

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitForServer() {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {}
    await sleep(1000);
  }
  throw new Error(`Vite server did not start. Output:\n${serverOutput}`);
}

const screenshots = [];
const validation = {
  e2e: {},
  viewports: [],
  windFrames: [],
  pageErrors: [],
};

try {
  await waitForServer();
  const browser = await playwrightChromium.launch({
    args: serverlessChromium.args,
    executablePath: await serverlessChromium.executablePath(),
    headless: true,
  });

  async function openReadyPage(width, height) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.getByRole('region', { name: 'RainScope 深圳天气可视化大屏' }).waitFor({ state: 'visible', timeout: 15_000 });
    await page.getByRole('complementary', { name: '图层与站点' }).waitFor({ state: 'visible', timeout: 15_000 });
    await page.getByRole('complementary', { name: '实时指标与预警' }).waitFor({ state: 'visible', timeout: 15_000 });
    const windToggle = page.getByLabel('风场流线');
    await windToggle.waitFor({ state: 'visible', timeout: 15_000 });
    if (!(await windToggle.isChecked())) await windToggle.check();
    await page.waitForTimeout(4500);
    validation.pageErrors.push(...pageErrors);
    return { context, page };
  }

  const e2ePage = await openReadyPage(1440, 900);
  const labels = e2ePage.page.locator('.weather-map-panel__district-label');
  const labelCount = await labels.count();
  if (labelCount !== 10) throw new Error(`Expected 10 district labels, got ${labelCount}`);
  validation.e2e = {
    dashboardVisible: await e2ePage.page.getByRole('region', { name: 'RainScope 深圳天气可视化大屏' }).isVisible(),
    leftPanelVisible: await e2ePage.page.getByRole('complementary', { name: '图层与站点' }).isVisible(),
    rightPanelVisible: await e2ePage.page.getByRole('complementary', { name: '实时指标与预警' }).isVisible(),
    districtLabelCount: labelCount,
    windEnabled: await e2ePage.page.getByLabel('风场流线').isChecked(),
  };
  await e2ePage.context.close();

  for (const [width, height] of [[1920, 1080], [1536, 1024], [1440, 900]]) {
    const { context, page } = await openReadyPage(width, height);
    const map = page.getByRole('region', { name: '深圳降雨雷达地图' });
    const image = await map.screenshot({ type: 'jpeg', quality: 72 });
    screenshots.push({ name: `${width}x${height}`, mime: 'image/jpeg', data: image.toString('base64') });
    validation.viewports.push({ width, height, mapVisible: await map.isVisible() });
    await context.close();
  }

  const windSession = await openReadyPage(1536, 1024);
  const windMap = windSession.page.getByRole('region', { name: '深圳降雨雷达地图' });
  const samples = [
    ['0000ms', 0],
    ['0120ms', 120],
    ['0240ms', 120],
    ['0600ms', 360],
    ['1800ms', 1200],
  ];
  const hashes = new Set();
  for (const [name, waitMs] of samples) {
    if (waitMs) await windSession.page.waitForTimeout(waitMs);
    const image = await windMap.screenshot({ type: 'jpeg', quality: 72 });
    const hash = createHash('sha256').update(image).digest('hex');
    hashes.add(hash);
    validation.windFrames.push({ name, hash });
    if (name === '0000ms' || name === '0600ms' || name === '1800ms') {
      screenshots.push({ name: `wind-${name}`, mime: 'image/jpeg', data: image.toString('base64') });
    }
  }
  validation.uniqueWindFrames = hashes.size;
  await windSession.context.close();
  await browser.close();

  if (validation.pageErrors.length) throw new Error(`Page errors: ${validation.pageErrors.join('\n')}`);
  if (validation.uniqueWindFrames !== 5) throw new Error(`Expected 5 unique wind frames, got ${validation.uniqueWindFrames}`);
  if (!validation.e2e.dashboardVisible || !validation.e2e.leftPanelVisible || !validation.e2e.rightPanelVisible || !validation.e2e.windEnabled) {
    throw new Error(`Playwright Chromium E2E checks failed: ${JSON.stringify(validation.e2e)}`);
  }

  const reference = await readFile(path.join(root, 'docs', 'image.png'));
  screenshots.push({ name: 'reference', mime: 'image/png', data: reference.toString('base64') });

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Issue 14 Visual QA</title><style>body{font-family:sans-serif;background:#111;color:#eee;margin:20px}figure{margin:0 0 24px}img{max-width:100%;height:auto;border:1px solid #444}figcaption{margin:8px 0}</style></head><body><h1>Issue 14 Visual QA</h1>${screenshots.map(item => `<figure><figcaption>${item.name}</figcaption><img src="data:${item.mime};base64,${item.data}"></figure>`).join('')}<pre>${JSON.stringify(validation, null, 2)}</pre></body></html>`;
  await writeFile(path.join(root, 'dist', 'issue-14-visual-qa.html'), html);
  await writeFile(path.join(root, 'dist', 'issue-14-validation.json'), JSON.stringify(validation, null, 2));
} finally {
  server.kill('SIGTERM');
}
