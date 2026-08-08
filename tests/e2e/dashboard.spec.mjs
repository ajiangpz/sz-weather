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

  test('keeps the dashboard usable at the documented desktop widths', async ({ page }) => {
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
    }
  });
});
