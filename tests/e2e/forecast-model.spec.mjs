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

const windGridPoints = () => Array.from({ length: GRID_COLUMNS * GRID_ROWS }, (_, index) => {
  const row = Math.floor(index / GRID_COLUMNS);
  const column = index % GRID_COLUMNS;
  return {
    longitude: GRID_BOUNDS.west + (GRID_BOUNDS.east - GRID_BOUNDS.west) * column / (GRID_COLUMNS - 1),
    latitude: GRID_BOUNDS.south + (GRID_BOUNDS.north - GRID_BOUNDS.south) * row / (GRID_ROWS - 1),
  };
});

const createCityPayload = (times, offset = 0) => ({
  timezone: 'Asia/Shanghai',
  current: { time: times[12] },
  minutely_15: {
    time: times,
    temperature_2m: times.map((_, index) => 28 + offset + index * 0.05),
    relative_humidity_2m: times.map((_, index) => 74 - index * 0.2),
    precipitation: times.map((_, index) => index >= 10 && index <= 15 ? 0.5 + offset * 0.1 : 0.1),
    weather_code: times.map((_, index) => index === 12 ? 63 : 61),
    wind_speed_10m: times.map((_, index) => 3.2 + offset * 0.2 + index * 0.04),
    wind_direction_10m: times.map((_, index) => 105 + index),
    surface_pressure: times.map((_, index) => 1004 + index * 0.08),
  },
});

const createGridPayload = (times, offset = 0) => windGridPoints().map((point, pointIndex) => ({
  ...point,
  current: { time: times[12] },
  minutely_15: {
    time: times,
    wind_speed_10m: times.map((_, frameIndex) => 3.6 + offset + (pointIndex % GRID_COLUMNS) * 0.11 + frameIndex * 0.02),
    wind_direction_10m: times.map((_, frameIndex) => 250 + Math.floor(pointIndex / GRID_COLUMNS) * 4 + frameIndex * 0.2),
    precipitation: times.map((_, frameIndex) => Math.max(0, 0.06 + offset * 0.05 + (pointIndex % 6) * 0.03 + (frameIndex - 8) * 0.02)),
    temperature_2m: times.map((_, frameIndex) => 14 + offset + Math.floor(pointIndex / GRID_COLUMNS) * 2 + (pointIndex % GRID_COLUMNS) * 0.5 + frameIndex * 0.03),
    relative_humidity_2m: times.map((_, frameIndex) => 84 - Math.floor(pointIndex / GRID_COLUMNS) * 2 - frameIndex * 0.1),
    surface_pressure: times.map((_, frameIndex) => 1001 + (pointIndex % GRID_COLUMNS) * 0.35 + frameIndex * 0.02),
  },
}));

test('switches China reference forecast and national forecast grid to GFS together', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1536, height: 1024 });
  const times = createTimeline();
  const requests = [];

  await page.route('https://api.open-meteo.com/**', async route => {
    const url = new URL(route.request().url());
    const multiCoordinate = (url.searchParams.get('latitude') ?? '').includes(',');
    requests.push({ path: url.pathname, multiCoordinate });
    const isGfs = url.pathname === '/v1/gfs';
    const payload = multiCoordinate
      ? createGridPayload(times, isGfs ? 1 : 0)
      : createCityPayload(times, isGfs ? 1 : 0);
    if (isGfs) await new Promise(resolve => setTimeout(resolve, 300));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
  });
  await page.route('https://api.rainviewer.com/**', route => route.abort());

  await page.goto('/?weather=live');
  await expect(page.getByText('预报 LIVE', { exact: true })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: '图层' }).click();
  const panel = page.locator('#weather-layer-popover-panel');
  const modelSelect = panel.getByRole('combobox', { name: '预报模式' });
  await expect(modelSelect).toHaveValue('best_match');

  await modelSelect.selectOption('gfs');
  await expect(modelSelect).toBeEnabled({ timeout: 10_000 });
  await expect(modelSelect).toHaveValue('gfs');
  await expect(panel.getByText('NOAA 全球预报；全国 15 分钟展示帧由小时数据插值', { exact: true })).toBeVisible();

  await expect.poll(() => requests.filter(request => request.path === '/v1/gfs' && !request.multiCoordinate).length).toBeGreaterThan(0);
  await expect.poll(() => requests.filter(request => request.path === '/v1/gfs' && request.multiCoordinate).length).toBeGreaterThan(0);
  expect(requests.some(request => request.path === '/v1/forecast' && !request.multiCoordinate)).toBe(true);
  expect(requests.some(request => request.path === '/v1/forecast' && request.multiCoordinate)).toBe(true);

  await expect(panel.getByText('全国预报风场', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('visual-qa-gfs-china-1536x1024.png'), fullPage: true });
});
