import { test, expect } from '@playwright/test';

const createTimeline = () => {
  const start = new Date('2026-08-12T13:00:00+08:00');
  return Array.from({ length: 25 }, (_, index) => {
    const timestamp = new Date(start.getTime() + index * 15 * 60 * 1000);
    const shenzhenTime = new Date(timestamp.getTime() + 8 * 60 * 60 * 1000);
    return shenzhenTime.toISOString().slice(0, 16);
  });
};

const createCityPayload = (times) => ({
  timezone: 'Asia/Shanghai',
  current: { time: times[12] },
  minutely_15: {
    time: times,
    temperature_2m: times.map((_, index) => 28 + index * 0.05),
    relative_humidity_2m: times.map((_, index) => 84 - index * 0.2),
    precipitation: times.map((_, index) => index >= 10 && index <= 15 ? 0.5 : 0.1),
    weather_code: times.map((_, index) => index === 12 ? 63 : 61),
    wind_speed_10m: times.map((_, index) => 3.2 + index * 0.04),
    wind_direction_10m: times.map((_, index) => 105 + index),
    surface_pressure: times.map((_, index) => 1004 + index * 0.08),
  },
});

const windGridPoints = () => {
  const longitudes = [113.64, 113.925, 114.21, 114.495, 114.78];
  const latitudes = [22.28, 22.63, 22.98];
  return latitudes.flatMap((latitude) => longitudes.map((longitude) => ({ latitude, longitude })));
};

const createWindGridPayload = (times) => windGridPoints().map((point, pointIndex) => ({
  ...point,
  current: { time: times[12] },
  minutely_15: {
    time: times,
    wind_speed_10m: times.map((_, frameIndex) => 3.6 + (pointIndex % 5) * 0.18 + frameIndex * 0.02),
    wind_direction_10m: times.map((_, frameIndex) => frameIndex <= 12 ? 270 + Math.floor(pointIndex / 5) * 4 : 245 + (frameIndex - 12) * 3),
    precipitation: times.map((_, frameIndex) => {
      const column = pointIndex % 5;
      const row = Math.floor(pointIndex / 5);
      const temporalPulse = Math.max(0, 1 - Math.abs(frameIndex - 15) / 6);
      return Number(Math.max(0, temporalPulse * (0.08 + column * 0.11 + row * 0.06)).toFixed(3));
    }),
    temperature_2m: times.map((_, frameIndex) => Number((27 + (pointIndex % 5) * 0.55 + Math.floor(pointIndex / 5) * 0.2 + frameIndex * 0.04).toFixed(2))),
    relative_humidity_2m: times.map((_, frameIndex) => Number((88 - (pointIndex % 5) * 2.4 - Math.floor(pointIndex / 5) * 3 - frameIndex * 0.12).toFixed(1))),
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
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  });
  await page.route('https://api.rainviewer.com/**', route => route.abort());

  return times;
};

test('drives the existing animated map wind layer from the forecast wind grid', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1536, height: 1024 });
  const times = await installForecastRoutes(page, { includeWind: true });

  await page.goto('/?weather=live');
  await expect(page.getByText('预报 LIVE', { exact: true })).toBeVisible({ timeout: 10_000 });

  const layerButton = page.getByRole('button', { name: '图层' });
  await layerButton.click();
  await expect(page.getByText('预报风场', { exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: '风场流线' })).toBeChecked();
  await page.keyboard.press('Escape');

  await expect(page.locator('.weather-map-panel__time')).toContainText(`${times[12].slice(0, 10)} ${times[12].slice(11, 16)}`);

  const mapShell = page.locator('.weather-dashboard__map-shell');
  const firstFrame = await mapShell.screenshot({ path: testInfo.outputPath('visual-qa-live-wind-frame-a.png') });
  await page.waitForTimeout(520);
  const secondFrame = await mapShell.screenshot({ path: testInfo.outputPath('visual-qa-live-wind-frame-b.png') });
  expect(firstFrame.equals(secondFrame)).toBe(false);

  await page.screenshot({
    path: testInfo.outputPath('visual-qa-live-wind-1536x1024.png'),
    fullPage: true,
  });
});

test('keeps city forecast live when the wind grid falls back', async ({ page }) => {
  await page.setViewportSize({ width: 1536, height: 1024 });
  await installForecastRoutes(page, { includeWind: false });

  await page.goto('/?weather=live');
  await expect(page.getByText('预报 LIVE', { exact: true })).toBeVisible({ timeout: 10_000 });

  const layerButton = page.getByRole('button', { name: '图层' });
  await layerButton.click();
  await expect(page.getByText('DEMO 风场', { exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: '风场流线' })).toBeChecked();
});
