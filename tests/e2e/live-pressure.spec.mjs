import { test, expect } from '@playwright/test';

const createTimeline = () => {
  const start = new Date('2026-08-13T05:30:00+08:00');
  return Array.from({ length: 25 }, (_, index) => {
    const timestamp = new Date(start.getTime() + index * 15 * 60 * 1000);
    const shenzhenTime = new Date(timestamp.getTime() + 8 * 60 * 60 * 1000);
    return shenzhenTime.toISOString().slice(0, 16);
  });
};

const createCityPayload = times => ({
  timezone: 'Asia/Shanghai',
  current: { time: times[12] },
  minutely_15: {
    time: times,
    temperature_2m: times.map((_, index) => 29 + index * 0.02),
    relative_humidity_2m: times.map((_, index) => 80 - index * 0.08),
    precipitation: times.map(() => 0.08),
    weather_code: times.map(() => 61),
    wind_speed_10m: times.map(() => 3.6),
    wind_direction_10m: times.map(() => 260),
    surface_pressure: times.map((_, index) => 1004 + index * 0.02),
  },
});

const gridPoints = () => {
  const longitudes = [113.64, 113.925, 114.21, 114.495, 114.78];
  const latitudes = [22.28, 22.63, 22.98];
  return latitudes.flatMap((latitude) => longitudes.map((longitude) => ({ latitude, longitude })));
};

const createGridPayload = times => gridPoints().map((point, pointIndex) => {
  const column = pointIndex % 5;
  const row = Math.floor(pointIndex / 5);
  return {
    ...point,
    current: { time: times[12] },
    minutely_15: {
      time: times,
      wind_speed_10m: times.map(() => 3.8 + column * 0.05),
      wind_direction_10m: times.map(() => 270),
      precipitation: times.map(() => 0.08),
      temperature_2m: times.map(() => 28 + column * 0.4),
      relative_humidity_2m: times.map(() => 82 - column * 2),
      surface_pressure: times.map((_, frameIndex) => Number((1001.4 + column * 0.9 + row * 0.45 + frameIndex * 0.015).toFixed(3))),
    },
  };
});

const installRoutes = async (page, { includeGrid }) => {
  const times = createTimeline();
  const cityPayload = createCityPayload(times);
  const gridPayload = createGridPayload(times);

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

test('renders model pressure isolines as an independent forecast overlay', async ({ page }, testInfo) => {
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
  await expect(pressureToggle).not.toBeChecked();
  await selectPrimaryField(layerPanel, '无底色');
  await windToggle.uncheck();
  await pressureToggle.check();
  await page.keyboard.press('Escape');

  const legend = page.getByRole('region', { name: '地图数据图例' });
  await expect(legend.getByText('模式等压线 · 0.5 hPa', { exact: true })).toBeVisible();
  await expect(legend.getByText('模式降水 LIVE', { exact: true })).toHaveCount(0);
  await page.waitForTimeout(250);

  const mapShell = page.locator('.weather-dashboard__map-shell');
  const pressureOn = await mapShell.screenshot({ path: testInfo.outputPath('visual-qa-pressure-on.png') });

  await layerButton.click();
  await pressureToggle.uncheck();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(160);
  const pressureOff = await mapShell.screenshot({ path: testInfo.outputPath('visual-qa-pressure-off.png') });
  expect(pressureOn.equals(pressureOff)).toBe(false);

  await layerButton.click();
  await pressureToggle.check();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(160);
  await page.screenshot({ path: testInfo.outputPath('visual-qa-pressure-isolines-1536x1024.png'), fullPage: true });
});

test('keeps pressure isolines unavailable when the forecast grid falls back', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await installRoutes(page, { includeGrid: false });

  await page.goto('/?weather=live');
  await expect(page.getByText('预报 LIVE', { exact: true })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: '图层' }).click();
  const layerPanel = page.locator('#weather-layer-popover-panel');
  const pressureToggle = layerPanel.getByRole('checkbox', { name: '气压等值线' });
  await expect(pressureToggle).toBeDisabled();
  const pressureRow = layerPanel.locator('li').filter({ hasText: '气压等值线' });
  await expect(pressureRow).toHaveCount(1);
  await expect(pressureRow.getByText('不可用', { exact: true })).toBeVisible();
});
