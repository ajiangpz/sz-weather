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

const createGridPoints = () => Array.from({ length: GRID_COLUMNS * GRID_ROWS }, (_, index) => {
  const row = Math.floor(index / GRID_COLUMNS);
  const column = index % GRID_COLUMNS;
  return {
    longitude: GRID_BOUNDS.west + (GRID_BOUNDS.east - GRID_BOUNDS.west) * column / (GRID_COLUMNS - 1),
    latitude: GRID_BOUNDS.south + (GRID_BOUNDS.north - GRID_BOUNDS.south) * row / (GRID_ROWS - 1),
  };
});

const createCityPayload = (times) => ({
  timezone: 'Asia/Shanghai',
  current: { time: times[12] },
  minutely_15: {
    time: times,
    temperature_2m: times.map((_, index) => 28 + index * 0.05),
    relative_humidity_2m: times.map((_, index) => 74 - index * 0.15),
    precipitation: times.map((_, index) => index >= 10 && index <= 15 ? 0.5 : 0.1),
    weather_code: times.map((_, index) => index === 12 ? 63 : 61),
    wind_speed_10m: times.map((_, index) => 3.2 + index * 0.04),
    wind_direction_10m: times.map((_, index) => 105 + index),
    surface_pressure: times.map((_, index) => 1004 + index * 0.08),
  },
});

const createGridPayload = (times) => createGridPoints().map((point, pointIndex) => ({
  ...point,
  current: { time: times[12] },
  minutely_15: {
    time: times,
    wind_speed_10m: times.map((_, frameIndex) => 3.1 + (pointIndex % GRID_COLUMNS) * 0.12 + frameIndex * 0.02),
    wind_direction_10m: times.map((_, frameIndex) => 245 + Math.floor(pointIndex / GRID_COLUMNS) * 3 + frameIndex * 0.2),
    precipitation: times.map((_, frameIndex) => Math.max(0, (pointIndex % 7) * 0.04 + (frameIndex - 10) * 0.015)),
    temperature_2m: times.map((_, frameIndex) => 13 + Math.floor(pointIndex / GRID_COLUMNS) * 2.4 + (pointIndex % GRID_COLUMNS) * 0.55 + frameIndex * 0.03),
    relative_humidity_2m: times.map((_, frameIndex) => 82 - Math.floor(pointIndex / GRID_COLUMNS) * 2.8 - frameIndex * 0.08),
    surface_pressure: times.map((_, frameIndex) => 1000 + (pointIndex % GRID_COLUMNS) * 0.45 + frameIndex * 0.02),
  },
}));

