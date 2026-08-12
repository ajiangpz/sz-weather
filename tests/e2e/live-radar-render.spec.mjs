import { test, expect } from '@playwright/test';

const visibleRadarTileGif = Buffer.from(
  'R0lGODdhAgACAIEAAP8AAAAAAAAAAAAAACwAAAAAAgACAAAIBgABCAQQEAA7',
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
    await route.fulfill({ status: 200, contentType: 'image/gif', body: visibleRadarTileGif });
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
