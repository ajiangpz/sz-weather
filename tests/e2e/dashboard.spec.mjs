import { test, expect } from '@playwright/test';

test.describe('RainScope dashboard smoke tests', () => {
  test('loads the main dashboard without fatal page errors', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto('/');

    await expect(
      page.getByRole('region', { name: 'RainScope 深圳天气可视化大屏' }),
    ).toBeVisible();
    await expect(page.getByRole('complementary', { name: '降雨与站点概览' })).toBeVisible();
    await expect(page.getByRole('region', { name: '雷达主视图' })).toBeVisible();
    await expect(page.getByRole('complementary', { name: '预警与重点影响区域' })).toBeVisible();
    await expect(page.getByRole('region', { name: '强降雨风险概览' })).toBeVisible();
    await expect(page.getByRole('region', { name: '深圳降雨雷达地图' })).toBeVisible();

    expect(pageErrors, `Unexpected page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });

  test('keeps the dashboard usable at the documented desktop widths', async ({ page }, testInfo) => {
    for (const viewport of [
      { width: 1920, height: 1080 },
      { width: 1536, height: 1024 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/');

      const dashboard = page.getByRole('region', {
        name: 'RainScope 深圳天气可视化大屏',
      });
      await expect(dashboard).toBeVisible();

      const box = await dashboard.boundingBox();
      expect(box).not.toBeNull();
      expect(box.width).toBeGreaterThan(0);
      expect(box.height).toBeGreaterThan(0);

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
      const cityLayout = await cityLabel.evaluate(element => ({
        rects: element.getClientRects().length,
        whiteSpace: getComputedStyle(element).whiteSpace,
      }));
      expect(cityLayout.rects).toBe(1);
      expect(cityLayout.whiteSpace).toBe('nowrap');

      await expect(page.locator('.weather-dashboard__trend')).toBeVisible();
      await expect(page.locator('.weather-dashboard__timeline')).toBeVisible();

      await page.waitForTimeout(1200);
      await page.screenshot({
        path: testInfo.outputPath(`visual-qa-${viewport.width}x${viewport.height}.png`),
        fullPage: true,
      });
    }
  });

  test('keeps full layer controls available from the map overlay', async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 1024 });
    await page.goto('/');

    const layerButton = page.getByRole('button', { name: '图层' });
    await expect(layerButton).toBeVisible();
    await layerButton.click();

    await expect(page.getByText('图层控制', { exact: true })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: '温度热力' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: '湿度热力' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: '风场流线' })).toBeChecked();

    const radarToggle = page.getByRole('checkbox', { name: '降水图层' });
    const radarOpacity = page.locator('.weather-layer-popover__panel .layer-panel__opacity input[type="range"]').first();
    await expect(radarToggle).toBeChecked();
    await expect(radarOpacity).toBeEnabled();

    await radarToggle.uncheck();
    await expect(radarOpacity).toBeDisabled();
    await radarToggle.check();
    await expect(radarOpacity).toBeEnabled();

    await page.keyboard.press('Escape');
    await expect(page.getByText('图层控制', { exact: true })).toBeHidden();
  });

  test('keeps district labels compact and readable on supported desktop viewports', async ({ page }) => {
    const expectedMaximumFontSize = new Map([
      [1920, 15],
      [1536, 14],
      [1440, 13.5],
    ]);

    for (const viewport of [
      { width: 1920, height: 1080 },
      { width: 1536, height: 1024 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/');

      const labels = page.locator('.weather-map-panel__district-label');
      await expect(labels).toHaveCount(10);

      const styles = await labels.evaluateAll(elements => elements.map(element => {
        const computed = getComputedStyle(element);
        return {
          fontSize: Number.parseFloat(computed.fontSize),
          textShadow: computed.textShadow,
        };
      }));

      for (const style of styles) {
        expect(style.fontSize).toBeLessThanOrEqual(expectedMaximumFontSize.get(viewport.width));
        expect(style.fontSize).toBeGreaterThanOrEqual(13.5);
        expect(style.textShadow).not.toBe('none');
      }
    }
  });

  test('shows the existing point-weather data as a compact map picker', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1536, height: 1024 });
    await page.goto('/');
    await page.waitForTimeout(900);

    const canvas = page.locator('.weather-map-panel__canvas');
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    await page.mouse.click(
      canvasBox.x + canvasBox.width * 0.54,
      canvasBox.y + canvasBox.height * 0.55,
    );

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
      path: testInfo.outputPath('visual-qa-map-picker-1536x1024.png'),
      fullPage: true,
    });

    await popup.getByRole('button', { name: '关闭' }).click();
    await expect(popup).toBeHidden();
  });

  test('shows an animated low-weight wind field by default', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1536, height: 1024 });
    await page.goto('/');
    await page.waitForTimeout(1600);

    const layerButton = page.getByRole('button', { name: '图层' });
    await layerButton.click();
    const windToggle = page.getByRole('checkbox', { name: '风场流线' });
    await expect(windToggle).toBeChecked();
    await page.keyboard.press('Escape');

    const mapShell = page.locator('.weather-dashboard__map-shell');
    const first = await mapShell.screenshot({ path: testInfo.outputPath('visual-qa-wind-frame-a.png') });
    await page.waitForTimeout(520);
    const second = await mapShell.screenshot({ path: testInfo.outputPath('visual-qa-wind-frame-b.png') });

    expect(first.equals(second)).toBe(false);
  });

  test('hydrates a real forecast-shaped timeline through the Open-Meteo boundary', async ({ page }) => {
    const start = new Date('2026-08-12T13:00:00+08:00');
    const times = Array.from({ length: 25 }, (_, index) => {
      const timestamp = new Date(start.getTime() + index * 15 * 60 * 1000);
      const shenzhenTime = new Date(timestamp.getTime() + 8 * 60 * 60 * 1000);
      return shenzhenTime.toISOString().slice(0, 16);
    });
    const currentIndex = 12;
    const payload = {
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
    };

    await page.route('https://api.open-meteo.com/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      });
    });
    await page.route('https://api.rainviewer.com/**', route => route.abort());

    await page.goto('/?weather=live');
    await expect(page.getByText('预报 LIVE', { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: `当前时刻 ${times[currentIndex].slice(11, 16)}` })).toBeVisible();
    await expect(page.getByText('逐15分钟', { exact: true })).toBeVisible();
    await expect(page.getByText('中雨', { exact: true })).toBeVisible();
    await expect(page.getByText('DEMO · mm', { exact: true })).toBeVisible();
    await expect(page.getByText(/DEMO · \d+ 条生效/)).toBeVisible();
    await expect(page.getByText('DEMO dBZ', { exact: true })).toBeVisible();
  });
});
