import { test, expect } from '@playwright/test';

const visibleRadarTilePng = Buffer.from(
  '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',
  'base64',
);

const createForecastFixture = () => {
  const start = new Date('2026-08-12T13:00:00+08:00');
  const times = Array.from({ length: 25 }, (_, index) => {
    const timestamp = new Date(start.getTime() + index * 15 * 60 * 1000);
    const shenzhenTime = new Date(timestamp.getTime() + 8 * 60 * 60 * 1000);
    return shenzhenTime.toISOString().slice(0, 16);
  });
  const currentIndex = 12;
  return {
    currentIndex,
    times,
    payload: {
      timezone: 'Asia/Shanghai',
      current: { time: times[currentIndex] },
      minutely_15: {
        time: times,
        temperature_2m: times.map((_, index) => 28 + index * 0.05),
        relative_humidity_2m: times.map((_, index) => 84 - index * 0.2),
        precipitation: times.map((_, index) => index >= 10 && index <= 15 ? 0.5 : 0.1),
        weather_code: times.map((_, index) => index === currentIndex ? 63 : 61),
        wind_speed_10m: times.map((_, index) => 3.2 + index * 0.04),
        wind_direction_10m: times.map((_, index) => 105 + index),
        surface_pressure: times.map((_, index) => 1004 + index * 0.08),
      },
    },
  };
};

const createRainViewerPayload = currentTimestamp => {
  const currentEpoch = Math.floor(Date.parse(`${currentTimestamp}:00+08:00`) / 1000);
  return {
    version: '2.0',
    generated: currentEpoch + 60,
    host: 'https://tilecache.rainviewer.test',
    radar: {
      past: Array.from({ length: 13 }, (_, index) => ({
        time: currentEpoch - (12 - index) * 10 * 60,
        path: `/v2/radar/visible-${index}`,
      })),
      nowcast: [],
    },
  };
};

test('renders a visibly distinguishable RainViewer raster contribution', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1536, height: 1024 });
  const fixture = createForecastFixture();
  let radarTileRequests = 0;

  await page.route('https://api.open-meteo.com/**', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture.payload) });
  });
  await page.route('https://api.rainviewer.com/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(createRainViewerPayload(fixture.times[fixture.currentIndex])),
    });
  });
  await page.route('https://tilecache.rainviewer.test/**', async route => {
    radarTileRequests += 1;
    await route.fulfill({ status: 200, contentType: 'image/png', body: visibleRadarTilePng });
  });

  await page.goto('/?weather=live');
  const radarLegend = page.getByRole('region', { name: '雷达强度图例' });
  await expect(radarLegend.getByText('雷达 LIVE', { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect.poll(() => radarTileRequests).toBeGreaterThan(0);

  const layerButton = page.getByRole('button', { name: '图层' });
  const layerPanel = page.locator('#weather-layer-popover-panel');
  await layerButton.click();
  const radarToggle = layerPanel.getByRole('checkbox', { name: '降雨雷达' });
  const windToggle = layerPanel.getByRole('checkbox', { name: '风场流线' });
  await windToggle.uncheck();
  await page.keyboard.press('Escape');

  await page.waitForTimeout(600);
  const mapShell = page.locator('.weather-dashboard__map-shell');
  const radarOnFrame = await mapShell.screenshot({ path: testInfo.outputPath('visual-qa-live-radar-visible-on.png') });

  await layerButton.click();
  await radarToggle.uncheck();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
  const radarOffFrame = await mapShell.screenshot({ path: testInfo.outputPath('visual-qa-live-radar-visible-off.png') });

  expect(radarOnFrame.equals(radarOffFrame)).toBe(false);
});
