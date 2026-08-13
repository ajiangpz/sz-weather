import { test, expect } from '@playwright/test';
import {
  createTimeline,
  createReferencePayload,
  createChinaGridPayload,
  defaultGridFields,
} from './china-grid-fixture.mjs';

const installRoutes = async (page, { includeGrid }) => {
  const times = createTimeline('2026-08-13T05:30:00+08:00');
  const cityPayload = createReferencePayload(times);
  const gridPayload = createChinaGridPayload(times, ({ column, row, times: frameTimes }) => ({
    ...defaultGridFields({ column, row, times: frameTimes }),
    surface_pressure: frameTimes.map((_, frameIndex) => Number((995 + column * 1.4 + row * 0.9 + frameIndex * 0.015).toFixed(3))),
  }));

  await page.route('https://api.open-meteo.com/**', async route => {
    const url = new URL(route.request().url());
    const isGrid = (url.searchParams.get('latitude') ?? '').includes(',');
    const payload = isGrid && includeGrid ? gridPayload : cityPayload;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
  });
  await page.route('https://api.rainviewer.com/**', route => route.abort());
  return times;
};

const selectPrimaryField = async (panel, name) => {
  await panel.locator('.layer-panel__primary-option').filter({ hasText: name }).click();
  await expect(panel.getByRole('radio', { name })).toBeChecked();
};

test('renders model pressure isolines as an independent China forecast overlay', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1536, height: 1024 });
  await installRoutes(page, { includeGrid: true });

  await page.goto('/?weather=live');
  await expect(page.getByText('预报 LIVE', { exact: true })).toBeVisible({ timeout: 10_000 });

  const layerButton = page.getByRole('button', { name: '图层' });
  const layerPanel = page.locator('#weather-layer-popover-panel');
  await layerButton.click();

  const windToggle = layerPanel.getByRole('checkbox', { name: '风场流线' });
  const pressureToggle = layerPanel.getByRole('checkbox', { name: '气压等值线' });
  await expect(pressureToggle).toBeEnabled();
  await selectPrimaryField(layerPanel, '无底色');
  await windToggle.uncheck();
  await pressureToggle.check();
  await page.keyboard.press('Escape');

  const legend = page.getByRole('region', { name: '地图数据图例' });
  await expect(legend.getByText('模式等压线 · 0.5 hPa', { exact: true })).toBeVisible();
  await page.waitForTimeout(250);

  const mapShell = page.locator('.weather-dashboard__map-shell');
  const pressureOn = await mapShell.screenshot({ path: testInfo.outputPath('visual-qa-china-pressure-on.png') });

  await layerButton.click();
  await pressureToggle.uncheck();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(160);
  const pressureOff = await mapShell.screenshot({ path: testInfo.outputPath('visual-qa-china-pressure-off.png') });
  expect(pressureOn.equals(pressureOff)).toBe(false);

  await layerButton.click();
  await pressureToggle.check();
  await page.keyboard.press('Escape');
  await page.screenshot({ path: testInfo.outputPath('visual-qa-china-pressure-1536x1024.png'), fullPage: true });
});

test('keeps pressure isolines unavailable when the national forecast grid falls back', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await installRoutes(page, { includeGrid: false });

  await page.goto('/?weather=live');
  await expect(page.getByText('预报 LIVE', { exact: true })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: '图层' }).click();
  const layerPanel = page.locator('#weather-layer-popover-panel');
  const pressureToggle = layerPanel.getByRole('checkbox', { name: '气压等值线' });
  await expect(pressureToggle).toBeDisabled();
  await expect(layerPanel.locator('li').filter({ hasText: '气压等值线' }).getByText('不可用', { exact: true })).toBeVisible();
});
