import { test, expect } from '@playwright/test';
import {
  createTimeline,
  createReferencePayload,
  createChinaGridPayload,
} from './china-grid-fixture.mjs';

const radarTilePng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgQJ/l6ZC7wAAAABJRU5ErkJggg==',
  'base64',
);

const createRainViewerPayload = (currentTimestamp) => {
  const currentEpoch = Math.floor(Date.parse(`${currentTimestamp}:00+08:00`) / 1000);
  return {
    version: '2.0',
    generated: currentEpoch + 60,
    host: 'https://tilecache.rainviewer-review.test',
    radar: {
      past: Array.from({ length: 13 }, (_, index) => ({
        time: currentEpoch - (12 - index) * 10 * 60,
        path: `/v2/radar/review-${index}`,
      })),
      nowcast: [],
    },
  };
};

test('restores compact layer-panel styling and offsets city labels from reference dots', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1536, height: 1024 });
  await page.goto('/');

  const beijingLabel = page.locator('.weather-map-panel__district-label').filter({ hasText: '北京' });
  const beijingDot = page.getByRole('button', { name: /北京城市参考点/ });
  await expect(beijingLabel).toBeVisible();
  await expect(beijingDot).toBeVisible();

  const [labelBox, dotBox] = await Promise.all([beijingLabel.boundingBox(), beijingDot.boundingBox()]);
  expect(labelBox).not.toBeNull();
  expect(dotBox).not.toBeNull();
  const labelCenterY = labelBox.y + labelBox.height / 2;
  const dotCenterY = dotBox.y + dotBox.height / 2;
  expect(dotCenterY - labelCenterY).toBeGreaterThan(8);

  await page.getByRole('button', { name: '图层' }).click();
  const panel = page.locator('#weather-layer-popover-panel');
  const primaryGrid = panel.locator('.layer-panel__primary-grid');
  const primaryOption = panel.locator('.layer-panel__primary-option').first();
  const modelSelect = panel.getByRole('combobox', { name: '预报模式' });

  const styles = await primaryGrid.evaluate(element => ({
    display: getComputedStyle(element).display,
    columns: getComputedStyle(element).gridTemplateColumns,
  }));
  expect(styles.display).toBe('grid');
  expect(styles.columns.split(' ').length).toBe(2);
  expect(Number.parseFloat(await primaryOption.evaluate(element => getComputedStyle(element).borderRadius))).toBeGreaterThanOrEqual(5);
  expect(Number.parseFloat(await modelSelect.evaluate(element => getComputedStyle(element).height))).toBeGreaterThanOrEqual(24);

  await page.screenshot({ path: testInfo.outputPath('visual-qa-china-layer-panel-review.png'), fullPage: true });
});

test('keeps a selected city reference value stable when the timeline advances', async ({ page }) => {
  await page.setViewportSize({ width: 1536, height: 1024 });
  await page.goto('/');

  await page.getByRole('button', { name: /北京城市参考点/ }).click();
  const popup = page.locator('.weather-map-panel__popup');
  await expect(popup.getByRole('heading', { name: '北京城市参考点' })).toBeVisible();
  const temperatureRow = popup.locator('p').filter({ hasText: '温度：' });
  const rainfallRow = popup.locator('p').filter({ hasText: '1小时降雨：' });
  const temperatureBefore = await temperatureRow.textContent();
  const rainfallBefore = await rainfallRow.textContent();

  await page.getByRole('button', { name: '下一帧' }).click();
  await expect(temperatureRow).toHaveText(temperatureBefore);
  await expect(rainfallRow).toHaveText(rainfallBefore);
});

test('samples the clicked national model grid even when RainViewer radar is also live', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1536, height: 1024 });
  const times = createTimeline();
  const referencePayload = createReferencePayload(times, {
    temperature_2m: times.map(() => 28),
    relative_humidity_2m: times.map(() => 74),
    precipitation: times.map(() => 0.1),
    wind_speed_10m: times.map(() => 3.2),
  });
  const gridPayload = createChinaGridPayload(times, ({ times: frameTimes }) => ({
    wind_speed_10m: frameTimes.map(() => 9),
    wind_direction_10m: frameTimes.map(() => 270),
    precipitation: frameTimes.map(() => 0.75),
    temperature_2m: frameTimes.map(() => 5),
    relative_humidity_2m: frameTimes.map(() => 40),
    surface_pressure: frameTimes.map(() => 1000),
  }));

  await page.route('https://api.open-meteo.com/**', async route => {
    const url = new URL(route.request().url());
    const isGrid = (url.searchParams.get('latitude') ?? '').includes(',');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(isGrid ? gridPayload : referencePayload),
    });
  });
  await page.route('https://api.rainviewer.com/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(createRainViewerPayload(times[12])),
    });
  });
  await page.route('https://tilecache.rainviewer-review.test/**', async route => {
    await route.fulfill({ status: 200, contentType: 'image/png', body: radarTilePng });
  });

  await page.goto('/?weather=live');
  await expect(page.getByText('预报 LIVE', { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('region', { name: '地图数据图例' }).getByText('雷达 LIVE', { exact: true })).toBeVisible({ timeout: 10_000 });

  const canvas = page.locator('.weather-map-panel__canvas');
  const canvasBox = await canvas.boundingBox();
  expect(canvasBox).not.toBeNull();
  await page.mouse.click(canvasBox.x + canvasBox.width * 0.62, canvasBox.y + canvasBox.height * 0.52);

  const popup = page.locator('.weather-map-panel__popup');
  await expect(popup).toBeVisible();
  await expect(popup.getByRole('heading')).toHaveText('模式预报 · 0.75 mm/15min · 雷达图层 LIVE');
  await expect(popup.locator('p').filter({ hasText: '降雨强度：' })).toContainText('3.0 mm/h');
  await expect(popup.locator('p').filter({ hasText: '1小时降雨：' })).toContainText('3.0 mm');
  await expect(popup.locator('p').filter({ hasText: '温度：' })).toContainText('5.0°C');
  await expect(popup.locator('p').filter({ hasText: '湿度：' })).toContainText('40%');
  await expect(popup.locator('p').filter({ hasText: '风速：' })).toContainText('9.0 m/s');

  await page.screenshot({ path: testInfo.outputPath('visual-qa-china-radar-model-picker-review.png'), fullPage: true });
});
