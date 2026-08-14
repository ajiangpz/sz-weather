import { test, expect } from '@playwright/test';

const createForecastPayload = () => {
  const start = new Date('2026-08-12T13:00:00+08:00');
  const times = Array.from({ length: 25 }, (_, index) => {
    const timestamp = new Date(start.getTime() + index * 15 * 60 * 1000);
    const chinaTime = new Date(timestamp.getTime() + 8 * 60 * 60 * 1000);
    return chinaTime.toISOString().slice(0, 16);
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
        relative_humidity_2m: times.map((_, index) => 74 - index * 0.2),
        precipitation: times.map((_, index) => index >= 10 && index <= 15 ? 0.5 : 0.1),
        weather_code: times.map((_, index) => index === currentIndex ? 63 : 61),
        wind_speed_10m: times.map((_, index) => 3.2 + index * 0.04),
        wind_direction_10m: times.map((_, index) => 105 + index),
        surface_pressure: times.map((_, index) => 1004 + index * 0.08),
      },
    },
  };
};

test('keeps the Beijing reference forecast visually inside the China dashboard shell', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1536, height: 1024 });
  const fixture = createForecastPayload();

  await page.route('https://api.open-meteo.com/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fixture.payload),
    });
  });
  await page.route('https://api.rainviewer.com/**', route => route.abort());

  await page.goto('/?weather=live');
  await expect(page.getByText('预报 LIVE', { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.weather-map-panel__time')).toContainText(fixture.times[fixture.currentIndex].slice(0, 10));
  await expect(page.locator('.weather-map-panel__time')).toContainText(fixture.times[fixture.currentIndex].slice(11, 16));
  await expect(page.getByText('北京', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('DEMO dBZ', { exact: true })).toBeVisible();
  await expect(page.locator('.weather-dashboard__left')).toHaveCount(0);
  await expect(page.locator('.weather-dashboard__right')).toHaveCount(0);
  await expect(page.locator('.weather-dashboard__timeline')).toHaveCount(0);

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);

  await page.screenshot({
    path: testInfo.outputPath('visual-qa-china-live-forecast-1536x1024.png'),
    fullPage: true,
  });
});
