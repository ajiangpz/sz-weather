import { test, expect } from '@playwright/test';

const createTimeline = () => {
  const start = new Date('2026-08-12T13:00:00+08:00');
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
    temperature_2m: times.map((_, index) => 28.4 + index * 0.04),
    relative_humidity_2m: times.map((_, index) => 82 - index * 0.15),
    precipitation: times.map((_, index) => index >= 14 && index <= 18 ? 1.2 : 0.05),
    weather_code: times.map((_, index) => index >= 14 && index <= 18 ? 63 : 61),
    wind_speed_10m: times.map((_, index) => 3.5 + index * 0.03),
    wind_direction_10m: times.map((_, index) => 260 + index),
    surface_pressure: times.map((_, index) => 1005 + index * 0.05),
  },
});

const gridPoints = () => {
  const longitudes = [113.64, 113.925, 114.21, 114.495, 114.78];
  const latitudes = [22.28, 22.63, 22.98];
  return latitudes.flatMap((latitude) => longitudes.map((longitude) => ({ latitude, longitude })));
};

const createForecastGridPayload = times => gridPoints().map((point, pointIndex) => {
  const column = pointIndex % 5;
  const row = Math.floor(pointIndex / 5);
  return {
    ...point,
    current: { time: times[12] },
    minutely_15: {
      time: times,
      wind_speed_10m: times.map((_, frameIndex) => 4 + column * 0.12 + frameIndex * 0.01),
      wind_direction_10m: times.map(() => 270 + row * 4),
      precipitation: times.map((_, frameIndex) => {
        if (frameIndex < 14 || frameIndex > 19) return 0.01;
        const temporal = 1 - Math.abs(frameIndex - 16) / 6;
        return Number(Math.max(0.03, temporal * (0.4 + column * 0.6 + row * 0.35)).toFixed(3));
      }),
    },
  };
});

test('renders future model precipitation as a continuous live field when observed radar is unavailable', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1536, height: 1024 });
  const times = createTimeline();
  const cityPayload = createCityPayload(times);
  const gridPayload = createForecastGridPayload(times);

  await page.route('https://api.open-meteo.com/**', async route => {
    const url = new URL(route.request().url());
    const isGridRequest = (url.searchParams.get('latitude') ?? '').includes(',');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(isGridRequest ? gridPayload : cityPayload),
    });
  });
  await page.route('https://api.rainviewer.com/**', route => route.abort());

  await page.goto('/?weather=live');
  await expect(page.getByText('预报 LIVE', { exact: true })).toBeVisible({ timeout: 10_000 });

  const futureIndex = 16;
  await page.getByRole('button', { name: `预报时刻 ${times[futureIndex].slice(11, 16)}` }).click();

  const precipitationLegend = page.getByRole('region', { name: '降水图层图例' });
  await expect(precipitationLegend.getByText('模式降水 LIVE', { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(precipitationLegend.getByText('mm / 15 min', { exact: true })).toBeVisible();

  const layerButton = page.getByRole('button', { name: '图层' });
  const layerPanel = page.locator('#weather-layer-popover-panel');
  await layerButton.click();
  await expect(layerPanel.getByText('模式降水 LIVE', { exact: true })).toBeVisible();
  const precipitationToggle = layerPanel.getByRole('checkbox', { name: '降水图层' });
  const windToggle = layerPanel.getByRole('checkbox', { name: '风场流线' });
  await expect(precipitationToggle).toBeChecked();
  await windToggle.uncheck();
  await page.keyboard.press('Escape');

  await page.waitForTimeout(350);
  const mapShell = page.locator('.weather-dashboard__map-shell');
  const precipitationOn = await mapShell.screenshot({ path: testInfo.outputPath('visual-qa-model-precipitation-on.png') });

  await layerButton.click();
  await precipitationToggle.uncheck();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(180);
  const precipitationOff = await mapShell.screenshot({ path: testInfo.outputPath('visual-qa-model-precipitation-off.png') });
  expect(precipitationOn.equals(precipitationOff)).toBe(false);

  await layerButton.click();
  await precipitationToggle.check();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(180);
  await page.screenshot({
    path: testInfo.outputPath('visual-qa-model-precipitation-1536x1024.png'),
    fullPage: true,
  });

  const mapCanvas = page.locator('.weather-map-panel__canvas');
  const mapBox = await mapCanvas.boundingBox();
  expect(mapBox).not.toBeNull();
  await page.mouse.click(mapBox.x + mapBox.width * 0.58, mapBox.y + mapBox.height * 0.52);
  await expect(page.getByText('点击位置 · DEMO估算', { exact: true })).toBeVisible();
});
