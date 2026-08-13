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
    temperature_2m: times.map((_, index) => 28.5 + index * 0.03),
    relative_humidity_2m: times.map((_, index) => 82 - index * 0.1),
    precipitation: times.map(() => 0.15),
    weather_code: times.map(() => 61),
    wind_speed_10m: times.map((_, index) => 3.4 + index * 0.02),
    wind_direction_10m: times.map(() => 270),
    surface_pressure: times.map(() => 1005),
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
      wind_speed_10m: times.map(() => 4 + column * 0.12),
      wind_direction_10m: times.map(() => 270 + row * 3),
      precipitation: times.map(() => 0.08),
      temperature_2m: times.map((_, frameIndex) => Number((23.5 + column * 2.4 + row * 0.8 + frameIndex * 0.04).toFixed(2))),
      relative_humidity_2m: times.map((_, frameIndex) => Number((96 - column * 9 - row * 6 - frameIndex * 0.05).toFixed(1))),
      surface_pressure: times.map((_, frameIndex) => Number((1002.2 + column * 0.7 + row * 0.35 + frameIndex * 0.02).toFixed(2))),
    },
  };
});

test('renders mutually exclusive live temperature and humidity forecast fields', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1536, height: 1024 });
  const times = createTimeline();
  const cityPayload = createCityPayload(times);
  const gridPayload = createGridPayload(times);

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

  const layerButton = page.getByRole('button', { name: '图层' });
  const layerPanel = page.locator('#weather-layer-popover-panel');
  await layerButton.click();

  const precipitationToggle = layerPanel.getByRole('checkbox', { name: '降水图层' });
  const windToggle = layerPanel.getByRole('checkbox', { name: '风场流线' });
  const temperatureToggle = layerPanel.getByRole('checkbox', { name: '温度热力' });
  const humidityToggle = layerPanel.getByRole('checkbox', { name: '湿度热力' });

  await expect(temperatureToggle).toBeEnabled();
  await expect(humidityToggle).toBeEnabled();
  await expect(layerPanel.getByText('预报场', { exact: true })).toHaveCount(2);
  await precipitationToggle.uncheck();
  await windToggle.uncheck();
  await temperatureToggle.check();
  await expect(humidityToggle).not.toBeChecked();
  await page.keyboard.press('Escape');

  const legend = page.getByRole('region', { name: '地图数据图例' });
  await expect(legend.getByText('温度预报场', { exact: true })).toBeVisible();
  await expect(legend.getByText('°C', { exact: true })).toBeVisible();
  await page.waitForTimeout(250);

  const mapShell = page.locator('.weather-dashboard__map-shell');
  const temperatureFrame = await mapShell.screenshot({ path: testInfo.outputPath('visual-qa-temperature-field.png') });

  await layerButton.click();
  await humidityToggle.check();
  await expect(temperatureToggle).not.toBeChecked();
  await page.keyboard.press('Escape');
  await expect(legend.getByText('湿度预报场', { exact: true })).toBeVisible();
  await expect(legend.getByText('%', { exact: true })).toBeVisible();
  await page.waitForTimeout(250);

  const humidityFrame = await mapShell.screenshot({ path: testInfo.outputPath('visual-qa-humidity-field.png') });
  expect(temperatureFrame.equals(humidityFrame)).toBe(false);

  await page.screenshot({
    path: testInfo.outputPath('visual-qa-scalar-fields-1536x1024.png'),
    fullPage: true,
  });
});
