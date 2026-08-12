import { test, expect } from '@playwright/test';

const radarTilePng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAACI0lEQVR4nO2boVIDMRRF7zLMIDGYYjuDqyo/wB+g0TVo+hlUY1ZX8yGg6pipbQ0/gCoq0NlJNi/Je3m72RzZZpLcm5ttNmmASqUyZRrtDlB4+jy9+Mpsl80mpu7BGkAR7SLEjMEZkCK8C8WIC67GOOAUT61vMAZwi6fWOwgDpMRT6lc3QFq8rx1VA3KJ72tPzYDc4l3tqk8BbVQM0Bp9W/uXEg0sXk8riXolYFsJUkUvHnDN1WYq22WzSU7AmEbbRrQBYxduiHoIliIeiDCgJPFAoAGliQcCDChRPEA0oFTxAGEdICH+fC3w0R73fWXvV7M5d/vA/26RyErQh0+0q6yEGb0J4B79n/3xm6OeVCPO9wqzvQxxiQfCEuTDmQCu0ecUbiM0Dd2dYtEESIsHwtJg2yYXMyCHeAPFBNcZgdWA0n73+w5IRBKQc/QNrhT4TofYDdAQb+iaQDkaU1kISRNyOMqaAM3RN4SuEeq2uHYHtGEzYAjxN9w9Hx6pZWsCbB/u1k2buyNa1ARod0AbpwFTmQY1AX1fTiEFNQG+AtQUXM1nN+nd4eHr7fadWpaUgJKnAnkKlGpC0DPAZ8IQpkFI/IGIh2BpSYj6FegzQTMFoaMPMPxJyrWDnPv1OEY8wLAO2K2bdszTQuTChElFrhTEjj6Q4cZIyO5MDCnigYxXZriNSBVuyPYuwNVh7rpULk3FpoFTuEH91pjPDAnRlUrlj18lmt7Eu8vuXwAAAABJRU5ErkJggg==',
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

const createRainViewerPayload = (currentTimestamp) => {
  const currentEpoch = Math.floor(Date.parse(`${currentTimestamp}:00+08:00`) / 1000);
  return {
    version: '2.0',
    generated: currentEpoch + 60,
    host: 'https://tilecache.rainviewer.test',
    radar: {
      past: Array.from({ length: 13 }, (_, index) => ({
        time: currentEpoch - (12 - index) * 10 * 60,
        path: `/v2/radar/test-${index}`,
      })),
      nowcast: [],
    },
  };
};

test('uses RainViewer only inside the observed radar window and falls back outside it without a model grid', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1536, height: 1024 });
  const fixture = createForecastFixture();
  let radarTileRequests = 0;

  await page.route('https://api.open-meteo.com/**', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture.payload) });
  });
  await page.route('https://api.rainviewer.com/**', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(createRainViewerPayload(fixture.times[fixture.currentIndex])) });
  });
  await page.route('https://tilecache.rainviewer.test/**', async route => {
    radarTileRequests += 1;
    await route.fulfill({ status: 200, contentType: 'image/png', body: radarTilePng });
  });

  await page.goto('/?weather=live');
  await expect(page.getByText('预报 LIVE', { exact: true })).toBeVisible({ timeout: 10_000 });
  const radarLegend = page.getByRole('region', { name: '地图数据图例' });
  await expect(radarLegend.getByText('雷达 LIVE', { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(radarLegend.getByRole('link', { name: 'RainViewer' })).toBeVisible();

  const layerButton = page.getByRole('button', { name: '图层' });
  const layerPanel = page.locator('#weather-layer-popover-panel');
  await layerButton.click();
  await expect(layerPanel.getByText('雷达 LIVE', { exact: true })).toBeVisible();
  const radarToggle = layerPanel.getByRole('checkbox', { name: '降水图层' });
  const windToggle = layerPanel.getByRole('checkbox', { name: '风场流线' });
  await expect(radarToggle).toBeChecked();
  await expect(windToggle).toBeChecked();
  await windToggle.uncheck();
  await page.keyboard.press('Escape');

  await expect.poll(() => radarTileRequests).toBeGreaterThan(0);
  await page.waitForTimeout(350);
  const mapShell = page.locator('.weather-dashboard__map-shell');
  const radarOnFrame = await mapShell.screenshot({ path: testInfo.outputPath('visual-qa-live-radar-map-on.png') });

  await layerButton.click();
  await radarToggle.uncheck();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(180);
  const radarOffFrame = await mapShell.screenshot({ path: testInfo.outputPath('visual-qa-live-radar-map-off.png') });
  expect(radarOnFrame.equals(radarOffFrame)).toBe(false);

  await layerButton.click();
  await radarToggle.check();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(180);
  await page.screenshot({ path: testInfo.outputPath('visual-qa-live-radar-1536x1024.png'), fullPage: true });

  const mapCanvas = page.locator('.weather-map-panel__canvas');
  const mapBox = await mapCanvas.boundingBox();
  expect(mapBox).not.toBeNull();
  await page.mouse.click(mapBox.x + mapBox.width * 0.55, mapBox.y + mapBox.height * 0.55);
  await expect(page.getByText('点击位置 · DEMO估算', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '关闭' }).click();

  const futureIndex = 16;
  await page.getByRole('button', { name: `预报时刻 ${fixture.times[futureIndex].slice(11, 16)}` }).click();
  await expect(radarLegend.getByText('DEMO dBZ', { exact: true })).toBeVisible();
  await layerButton.click();
  await expect(layerPanel.getByText('DEMO 雷达', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');

  await page.screenshot({ path: testInfo.outputPath('visual-qa-radar-fallback-1536x1024.png'), fullPage: true });
});
