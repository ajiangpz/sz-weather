import { test, expect } from '@playwright/test';

const GRID_COLUMNS = 12;
const GRID_ROWS = 8;
const GRID_BOUNDS = { west: 73.4, east: 135.2, south: 18.0, north: 53.8 };

const createTimeline = () => {
  const start = new Date('2026-08-12T13:00:00+08:00');
  return Array.from({ length: 25 }, (_, index) => {
    const timestamp = new Date(start.getTime() + index * 15 * 60 * 1000);
    const chinaTime = new Date(timestamp.getTime() + 8 * 60 * 60 * 1000);
    return chinaTime.toISOString().slice(0, 16);
  });
};

const createCityPayload = (times) => ({
  timezone: 'Asia/Shanghai',
  current: { time: times[12] },
  minutely_15: {
    time: times,
    temperature_2m: times.map((_, index) => 28 + index * 0.05),
    relative_humidity_2m: times.map((_, index) => 74 - index * 0.2),
    precipitation: times.map((_, index) => index >= 10 && index <= 15 ? 0.5 : 0.1),
    weather_code: times.map((_, index) => index === 12 ? 63 : 61),
    wind_speed_10m: times.map((_, index) => 3.2 + index * 0.04),
    wind_direction_10m: times.map((_, index) => 105 + index),
    surface_pressure: times.map((_, index) => 1004 + index * 0.08),
  },
});

const windGridPoints = () => Array.from({ length: GRID_COLUMNS * GRID_ROWS }, (_, index) => {
  const row = Math.floor(index / GRID_COLUMNS);
  const column = index % GRID_COLUMNS;
  return {
    longitude: GRID_BOUNDS.west + (GRID_BOUNDS.east - GRID_BOUNDS.west) * column / (GRID_COLUMNS - 1),
    latitude: GRID_BOUNDS.south + (GRID_BOUNDS.north - GRID_BOUNDS.south) * row / (GRID_ROWS - 1),
  };
});

const createWindGridPayload = (times) => windGridPoints().map((point, pointIndex) => ({
  ...point,
  current: { time: times[12] },
  minutely_15: {
    time: times,
    wind_speed_10m: times.map((_, frameIndex) => 3.6 + (pointIndex % GRID_COLUMNS) * 0.12 + frameIndex * 0.02),
    wind_direction_10m: times.map((_, frameIndex) => frameIndex <= 12
      ? 270 + Math.floor(pointIndex / GRID_COLUMNS) * 3
      : 245 + (frameIndex - 12) * 3),
    precipitation: times.map((_, frameIndex) => {
      const column = pointIndex % GRID_COLUMNS;
      const row = Math.floor(pointIndex / GRID_COLUMNS);
      const temporalPulse = Math.max(0, 1 - Math.abs(frameIndex - 15) / 6);
      return Number(Math.max(0, temporalPulse * (0.04 + column * 0.025 + row * 0.018)).toFixed(3));
    }),
    temperature_2m: times.map((_, frameIndex) => Number((12 + Math.floor(pointIndex / GRID_COLUMNS) * 2.4 + (pointIndex % GRID_COLUMNS) * 0.55 + frameIndex * 0.04).toFixed(2))),
    relative_humidity_2m: times.map((_, frameIndex) => Number((84 - (pointIndex % GRID_COLUMNS) * 1.2 - Math.floor(pointIndex / GRID_COLUMNS) * 2.2 - frameIndex * 0.1).toFixed(1))),
    surface_pressure: times.map((_, frameIndex) => Number((1001 + (pointIndex % GRID_COLUMNS) * 0.35 + Math.floor(pointIndex / GRID_COLUMNS) * 0.2 + frameIndex * 0.02).toFixed(2))),
  },
}));

const installForecastRoutes = async (page, { includeWind }) => {
  const times = createTimeline();
  const cityPayload = createCityPayload(times);
  const windPayload = createWindGridPayload(times);

  await page.route('https://api.open-meteo.com/**', async route => {
    const url = new URL(route.request().url());
    const isMultiCoordinateWindRequest = (url.searchParams.get('latitude') ?? '').includes(',');
    const payload = isMultiCoordinateWindRequest && includeWind ? windPayload : cityPayload;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
  });
  await page.route('https://api.rainviewer.com/**', route => route.abort());

  return times;
};

test('drives the animated national wind layer from the China forecast grid', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1536, height: 1024 });
  const times = await installForecastRoutes(page, { includeWind: true });

  await page.goto('/?weather=live');
  await expect(page.getByText('预报 LIVE', { exact: true })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: '图层' }).click();
  await expect(page.getByText('全国预报风场', { exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: '风场流线' })).toBeChecked();
  await page.keyboard.press('Escape');

  const windLegend = page.getByRole('region', { name: '地图数据图例' });
  await expect(windLegend.getByText('风速', { exact: true })).toBeVisible();
  await expect(windLegend.getByText('0 · 3 · 6 · 10+ m/s', { exact: true })).toBeVisible();

  await expect(page.locator('.weather-map-panel__time')).toContainText(`${times[12].slice(0, 10)} ${times[12].slice(11, 16)}`);

  const mapShell = page.locator('.weather-dashboard__map-shell');
  const firstFrame = await mapShell.screenshot({ path: testInfo.outputPath('visual-qa-china-live-wind-a.png') });
  await page.waitForTimeout(520);
  const secondFrame = await mapShell.screenshot({ path: testInfo.outputPath('visual-qa-china-live-wind-b.png') });
  expect(firstFrame.equals(secondFrame)).toBe(false);

  await page.screenshot({ path: testInfo.outputPath('visual-qa-china-live-wind-1536x1024.png'), fullPage: true });
});

test('keeps Beijing reference forecast live when the China wind grid falls back', async ({ page }) => {
  await page.setViewportSize({ width: 1536, height: 1024 });
  await installForecastRoutes(page, { includeWind: false });

  await page.goto('/?weather=live');
  await expect(page.getByText('预报 LIVE', { exact: true })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: '图层' }).click();
  await expect(page.getByText('DEMO 全国风场', { exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: '风场流线' })).toBeChecked();
});
