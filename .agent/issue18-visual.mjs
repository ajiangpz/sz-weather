import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const browser = await chromium.launch({ headless: true });
const baseURL = 'http://127.0.0.1:4173/';
const results = [];

async function enableWind(page) {
  const checkbox = page.getByRole('checkbox', { name: /风场流线/ });
  if (await checkbox.count()) {
    if (!(await checkbox.first().isChecked())) await checkbox.first().check({ force: true });
    return { method: 'checkbox', checked: await checkbox.first().isChecked() };
  }

  const switchControl = page.getByRole('switch', { name: /风场流线/ });
  if (await switchControl.count()) {
    const checked = await switchControl.first().getAttribute('aria-checked');
    if (checked !== 'true') await switchControl.first().click({ force: true });
    return { method: 'switch', checked: await switchControl.first().getAttribute('aria-checked') };
  }

  const label = page.locator('label').filter({ hasText: '风场流线' }).first();
  if (await label.count()) {
    await label.click({ force: true });
    return { method: 'label', checked: 'clicked' };
  }

  throw new Error('Unable to locate the 风场流线 control');
}

for (const [width, height] of [[1920, 1080], [1536, 1024], [1440, 900]]) {
  const page = await browser.newPage({ viewport: { width, height } });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `visual-evidence/viewport-${width}x${height}.png`, fullPage: true });

  const map = page.locator('.weather-map-panel');
  await map.screenshot({ path: `visual-evidence/map-${width}x${height}.png` });

  const wind = await enableWind(page);
  await page.waitForTimeout(900);
  await map.screenshot({ path: `visual-evidence/map-wind-${width}x${height}.png` });

  results.push({ kind: 'viewport', width, height, mapBox: await map.boundingBox(), wind, pageErrors });
  if (pageErrors.length) throw new Error(`Page errors at ${width}x${height}: ${pageErrors.join(' | ')}`);
  await page.close();
}

const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
const dynamicErrors = [];
page.on('pageerror', error => dynamicErrors.push(error.message));
await page.goto(baseURL, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const wind = await enableWind(page);
await page.waitForTimeout(500);
await page.getByRole('button', { name: '播放', exact: true }).click();

const times = [0, 600, 1200, 2400, 3600];
let elapsed = 0;
const frames = [];
for (const t of times) {
  await page.waitForTimeout(t - elapsed);
  elapsed = t;
  const path = `visual-evidence/radar-wind-playback-${t}ms.png`;
  await page.locator('.weather-map-panel').screenshot({ path });
  const hash = createHash('sha256').update(readFileSync(path)).digest('hex');
  const frameTime = await page.locator('.weather-map-panel__time').innerText();
  frames.push({ t, hash, frameTime });
}

await page.getByRole('button', { name: '暂停', exact: true }).click();
const distinctHashes = new Set(frames.map(item => item.hash)).size;
const distinctTimes = new Set(frames.map(item => item.frameTime)).size;
results.push({ kind: 'dynamic', wind, frames, distinctHashes, distinctTimes, pageErrors: dynamicErrors });
writeFileSync('visual-evidence/results.json', JSON.stringify(results, null, 2));

if (dynamicErrors.length) throw new Error(`Dynamic page errors: ${dynamicErrors.join(' | ')}`);
if (distinctHashes < 4) throw new Error(`Expected at least 4 distinct dynamic screenshots, got ${distinctHashes}`);
if (distinctTimes < 4) throw new Error(`Expected timeline to visit at least 4 distinct frame times, got ${distinctTimes}`);

await browser.close();