test.describe('RainScope China dashboard smoke tests', () => {
  test('loads the China dashboard without fatal page errors', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto('/');

    await expect(page.getByRole('region', { name: 'RainScope 中国天气可视化大屏' })).toBeVisible();
    await expect(page.getByRole('complementary', { name: '全国天气与重点城市概览' })).toBeVisible();
    await expect(page.getByRole('region', { name: '全国天气主视图' })).toBeVisible();
    await expect(page.getByRole('complementary', { name: '全国预警与重点影响区域' })).toBeVisible();
    await expect(page.getByRole('region', { name: '全国气象风险概览' })).toBeVisible();
    await expect(page.getByRole('region', { name: '中国天气地图' })).toBeVisible();
    await expect(page.getByText('中国', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('趋势 · 北京参考点', { exact: true })).toBeVisible();

    expect(pageErrors, `Unexpected page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });

  test('keeps the national dashboard usable at the documented desktop widths', async ({ page }, testInfo) => {
    for (const viewport of [
      { width: 1920, height: 1080 },
      { width: 1536, height: 1024 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/');

      const dashboard = page.getByRole('region', { name: 'RainScope 中国天气可视化大屏' });
      await expect(dashboard).toBeVisible();

      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);

      const [leftBox, centerBox, rightBox] = await Promise.all([
        page.locator('.weather-dashboard__left').boundingBox(),
        page.locator('.weather-dashboard__center').boundingBox(),
        page.locator('.weather-dashboard__right').boundingBox(),
      ]);
      expect(leftBox).not.toBeNull();
      expect(centerBox).not.toBeNull();
      expect(rightBox).not.toBeNull();
      expect(centerBox.width).toBeGreaterThan(leftBox.width);
      expect(centerBox.width).toBeGreaterThan(rightBox.width);

      const cityLabel = page.locator('.weather-header__city > span').first();
      expect(await cityLabel.textContent()).toBe('中国');
      expect((await cityLabel.getAttribute('style')) ?? '').not.toContain('display: none');

      await page.waitForTimeout(900);
      await page.screenshot({
        path: testInfo.outputPath(`visual-qa-china-${viewport.width}x${viewport.height}.png`),
        fullPage: true,
      });
    }
  });

  test('spreads major-city labels across the China map instead of clustering them', async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 1024 });
    await page.goto('/');

    const labels = page.locator('.weather-map-panel__district-label');
    await expect(labels).toHaveCount(10);
    await expect(labels.filter({ hasText: '北京' })).toHaveCount(1);
    await expect(labels.filter({ hasText: '深圳' })).toHaveCount(1);
    await expect(labels.filter({ hasText: '乌鲁木齐' })).toHaveCount(1);
    await expect(labels.filter({ hasText: '哈尔滨' })).toHaveCount(1);

    const mapBox = await page.locator('.weather-map-panel__canvas').boundingBox();
    expect(mapBox).not.toBeNull();
    const boxes = (await labels.all()).map(async label => label.boundingBox());
    const resolved = (await Promise.all(boxes)).filter(Boolean);
    const xs = resolved.map(box => box.x + box.width / 2);
    const ys = resolved.map(box => box.y + box.height / 2);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(mapBox.width * 0.5);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(mapBox.height * 0.35);
  });

  test('keeps primary weather fields single-select and overlays independently available', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1536, height: 1024 });
    await page.goto('/');

    await page.getByRole('button', { name: '图层' }).click();
    const layerPanel = page.locator('#weather-layer-popover-panel');
    await expect(layerPanel.getByText('图层控制', { exact: true })).toBeVisible();

    const precipitationField = layerPanel.getByRole('radio', { name: '降水' });
    const noneField = layerPanel.getByRole('radio', { name: '无底色' });
    const windToggle = layerPanel.getByRole('checkbox', { name: '风场流线' });
    const alertToggle = layerPanel.getByRole('checkbox', { name: '预警区域' });
    const cityToggle = layerPanel.getByRole('checkbox', { name: '重点城市' });

    await expect(precipitationField).toBeChecked();
    await expect(noneField).toBeEnabled();
    await expect(windToggle).toBeChecked();
    await expect(alertToggle).toBeChecked();
    await expect(cityToggle).toBeChecked();

    await layerPanel.locator('.layer-panel__primary-option').filter({ hasText: '无底色' }).click();
    await expect(noneField).toBeChecked();
    await expect(precipitationField).not.toBeChecked();
    await layerPanel.locator('.layer-panel__primary-option').filter({ hasText: '降水' }).click();
    await expect(precipitationField).toBeChecked();

    await page.screenshot({
      path: testInfo.outputPath('visual-qa-china-primary-field-1536x1024.png'),
      fullPage: true,
    });
  });

  test('shows point weather as a compact map picker inside the national map', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1536, height: 1024 });
    await page.goto('/');
    await page.waitForTimeout(700);

    const canvas = page.locator('.weather-map-panel__canvas');
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    await page.mouse.click(canvasBox.x + canvasBox.width * 0.57, canvasBox.y + canvasBox.height * 0.52);

    const popup = page.locator('.weather-map-panel__popup');
    await expect(popup).toBeVisible();
    await expect(popup.getByText('降雨强度：', { exact: true })).toBeVisible();
    await expect(popup.getByText('温度：', { exact: true })).toBeVisible();
    await expect(popup.getByText('风速：', { exact: true })).toBeVisible();

    const [popupBox, mapShellBox] = await Promise.all([
      popup.boundingBox(),
      page.locator('.weather-dashboard__map-shell').boundingBox(),
    ]);
    expect(popupBox).not.toBeNull();
    expect(mapShellBox).not.toBeNull();
    expect(popupBox.x).toBeGreaterThanOrEqual(mapShellBox.x);
    expect(popupBox.y).toBeGreaterThanOrEqual(mapShellBox.y);
    expect(popupBox.x + popupBox.width).toBeLessThanOrEqual(mapShellBox.x + mapShellBox.width + 1);
    expect(popupBox.y + popupBox.height).toBeLessThanOrEqual(mapShellBox.y + mapShellBox.height + 1);

    await page.screenshot({
      path: testInfo.outputPath('visual-qa-china-picker-1536x1024.png'),
      fullPage: true,
    });
  });

  test('shows an animated low-weight national wind field by default', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1536, height: 1024 });
    await page.goto('/');
    await page.waitForTimeout(1300);

    await page.getByRole('button', { name: '图层' }).click();
    await expect(page.getByRole('checkbox', { name: '风场流线' })).toBeChecked();
    await page.keyboard.press('Escape');

    const mapShell = page.locator('.weather-dashboard__map-shell');
    const first = await mapShell.screenshot({ path: testInfo.outputPath('visual-qa-china-wind-a.png') });
    await page.waitForTimeout(520);
    const second = await mapShell.screenshot({ path: testInfo.outputPath('visual-qa-china-wind-b.png') });
    expect(first.equals(second)).toBe(false);
  });

  test('hydrates the Beijing reference timeline and China forecast grid together', async ({ page }) => {
    const times = createTimeline();

    await page.route('https://api.open-meteo.com/**', async route => {
      const url = new URL(route.request().url());
      const multiCoordinate = (url.searchParams.get('latitude') ?? '').includes(',');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(multiCoordinate ? createGridPayload(times) : createCityPayload(times)),
      });
    });
    await page.route('https://api.rainviewer.com/**', route => route.abort());

    await page.goto('/?weather=live');
    await expect(page.getByText('预报 LIVE', { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('北京 · 中雨', { exact: true })).toBeVisible();
    await expect(page.getByText('趋势 · 北京参考点', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: `当前时刻 ${times[12].slice(11, 16)}` })).toBeVisible();
    await expect(page.getByText('逐15分钟', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: '图层' }).click();
    const layerPanel = page.locator('#weather-layer-popover-panel');
    await expect(layerPanel.getByText('全国预报风场', { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
  });
});
