import { test, expect } from '@playwright/test';

test.describe('RainScope dashboard smoke tests', () => {
  test('loads the main dashboard without fatal page errors', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto('/');

    await expect(
      page.getByRole('region', { name: 'RainScope 深圳天气可视化大屏' }),
    ).toBeVisible();

    await expect(page.getByRole('complementary', { name: '图层与站点' })).toBeVisible();
    await expect(page.getByRole('complementary', { name: '实时指标与预警' })).toBeVisible();

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

      await page.waitForTimeout(1200);
      await page.screenshot({
        path: testInfo.outputPath(`visual-qa-${viewport.width}x${viewport.height}.png`),
        fullPage: true,
      });
    }
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
});
